var express = require("express");
var router = express.Router();
var multer = require("multer");
var upload = multer({ dest: "./uploads" });
var User = require("../models/user");
var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
const { check, validationResult } = require("express-validator/check");

passport.use(
  new LocalStrategy(function (username, password, done) {
    User.getUserByUsername(username, function (err, user) {
      if (err) throw err;
      if (!user) {
        return done(null, false, { message: "unknown user" });
      }
      User.comparePassword(password, user.password, function (err, isMatch) {
        if (err) return done(err);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: "Invalid Password" });
        }
      });
    });
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.getUserById(id, function (err, user) {
    done(err, user);
  });
});

/* GET users listing. */

router.get("/", async function (req, res, next) {
  if (req.isAuthenticated()) {
    await User.getUsers((users) => {
      res.render("members", { users, title: "Members" });
    });
  } else res.redirect("/users/login");
});

router.get("/register", function (req, res, next) {
  res.render("register", { title: "Register", form: {} });
});
router.get("/login", function (req, res, next) {
  res.render("login", { title: "Login" });
});
router.get("/edit/:id", async function (req, res, next) {
  if (req.user?.role !== "admin") {
    req.flash("Not authorized");
    res.redirect("/");
    return;
  }
  User.getUserById(req.params.id, function (err, user) {
    res.render("edit", {
      title: "Edit",
      form: {
        id: user._id,
        name: user.name,
        email: user.email,
        uname: user.uname,
        contact: user.contact,
      },
    });
  });
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/users/login",
    failureFlash: "Invalid Credentials",
  }),
  function (req, res) {
    req.flash("success", "You are now logged in");
    res.redirect("/");
  }
);

router.post(
  "/register",
  upload.single("profile"),
  [
    check("name", "Name is empty!! Required").not().isEmpty(),
    check("email", "Email required").not().isEmpty(),
    check("contact", "contact length should be 10")
      .not()
      .isEmpty()
      .isLength({ max: 10 }),
  ],
  async function (req, res, next) {
    var form = {
      person: req.body.name,
      email: req.body.email,
      contact: req.body.contact,
      uname: req.body.username,
      pass: req.body.password,
    };
    const errr = validationResult(req);
    if (!errr.isEmpty()) {
      res.render("register", { errors: errr.errors, form: form });
    } else {
      if (req.body.password !== req.body.cpassword) {
        res.render("register", {
          errors: [{ msg: "Passwords not matched" }],
          form: form,
        });
        return;
      }
      var name = req.body.name;
      var email = req.body.email;
      var uname = req.body.username;
      var password = req.body.password;
      var contact = req.body.contact;
      if (req.file) {
        var profileimage = req.file.filename;
      } else {
        var profileimage = null;
      }
      try {
        var newUser = new User({
          name: name,
          email: email,
          password: password,
          profileimage: profileimage,
          uname: uname,
          contact: contact,
        });
        await User.createUser(newUser);
        res.location("/");
        res.redirect("/users/login");
      } catch (e) {
        res.render("register", {
          errors: [
            { msg: e.code === 11000 ? "User already exists" : e.toString() },
          ],
          form: form,
        });
      }
    }
  }
);
router.get("/logout", function (req, res) {
  req.logout(() => {
    req.flash("success", "You are now logged out");
    res.redirect("/users/login");
  });
});

router.post("/delete/:id", function (req, res) {
  const id = req.params.id;
  if (req.user?.role !== "admin") {
    req.flash("Not authorized");
    res.redirect("/");
    return;
  }

  User.deleteUser(id, () => {
    res.redirect("/users");
  });
});

router.post(
  "/edit/:id",
  [
    check("name", "Name is empty!! Required").not().isEmpty(),
    check("email", "Email required").not().isEmpty(),
    check("contact", "contact length should be 10")
      .not()
      .isEmpty()
      .isLength({ max: 10 }),
  ],
  async function (req, res) {
    if (req.user?.role !== "admin") {
      req.flash("Not authorized");
      res.redirect("/");
      return;
    }
    const id = req.params.id;
    const errr = validationResult(req);
    if (!errr.isEmpty()) {
      res.render("edit", { errors: errr.errors, form: req.body });
    } else {
      try {
        await User.editUser(id, req.body);
        res.redirect("/users");
      } catch (e) {
        res.render("edit", {
          errors: [
            {
              msg: e.code === 11000 ? "Duplicate username/email" : e.toString(),
            },
          ],
          form: form,
        });
      }
    }
  }
);
module.exports = router;
