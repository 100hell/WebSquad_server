import protectRoute from "../middlewares/protectRoute.js";
import {
  getConversations,
  getMessage,
  sendMessage,
} from "../controllers/messageController.js";
import express from "express";
const router = express.Router();

router.get("/conversations", protectRoute, getConversations);
router.post("/", protectRoute, sendMessage);
router.get("/:otherUserId", protectRoute, getMessage);
export default router;
