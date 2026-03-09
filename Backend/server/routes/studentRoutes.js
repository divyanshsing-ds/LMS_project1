const express = require("express");
const router = express.Router();
const con = require("../config/db");
const { verifyToken, restrictTo } = require("../middleware/auth");
const { generateQuiz, generateSummary, recommendCourses } = require("../utils/ai");

router.use(verifyToken);
router.use(restrictTo("student"));

router.get("/dashboard", async (req, res) => {
    try {
        const studentResult = await con.query("SELECT name, mobile_no, course FROM student WHERE login_id=$1", [req.user.id]);
        const student = studentResult.rows[0];
        const courses = Array.isArray(student.course) ? student.course : [];
        const categoryResult = await con.query(`SELECT category, COUNT(*) FROM courses WHERE course = ANY($1) GROUP BY category`, [courses]);
        res.json({ name: student.name, mobile: student.mobile_no, totalCourses: courses.length, courses, categories: categoryResult.rows });
    } catch (err) {
        res.status(500).json("Error loading dashboard");
    }
});

router.get("/lectures/:course", async (req, res) => {
    try {
        const courseResult = await con.query("SELECT id FROM courses WHERE course ILIKE $1", [req.params.course]);
        if (courseResult.rows.length === 0) return res.status(404).json("Course not found");
        const lectureResult = await con.query(`SELECT id, lecture_title, lecture_order, video_url FROM lectures WHERE course_id=$1 ORDER BY lecture_order`, [courseResult.rows[0].id]);
        res.json(lectureResult.rows);
    } catch (err) {
        res.status(500).json("Error loading lectures");
    }
});

router.post("/checkout", async (req, res) => {
    const { courses } = req.body;
    if (!Array.isArray(courses) || courses.length === 0) return res.status(400).json("No courses selected");
    try {
        const result = await con.query("SELECT course FROM student WHERE login_id=$1", [req.user.id]);
        let existingCourses = result.rows[0].course || [];
        const updatedCourses = [...new Set([...existingCourses, ...courses])];
        await con.query("UPDATE student SET course=$1 WHERE login_id=$2", [updatedCourses, req.user.id]);
        res.json({ success: true, courses: updatedCourses });
    } catch (err) {
        res.status(500).json("Checkout failed");
    }
});

router.get("/quiz/:lectureId", async (req, res) => {
    try {
        const lectureRes = await con.query("SELECT lecture_title FROM lectures WHERE id=$1", [req.params.lectureId]);
        if (lectureRes.rows.length === 0) return res.status(404).json("Lecture not found");
        const quiz = await generateQuiz(lectureRes.rows[0].lecture_title);
        res.json(quiz);
    } catch (err) {
        res.status(500).json("Quiz generation failed");
    }
});

router.post("/quiz/submit", async (req, res) => {
    const { lecture_id, score } = req.body;
    try {
        const status = score >= 7 ? "COMPLETED" : "RETRY";
        await con.query(`INSERT INTO progress (student_id, lecture_id, score, status, completed_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (student_id, lecture_id) DO UPDATE SET score = EXCLUDED.score, status = EXCLUDED.status, completed_at = NOW()`, [req.user.id, lecture_id, score, status]);
        res.json({ status });
    } catch (err) {
        res.status(500).json("Submit failed");
    }
});

router.get("/progress", async (req, res) => {
    try {
        const result = await con.query(`SELECT COUNT(*) FILTER (WHERE status='COMPLETED') AS completed, COUNT(*) AS total FROM progress WHERE student_id=$1`, [req.user.id]);
        const { completed, total } = result.rows[0];
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        res.json({ completed, total, percent });
    } catch (err) {
        res.status(500).json("Progress fetch failed");
    }
});

router.get("/lecture/summary/:id", async (req, res) => {
    try {
        const result = await con.query("SELECT lecture_title, summary FROM lectures WHERE id=$1", [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json("Lecture not found");
        const lecture = result.rows[0];
        if (lecture.summary) return res.json({ summary: lecture.summary });

        const summary = await generateSummary(lecture.lecture_title);
        await con.query("UPDATE lectures SET summary=$1 WHERE id=$2", [summary, req.params.id]);
        res.json({ summary });
    } catch (err) {
        res.status(500).json("Summary failed");
    }
});

router.get("/recommendations", async (req, res) => {
    try {
        const studentRes = await con.query("SELECT course FROM student WHERE login_id=$1", [req.user.id]);
        const enrolledCourses = studentRes.rows[0]?.course || [];

        const allRes = await con.query("SELECT DISTINCT course FROM courses WHERE NOT (course = ANY($1))", [enrolledCourses]);
        const availableTitles = allRes.rows.map(r => r.course);

        if (availableTitles.length === 0) return res.json([]);

        const recommendations = await recommendCourses(enrolledCourses, availableTitles);

        const detailsRes = await con.query(
            "SELECT course, photo, category FROM courses WHERE course = ANY($1) LIMIT 3",
            [recommendations]
        );

        res.json(detailsRes.rows.map(r => ({
            ...r,
            photo: `${process.env.BASE_URL}/upload/${r.photo}`
        })));
    } catch (err) {
        res.status(500).json("Recommendation failed");
    }
});

module.exports = router;
