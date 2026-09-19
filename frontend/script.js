const API_URL = "https://codealpha-project-management-tool-gomj.onrender.com/api";
let token = localStorage.getItem("token");
let currentProjectId = null;
let currentTaskId = null;
let isRegisterMode = false;

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
  const name = document.getElementById("nameInput").value;
  const email = document.getElementById("emailInput").value;
  const password = document.getElementById("passwordInput").value;

  const endpoint = isRegisterMode ? "/auth/register" : "/auth/login";
  const body = isRegisterMode ? { name, email, password } : { email, password };

  const res = await fetch(API_URL + endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userName", data.name);
    token = data.token;
    showApp();
  } else {
    alert(data.message || "Something went wrong");
  }
});

function showApp() {
  authSection.style.display = "none";
  appSection.style.display = "flex";
  document.getElementById("userInfo").textContent = "Hi, " + localStorage.getItem("userName");
  document.getElementById("logoutBtn").style.display = "inline-block";
  loadProjects();
}

document.getElementById("createProjectBtn").addEventListener("click", async () => {
  const name = document.getElementById("projectNameInput").value;
  if (!name) return;

  await fetch(API_URL + "/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ name })
  });

  document.getElementById("projectNameInput").value = "";
  loadProjects();
});

async function loadProjects() {
  const res = await fetch(API_URL + "/projects", {
    headers: { Authorization: "Bearer " + token }
  });
  const projects = await res.json();

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
  const email = document.getElementById("memberEmailInput").value;
  if (!email) return;

  const res = await fetch(API_URL + "/projects/" + currentProjectId + "/members", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) return alert(data.message);

  document.getElementById("memberEmailInput").value = "";
  loadMembers();
});

async function loadMembers() {
  const res = await fetch(API_URL + "/projects/" + currentProjectId + "/members", {
    headers: { Authorization: "Bearer " + token }
  });
  const members = await res.json();

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
  const title = document.getElementById("taskTitleInput").value;
  const priority = document.getElementById("taskPriorityInput").value;
  const assignedTo = document.getElementById("taskAssignInput").value;
  if (!title || !currentProjectId) return;

  await fetch(API_URL + "/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ title, priority, status: "To-Do", project: currentProjectId, assignedTo: assignedTo || null })
  });

  document.getElementById("taskTitleInput").value = "";
  loadTasks();
});

async function loadTasks() {
  const res = await fetch(API_URL + "/tasks/" + currentProjectId, {
    headers: { Authorization: "Bearer " + token }
  });
  const tasks = await res.json();

  document.getElementById("todoList").innerHTML = "";
  document.getElementById("inprogressList").innerHTML = "";
  document.getElementById("doneList").innerHTML = "";

  tasks.forEach(t => {
    const card = document.createElement("div");
    card.className = "taskCard";
    card.innerHTML = `
      <strong>${t.title}</strong>
      <p>Priority: ${t.priority}</p>
      <p>Comments: ${t.comments.length}</p>
      <select onchange="updateStatus('${t._id}', this.value)">
        <option value="To-Do" ${t.status === "To-Do" ? "selected" : ""}>To-Do</option>
        <option value="In-Progress" ${t.status === "In-Progress" ? "selected" : ""}>In-Progress</option>
        <option value="Done" ${t.status === "Done" ? "selected" : ""}>Done</option>
      </select>
    `;
    card.addEventListener("click", (e) => {
      if (e.target.tagName !== "SELECT") openComments(t._id, t.title);
    });
    if (t.status === "To-Do") document.getElementById("todoList").appendChild(card);
    else if (t.status === "In-Progress") document.getElementById("inprogressList").appendChild(card);
    else document.getElementById("doneList").appendChild(card);
  });
}

async function updateStatus(taskId, status) {
  await fetch(API_URL + "/tasks/" + taskId, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ status })
  });
  loadTasks();
}

function openComments(taskId, title) {
  currentTaskId = taskId;
  document.getElementById("modalTaskTitle").textContent = title;
  document.getElementById("commentModal").style.display = "flex";
  loadComments();
}

async function loadComments() {
  const res = await fetch(API_URL + "/tasks/" + currentProjectId, {
    headers: { Authorization: "Bearer " + token }
  });
  const tasks = await res.json();
  const task = tasks.find(t => t._id === currentTaskId);

  const list = document.getElementById("commentsList");
  list.innerHTML = "";
  task.comments.forEach(c => {
    const div = document.createElement("div");
    div.className = "commentItem";
    div.innerHTML = `<b>${c.postedBy ? c.postedBy.name : "User"}:</b> ${c.text}`;
    list.appendChild(div);
  });
}

document.getElementById("postCommentBtn").addEventListener("click", async () => {
  const text = document.getElementById("commentInput").value;
  if (!text) return;

  await fetch(API_URL + "/tasks/" + currentTaskId + "/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ text })
  });

  document.getElementById("commentInput").value = "";
  loadComments();
  loadTasks();
});

document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("commentModal").style.display = "none";
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.clear();
  location.href = location.pathname;
});