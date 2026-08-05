import type { Knex } from "knex";
import { db } from "../database/connection";
import type { ThemeLogEntry } from "../types/themeLog";
import { THEME_LOG_LIMIT } from "../types/themeLog";
import { orderedPair } from "./FriendshipModel";
import type { UserRow } from "../types/user";
import type { MessageRow } from "./MessageModel";

export type ConversationRow = {
  id: string;
  user_a: string;
  user_b: string;
  user_a_last_read_at: Date | null;
  user_b_last_read_at: Date | null;
  user_a_hidden_at: Date | null;
  user_b_hidden_at: Date | null;
  last_message_at: Date | null;
  theme: unknown | null;
  theme_updated_at: Date | null;
  theme_updated_by: string | null;
  theme_log: unknown;
  created_at: Date;
  updated_at: Date;
};

export type ConversationInboxRow = ConversationRow & {
  peer: UserRow;
  lastMessage: MessageRow | null;
  latestPinActivity: {
    actor_display_name: string;
    action: "pinned" | "unpinned";
    created_at: Date;
  } | null;
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
  lm_reply_to_message_id: string | null;
  lm_created_at: Date | null;
  pa_actor_display_name: string | null;
  pa_action: "pinned" | "unpinned" | null;
  pa_created_at: Date | null;
  unread_count: string | number;
};

/** SQL fragment: conversation is visible in viewer's inbox (not deleted). */
function visibleForUserSql(viewerParam: string): string {
  return `(CASE WHEN c.user_a = ${viewerParam} THEN c.user_a_hidden_at ELSE c.user_b_hidden_at END IS NULL)`;
}

/** SQL fragment: message is visible to viewer (not deleted for them). */
function messageVisibleForUserSql(messageAlias: string, viewerParam: string): string {
  return `NOT EXISTS (
    SELECT 1 FROM message_user_deletions d
    WHERE d.message_id = ${messageAlias}.id AND d.user_id = ${viewerParam}
  )`;
}

export class ConversationModel {
  static hiddenAtForUser(row: ConversationRow, userId: string): Date | null {
    if (row.user_a === userId) return row.user_a_hidden_at;
    if (row.user_b === userId) return row.user_b_hidden_at;
    return null;
  }

  static isHiddenForUser(row: ConversationRow, userId: string): boolean {
    return this.hiddenAtForUser(row, userId) !== null;
  }

  static async findById(id: string, trx: Knex = db): Promise<ConversationRow | undefined> {
    return trx<ConversationRow>("conversations").where({ id }).first();
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
        lm.reply_to_message_id AS lm_reply_to_message_id,
        lm.created_at AS lm_created_at,
        pa.actor_display_name AS pa_actor_display_name,
        pa.action AS pa_action,
        pa.created_at AS pa_created_at,
        (
          SELECT COUNT(*)::int
          FROM messages m
          WHERE m.conversation_id = c.id
            AND m.sender_id <> ?
            AND m.unsent_at IS NULL
            AND ${messageVisibleForUserSql("m", "?")}
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
          AND ${messageVisibleForUserSql("m", "?")}
        ORDER BY m.created_at DESC
        LIMIT 1
      ) lm ON TRUE
      LEFT JOIN LATERAL (
        SELECT a.action, a.created_at, actor.display_name AS actor_display_name
        FROM message_pin_activities a
        INNER JOIN messages pinned_message ON pinned_message.id = a.message_id
        INNER JOIN users actor ON actor.id = a.actor_id
        WHERE a.conversation_id = c.id
          AND pinned_message.unsent_at IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM message_user_deletions d
            WHERE d.message_id = a.message_id AND d.user_id = ?
          )
        ORDER BY a.created_at DESC
        LIMIT 1
      ) pa ON TRUE
      WHERE (c.user_a = ? OR c.user_b = ?)
        AND ${visibleForUserSql("?")}
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
      `,
      [
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
      ]
    );

    return rows.rows.map((r) => ({
      id: r.id,
      user_a: r.user_a,
      user_b: r.user_b,
      user_a_last_read_at: r.user_a_last_read_at,
      user_b_last_read_at: r.user_b_last_read_at,
      user_a_hidden_at: r.user_a_hidden_at,
      user_b_hidden_at: r.user_b_hidden_at,
      last_message_at: r.last_message_at,
      theme: r.theme ?? null,
      theme_updated_at: r.theme_updated_at ?? null,
      theme_updated_by: r.theme_updated_by ?? null,
      theme_log: r.theme_log ?? [],
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
            reply_to_message_id: r.lm_reply_to_message_id,
            delivered_at: null,
            created_at: r.lm_created_at!,
          }
        : null,
      latestPinActivity:
        r.pa_actor_display_name && r.pa_action && r.pa_created_at
          ? {
              actor_display_name: r.pa_actor_display_name,
              action: r.pa_action,
              created_at: r.pa_created_at,
            }
          : null,
      unreadCount: Number(r.unread_count ?? 0),
    }));
  }

  /** Count of conversations with at least one unread inbound message or peer reaction. */
  static async countUnreadConversations(userId: string): Promise<number> {
    const result = await db.raw<{ rows: Array<{ count: string }> }>(
      `
      SELECT COUNT(*)::int AS count
      FROM conversations c
      WHERE (c.user_a = ? OR c.user_b = ?)
        AND ${visibleForUserSql("?")}
        AND (
          EXISTS (
            SELECT 1
            FROM messages m
            WHERE m.conversation_id = c.id
              AND m.sender_id <> ?
              AND m.unsent_at IS NULL
              AND ${messageVisibleForUserSql("m", "?")}
              AND (
                CASE WHEN c.user_a = ? THEN c.user_a_last_read_at ELSE c.user_b_last_read_at END IS NULL
                OR m.created_at > CASE WHEN c.user_a = ? THEN c.user_a_last_read_at ELSE c.user_b_last_read_at END
              )
          )
          OR EXISTS (
            SELECT 1
            FROM message_reactions mr
            INNER JOIN messages m ON m.id = mr.message_id
            WHERE m.conversation_id = c.id
              AND m.sender_id = ?
              AND mr.user_id <> ?
              AND m.unsent_at IS NULL
              AND ${messageVisibleForUserSql("m", "?")}
              AND (
                CASE WHEN c.user_a = ? THEN c.user_a_last_read_at ELSE c.user_b_last_read_at END IS NULL
                OR mr.updated_at > CASE WHEN c.user_a = ? THEN c.user_a_last_read_at ELSE c.user_b_last_read_at END
              )
          )
        )
      `,
      [userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId]
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  static async setHidden(
    id: string,
    userId: string,
    at: Date,
    trx: Knex = db
  ): Promise<ConversationRow | undefined> {
    const row = await this.findById(id, trx);
    if (!row) return undefined;
    const patch =
      row.user_a === userId
        ? { user_a_hidden_at: at }
        : row.user_b === userId
          ? { user_b_hidden_at: at }
          : null;
    if (!patch) return undefined;
    const [updated] = await trx<ConversationRow>("conversations")
      .where({ id })
      .update({ ...patch, updated_at: trx.fn.now() })
      .returning("*");
    return updated;
  }

  static async clearHidden(id: string, userId: string): Promise<void> {
    const row = await this.findById(id);
    if (!row) return;
    const patch =
      row.user_a === userId
        ? { user_a_hidden_at: null }
        : row.user_b === userId
          ? { user_b_hidden_at: null }
          : null;
    if (!patch) return;
    await db("conversations").where({ id }).update({ ...patch, updated_at: db.fn.now() });
  }

  static async touchLastMessage(id: string, at: Date): Promise<void> {
    await db("conversations").where({ id }).update({
      last_message_at: at,
      updated_at: db.fn.now(),
    });
  }

  static async updateTheme(
    id: string,
    theme: unknown | null,
    updatedBy: string,
    logEntry: ThemeLogEntry
  ): Promise<ConversationRow | undefined> {
    const now = new Date();
    const [updated] = await db<ConversationRow>("conversations")
      .where({ id })
      .update({
        theme,
        theme_updated_at: now,
        theme_updated_by: updatedBy,
        theme_log: db.raw(
          `(SELECT COALESCE(jsonb_agg(entry ORDER BY ordinal), '[]'::jsonb)
            FROM (
              SELECT entry, ordinal
              FROM jsonb_array_elements(COALESCE(theme_log, '[]'::jsonb) || ?::jsonb)
                WITH ORDINALITY AS theme_entries(entry, ordinal)
              ORDER BY ordinal DESC
              LIMIT ?
            ) AS recent_entries)`,
          [JSON.stringify([logEntry]), THEME_LOG_LIMIT]
        ),
        updated_at: db.fn.now(),
      })
      .returning("*");
    return updated;
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
