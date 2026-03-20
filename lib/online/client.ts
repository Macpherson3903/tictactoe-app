import { io } from "socket.io-client";

// Creates a socket.io client connection for room multiplayer.
export function createRoomSocket() {
  const socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    (typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
      ? "http://localhost:3001"
      : typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3001");

  return io(socketUrl, {
    transports: ["websocket"],
  });
}
