import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { SessionModel } from "../models/SessionModel";
import { sessionCookieName } from "../middleware/requireAuth";
import { logger } from "../logger";
import { attachTypingHandlers } from "./TypingRelay";

const SOCKET_PATH = "/socket.io";

export type AuthedSocket = Socket & { data: { userId: string } };

let io: Server | null = null;

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq);
    if (key !== name) continue;
    return decodeURIComponent(trimmed.slice(eq + 1));
  }
  return undefined;
}

function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function getIo(): Server | null {
  return io;
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  if (!io) return;
  io.to(userRoom(userId)).emit(event, payload);
}

export function attachRealtime(httpServer: HttpServer): Server {
  if (io) return io;

  const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5180";

  io = new Server(httpServer, {
    path: SOCKET_PATH,
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = readCookie(socket.request.headers.cookie, sessionCookieName());
      if (!token) {
        next(new Error("AUTH_UNAUTHENTICATED"));
        return;
      }
      const session = await SessionModel.findValidByToken(token);
      if (!session) {
        next(new Error("AUTH_UNAUTHENTICATED"));
        return;
      }
      socket.data.userId = session.user_id;
      next();
    } catch (err) {
      logger.error({ err }, "Socket auth failed");
      next(new Error("AUTH_UNAUTHENTICATED"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string | undefined;
    if (!userId) {
      socket.disconnect(true);
      return;
    }
    void socket.join(userRoom(userId));
    attachTypingHandlers(socket);
    logger.debug({ userId, socketId: socket.id }, "Socket connected");
    socket.on("disconnect", (reason) => {
      logger.debug({ userId, socketId: socket.id, reason }, "Socket disconnected");
    });
  });

  return io;
}
