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
  document.getElementById("pending").innerHTML = "";
  document.getElementById("progress").innerHTML = "";
  document.getElementById("completed").innerHTML = "";

  if (!tasks || tasks.length === 0) return;

  tasks.forEach((task) => {
    const card = `
      <div class="kanban-card" draggable="true" ondragstart="drag(event)" id="${task._id}">
        <div class="fw-bold">${task.title || ""}</div>
        <div class="small text-muted mb-2">${task.description || ""}</div>
        <div class="mb-2">
          <span class="badge bg-${getPriorityColor(task.priority)} text-uppercase">
            ${task.priority || "low"}
          </span>
        </div>
        <div>
          ${getKanbanDeadlineText(task.deadline, task.status)}
        </div>
      </div>
    `;

    if (task.status === "completed") {
      document.getElementById("completed").innerHTML += card;
    } else if (task.status === "progress") {
      document.getElementById("progress").innerHTML += card;
    } else {
      document.getElementById("pending").innerHTML += card;
    }
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