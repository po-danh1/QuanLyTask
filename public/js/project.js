// ==================== PROJECT MANAGEMENT ====================

let allProjects = [];

async function loadProjects() {
  allProjects = await getProjectsApi();
  renderProjects();
}

function renderProjects() {
  const container = document.getElementById("projectList");
  if (!container) return;

  if (allProjects.length === 0) {
    container.innerHTML = `<p class="text-muted text-center py-3">Chưa có dự án nào.</p>`;
    return;
  }

  container.innerHTML = allProjects.map(proj => `
    <div class="col-12">
      <div class="card border-0 shadow-sm rounded-3 p-3">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h6 class="fw-bold text-primary mb-1">📁 ${proj.name}</h6>
            ${proj.description ? `<p class="small text-muted mb-1">${proj.description}</p>` : ""}
            <span class="badge bg-light text-dark border" style="font-size:0.75rem">
              ${proj.teamId ? "🏷️ Team Project" : "👤 Personal"}
            </span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-danger btn-premium" onclick="handleDeleteProject('${proj._id}', '${proj.name}')">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

async function handleCreateProject() {
  const name = document.getElementById("newProjectName").value.trim();
  const description = document.getElementById("newProjectDesc").value.trim();
  const teamId = document.getElementById("newProjectTeam").value;

  if (!name) return showToast("Vui lòng nhập tên dự án", "warning");

  const project = await createProjectApi({ name, description, teamId: teamId || null });
  if (project && project._id) {
    document.getElementById("newProjectName").value = "";
    document.getElementById("newProjectDesc").value = "";
    showToast("Tạo dự án thành công!", "success");
    await loadProjects();
  } else {
    showToast(project?.message || "Lỗi khi tạo dự án", "danger");
  }
}

async function handleDeleteProject(projectId, projectName) {
  if (!confirm(`Bạn có chắc muốn xóa dự án "${projectName}"? Tất cả task liên quan sẽ bị ẩn.`)) return;
  const result = await deleteProjectApi(projectId);
  if (result && result.message) {
    showToast("Đã xóa dự án thành công!", "info");
    await loadProjects();
  } else {
    showToast(result?.message || "Lỗi khi xóa dự án", "danger");
  }
}

// Cập nhật dropdown team cho project modal (gọi sau khi loadTeams)
function updateProjectTeamSelect() {
  const select = document.getElementById("newProjectTeam");
  if (!select || !allTeams) return;
  const options = ['<option value="">Không gắn team</option>'];
  allTeams.forEach(team => {
    options.push(`<option value="${team._id}">${team.name}</option>`);
  });
  select.innerHTML = options.join("");
}
