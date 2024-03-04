import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generatetokeandsetcookie from "../utils/helpers/generatetokeandsetcookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import Post from "../models/postModel.js";
import HashTags from "../models/hashtagModal.js";
const signupUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ error: "User already exist" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const Newuser = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });
    await Newuser.save();
    if (Newuser) {
      generatetokeandsetcookie(Newuser._id, res);
      res.status(200).json({
        _id: Newuser._id,
        name: Newuser.name,
        email: Newuser.email,
        username: Newuser.username,
        bio: Newuser.bio,
        profilePic: Newuser.profilePic,
      });
    } else {
      res.status(400).json({ error: "invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in signUp user: ", error.message);
  }
};
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );
    if (!user || !isPasswordCorrect) {
      return res.status(500).json({ error: "invalid username or passsword." });
    }

    generatetokeandsetcookie(user._id, res);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      bio: user.bio,
      profilePic: user.profilePic,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in login user: ", error.message);
  }
};

const logoutUser = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 1 });
    res.status(200).json({ message: "user Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in logout user: ", error.message);
  }
};

const followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userTomodify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);
    if (id === req.user._id.toString())
      return res
        .status(400)
        .json({ message: "You can't follow/unfollow yourself." });
    if (!userTomodify || !currentUser)
      return res.status(400).json({ error: "User not Found!" });

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      // Lets consider a case john wants to follow/unfollow jane.
      // it means user followss another user then we will unfollow the target person,For that we will remove the id of jane from the following array of john and will remove the id of john from the followers array of jane.
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } }); //This will modify following list of john
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } }); //This will modify followers list of jane
      res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      // In this case we will just do the opposite of the last if condition we will just ids to the following and followers list of john and jane respectively.
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } }); //This will modify following list of john
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } }); //This will modify followers list of jane
      res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in Follow unfollow user: ", error.message);
  }
};

const updateUser = async (req, res) => {
  const { name, email, username, password, bio } = req.body;
  let { profilePic } = req.body;
  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "User not found" });
    if (req.params.id !== userId.toString())
      return res
        .status(400)
        .json({ error: "You cannot update profile of other user" });
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
    }
    if (profilePic) {
      if (user.profilePic) {
        // If user has a old profile pic this will delete the old one profile pic from the cloudinary
        await cloudinary.uploader.destroy(
          user.profilePic.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(profilePic);
      profilePic = uploadedResponse.secure_url;
    }
    user.name = name || user.name;
    user.email = email || user.email;
    user.username = username || user.username;
    user.profilePic = profilePic || user.profilePic;
    user.bio = bio || user.bio;

    user = await user.save();

    // Find all posts that this user replied and update username and userProfilePic fields
    await Post.updateMany(
      { "replies.userId": userId },
      {
        $set: {
          "replies.$[reply].username": user.username,
          "replies.$[reply].userProfilePic": user.profilePic,
        },
      },
      { arrayFilters: [{ "reply.userId": userId }] }
    );

    // password should be null in response
    user.password = null;
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in Update user: ", error.message);
  }
};

const getUserProfile = async (req, res) => {
  // We will get user by either username or userId
  // query is either username or userId
  const { query } = req.params;
  try {
    let user;
    // checking if query is a user id
    if (mongoose.Types.ObjectId.isValid(query)) {
      user = await User.findOne({ _id: query })
        .select("-password")
        .select("-updatedAt");
    } else {
      // If query is username
      user = await User.findOne({ username: query })
        .select("-password")
        .select("-updatedAt");
    }

    if (!user) return res.status(400).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in get usesr profile: ", error.message);
  }
};

const getExploreUsers = async (req, res) => {
  try {
    const exploreUser = await User.find({});
    res.status(200).json(exploreUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in get explore user: ", error.message);
  }
};

const getSearchUsers = async (req, res) => {
  try {
    const { searchedUser } = req.params;
    const users = await User.find({
      username: { $regex: `^${searchedUser}`, $options: "i" },
    });
    const hashtags = await HashTags.find({
      hashtag: { $regex: `^${searchedUser}`, $options: "i" },
    });
    res.status(200).json({ users, hashtags });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("error in get search users : ", error.message);
  }
};
export {
  signupUser,
  loginUser,
  logoutUser,
  followUnfollowUser,
  updateUser,
  getUserProfile,
  getExploreUsers,
  getSearchUsers,
};
