const User = require("../models/userModel");
const Task = require("../models/taskModel");
const Team = require("../models/teamModel");
const Log = require("../models/logModel");

// Lấy danh sách tất cả users (chỉ admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password")
      .select("username email role avatar createdAt");
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cập nhật role user (chỉ admin)
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !["admin", "user"].includes(role)) {
      return res.status(400).json({ message: "Role không hợp lệ" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await Log.create({
      action: "admin_update_role",
      userId: req.user.id,
      details: `Admin đã cập nhật role của ${user.email} thành ${role}`
    });

    res.json({ message: "Cập nhật role thành công", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa user (chỉ admin)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // Không cho phép admin tự xóa chính mình
    if (userToDelete._id.toString() === req.user.id) {
      return res.status(400).json({ message: "Không thể tự xóa chính mình" });
    }

    // Xóa tất cả tasks của user
    await Task.updateMany(
      { userId: userToDelete._id },
      { isDeleted: true }
    );

    // Xóa user khỏi các team
    await Team.updateMany(
      { "members.userId": userToDelete._id },
      { $pull: { members: { userId: userToDelete._id } } }
    );

    // Xóa user
    await User.findByIdAndDelete(userId);

    await Log.create({
      action: "admin_delete_user",
      userId: req.user.id,
      details: `Admin đã xóa user: ${userToDelete.email}`
    });

    res.json({ message: "Đã xóa user thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
