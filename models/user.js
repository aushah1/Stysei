const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    bio: {
      type: String,
      default: "Your Bio",
    },
    profilePic: {
      type: String,
      default: "/images/profile.png",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
