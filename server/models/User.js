const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      // Require password only if googleId is not set
      return !this.googleId;
    },
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  solanaWallet: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    required: true,
  },
  googleId: {
    type: String,
    default: null, // Allow null for password-based auth
  },
});

module.exports = mongoose.model("User", userSchema);
