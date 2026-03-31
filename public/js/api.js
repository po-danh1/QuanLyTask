const API_URL = "/api/tasks";

function getToken() {
  return localStorage.getItem("token");
}

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`
  };
}

function handleUnauthorized(res) {
  if (res.status === 401) {
    alert("Phiên đăng nhập hết hạn hoặc chưa đăng nhập");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return true;
  }
  return false;
}

async function getTasks(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (handleUnauthorized(res)) return [];
  return res.json();
}

async function getTaskById(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (handleUnauthorized(res)) return null;
  return res.json();
}

async function createTask(data) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });

  if (handleUnauthorized(res)) return null;
  return res.json();
}

async function updateTaskApi(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });

  if (handleUnauthorized(res)) return null;
  return res.json();
}

async function deleteTaskApi(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (handleUnauthorized(res)) return null;
  return res.json();
}

async function loadStats() {
  const res = await fetch("/api/tasks/stats", {
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (handleUnauthorized(res)) return;

  const data = await res.json();

  document.getElementById("totalTasks").innerText = data.total ?? 0;
  document.getElementById("completedTasks").innerText = data.completed ?? 0;
  document.getElementById("pendingTasks").innerText = data.pending ?? 0;
  document.getElementById("overdueTasks").innerText = data.overdue ?? 0;
}

// Comments API
async function getCommentsByTaskId(taskId) {
  const res = await fetch(`/api/comments/${taskId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (handleUnauthorized(res)) return [];
  if (!res.ok) return [];
  return res.json();
}

async function addCommentToTask(taskId, text) {
  const res = await fetch(`/api/comments/${taskId}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ text })
  });
  if (handleUnauthorized(res)) return null;
  if (!res.ok) return null;
  return res.json();
}

// Logs API
async function getLogsByTaskId(taskId) {
  const res = await fetch(`/api/logs/${taskId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (handleUnauthorized(res)) return [];
  if (!res.ok) return [];
  return res.json();
}

// Teams API
async function createTeam(name) {
  const res = await fetch("/api/teams", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name })
  });
  if (handleUnauthorized(res)) return null;
  return res.json();
}

async function getMyTeams() {
  const res = await fetch("/api/teams", {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (handleUnauthorized(res)) return [];
  return res.json();
}

async function addTeamMember(teamId, email) {
  const res = await fetch(`/api/teams/${teamId}/members`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ email })
  });
  return res.json();
}

async function removeTeamMember(teamId, memberId) {
  const res = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
}

// Sub-tasks API
async function addSubTask(taskId, text) {
  const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ text })
  });
  return res.json();
}

async function toggleSubTask(taskId, subTaskId) {
  const res = await fetch(`/api/tasks/${taskId}/subtasks/${subTaskId}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
}

async function deleteSubTask(taskId, subTaskId) {
  const res = await fetch(`/api/tasks/${taskId}/subtasks/${subTaskId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
}

async function getAnalyticsData() {
  const res = await fetch("/api/tasks/analytics", {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (handleUnauthorized(res)) return null;
  return res.json();
}

async function uploadAttachment(taskId, file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`/api/tasks/${taskId}/attachments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData
  });
  if (handleUnauthorized(res)) return null;
  return res.json();
}

async function deleteAttachmentApi(taskId, attachmentId) {
  const res = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  if (handleUnauthorized(res)) return null;
  return res.json();
}

async function bulkTasksApi(taskIds, action, status) {
  const res = await fetch("/api/tasks/bulk", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ taskIds, action, status })
  });
  if (handleUnauthorized(res)) return null;
  return res.json();
}

// AI Roadmap API
async function getAIRoadmapSuggest(prompt, timeframe) {
  const res = await fetch("/api/ai/roadmap-suggest", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ prompt, timeframe })
  });
  if (handleUnauthorized(res)) return null;
  return res.json();
}

async function applyAIRoadmap(tasks, teamId) {
  const res = await fetch("/api/ai/roadmap-apply", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ tasks, teamId })
  });
  if (handleUnauthorized(res)) return null;
  return res.json();
}