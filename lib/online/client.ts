import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocketUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL ?? window.location.origin;
}

export function createRoomSocket(): Socket {
  if (socket) return socket;
  socket = io(getSocketUrl(), {
    path: "/api/socket",
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
  });
  return socket;
}