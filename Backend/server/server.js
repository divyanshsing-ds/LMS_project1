let cors = require("cors");
let express = require("express");
let bcrypt = require("bcrypt");
let jwt = require("jsonwebtoken");
let { Client } = require("pg");
let path = require("path");
const multer = require("multer");

require("dotenv").config();
const fetch1 = require("node-fetch");

let app = express();
app.use(cors());
app.use(express.json());
app.use("/upload", express.static(path.join(__dirname, "upload")));

const secretKey = process.env.JWT_SECRET;


const storage = multer.diskStorage({
  destination: "upload/videos",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage });

// DB CONNECTION
const con = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function generateQuiz(lectureTitle) {
  const prompt = `
Create exactly 10 multiple choice questions based on:
"${lectureTitle}"

Rules:
- 4 options only
- One correct answer
- Return ONLY a JSON array
- Do NOT add explanation
- Do NOT use markdown
- Do NOT wrap in backticks

Format:
[
  {
    "question": "",
    "options": ["A","B","C","D"],
    "answer": "A"
  }
]
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();

  let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  // 🔥 CLEAN THE RESPONSE
  text = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const quiz = JSON.parse(text);

  if (!Array.isArray(quiz)) {
    throw new Error("Quiz is not an array");
  }

  return quiz;
}

con
  .connect()
  .then(() => console.log("✅ Database Connected"))
  .catch((err) => console.error("❌ DB Error", err));

/*SIGNUP*/
app.post("/signup", async (req, res) => {
  const { Name, Email, Pass, Role, Mobile } = req.query;

  if (!Name || !Email || !Pass || !Role || !Mobile) {
    return res.status(400).json("All fields required");
  }

  const role = Role.toLowerCase().trim();

  try {
    const hash = await bcrypt.hash(Pass, 5);

    const loginResult = await con.query(
      "INSERT INTO login (email, password, role) VALUES ($1,$2,$3) RETURNING id",
      [Email, hash, role]
    );

    const loginId = loginResult.rows[0].id;

    if (role === "student") {
      await con.query(
        "INSERT INTO student (login_id, name, mobile_no, course) VALUES ($1,$2,$3,NULL)",
        [loginId, Name, Mobile]
      );
    }

    if (role === "instructor") {
      await con.query(
        "INSERT INTO instructor (login_id, name, mobile_no) VALUES ($1,$2,$3)",
        [loginId, Name, Mobile]
      );
    }

    const token = jwt.sign({ id: loginId, role }, secretKey, {
      expiresIn: "1h",
    });

    res.json({ token, role });
  } catch (err) {
    console.error(err);
    res.status(500).json("Signup failed");
  }
});

/*LOGIN*/
app.get("/login", async (req, res) => {
  const { Email, Password, Role } = req.query;

  try {
    const result = await con.query("SELECT * FROM login WHERE email=$1", [
      Email,
    ]);

    if (result.rows.length === 0) {
      return res.json("No such user");
    }

    const user = result.rows[0];

    if (user.role !== Role) {
      return res.json("Invalid role");
    }

    const match = await bcrypt.compare(Password, user.password);
    if (!match) {
      return res.json("Incorrect password");
    }

    const token = jwt.sign({ id: user.id, role: user.role }, secretKey, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json("Login failed");
  }
});

/*STUDENT STATUS (FIRST TIME CHECK)*/
app.get("/student-status", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json("Token missing");

  try {
    const decoded = jwt.verify(token, secretKey);

    if (decoded.role !== "student") {
      return res.status(403).json({ completed: true });
    }

    const result = await con.query(
      "SELECT course FROM student WHERE login_id=$1",
      [decoded.id]
    );

    const completed = Array.isArray(result.rows[0].course);

    res.json({ completed });
  } catch (err) {
    res.status(401).json("Invalid token");
  }
});

/*GET CATEGORIES*/
app.get("/categories", async (req, res) => {
  try {
    const result = await con.query(`
            SELECT DISTINCT ON (category) category, photo
            FROM courses
            ORDER BY category
        `);

    const data = result.rows.map((r) => ({
      category: r.category,
      photo: `${process.env.BASE_URL}/upload/${r.photo}`,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Failed to load categories");
  }
});

/*GET COURSES BY CATEGORY*/
app.get("/courses/:category", async (req, res) => {
  const { category } = req.params;

  try {
    const result = await con.query(
      "SELECT course, photo FROM courses WHERE category=$1",
      [category]
    );

    const data = result.rows.map((r) => ({
      course: r.course,
      photo: `${process.env.BASE_URL}/upload/${r.photo}`,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json("Failed to load courses");
  }
});

/*CHECKOUT (MULTI COURSE ENROLLMENT)*/
app.post("/checkout", async (req, res) => {
  const token = req.headers.authorization;
  const { courses } = req.body;

  if (!token) return res.status(401).json("Token missing");
  if (!Array.isArray(courses) || courses.length === 0) {
    return res.status(400).json("No courses selected");
  }

  try {
    const decoded = jwt.verify(token, secretKey);

    if (decoded.role !== "student") {
      return res.status(403).json("Only students allowed");
    }

    const result = await con.query(
      "SELECT course FROM student WHERE login_id=$1",
      [decoded.id]
    );

    let existingCourses = result.rows[0].course;
    if (!Array.isArray(existingCourses)) {
      existingCourses = [];
    }

    const updatedCourses = [...new Set([...existingCourses, ...courses])];

    await con.query("UPDATE student SET course=$1 WHERE login_id=$2", [
      updatedCourses,
      decoded.id,
    ]);

    res.json({
      success: true,
      courses: updatedCourses,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json("Invalid token");
  }
});

/*STUDENT DASHBOARD DATA*/
app.get("/dashboard", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json("Token missing");

  try {
    const decoded = jwt.verify(token, secretKey);

    if (decoded.role !== "student") {
      return res.status(403).json("Only students allowed");
    }

    // student info
    const studentResult = await con.query(
      "SELECT name, mobile_no, course FROM student WHERE login_id=$1",
      [decoded.id]
    );

    const student = studentResult.rows[0];

    const courses = Array.isArray(student.course) ? student.course : [];

    // category wise count
    const categoryResult = await con.query(
      `
            SELECT category, COUNT(*) 
            FROM courses 
            WHERE course = ANY($1)
            GROUP BY category
        `,
      [courses]
    );

    res.json({
      name: student.name,
      mobile: student.mobile_no,
      totalCourses: courses.length,
      courses,
      categories: categoryResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(401).json("Invalid token");
  }
});

/* GET LECTURES BY COURSE */
app.get("/lectures/:course", async (req, res) => {
  const token = req.headers.authorization;
  const { course } = req.params;

  if (!token) return res.status(401).json("Token missing");

  try {
    const decoded = jwt.verify(token, secretKey);

    if (decoded.role !== "student") {
      return res.status(403).json("Only students allowed");
    }

    const courseResult = await con.query(
      "SELECT id FROM courses WHERE course=$1",
      [course]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json("Course not found");
    }

    const courseId = courseResult.rows[0].id;

    const lectureResult = await con.query(
      `
            SELECT id, lecture_title, lecture_order, video_url
            FROM lectures
            WHERE course_id=$1
            ORDER BY lecture_order
            `,
      [courseId]
    );

    res.json(lectureResult.rows);
  } catch (err) {
    console.error(err);
    res.status(401).json("Invalid token");
  }
});

/*INSTRUCTOR STATUS (FIRST LOGIN)*/
app.get("/instructor-status", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json("Token missing");

  try {
    const decoded = jwt.verify(token, secretKey);

    if (decoded.role !== "instructor") {
      return res.json({ completed: true });
    }

    const result = await con.query(
      "SELECT category FROM instructor WHERE login_id=$1",
      [decoded.id]
    );

    const completed = Array.isArray(result.rows[0]?.category);

    res.json({ completed });
  } catch (err) {
    res.status(401).json("Invalid token");
  }
});

/*UPDATE INSTRUCTOR CATEGORY*/
app.post("/instructor-category", async (req, res) => {
  const token = req.headers.authorization;
  const { categories } = req.body;

  if (!token) return res.status(401).json("Token missing");

  try {
    const decoded = jwt.verify(token, secretKey);

    if (decoded.role !== "instructor") {
      return res.status(403).json("Only instructors allowed");
    }

    await con.query("UPDATE instructor SET category=$1 WHERE login_id=$2", [
      categories,
      decoded.id,
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(401).json("Invalid token");
  }
});

app.get("/instructor/profile", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json("Token missing");

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "instructor") {
      return res.status(403).json("Access denied");
    }

    const result = await con.query(
      `
            SELECT 
                i.name,
                i.mobile_no,
                l.email,
                i.category
            FROM instructor i
            JOIN login l ON l.id = i.login_id
            WHERE i.login_id = $1
            `,
      [decoded.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(401).json("Invalid token");
  }
});

app.put("/instructor/profile", async (req, res) => {
  const token = req.headers.authorization;
  const { name, mobile, category } = req.body;

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "instructor") return res.sendStatus(403);

    await con.query(
      `
            UPDATE instructor
            SET name=$1, mobile_no=$2, category=$3
            WHERE login_id=$4
            `,
      [name, mobile, category, decoded.id]
    );

    res.json("Profile updated");
  } catch (err) {
    console.error(err);
    res.status(500).json("Update failed");
  }
});

app.get("/instructor/students", async (req, res) => {
  const token = req.headers.authorization;

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "instructor") {
      return res.sendStatus(403);
    }

    // get instructor categories
    const instRes = await con.query(
      "SELECT category FROM instructor WHERE login_id=$1",
      [decoded.id]
    );

    const categories = instRes.rows[0]?.category;

    if (!Array.isArray(categories) || categories.length === 0) {
      return res.json([]); // instructor hasn't selected categories
    }

    // 🔥 FIXED QUERY
    const studentsRes = await con.query(
      `
            SELECT DISTINCT
                s.name,
                l.email,
                s.course
            FROM student s
            JOIN login l ON l.id = s.login_id
            JOIN courses c ON c.course = ANY(s.course)
            WHERE c.category = ANY($1)
            `,
      [categories]
    );

    res.json(studentsRes.rows);
  } catch (err) {
    console.error(err);
    res.status(401).json("Invalid token");
  }
});

app.get("/instructor/courses", async (req, res) => {
  const token = req.headers.authorization;

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "instructor") return res.sendStatus(403);

    // 🔥 instructor category nikal
    const instRes = await con.query(
      "SELECT category FROM instructor WHERE login_id=$1",
      [decoded.id]
    );

    const categories = instRes.rows[0]?.category;

    let result;

    if (!Array.isArray(categories) || categories.length === 0) {
      result = await con.query(
        "SELECT id, category, course FROM courses ORDER BY id DESC"
      );
    } else {
      result = await con.query(
        `
                SELECT id, category, course
                FROM courses
                WHERE category = ANY($1)
                ORDER BY id DESC
                `,
        [categories]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json("Failed to fetch courses");
  }
});

app.post("/instructor/course", async (req, res) => {
  const token = req.headers.authorization;
  const { category, course } = req.body;

  if (!category || !course) {
    return res.status(400).json("Category & course required");
  }

  const defaultPhoto = "default-course.png"; // 👈 must exist in /upload

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "instructor") return res.sendStatus(403);

    await con.query(
      `
            INSERT INTO courses (category, course, photo)
            VALUES ($1, $2, $3)
            `,
      [category.trim(), course.trim(), defaultPhoto]
    );

    res.json("Course added");
  } catch (err) {
    console.error(err);
    res.status(500).json("Failed to add course");
  }
});

app.put("/instructor/course/:id", async (req, res) => {
  const token = req.headers.authorization;
  const { category, course } = req.body;

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "instructor") return res.sendStatus(403);

    await con.query(
      `
            UPDATE courses
            SET category = $1, course = $2
            WHERE id = $3
            `,
      [category, course, req.params.id]
    );

    res.json("Course updated");
  } catch (err) {
    console.error(err);
    res.status(500).json("Update failed");
  }
});

app.delete("/instructor/course/:id", async (req, res) => {
  const token = req.headers.authorization;

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "instructor") return res.sendStatus(403);

    await con.query("DELETE FROM courses WHERE id=$1", [req.params.id]);

    res.json("Course deleted");
  } catch (err) {
    console.error(err);
    res.status(500).json("Failed");
  }
});

app.post("/instructor/lecture", async (req, res) => {
  const { course_id, title, order } = req.body;

  await con.query(
    `
        INSERT INTO lectures (course_id, lecture_title, lecture_order)
        VALUES ($1,$2,$3)
        `,
    [course_id, title, order]
  );

  res.json("Lecture added");
});

app.get("/instructor/lectures/:courseId", async (req, res) => {
  const token = req.headers.authorization;

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "instructor") return res.sendStatus(403);

    const result = await con.query(
      `
            SELECT id, lecture_title, lecture_order, video_url
            FROM lectures
            WHERE course_id = $1
            ORDER BY lecture_order
            `,
      [req.params.courseId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(401).json("Invalid token");
  }
});

app.post(
  "/instructor/lecture/video",
  upload.single("video"),
  async (req, res) => {
    const { lecture_id } = req.body;

    const url = `${process.env.BASE_URL}/upload/videos/${req.file.filename}`;

    await con.query("UPDATE lectures SET video_url=$1 WHERE id=$2", [
      url,
      lecture_id,
    ]);

    res.json("Video uploaded");
  }
);

app.delete("/instructor/lecture/:id", async (req, res) => {
  const token = req.headers.authorization;

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "instructor") return res.sendStatus(403);

    await con.query("DELETE FROM lectures WHERE id = $1", [req.params.id]);

    res.json("Lecture deleted");
  } catch (err) {
    console.error(err);
    res.status(500).json("Delete failed");
  }
});

// ✅ GET DISTINCT CATEGORIES FOR INSTRUCTOR DROPDOWN
app.get("/instructor/categories", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json("Token missing");

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "instructor") return res.sendStatus(403);

    const result = await con.query(`
            SELECT DISTINCT category
            FROM courses
            WHERE category IS NOT NULL
            ORDER BY category
        `);

    // 🔥 return array of strings, not objects
    const categories = result.rows.map((r) => r.category);

    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json("Failed to load categories");
  }
});

app.get("/quiz/:lectureId", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "student") return res.sendStatus(403);

    const lectureRes = await con.query(
      "SELECT lecture_title FROM lectures WHERE id=$1",
      [req.params.lectureId]
    );

    if (lectureRes.rows.length === 0) {
      return res.status(404).json({ error: "Lecture not found" });
    }

    const quiz = await generateQuiz(lectureRes.rows[0].lecture_title);

    res.json(quiz);
  } catch (err) {
    console.error("QUIZ ERROR:", err.message);
    res.status(500).json({ error: "Quiz generation failed" });
  }
});

app.post("/quiz/submit", async (req, res) => {
  const token = req.headers.authorization;
  const { lecture_id, score } = req.body;

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "student") return res.sendStatus(403);

    const status = score >= 7 ? "COMPLETED" : "RETRY";

    await con.query(
      `
  INSERT INTO progress (student_id, lecture_id, score, status, completed_at)
  VALUES ($1, $2, $3, $4, NOW())
  ON CONFLICT (student_id, lecture_id)
  DO UPDATE SET
    score = EXCLUDED.score,
    status = EXCLUDED.status,
    completed_at = NOW()
  `,
      [decoded.id, lecture_id, score, status]
    );

    res.json({ status });
  } catch (err) {
    console.error(err);
    res.status(500).json("Submit failed");
  }
});

app.get("/progress", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, secretKey);
    if (decoded.role !== "student") return res.sendStatus(403);

    const result = await con.query(
      `
      SELECT COUNT(*) FILTER (WHERE status='COMPLETED') AS completed,
             COUNT(*) AS total
      FROM progress
      WHERE student_id=$1
      `,
      [decoded.id]
    );

    const completed = parseInt(result.rows[0].completed);
    const total = parseInt(result.rows[0].total);

    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    res.json({ percent });
  } catch (err) {
    console.error(err);
    res.status(500).json("Progress fetch failed");
  }
});

/*VERIFY TOKEN*/
app.get("/verify", (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json("Token missing");

  try {
    const decoded = jwt.verify(token, secretKey);
    res.json({ valid: true, decoded });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
});

app.listen(3030, () => {
  console.log("🚀 🚀 Server running on port ${PORT}");
});
