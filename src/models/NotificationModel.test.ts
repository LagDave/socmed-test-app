import assert from "node:assert/strict";
import test from "node:test";
import type { Knex } from "knex";
import {
  NotificationModel,
  type NotificationRow,
  type ReactionNotificationInput,
  type ReactionNotificationTarget,
} from "./NotificationModel";

const REACTION_INPUT: ReactionNotificationInput = {
  recipientId: "recipient-id",
  actorId: "actor-id",
  type: "reaction_on_post",
  postId: "post-id",
  reactionEmoji: "haha",
};

const NOTIFICATION_ROW: NotificationRow = {
  id: "notification-id",
  recipient_id: "recipient-id",
  actor_id: "actor-id",
  type: "reaction_on_post",
  post_id: "post-id",
  comment_id: null,
  post_image_id: null,
  friendship_id: null,
  reaction_emoji: "haha",
  is_read: true,
  created_at: new Date("2026-08-10T00:00:00.000Z"),
  updated_at: new Date("2026-08-10T00:00:00.000Z"),
};

type UpsertCalls = {
  insert: Record<string, unknown> | null;
  conflictTarget: string | null;
  merge: Record<string, unknown> | null;
};

function createUpsertTransaction(created: boolean): {
  calls: UpsertCalls;
  transaction: Knex.Transaction;
} {
  const calls: UpsertCalls = { insert: null, conflictTarget: null, merge: null };
  const query = {
    insert(values: Record<string, unknown>) {
      calls.insert = values;
      return query;
    },
    onConflict(target: string) {
      calls.conflictTarget = target;
      return query;
    },
    merge(values: Record<string, unknown>) {
      calls.merge = values;
      return query;
    },
    returning() {
      return Promise.resolve([{ ...NOTIFICATION_ROW, created }]);
    },
  };
  const transaction = Object.assign(
    () => query,
    {
      raw: (sql: string) => sql,
      fn: { now: () => "CURRENT_TIME" },
    }
  );

  return { calls, transaction: transaction as unknown as Knex.Transaction };
}

function createDeleteTransaction(): {
  whereClauses: Record<string, unknown>[];
  transaction: Knex.Transaction;
} {
  const whereClauses: Record<string, unknown>[] = [];
  const query = {
    where(values: Record<string, unknown>) {
      whereClauses.push(values);
      return query;
    },
    andWhere(values: Record<string, unknown>) {
      whereClauses.push(values);
      return query;
    },
    del() {
      return Promise.resolve(1);
    },
  };

  return {
    whereClauses,
    transaction: (() => query) as unknown as Knex.Transaction,
  };
}

test("upsertReaction creates one current notification without resetting a read row", async () => {
  const { calls, transaction } = createUpsertTransaction(false);

  const result = await NotificationModel.upsertReaction(REACTION_INPUT, transaction);

  assert.equal(result.created, false);
  assert.equal(result.notification.is_read, true);
  assert.deepEqual(calls.insert, {
    recipient_id: "recipient-id",
    actor_id: "actor-id",
    type: "reaction_on_post",
    post_id: "post-id",
    comment_id: null,
    post_image_id: null,
    friendship_id: null,
    reaction_emoji: "haha",
    is_read: false,
  });
  assert.match(calls.conflictTarget ?? "", /recipient_id, actor_id, type, post_id/);
  assert.deepEqual(calls.merge, { reaction_emoji: "haha", updated_at: "CURRENT_TIME" });
  assert.equal(Object.hasOwn(calls.merge ?? {}, "is_read"), false);
});

test("deleteReaction scopes post, comment, and photo notifications to their exact target", async () => {
  const cases: Array<{
    input: ReactionNotificationTarget;
    target: Record<string, string>;
  }> = [
    {
      input: {
        recipientId: "recipient-id",
        actorId: "actor-id",
        type: "reaction_on_post",
        postId: "post-id",
      },
      target: { post_id: "post-id" },
    },
    {
      input: {
        recipientId: "recipient-id",
        actorId: "actor-id",
        type: "reaction_on_comment",
        postId: "post-id",
        commentId: "comment-id",
      },
      target: { comment_id: "comment-id" },
    },
    {
      input: {
        recipientId: "recipient-id",
        actorId: "actor-id",
        type: "reaction_on_photo",
        postId: "post-id",
        postImageId: "photo-id",
      },
      target: { post_image_id: "photo-id" },
    },
  ];

  for (const { input, target } of cases) {
    const { whereClauses, transaction } = createDeleteTransaction();

    const deleted = await NotificationModel.deleteReaction(input, transaction);

    assert.equal(deleted, 1);
    assert.deepEqual(whereClauses, [
      {
        recipient_id: "recipient-id",
        actor_id: "actor-id",
        type: input.type,
      },
      target,
    ]);
  }
});
