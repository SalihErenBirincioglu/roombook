import type { Booking } from "@prisma/client";
import { BookingStatus } from "@prisma/client";
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "../errors";
import { prisma } from "../prisma";
import { createBookingSchema } from "../validation";

function overlapsRange(rangeStart: Date, rangeEnd: Date) {
  return {
    startTime: { lt: rangeEnd },
    endTime: { gt: rangeStart },
  };
}

export async function listBookingsForRoom(
  roomId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<Booking[]> {
  return prisma.booking.findMany({
    where: {
      roomId,
      status: BookingStatus.ACTIVE,
      ...overlapsRange(rangeStart, rangeEnd),
    },
    orderBy: { startTime: "asc" },
  });
}

export async function createBooking(
  roomId: string,
  userId: string,
  input: unknown,
): Promise<Booking> {
  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid booking input");
  }

  const { startTime, endTime } = parsed.data;

  if (startTime >= endTime) {
    throw new ValidationError("Start time must be strictly before end time");
  }
  if (endTime <= new Date()) {
    throw new ValidationError("Booking time range must not be entirely in the past");
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    throw new NotFoundError("Room not found");
  }

  const conflict = await prisma.booking.findFirst({
    where: {
      roomId,
      status: BookingStatus.ACTIVE,
      ...overlapsRange(startTime, endTime),
    },
  });
  if (conflict) {
    throw new ConflictError("Booking overlaps an existing active booking for this room");
  }

  try {
    return await prisma.booking.create({
      data: { roomId, userId, startTime, endTime },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("23P01")) {
      throw new ConflictError("Booking overlaps an existing active booking for this room");
    }
    throw error;
  }
}

export async function cancelBooking(bookingId: string, userId: string): Promise<Booking> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    throw new NotFoundError("Booking not found");
  }
  if (booking.userId !== userId) {
    throw new UnauthorizedError("Only the owner of a booking can cancel it");
  }
  if (booking.status !== BookingStatus.ACTIVE) {
    throw new ConflictError("Booking is already cancelled");
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });
}
