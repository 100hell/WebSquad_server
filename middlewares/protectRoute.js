import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    // console.log("mid user: ", token);

    if (!token) {
      return res.status(400).json({ message: "unauthorized user" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });

    console.log("error in middleware : ", error.message);
  }
};
export default protectRoute;
