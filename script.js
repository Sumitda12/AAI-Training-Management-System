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

function adminLogin() {
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
    supabaseClient.from("applications").select("training_id, status").eq("employee_id", user)
  ]);

  if (trainingsRes.error) {
    console.error("Error loading trainings:", trainingsRes.error.message);
    return;
  }

  // Map training_id -> status, so we know which trainings are already applied for
  const statusMap = {};
  if (!applicationsRes.error && applicationsRes.data) {
    applicationsRes.data.forEach(app => {
      statusMap[app.training_id] = app.status;
    });
  }

  const container = document.getElementById("trainingContainer");
  container.innerHTML = "";

  trainingsRes.data.forEach(t => {
    const card = document.createElement("div");
    card.className = "card";

    const existingStatus = statusMap[t.id];
    const actionHtml = existingStatus
      ? `<span class="status-badge status-${existingStatus}">${statusLabel(existingStatus)}</span>`
      : `<button onclick="apply(${t.id}, '${t.course_name}', '${t.organisation}', '${t.duration}', '${t.start_date}', '${t.end_date}', this)">Apply</button>`;

    card.innerHTML = `
      <h4>${t.course_name}</h4>
      <p>Organisation: ${t.organisation}</p>
      <p>Duration: ${t.duration}</p>
      <p>Start Date: ${t.start_date}</p>
      <p>End Date: ${t.end_date}</p>
      <p>Location: ${t.Location}</p>
      <p>Seats Remaining: ${t["Seats Remaining"]}</p>
      ${actionHtml}
    `;
    container.appendChild(card);
  });
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

  data.forEach(t => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h4>${t.course_name}</h4>
      <p>Organisation: ${t.organisation}</p>
      <p>Duration: ${t.duration}</p>
      <p>Start Date: ${t.start_date}</p>
      <p>End Date: ${t.end_date}</p>
      <p>Location: ${t.Location}</p>
      <p>Seats Remaining: ${t["Seats Remaining"]}</p>
    `;
    container.appendChild(card);
  });
}

// ================= APPLICATIONS =================
async function apply(trainingId, courseName, organisation, duration, startDate, endDate, btn) {
  const user = localStorage.getItem("currentUser");

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Submitting...";
  }

  const { error } = await supabaseClient
    .from("applications")
    .insert([
      {
        employee_id: user,
        training_id: trainingId,
        training_title: courseName,
        organisation: organisation,
        duration: duration,
        start_date: startDate,
        end_date: endDate,
        status: "pending"
      }
    ]);

  if (error) {
    alert("Error submitting application: " + error.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Apply";
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

async function loadApplications() {
  const { data, error } = await supabaseClient
    .from("applications")
    .select("*");

  if (error) {
    console.error("Error loading applications:", error.message);
    return;
  }

  const container = document.getElementById("applicationTable");
  container.innerHTML = "";

  data.forEach(app => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${app.employee_id}</td>
      <td>${app.training_title}</td>
      <td>${app.organisation}</td>
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

  data.forEach(app => {
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
  const { count: employeeCount } = await supabaseClient
    .from("employees")
    .select("*", { count: "exact", head: true });

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

  document.getElementById("totalEmployees").textContent = employeeCount ?? 0;
  document.getElementById("totalTrainings").textContent = trainingCount ?? 0;
  document.getElementById("pendingApplications").textContent = pendingCount ?? 0;
  document.getElementById("approvedApplications").textContent = approvedCount ?? 0;
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