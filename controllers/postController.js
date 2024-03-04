import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import { v2 as cloudinary } from "cloudinary";
import HashTags from "../models/hashtagModal.js";

const createPost = async (req, res) => {
  try {
    const { postedBy, text } = req.body;
    let { img } = req.body;
    let hashtags = [];
    if (!postedBy || !text)
      return res.status(400).json({ EvalError: "Please fill all fields!" });
    const user = await User.findById(postedBy);
    if (!user) return res.status(404).json({ error: "User not found." });

    if (user._id.toString() !== req.user._id.toString())
      return res.status(404).json({ error: "Unauthorized to create post." });
    const maxLength = 500;

    if (text.length > maxLength) {
      return res.status(404).json({
        error: `text length should be less than ${maxLength} characters.`,
      });
    }

    function extractHashtags(tweetText) {
      const regex = /#\w+/g;
      const hashtagsArray = tweetText.match(regex) || [];
      hashtags = hashtagsArray.map((hashtag) => hashtag.slice(1));
    }
    extractHashtags(text);
    // console.log(hashtags);
    if (img.includes("video/")) {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(
          img,
          {
            resource_type: "video",
          },
          (error, result) => {
            if (error) {
              reject(error);
            }
            resolve(result);
          }
        );
      });
      c;
      img = result.secure_url;
    } else if (img.includes("image/")) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({ postedBy, text, img, hashtags });
    await newPost.save();
    // console.log(newPost);
    newPost.hashtags.forEach((hashtag) => {
      HashTags.findOneAndUpdate(
        { hashtag: hashtag },
        { $push: { posts: newPost._id } },
        { upsert: true }
      ).exec();
    });
    return res.status(201).json(newPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in Create post: ", error.message);
  }
};

const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not Found." });
    }

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in get post: ", error.message);
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: "Post not Found." });
    }
    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "Unauthorized user to delete this post." });
    }
    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }
    await Post.findByIdAndDelete(req.params.postId);
    HashTags.updateMany(
      { posts: req.params.postId },
      { $pull: { posts: req.params.postId } }
    ).exec();
    res.status(200).json({ message: "Post Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in delete post: ", error.message);
  }
};

const deleteReply = async (req, res) => {
  try {
    const _replyId = req.params.replyId;
    const _postId = req.params.postId;

    const post = await Post.findById(_postId);
    // console.log(_replyId);
    if (!post) {
      return res.status(404).json({ error: "Post Not found" });
    }
    const filteredPost = await post.replies.filter(
      (reply) => reply._id.toString() !== _replyId
    );
    post.replies = filteredPost;

    // console.log(filteredPost.length, "----", post.replies.length);

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in delete reply: ", error.message);
  }
};

const likeUnlikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post Not found" });
    }
    const userLikedPost = post.likes.includes(userId);
    if (userLikedPost) {
      // Unlike the post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      res.status(200).json({ message: "Post unliked successfully" });
    } else {
      // Like the post
      post.likes.push(userId);
      await post.save();
      res.status(200).json({ message: "Post liked successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in Like post: ", error.message);
  }
};

const replyToPost = async (req, res) => {
  try {
    const { text } = req.body;
    const { postId } = req.params;
    const userId = req.user._id;
    const userProfilePic = req.user.profilePic;
    const username = req.user.username;
    const createdAt = Date.now();

    if (!text) {
      return res
        .status(400)
        .json({ error: "Reply should have some text it can't be empty." });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post Not found" });
    }
    const reply = { userId, text, username, userProfilePic, createdAt };
    post.replies.push(reply);
    await post.save();
    res.status(200).json(post.replies);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in Reply to post: ", error.message);
  }
};

const getFeedPost = async (req, res) => {
  try {
    let page = req.params.page;
    let resultsPerPage = 5;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    const following = user.following;
    const feedPosts = await Post.find({ postedBy: { $in: following } })
      .sort({
        createdAt: -1,
      })
      .skip(page * resultsPerPage)
      .limit(resultsPerPage);
    // .limit(10);    //this is to get max 10 posts.
    // if (!feedPosts[0]) {
    //   res.status(200).json({ finish: true });
    // }
    res.status(200).json(feedPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in feed post: ", error.message);
  }
};

const getUserPost = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    const posts = await Post.find({ postedBy: user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in get user posts: ", error.message);
  }
};

const getHashtagPosts = async (req, res) => {
  try {
    const { hashtagText } = req.params;
    const hashtagPost = await Post.find({ hashtags: hashtagText }).sort({
      createdAt: -1,
    });
    res.status(200).json(hashtagPost);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in get hashtag posts: ", error.message);
  }
};

export {
  createPost,
  getPost,
  deletePost,
  likeUnlikePost,
  replyToPost,
  getFeedPost,
  getUserPost,
  deleteReply,
  getHashtagPosts,
};
