const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema(
  {
    name: String,
    filePath: String,
    userId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notes", notesSchema);
