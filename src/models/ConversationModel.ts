import { db } from "../database/connection";
import { orderedPair } from "./FriendshipModel";
import type { UserRow } from "../types/user";
import type { MessageRow } from "./MessageModel";

export type ConversationRow = {
  id: string;
  user_a: string;
  user_b: string;
  user_a_last_read_at: Date | null;
  user_b_last_read_at: Date | null;
  last_message_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type ConversationInboxRow = ConversationRow & {
  peer: UserRow;
  lastMessage: MessageRow | null;
  unreadCount: number;
};

type InboxQueryRow = ConversationRow & {
  peer_id: string;
  peer_email: string;
  peer_password_hash: string;
  peer_display_name: string;
  peer_username: string | null;
  peer_bio: string | null;
  peer_avatar_url: string | null;
  peer_cover_url: string | null;
  peer_feed_seen_at: Date | null;
  peer_created_at: Date;
  peer_updated_at: Date;
  lm_id: string | null;
  lm_conversation_id: string | null;
  lm_sender_id: string | null;
  lm_body: string | null;
  lm_image_url: string | null;
  lm_unsent_at: Date | null;
  lm_edited_at: Date | null;
  lm_created_at: Date | null;
  unread_count: string | number;
};

export class ConversationModel {
  static async findById(id: string): Promise<ConversationRow | undefined> {
    return db<ConversationRow>("conversations").where({ id }).first();
  }

  static async findPair(userId: string, otherId: string): Promise<ConversationRow | undefined> {
    const { userA, userB } = orderedPair(userId, otherId);
    return db<ConversationRow>("conversations").where({ user_a: userA, user_b: userB }).first();
  }

  static async createPair(userId: string, otherId: string): Promise<ConversationRow> {
    const { userA, userB } = orderedPair(userId, otherId);
    const [row] = await db<ConversationRow>("conversations")
      .insert({ user_a: userA, user_b: userB })
      .returning("*");
    return row;
  }

  static async listForUser(userId: string): Promise<ConversationRow[]> {
    return db<ConversationRow>("conversations")
      .where((q) => q.where({ user_a: userId }).orWhere({ user_b: userId }))
      .orderByRaw("last_message_at desc nulls last")
      .orderBy("created_at", "desc");
  }

  /** Inbox rows with peer, latest message, and unread count in one SQL round-trip. */
  static async listInboxForUser(userId: string): Promise<ConversationInboxRow[]> {
    const rows = await db.raw<{ rows: InboxQueryRow[] }>(
      `
      SELECT
        c.*,
        peer.id AS peer_id,
        peer.email AS peer_email,
        peer.password_hash AS peer_password_hash,
        peer.display_name AS peer_display_name,
        peer.username AS peer_username,
        peer.bio AS peer_bio,
        peer.avatar_url AS peer_avatar_url,
        peer.cover_url AS peer_cover_url,
        peer.feed_seen_at AS peer_feed_seen_at,
        peer.created_at AS peer_created_at,
        peer.updated_at AS peer_updated_at,
        lm.id AS lm_id,
        lm.conversation_id AS lm_conversation_id,
        lm.sender_id AS lm_sender_id,
        lm.body AS lm_body,
        lm.image_url AS lm_image_url,
        lm.unsent_at AS lm_unsent_at,
        lm.edited_at AS lm_edited_at,
        lm.created_at AS lm_created_at,
        (
          SELECT COUNT(*)::int
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.sender_id <> ?
            AND m.unsent_at IS NULL
            AND (
              CASE WHEN c.user_a = ? THEN c.user_a_last_read_at ELSE c.user_b_last_read_at END IS NULL
              OR m.created_at > CASE WHEN c.user_a = ? THEN c.user_a_last_read_at ELSE c.user_b_last_read_at END
            )
        ) AS unread_count
      FROM conversations c
      INNER JOIN users peer
        ON peer.id = CASE WHEN c.user_a = ? THEN c.user_b ELSE c.user_a END
      LEFT JOIN LATERAL (
        SELECT m.*
        FROM messages m
        WHERE m.conversation_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
      ) lm ON TRUE
      WHERE c.user_a = ? OR c.user_b = ?
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
      `,
      [userId, userId, userId, userId, userId, userId]
    );

    return rows.rows.map((r) => ({
      id: r.id,
      user_a: r.user_a,
      user_b: r.user_b,
      user_a_last_read_at: r.user_a_last_read_at,
      user_b_last_read_at: r.user_b_last_read_at,
      last_message_at: r.last_message_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      peer: {
        id: r.peer_id,
        email: r.peer_email,
        password_hash: r.peer_password_hash,
        display_name: r.peer_display_name,
        username: r.peer_username,
        bio: r.peer_bio,
        avatar_url: r.peer_avatar_url,
        cover_url: r.peer_cover_url,
        feed_seen_at: r.peer_feed_seen_at,
        created_at: r.peer_created_at,
        updated_at: r.peer_updated_at,
      },
      lastMessage: r.lm_id
        ? {
            id: r.lm_id,
            conversation_id: r.lm_conversation_id!,
            sender_id: r.lm_sender_id!,
            body: r.lm_body,
            image_url: r.lm_image_url,
            unsent_at: r.lm_unsent_at,
            edited_at: r.lm_edited_at,
            created_at: r.lm_created_at!,
          }
        : null,
      unreadCount: Number(r.unread_count ?? 0),
    }));
  }

  /** Count of conversations with at least one unread inbound message. */
  static async countUnreadConversations(userId: string): Promise<number> {
    const result = await db.raw<{ rows: Array<{ count: string }> }>(
      `
      SELECT COUNT(*)::int AS count
      FROM conversations c
      WHERE (c.user_a = ? OR c.user_b = ?)
        AND EXISTS (
          SELECT 1
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.sender_id <> ?
            AND m.unsent_at IS NULL
            AND (
              CASE WHEN c.user_a = ? THEN c.user_a_last_read_at ELSE c.user_b_last_read_at END IS NULL
              OR m.created_at > CASE WHEN c.user_a = ? THEN c.user_a_last_read_at ELSE c.user_b_last_read_at END
            )
        )
      `,
      [userId, userId, userId, userId, userId]
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  static async touchLastMessage(id: string, at: Date): Promise<void> {
    await db("conversations").where({ id }).update({
      last_message_at: at,
      updated_at: db.fn.now(),
    });
  }

  static async markRead(id: string, userId: string, at: Date): Promise<ConversationRow | undefined> {
    const row = await this.findById(id);
    if (!row) return undefined;
    const patch =
      row.user_a === userId
        ? { user_a_last_read_at: at }
        : row.user_b === userId
          ? { user_b_last_read_at: at }
          : null;
    if (!patch) return undefined;
    const [updated] = await db<ConversationRow>("conversations")
      .where({ id })
      .update({ ...patch, updated_at: db.fn.now() })
      .returning("*");
    return updated;
  }
}
