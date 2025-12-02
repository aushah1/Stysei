const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    text: String,
    userId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Board", boardSchema);
