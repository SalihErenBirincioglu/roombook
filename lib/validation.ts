import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  capacity: z.number().int().positive("Capacity must be a positive integer"),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const createBookingSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
