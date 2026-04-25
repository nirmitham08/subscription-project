const API = "http://localhost:5000";

// ---------------- LOAD SERVICES ----------------
async function loadServices() {
    const res = await fetch(API + "/services");
    const data = await res.json();

    const select = document.getElementById("service");
    if (!select) return;

    select.innerHTML = '<option value="">Select Service</option>';

    data.forEach(service => {
        const option = document.createElement("option");
        option.value = service.service_id;
        option.textContent = service.service_name;
        select.appendChild(option);
    });
}

// ---------------- ADD ----------------
async function addSubscription() {
    const serviceId = document.getElementById("service").value;

    if (!serviceId) {
        alert("Select service");
        return;
    }

    await fetch(API + "/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId })
    });

    window.location.href = "index.html";
}

// ---------------- LOAD SUBSCRIPTIONS ----------------
async function loadSubscriptions() {
    const res = await fetch(API + "/subscriptions");
    const data = await res.json();

    const list = document.getElementById("list");
    const total = document.getElementById("total");

    if (!list) return;

    list.innerHTML = "";

    let sum = 0;

    data.forEach(sub => {
        sum += Number(sub.monthly_cost);

        const div = document.createElement("div");
        div.innerHTML = `
            <b>${sub.service_name}</b> (${sub.category}) - ₹${sub.monthly_cost}
            <button onclick="deleteSub(${sub.subscription_id})">Delete</button>
        `;
        list.appendChild(div);
    });

    total.innerText = sum;

    loadBudget();
    loadRecommendations();
}

// ---------------- DELETE ----------------
async function deleteSub(id) {
    await fetch(API + "/subscriptions/" + id, {
        method: "DELETE"
    });

    loadSubscriptions();
}

// ---------------- 💰 LOAD BUDGET ----------------
async function loadBudget() {
    const res = await fetch(API + "/budget");
    const data = await res.json();

    const box = document.getElementById("budgetBox");

    if (data.total > data.monthly_limit) {
        box.className = "budget over";
        box.innerText = `⚠️ Over Budget! Limit: ₹${data.monthly_limit}`;
    } else {
        box.className = "budget safe";
        box.innerText = `✅ Within Budget (Limit: ₹${data.monthly_limit})`;
    }
}

// ---------------- 📊 LOAD RECOMMENDATIONS ----------------
async function loadRecommendations() {
    const res = await fetch(API + "/recommendations");
    const data = await res.json();

    const container = document.getElementById("recommendations");
    if (!container) return;

    container.innerHTML = "";

    data.forEach(item => {
        const div = document.createElement("div");

        div.className = item.recommendation.includes("Cancel") ? "card cancel" : "card keep";

        div.innerHTML = `
            <b>${item.service_name}</b><br>
            Usage: ${item.total_usage} hrs<br>
            👉 ${item.recommendation}
        `;

        container.appendChild(div);
    });
}

// ---------------- AUTO LOAD ----------------
window.onload = () => {
    loadServices();
    loadSubscriptions();
};