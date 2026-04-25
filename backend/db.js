const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Nirmitha@123",
    database: "subscriptionDB"
});

db.connect(err => {
    if (err) console.log(err);
    else console.log("DB Connected");
});

module.exports = db;