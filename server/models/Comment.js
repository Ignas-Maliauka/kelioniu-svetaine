import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

export default mongoose.models.Comment || mongoose.model("Comment", commentSchema);
