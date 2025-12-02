const jwt = require("jsonwebtoken");
const userModel = require("../models/user");

module.exports = async function isLoggedin(req, res, next) {
  if (!req.cookies.token) {
    return res.redirect("/");
  } else {
    try {
      const data = jwt.verify(req.cookies.token, "shhhhh");
      const fullUser = await userModel.findById(data._id).lean();

      req.user = fullUser;
      res.locals.user = fullUser;
      return next();
    } catch (err) {
      res.redirect("/");
    }
  }
};
