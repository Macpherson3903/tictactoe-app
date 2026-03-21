import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocketUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL ?? window.location.origin;
}

function useSocketCredentials(): boolean {
  if (typeof window === "undefined") return true;
  return process.env.NEXT_PUBLIC_SOCKET_WITH_CREDENTIALS !== "false";
}

export function createRoomSocket(): Socket {
  if (socket) return socket;
  socket = io(getSocketUrl(), {
    path: "/api/socket",
    transports: ["polling", "websocket"],
    withCredentials: useSocketCredentials(),
    autoConnect: false,
  });
  return socket;
}