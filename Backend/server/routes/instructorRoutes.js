const express = require("express");
const router = express.Router();
const con = require("../config/db");
const { verifyToken, restrictTo } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: path.join(__dirname, "../upload/videos"),
    filename: (req, file, cb) => {
        // Sanitize filename: replace spaces and special chars to avoid URL issues
        const sanitized = file.originalname
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9._\-]/g, "")
            .toLowerCase();
        cb(null, Date.now() + "_" + sanitized);
    },
});
const upload = multer({ storage });

router.use(verifyToken);
router.use(restrictTo("instructor"));

// Profile
router.get("/profile", async (req, res) => {
    try {
        const result = await con.query(
            `SELECT i.name, i.mobile_no, l.email, i.category FROM instructor i JOIN login l ON l.id = i.login_id WHERE i.login_id = $1`,
            [req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json("Error fetching profile");
    }
});

router.put("/profile", async (req, res) => {
    const { name, mobile, category } = req.body;
    try {
        await con.query(
            `UPDATE instructor SET name=$1, mobile_no=$2, category=$3 WHERE login_id=$4`,
            [name, mobile, category, req.user.id]
        );
        res.json("Profile updated");
    } catch (err) {
        res.status(500).json("Update failed");
    }
});

// Students
router.get("/students", async (req, res) => {
    try {
        const instRes = await con.query("SELECT category FROM instructor WHERE login_id=$1", [req.user.id]);
        const categories = instRes.rows[0]?.category;
        if (!Array.isArray(categories) || categories.length === 0) return res.json([]);

        const studentsRes = await con.query(
            `SELECT DISTINCT s.name, l.email, s.course FROM student s JOIN login l ON l.id = s.login_id JOIN courses c ON c.course = ANY(s.course) WHERE c.category = ANY($1)`,
            [categories]
        );
        res.json(studentsRes.rows);
    } catch (err) {
        res.status(500).json("Error fetching students");
    }
});

// Courses
router.get("/courses", async (req, res) => {
    try {
        const instRes = await con.query("SELECT category FROM instructor WHERE login_id=$1", [req.user.id]);
        const categories = instRes.rows[0]?.category;
        let result;
        if (!Array.isArray(categories) || categories.length === 0) {
            result = await con.query("SELECT id, category, course FROM courses ORDER BY id DESC");
        } else {
            result = await con.query(`SELECT id, category, course FROM courses WHERE category = ANY($1) ORDER BY id DESC`, [categories]);
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json("Error fetching courses");
    }
});

router.post("/course", async (req, res) => {
    const { category, course } = req.body;
    try {
        await con.query(`INSERT INTO courses (category, course, photo) VALUES ($1, $2, $3)`, [category.trim(), course.trim(), "default-course.png"]);
        res.json("Course added");
    } catch (err) {
        res.status(500).json("Failed to add course");
    }
});

router.put("/course/:id", async (req, res) => {
    const { category, course } = req.body;
    try {
        await con.query(`UPDATE courses SET category = $1, course = $2 WHERE id = $3`, [category, course, req.params.id]);
        res.json("Course updated");
    } catch (err) {
        res.status(500).json("Update failed");
    }
});

router.delete("/course/:id", async (req, res) => {
    try {
        await con.query("DELETE FROM courses WHERE id=$1", [req.params.id]);
        res.json("Course deleted");
    } catch (err) {
        res.status(500).json("Failed to delete");
    }
});

// Lectures
router.get("/lectures/:courseId", async (req, res) => {
    try {
        const result = await con.query(`SELECT id, lecture_title, lecture_order, video_url FROM lectures WHERE course_id = $1 ORDER BY lecture_order`, [req.params.courseId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json("Error fetching lectures");
    }
});

router.post("/lecture", async (req, res) => {
    const { course_id, title, order } = req.body;
    try {
        await con.query(`INSERT INTO lectures (course_id, lecture_title, lecture_order) VALUES ($1,$2,$3)`, [course_id, title, order]);
        res.json("Lecture added");
    } catch (err) {
        res.status(500).json("Failed to add lecture");
    }
});

router.post("/lecture/video", upload.single("video"), async (req, res) => {
    const { lecture_id } = req.body;
    if (!req.file) return res.status(400).json("No file uploaded");
    // Filename is already sanitized by multer storage, just build clean URL
    const encodedFilename = encodeURIComponent(req.file.filename);
    const url = `${process.env.BASE_URL}/upload/videos/${encodedFilename}`;
    try {
        await con.query("UPDATE lectures SET video_url=$1 WHERE id=$2", [url, lecture_id]);
        res.json({ message: "Video uploaded", url });
    } catch (err) {
        res.status(500).json("Upload failed");
    }
});

router.delete("/lecture/:id", async (req, res) => {
    try {
        await con.query("DELETE FROM lectures WHERE id = $1", [req.params.id]);
        res.json("Lecture deleted");
    } catch (err) {
        res.status(500).json("Delete failed");
    }
});

router.get("/categories", async (req, res) => {
    try {
        const result = await con.query(`SELECT DISTINCT category FROM courses WHERE category IS NOT NULL ORDER BY category`);
        res.json(result.rows.map((r) => r.category));
    } catch (err) {
        res.status(500).json("Error loading categories");
    }
});

module.exports = router;
