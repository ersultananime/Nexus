function t(key) {
  const lang = localStorage.getItem("nexus_lang") || "en";
  return (window.translations[lang] && window.translations[lang][key]) || key;
}

function translatePage() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    el.setAttribute("placeholder", t(key));
  });
}

const state = {
  backendUrl: localStorage.getItem("nexus_backend_url") || (window.location.origin.startsWith("http") ? window.location.origin : "http://localhost:8000"),
  token: localStorage.getItem("nexus_token") || null,
  user: null,
  activeProject: null,
  activeSprint: null
};

function getHeaders() {
  const headers = {};
  if (state.token) {
    headers["Authorization"] = `Bearer ${state.token}`;
  }
  return headers;
}

async function apiRequest(path, options = {}) {
  const url = `${state.backendUrl}${path}`;
  const headers = getHeaders();
  
  if (options.body && !(options.body instanceof URLSearchParams)) {
    headers["Content-Type"] = "application/json";
    if (typeof options.body === "object") {
      options.body = JSON.stringify(options.body);
    }
  }

  options.headers = { ...headers, ...options.headers };

  const response = await fetch(url, options);
  if (!response.ok) {
    let errorDetail = "API Error";
    try {
      const data = await response.json();
      errorDetail = data.detail || (data.errors ? data.errors.map(e => e.message).join(", ") : null) || JSON.stringify(data);
    } catch (e) {}
    throw new Error(errorDetail);
  }
  
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const backendSelect = document.getElementById("backend-toggle");
  if (backendSelect) {
    backendSelect.value = state.backendUrl;
    backendSelect.addEventListener("change", (e) => {
      localStorage.setItem("nexus_backend_url", e.target.value);
      state.backendUrl = e.target.value;
      window.location.reload();
    });
  }

  const langToggle = document.getElementById("lang-toggle");
  if (langToggle) {
    langToggle.value = localStorage.getItem("nexus_lang") || "en";
    langToggle.addEventListener("change", (e) => {
      localStorage.setItem("nexus_lang", e.target.value);
      window.location.reload();
    });
  }
  translatePage();

  const isPortalPage = document.getElementById("login-card") !== null;
  
  if (isPortalPage) {
    if (state.token) {
      window.location.href = "dashboard.html";
      return;
    }
    initAuthPage();
  } else {
    if (!state.token) {
      window.location.href = "index.html";
      return;
    }
    initDashboardPage();
  }
});

function initAuthPage() {
  const loginCard = document.getElementById("login-card");
  const registerCard = document.getElementById("register-card");
  const toRegisterBtn = document.getElementById("to-register-btn");
  const toLoginBtn = document.getElementById("to-login-btn");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const regRole = document.getElementById("reg-role");
  const studentIdWrapper = document.getElementById("student-id-wrapper");

  toRegisterBtn.addEventListener("click", () => {
    loginCard.classList.add("hidden");
    registerCard.classList.remove("hidden");
  });

  toLoginBtn.addEventListener("click", () => {
    registerCard.classList.add("hidden");
    loginCard.classList.remove("hidden");
  });

  regRole.addEventListener("change", (e) => {
    if (e.target.value === "STUDENT") {
      studentIdWrapper.classList.remove("hidden");
    } else {
      studentIdWrapper.classList.add("hidden");
    }
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");
    
    errorEl.classList.add("hidden");

    try {
      let body;
      let headers = {};
      
      if (state.backendUrl.includes("8000")) {
        body = new URLSearchParams();
        body.append("username", email);
        body.append("password", password);
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      } else {
        body = { username: email, password: password };
      }

      const res = await apiRequest("/api/auth/login", {
        method: "POST",
        headers,
        body
      });

      localStorage.setItem("nexus_token", res.access_token);
      state.token = res.access_token;
      window.location.href = "dashboard.html";
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
    }
  });

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const firstName = document.getElementById("reg-first-name").value;
    const lastName = document.getElementById("reg-last-name").value;
    const email = document.getElementById("reg-email").value;
    const password = document.getElementById("reg-password").value;
    const role = regRole.value;
    const studentId = document.getElementById("reg-student-id").value;
    const errorEl = document.getElementById("reg-register-error") || document.getElementById("register-error");

    errorEl.classList.add("hidden");

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          role,
          student_id: role === "STUDENT" ? studentId : null
        }
      });

      let body;
      let headers = {};
      if (state.backendUrl.includes("8000")) {
        body = new URLSearchParams();
        body.append("username", email);
        body.append("password", password);
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      } else {
        body = { username: email, password: password };
      }

      const loginRes = await apiRequest("/api/auth/login", {
        method: "POST",
        headers,
        body
      });

      localStorage.setItem("nexus_token", loginRes.access_token);
      state.token = loginRes.access_token;
      window.location.href = "dashboard.html";
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove("hidden");
    }
  });
}

async function initDashboardPage() {
  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("nexus_token");
    state.token = null;
    state.user = null;
    window.location.href = "index.html";
  });

  try {
    state.user = await apiRequest("/api/users/me");
    renderUserInfo();
    await loadProfile();
    await loadTeams();
    await loadProjects();
  } catch (err) {
    localStorage.removeItem("nexus_token");
    window.location.href = "index.html";
  }

  const profileForm = document.getElementById("profile-form");
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const skills = document.getElementById("prof-skills").value;
    const bio = document.getElementById("prof-bio").value;
    const successEl = document.getElementById("profile-success");
    
    successEl.classList.add("hidden");
    try {
      await apiRequest("/api/profiles/me", {
        method: "PUT",
        body: { skills, bio }
      });
      successEl.classList.remove("hidden");
      setTimeout(() => successEl.classList.add("hidden"), 3000);
      if (state.user.role === "STUDENT") {
        await loadTeams();
      }
    } catch (err) {
      alert(t("error-saving-profile") + ": " + err.message);
    }
  });

  if (state.user.role === "COORDINATOR" || state.user.role === "TEACHER") {
    document.getElementById("show-add-project-btn").classList.remove("hidden");
    document.getElementById("show-add-sprint-btn").classList.remove("hidden");
  }

  setupModals();
}

function renderUserInfo() {
  document.getElementById("header-user-email").textContent = state.user.email;
  document.getElementById("header-user-role").textContent = t("role-" + state.user.role.toLowerCase());
  document.getElementById("prof-first-name").textContent = state.user.first_name;
  document.getElementById("prof-last-name").textContent = state.user.last_name;
  
  const idEl = document.getElementById("prof-student-id");
  const groupEl = document.getElementById("prof-student-id-group");
  if (state.user.role === "STUDENT") {
    idEl.textContent = state.user.student_id;
    groupEl.classList.remove("hidden");
  } else {
    groupEl.classList.add("hidden");
  }
}

async function loadProfile() {
  if (state.user.role === "STUDENT") {
    try {
      const profile = await apiRequest("/api/profiles/me");
      document.getElementById("prof-skills").value = profile.skills || "";
      document.getElementById("prof-bio").value = profile.bio || "";
    } catch (e) {}
  } else {
    document.getElementById("prof-skills").disabled = true;
    document.getElementById("prof-bio").disabled = true;
    document.querySelector("#profile-form button").classList.add("hidden");
  }
}

async function loadTeams() {
  const infoEl = document.getElementById("current-team-info");
  const createEl = document.getElementById("create-team-container");
  const matchEl = document.getElementById("team-matching-container");

  try {
    const teams = await apiRequest("/api/teams");
    const profiles = await apiRequest("/api/profiles");
    const users = await apiRequest("/api/users");

    let myTeam = null;
    let myProfile = null;

    if (state.user.role === "STUDENT") {
      myProfile = profiles.find(p => p.user_id === state.user.id);
      if (myProfile && myProfile.team_id) {
        myTeam = teams.find(t => t.id === myProfile.team_id);
      }
    }

    if (myTeam) {
      createEl.classList.add("hidden");
      matchEl.classList.add("hidden");
      
      const teamMembers = profiles
        .filter(p => p.team_id === myTeam.id)
        .map(p => {
          const u = users.find(user => user.id === p.user_id);
          return u ? `${u.first_name} ${u.lastName || u.last_name} (${p.skills || t("none-val")})` : t("unknown-student");
        });

      infoEl.innerHTML = `
        <h4>${myTeam.name}</h4>
        <p>${t("desired")}: ${myTeam.desired_skills || t("none-val")}</p>
        <ul class="team-members-list">
          ${teamMembers.map(m => `<li>• ${m}</li>`).join("")}
        </ul>
        <button id="leave-team-btn" class="btn btn-sm btn-danger" style="margin-top: 1rem; width: 100%">${t("leave-team")}</button>
      `;

      document.getElementById("leave-team-btn").addEventListener("click", async () => {
        try {
          await apiRequest(`/api/teams/${myTeam.id}/leave`, { method: "POST" });
          await loadTeams();
          await loadProjects();
        } catch (err) {
          alert(err.message);
        }
      });
    } else {
      if (state.user.role === "STUDENT") {
        createEl.classList.remove("hidden");
        matchEl.classList.remove("hidden");
        infoEl.innerHTML = `<p>${t("not-in-team")}</p>`;
        
        try {
          const matchResults = await apiRequest("/api/teams/match");
          const matchElList = document.getElementById("recommended-teams-list");
          matchElList.innerHTML = "";
          
          if (matchResults.length === 0) {
            matchElList.innerHTML = `<p style="font-size:0.85rem; color:var(--text-muted)">${t("no-teams-available")}</p>`;
          } else {
            matchResults.forEach(match => {
              const card = document.createElement("div");
              card.className = "matching-card";
              card.innerHTML = `
                <div class="matching-card-header">
                  <h5>${match.name}</h5>
                  <span class="match-score-badge">${t("match")}: ${match.match_score}</span>
                </div>
                <p>${t("desired")}: ${match.desired_skills || t("none-val")}</p>
                <button class="btn btn-sm btn-primary join-team-btn" data-id="${match.id}" style="margin-top:0.4rem">${t("join")}</button>
              `;
              matchElList.appendChild(card);
            });

            document.querySelectorAll(".join-team-btn").forEach(btn => {
              btn.addEventListener("click", async (e) => {
                const teamId = e.target.getAttribute("data-id");
                try {
                  await apiRequest(`/api/teams/${teamId}/join`, { method: "POST" });
                  await loadTeams();
                  await loadProjects();
                } catch (err) {
                  alert(err.message);
                }
              });
            });
          }
        } catch (e) {
          document.getElementById("recommended-teams-list").innerHTML = `<p>${t("failed-recommendations")}</p>`;
        }
      } else {
        createEl.classList.remove("hidden");
        matchEl.classList.add("hidden");
        infoEl.innerHTML = `
          <h4>${t("global-teams-list")}</h4>
          <ul class="team-members-list" style="max-height: 200px; overflow-y: auto;">
            ${teams.map(t => `<li>• ${t.name} (ID: ${t.id})</li>`).join("")}
          </ul>
        `;
      }
    }
  } catch (err) {
    infoEl.innerHTML = `<p>${t("error-loading-teams")}: ${err.message}</p>`;
  }
}

async function loadProjects() {
  const container = document.getElementById("projects-list-container");
  container.innerHTML = "";
  try {
    const projects = await apiRequest("/api/projects");
    const teams = await apiRequest("/api/teams");
    
    if (projects.length === 0) {
      container.innerHTML = `<p>${t("no-projects")}</p>`;
      return;
    }

    projects.forEach(proj => {
      const team = teams.find(t => t.id === proj.team_id);
      const isOverdue = proj.deadline && new Date(proj.deadline) < new Date() && proj.status !== "COMPLETED";
      
      const card = document.createElement("div");
      card.className = "project-card";
      if (state.activeProject && state.activeProject.id === proj.id) {
        card.classList.add("active");
      }
      
      card.innerHTML = `
        <div class="project-card-header">
          <h4>${proj.title}</h4>
          <span class="badge">${t("status-" + proj.status.toLowerCase())}</span>
        </div>
        <p>${proj.description || t("no-description")}</p>
        <div class="project-meta">
          <div class="project-meta-item">
            <span>${t("assigned-team-meta")}:</span>
            <span>${team ? team.name : t("unassigned-val")}</span>
          </div>
          <div class="project-meta-item ${isOverdue ? 'overdue' : ''}">
            <span>${t("deadline-meta")}:</span>
            <span>${proj.deadline ? new Date(proj.deadline).toLocaleDateString() : t("none-val")}</span>
          </div>
          ${(state.user.role === 'COORDINATOR' || state.user.role === 'TEACHER') ? `
            <div style="display:flex; gap:0.5rem; margin-top:0.5rem">
              <button class="btn btn-sm btn-secondary edit-proj-btn" data-id="${proj.id}">${t("edit-btn")}</button>
              <button class="btn btn-sm btn-danger delete-proj-btn" data-id="${proj.id}">${t("delete-btn")}</button>
            </div>
          ` : ""}
        </div>
      `;

      card.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn")) return;
        selectProject(proj);
      });

      container.appendChild(card);
    });

    document.querySelectorAll(".delete-proj-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = e.target.getAttribute("data-id");
        if (confirm(t("confirm-delete-project"))) {
          try {
            await apiRequest(`/api/projects/${id}`, { method: "DELETE" });
            if (state.activeProject && state.activeProject.id == id) {
              state.activeProject = null;
              document.getElementById("sprint-section").classList.add("hidden");
            }
            await loadProjects();
          } catch (err) {
            alert(err.message);
          }
        }
      });
    });

    document.querySelectorAll(".edit-proj-btn").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = e.target.getAttribute("data-id");
        const projects = await apiRequest("/api/projects");
        const proj = projects.find(p => p.id == id);
        if (proj) {
          showProjectModal(proj);
        }
      });
    });

  } catch (err) {
    container.innerHTML = `<p>${t("error-loading-projects")}: ${err.message}</p>`;
  }
}

function selectProject(project) {
  state.activeProject = project;
  document.querySelectorAll(".project-card").forEach(card => card.classList.remove("active"));
  loadProjects();

  document.getElementById("active-project-title").textContent = project.title;
  document.getElementById("sprint-section").classList.remove("hidden");
  document.getElementById("tasks-board-container").classList.add("hidden");
  state.activeSprint = null;

  loadSprints();
}

async function loadSprints() {
  const tabsList = document.getElementById("sprints-tabs-list");
  tabsList.innerHTML = "";
  try {
    const sprints = await apiRequest(`/api/projects/${state.activeProject.id}/sprints`);
    if (sprints.length === 0) {
      tabsList.innerHTML = `<p style="font-size:0.9rem; color:var(--text-muted)">${t("no-sprints")}</p>`;
      return;
    }

    sprints.forEach(sprint => {
      const tab = document.createElement("div");
      tab.className = "sprint-tab";
      if (state.activeSprint && state.activeSprint.id === sprint.id) {
        tab.classList.add("active");
      }
      tab.textContent = sprint.name;
      
      tab.addEventListener("click", () => {
        selectSprint(sprint);
      });

      if (state.user.role === "COORDINATOR" || state.user.role === "TEACHER") {
        const delBtn = document.createElement("span");
        delBtn.textContent = " ×";
        delBtn.style.color = "var(--error)";
        delBtn.style.marginLeft = "0.5rem";
        delBtn.style.fontWeight = "bold";
        delBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (confirm(t("confirm-delete-sprint"))) {
            try {
              await apiRequest(`/api/projects/${state.activeProject.id}/sprints/${sprint.id}`, { method: "DELETE" });
              if (state.activeSprint && state.activeSprint.id === sprint.id) {
                state.activeSprint = null;
                document.getElementById("tasks-board-container").classList.add("hidden");
              }
              loadSprints();
            } catch (err) {
              alert(err.message);
            }
          }
        });
        tab.appendChild(delBtn);
      }

      tabsList.appendChild(tab);
    });
  } catch (err) {
    tabsList.innerHTML = `<p>Error loading sprints.</p>`;
  }
}

function selectSprint(sprint) {
  state.activeSprint = sprint;
  document.querySelectorAll(".sprint-tab").forEach(tab => tab.classList.remove("active"));
  loadSprints();

  document.getElementById("tasks-board-container").classList.remove("hidden");
  loadTasks();
}

async function loadTasks() {
  const todoList = document.getElementById("tasks-todo-list");
  const inprogressList = document.getElementById("tasks-inprogress-list");
  const reviewList = document.getElementById("tasks-review-list");
  const doneList = document.getElementById("tasks-done-list");

  todoList.innerHTML = "";
  inprogressList.innerHTML = "";
  reviewList.innerHTML = "";
  doneList.innerHTML = "";

  try {
    const tasks = await apiRequest(`/api/tasks?project_id=${state.activeProject.id}&sprint_id=${state.activeSprint.id}`);
    const teams = await apiRequest("/api/teams");

    tasks.forEach(task => {
      const card = document.createElement("div");
      card.className = "task-card";
      const assigned = teams.find(t => t.id === task.assigned_team_id);
      
      card.innerHTML = `
        <h6>${task.title}</h6>
        <p>${task.description || ''}</p>
        <div class="task-card-footer">
          <span style="color:var(--text-muted)">${t("team-meta")}: ${assigned ? assigned.name : t("none-val")}</span>
          <select class="select-field btn-sm task-status-select" data-id="${task.id}" style="padding:0.15rem 0.3rem; font-size:0.75rem">
            <option value="TO_DO" ${task.status === 'TO_DO' ? 'selected' : ''}>${t("status-to_do")}</option>
            <option value="IN_PROGRESS" ${task.status === 'IN_PROGRESS' ? 'selected' : ''}>${t("status-in_progress")}</option>
            <option value="REVIEW" ${task.status === 'REVIEW' ? 'selected' : ''}>${t("status-review")}</option>
            <option value="DONE" ${task.status === 'DONE' ? 'selected' : ''}>${t("status-done")}</option>
          </select>
        </div>
        ${(state.user.role === 'COORDINATOR' || state.user.role === 'TEACHER') ? `
          <button class="btn btn-sm btn-danger delete-task-btn" data-id="${task.id}" style="margin-top:0.4rem; padding:0.15rem; font-size:0.75rem; width:100%">${t("delete-btn")}</button>
        ` : ''}
      `;

      card.querySelector(".task-status-select").addEventListener("change", async (e) => {
        const id = e.target.getAttribute("data-id");
        const newStatus = e.target.value;
        try {
          await apiRequest(`/api/tasks/${id}`, {
            method: "PUT",
            body: {
              project_id: task.project_id,
              sprint_id: task.sprint_id,
              title: task.title,
              description: task.description,
              status: newStatus,
              assigned_team_id: task.assigned_team_id
            }
          });
          loadTasks();
        } catch (err) {
          alert(err.message);
        }
      });

      const delBtn = card.querySelector(".delete-task-btn");
      if (delBtn) {
        delBtn.addEventListener("click", async (e) => {
          const id = e.target.getAttribute("data-id");
          if (confirm(t("confirm-delete-task"))) {
            try {
              await apiRequest(`/api/tasks/${id}`, { method: "DELETE" });
              loadTasks();
            } catch (err) {
              alert(err.message);
            }
          }
        });
      }

      if (task.status === "TO_DO") todoList.appendChild(card);
      else if (task.status === "IN_PROGRESS") inprogressList.appendChild(card);
      else if (task.status === "REVIEW") reviewList.appendChild(card);
      else if (task.status === "DONE") doneList.appendChild(card);
    });
  } catch (err) {
    console.error(err);
  }
}

function setupModals() {
  const pModal = document.getElementById("project-modal");
  const sModal = document.getElementById("sprint-modal");
  const tModal = document.getElementById("task-modal");

  const addProjBtn = document.getElementById("show-add-project-btn");
  const addSprintBtn = document.getElementById("show-add-sprint-btn");
  const addTaskBtn = document.getElementById("show-add-task-btn");

  let editingProject = null;

  if (addProjBtn) {
    addProjBtn.addEventListener("click", () => {
      editingProject = null;
      document.getElementById("project-modal-title").textContent = t("new-project");
      document.getElementById("project-form").reset();
      loadProjectTeamOptions();
      pModal.classList.remove("hidden");
    });
  }

  if (addSprintBtn) {
    addSprintBtn.addEventListener("click", () => {
      document.getElementById("sprint-form").reset();
      sModal.classList.remove("hidden");
    });
  }

  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", () => {
      document.getElementById("task-form").reset();
      loadTaskTeamOptions();
      tModal.classList.remove("hidden");
    });
  }

  document.getElementById("close-project-modal-btn").addEventListener("click", () => pModal.classList.add("hidden"));
  document.getElementById("close-sprint-modal-btn").addEventListener("click", () => sModal.classList.add("hidden"));
  document.getElementById("close-task-modal-btn").addEventListener("click", () => tModal.classList.add("hidden"));

  window.showProjectModal = (proj) => {
    editingProject = proj;
    document.getElementById("project-modal-title").textContent = t("edit-project");
    document.getElementById("proj-title").value = proj.title;
    document.getElementById("proj-desc").value = proj.description || "";
    document.getElementById("proj-github").value = proj.github_url || "";
    if (proj.deadline) {
      document.getElementById("proj-deadline").value = new Date(proj.deadline).toISOString().substring(0, 16);
    } else {
      document.getElementById("proj-deadline").value = "";
    }
    document.getElementById("proj-status").value = proj.status;
    loadProjectTeamOptions(proj.team_id);
    pModal.classList.remove("hidden");
  };

  async function loadProjectTeamOptions(selectedTeamId = null) {
    const select = document.getElementById("proj-team");
    select.innerHTML = `<option value="">${t("unassigned-val")}</option>`;
    try {
      const teams = await apiRequest("/api/teams");
      teams.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.name;
        if (t.id === selectedTeamId) opt.selected = true;
        select.appendChild(opt);
      });
    } catch (e) {}
  }

  async function loadTaskTeamOptions() {
    const select = document.getElementById("task-team");
    select.innerHTML = `<option value="">${t("unassigned-val")}</option>`;
    try {
      const teams = await apiRequest("/api/teams");
      teams.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.name;
        select.appendChild(opt);
      });
    } catch (e) {}
  }

  document.getElementById("project-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("proj-title").value;
    const description = document.getElementById("proj-desc").value;
    const github_url = document.getElementById("proj-github").value;
    const deadline = document.getElementById("proj-deadline").value;
    const status = document.getElementById("proj-status").value;
    const team_id = document.getElementById("proj-team").value;

    const payload = {
      title,
      description,
      github_url: github_url || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status,
      team_id: team_id ? parseInt(team_id) : null
    };

    try {
      if (editingProject) {
        await apiRequest(`/api/projects/${editingProject.id}`, {
          method: "PUT",
          body: payload
        });
      } else {
        await apiRequest("/api/projects", {
          method: "POST",
          body: payload
        });
      }
      pModal.classList.add("hidden");
      await loadProjects();
    } catch (err) {
      alert(t("validation-error") + ": " + err.message);
    }
  });

  document.getElementById("sprint-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("sprint-name").value;
    const start_date = document.getElementById("sprint-start").value;
    const end_date = document.getElementById("sprint-end").value;
    const status = document.getElementById("sprint-status").value;

    const payload = {
      name,
      start_date: new Date(start_date).toISOString(),
      end_date: new Date(end_date).toISOString(),
      status
    };

    try {
      await apiRequest(`/api/projects/${state.activeProject.id}/sprints`, {
        method: "POST",
        body: payload
      });
      sModal.classList.add("hidden");
      loadSprints();
    } catch (err) {
      alert(t("validation-error") + ": " + err.message);
    }
  });

  document.getElementById("task-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("task-title").value;
    const description = document.getElementById("task-desc").value;
    const status = document.getElementById("task-status").value;
    const assigned_team_id = document.getElementById("task-team").value;

    const payload = {
      project_id: state.activeProject.id,
      sprint_id: state.activeSprint.id,
      title,
      description,
      status,
      assigned_team_id: assigned_team_id ? parseInt(assigned_team_id) : null
    };

    try {
      await apiRequest("/api/tasks", {
        method: "POST",
        body: payload
      });
      tModal.classList.add("hidden");
      loadTasks();
    } catch (err) {
      alert(t("validation-error") + ": " + err.message);
    }
  });

  const createTeamForm = document.getElementById("create-team-form");
  if (createTeamForm) {
    createTeamForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("new-team-name").value;
      const desired_skills = document.getElementById("new-team-skills").value;
      try {
        const team = await apiRequest("/api/teams", {
          method: "POST",
          body: { name, looking_for_members: true, desired_skills }
        });
        if (state.user.role === "STUDENT") {
          await apiRequest(`/api/teams/${team.id}/join`, { method: "POST" });
        }
        await loadTeams();
      } catch (err) {
        alert(err.message);
      }
    });
  }
}
