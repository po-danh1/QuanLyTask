// BASE_URL is defined in api.js which loads before this file
const socket = io(BASE_URL);

socket.on("connect", () => {
    console.log("Connected to Real-time server");
});

// Lắng nghe thay đổi Task
socket.on("taskChange", (data) => {
    console.log("Task change received:", data);
    
    // 1. Tải lại danh sách task chính (Kanban + Table)
    if (typeof loadTasks === "function") {
        loadTasks();
    }

    // 2. Nếu đang xem đúng Task bị thay đổi, cập nhật modal chi tiết
    if (typeof currentViewTaskId !== "undefined" && currentViewTaskId) {
        if (data.taskId === currentViewTaskId || (data.task && data.task._id === currentViewTaskId)) {
            // Nếu là update/create, dùng trực tiếp dữ liệu mới để render lại các phần
            if (data.action === "update" && data.task) {
                renderSubTasks(data.task.subTasks || []);
                renderAttachments(data.task.attachments || []);
                // Cập nhật các thông tin cơ bản khác nếu cần
                document.getElementById("detailTitle").innerText = data.task.title;
                // Cập nhật thanh tiến độ
                const completedCount = data.task.subTasks.filter(st => st.completed).length;
                const percent = data.task.subTasks.length > 0 ? Math.round((completedCount / data.task.subTasks.length) * 100) : 0;
                document.getElementById("checklistPercent").innerText = `${percent}%`;
                document.getElementById("checklistProgress").style.width = `${percent}%`;
            }
            
            // Tải lại lịch sử
            refreshHistory();
        }
    }
    
    // Hiển thị thông báo Toast nếu muốn
    if (data.action === "create") {
         showToast(`Có task mới: ${data.task.title}`, "info");
    }
});

// Lắng nghe bình luận mới
socket.on("commentAdded", (data) => {
    if (typeof currentViewTaskId !== "undefined" && currentViewTaskId === data.taskId) {
        refreshComments();
        showToast("Có bình luận mới!", "info");
    }
});
