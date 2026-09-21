"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ACTING_USERS, DEFAULT_ACTING_USER, readActingUserId, writeActingUserId } from "../../page";

type Room = { id: string; name: string; capacity: number };
type Booking = {
  id: string;
  roomId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: "ACTIVE" | "CANCELLED";
};

function defaultRangeStart(): string {
  return new Date().toISOString().slice(0, 16);
}

function defaultRangeEnd(): string {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export default function RoomDetailPage() {
  const params = useParams<{ roomId: string }>();
  const roomId = params.roomId;

  const [actingUserId, setActingUserId] = useState(DEFAULT_ACTING_USER.id);
  const [room, setRoom] = useState<Room | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rangeStart, setRangeStart] = useState(defaultRangeStart());
  const [rangeEnd, setRangeEnd] = useState(defaultRangeEnd());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function loadRoom() {
    const response = await fetch("/api/rooms");
    const allRooms: Room[] = await response.json();
    setRoom(allRooms.find((r) => r.id === roomId) ?? null);
  }

  async function loadBookings(from: string, to: string) {
    const search = new URLSearchParams({
      rangeStart: new Date(from).toISOString(),
      rangeEnd: new Date(to).toISOString(),
    });
    const response = await fetch(`/api/rooms/${roomId}/bookings?${search}`);
    setBookings(await response.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read client-only localStorage after mount to avoid SSR hydration mismatch
    setActingUserId(readActingUserId());
    void loadRoom();
    void loadBookings(defaultRangeStart(), defaultRangeEnd());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  function handleActingUserChange(userId: string) {
    setActingUserId(userId);
    writeActingUserId(userId);
  }

  async function handleRangeSubmit(event: React.FormEvent) {
    event.preventDefault();
    await loadBookings(rangeStart, rangeEnd);
  }

  async function handleCreateBooking(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`/api/rooms/${roomId}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-acting-user-id": actingUserId },
      body: JSON.stringify({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      }),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Failed to create booking");
      return;
    }

    setStartTime("");
    setEndTime("");
    await loadBookings(rangeStart, rangeEnd);
  }

  async function handleCancel(bookingId: string) {
    setError(null);

    const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: { "x-acting-user-id": actingUserId },
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Failed to cancel booking");
      return;
    }

    await loadBookings(rangeStart, rangeEnd);
  }

  return (
    <main>
      <h1>{room ? room.name : "Room"}</h1>

      <label>
        Acting as:{" "}
        <select value={actingUserId} onChange={(e) => handleActingUserChange(e.target.value)}>
          {ACTING_USERS.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.role})
            </option>
          ))}
        </select>
      </label>

      <h2>Bookings</h2>
      <form onSubmit={handleRangeSubmit}>
        <label>
          From:{" "}
          <input
            type="datetime-local"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
          />
        </label>
        <label>
          To:{" "}
          <input
            type="datetime-local"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
          />
        </label>
        <button type="submit">Refresh</button>
      </form>

      <ul>
        {bookings.map((booking) => (
          <li key={booking.id}>
            {new Date(booking.startTime).toLocaleString()} –{" "}
            {new Date(booking.endTime).toLocaleString()}
            {booking.userId === actingUserId && (
              <button type="button" onClick={() => handleCancel(booking.id)}>
                Cancel
              </button>
            )}
          </li>
        ))}
      </ul>

      <h2>Create booking</h2>
      <form onSubmit={handleCreateBooking}>
        <label>
          Start:{" "}
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </label>
        <label>
          End:{" "}
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </label>
        <button type="submit">Create booking</button>
      </form>

      {error && <p role="alert">{error}</p>}
    </main>
  );
}
