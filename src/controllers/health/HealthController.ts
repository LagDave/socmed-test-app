import type { Request, Response } from "express";
import { ok } from "../../utils/response";

export class HealthController {
  static async getHealth(_req: Request, res: Response): Promise<Response> {
    return ok(res, {
      status: "ok",
      service: "socmed-test-app",
      time: new Date().toISOString(),
    });
  }
}
