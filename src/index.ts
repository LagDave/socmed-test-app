import dotenv from "dotenv";
import { createServer } from "http";
import { createApp } from "./app";
import { logger } from "./logger";
import { attachRealtime } from "./realtime/io";

dotenv.config();

const port = Number(process.env.PORT || 3210);
const app = createApp();
const httpServer = createServer(app);
attachRealtime(httpServer);

httpServer.listen(port, () => {
  logger.info({ port }, "socmed API listening");
});
