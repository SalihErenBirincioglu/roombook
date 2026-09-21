import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError } from "@/lib/errors";
import { getActingUser } from "@/lib/http/acting-user";
import { errorResponse } from "@/lib/http/error-response";
import { createRoom, listRooms } from "@/lib/services/rooms";

export async function GET() {
  const rooms = await listRooms();
  return NextResponse.json(rooms);
}

export async function POST(request: NextRequest) {
  try {
    const actingUser = await getActingUser(request);
    if (actingUser.role !== "ADMIN") {
      throw new UnauthorizedError("Only an Admin can create a Room");
    }

    const body = await request.json();
    const room = await createRoom(body);
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
