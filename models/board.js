const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    text: String,
    userId: String,
  },
  { timestamps: true }
);
