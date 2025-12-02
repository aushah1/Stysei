const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    timing: String,
    task: String,
    isCompleted: {
      type: Boolean,
      default: false,
    },
    userId: String,
  },
  { timestamps: true }
);
module.exports = mongoose.model("Todo", todoSchema);
