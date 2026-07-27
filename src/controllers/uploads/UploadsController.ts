import type { Response } from "express";
import { ok, fail } from "../../utils/response";
import type { AuthedRequest } from "../../middleware/requireAuth";
import { ProfileService } from "../../services/ProfileService";

export class UploadsController {
  static async upload(req: AuthedRequest, res: Response): Promise<Response> {
    if (!req.file) {
      return fail(res, 400, "UPLOAD_VALIDATION", "file is required.");
    }
    const url = `/uploads/${req.file.filename}`;
    const purpose = String(req.body.purpose || "generic");
    if (purpose === "avatar") {
      const user = await ProfileService.updateMe(req.userId!, { avatarUrl: url });
      return ok(res, { url, user }, 201);
    }
    return ok(res, { url }, 201);
  }
}
