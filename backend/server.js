const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ DB CONNECTION
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Nirmitha@123",
    database: "subscriptionDB"
});

db.connect(err => {
    if (err) {
        console.error("DB Connection Error:", err);
    } else {
        console.log("Connected to MySQL");
    }
});

// ---------------- GET SERVICES ----------------
app.get("/services", (req, res) => {
    db.query("SELECT * FROM service", (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// ---------------- ADD SUBSCRIPTION ----------------
app.post("/subscriptions", (req, res) => {
    const { service_id } = req.body;

    const sql = `
        INSERT INTO subscription (service_id)
        SELECT ?
        WHERE NOT EXISTS (
            SELECT 1 FROM subscription WHERE service_id = ?
        )
    `;

    db.query(sql, [service_id, service_id], (err, result) => {
        if (err) return res.status(500).send(err);

        if (result.affectedRows === 0) {
            return res.send("Already added");
        }

        res.send("Added successfully");
    });
});

// ---------------- GET SUBSCRIPTIONS ----------------
app.get("/subscriptions", (req, res) => {
    const sql = `
        SELECT s.subscription_id, sv.service_name, sv.category, sv.monthly_cost
        FROM subscription s
        JOIN service sv ON s.service_id = sv.service_id
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// ---------------- DELETE ----------------
app.delete("/subscriptions/:id", (req, res) => {
    const id = req.params.id;

    db.query("DELETE FROM subscription WHERE subscription_id = ?", [id], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Deleted");
    });
});

// ---------------- RECOMMENDATIONS ----------------
app.get("/recommendations", (req, res) => {
    const sql = `
        SELECT 
            s.subscription_id,
            sv.service_name,
            IFNULL(SUM(u.hours_used), 0) AS total_usage,
            CASE 
                WHEN IFNULL(SUM(u.hours_used), 0) < 2 THEN 'Cancel ❌'
                ELSE 'Keep ✅'
            END AS recommendation
        FROM subscription s
        JOIN service sv ON s.service_id = sv.service_id
        LEFT JOIN usage_logs u ON s.subscription_id = u.subscription_id
        GROUP BY s.subscription_id, sv.service_name
    `;

    db.query(sql, (err, result) => {
        if (err) return res.send(err);
        res.json(result);
    });
});

// ---------------- 💰 BUDGET API (NEW) ----------------
app.get("/budget", (req, res) => {
    const userId = 1;

    const totalQuery = `
        SELECT SUM(sv.monthly_cost) AS total
        FROM subscription s
        JOIN service sv ON s.service_id = sv.service_id
    `;

    const budgetQuery = `
        SELECT monthly_limit FROM user_budget WHERE user_id = ?
    `;

    db.query(totalQuery, (err, totalResult) => {
        if (err) return res.status(500).send(err);

        db.query(budgetQuery, [userId], (err, budgetResult) => {
            if (err) return res.status(500).send(err);

            res.json({
                total: totalResult[0].total || 0,
                monthly_limit: budgetResult[0]?.monthly_limit || 0
            });
        });
    });
});

// ---------------- SERVER ----------------
app.listen(5000, () => {
    console.log("Server running on port 5000");
});