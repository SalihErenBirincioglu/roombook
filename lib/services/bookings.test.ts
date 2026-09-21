import type { Room, User } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "../errors";
import { prisma } from "../prisma";
import { cancelBooking, createBooking, listBookingsForRoom } from "./bookings";

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

let room: Room;
let owner: User;
let otherUser: User;
let adminUser: User;

beforeEach(async () => {
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  room = await prisma.room.create({ data: { name: "Falcon", capacity: 4 } });
  owner = await prisma.user.create({ data: { name: "Alice", role: "EMPLOYEE" } });
  otherUser = await prisma.user.create({ data: { name: "Bob", role: "EMPLOYEE" } });
  adminUser = await prisma.user.create({ data: { name: "Carol", role: "ADMIN" } });
});

describe("listBookingsForRoom", () => {
  it("returns [] when no bookings exist (AC-4)", async () => {
    const result = await listBookingsForRoom(room.id, hoursFromNow(0), hoursFromNow(24));
    expect(result).toEqual([]);
  });

  it("returns only active bookings overlapping the requested range (AC-4)", async () => {
    const booking = await createBooking(room.id, owner.id, {
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(3),
    });

    const overlapping = await listBookingsForRoom(room.id, hoursFromNow(1), hoursFromNow(4));
    expect(overlapping.map((b) => b.id)).toEqual([booking.id]);

    const nonOverlapping = await listBookingsForRoom(room.id, hoursFromNow(10), hoursFromNow(12));
    expect(nonOverlapping).toEqual([]);
  });

  it("excludes cancelled bookings (AC-4)", async () => {
    const booking = await createBooking(room.id, owner.id, {
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(3),
    });
    await cancelBooking(booking.id, owner.id);

    const result = await listBookingsForRoom(room.id, hoursFromNow(1), hoursFromNow(4));
    expect(result).toEqual([]);
  });
});

describe("createBooking", () => {
  it("creates an active booking owned by the acting user (AC-5)", async () => {
    const booking = await createBooking(room.id, owner.id, {
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(3),
    });

    expect(booking.status).toBe("ACTIVE");
    expect(booking.userId).toBe(owner.id);
  });

  it("rejects a booking overlapping an existing active booking; existing booking unchanged (AC-6)", async () => {
    const existing = await createBooking(room.id, owner.id, {
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(4),
    });

    await expect(
      createBooking(room.id, otherUser.id, {
        startTime: hoursFromNow(3),
        endTime: hoursFromNow(5),
      }),
    ).rejects.toBeInstanceOf(ConflictError);

    const stillThere = await prisma.booking.findUnique({ where: { id: existing.id } });
    expect(stillThere).toEqual(existing);
    expect(await prisma.booking.count()).toBe(1);
  });

  it("rejects overlapping concurrent bookings, keeping exactly one active (AC-6, DB exclusion constraint)", async () => {
    const attempt = () =>
      createBooking(room.id, owner.id, {
        startTime: hoursFromNow(2),
        endTime: hoursFromNow(4),
      });

    const results = await Promise.allSettled([attempt(), attempt()]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);

    expect(await prisma.booking.count()).toBe(1);
  });

  it("accepts a booking that only touches an existing booking's boundary (AC-7)", async () => {
    await createBooking(room.id, owner.id, {
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(3),
    });

    const touching = await createBooking(room.id, otherUser.id, {
      startTime: hoursFromNow(3),
      endTime: hoursFromNow(4),
    });

    expect(touching.status).toBe("ACTIVE");
  });

  it("rejects a start time not strictly before the end time (AC-8)", async () => {
    await expect(
      createBooking(room.id, owner.id, {
        startTime: hoursFromNow(4),
        endTime: hoursFromNow(4),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a time range entirely in the past (AC-8)", async () => {
    await expect(
      createBooking(room.id, owner.id, {
        startTime: hoursFromNow(-4),
        endTime: hoursFromNow(-2),
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects a booking for a room that doesn't exist (AC-9)", async () => {
    await expect(
      createBooking("00000000-0000-4000-8000-000000000000", owner.id, {
        startTime: hoursFromNow(2),
        endTime: hoursFromNow(3),
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("cancelBooking", () => {
  it("lets the owner cancel, freeing the slot for a new overlapping booking (AC-10)", async () => {
    const booking = await createBooking(room.id, owner.id, {
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(4),
    });

    const cancelled = await cancelBooking(booking.id, owner.id);
    expect(cancelled.status).toBe("CANCELLED");

    const replacement = await createBooking(room.id, otherUser.id, {
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(4),
    });
    expect(replacement.status).toBe("ACTIVE");
  });

  it("rejects cancellation by a non-owner (AC-11)", async () => {
    const booking = await createBooking(room.id, owner.id, {
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(4),
    });

    await expect(cancelBooking(booking.id, otherUser.id)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    const stillActive = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(stillActive?.status).toBe("ACTIVE");
  });

  it("rejects cancellation by an Admin who is not the owner (AC-11, BR-3 deferred)", async () => {
    const booking = await createBooking(room.id, owner.id, {
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(4),
    });

    await expect(cancelBooking(booking.id, adminUser.id)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    const stillActive = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(stillActive?.status).toBe("ACTIVE");
  });

  it("rejects cancelling a booking that doesn't exist (AC-12)", async () => {
    await expect(
      cancelBooking("00000000-0000-4000-8000-000000000000", owner.id),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects cancelling an already-cancelled booking (AC-12)", async () => {
    const booking = await createBooking(room.id, owner.id, {
      startTime: hoursFromNow(2),
      endTime: hoursFromNow(4),
    });
    await cancelBooking(booking.id, owner.id);

    await expect(cancelBooking(booking.id, owner.id)).rejects.toBeInstanceOf(ConflictError);
  });
});
