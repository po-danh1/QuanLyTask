if (!localStorage.getItem("token")) {
  showToast("Vui lòng đăng nhập trước", "warning");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
}

let page = 1;
const limit = 5;

async function loadTasks() {
  const search = document.getElementById("search").value.trim();
  const priority = document.getElementById("filterPriority").value;
  const status = document.getElementById("filterStatus")
    ? document.getElementById("filterStatus").value
    : "";
  const sort = document.getElementById("sortBy")
    ? document.getElementById("sortBy").value
    : "newest";

  let url = `${API_URL}?page=${page}&limit=${limit}`;

  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

  if (priority) {
    url += `&priority=${encodeURIComponent(priority)}`;
  }

  if (status) {
    url += `&status=${encodeURIComponent(status)}`;
  }

  if (sort) {
    url += `&sort=${encodeURIComponent(sort)}`;
  }

  const tasks = await getTasks(url);

  renderTasks(tasks);
  renderKanban(tasks);
  await loadStats();

  document.getElementById("pageNumber").innerText = `Page ${page}`;
}

async function addTask() {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const priority = document.getElementById("priority").value;
  const deadline = document.getElementById("deadline").value;

  if (!title) {
    showToast("Vui lòng nhập title", "warning");
    return;
  }

  await createTask({
    title,
    description,
    priority,
    deadline: deadline || null,
    status: "pending"
  });

  document.getElementById("title").value = "";
  document.getElementById("description").value = "";
  document.getElementById("priority").value = "low";
  document.getElementById("deadline").value = "";

  page = 1;
  loadTasks();
  showToast("Thêm task thành công", "success");
}

async function deleteTask(id) {
  const confirmDelete = confirm("Bạn có chắc muốn xóa task này?");
  if (!confirmDelete) return;

  await deleteTaskApi(id);
  loadTasks();
  showToast("Xóa task thành công", "success");
}

async function markCompleted(id) {
  await updateTaskApi(id, {
    status: "completed"
  });

  loadTasks();
  showToast("Task đã hoàn thành", "success");
}

async function viewTask(id) {
  const task = await getTaskById(id);
  if (!task) return;

  document.getElementById("detailTitle").innerText = task.title || "";
  document.getElementById("detailDescription").innerText = task.description || "";
  document.getElementById("detailPriority").innerText = task.priority || "";
  document.getElementById("detailStatus").innerText = task.status || "";
  document.getElementById("detailDeadline").innerText = formatDateTime(task.deadline);

  const modal = new bootstrap.Modal(document.getElementById("detailModal"));
  modal.show();
}

async function editTask(id) {
  const task = await getTaskById(id);
  if (!task) return;

  document.getElementById("editId").value = task._id;
  document.getElementById("editTitle").value = task.title || "";
  document.getElementById("editDescription").value = task.description || "";
  document.getElementById("editPriority").value = task.priority || "low";
  document.getElementById("editStatus").value = task.status || "pending";
  document.getElementById("editDeadline").value = task.deadline
    ? task.deadline.slice(0, 16)
    : "";

  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

async function updateTask() {
  const id = document.getElementById("editId").value;
  const title = document.getElementById("editTitle").value.trim();
  const description = document.getElementById("editDescription").value.trim();
  const priority = document.getElementById("editPriority").value;
  const status = document.getElementById("editStatus").value;
  const deadline = document.getElementById("editDeadline").value;

  if (!title) {
    showToast("Vui lòng nhập title", "warning");
    return;
  }

  await updateTaskApi(id, {
    title,
    description,
    priority,
    status,
    deadline: deadline || null
  });

  const modalEl = document.getElementById("editModal");
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();

  loadTasks();
  showToast("Cập nhật task thành công", "success");
}

function applyFilter() {
  page = 1;
  loadTasks();
}

function resetFilter() {
  document.getElementById("search").value = "";
  document.getElementById("filterPriority").value = "";
  if (document.getElementById("filterStatus")) {
    document.getElementById("filterStatus").value = "";
  }
  if (document.getElementById("sortBy")) {
    document.getElementById("sortBy").value = "newest";
  }
  page = 1;
  loadTasks();
}

function nextPage() {
  page++;
  loadTasks();
}

function prevPage() {
  if (page > 1) {
    page--;
    loadTasks();
  }
}

loadTasks();