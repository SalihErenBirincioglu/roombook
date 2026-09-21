import { beforeEach, describe, expect, it } from "vitest";
import { ValidationError } from "../errors";
import { prisma } from "../prisma";
import { createRoom, listRooms } from "./rooms";

beforeEach(async () => {
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
});

describe("createRoom", () => {
  it("stores a room so it appears in listRooms (AC-1)", async () => {
    const room = await createRoom({ name: "Falcon", capacity: 4 });

    const rooms = await listRooms();
    expect(rooms).toContainEqual(room);
  });

  it("rejects an empty name (AC-2)", async () => {
    await expect(createRoom({ name: "", capacity: 4 })).rejects.toBeInstanceOf(ValidationError);
    expect(await listRooms()).toHaveLength(0);
  });

  it("rejects a non-positive capacity (AC-2)", async () => {
    await expect(createRoom({ name: "Falcon", capacity: 0 })).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(await listRooms()).toHaveLength(0);
  });
});

describe("listRooms", () => {
  it("returns an empty list when no rooms exist (AC-3)", async () => {
    expect(await listRooms()).toEqual([]);
  });

  it("returns every created room (AC-3)", async () => {
    await createRoom({ name: "Falcon", capacity: 4 });
    await createRoom({ name: "Eagle", capacity: 8 });

    const names = (await listRooms()).map((room) => room.name).sort();
    expect(names).toEqual(["Eagle", "Falcon"]);
  });
});
