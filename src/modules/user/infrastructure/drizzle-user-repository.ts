import { db } from "@/shared/infrastructure/database/db-client";
import { user as userTable } from "@/shared/infrastructure/database/schemas";
import { User } from "../domain/user-entity";
import type { UserRepository } from "../domain/user-repository-interface";
import { eq } from "drizzle-orm";

export class DrizzleUserRepository implements UserRepository {
  async getById(id: string): Promise<User | null> {
    const result = await db.query.user.findFirst({
      where: eq(userTable.id, id),
    });

    if (!result) return null;

    return User.create(
      {
        name: result.name,
        email: result.email,
        image: result.image,
      },
      result.id,
    );
  }

  async getByEmail(email: string): Promise<User | null> {
    const result = await db.query.user.findFirst({
      where: eq(userTable.email, email),
    });

    if (!result) return null;

    return User.create(
      {
        name: result.name,
        email: result.email,
        image: result.image,
      },
      result.id,
    );
  }

  async save(user: User): Promise<void> {
    await db
      .insert(userTable)
      .values({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userTable.id,
        set: {
          name: user.name,
          email: user.email,
          image: user.image,
          updatedAt: new Date(),
        },
      });
  }
}
