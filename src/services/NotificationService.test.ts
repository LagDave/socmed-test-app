import assert from "node:assert/strict";
import test from "node:test";
import {
  NotificationModel,
  type ReactionNotificationInput,
  type ReactionNotificationTarget,
} from "../models/NotificationModel";
import { NotificationService } from "./NotificationService";

const REACTION_INPUT: ReactionNotificationInput = {
  recipientId: "recipient-id",
  actorId: "actor-id",
  type: "reaction_on_post",
  postId: "post-id",
  reactionEmoji: "heart",
};

test("upsertReaction creates a notification only for another user", async (context) => {
  const originalUpsert = NotificationModel.upsertReaction;
  context.after(() => {
    NotificationModel.upsertReaction = originalUpsert;
  });

  let calls = 0;
  NotificationModel.upsertReaction = async () => {
    calls += 1;
    return {
      notification: {
        id: "notification-id",
        recipient_id: "recipient-id",
        actor_id: "actor-id",
        type: "reaction_on_post",
        post_id: "post-id",
        comment_id: null,
        post_image_id: null,
        friendship_id: null,
        reaction_emoji: "heart",
        is_read: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      created: true,
    };
  };

  const created = await NotificationService.upsertReaction(REACTION_INPUT);
  const selfAction = await NotificationService.upsertReaction({
    ...REACTION_INPUT,
    recipientId: "actor-id",
  });

  assert.equal(created?.created, true);
  assert.equal(calls, 1);
  assert.equal(selfAction, null);
});

test("removeReaction does not delete a notification for a self-action", async (context) => {
  const originalDelete = NotificationModel.deleteReaction;
  context.after(() => {
    NotificationModel.deleteReaction = originalDelete;
  });

  let calls = 0;
  NotificationModel.deleteReaction = async (input: ReactionNotificationTarget) => {
    calls += 1;
    assert.equal(input.postId, "post-id");
    return 1;
  };

  const deleted = await NotificationService.removeReaction({
    recipientId: "recipient-id",
    actorId: "actor-id",
    type: "reaction_on_post",
    postId: "post-id",
  });
  const selfDeleted = await NotificationService.removeReaction({
    recipientId: "actor-id",
    actorId: "actor-id",
    type: "reaction_on_post",
    postId: "post-id",
  });

  assert.equal(deleted, 1);
  assert.equal(selfDeleted, 0);
  assert.equal(calls, 1);
});
