const supabaseUrl = "https://kokywibfyqaylatrkyka.supabase.co";
const supabaseKey = "sb_publishable_K6rbahsiuQbDrXN4XV1jOg_wy2VlHFY";
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// ================= LOGIN =================
async function employeeLogin() {
  const empCode = document.getElementById("emp_code").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: empCode + "@yourcompany.internal",
    password: password,
  });

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  localStorage.setItem("role", "employee");
  localStorage.setItem("currentUser", empCode);

  showPage("employeePage");
  loadEmployeeProfile(empCode);
  loadTrainings();
  loadMyApplications();

  document.getElementById("loginPage").style.display = "none";
}

async function adminLogin() {
  const adminCode = document.getElementById("admin_code").value;
  const adminPassword = document.getElementById("admin_password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: adminCode + "@yourcompany.internal",
    password: adminPassword,
  });

  if (error) {
    alert("Admin login failed: " + error.message);
    return;
  }

  localStorage.setItem("role", "admin");
  showPage("adminPage");
  loadApplications();
  loadAdminTrainings();
  loadAdminStats();
  document.getElementById("loginPage").style.display = "none";
}

async function logout() {
  await supabaseClient.auth.signOut();
  localStorage.removeItem("role");
  localStorage.removeItem("currentUser");
  showPage("loginPage");
}

// ================= PAGE HANDLER =================
function showPage(pageId) {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("employeePage").style.display = "none";
  document.getElementById("adminPage").style.display = "none";
  document.getElementById(pageId).style.display = "block";
}

// ================= EMPLOYEE PROFILE =================
async function loadEmployeeProfile(empCode) {
  const { data, error } = await supabaseClient
    .from("employees")
    .select("Name, employee_id, role, Location")
    .eq("employee_id", empCode)
    .single();

  if (error) {
    console.error("Error fetching employee profile:", error.message);
    return;
  }

  document.getElementById("Name").textContent = data.Name;
  document.getElementById("employee_id").textContent = data.employee_id;
  document.getElementById("role").textContent = data.role;
  document.getElementById("Location").textContent = data.Location;
  document.getElementById("welcomeUser").textContent = "Welcome " + data.Name;
}

// ================= TRAININGS (Employee view) =================
async function loadTrainings() {
  const user = localStorage.getItem("currentUser");

  // Fetch trainings and this user's existing applications in parallel
  const [trainingsRes, applicationsRes] = await Promise.all([
    supabaseClient.from("training_calendar").select("*"),
    supabaseClient
      .from("applications")
      .select("training_id, status")
      .eq("employee_id", user),
  ]);

  if (trainingsRes.error) {
    console.error("Error loading trainings:", trainingsRes.error.message);
    return;
  }

  // Map training_id -> status, so we know which trainings are already applied for
  const statusMap = {};
  if (!applicationsRes.error && applicationsRes.data) {
    applicationsRes.data.forEach((app) => {
      statusMap[app.training_id] = app.status;
    });
  }

  const container = document.getElementById("trainingContainer");
  container.innerHTML = "";

  trainingsRes.data.forEach((t) => {
    const card = document.createElement("div");
    card.className = "card";

    const existingStatus = statusMap[t.id];

    if (existingStatus) {
      card.innerHTML = `
        <h4>${t.course_name}</h4>
        <p>Organisation: ${t.Organisation}</p>
        <p>Duration: ${t.duration}</p>
        <p>Start Date: ${t.start_date}</p>
        <p>End Date: ${t.end_date}</p>
        <p>Location: ${t.Location}</p>
        <p>Seats Remaining: ${t["Seats Remaining"]}</p>
        <span class="status-badge status-${existingStatus}">${statusLabel(existingStatus)}</span>
      `;
    } else {
      card.innerHTML = `
        <h4>${t.course_name}</h4>
        <p>Organisation: ${t.Organisation}</p>
        <p>Duration: ${t.duration}</p>
        <p>Start Date: ${t.start_date}</p>
        <p>End Date: ${t.end_date}</p>
        <p>Location: ${t.Location}</p>
        <p>Seats Remaining: ${t["Seats Remaining"]}</p>
        <button class="apply-btn">Apply Now</button>
      `;

      // Attach the click handler with addEventListener instead of an
      // inline onclick string, so course/organisation names containing
      // quotes or apostrophes can't silently break the button.
      const applyBtn = card.querySelector(".apply-btn");
      applyBtn.addEventListener("click", () => {
        apply(
          t.id,
          t.course_name,
          t.Organisation,
          t.duration,
          t.start_date,
          t.end_date,
          applyBtn
        );
      });
    }

    container.appendChild(card);
  });

  // Reset the empty-state message whenever the training list is freshly loaded
  const emptyState = document.getElementById("noTrainingsFound");
  if (emptyState) emptyState.style.display = "none";
}

// Turns a status value into a readable label
function statusLabel(status) {
  if (status === "pending") return "Pending Approval";
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return status;
}

// ================= TRAININGS (Admin view) =================
async function loadAdminTrainings() {
  const { data, error } = await supabaseClient
    .from("training_calendar")
    .select("*");

  if (error) {
    console.error("Error loading admin trainings:", error.message);
    return;
  }

  const container = document.getElementById("adminTrainingContainer");
  if (!container) return;
  container.innerHTML = "";

  data.forEach((t) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h4>${t.course_name}</h4>
      <p>Organisation: ${t.Organisation}</p>
      <p>Duration: ${t.duration}</p>
      <p>Start Date: ${t.start_date}</p>
      <p>End Date: ${t.end_date}</p>
      <p>Location: ${t.Location}</p>
      <p>Seats Remaining: ${t["Seats Remaining"]}</p>
    `;
    container.appendChild(card);
  });

  // Reset the empty-state message whenever the training list is freshly loaded
  const emptyState = document.getElementById("noAdminTrainingsFound");
  if (emptyState) emptyState.style.display = "none";
}

// ================= APPLICATIONS =================
async function apply(
  trainingId,
  courseName,
  Organisation,
  duration,
  startDate,
  endDate,
  btn,
) {
  const user = localStorage.getItem("currentUser");

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Submitting...";
  }

  const { error } = await supabaseClient.from("applications").insert([
    {
      employee_id: user,
      training_id: trainingId,
      training_title: courseName,
      Organisation: Organisation,
      duration: duration,
      start_date: startDate,
      end_date: endDate,
      status: "pending",
    },
  ]);

  if (error) {
    alert("Error submitting application: " + error.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Apply Now";
    }
    return;
  }

  // Replace the button with a status badge instead of showing an alert
  if (btn) {
    const badge = document.createElement("span");
    badge.className = "status-badge status-pending";
    badge.textContent = "Pending Approval";
    btn.replaceWith(badge);
  }

  loadMyApplications();
}

let currentApplications = [];
let currentSortOrder = "desc";

async function loadApplications() {
  const { data, error } = await supabaseClient.from("applications").select("*");

  if (error) {
    console.error("Error loading applications:", error.message);
    return;
  }

  currentApplications = data;
  renderApplications();
}

function renderApplications() {
  const sorted = [...currentApplications].sort((a, b) => {
    const dateA = new Date(a.start_date);
    const dateB = new Date(b.start_date);
    return currentSortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const container = document.getElementById("applicationTable");
  container.innerHTML = "";

  sorted.forEach((app) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${app.employee_id}</td>
      <td>${app.training_title}</td>
      <td>${app.Organisation}</td>
      <td>${app.duration}</td>
      <td>${app.start_date}</td>
      <td>${app.end_date}</td>
      <td><span class="status-badge status-${app.status}">${statusLabel(app.status)}</span></td>
      <td>
        <button onclick="decision(${app.id}, 'approved')">Approve</button>
        <button onclick="decision(${app.id}, 'rejected')">Reject</button>
      </td>
    `;
    container.appendChild(row);
  });
}

function sortApplicationsByDate(order) {
  currentSortOrder = order;
  renderApplications();
}

async function decision(id, status) {
  const { error } = await supabaseClient
    .from("applications")
    .update({ status })
    .eq("id", id);

  if (error) {
    alert("Error updating application: " + error.message);
  } else {
    loadApplications();
    loadAdminStats();
  }
}

async function loadMyApplications() {
  const user = localStorage.getItem("currentUser");

  const { data, error } = await supabaseClient
    .from("applications")
    .select("*")
    .eq("employee_id", user)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading applications:", error.message);
    return;
  }

  const container = document.getElementById("myApplications");
  container.innerHTML = "";

  data.forEach((app) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${app.training_title}</td>
      <td><span class="status-badge status-${app.status}">${statusLabel(app.status)}</span></td>
      <td>${new Date(app.created_at).toLocaleDateString()}</td>
    `;
    container.appendChild(row);
  });
}

// ================= ADMIN STATS =================
async function loadAdminStats() {
  const { data: employeeApps } = await supabaseClient
    .from("applications")
    .select("employee_id");

  const distinctEmployeeCount = employeeApps
    ? new Set(employeeApps.map((a) => a.employee_id)).size
    : 0;

  const { count: trainingCount } = await supabaseClient
    .from("training_calendar")
    .select("*", { count: "exact", head: true });

  const { count: pendingCount } = await supabaseClient
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: approvedCount } = await supabaseClient
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  document.getElementById("totalEmployees").textContent = distinctEmployeeCount;
  document.getElementById("totalTrainings").textContent = trainingCount ?? 0;
  document.getElementById("pendingApplications").textContent =
    pendingCount ?? 0;
  document.getElementById("approvedApplications").textContent =
    approvedCount ?? 0;
}

// Re-pulls applications, trainings, and stats from Supabase on demand, so the
// admin dashboard reflects the latest data (e.g. new applications submitted
// by employees, or newly added employees) without needing to log out and
// back in.
async function refreshAdminDashboard(btn) {
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Refreshing...";
  }

  await Promise.all([
    loadApplications(),
    loadAdminTrainings(),
    loadAdminStats(),
  ]);

  if (btn) {
    btn.disabled = false;
    btn.textContent = "Refresh";
  }
}

// ================= TEST CONNECTION =================
async function testConnection() {
  const { data, error } = await supabaseClient
    .from("training_calendar")
    .select("*");

  console.log("Data:", data);
  console.log("Error:", error);
}

testConnection();

// ================= SEARCH TRAININGS =================
// Scoped to #trainingContainer only, so it never touches the "My Applications"
// card or anything else on the page. Also toggles a "no results" empty state
// instead of silently leaving a blank grid.
function searchTraining() {
  const searchValue = document
    .getElementById("trainingSearch")
    .value.toLowerCase();

  const cards = document.querySelectorAll("#trainingContainer .card");
  let visibleCount = 0;

  cards.forEach((card) => {
    const text = card.innerText.toLowerCase();
    const matches = text.includes(searchValue);
    card.style.display = matches ? "" : "none";
    if (matches) visibleCount++;
  });

  const emptyState = document.getElementById("noTrainingsFound");
  if (emptyState) {
    emptyState.style.display = visibleCount === 0 ? "flex" : "none";
  }
}

// ================= SEARCH TRAININGS (Admin) =================
// Scoped to #adminTrainingContainer only, so it never touches the
// Training Applications table or anything else on the admin page.
function searchAdminTraining() {
  const searchValue = document
    .getElementById("adminTrainingSearch")
    .value.toLowerCase();

  const cards = document.querySelectorAll("#adminTrainingContainer .card");
  let visibleCount = 0;

  cards.forEach((card) => {
    const text = card.innerText.toLowerCase();
    const matches = text.includes(searchValue);
    card.style.display = matches ? "" : "none";
    if (matches) visibleCount++;
  });

  const emptyState = document.getElementById("noAdminTrainingsFound");
  if (emptyState) {
    emptyState.style.display = visibleCount === 0 ? "flex" : "none";
  }
}