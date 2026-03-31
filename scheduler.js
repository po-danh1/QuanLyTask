const cron = require("node-cron");
const Task = require("./models/taskModel");
const User = require("./models/userModel");
const { sendDeadlineEmail } = require("./controllers/emailService");

const startCronJobs = () => {
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
      }

    } catch (error) {
      console.error("❌ Lỗi khi chạy cron job:", error);
    }
  });

  console.log("🕒 Nhắc nhở deadline cron job đã được đặt lịch (chạy mỗi 1 tiếng).");
};

module.exports = startCronJobs;
