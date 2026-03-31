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
  if (typeof loadDeadlineAlerts === "function") loadDeadlineAlerts();

  document.getElementById("pageNumber").innerText = `Page ${page}`;
}

async function addTask() {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const priority = document.getElementById("priority").value;
  const deadline = document.getElementById("deadline").value;
  const teamId = document.getElementById("taskTeam").value;
  const assigneeId = document.getElementById("taskAssignee").value;

  if (!title) {
    showToast("Vui lòng nhập title", "warning");
    return;
  }

  await createTask({
    title,
    description,
    priority,
    deadline: deadline || null,
    teamId: teamId || null,
    assigneeId: assigneeId || null,
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

let currentViewTaskId = null;

async function viewTask(id) {
  const task = await getTaskById(id);
  if (!task) return;

  currentViewTaskId = id;

  document.getElementById("detailTitle").innerText = task.title || "";
  document.getElementById("detailDescription").innerText = task.description || "";
  document.getElementById("detailPriority").innerText = task.priority || "";
  document.getElementById("detailStatus").innerText = task.status || "";
  document.getElementById("detailDeadline").innerText = formatDateTime(task.deadline);
  document.getElementById("detailTeam").innerText = task.teamId?.name || "Chi tiết cá nhân";
  document.getElementById("detailAssignee").innerText = task.assigneeId?.username || "Chưa giao";

  renderSubTasks(task.subTasks || []);
  renderAttachments(task.attachments || []);
  await refreshComments();
  await refreshHistory();

  // Reset tab về tab mặc định (Checklist)
  const firstTab = new bootstrap.Tab(document.getElementById('checklist-tab'));
  firstTab.show();

  const modal = new bootstrap.Modal(document.getElementById("detailModal"));
  modal.show();
}

function renderSubTasks(subTasks) {
  const list = document.getElementById("subTaskList");
  const percentText = document.getElementById("checklistPercent");
  const progressBar = document.getElementById("checklistProgress");

  if (subTasks.length === 0) {
    list.innerHTML = `<p class="text-muted small">Chưa có công việc con nào.</p>`;
    percentText.innerText = "0%";
    progressBar.style.width = "0%";
    return;
  }

  const completedCount = subTasks.filter(st => st.completed).length;
  const percent = Math.round((completedCount / subTasks.length) * 100);
  
  percentText.innerText = `${percent}%`;
  progressBar.style.width = `${percent}%`;
  if (percent === 100) progressBar.classList.replace("bg-primary", "bg-success");
  else progressBar.classList.replace("bg-success", "bg-primary");

  list.innerHTML = subTasks.map(st => `
    <div class="form-check d-flex justify-content-between align-items-center mb-1">
      <div>
        <input class="form-check-input" type="checkbox" ${st.completed ? 'checked' : ''} onchange="handleToggleSubTask('${st._id}')">
        <label class="form-check-label ${st.completed ? 'text-decoration-line-through text-muted' : ''}">
          ${st.text}
        </label>
      </div>
      <button class="btn btn-sm text-danger" onclick="handleDeleteSubTask('${st._id}')">&times;</button>
    </div>
  `).join("");
}

async function handleCreateSubTask() {
  const input = document.getElementById("newSubTaskText");
  const text = input.value.trim();
  if (!text) return;

  const task = await addSubTask(currentViewTaskId, text);
  if (task) {
    input.value = "";
    renderSubTasks(task.subTasks);
  }
}

async function handleToggleSubTask(subTaskId) {
  const task = await toggleSubTask(currentViewTaskId, subTaskId);
  if (task) renderSubTasks(task.subTasks);
}

async function handleDeleteSubTask(subTaskId) {
  if (!confirm("Xóa công việc con này?")) return;
  const task = await deleteSubTask(currentViewTaskId, subTaskId);
  if (task) renderSubTasks(task.subTasks);
}

function renderAttachments(attachments) {
  const list = document.getElementById("attachmentList");
  if (!attachments || attachments.length === 0) {
    list.innerHTML = `<p class="text-muted small w-100">Chưa có tệp đính kèm nào.</p>`;
    return;
  }

  list.innerHTML = attachments.map(att => {
    let icon = "📄";
    if (att.mimetype.includes("image")) icon = "🖼️";
    if (att.mimetype.includes("pdf")) icon = "📕";
    if (att.mimetype.includes("zip") || att.mimetype.includes("rar")) icon = "📦";

    return `
      <div class="card p-2 border-0 shadow-sm bg-light position-relative text-center" style="width: 100px;">
        <div class="fs-2 mb-1">${icon}</div>
        <div class="small fw-bold text-truncate" title="${att.name}">${att.name}</div>
        <div class="d-flex gap-1 mt-2">
           <a href="/${att.path}" target="_blank" class="btn btn-xs btn-outline-primary py-0" style="font-size: 0.7rem">Mở</a>
           <button class="btn btn-xs btn-outline-danger py-0" onclick="handleDeleteFile('${att._id}')" style="font-size: 0.7rem">Xóa</button>
        </div>
      </div>
    `;
  }).join("");
}

async function handleUploadFile() {
  const fileInput = document.getElementById("attachmentFile");
  const file = fileInput.files[0];
  if (!file) return;

  const task = await uploadAttachment(currentViewTaskId, file);
  if (task) {
    fileInput.value = "";
    renderAttachments(task.attachments);
    showToast("Tải lên thành công", "success");
  }
}

async function handleDeleteFile(attId) {
  if (!confirm("Xóa tệp đính kèm này?")) return;
  const task = await deleteAttachmentApi(currentViewTaskId, attId);
  if (task) {
    renderAttachments(task.attachments);
    showToast("Đã xóa tệp", "info");
  }
}

async function refreshComments() {
  if (!currentViewTaskId) return;
  
  const comments = await getCommentsByTaskId(currentViewTaskId);
  const commentList = document.getElementById("commentList");
  
  if (!comments || comments.length === 0) {
    commentList.innerHTML = `<p class="text-muted small">Chưa có bình luận nào.</p>`;
    return;
  }

  commentList.innerHTML = comments.map(c => `
    <div class="d-flex mb-2">
      <div class="flex-shrink-0">
        <img src="${c.userId?.avatar || 'https://via.placeholder.com/32'}" class="rounded-circle" width="32" height="32" alt="avatar">
      </div>
      <div class="flex-grow-1 ms-2 bg-light p-2 rounded">
        <strong>${c.userId?.username || 'User'}</strong> <span class="text-muted small" style="font-size: 0.8em">${formatDateTime(c.createdAt)}</span>
        <p class="mb-0 mt-1">${c.text}</p>
      </div>
    </div>
  `).join("");
}

async function refreshHistory() {
  if (!currentViewTaskId) return;
  
  const logs = await getLogsByTaskId(currentViewTaskId);
  const historyList = document.getElementById("historyList");
  
  if (!logs || logs.length === 0) {
    historyList.innerHTML = `<p class="text-muted small">Chưa có lịch sử thay đổi.</p>`;
    return;
  }

  historyList.innerHTML = logs.map(log => {
    let icon = "📝";
    if (log.action === "created") icon = "✨";
    if (log.action === "deleted") icon = "🗑️";
    if (log.action === "updated") icon = "🔄";
    
    let changesHtml = "";
    if (log.changes && log.changes.length > 0) {
      changesHtml = `<div class="mt-2 p-2 bg-light border rounded" style="font-size: 0.85em">
        <ul class="mb-0 ps-3">
          ${log.changes.map(c => `<li><strong>${c.field}:</strong> <span class="text-danger text-decoration-line-through">${c.old || '(Trống)'}</span> <span class="mx-1">➔</span> <span class="text-success">${c.new || '(Trống)'}</span></li>`).join("")}
        </ul>
      </div>`;
    }

    return `
    <div class="d-flex mb-3 border-bottom pb-2">
      <div class="flex-shrink-0 fs-4">${icon}</div>
      <div class="flex-grow-1 ms-2">
        <div class="d-flex justify-content-between align-items-center">
          <strong>${log.userId?.username || 'Hệ thống'}</strong>
          <span class="text-muted small" style="font-size: 0.8em">${formatDateTime(log.createdAt)}</span>
        </div>
        <p class="mb-0 mt-1 small">${log.details}</p>
        ${changesHtml}
      </div>
    </div>
  `}).join("");
}

async function submitComment() {
  if (!currentViewTaskId) return;
  const input = document.getElementById("newCommentText");
  const text = input.value.trim();
  
  if (!text) return;

  const btn = document.getElementById("btnSendComment");
  btn.disabled = true;

  try {
    const res = await addCommentToTask(currentViewTaskId, text);
    if (!res) {
      showToast("Không thể gửi bình luận, vui lòng thử lại", "warning");
    } else {
      input.value = "";
      await refreshComments();
    }
  } catch (error) {
    showToast("Lỗi khi gửi bình luận", "danger");
  } finally {
    btn.disabled = false;
  }
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

async function requestReview(taskId) {
  const task = await updateTaskApi(taskId, { status: "reviewing" });
  if (task) {
    showToast("Đã gửi yêu cầu phê duyệt!", "info");
    loadTasks();
  }
}

async function approveTask(taskId) {
  const task = await updateTaskApi(taskId, { status: "completed" });
  if (task) {
    showToast("Đã duyệt công việc thành công!", "success");
    loadTasks();
  }
}

// Bulk Action Logic
function updateSelection() {
  const checkboxes = document.querySelectorAll('.task-checkbox:checked');
  const count = checkboxes.length;
  const bar = document.getElementById('bulkActionBar');

  if (count > 0) {
    bar.classList.remove('d-none');
    document.getElementById('selectedCount').innerText = count;
  } else {
    bar.classList.add('d-none');
  }
}

function toggleSelectAll(checked) {
  const checkboxes = document.querySelectorAll('.task-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = checked;
  });
  updateSelection();
}

function clearSelection() {
  const selectAll = document.getElementById('selectAll');
  if (selectAll) selectAll.checked = false;
  toggleSelectAll(false);
}

async function handleBulkStatus() {
  const status = document.getElementById('bulkStatus').value;
  if (!status) return showToast("Vui lòng chọn trạng thái", "warning");

  const checkboxes = document.querySelectorAll('.task-checkbox:checked');
  const taskIds = Array.from(checkboxes).map(cb => cb.value);

  const res = await bulkTasksApi(taskIds, "status", status);
  if (res) {
    showToast(res.message, "success");
    clearSelection();
    loadTasks();
  }
}

async function handleBulkDelete() {
  if (!confirm("Bạn có chắc chắn muốn xóa các Task đã chọn?")) return;

  const checkboxes = document.querySelectorAll('.task-checkbox:checked');
  const taskIds = Array.from(checkboxes).map(cb => cb.value);

  const res = await bulkTasksApi(taskIds, "delete");
  if (res) {
    showToast(res.message, "danger");
    clearSelection();
    loadTasks();
  }
}

// AI ROADMAPPER LOGIC
let currentAIRoadmap = [];

async function handleGenerateRoadmap() {
  const goal = document.getElementById("aiGoal").value.trim();
  const time = document.getElementById("aiTimeframe").value.trim();

  if (!goal) return showToast("Vui lòng nhập mục tiêu", "warning");

  // Show Loading
  document.getElementById("aiInputStep").classList.add("d-none");
  document.getElementById("aiLoading").classList.remove("d-none");

  const roadmap = await getAIRoadmapSuggest(goal, time);
  
  document.getElementById("aiLoading").classList.add("d-none");

  if (roadmap && Array.isArray(roadmap)) {
    currentAIRoadmap = roadmap;
    renderAIRoadmap(roadmap);
    document.getElementById("aiResultStep").classList.remove("d-none");
    document.getElementById("aiStatusText").innerText = `Gemini AI đã gợi ý ${roadmap.length} công việc`;
  } else {
    showToast("AI không thể phản hồi đúng định dạng, vui lòng thử lại sau.", "error");
    resetAIModal();
  }
}

function renderAIRoadmap(tasks) {
  const list = document.getElementById("aiRoadmapList");
  list.innerHTML = tasks.map((t, i) => `
    <div class="col-md-6">
      <div class="card h-100 border-0 shadow-sm bg-light p-3">
        <div class="d-flex justify-content-between">
          <h6 class="fw-bold text-primary mb-1">${t.title}</h6>
          <span class="badge bg-${getPriorityColor(t.priority)} mb-2">${t.priority.toUpperCase()}</span>
        </div>
        <p class="small text-muted mb-2">${t.description}</p>
        <div class="mt-auto">
          <div class="d-flex flex-wrap gap-1">
            ${(t.subTasks || []).map(st => `<span class="badge bg-secondary opacity-50 small" style="font-size: 0.65rem">${st}</span>`).join("")}
          </div>
          <div class="small fw-bold text-dark mt-2 text-end">📅 +${t.deadlineDays} days</div>
        </div>
      </div>
    </div>
  `).join("");
}

async function handleApplyRoadmap() {
  if (currentAIRoadmap.length === 0) return;

  const teamId = document.getElementById("taskTeam").value;
  
  const res = await applyAIRoadmap(currentAIRoadmap, teamId);
  if (res) {
    showToast(res.message, "success");
    const modal = bootstrap.Modal.getInstance(document.getElementById('aiMagicModal'));
    modal.hide();
    resetAIModal();
    loadTasks();
  }
}

function resetAIModal() {
  document.getElementById("aiGoal").value = "";
  document.getElementById("aiTimeframe").value = "";
  document.getElementById("aiInputStep").classList.remove("d-none");
  document.getElementById("aiResultStep").classList.add("d-none");
  document.getElementById("aiLoading").classList.add("d-none");
  currentAIRoadmap = [];
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