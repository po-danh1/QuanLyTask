// Hàm format ngày giờ hiển thị dễ đọc
function formatDeadline(dateStr) {
  if (!dateStr) return "Không có";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function loadDeadlineAlerts() {
  const banner = document.getElementById("deadlineAlertBanner");
  if (!banner) return;

  try {
    const res = await fetch("/api/tasks/deadline-alerts", {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (!res.ok) return;

    const { overdue, dueSoon } = await res.json();

    // Ẩn banner nếu không có gì cần cảnh báo
    if (overdue.length === 0 && dueSoon.length === 0) {
      banner.classList.add("d-none");
      return;
    }

    banner.classList.remove("d-none");

    let html = "";

    if (overdue.length > 0) {
      html += `
        <div class="alert-section mb-2">
          <strong class="text-danger">🔴 Đã quá hạn (${overdue.length} task):</strong>
          <ul class="mb-0 mt-1">
            ${overdue
              .map(
                (t) =>
                  `<li><strong>${t.title}</strong> — hạn: <span class="text-danger fw-bold">${formatDeadline(t.deadline)}</span></li>`
              )
              .join("")}
          </ul>
        </div>`;
    }

    if (dueSoon.length > 0) {
      html += `
        <div class="alert-section">
          <strong class="text-warning">🟡 Sắp đến hạn trong 24h (${dueSoon.length} task):</strong>
          <ul class="mb-0 mt-1">
            ${dueSoon
              .map(
                (t) =>
                  `<li><strong>${t.title}</strong> — hạn: <span class="text-warning fw-bold">${formatDeadline(t.deadline)}</span></li>`
              )
              .join("")}
          </ul>
        </div>`;
    }

    document.getElementById("deadlineAlertContent").innerHTML = html;
  } catch (err) {
    console.error("Lỗi khi tải thông báo deadline:", err);
  }
}

// Chạy ngay khi tải trang xong và tự động kiểm tra lại mỗi 5 phút
document.addEventListener("DOMContentLoaded", () => {
  loadDeadlineAlerts();
  setInterval(loadDeadlineAlerts, 5 * 60 * 1000);
});
