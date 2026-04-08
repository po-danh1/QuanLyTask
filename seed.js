/**
 * 🌱 SEED DATA SCRIPT - QuanLyTask
 * Tạo dữ liệu mẫu cho dự án bao gồm:
 * - 1 Admin + 4 Users
 * - 2 Teams
 * - 3 Projects
 * - 25 Tasks (đa dạng status, priority, deadline)
 * - Comments, SubTasks cho các tasks
 * - Time Logs
 * - Activity Logs
 *
 * Chạy: node seed.js
 * Mật khẩu tất cả: 123456
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Models
const User = require("./models/userModel");
const Team = require("./models/teamModel");
const Project = require("./models/projectModel");
const Task = require("./models/taskModel");
const Comment = require("./models/commentModel");
const Log = require("./models/logModel");
const TimeLog = require("./models/timeLogModel");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/NNPTUD";

const now = new Date();
const days = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ MongoDB Connected");

  // ================== CLEAR DỮ LIỆU CŨ ==================
  await Promise.all([
    User.deleteMany({}),
    Team.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
    Log.deleteMany({}),
    TimeLog.deleteMany({})
  ]);
  console.log("🗑️  Đã xóa dữ liệu cũ");

  // ================== TẠO USERS ==================
  const hash = await bcrypt.hash("123456", 10);

  const [admin, alice, bob, carol, dave] = await User.insertMany([
    {
      username: "Admin",
      email: "admin@smarttask.com",
      password: hash,
      role: "admin"
    },
    {
      username: "Alice Nguyen",
      email: "alice@smarttask.com",
      password: hash,
      role: "user"
    },
    {
      username: "Bob Tran",
      email: "bob@smarttask.com",
      password: hash,
      role: "user"
    },
    {
      username: "Carol Le",
      email: "carol@smarttask.com",
      password: hash,
      role: "user"
    },
    {
      username: "Dave Pham",
      email: "dave@smarttask.com",
      password: hash,
      role: "user"
    }
  ]);
  console.log("👤 Đã tạo 5 users (admin + 4 members)");

  // ================== TẠO TEAMS ==================
  const [teamFrontend, teamBackend] = await Team.insertMany([
    {
      name: "Frontend Team",
      ownerId: admin._id,
      members: [
        { userId: admin._id, role: "admin" },
        { userId: alice._id, role: "member" },
        { userId: bob._id, role: "member" }
      ]
    },
    {
      name: "Backend Team",
      ownerId: admin._id,
      members: [
        { userId: admin._id, role: "admin" },
        { userId: carol._id, role: "member" },
        { userId: dave._id, role: "member" }
      ]
    }
  ]);
  console.log("👥 Đã tạo 2 teams");

  // ================== TẠO PROJECTS ==================
  const [projEcommerce, projMobile, projInternal] = await Project.insertMany([
    {
      name: "E-Commerce Platform",
      description: "Xây dựng nền tảng thương mại điện tử đa kênh",
      ownerId: admin._id,
      teamId: teamFrontend._id,
      status: "active"
    },
    {
      name: "Mobile App v2",
      description: "Phát triển ứng dụng di động phiên bản 2.0",
      ownerId: admin._id,
      teamId: teamBackend._id,
      status: "active"
    },
    {
      name: "Internal Tools",
      description: "Các công cụ nội bộ cho đội ngũ vận hành",
      ownerId: admin._id,
      teamId: null,
      status: "active"
    }
  ]);
  console.log("📁 Đã tạo 3 projects");

  // ================== TẠO TASKS ==================
  const tasksData = [
    // ---- E-Commerce: Frontend Team ----
    {
      title: "Thiết kế UI trang chủ E-Commerce",
      description: "Tạo wireframe và mockup cho trang chủ, bao gồm hero banner, danh mục sản phẩm và footer.",
      priority: "high",
      status: "completed",
      deadline: days(-5),
      userId: admin._id,
      assigneeId: alice._id,
      teamId: teamFrontend._id,
      projectId: projEcommerce._id,
      subTasks: [
        { text: "Thiết kế hero section", completed: true },
        { text: "Thiết kế product grid", completed: true },
        { text: "Responsive mobile", completed: true }
      ]
    },
    {
      title: "Tích hợp thanh toán VNPay",
      description: "Kết nối API VNPay vào quy trình checkout, xử lý callback và cập nhật trạng thái đơn hàng.",
      priority: "high",
      status: "progress",
      deadline: days(3),
      userId: admin._id,
      assigneeId: bob._id,
      teamId: teamFrontend._id,
      projectId: projEcommerce._id,
      subTasks: [
        { text: "Đọc tài liệu API VNPay", completed: true },
        { text: "Tạo endpoint callback", completed: false },
        { text: "Test sandbox", completed: false }
      ]
    },
    {
      title: "Tối ưu SEO trang sản phẩm",
      description: "Áp dụng schema markup, meta tags, và cải thiện tốc độ load trang sản phẩm.",
      priority: "medium",
      status: "pending",
      deadline: days(10),
      userId: admin._id,
      assigneeId: alice._id,
      teamId: teamFrontend._id,
      projectId: projEcommerce._id,
      subTasks: [
        { text: "Thêm schema markup Product", completed: false },
        { text: "Tối ưu meta description", completed: false }
      ]
    },
    {
      title: "Hệ thống review sản phẩm",
      description: "Cho phép người dùng đánh giá sao và viết nhận xét về sản phẩm.",
      priority: "medium",
      status: "reviewing",
      deadline: days(1),
      userId: admin._id,
      assigneeId: bob._id,
      teamId: teamFrontend._id,
      projectId: projEcommerce._id,
      subTasks: [
        { text: "UI component rating stars", completed: true },
        { text: "API endpoint submit review", completed: true },
        { text: "Moderation system", completed: false }
      ]
    },
    {
      title: "Trang quản lý đơn hàng Admin",
      description: "Xây dựng dashboard admin để xem, lọc và cập nhật trạng thái đơn hàng theo thời gian thực.",
      priority: "high",
      status: "pending",
      deadline: days(14),
      userId: admin._id,
      assigneeId: alice._id,
      teamId: teamFrontend._id,
      projectId: projEcommerce._id,
      subTasks: [
        { text: "Thiết kế layout dashboard", completed: false },
        { text: "API lấy danh sách orders", completed: false },
        { text: "Filter & search orders", completed: false },
        { text: "Export CSV", completed: false }
      ]
    },

    // ---- Mobile App: Backend Team ----
    {
      title: "Xây dựng API Authentication JWT",
      description: "Thiết kế và triển khai hệ thống xác thực JWT cho ứng dụng mobile với refresh token.",
      priority: "high",
      status: "completed",
      deadline: days(-10),
      userId: admin._id,
      assigneeId: carol._id,
      teamId: teamBackend._id,
      projectId: projMobile._id,
      subTasks: [
        { text: "Login / Register endpoint", completed: true },
        { text: "Refresh token mechanism", completed: true },
        { text: "Logout & token blacklist", completed: true }
      ]
    },
    {
      title: "Push Notification Service",
      description: "Tích hợp Firebase Cloud Messaging để gửi thông báo đẩy tới người dùng mobile.",
      priority: "high",
      status: "progress",
      deadline: days(5),
      userId: admin._id,
      assigneeId: dave._id,
      teamId: teamBackend._id,
      projectId: projMobile._id,
      subTasks: [
        { text: "Cấu hình Firebase project", completed: true },
        { text: "Lưu device token vào DB", completed: true },
        { text: "Tạo service gửi notification", completed: false },
        { text: "Test trên iOS & Android", completed: false }
      ]
    },
    {
      title: "WebSocket real-time chat",
      description: "Xây dựng tính năng nhắn tin thời gian thực giữa người dùng trong ứng dụng.",
      priority: "medium",
      status: "pending",
      deadline: days(20),
      userId: admin._id,
      assigneeId: carol._id,
      teamId: teamBackend._id,
      projectId: projMobile._id,
      subTasks: [
        { text: "Setup Socket.IO server", completed: false },
        { text: "Chat room management", completed: false },
        { text: "Message persistence", completed: false }
      ]
    },
    {
      title: "Database schema optimization",
      description: "Review và tối ưu các index MongoDB để cải thiện performance query.",
      priority: "medium",
      status: "completed",
      deadline: days(-3),
      userId: admin._id,
      assigneeId: dave._id,
      teamId: teamBackend._id,
      projectId: projMobile._id,
      subTasks: [
        { text: "Phân tích slow queries", completed: true },
        { text: "Tạo compound indexes", completed: true },
        { text: "Benchmark before/after", completed: true }
      ]
    },
    {
      title: "API Rate Limiting & Security",
      description: "Triển khai rate limiting, helmet.js và bảo vệ các endpoint khỏi DDoS và brute-force.",
      priority: "high",
      status: "reviewing",
      deadline: days(2),
      userId: admin._id,
      assigneeId: carol._id,
      teamId: teamBackend._id,
      projectId: projMobile._id,
      subTasks: [
        { text: "Cài express-rate-limit", completed: true },
        { text: "Cấu hình helmet", completed: true },
        { text: "Pentest cơ bản", completed: false }
      ]
    },

    // ---- Internal Tools ----
    {
      title: "Hệ thống báo cáo hàng tuần",
      description: "Tạo script tự động tổng hợp và gửi báo cáo hiệu suất team qua email cuối tuần.",
      priority: "low",
      status: "pending",
      deadline: days(7),
      userId: admin._id,
      assigneeId: null,
      teamId: null,
      projectId: projInternal._id,
      subTasks: [
        { text: "Viết query tổng hợp dữ liệu", completed: false },
        { text: "Template email HTML", completed: false },
        { text: "Cronjob hàng tuần", completed: false }
      ]
    },
    {
      title: "Monitoring & Alerting Dashboard",
      description: "Tích hợp công cụ monitoring server để theo dõi CPU, RAM, và lỗi ứng dụng.",
      priority: "medium",
      status: "progress",
      deadline: days(15),
      userId: admin._id,
      assigneeId: null,
      teamId: null,
      projectId: projInternal._id,
      subTasks: [
        { text: "Setup PM2 monitoring", completed: true },
        { text: "Cấu hình alerts", completed: false }
      ]
    },

    // ---- Personal Tasks (admin) ----
    {
      title: "Nghiên cứu GraphQL",
      description: "Tìm hiểu GraphQL và đánh giá khả năng chuyển đổi từ REST API hiện tại.",
      priority: "low",
      status: "pending",
      deadline: days(30),
      userId: admin._id,
      assigneeId: null,
      teamId: null,
      projectId: null,
      subTasks: [
        { text: "Đọc tài liệu chính thức", completed: false },
        { text: "Build POC nhỏ", completed: false }
      ]
    },
    {
      title: "Viết tài liệu API v2",
      description: "Cập nhật Swagger documentation cho toàn bộ các endpoint, thêm examples và response schema.",
      priority: "medium",
      status: "progress",
      deadline: days(8),
      userId: admin._id,
      assigneeId: null,
      teamId: null,
      projectId: null,
      subTasks: [
        { text: "Auth endpoints", completed: true },
        { text: "Task endpoints", completed: true },
        { text: "Team endpoints", completed: false },
        { text: "Project endpoints", completed: false }
      ]
    },
    {
      title: "Code review quy trình CI/CD",
      description: "Thiết lập GitHub Actions pipeline cho auto-test và deploy khi merge vào main.",
      priority: "high",
      status: "completed",
      deadline: days(-7),
      userId: admin._id,
      assigneeId: null,
      teamId: null,
      projectId: null,
      subTasks: [
        { text: "Viết GitHub Actions workflow", completed: true },
        { text: "Test pipeline", completed: true },
        { text: "Deploy staging environment", completed: true }
      ]
    },
    {
      title: "Triển khai Dark Mode",
      description: "Thêm tùy chọn dark/light mode cho dashboard, lưu preference vào localStorage.",
      priority: "low",
      status: "pending",
      deadline: days(25),
      userId: alice._id,
      assigneeId: alice._id,
      teamId: teamFrontend._id,
      projectId: projEcommerce._id,
      subTasks: [
        { text: "Design tokens dark mode", completed: false },
        { text: "Toggle component", completed: false }
      ]
    },

    // ---- OVERDUE TASKS (để test cảnh báo) ----
    {
      title: "Fix bug thanh toán trên iOS Safari",
      description: "Người dùng iOS Safari báo lỗi màn hình trắng sau khi nhấn nút thanh toán.",
      priority: "high",
      status: "pending",
      deadline: days(-2),
      userId: admin._id,
      assigneeId: bob._id,
      teamId: teamFrontend._id,
      projectId: projEcommerce._id,
      subTasks: [
        { text: "Reproduce bug trên iOS", completed: true },
        { text: "Fix CSS compatibility", completed: false }
      ]
    },
    {
      title: "Migration database production",
      description: "Chạy migration script để cập nhật schema mới trên môi trường production.",
      priority: "high",
      status: "pending",
      deadline: days(-1),
      userId: admin._id,
      assigneeId: carol._id,
      teamId: teamBackend._id,
      projectId: projMobile._id,
      subTasks: [
        { text: "Backup database trước migration", completed: true },
        { text: "Chạy migration script", completed: false },
        { text: "Verify data integrity", completed: false }
      ]
    },

    // ---- More tasks for variety ----
    {
      title: "A/B Testing checkout flow",
      description: "Thiết lập thử nghiệm A/B để so sánh 2 variant thanh toán và đo conversion rate.",
      priority: "medium",
      status: "pending",
      deadline: days(18),
      userId: admin._id,
      assigneeId: alice._id,
      teamId: teamFrontend._id,
      projectId: projEcommerce._id,
      subTasks: []
    },
    {
      title: "Tích hợp Google Analytics 4",
      description: "Cài đặt GA4 tracking cho toàn bộ user journey từ landing page đến purchase.",
      priority: "low",
      status: "completed",
      deadline: days(-15),
      userId: admin._id,
      assigneeId: alice._id,
      teamId: teamFrontend._id,
      projectId: projEcommerce._id,
      subTasks: [
        { text: "Tạo GA4 property", completed: true },
        { text: "Cài GTM container", completed: true },
        { text: "Custom events tracking", completed: true }
      ]
    },
    {
      title: "Caching layer Redis",
      description: "Tích hợp Redis để cache kết quả API phổ biến, giảm tải cho MongoDB.",
      priority: "medium",
      status: "progress",
      deadline: days(12),
      userId: admin._id,
      assigneeId: dave._id,
      teamId: teamBackend._id,
      projectId: projMobile._id,
      subTasks: [
        { text: "Setup Redis connection", completed: true },
        { text: "Cache middleware", completed: false },
        { text: "Cache invalidation logic", completed: false }
      ]
    },
    {
      title: "Unit tests cho Auth module",
      description: "Viết unit tests với Jest cho toàn bộ authentication flow.",
      priority: "medium",
      status: "pending",
      deadline: days(11),
      userId: admin._id,
      assigneeId: carol._id,
      teamId: teamBackend._id,
      projectId: projMobile._id,
      subTasks: [
        { text: "Test login success case", completed: false },
        { text: "Test invalid credentials", completed: false },
        { text: "Test token expiry", completed: false }
      ]
    },
    {
      title: "Hỗ trợ đa ngôn ngữ (i18n)",
      description: "Tích hợp i18next để hỗ trợ tiếng Việt và tiếng Anh cho toàn bộ ứng dụng.",
      priority: "low",
      status: "pending",
      deadline: days(45),
      userId: alice._id,
      assigneeId: alice._id,
      teamId: teamFrontend._id,
      projectId: null,
      subTasks: [
        { text: "Cài i18next", completed: false },
        { text: "Extract strings", completed: false },
        { text: "Translation file VI", completed: false },
        { text: "Language switcher UI", completed: false }
      ]
    },
    {
      title: "Onboarding checklist người dùng mới",
      description: "Tạo flow hướng dẫn step-by-step khi user đăng ký lần đầu để tăng activation rate.",
      priority: "medium",
      status: "reviewing",
      deadline: days(4),
      userId: admin._id,
      assigneeId: bob._id,
      teamId: teamFrontend._id,
      projectId: projEcommerce._id,
      subTasks: [
        { text: "Mock UI onboarding steps", completed: true },
        { text: "Progress tracking", completed: true },
        { text: "Skip option", completed: false }
      ]
    },
    {
      title: "Load testing với k6",
      description: "Kiểm tra hiệu suất server dưới tải cao bằng công cụ k6, mục tiêu 1000 concurrent users.",
      priority: "high",
      status: "pending",
      deadline: days(6),
      userId: admin._id,
      assigneeId: dave._id,
      teamId: teamBackend._id,
      projectId: projMobile._id,
      subTasks: [
        { text: "Viết k6 test script", completed: false },
        { text: "Chạy test staging", completed: false },
        { text: "Phân tích kết quả", completed: false }
      ]
    }
  ];

  const tasks = await Task.insertMany(tasksData);
  console.log(`📋 Đã tạo ${tasks.length} tasks`);

  // ================== COMMENTS ==================
  const commentSamples = [
    { taskIdx: 0, userId: alice._id, text: "Đã hoàn thành thiết kế hero section, anh review giúp em nhé!" },
    { taskIdx: 0, userId: admin._id, text: "Nhìn rất đẹp, approved! Chuyển sang bước tiếp theo thôi." },
    { taskIdx: 0, userId: bob._id, text: "Tôi cũng kiểm tra responsive rồi, works great on all devices." },
    { taskIdx: 1, userId: bob._id, text: "Đang đọc docs VNPay, API khá phức tạp nhưng có sandbox để test." },
    { taskIdx: 1, userId: admin._id, text: "Deadline tuần này, cần xong trước thứ 5 nhé Bob!" },
    { taskIdx: 3, userId: bob._id, text: "Feature review đã pass QA, chờ final approval từ PM." },
    { taskIdx: 5, userId: carol._id, text: "JWT done, đã test với Postman, tất cả endpoints hoạt động tốt." },
    { taskIdx: 5, userId: admin._id, text: "Excellent work Carol! Code quality rất tốt." },
    { taskIdx: 6, userId: dave._id, text: "Firebase setup xong, đang test push notification trên simulator." },
    { taskIdx: 9, userId: carol._id, text: "Security audit pass, chỉ còn 1 minor issue cần fix." },
    { taskIdx: 9, userId: admin._id, text: "Minor issue đó là gì? Update vào ticket nhé." },
    { taskIdx: 13, userId: admin._id, text: "CI/CD pipeline chạy ngon, deploy time giảm từ 15 phút xuống còn 3 phút!" },
    { taskIdx: 16, userId: admin._id, text: "Bug này critical lắm, Bob phải fix trước cuối ngày hôm nay!" },
    { taskIdx: 16, userId: bob._id, text: "Em đã reproduce được, đang investigate nguyên nhân..." }
  ];

  const comments = await Comment.insertMany(
    commentSamples.map(c => ({
      text: c.text,
      taskId: tasks[c.taskIdx]._id,
      userId: c.userId,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    }))
  );
  console.log(`💬 Đã tạo ${comments.length} comments`);

  // ================== TIME LOGS ==================
  const timeLogData = [
    // Task 0 - completed
    { userId: alice._id, taskId: tasks[0]._id, startTime: days(-8), endTime: days(-8), duration: 180, note: "Thiết kế hero section" },
    { userId: alice._id, taskId: tasks[0]._id, startTime: days(-7), endTime: days(-7), duration: 240, note: "Thiết kế product grid" },
    { userId: alice._id, taskId: tasks[0]._id, startTime: days(-6), endTime: days(-6), duration: 120, note: "Responsive & review" },
    // Task 1 - in progress
    { userId: bob._id, taskId: tasks[1]._id, startTime: days(-3), endTime: days(-3), duration: 90, note: "Đọc tài liệu VNPay" },
    { userId: bob._id, taskId: tasks[1]._id, startTime: days(-1), endTime: days(-1), duration: 150, note: "Build callback endpoint" },
    // Task 5 - completed
    { userId: carol._id, taskId: tasks[5]._id, startTime: days(-12), endTime: days(-12), duration: 200, note: "Login/Register API" },
    { userId: carol._id, taskId: tasks[5]._id, startTime: days(-11), endTime: days(-11), duration: 180, note: "Refresh token" },
    // Task 6 - in progress
    { userId: dave._id, taskId: tasks[6]._id, startTime: days(-2), endTime: days(-2), duration: 120, note: "Firebase setup" },
  ];

  // Thêm startTime đúng cho các time logs (dùng timestamp)
  const timeLogsToInsert = timeLogData.map(t => {
    const start = new Date(t.startTime);
    const end = new Date(t.endTime.getTime() + t.duration * 60 * 1000);
    return {
      userId: t.userId,
      taskId: t.taskId,
      startTime: start,
      endTime: end,
      duration: t.duration,
      note: t.note
    };
  });

  const timeLogs = await TimeLog.insertMany(timeLogsToInsert);
  console.log(`⏱️  Đã tạo ${timeLogs.length} time logs`);

  // ================== ACTIVITY LOGS ==================
  const taskLogs = [];

  // Log tạo tasks
  for (const task of tasks) {
    taskLogs.push({
      action: "created",
      userId: task.userId,
      taskId: task._id,
      details: `Đã tạo task: ${task.title}`,
      createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
    });
  }

  // Log update status
  taskLogs.push(
    {
      action: "updated",
      userId: alice._id,
      taskId: tasks[0]._id,
      details: "Thay đổi: Trạng thái: progress ➔ completed",
      changes: [{ field: "Trạng thái", old: "progress", new: "completed" }],
      createdAt: days(-5)
    },
    {
      action: "updated",
      userId: bob._id,
      taskId: tasks[1]._id,
      details: "Thay đổi: Trạng thái: pending ➔ progress",
      changes: [{ field: "Trạng thái", old: "pending", new: "progress" }],
      createdAt: days(-3)
    },
    {
      action: "updated",
      userId: carol._id,
      taskId: tasks[5]._id,
      details: "Thay đổi: Trạng thái: progress ➔ completed",
      changes: [{ field: "Trạng thái", old: "progress", new: "completed" }],
      createdAt: days(-10)
    },
    {
      action: "updated",
      userId: dave._id,
      taskId: tasks[6]._id,
      details: "Thay đổi: Trạng thái: pending ➔ progress",
      changes: [{ field: "Trạng thái", old: "pending", new: "progress" }],
      createdAt: days(-2)
    },
    // Dùng tasks đầu tiên làm placeholder cho team logs
    {
      action: "created_team",
      userId: admin._id,
      taskId: tasks[0]._id,
      details: "Đã tạo nhóm mới: Frontend Team",
      createdAt: days(-20)
    },
    {
      action: "created_team",
      userId: admin._id,
      taskId: tasks[5]._id,
      details: "Đã tạo nhóm mới: Backend Team",
      createdAt: days(-20)
    }
  );

  const logs = await Log.insertMany(taskLogs);
  console.log(`📜 Đã tạo ${logs.length} activity logs`);

  // ================== SUMMARY ==================
  console.log("\n" + "=".repeat(50));
  console.log("🎉 SEED DATA HOÀN THÀNH!");
  console.log("=".repeat(50));
  console.log("\n📋 TÀI KHOẢN ĐĂNG NHẬP (mật khẩu: 123456):");
  console.log("┌─────────────────────────────────────────────┐");
  console.log("│ 👑 admin@smarttask.com    (Admin - Full access) │");
  console.log("│ 👤 alice@smarttask.com    (Frontend Lead)   │");
  console.log("│ 👤 bob@smarttask.com      (Frontend Dev)    │");
  console.log("│ 👤 carol@smarttask.com    (Backend Lead)    │");
  console.log("│ 👤 dave@smarttask.com     (Backend Dev)     │");
  console.log("└─────────────────────────────────────────────┘");
  console.log("\n📊 DỮ LIỆU ĐÃ TẠO:");
  console.log(`  • Users:     5`);
  console.log(`  • Teams:     2`);
  console.log(`  • Projects:  3`);
  console.log(`  • Tasks:     ${tasks.length}`);
  console.log(`  • Comments:  ${comments.length}`);
  console.log(`  • TimeLogs:  ${timeLogs.length}`);
  console.log(`  • Logs:      ${logs.length}`);
  console.log("\n🌐 Truy cập: http://localhost:3000");
  console.log("=".repeat(50) + "\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
