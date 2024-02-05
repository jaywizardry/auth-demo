var express = require("express");
var perf = require("execution-time-async")();
var router = express.Router();
perf.config();

/* GET home page . */
router.get("/", ensureAuthenticated, function (req, res, next) {
  res.redirect("/users");
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

module.exports = router;
