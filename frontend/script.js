const API_URL = "https://codealpha-project-management-tool-gomj.onrender.com/api";
let token = localStorage.getItem("token");
let currentProjectId = null;
let currentTaskId = null;
let isRegisterMode = false;
let isLoggingOut = false;
let lastNetworkAlertAt = 0;

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}



async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = "Bearer " + token;

  let res;
  try {
    res = await fetch(API_URL + path, { ...options, headers });
  } catch (err) {

    if (Date.now() - lastNetworkAlertAt > 5000) {
      alert("Cannot reach the server. It may be waking up (can take up to 50 seconds). Please wait a moment and try again.");
      lastNetworkAlertAt = Date.now();
    }
    return null;
  }

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  if (res.status === 401 && !path.startsWith("/auth/")) {
    if (!isLoggingOut) {
      alert("Your session has expired. Please login again.");
      logout();
    }
    return null;
  }

  return { ok: res.ok, status: res.status, data };
}

function errMsg(result, fallback) {
  return (result && result.data && result.data.message) || fallback;
}

function logout() {
  isLoggingOut = true;
  token = null;
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  location.href = location.pathname;
}

const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");

if (token) showApp();

document.getElementById("toggleLink").addEventListener("click", toggleAuthMode);

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  document.getElementById("formTitle").textContent = isRegisterMode ? "Register" : "Login";
  document.getElementById("authBtn").textContent = isRegisterMode ? "Register" : "Login";
  document.getElementById("nameInput").style.display = isRegisterMode ? "block" : "none";
  document.getElementById("toggleText").innerHTML = isRegisterMode
    ? 'Already have an account? <span id="toggleLink">Login</span>'
    : 'Don\'t have an account? <span id="toggleLink">Register</span>';
  document.getElementById("toggleLink").addEventListener("click", toggleAuthMode);
}

document.getElementById("authBtn").addEventListener("click", async () => {
  const authBtn = document.getElementById("authBtn");
  if (authBtn.disabled) return;

  const name = document.getElementById("nameInput").value.trim();
  const email = document.getElementById("emailInput").value.trim();
  const password = document.getElementById("passwordInput").value;

  if (!email || !password || (isRegisterMode && !name)) {
    alert("Please fill in all fields");
    return;
  }

  const endpoint = isRegisterMode ? "/auth/register" : "/auth/login";
  const body = isRegisterMode ? { name, email, password } : { email, password };

  authBtn.disabled = true;
  authBtn.textContent = "Please wait...";

  try {
    const result = await api(endpoint, { method: "POST", body: JSON.stringify(body) });
    if (!result) return;

    if (result.ok && result.data && result.data.token) {
      localStorage.setItem("token", result.data.token);
      localStorage.setItem("userName", result.data.name);
      token = result.data.token;
      showApp();
    } else {
      alert(errMsg(result, "Something went wrong"));
    }
  } finally {
    authBtn.disabled = false;
    authBtn.textContent = isRegisterMode ? "Register" : "Login";
  }
});

function showApp() {
  authSection.style.display = "none";
  appSection.style.display = "flex";
  document.getElementById("userInfo").textContent = "Hi, " + (localStorage.getItem("userName") || "");
  document.getElementById("logoutBtn").style.display = "inline-block";
  loadProjects();
}

document.getElementById("createProjectBtn").addEventListener("click", async () => {
  const name = document.getElementById("projectNameInput").value.trim();
  if (!name) return;

  const result = await api("/projects", { method: "POST", body: JSON.stringify({ name }) });
  if (!result) return;
  if (!result.ok) return alert(errMsg(result, "Could not create project"));

  document.getElementById("projectNameInput").value = "";
  loadProjects();
});

async function loadProjects() {
  const result = await api("/projects");
  if (!result) return;
  if (!result.ok) return alert(errMsg(result, "Could not load projects"));

  const projects = Array.isArray(result.data) ? result.data : [];

  const list = document.getElementById("projectList");
  list.innerHTML = "";
  projects.forEach(p => {
    const li = document.createElement("li");
    li.textContent = p.name;
    li.addEventListener("click", () => selectProject(p._id, p.name));
    list.appendChild(li);
  });
}

function selectProject(id, name) {
  currentProjectId = id;
  document.getElementById("currentProjectName").textContent = name;
  document.getElementById("taskFormBox").style.display = "flex";
  document.getElementById("memberBox").style.display = "flex";
  loadMembers();
  loadTasks();
}

document.getElementById("addMemberBtn").addEventListener("click", async () => {
  const email = document.getElementById("memberEmailInput").value.trim();
  if (!email || !currentProjectId) return;

  const result = await api("/projects/" + currentProjectId + "/members", {
    method: "POST",
    body: JSON.stringify({ email })
  });
  if (!result) return;
  if (!result.ok) return alert(errMsg(result, "Could not add member"));

  document.getElementById("memberEmailInput").value = "";
  loadMembers();
});

async function loadMembers() {
  const result = await api("/projects/" + currentProjectId + "/members");
  if (!result) return;
  if (!result.ok) return alert(errMsg(result, "Could not load members"));

  const members = Array.isArray(result.data) ? result.data : [];

  document.getElementById("memberList").textContent = members.map(m => m.name).join(", ");

  const assignSelect = document.getElementById("taskAssignInput");
  assignSelect.innerHTML = '<option value="">Unassigned</option>';
  members.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m._id;
    opt.textContent = m.name;
    assignSelect.appendChild(opt);
  });
}

document.getElementById("createTaskBtn").addEventListener("click", async () => {
  const title = document.getElementById("taskTitleInput").value.trim();
  const priority = document.getElementById("taskPriorityInput").value;
  const assignedTo = document.getElementById("taskAssignInput").value;
  const dueDate = document.getElementById("taskDueInput").value; // "YYYY-MM-DD" or ""
  if (!title || !currentProjectId) return;

  const result = await api("/tasks", {
    method: "POST",
    body: JSON.stringify({
      title,
      priority,
      status: "To-Do",
      project: currentProjectId,
      assignedTo: assignedTo || null,
      dueDate: dueDate || undefined
    })
  });
  if (!result) return;
  if (!result.ok) return alert(errMsg(result, "Could not create task"));

  document.getElementById("taskTitleInput").value = "";
  document.getElementById("taskDueInput").value = "";
  loadTasks();
});

function todayString() {
  const now = new Date();
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
}

function dueDateHtml(t) {
  if (!t.dueDate) return "";
  const d = new Date(t.dueDate);
  if (isNaN(d.getTime())) return "";
  const dueStr = d.toISOString().slice(0, 10);
  const overdue = dueStr < todayString() && t.status !== "Done";
  const label = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return `<p class="${overdue ? "overdue" : ""}">Due: ${label}${overdue ? " (overdue)" : ""}</p>`;
}

async function loadTasks() {
  const result = await api("/tasks/" + currentProjectId);
  if (!result) return;
  if (!result.ok) return alert(errMsg(result, "Could not load tasks"));

  const tasks = Array.isArray(result.data) ? result.data : [];

  document.getElementById("todoList").innerHTML = "";
  document.getElementById("inprogressList").innerHTML = "";
  document.getElementById("doneList").innerHTML = "";

  tasks.forEach(t => {
    const commentCount = Array.isArray(t.comments) ? t.comments.length : 0;
    const assignee = t.assignedTo && t.assignedTo.name ? escapeHtml(t.assignedTo.name) : "Unassigned";
    const card = document.createElement("div");
    card.className = "taskCard";
    card.innerHTML = `
      <strong>${escapeHtml(t.title)}</strong>
      <p>Priority: ${escapeHtml(t.priority)}</p>
      <p>Assigned to: ${assignee}</p>
      ${dueDateHtml(t)}
      <p>Comments: ${commentCount}</p>
      <select onchange="updateStatus('${t._id}', this.value)">
        <option value="To-Do" ${t.status === "To-Do" ? "selected" : ""}>To-Do</option>
        <option value="In-Progress" ${t.status === "In-Progress" ? "selected" : ""}>In-Progress</option>
        <option value="Done" ${t.status === "Done" ? "selected" : ""}>Done</option>
      </select>
      <button class="deleteBtn" onclick="deleteTask('${t._id}')">Delete</button>
    `;
    card.addEventListener("click", (e) => {
      if (e.target.closest("select, button")) return;
      openComments(t._id, t.title);
    });
    if (t.status === "To-Do") document.getElementById("todoList").appendChild(card);
    else if (t.status === "In-Progress") document.getElementById("inprogressList").appendChild(card);
    else document.getElementById("doneList").appendChild(card);
  });
}

async function updateStatus(taskId, status) {
  const result = await api("/tasks/" + taskId, {
    method: "PUT",
    body: JSON.stringify({ status })
  });
  if (result && !result.ok) alert(errMsg(result, "Could not update task"));
  loadTasks();
}

async function deleteTask(taskId) {
  if (!confirm("Delete this task? This cannot be undone.")) return;

  const result = await api("/tasks/" + taskId, { method: "DELETE" });
  if (!result) return;
  if (!result.ok) return alert(errMsg(result, "Could not delete task"));

  loadTasks();
}

function openComments(taskId, title) {
  currentTaskId = taskId;
  document.getElementById("modalTaskTitle").textContent = title;
  document.getElementById("commentModal").style.display = "flex";
  loadComments();
}

async function loadComments() {
  const result = await api("/tasks/" + currentProjectId);
  if (!result) return;
  if (!result.ok) return alert(errMsg(result, "Could not load comments"));

  const tasks = Array.isArray(result.data) ? result.data : [];
  const task = tasks.find(t => t._id === currentTaskId);
  const comments = task && Array.isArray(task.comments) ? task.comments : [];

  const list = document.getElementById("commentsList");
  list.innerHTML = "";
  comments.forEach(c => {
    const div = document.createElement("div");
    div.className = "commentItem";
    div.innerHTML = `<b>${escapeHtml(c.postedBy ? c.postedBy.name : "User")}:</b> ${escapeHtml(c.text)}`;
    list.appendChild(div);
  });
}

document.getElementById("postCommentBtn").addEventListener("click", async () => {
  const text = document.getElementById("commentInput").value.trim();
  if (!text || !currentTaskId) return;

  const result = await api("/tasks/" + currentTaskId + "/comments", {
    method: "POST",
    body: JSON.stringify({ text })
  });
  if (!result) return;
  if (!result.ok) return alert(errMsg(result, "Could not post comment"));

  document.getElementById("commentInput").value = "";
  loadComments();
  loadTasks();
});

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("commentModal").style.display = "none";
});

document.getElementById("logoutBtn").addEventListener("click", logout);