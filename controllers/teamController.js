const Team = require("../models/teamModel");
const User = require("../models/userModel");
const Log = require("../models/logModel");

// Kiểm tra user có quyền admin trong team hoặc là owner
const isTeamAdmin = (team, userId) => {
  const member = team.members.find(m => m.userId.toString() === userId);
  return member && member.role === 'admin';
};

exports.createTeam = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Team name is required" });

    // 1. Tạo Team
    const team = new Team({
      name,
      ownerId: req.user.id,
      members: [{ userId: req.user.id, role: "admin" }]
    });
    await team.save();

    // 2. Ghi Log
    await Log.create({
      action: "created_team",
      userId: req.user.id,
      taskId: null,
      details: `Đã tạo nhóm mới: ${name}`
    });

    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyTeams = async (req, res) => {
  try {
    const userId = req.user.id;
    const teams = await Team.find({
      $or: [{ ownerId: userId }, { "members.userId": userId }]
    }).populate("members.userId", "username email avatar");

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email, role = "member" } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Admin hệ thống hoặc owner/member admin của team mới có quyền
    if (!isAdmin && team.ownerId.toString() !== userId && !isTeamAdmin(team, userId)) {
      return res.status(403).json({ message: "Chỉ Leader hoặc Admin mới có quyền thêm thành viên" });
    }

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: "Không tìm thấy người dùng với email này" });

    // Kiểm tra xem đã có trong nhóm chưa
    const isMember = team.members.some(member => member.userId.toString() === userToAdd._id.toString());
    if (isMember) return res.status(400).json({ message: "Người này đã ở trong nhóm" });

    // Chỉ owner hoặc admin mới được set role admin cho member khác
    const canAssignAdmin = isAdmin || team.ownerId.toString() === userId || isTeamAdmin(team, userId);
    const memberRole = (role === "admin" && canAssignAdmin) ? "admin" : "member";

    team.members.push({ userId: userToAdd._id, role: memberRole });
    await team.save();

    res.json({ message: "Thêm thành viên thành công", team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { teamId, memberId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Admin hệ thống hoặc owner mới có quyền xóa member
    if (!isAdmin && team.ownerId.toString() !== userId) {
      return res.status(403).json({ message: "Chỉ Leader mới có quyền xóa thành viên" });
    }

    if (memberId === team.ownerId.toString()) return res.status(400).json({ message: "Không thể xóa Leader khỏi nhóm" });
    if (memberId === req.user.id && !isAdmin) return res.status(400).json({ message: "Không thể tự xóa bản thân khỏi nhóm" });

    team.members = team.members.filter(member => member.userId.toString() !== memberId);
    await team.save();

    res.json({ message: "Đã xóa thành viên khỏi nhóm", team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa team - chỉ admin hoặc owner
exports.deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Chỉ admin hệ thống hoặc owner mới được xóa team
    if (!isAdmin && team.ownerId.toString() !== userId) {
      return res.status(403).json({ message: "Chỉ admin hoặc owner mới có quyền xóa team" });
    }

    // Xóa team và cập nhật tasks liên quan
    await Team.findByIdAndDelete(teamId);
    await Task.updateMany(
      { teamId: teamId },
      { teamId: null }
    );

    await Log.create({
      action: "deleted_team",
      userId: req.user.id,
      details: `Đã xóa team: ${team.name}`
    });

    res.json({ message: "Đã xóa team thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
