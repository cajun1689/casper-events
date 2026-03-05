import { eq } from "drizzle-orm";
import * as schema from "@cyh/shared/db";
import type { Db } from "../db/connection.js";

export interface UserOrgInfo {
  userId: string;
  orgId: string;
  role: string;
  isAdmin: boolean;
}

export async function resolveUserOrg(
  db: Db,
  cognitoSub: string
): Promise<UserOrgInfo | null> {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.cognitoSub, cognitoSub));

  if (!user || !user.orgId) return null;

  return {
    userId: user.id,
    orgId: user.orgId,
    role: user.role,
    isAdmin: user.isAdmin,
  };
}
