// ==================== ADMIN DASHBOARD ====================

let adminLogPage = 1;

// Kiểm tra xem user có phải admin không để hiển thị UI
function initAdminFeatures() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Decode JWT để lấy role (phần payload là base64)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const isAdmin = payload.role === "admin";

    const adminBtn = document.getElementById("adminPanelBtn");
    if (adminBtn) {
      if (isAdmin) {
        adminBtn.classList.remove("d-none");
      } else {
        adminBtn.classList.add("d-none");
      }
    }
  } catch (e) {
    console.log("Could not decode token for admin check");
  }
}

async function openAdminPanel() {
  adminLogPage = 1;
  const modal = new bootstrap.Modal(document.getElementById("adminPanelModal"));
  modal.show();

  // Load dữ liệu khi mở
  await Promise.all([loadAdminUsers(), loadAdminLogs()]);
}

// ==================== USER MANAGEMENT ====================
async function loadAdminUsers() {
  const container = document.getElementById("adminUserList");
  if (!container) return;

  container.innerHTML = `<tr><td colspan="5" class="text-center text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Đang tải...</td></tr>`;

  const users = await getAllUsersApi();
  if (!users || users.length === 0) {
    container.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Không có user nào.</td></tr>`;
    return;
  }

  container.innerHTML = users.map(user => {
    const avatar = `<div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style="width:36px;height:36px;font-size:0.85rem;">${(user.username || "U")[0].toUpperCase()}</div>`;
    const roleBadge = user.role === "admin"
      ? `<span class="badge bg-danger">Admin</span>`
      : `<span class="badge bg-secondary">User</span>`;

    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            ${avatar}
            <div>
              <div class="fw-bold small">${user.username}</div>
              <div class="text-muted" style="font-size:0.75rem">${user.email}</div>
            </div>
          </div>
        </td>
        <td>${roleBadge}</td>
        <td class="small text-muted">${user.createdAt ? formatDateTime(user.createdAt) : "—"}</td>
        <td>
          <div class="d-flex gap-1">
            <select class="form-select form-select-sm" onchange="handleUpdateUserRole('${user._id}', this.value)" style="width:120px;">
              <option value="user" ${user.role === "user" ? "selected" : ""}>User</option>
              <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
            </select>
            <button class="btn btn-sm btn-outline-danger btn-premium" onclick="handleDeleteUser('${user._id}', '${user.username}')">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

async function handleUpdateUserRole(userId, newRole) {
  const res = await updateUserRoleApi(userId, newRole);
  if (res && res.message) {
    showToast(res.message, "success");
    await loadAdminUsers();
  } else {
    showToast(res?.message || "Lỗi khi cập nhật role", "danger");
  }
}

async function handleDeleteUser(userId, username) {
  if (!confirm(`Bạn có chắc muốn xóa user "${username}"? Tất cả task của họ sẽ bị ẩn.`)) return;
  const res = await deleteUserApi(userId);
  if (res && res.message) {
    showToast("Đã xóa user thành công!", "info");
    await loadAdminUsers();
  } else {
    showToast(res?.message || "Lỗi khi xóa user", "danger");
  }
}

// ==================== SYSTEM LOGS ====================
async function loadAdminLogs() {
  const container = document.getElementById("adminLogList");
  if (!container) return;

  container.innerHTML = `<p class="text-center text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Đang tải logs...</p>`;

  const data = await getAllLogsApi(adminLogPage);
  if (!data || !data.logs) {
    container.innerHTML = `<p class="text-muted text-center">Không có logs.</p>`;
    return;
  }

  const { logs, pagination } = data;

  const actionIcons = {
    created: "✨",
    updated: "🔄",
    deleted: "🗑️",
    created_team: "👥",
    deleted_team: "❌",
    admin_update_role: "🔑",
    admin_delete_user: "💀"
  };

  const actionColors = {
    created: "success",
    updated: "warning",
    deleted: "danger",
    created_team: "info",
    deleted_team: "danger",
    admin_update_role: "warning",
    admin_delete_user: "danger"
  };

  container.innerHTML = logs.map(log => {
    const icon = actionIcons[log.action] || "📝";
    const color = actionColors[log.action] || "secondary";
    return `
      <div class="d-flex align-items-start gap-3 p-2 border-bottom">
        <span class="fs-5">${icon}</span>
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="badge bg-${color}-subtle text-${color} border border-${color}-subtle me-2">${log.action}</span>
              <strong class="small">${log.userId?.username || "System"}</strong>
              ${log.taskId ? `<span class="text-muted small ms-2">→ ${log.taskId?.title || "Task"}</span>` : ""}
            </div>
            <span class="text-muted" style="font-size:0.75rem">${formatDateTime(log.createdAt)}</span>
          </div>
          <p class="mb-0 small text-muted mt-1">${log.details}</p>
        </div>
      </div>`;
  }).join("");

  // Pagination
  const paginationEl = document.getElementById("adminLogPagination");
  if (paginationEl && pagination) {
    paginationEl.innerHTML = `
      <button class="btn btn-sm btn-outline-secondary" onclick="prevAdminLogPage()" ${adminLogPage <= 1 ? "disabled" : ""}>← Prev</button>
      <span class="small text-muted">Trang ${pagination.current} / ${pagination.total} (${pagination.count} logs)</span>
      <button class="btn btn-sm btn-outline-secondary" onclick="nextAdminLogPage()" ${adminLogPage >= pagination.total ? "disabled" : ""}>Next →</button>`;
  }
}

function prevAdminLogPage() {
  if (adminLogPage > 1) {
    adminLogPage--;
    loadAdminLogs();
  }
}

function nextAdminLogPage() {
  adminLogPage++;
  loadAdminLogs();
}
