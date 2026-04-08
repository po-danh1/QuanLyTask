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
    const res = await fetch(`${BASE_URL}/api/tasks/deadline-alerts`, {
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

// ==================== ALL NOTIFICATIONS ====================
let allNotifications = [];

// Load all notifications (deadline + system + comments + task updates)
async function loadAllNotifications() {
  const listEl = document.getElementById("notificationList");
  if (!listEl) return;

  try {
    // Get deadline alerts
    const res = await fetch(`${BASE_URL}/api/tasks/deadline-alerts`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    let notifications = [];

    if (res.ok) {
      const { overdue, dueSoon } = await res.json();

      // Convert deadline alerts to notification format
      overdue.forEach(task => {
        notifications.push({
          id: `overdue_${task._id}`,
          type: 'deadline',
          title: '🔴 Đã quá hạn',
          message: `Task "${task.title}" đã quá hạn: ${formatDeadline(task.deadline)}`,
          taskId: task._id,
          createdAt: new Date(),
          read: false
        });
      });

      dueSoon.forEach(task => {
        notifications.push({
          id: `duesoon_${task._id}`,
          type: 'deadline',
          title: '🟡 Sắp đến hạn',
          message: `Task "${task.title}" sắp đến hạn: ${formatDeadline(task.deadline)}`,
          taskId: task._id,
          createdAt: new Date(),
          read: false
        });
      });
    }

    // Get system notifications
    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (notifRes.ok) {
      const data = await notifRes.json();
      const notifs = data.notifications || [];
      notifs.slice(0, 10).forEach(n => {
        let icon = '🔔';
        if (n.type === 'comment') icon = '💬';
        else if (n.type === 'deadline') icon = n.title.includes('quá hạn') ? '🔴' : '🟡';
        else if (n.type === 'task_assigned') icon = '📋';
        else if (n.type === 'team_invite') icon = '👥';

        notifications.push({
          id: `notif_${n._id}`,
          type: n.type,
          title: `${icon} ${n.title}`,
          message: n.message,
          taskId: n.link || n.taskId,
          createdAt: new Date(n.createdAt),
          read: n.isRead
        });
      });
    }

    // Sort by date (newest first)
    notifications.sort((a, b) => b.createdAt - a.createdAt);
    allNotifications = notifications;

    renderNotifications();
    updateNotificationBadge();

  } catch (err) {
    console.error("Lỗi khi tải thông báo:", err);
    listEl.innerHTML = `<div class="dropdown-item text-danger text-center py-3">Không thể tải thông báo</div>`;
  }
}

// Render notifications list
function renderNotifications() {
  const listEl = document.getElementById("notificationList");
  if (!listEl) return;

  if (allNotifications.length === 0) {
    listEl.innerHTML = `<div class="dropdown-item text-muted text-center py-3">Không có thông báo mới</div>`;
    return;
  }

  listEl.innerHTML = allNotifications.map(n => `
    <div class="dropdown-item d-flex align-items-start py-2 px-3 border-bottom ${n.read ? 'opacity-50' : 'bg-light'}" style="cursor: pointer;" onclick="handleNotificationClick('${n.id}', '${n.taskId}')">
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-center">
          <span class="fw-bold small">${n.title}</span>
          <span class="text-muted" style="font-size: 0.7rem;">${timeAgo(n.createdAt)}</span>
        </div>
        <div class="small text-wrap" style="max-width: 280px;">${n.message}</div>
      </div>
      ${!n.read ? '<span class="badge bg-primary rounded-circle ms-2" style="width: 8px; height: 8px;"></span>' : ''}
    </div>
  `).join('');
}

// Update badge count
function updateNotificationBadge() {
  const badge = document.getElementById("notificationBadge");
  if (!badge) return;

  const unreadCount = allNotifications.filter(n => !n.read).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    badge.classList.remove("d-none");
  } else {
    badge.classList.add("d-none");
  }
}

// Handle notification click
async function handleNotificationClick(notificationId, taskId) {
  // Mark as read locally
  const notification = allNotifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    renderNotifications();
    updateNotificationBadge();
  }

  // Mark as read on server (if it's a system notification)
  if (notificationId.startsWith('notif_')) {
    const id = notificationId.replace('notif_', '');
    try {
      await fetch(`${BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
    }
  }

  // Open task detail if taskId exists
  if (taskId && typeof openDetailModal === "function") {
    openDetailModal(taskId);
  }
}

// Mark all as read
async function markAllNotificationsAsRead(event) {
  event.stopPropagation();
  allNotifications.forEach(n => n.read = true);
  renderNotifications();
  updateNotificationBadge();

  // Call API to mark all as read
  try {
    await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
  } catch (err) {
    console.error('Lỗi khi đánh dấu tất cả đã đọc:', err);
  }
}

// Time ago helper
function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

// Quick load just the unread count for badge
async function loadUnreadCount() {
  try {
    const res = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (res.ok) {
      const { count } = await res.json();
      const badge = document.getElementById("notificationBadge");
      if (badge) {
        if (count > 0) {
          badge.textContent = count > 99 ? '99+' : count;
          badge.classList.remove("d-none");
        } else {
          badge.classList.add("d-none");
        }
      }
    }
  } catch (err) {
    console.error('Lỗi khi tải số lượng thông báo:', err);
  }
}

// Function is called from window.onload in index.html
// Auto-refresh every 5 minutes after initial load
if (typeof window.notificationInterval === "undefined") {
  window.notificationInterval = setInterval(loadDeadlineAlerts, 5 * 60 * 1000);
}
