const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const con = require("../config/db");
const { verifyToken } = require("../middleware/auth");
require("dotenv").config();

const secretKey = process.env.JWT_SECRET;

router.post("/signup", async (req, res) => {
    const { Name, Email, Pass, Role, Mobile } = req.query;
    if (!Name || !Email || !Pass || !Role || !Mobile) return res.status(400).json("All fields required");
    const role = Role.toLowerCase().trim();

    try {
        const hash = await bcrypt.hash(Pass, 5);
        const loginResult = await con.query("INSERT INTO login (email, password, role) VALUES ($1,$2,$3) RETURNING id", [Email, hash, role]);
        const loginId = loginResult.rows[0].id;

        if (role === "student") {
            await con.query("INSERT INTO student (login_id, name, mobile_no, course) VALUES ($1,$2,$3,NULL)", [loginId, Name, Mobile]);
        } else if (role === "instructor") {
            await con.query("INSERT INTO instructor (login_id, name, mobile_no) VALUES ($1,$2,$3)", [loginId, Name, Mobile]);
        }

        const token = jwt.sign({ id: loginId, role }, secretKey, { expiresIn: "10h" });
        res.json({ token, role });
    } catch (err) {
        res.status(500).json("Signup failed");
    }
});

router.get("/login", async (req, res) => {
    const { Email, Password, Role } = req.query;
    try {
        const result = await con.query("SELECT * FROM login WHERE email=$1", [Email]);
        if (result.rows.length === 0) return res.json("No such user");
        const user = result.rows[0];
        if (user.role !== Role) return res.json("Invalid role");

        const match = await bcrypt.compare(Password, user.password);
        if (!match) return res.json("Incorrect password");

        const token = jwt.sign({ id: user.id, role: user.role }, secretKey, { expiresIn: "10h" });
        res.json({ token });
    } catch (err) {
        res.status(500).json("Login failed");
    }
});

router.get("/student-status", verifyToken, async (req, res) => {
    if (req.user.role !== "student") return res.json({ completed: true });
    try {
        const result = await con.query("SELECT course FROM student WHERE login_id=$1", [req.user.id]);
        res.json({ completed: Array.isArray(result.rows[0]?.course) });
    } catch (err) {
        res.status(500).json("Status check failed");
    }
});

router.get("/instructor-status", verifyToken, async (req, res) => {
    if (req.user.role !== "instructor") return res.json({ completed: true });
    try {
        const result = await con.query("SELECT category FROM instructor WHERE login_id=$1", [req.user.id]);
        res.json({ completed: Array.isArray(result.rows[0]?.category) });
    } catch (err) {
        res.status(500).json("Status check failed");
    }
});

router.get("/categories", async (req, res) => {
    try {
        const result = await con.query(`SELECT DISTINCT ON (category) category, photo FROM courses ORDER BY category`);
        res.json(result.rows.map((r) => ({ category: r.category, photo: `${process.env.BASE_URL}/upload/${r.photo}` })));
    } catch (err) {
        res.status(500).json("Failed to load categories");
    }
});

router.get("/courses/:category", async (req, res) => {
    try {
        const result = await con.query("SELECT course, photo FROM courses WHERE category=$1", [req.params.category]);
        res.json(result.rows.map((r) => ({ course: r.course, photo: `${process.env.BASE_URL}/upload/${r.photo}` })));
    } catch (err) {
        res.status(500).json("Failed to load courses");
    }
});

module.exports = router;
