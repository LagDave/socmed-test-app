import {
  ConversationModel,
  type ConversationRow,
} from "../models/ConversationModel";
import type { ChatThemePayload } from "../constants/chatThemeSchema";
import { chatThemeSchema, updateChatThemeSchema } from "../constants/chatThemeSchema";
import { AppError } from "../utils/AppError";
import { MessageRealtime } from "../realtime/MessageRealtime";
import { logger } from "../logger";
import { assertThemeBubbleContrast } from "../utils/chatThemeValidation";
import { createThemeLogEntry, parseThemeLog, type ThemeLogEntry } from "../types/themeLog";

export type ConversationThemeView = {
  theme: ChatThemePayload | null;
  updatedAt: Date | null;
  updatedBy: string | null;
};

export type ConversationThemeUpdateView = ConversationThemeView & {
  logEntry: ThemeLogEntry;
};

function assertParticipant(row: ConversationRow, userId: string): void {
  if (row.user_a !== userId && row.user_b !== userId) {
    throw new AppError("MESSAGE_FORBIDDEN", "Not a participant of this conversation.");
  }
}

function parseStoredTheme(raw: unknown): ChatThemePayload | null {
  if (raw === null || raw === undefined) return null;
  try {
    return chatThemeSchema.parse(raw);
  } catch (err) {
    logger.warn({ err, raw }, "Ignoring invalid stored conversation theme");
    return null;
  }
}

function toThemeView(row: ConversationRow): ConversationThemeView {
  return {
    theme: parseStoredTheme(row.theme),
    updatedAt: row.theme_updated_at,
    updatedBy: row.theme_updated_by,
  };
}

async function publishThemeRealtime(
  conversation: ConversationRow,
  view: ConversationThemeView,
  logEntry: ThemeLogEntry
): Promise<void> {
  try {
    await MessageRealtime.conversationTheme(conversation, view, logEntry);
  } catch (err) {
    logger.error({ err }, "Chat theme realtime publish failed");
  }
}

export class ChatThemeService {
  static themeFromRow(row: ConversationRow): ConversationThemeView {
    return toThemeView(row);
  }

  static themeLogsFromRow(row: ConversationRow): ThemeLogEntry[] {
    return parseThemeLog(row.theme_log);
  }

  static async getTheme(userId: string, conversationId: string): Promise<ConversationThemeView> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);
    return toThemeView(conversation);
  }

  static async updateTheme(
    userId: string,
    conversationId: string,
    raw: unknown
  ): Promise<ConversationThemeUpdateView> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");
    assertParticipant(conversation, userId);

    const input = updateChatThemeSchema.parse(raw);
    const nextTheme =
      "reset" in input && input.reset === true ? null : (input as ChatThemePayload);

    if (nextTheme) {
      assertThemeBubbleContrast(nextTheme);
    }

    const logEntry = createThemeLogEntry(nextTheme, userId);
    const updated = await ConversationModel.updateTheme(
      conversationId,
      nextTheme,
      userId,
      logEntry
    );
    if (!updated) throw new AppError("CONVERSATION_NOT_FOUND", "Conversation not found.");

    const view = toThemeView(updated);
    await publishThemeRealtime(updated, view, logEntry);
    return { ...view, logEntry };
  }
}
