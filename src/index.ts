import dotenv from "dotenv";
import { createApp } from "./app";
import { logger } from "./logger";

dotenv.config();

const port = Number(process.env.PORT || 3201);
const app = createApp();

app.listen(port, () => {
  logger.info({ port }, "socmed API listening");
});
