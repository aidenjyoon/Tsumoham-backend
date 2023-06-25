import mongoose from "mongoose";

const user = new mongoose.Schema({
  twitchId: {
    required: false,
    type: String,
  },
  username: {
    required: true,
    type: String,
  },
});

export default mongoose.model("User", user);
