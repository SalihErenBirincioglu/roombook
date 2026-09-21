import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "@/lib/errors";
import { getActingUser } from "@/lib/http/acting-user";
import { errorResponse, parseJsonBody } from "@/lib/http/error-response";
import { createBooking, listBookingsForRoom } from "@/lib/services/bookings";

function parseRangeParam(value: string | null, field: string): Date {
  if (!value) {
    throw new ValidationError(`${field} query param is required`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${field} must be a valid date`);
  }
  return date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const rangeStart = parseRangeParam(searchParams.get("rangeStart"), "rangeStart");
    const rangeEnd = parseRangeParam(searchParams.get("rangeEnd"), "rangeEnd");

    const bookings = await listBookingsForRoom(roomId, rangeStart, rangeEnd);
    return NextResponse.json(bookings);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const actingUser = await getActingUser(request);
    const body = await parseJsonBody(request);
    const booking = await createBooking(roomId, actingUser.id, body);
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
