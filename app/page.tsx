"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type ActingUser = { id: string; name: string; role: "EMPLOYEE" | "ADMIN" };

export const DEFAULT_ACTING_USER: ActingUser = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Alice",
  role: "EMPLOYEE",
};

export const ACTING_USERS: ActingUser[] = [
  DEFAULT_ACTING_USER,
  { id: "22222222-2222-4222-8222-222222222222", name: "Bob", role: "EMPLOYEE" },
  { id: "33333333-3333-4333-8333-333333333333", name: "Carol", role: "ADMIN" },
];

const ACTING_USER_STORAGE_KEY = "actingUserId";

export function readActingUserId(): string {
  if (typeof window === "undefined") {
    return DEFAULT_ACTING_USER.id;
  }
  return window.localStorage.getItem(ACTING_USER_STORAGE_KEY) ?? DEFAULT_ACTING_USER.id;
}

export function writeActingUserId(userId: string): void {
  window.localStorage.setItem(ACTING_USER_STORAGE_KEY, userId);
}

type Room = { id: string; name: string; capacity: number };

export default function HomePage() {
  const [actingUserId, setActingUserId] = useState(DEFAULT_ACTING_USER.id);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState<string | null>(null);

  const actingUser = ACTING_USERS.find((user) => user.id === actingUserId) ?? DEFAULT_ACTING_USER;

  async function loadRooms() {
    const response = await fetch("/api/rooms");
    setRooms(await response.json());
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read client-only localStorage after mount to avoid SSR hydration mismatch
    setActingUserId(readActingUserId());
    void loadRooms();
  }, []);

  function handleActingUserChange(userId: string) {
    setActingUserId(userId);
    writeActingUserId(userId);
  }

  async function handleCreateRoom(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const response = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-acting-user-id": actingUserId },
      body: JSON.stringify({ name, capacity: Number(capacity) }),
    });

    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Failed to create room");
      return;
    }

    setName("");
    setCapacity("");
    await loadRooms();
  }

  return (
    <main>
      <h1>roombook</h1>

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

      <h2>Rooms</h2>
      <ul>
        {rooms.map((room) => (
          <li key={room.id}>
            <Link href={`/rooms/${room.id}`}>
              {room.name} (capacity {room.capacity})
            </Link>
          </li>
        ))}
      </ul>

      {actingUser.role === "ADMIN" && (
        <form onSubmit={handleCreateRoom}>
          <h2>Create room</h2>
          <label>
            Name: <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Capacity:{" "}
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </label>
          <button type="submit">Create room</button>
        </form>
      )}

      {error && <p role="alert">{error}</p>}
    </main>
  );
}
