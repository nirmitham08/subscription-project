const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Nirmitha@123",
    database: "subscriptiondb"
});

db.connect((err) => {

    if(err){

        console.log(err);

    }

    else{

        console.log("✅ DB Connected");

    }

});

// LOGIN
app.post("/login", (req, res) => {

    const { name, email } = req.body;

    db.query(

        "SELECT * FROM user WHERE email=?",

        [email],

        (err, result) => {

            if(err){

                return res.send(err);

            }

            // USER EXISTS
            if(result.length > 0){

                return res.json(result[0]);

            }

            // CREATE USER
            db.query(

                "INSERT INTO user (name,email) VALUES (?,?)",

                [name, email],

                (err, data) => {

                    if(err){

                        return res.send(err);

                    }

                    res.json({

                        user_id:data.insertId,
                        name,
                        email

                    });

                }

            );

        }

    );

});

// GET SERVICES
app.get("/services", (req, res) => {

    db.query(

        "SELECT * FROM service",

        (err, result) => {

            if(err){

                return res.send(err);

            }

            res.json(result);

        }

    );

});

// ADD SUBSCRIPTION
app.post("/subscriptions", (req, res) => {

    const { user_id, service_id } = req.body;

    const sql = `

        INSERT INTO subscription
        (user_id, service_id)

        SELECT ?, ?

        WHERE NOT EXISTS (

            SELECT 1
            FROM subscription

            WHERE user_id = ?
            AND service_id = ?

        )

    `;

    db.query(

        sql,

        [
            user_id,
            service_id,
            user_id,
            service_id
        ],

        (err, result) => {

            if(err){

                return res.send(err);

            }

            if(result.affectedRows === 0){

                return res.send("Already added");

            }

            res.send("Added");

        }

    );

});

// GET USER SUBSCRIPTIONS
app.get("/subscriptions/:user_id", (req, res) => {

    const user_id = req.params.user_id;

    const sql = `

        SELECT

            s.subscription_id,
            s.custom_price,

            sv.service_name,
            sv.monthly_cost

        FROM subscription s

        JOIN service sv
        ON s.service_id =
        sv.service_id

        WHERE s.user_id = ?

    `;

    db.query(sql, [user_id], (err, result) => {

        if(err){

            return res.send(err);

        }

        res.json(result);

    });

});

// DELETE SUBSCRIPTION
app.delete("/subscriptions/:id", (req, res) => {

    db.query(

        "DELETE FROM subscription WHERE subscription_id=?",

        [req.params.id],

        (err) => {

            if(err){

                return res.send(err);

            }

            res.send("Deleted");

        }

    );

});

// UPDATE PRICE
app.put("/update-price", (req, res) => {

    const { subscription_id, price } = req.body;

    db.query(

        "UPDATE subscription SET custom_price=? WHERE subscription_id=?",

        [price, subscription_id],

        (err) => {

            if(err){

                return res.send(err);

            }

            res.send("Updated");

        }

    );

});

// SAVE BUDGET
app.post("/budget", (req, res) => {

    const { user_id, monthly_limit } = req.body;

    db.query(

        "REPLACE INTO user_budget (user_id, monthly_limit) VALUES (?,?)",

        [user_id, monthly_limit],

        (err) => {

            if(err){

                return res.send(err);

            }

            res.send("Budget Saved");

        }

    );

});

// GET BUDGET
app.get("/budget/:user_id", (req, res) => {

    db.query(

        "SELECT * FROM user_budget WHERE user_id=?",

        [req.params.user_id],

        (err, result) => {

            if(err){

                return res.send(err);

            }

            res.json(result);

        }

    );

});

// GET ALL USERS
app.get("/all-users", (req, res) => {

    db.query(

        "SELECT * FROM user",

        (err, result) => {

            if(err){

                return res.send(err);

            }

            res.json(result);

        }

    );

});

// USER INFO
app.get("/user-info/:id", (req, res) => {

    const user_id = req.params.id;

    const sql = `

        SELECT

            user.user_id,
            user.name,
            user.email,

            MAX(
                IFNULL(
                    user_budget.monthly_limit,
                    0
                )
            ) AS budget,

            COUNT(
                DISTINCT subscription.subscription_id
            ) AS total_subscriptions,

            IFNULL(
                SUM(
                    subscription.custom_price
                ),
                0
            ) AS total_spending,

            IFNULL(
                SUM(
                    usage_logs.usage_minutes
                ),
                0
            ) AS total_usage

        FROM user

        LEFT JOIN user_budget
        ON user.user_id =
        user_budget.user_id

        LEFT JOIN subscription
        ON user.user_id =
        subscription.user_id

        LEFT JOIN usage_logs
        ON subscription.subscription_id =
        usage_logs.subscription_id

        WHERE user.user_id = ?

        GROUP BY
        user.user_id,
        user.name,
        user.email

    `;

    db.query(sql, [user_id], (err, result) => {

        if(err){

            console.log(err);

            return res.send(err);

        }

        res.json(result);

    });

});

// USER USAGE ANALYTICS
app.get("/user-usage/:userId", (req, res) => {

    const userId = req.params.userId;

    const sql = `

        SELECT

            sv.service_name,

            SUM(
                ul.usage_minutes
            ) AS total_usage,

            CASE

                WHEN SUM(
                    ul.usage_minutes
                ) < 60

                THEN '⚠ Low Usage'

                ELSE '✅ Active Usage'

            END AS status

        FROM usage_logs ul

        JOIN subscription s
        ON ul.subscription_id =
        s.subscription_id

        JOIN service sv
        ON s.service_id =
        sv.service_id

        WHERE ul.user_id = ?

        GROUP BY sv.service_name

    `;

    db.query(sql, [userId], (err, result) => {

        if(err){

            return res.send(err);

        }

        res.json(result);

    });

});

// SERVER
app.listen(5000, () => {

    console.log("🚀 Server running on port 5000");

});