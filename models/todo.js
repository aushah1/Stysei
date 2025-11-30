const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    time: String,
    description: String,
    iscompleted: {
      type: Boolean,
      default: false,
    },
    userId: String,
  },
  { timestamps: true }
);
module.exports = mongoose.model("Todo", todoSchema);
