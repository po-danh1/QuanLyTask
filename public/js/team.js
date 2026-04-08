let allTeams = [];

async function loadTeams() {
  allTeams = await getMyTeams();
  renderTeams();
  updateTeamSelects();
}

function renderTeams() {
  const teamList = document.getElementById("teamList");
  if (!teamList) return;

  if (allTeams.length === 0) {
    teamList.innerHTML = `<p class="text-muted text-center py-3">Bạn chưa có nhóm nào.</p>`;
    return;
  }

  teamList.innerHTML = allTeams.map(team => `
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-3 p-3 team-card">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h6 class="mb-0 fw-bold text-primary">👥 ${team.name}</h6>
            <small class="text-muted">${team.members.length} thành viên</small>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary btn-premium" onclick="openAddMemberModal('${team._id}')">+ Thêm</button>
            <button class="btn btn-sm btn-outline-danger btn-premium" onclick="handleDeleteTeam('${team._id}', '${team.name}')">🗑️</button>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          ${team.members.map(m => `
            <div class="d-flex align-items-center gap-1 bg-light rounded-pill px-3 py-1">
              <div class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style="width:24px;height:24px;font-size:0.7rem;">
                ${(m.userId?.username || "U")[0].toUpperCase()}
              </div>
              <span class="small fw-medium">${m.userId?.username || "User"}</span>
              ${m.role === "admin" ? '<span class="badge bg-danger-subtle text-danger ms-1" style="font-size:0.65rem">Leader</span>' : ""}
              ${m.userId?._id ? `<button class="btn btn-sm text-danger p-0 ms-1" style="font-size:0.7rem" onclick="handleRemoveMember('${team._id}', '${m.userId._id}')" title="Xóa khỏi nhóm">&times;</button>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `).join("");
}

function updateTeamSelects() {
  const taskTeam = document.getElementById("taskTeam");
  if (!taskTeam) return;
  const options = ['<option value="">Personal Task</option>'];
  allTeams.forEach(team => {
    options.push(`<option value="${team._id}">${team.name}</option>`);
  });
  taskTeam.innerHTML = options.join("");
}

// Alias để tương thích với HTML (onchange="loadTeamMembers()")
function loadTeamMembers() {
  loadAssignees();
}

function loadAssignees() {
  const teamId = document.getElementById("taskTeam").value;
  const assigneeSelect = document.getElementById("taskAssignee");
  if (!assigneeSelect) return;

  if (!teamId) {
    assigneeSelect.innerHTML = '<option value="">Assignee (Self)</option>';
    assigneeSelect.disabled = true;
    return;
  }

  const team = allTeams.find(t => t._id === teamId);
  if (team) {
    const members = team.members.map(m =>
      `<option value="${m.userId?._id}">${m.userId?.username || "User"}</option>`
    );
    assigneeSelect.innerHTML = '<option value="">-- Chọn người --</option>' + members.join("");
    assigneeSelect.disabled = false;
  }
}

async function handleCreateTeam() {
  const name = document.getElementById("newTeamName").value.trim();
  if (!name) return showToast("Vui lòng nhập tên nhóm", "warning");

  const team = await createTeam(name);
  if (team && team._id) {
    document.getElementById("newTeamName").value = "";
    showToast("Tạo nhóm thành công!", "success");
    await loadTeams();
  } else {
    showToast(team?.message || "Lỗi khi tạo nhóm", "danger");
  }
}

async function openAddMemberModal(teamId) {
  document.getElementById("addMemberTeamId").value = teamId;
  document.getElementById("newMemberSelect").value = "";
  document.getElementById("newMemberRole").value = "member";
  
  // Load all users into dropdown
  await loadUsersForSelect();
  
  const modal = new bootstrap.Modal(document.getElementById("addMemberModal"));
  modal.show();
}

// Load all users for member selection
async function loadUsersForSelect() {
  const select = document.getElementById("newMemberSelect");
  select.innerHTML = '<option value="">-- Đang tải... --</option>';
  
  const users = await getAllUsersApi();
  if (!users || !Array.isArray(users)) {
    select.innerHTML = '<option value="">Không thể tải danh sách</option>';
    return;
  }
  
  // Filter out users already in the team
  const teamId = document.getElementById("addMemberTeamId").value;
  const team = allTeams.find(t => t._id === teamId);
  const existingMemberIds = team ? team.members.map(m => m.userId?._id?.toString() || m.userId?.toString()) : [];
  
  const availableUsers = users.filter(u => !existingMemberIds.includes(u._id.toString()));
  
  if (availableUsers.length === 0) {
    select.innerHTML = '<option value="">Không có người dùng khả dụng</option>';
    return;
  }
  
  select.innerHTML = '<option value="">-- Chọn người dùng --</option>' +
    availableUsers.map(u => `<option value="${u.email}">${u.username || u.email} (${u.email})</option>`).join("");
}

async function handleAddMember() {
  const teamId = document.getElementById("addMemberTeamId").value;
  const email = document.getElementById("newMemberSelect").value;
  const role = document.getElementById("newMemberRole").value;
  
  if (!email) return showToast("Vui lòng chọn người dùng", "warning");

  const result = await addTeamMember(teamId, email, role);
  if (result && result.message && result.message.includes("thành công")) {
    showToast("Thành viên đã được thêm!", "success");
    document.getElementById("newMemberSelect").value = "";
    const modal = bootstrap.Modal.getInstance(document.getElementById("addMemberModal"));
    modal.hide();
    await loadTeams();
  } else {
    showToast(result?.message || "Lỗi khi thêm thành viên", "danger");
  }
}

async function handleRemoveMember(teamId, memberId) {
  if (!confirm("Bạn có chắc muốn xóa thành viên này khỏi nhóm?")) return;
  const result = await removeTeamMemberApi(teamId, memberId);
  if (result && result.team) {
    showToast("Đã xóa thành viên!", "info");
    await loadTeams();
  } else {
    showToast(result?.message || "Lỗi khi xóa thành viên", "danger");
  }
}

async function handleDeleteTeam(teamId, teamName) {
  if (!confirm(`Bạn có chắc muốn xóa nhóm "${teamName}"? Hành động này không thể hoàn tác.`)) return;
  const result = await deleteTeamApi(teamId);
  if (result && result.message) {
    showToast("Đã xóa nhóm thành công!", "info");
    await loadTeams();
  } else {
    showToast(result?.message || "Lỗi khi xóa nhóm", "danger");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("token")) {
    loadTeams();
  }
});
