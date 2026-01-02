const jwt = require("jsonwebtoken");
const userModel = require("../models/user");

module.exports = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      req.flash("error", "Please login first");
      return res.redirect("/");
    }

    const decoded = jwt.verify(token, process.env.SECRET);
    const user = await userModel.findById(decoded._id);

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/");
    }

    req.user = user;
    res.locals.user = user; // ⭐ THIS LINE FIXES EVERYTHING

    next();
  } catch (err) {
    req.flash("error", "Session expired. Please login again");
    return res.redirect("/");
  }
};
