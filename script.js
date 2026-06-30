function employeeLogin() {
    const email = document.getElementById("email").value;

    localStorage.setItem("role", "employee");
    localStorage.setItem("currentUser", email || "Employee");

    showPage("employeePage");
    loadTrainings();
    loadMyApplications();

    document.getElementById("loginPage").style.display = "none";
}

function adminLogin() {
    localStorage.setItem("role", "admin");

    showPage("adminPage");
    loadApplications();

    document.getElementById("loginPage").style.display = "none";
}

function logout() {
    localStorage.removeItem("role");
    localStorage.removeItem("currentUser");

    showPage("loginPage");
}

function showPage(pageId) {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("employeePage").style.display = "none";
    document.getElementById("adminPage").style.display = "none";

    document.getElementById(pageId).style.display = "block";
}

function loadTrainings() {
    const trainings = [
        {
            id: 1,
            title: "Safety Training",
            location: "Delhi",
            seats_remaining: 20
        },
        {
            id: 2,
            title: "Fire Drill",
            location: "Mumbai",
            seats_remaining: 15
        }
    ];

    const container = document.getElementById("trainings");
    container.innerHTML = "";

    trainings.forEach(t => {
        const card = document.createElement("div");

        card.className = "card";

        card.innerHTML = `
            <h4>${t.title}</h4>
            <p>Location: ${t.location}</p>
            <p>Seats Remaining: ${t.seats_remaining}</p>
            <button onclick="apply(${t.id}, '${t.title}')">
                Apply
            </button>
        `;

        container.appendChild(card);
    });
}

function apply(trainingId, trainingTitle) {
    const user = localStorage.getItem("currentUser");

    let applications =
        JSON.parse(localStorage.getItem("applications")) || [];

    applications.push({
        id: Date.now(),
        user_name: user,
        training_title: trainingTitle,
        status: "pending"
    });

    localStorage.setItem(
        "applications",
        JSON.stringify(applications)
    );

    alert("Application submitted for " + trainingTitle);

    loadMyApplications();
}

function loadApplications() {
    let applications =
        JSON.parse(localStorage.getItem("applications")) || [];

    const container = document.getElementById("applications");

    container.innerHTML = "";

    applications.forEach(app => {
        if (app.status === "pending") {
            const card = document.createElement("div");

            card.className = "card";

            card.innerHTML = `
                <p>${app.user_name} - ${app.training_title}</p>

                <button onclick="decision(${app.id}, 'approved')">
                    Approve
                </button>

                <button onclick="decision(${app.id}, 'rejected')">
                    Reject
                </button>
            `;

            container.appendChild(card);
        }
    });
}

function decision(id, status) {
    let applications =
        JSON.parse(localStorage.getItem("applications")) || [];

    applications = applications.map(app => {
        if (app.id === id) {
            app.status = status;
        }
        return app;
    });

    localStorage.setItem(
        "applications",
        JSON.stringify(applications)
    );

    alert(`Application ${id} marked as ${status}`);

    loadApplications();
}

function loadMyApplications() {
    let applications =
        JSON.parse(localStorage.getItem("applications")) || [];

    const user = localStorage.getItem("currentUser");

    const container =
        document.getElementById("myApplications");

    container.innerHTML = "";

    applications
        .filter(app => app.user_name === user)
        .forEach(app => {
            const card = document.createElement("div");

            card.className = "card";

            card.innerHTML = `
                <p>
                    ${app.training_title}
                    - Status: ${app.status}
                </p>
            `;

            container.appendChild(card);
        });
}