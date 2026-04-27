const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Nirmitha@123",
    database: "subscriptiondb"
});

db.connect(err => {
    if (err) console.log(err);
    else console.log("DB Connected");
});

// LOGIN
app.post("/login", (req, res) => {
    const { name, email } = req.body;

    db.query("SELECT * FROM user WHERE email=?", [email], (err, result) => {
        if (result.length > 0) return res.json(result[0]);

        db.query(
            "INSERT INTO user (name,email) VALUES (?,?)",
            [name, email],
            (err, data) => {
                res.json({ user_id: data.insertId, name, email });
            }
        );
    });
});

// SERVICES
app.get("/services", (req, res) => {
    db.query("SELECT * FROM service", (err, result) => {
        res.json(result);
    });
});

// ADD SUB
// ADD SUB (NO DUPLICATES)
app.post("/subscriptions", (req, res) => {
    const { user_id, service_id } = req.body;

    const sql = `
        INSERT INTO subscription (user_id, service_id)
        SELECT ?, ?
        WHERE NOT EXISTS (
            SELECT 1 FROM subscription 
            WHERE user_id = ? AND service_id = ?
        )
    `;

    db.query(sql, [user_id, service_id, user_id, service_id], (err, result) => {
        if (err) return res.send(err);

        if (result.affectedRows === 0) {
            return res.send("Already added");
        }

        res.send("Added");
    });
});

// GET SUBS
app.get("/subscriptions/:user_id", (req, res) => {
    const user_id = req.params.user_id;

    const sql = `
        SELECT s.subscription_id, s.custom_price,
               sv.service_name, sv.monthly_cost
        FROM subscription s
        JOIN service sv ON s.service_id = sv.service_id
        WHERE s.user_id = ?
    `;

    db.query(sql, [user_id], (err, result) => {
        res.json(result);
    });
});

// DELETE
app.delete("/subscriptions/:id", (req, res) => {
    db.query(
        "DELETE FROM subscription WHERE subscription_id=?",
        [req.params.id],
        () => res.send("Deleted")
    );
});

// UPDATE PRICE
app.put("/update-price", (req, res) => {
    const { subscription_id, price } = req.body;

    db.query(
        "UPDATE subscription SET custom_price=? WHERE subscription_id=?",
        [price, subscription_id],
        () => res.send("Updated")
    );
});

// SAVE BUDGET
app.post("/budget", (req, res) => {
    const { user_id, monthly_limit } = req.body;

    db.query(
        "REPLACE INTO user_budget (user_id, monthly_limit) VALUES (?,?)",
        [user_id, monthly_limit],
        () => res.send("Saved")
    );
});

// GET BUDGET
app.get("/budget/:user_id", (req, res) => {
    db.query(
        "SELECT * FROM user_budget WHERE user_id=?",
        [req.params.user_id],
        (err, result) => res.json(result)
    );
});

app.listen(5000, () => console.log("Server running on 5000"));
// GET ALL USERS + THEIR SUBSCRIPTIONS
app.get("/all-users", (req, res) => {
    const sql = `
        SELECT 
            u.user_id,
            u.name,
            u.email,
            sv.service_name,
            IFNULL(s.custom_price, sv.monthly_cost) AS price
        FROM user u
        LEFT JOIN subscription s ON u.user_id = s.user_id
        LEFT JOIN service sv ON s.service_id = sv.service_id
        ORDER BY u.user_id
    `;

    db.query(sql, (err, result) => {
        if (err) return res.send(err);
        res.json(result);
    });
});