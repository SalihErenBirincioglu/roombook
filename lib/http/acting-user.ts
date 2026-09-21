import type { User } from "@prisma/client";
import { UnauthorizedError } from "../errors";
import { prisma } from "../prisma";

export async function getActingUser(request: Request): Promise<User> {
  const userId = request.headers.get("x-acting-user-id");
  if (!userId) {
    throw new UnauthorizedError("Missing x-acting-user-id header");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new UnauthorizedError("Acting user not found");
  }

  return user;
}
