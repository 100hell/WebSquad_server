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
import path, { join } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();
connectDB();

app.use(
  cors({
    origin: "*",
  })
);

const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "dist")));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// Middleswares
app.use(express.json({ limit: "50mb" })); // It is to parse json data in the req.body
app.use(express.urlencoded({ extended: true })); // It is to parse form data to req.body
app.use(cookieParser());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
if (process.env.NODE_ENV === "production") {
  const STATIC_PATH = path.join(__dirname, "dist", "index.html");
  app.use("/*", async (req, res) => {
    return res
      .status(200)
      .set("Content-Type", "text/html")
      .send(fs.readFileSync(STATIC_PATH));
  });
}
server.listen(port, () => console.log(`Server started at port ${port}`));
