let allTeams = [];

async function loadTeams() {
  allTeams = await getMyTeams();
  renderTeams();
  updateTeamSelects();
}

function renderTeams() {
  const teamList = document.getElementById("teamList");
  if (allTeams.length === 0) {
    teamList.innerHTML = `<p class="text-muted text-center py-3">Bạn chưa có nhóm nào.</p>`;
    return;
  }

  teamList.innerHTML = allTeams.map(team => `
    <div class="list-group-item">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0 text-primary">${team.name}</h6>
        <button class="btn btn-sm btn-outline-success" onclick="openAddMemberModal('${team._id}')">+ Thành viên</button>
      </div>
      <div class="small text-muted">Thành viên:</div>
      <div class="d-flex flex-wrap gap-2 mt-1">
        ${team.members.map(m => `
          <span class="badge bg-light text-dark border d-flex align-items-center p-1">
            <img src="${m.userId?.avatar || 'https://via.placeholder.com/20'}" class="rounded-circle me-1" width="20" height="20">
            ${m.userId?.username || 'User'}
            ${m.role === 'admin' ? '<small class="ms-1 text-danger">(L)</small>' : ''}
          </span>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function updateTeamSelects() {
  const taskTeam = document.getElementById("taskTeam");
  const options = ['<option value="">Personal Task</option>'];
  allTeams.forEach(team => {
    options.push(`<option value="${team._id}">${team.name}</option>`);
  });
  taskTeam.innerHTML = options.join("");
}

function loadAssignees() {
  const teamId = document.getElementById("taskTeam").value;
  const assigneeSelect = document.getElementById("taskAssignee");
  
  if (!teamId) {
    assigneeSelect.innerHTML = '<option value="">Assignee (Self)</option>';
    assigneeSelect.disabled = true;
    return;
  }

  const team = allTeams.find(t => t._id === teamId);
  if (team) {
    const members = team.members.map(m => `
      <option value="${m.userId?._id}">${m.userId?.username || 'User'}</option>
    `);
    assigneeSelect.innerHTML = members.join("");
    assigneeSelect.disabled = false;
  }
}

async function handleCreateTeam() {
  const name = document.getElementById("newTeamName").value.trim();
  if (!name) return showToast("Vui lòng nhập tên nhóm", "warning");

  const team = await createTeam(name);
  if (team) {
    document.getElementById("newTeamName").value = "";
    showToast("Tạo nhóm thành công!", "success");
    await loadTeams();
  }
}

function openAddMemberModal(teamId) {
  document.getElementById("currentTargetTeamId").value = teamId;
  const modal = new bootstrap.Modal(document.getElementById("addMemberModal"));
  modal.show();
}

async function handleAddMember() {
  const teamId = document.getElementById("currentTargetTeamId").value;
  const email = document.getElementById("newMemberEmail").value.trim();
  if (!email) return showToast("Vui lòng nhập email", "warning");

  const result = await addTeamMember(teamId, email);
  if (result.message.includes("thành công")) {
    showToast("Thành viên đã được thêm!", "success");
    document.getElementById("newMemberEmail").value = "";
    const modal = bootstrap.Modal.getInstance(document.getElementById("addMemberModal"));
    modal.hide();
    await loadTeams();
  } else {
    showToast(result.message || "Lỗi khi thêm thành viên", "danger");
  }
}

// Gọi loadTeams khi vừa vào trang để populate dropdown
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("token")) {
    loadTeams();
  }
});
