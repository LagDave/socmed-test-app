import { db } from "../database/connection";
import type { UserRow } from "../types/user";

export class UserModel {
  static async create(input: {
    email: string;
    passwordHash: string;
    displayName: string;
    username?: string | null;
  }): Promise<UserRow> {
    const [row] = await db<UserRow>("users")
      .insert({
        email: input.email.toLowerCase(),
        password_hash: input.passwordHash,
        display_name: input.displayName,
        username: input.username ?? null,
      })
      .returning("*");
    return row;
  }

  static async findById(id: string): Promise<UserRow | undefined> {
    return db<UserRow>("users").where({ id }).first();
  }

  static async findByEmail(email: string): Promise<UserRow | undefined> {
    return db<UserRow>("users").where({ email: email.toLowerCase() }).first();
  }

  static async findByUsername(username: string): Promise<UserRow | undefined> {
    return db<UserRow>("users").whereRaw("lower(username) = ?", [username.toLowerCase()]).first();
  }

  static async updateProfile(
    id: string,
    patch: Partial<{
      display_name: string;
      username: string;
      bio: string | null;
      avatar_url: string | null;
    }>
  ): Promise<UserRow | undefined> {
    const [row] = await db<UserRow>("users").where({ id }).update(patch).returning("*");
    return row;
  }
}
