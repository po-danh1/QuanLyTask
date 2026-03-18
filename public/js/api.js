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