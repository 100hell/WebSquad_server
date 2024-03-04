import mongoose from "mongoose";

const hashtagSchema = mongoose.Schema(
  {
    hashtag: {
      type: String,
      maxLength: 500,
    },
    posts: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Post",
      default: [],
    },
  },
  { timestamps: true }
);

const HashTags = mongoose.model("Hashtag", hashtagSchema);

export default HashTags;
