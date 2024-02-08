import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST"],
    origin: "https://web-squad-server.vercel.app/",
    credentials: true,
  },
});

const userSocketMap = {};

export const getRecipientSocketId = (recipientId) => {
  return userSocketMap[recipientId];
};

io.on("connection", (socket) => {
  //   console.log("user connected", socket.handshake.query.userId);
  const userId = socket.handshake.query.userId;
  if (userId != "undefined") {
    userSocketMap[userId] = socket.id;
  }
  io.emit("getOnlineusers", Object.keys(userSocketMap));
  socket.on("disconnect", () => {
    // console.log("user disconnect");
    delete userSocketMap[userId];
    io.emit("getOnlineusers", Object.keys(userSocketMap));
  });
});

export { io, server, app };
