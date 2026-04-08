const cron = require("node-cron");
const Task = require("./models/taskModel");
const User = require("./models/userModel");
const Notification = require("./models/notificationModel");
const { sendDeadlineEmail } = require("./controllers/emailService");

const startCronJobs = (io) => {
  // Chạy file này mỗi 1 giờ (phút 0 mỗi giờ)
  cron.schedule("0 * * * *", async () => {
    try {
      console.log("🕒 Running cron job to check deadline notifications...");
      const now = new Date();
      // Quét các task sắp đến hạn trong vòng 24 giờ tới
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Tìm các task: 
      // 1. Chưa hoàn thành, chưa xóa
      // 2. Deadline đang nằm trong 24h tới
      // 3. CHƯA được gửi email nhắc nhở
      const tasksToNotify = await Task.find({
        status: { $ne: "completed" },
        isDeleted: false,
        deadlineEmailSent: false,
        deadline: { $gte: now, $lte: in24h }
      });

      if (tasksToNotify.length === 0) {
        console.log("✅ Không có task nào cần gửi thông báo.");
        return;
      }

      for (const task of tasksToNotify) {
        // Tìm thông tin user để gửi mail
        const user = await User.findById(task.userId);
        if (user && user.email) {
          // Gửi mail cho user
          await sendDeadlineEmail(user.email, task);
          
          // Đánh dấu đã gửi
          task.deadlineEmailSent = true;
          await task.save();
        }

        // Tạo in-app notification cho chủ task
        const hoursLeft = Math.ceil((task.deadline - new Date()) / (1000 * 60 * 60));
        const notifMsg = hoursLeft <= 1 
          ? `Task "${task.title}" sắp đến hạn (dưới 1 giờ)!`
          : `Task "${task.title}" còn ${hoursLeft} giờ nữa là đến hạn`;
        
        // Notification cho user tạo task
        const notification = await Notification.create({
          userId: task.userId,
          title: "Task sắp đến hạn",
          message: notifMsg,
          type: "task",
          link: `/tasks/${task._id}`
        });
        
        // Emit socket event
        if (io) {
          io.to(task.userId.toString()).emit("notification", notification);
        }

        // Thông báo cho assignee nếu có và khác với user tạo task
        if (task.assigneeId && task.assigneeId.toString() !== task.userId.toString()) {
          const assigneeNotif = await Notification.create({
            userId: task.assigneeId,
            title: "Task được gán sắp đến hạn",
            message: notifMsg,
            type: "task",
            link: `/tasks/${task._id}`
          });
          
          if (io) {
            io.to(task.assigneeId.toString()).emit("notification", assigneeNotif);
          }
        }
      }

    } catch (error) {
      console.error("❌ Lỗi khi chạy cron job:", error);
    }
  });

  console.log("🕒 Nhắc nhở deadline cron job đã được đặt lịch (chạy mỗi 1 tiếng).");
};

module.exports = startCronJobs;
