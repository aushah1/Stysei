const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const userModel = require("./models/user");
const todoModel = require("./models/todo");
const boardModel = require("./models/board");
const notesModel = require("./models/notes");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const user = require("./models/user");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");
const upload = require("./config/multerconfig");

const app = express();
const port = 3000;

mongoose
  .connect("mongodb://localhost:27017/Study")
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Connection error:", err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(cookieParser());

const isLoggedin = (req, res, next) => {
  if (!req.cookies.token) {
    return res.redirect("/");
  } else {
    try {
      let data = jwt.verify(req.cookies.token, "shhhhh");
      req.user = data;
      next();
    } catch (err) {
      res.redirect("/");
    }
  }
};

// -------LOGIN/SIGNUP---------

app.get("/", (req, res) => {
  res.render("index");
});
app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  let user = await userModel.findOne({ email });
  if (!user) {
    return res.send("User does not exist");
  }

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      const token = jwt.sign({ email, _id: user._id }, "shhhhh");
      res.cookie("token", token);
      return res.redirect("/home");
    }

    return res.send("Something went wrong");
  });
});

app.post("/create", async (req, res) => {
  let { name, email, password } = req.body;
  let exsistingUser = await userModel.findOne({ email });
  if (exsistingUser) {
    res.send("User already exists");
  }
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {
      let user = await userModel.create({
        name,
        email,
        password: hash,
      });
      const token = jwt.sign({ email, _id: user._id }, "shhhhh");
      res.cookie("token", token);
      res.redirect("/home");
    });
  });
});

//-----------HOME-----------------

app.get("/home", isLoggedin, (req, res) => {
  res.render("home");
});

//-----------TASKS-----------------

app.get("/tasks", isLoggedin, async (req, res) => {
  let tasks = await todoModel.find({ userId: req.user._id });
  res.render("tasks", { tasks });
});

app.post("/tasks/create", isLoggedin, async (req, res) => {
  let { timing, task } = req.body;
  let userId = req.user._id;
  await todoModel.create({ timing, task, userId });
  res.redirect("/tasks");
});
app.post("/tasks/status/:id", isLoggedin, async (req, res) => {
  const task = await todoModel.findById(req.params.id);
  if (task) {
    task.isCompleted = !task.isCompleted;
    await task.save();
  }

  res.redirect(`/tasks`);
});
app.post("/tasks/delete/:id", isLoggedin, async (req, res) => {
  await todoModel.findOneAndDelete({ _id: req.params.id });
  res.redirect(`/tasks`);
});
app.post("/tasks/edit/:id", isLoggedin, async (req, res) => {
  let { timing, task } = req.body;
  await todoModel.findOneAndUpdate(
    { _id: req.params.id },
    { $set: { timing, task } },
    { new: true }
  );
  res.redirect(`/tasks`);
});

//-----------TIMER-----------------

app.get("/timer", isLoggedin, (req, res) => {
  res.render("timer");
});

//-----------BOARD-----------------

app.get("/board", isLoggedin, async (req, res) => {
  let board = await boardModel.findOne({ userId: req.user._id });
  if (!board) {
    board = new boardModel({ userId: req.user._id, text: "" });
    await board.save();
  }
  res.render("board", { boardText: board.text });
});
app.post("/board/save", isLoggedin, async (req, res) => {
  let board = await boardModel.findOne({ userId: req.user._id });
  if (!board) {
    board = new boardModel({ userId: req.user._id, text: req.body.text });
  } else {
    board.text = req.body.text;
    board.updatedAt = Date.now();
  }
  await board.save();
  res.end();
});

//-----------NOTES-----------------

app.get("/notes", isLoggedin, async (req, res) => {
  const notes = await notesModel
    .find({ userId: req.user._id })
    .sort({ date: -1 });

  res.render("notes", { notes });
});
app.post(
  "/upload-note",
  isLoggedin,
  upload.single("note"),
  async (req, res) => {
    try {
      const file = req.file;

      const name = req.body.name
        ? req.body.name
        : file.originalname.split(".")[0];
      if (!file) return res.redirect("/notes");

      await notesModel.create({
        name,
        filePath: "uploads/" + file.filename,
        userId: req.user._id,
      });
      res.redirect("/notes");
    } catch (err) {
      console.log(err);
      res.status(500).send("Upload Failed");
    }
  }
);
app.post("/notes-delete/:id", async (req, res) => {
  let id = req.params.id;
  await notesModel.findOneAndDelete({ _id: id });
  res.end();
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
