function getPriorityColor(priority) {
  if (priority === "high") return "danger";
  if (priority === "medium") return "warning";
  return "success";
}

function getStatusBadge(status) {
  if (status === "completed") return "success";
  if (status === "progress") return "primary";
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
      text: `${formatDateTime(deadline)} (Overdue)`
    };
  }

  if (diffHours <= 24) {
    return {
      badge: "warning",
      text: `${formatDateTime(deadline)} (Due soon)`
    };
  }

  return {
    badge: "success",
    text: formatDateTime(deadline)
  };
}

function renderTasks(tasks) {
  const table = document.getElementById("taskTable");
  table.innerHTML = "";

  if (!tasks || tasks.length === 0) {
    table.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No tasks found</td>
      </tr>
    `;
    return;
  }

  tasks.forEach((task) => {
    const deadlineInfo = getDeadlineInfo(task.deadline, task.status);

    table.innerHTML += `
      <tr>
        <td>${task.title || ""}</td>
        <td>${task.description || ""}</td>
        <td>
          <span class="badge bg-${getPriorityColor(task.priority)} text-uppercase">
            ${task.priority || "low"}
          </span>
        </td>
        <td>
          ${
            task.deadline
              ? `<span class="badge bg-${deadlineInfo.badge}">${deadlineInfo.text}</span>`
              : ""
          }
        </td>
        <td>
          <span class="badge bg-${getStatusBadge(task.status)}">
            ${task.status || "pending"}
          </span>
        </td>
        <td>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-info btn-sm text-white" onclick="viewTask('${task._id}')">
              View
            </button>
            <button class="btn btn-warning btn-sm text-dark" onclick="editTask('${task._id}')">
              Edit
            </button>
            <button class="btn btn-success btn-sm" onclick="markCompleted('${task._id}')">
              Complete
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteTask('${task._id}')">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}