import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import { app, server } from "./socket/socket.js";
import cors from "cors";
dotenv.config();
connectDB();
app.use(
  cors({
    origin: "*",
  })
);
const port = process.env.PORT || 5000;

cloudinary.config({
  cloud_name: "danol279o",
  api_key: "823743154242596",
  api_secret: "BW44W4HjSOVtPNyD6lF2gnAc1e8",
});
// Middleswares
app.use(express.json({ limit: "50mb" })); // It is to parse json data in the req.body
app.use(express.urlencoded({ extended: true })); // It is to parse form data to req.body
app.use(cookieParser());

// Routes
app.use("/", ()=>console.log("running));
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
server.listen(port, () => console.log(`Server started at port ${port}`));
