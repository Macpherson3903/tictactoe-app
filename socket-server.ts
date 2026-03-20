// app/api/socket/route.ts
import { Server } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: "/api/socket",
      cors: {
        origin: req.headers.origin || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}