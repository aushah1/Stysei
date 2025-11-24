const express = require("express");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("login");
});
app.get("/home", (req, res) => {
  res.render("home");
});
app.get("/tasks", (req, res) => {
  res.render("tasks");
});
app.get("/timer", (req, res) => {
  res.render("timer");
});
app.get("/board", (req, res) => {
  res.render("board");
});
app.get("/notes", (req, res) => {
  res.render("notes");
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
