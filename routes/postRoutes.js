import express from "express";
import {
  createPost,
  deletePost,
  getFeedPost,
  getPost,
  getUserPost,
  likeUnlikePost,
  replyToPost,
  deleteReply,
  getHashtagPosts,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";
const router = express.Router();
router.get("/feed/:page", protectRoute, getFeedPost);
// router.get("/feed", protectRoute, getFeedPost);
router.get("/:postId", getPost);
router.get("/user/:username", getUserPost);
router.post("/create", protectRoute, createPost);
router.delete("/:postId", protectRoute, deletePost);
router.delete("/deleteReply/:postId/:replyId", protectRoute, deleteReply);
router.put("/like/:postId", protectRoute, likeUnlikePost);
router.put("/reply/:postId", protectRoute, replyToPost);
router.get("/hashtag/:hashtagText", getHashtagPosts);
export default router;
