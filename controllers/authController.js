const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    return res.status(201).json({ message: "Register success" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và password" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      "secretkey",
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login success",
      token
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Xác thực token với Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name: username, picture: avatar } = payload;
    
    // Tìm hoặc tạo mới User
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        username,
        email,
        googleId,
        avatar
      });
      await user.save();
    } else if (!user.googleId) {
      // Nếu user đã đăng ký bằng email trước đó, cập nhật thêm googleId
      user.googleId = googleId;
      user.avatar = avatar;
      await user.save();
    }
    
    // Tạo JWT token của hệ thống
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      "secretkey",
      { expiresIn: "1d" }
    );
    
    return res.json({
      message: "Google login success",
      token
    });
  } catch (error) {
    return res.status(500).json({ message: "Xác thực Google thất bại", error: error.message });
  }
};