var mongoose = require("mongoose");
var bcrypt = require("bcryptjs");
mongoose
  .connect("mongodb://localhost/login_database", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connection Established"))
  .catch((err) => console.log(err));
var db = mongoose.connection;
var userSchema = mongoose.Schema({
  name: {
    type: String,
    index: true,
  },
  password: {
    type: String,
  },
  email: {
    required: true,
    unique: true,
    type: String,
  },
  profileimage: {
    type: String,
  },
  uname: {
    type: String,
    required: true,
    unique: true,
  },
  contact: {
    type: Number,
  },
  role: {
    type: String,
  },
});
var User = (module.exports = mongoose.model("user", userSchema));
module.exports.getUserById = function (id, callback) {
  User.findById(id)
    .then((user) => {
      callback(null, user);
    })
    .catch((e) => {
      callback(e, null);
    });
};
module.exports.getUserByUsername = function (username, callback) {
  var query = { uname: username };
  User.findOne(query)
    .then((user) => {
      callback(null, user);
    })
    .catch((e) => console.log("error", e));
};

module.exports.getUsers = async function (callback) {
  const users = await User.find();
  callback(users);
};
module.exports.deleteUser = function (id, callback) {
  User.findByIdAndDelete(id).then(callback);
};
module.exports.comparePassword = function (candidatepassword, hash, callback) {
  bcrypt.compare(candidatepassword, hash, function (err, isMatch) {
    callback(null, isMatch);
  });
};
module.exports.createUser = async function (newUser) {
  //First created user is Admin. Other ones are normal members
  const existingUsersCount = await User.countDocuments({});
  if (existingUsersCount) newUser.role = "member";
  else newUser.role = "admin";
  const salt = await bcrypt.genSalt(10);

  const hash = await bcrypt.hash(newUser.password, salt);
  newUser.password = hash;
  try {
    const user = await newUser.save();
    return user;
  } catch (e) {
    throw e;
  }
};

module.exports.editUser = async function (id, body) {
  if (body.password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(body.password, salt);
    body.password = hash;
  }
  try {
    console.log(id, body);
    //return body;
    const user = await User.findOneAndUpdate(
      { _id: id },
      { $set: body },
      { new: true }
    );
    return user;
  } catch (e) {
    throw e;
  }
};
