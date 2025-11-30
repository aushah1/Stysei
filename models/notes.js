const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema(
  {
    title: String,
    filePath: String,
    userId: String,
  },
  { timestamps: true }
);
