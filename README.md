<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
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


>>>>>>> ac6996f35cacce7e7b26169acbc5845b0e050e88
