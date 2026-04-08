function getKanbanDeadlineText(deadline, status) {
  if (!deadline) return "";

  const now = new Date();
  const due = new Date(deadline);
  const diffHours = (due - now) / (1000 * 60 * 60);

  if (status === "completed") {
    return `<small class="text-success">Done: ${formatDateTime(deadline)}</small>`;
  }

  if (diffHours < 0) {
    return `<small class="text-danger">Overdue: ${formatDateTime(deadline)}</small>`;
  }

  if (diffHours <= 24) {
    return `<small class="text-warning">Due soon: ${formatDateTime(deadline)}</small>`;
  }

  return `<small class="text-muted">${formatDateTime(deadline)}</small>`;
}

function renderKanban(tasks) {
  const cols = ["pending", "progress", "reviewing", "completed"];
  cols.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = "";
  });

  if (!tasks || tasks.length === 0) return;

  tasks.forEach((task) => {
    const card = `
      <div class="kanban-card" draggable="true" ondragstart="drag(event)" id="${task._id}">
        <div class="fw-bold mb-1">${task.title || ""}</div>
        <div class="small text-muted mb-3" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${task.description || "<i>No description</i>"}
        </div>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="badge badge-premium bg-${getPriorityColor(task.priority)}">
            ${task.priority ? task.priority.toUpperCase() : "LOW"}
          </span>
          <div class="small">
             ${getKanbanDeadlineText(task.deadline, task.status)}
          </div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm btn-premium w-100 py-1" onclick="viewTask('${task._id}')">
            <small>Detail</small>
          </button>
        </div>
      </div>
    `;

    const validStatuses = ["pending", "progress", "reviewing", "completed"];
    const targetId = validStatuses.includes(task.status) ? task.status : "pending";
    const targetEl = document.getElementById(targetId);
    if (targetEl) targetEl.innerHTML += card;
  });

  // Drag events
  document.querySelectorAll(".kanban-column").forEach(col => {
    col.setAttribute("ondragover", "allowDrop(event)");
    col.setAttribute("ondragenter", "this.classList.add('drag-over')");
    col.setAttribute("ondragleave", "this.classList.remove('drag-over')");
    col.setAttribute("ondrop", `drop(event, '${col.id}')`);
  });
}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("id", ev.target.id);
}

async function drop(ev, status) {
  ev.preventDefault();
  const id = ev.dataTransfer.getData("id");
  await updateTaskApi(id, { status });
  loadTasks();
}