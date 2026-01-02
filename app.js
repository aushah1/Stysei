require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const userModel = require("./models/user");
const todoModel = require("./models/todo");
const boardModel = require("./models/board");
const notesModel = require("./models/notes");
const audioModel = require("./models/audio");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const upload = require("./config/multerconfig");
const isLoggedin = require("./middleware/isLoggedin");
const session = require("express-session");
const flash = require("connect-flash");
const cloudinary = require("./config/cloudinary");

const app = express();
const port = process.env.PORT || 3000;

// ------------------ DB ------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Connection error:", err));

// ------------------ MIDDLEWARE ------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ------------------ AUTH ------------------
app.get("/", (req, res) => {
  res.render("index");
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    req.flash("error", "All fields are required");
    return res.redirect("/");
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    req.flash("error", "User does not exist");
    return res.redirect("/");
  }

  bcrypt.compare(password, user.password, (err, result) => {
    if (!result) {
      req.flash("error", "Invalid credentials");
      return res.redirect("/");
    }

    const token = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.SECRET
    );
    res.cookie("token", token);
    req.flash("success", "Logged in successfully");
    res.redirect("/home");
  });
});

app.post("/create", async (req, res) => {
  let { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    req.flash("error", "All fields are required");
    return res.redirect("/");
  }

  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    req.flash("error", "User already exists");
    return res.redirect("/");
  }

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const user = await userModel.create({
        name,
        email,
        password: hash,
      });

      const token = jwt.sign(
        { email: user.email, _id: user._id },
        process.env.SECRET
      );
      res.cookie("token", token);
      req.flash("success", "Account created successfully");
      res.redirect("/home");
    });
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  req.flash("success", "Logged out");
  res.redirect("/");
});

// ------------------ HOME ------------------
app.get("/home", isLoggedin, (req, res) => {
  res.render("home");
});

app.get("/api/quote", async (req, res) => {
  try {
    const response = await fetch("https://zenquotes.io/api/random");
    const data = await response.json();
    res.json({
      quote: data[0].q,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch ZenQuote" });
  }
});

// ------------------ USER EDIT ------------------

app.post(
  "/user/edit/:id",
  isLoggedin,
  upload.single("profilePic"),
  async (req, res) => {
    try {
      const { name, bio } = req.body;

      if (!name?.trim()) {
        req.flash("error", "Name cannot be empty");
        return res.redirect(req.get("referer"));
      }

      let updateData = { name, bio };

      if (req.file) {
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "profile_pics" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(req.file.buffer);
        });

        updateData.profilePic = uploadResult.secure_url;
      }

      await userModel.findByIdAndUpdate(req.params.id, updateData);

      req.flash("success", "Profile updated");
      res.redirect(req.get("referer"));
    } catch (err) {
      console.error(err);
      req.flash("error", "Something went wrong");
      res.redirect(req.get("referer"));
    }
  }
);

// ------------------ TASKS ------------------
app.get("/tasks", isLoggedin, async (req, res) => {
  const tasks = await todoModel.find({ userId: req.user._id });
  res.render("tasks", { tasks });
});

app.post("/tasks/create", isLoggedin, async (req, res) => {
  const { timing, task } = req.body;

  if (!task?.trim()) {
    req.flash("error", "Task cannot be empty");
    return res.redirect("/tasks");
  }

  await todoModel.create({ timing, task, userId: req.user._id });
  req.flash("success", "Task added");
  res.redirect("/tasks");
});

app.post("/tasks/edit/:id", isLoggedin, async (req, res) => {
  const { timing, task } = req.body;

  if (!task?.trim()) {
    req.flash("error", "Task cannot be empty");
    return res.redirect("/tasks");
  }

  await todoModel.findByIdAndUpdate(req.params.id, { timing, task });
  req.flash("success", "Task updated");
  res.redirect("/tasks");
});

app.post("/tasks/status/:id", isLoggedin, async (req, res) => {
  const task = await todoModel.findById(req.params.id);
  if (task) {
    task.isCompleted = !task.isCompleted;
    await task.save();
  }
  res.redirect("/tasks");
});

app.post("/tasks/delete/:id", isLoggedin, async (req, res) => {
  await todoModel.findByIdAndDelete(req.params.id);
  req.flash("success", "Task deleted");
  res.redirect("/tasks");
});

//-------------------TIMER--------------------------

app.get("/timer", isLoggedin, (req, res) => {
  res.render("timer");
});

// ------------------ BOARD ------------------
app.get("/board", isLoggedin, async (req, res) => {
  let board = await boardModel.findOne({ userId: req.user._id });
  if (!board) {
    board = await boardModel.create({ userId: req.user._id, text: "" });
  }
  res.render("board", { boardText: board.text });
});

app.post("/board/save", isLoggedin, async (req, res) => {
  if (!req.body.text?.trim()) {
    req.flash("error", "Board cannot be empty");
    return res.end();
  }

  await boardModel.findOneAndUpdate(
    { userId: req.user._id },
    { text: req.body.text, updatedAt: Date.now() }
  );
  res.end();
});

// ------------------ NOTES ------------------
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
    if (!req.file) {
      req.flash("error", "No file selected");
      return res.redirect("/notes");
    }

    const name = req.body.name?.trim() || req.file.originalname.split(".")[0];

    await notesModel.create({
      name,
      filePath: "uploads/" + req.file.filename,
      userId: req.user._id,
    });

    req.flash("success", "Note uploaded");
    res.redirect("/notes");
  }
);

app.post("/notes-delete/:id", isLoggedin, async (req, res) => {
  await notesModel.findByIdAndDelete(req.params.id);
  res.end();
});

// ------------------ AUDIO ------------------
app.get("/audios", isLoggedin, async (req, res) => {
  const audios = await audioModel
    .find({ userId: req.user._id })
    .sort({ createdAt: -1 });

  res.render("audios", { audios });
});

app.post(
  "/upload-audio",
  isLoggedin,
  upload.single("audio"),
  async (req, res) => {
    if (!req.file) {
      req.flash("error", "No audio selected");
      return res.redirect("/audios");
    }

    const name = req.body.name?.trim() || req.file.originalname.split(".")[0];

    await audioModel.create({
      name,
      filePath: "uploads/" + req.file.filename,
      userId: req.user._id,
    });

    req.flash("success", "Audio uploaded");
    res.redirect("/audios");
  }
);

app.post("/audios-delete/:id", isLoggedin, async (req, res) => {
  const audio = await audioModel.findById(req.params.id);

  if (audio) {
    const fullPath = path.join(__dirname, "public", audio.filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    await audio.deleteOne();
  }

  res.end();
});

// ------------------ SERVER ------------------
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
