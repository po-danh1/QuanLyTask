function getPriorityColor(priority) {
  if (priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "success";
}

function getStatusBadge(status) {
  if (status === "completed") return "success";
  if (status === "progress") return "primary";
  if (status === "reviewing") return "info";
  return "secondary";
}

function formatDateTime(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("vi-VN");
}

function getDeadlineInfo(deadline, status) {
  if (!deadline) {
    return {
      badge: "secondary",
      text: ""
    };
  }

  if (status === "completed") {
    return {
      badge: "success",
      text: formatDateTime(deadline)
    };
  }

  const now = new Date();
  const due = new Date(deadline);
  const diffMs = due - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    return {
      badge: "danger",
      text: `🔴 Overdue`
    };
  }

  if (diffHours <= 24) {
    return {
      badge: "warning",
      text: `🟡 Due Soon`
    };
  }

  return {
    badge: "success",
    text: "✅"
  };
}

function renderTasks(tasks) {
  const table = document.getElementById("taskTableBody");
  if (!table) return;
  table.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted p-4">No tasks found</td>
      </tr>
    `;
    return;
  }

  tasks.forEach((task) => {
    const deadlineInfo = getDeadlineInfo(task.deadline, task.status);
    const isReviewing = task.status === "reviewing";
    
    // Nút hành động thông minh cho Approval Workflow
    let actionBtn = `<button class="btn btn-outline-success btn-sm btn-premium" onclick="markCompleted('${task._id}')" title="Hoàn thành">✅</button>`;
    if (task.status === "progress") {
      actionBtn = `<button class="btn btn-outline-info btn-sm btn-premium" onclick="requestReview('${task._id}')" title="Gửi duyệt">📤</button>`;
    } else if (task.status === "reviewing") {
      actionBtn = `<button class="btn btn-success btn-sm btn-premium" onclick="approveTask('${task._id}')" title="Duyệt">✔️</button>`;
    }

    table.innerHTML += `
      <tr data-id="${task._id}">
        <td><input type="checkbox" class="task-checkbox" value="${task._id}" onchange="updateSelection()"></td>
        <td>
          <div class="fw-bold text-primary">${task.title || ""}</div>
          <div class="small text-muted">${task.teamId ? (task.teamId.name || 'Team') : 'Personal'}</div>
        </td>
        <td class="text-muted small">${task.description || ""}</td>
        <td>
          <span class="badge badge-premium bg-${getPriorityColor(task.priority)}">
            ${task.priority ? task.priority.toUpperCase() : "LOW"}
          </span>
        </td>
        <td>
          <div class="d-flex flex-column gap-1">
            <span class="small fw-medium">${task.deadline ? formatDateTime(task.deadline) : "—"}</span>
            ${task.deadline ? `<span class="badge bg-${deadlineInfo.badge} badge-premium" style="width: fit-content;">${deadlineInfo.text}</span>` : ""}
          </div>
        </td>
        <td>
          <span class="badge badge-premium bg-${getStatusBadge(task.status)}">
            ${task.status ? task.status.toUpperCase().replace('_', ' ') : "PENDING"}
          </span>
        </td>
        <td>
          <div class="d-flex gap-1 flex-wrap">
            <button class="btn btn-outline-info btn-sm btn-premium" onclick="viewTask('${task._id}')" title="Chi tiết">👁️</button>
            <button class="btn btn-outline-warning btn-sm btn-premium" onclick="editTask('${task._id}')" title="Sửa">✏️</button>
            ${actionBtn}
            <button class="btn btn-outline-danger btn-sm btn-premium" onclick="deleteTask('${task._id}')" title="Xóa">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  });
}