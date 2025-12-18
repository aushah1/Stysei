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
    images: {
      type: Array,
      default: [
        "/images/img1.jpeg",
        "/images/img2.jpeg",
        "/images/img3.jpeg",
        "/images/img4.jpeg",
        "/images/img5.jpeg",
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
