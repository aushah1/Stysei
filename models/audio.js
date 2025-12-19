const mongoose = require("mongoose");

const audioSchema = new mongoose.Schema({
  name: { type: String, required: true },
  filePath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Audio", audioSchema);
