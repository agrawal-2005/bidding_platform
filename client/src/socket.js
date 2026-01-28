import { io } from "socket.io-client";

const USER_ID_KEY = "bidding:userId";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export function getOrCreateUserId() {
  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;
  const id = `user-${crypto.randomUUID()}`;
  localStorage.setItem(USER_ID_KEY, id);
  return id;
}

export const socket = io(SOCKET_URL, { autoConnect: true });
