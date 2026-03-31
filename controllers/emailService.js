const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

const sendDeadlineEmail = async (toEmail, task) => {
  try {
    const deadlineStr = new Date(task.deadline).toLocaleString("vi-VN");
    
    const mailOptions = {
      from: `"Smart Task Manager" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: `[CẮP BÁCH] Task của bạn sắp hết hạn: ${task.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8f9fa;">
          <h2 style="color: #dc3545;">⚠️ Cảnh báo Deadline</h2>
          <p>Xin chào,</p>
          <p>Task <strong>"${task.title}"</strong> của bạn sắp đến hạn chót.</p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 5px solid #ffc107; margin: 15px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Hạn chót:</strong> <span style="color: #d63384; font-weight: bold;">${deadlineStr}</span></p>
            <p style="margin: 0;"><strong>Độ ưu tiên:</strong> ${task.priority.toUpperCase()}</p>
          </div>
          <p>Vui lòng đăng nhập vào ứng dụng để xử lý task này trước khi quá hạn.</p>
          <br>
          <p style="color: #6c757d; font-size: 0.9em;">Trân trọng,<br>Hệ thống Smart Task Manager</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Đã gửi email nhắc nhở deadline cho ${toEmail} (Task: ${task.title})`);
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
  }
};

module.exports = {
  sendDeadlineEmail
};
