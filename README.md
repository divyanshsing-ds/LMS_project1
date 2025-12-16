# 📚 LMS Backend (Learning Management System)

A role-based **Learning Management System backend** built using **Node.js, Express, and PostgreSQL**.  
The system supports **Students** and **Instructors**, course & lecture management, video uploads, **AI-generated quizzes**, and progress tracking.

This project is backend-focused and designed to demonstrate real-world API design, authentication, authorization, and database handling.

---

## 🚀 Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Student / Instructor)
- Protected routes using middleware

### 🎓 Student Features
- Signup & login
- Enroll in multiple courses
- View dashboard with enrolled courses
- Watch lecture videos
- Attempt AI-generated quizzes
- Track learning progress and completion percentage

### 🧑‍🏫 Instructor Features
- Signup & login
- Select teaching categories
- Create and manage courses
- Add lectures with sequence order
- Upload lecture videos
- View students enrolled in their categories

### 🧠 AI Quiz System
- Quiz generated per lecture
- Uses Google Gemini API
- 10 MCQs per quiz
- Score-based completion logic
- Progress stored in database

### 📦 Course & Lecture Management
- Category-based courses
- Ordered lectures
- Video upload using Multer
- Static serving of uploaded videos

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT
- **File Upload:** Multer
- **AI Integration:** Google Gemini API
- **Environment Management:** dotenv


