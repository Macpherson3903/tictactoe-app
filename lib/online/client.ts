import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function createRoomSocket(): Socket {
  if (socket) return socket;
  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
  socket = io(socketUrl, {
    path: "/api/socket",
    transports: ["websocket"],
    withCredentials: true,
  });
  return socket;
}