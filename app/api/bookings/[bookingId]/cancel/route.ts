import { NextRequest, NextResponse } from "next/server";
import { getActingUser } from "@/lib/http/acting-user";
import { errorResponse } from "@/lib/http/error-response";
import { cancelBooking } from "@/lib/services/bookings";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params;
    const actingUser = await getActingUser(request);
    const booking = await cancelBooking(bookingId, actingUser.id);
    return NextResponse.json(booking);
  } catch (error) {
    return errorResponse(error);
  }
}
