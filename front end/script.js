const API = "http://localhost:5000";
const user_id = localStorage.getItem("user_id");

// LOGIN CHECK
if (!user_id) window.location.href = "login.html";

// LOGOUT
function logout() {
    localStorage.removeItem("user_id");
    window.location.href = "login.html";
}

// LOAD SERVICES
async function loadServices() {
    const res = await fetch(API + "/services");
    const data = await res.json();

    const select = document.getElementById("service");
    if (!select) return;

    select.innerHTML = "";

    data.forEach(s => {
        let opt = document.createElement("option");
        opt.value = s.service_id;
        opt.textContent = s.service_name;
        select.appendChild(opt);
    });
}

// ADD SUB
async function addSub() {
    const service_id = document.getElementById("service").value;

    await fetch(API + "/subscriptions", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({user_id, service_id})
    });

    window.location.href = "index.html";
}

// LOAD SUBS
async function loadSubs() {
    const res = await fetch(API + "/subscriptions/" + user_id);
    const data = await res.json();

    const list = document.getElementById("list");
    if (!list) return;

    list.innerHTML = "";

    let total = 0;

    data.forEach(s => {
        const price = s.custom_price ? s.custom_price : s.monthly_cost;
        total += Number(price);

        let div = document.createElement("div");

        div.innerHTML = `
            <b>${s.service_name}</b> - ₹${price}
            <input id="p${s.subscription_id}" placeholder="Change price">
            <button onclick="updatePrice(${s.subscription_id})">Update</button>
            <button onclick="del(${s.subscription_id})">Delete</button>
        `;

        list.appendChild(div);
    });

    document.getElementById("total").innerText = total;
    checkBudget(total);
}

// UPDATE PRICE
async function updatePrice(id) {
    const val = document.getElementById("p" + id).value;

    await fetch(API + "/update-price", {
        method: "PUT",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({subscription_id: id, price: val})
    });

    loadSubs();
}

// DELETE
async function del(id) {
    await fetch(API + "/subscriptions/" + id, {method:"DELETE"});
    loadSubs();
}

// SAVE BUDGET
async function saveBudget() {
    const val = document.getElementById("budget").value;

    await fetch(API + "/budget", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({user_id, monthly_limit: val})
    });

    alert("Saved");
}

// CHECK BUDGET
async function checkBudget(total) {
    const res = await fetch(API + "/budget/" + user_id);
    const data = await res.json();

    if (data.length === 0) return;

    const limit = data[0].monthly_limit;

    const warn = document.getElementById("warning");

    if (total > limit) {
        warn.innerHTML = "⚠️ Budget Exceeded!";
        warn.style.color = "red";
    } else {
        warn.innerHTML = "✅ Within Budget";
        warn.style.color = "green";
    }
}

// AUTO LOAD
window.onload = loadSubs;