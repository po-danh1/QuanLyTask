const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() { return !this.googleId; } // Mật khẩu bắt buộc nếu không đăng nhập bằng Google
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  avatar: {
    type: String,
    default: ""
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user"
  }
});

module.exports = mongoose.model("User", userSchema);