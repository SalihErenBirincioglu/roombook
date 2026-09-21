import type { Room } from "@prisma/client";
import { ValidationError } from "../errors";
import { prisma } from "../prisma";
import { createRoomSchema } from "../validation";

export async function createRoom(input: unknown): Promise<Room> {
  const parsed = createRoomSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid room input");
  }

  return prisma.room.create({ data: parsed.data });
}

export async function listRooms(): Promise<Room[]> {
  return prisma.room.findMany({ orderBy: { name: "asc" } });
}
