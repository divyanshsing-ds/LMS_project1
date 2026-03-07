# 🎓 LMS Platform: Advanced Learning Management System

An interactive, role-based **Learning Management System** built designed to bridge the gap between Instructors and Students. It features full-stack architecture with a **React Frontend**, **Node.js/Express Backend**, **PostgreSQL** for relational data, and **Google Gemini AI** for dynamic quiz generation.

---

## 🏗️ System Architecture

```mermaid
graph TD
    %% Roles
    Student[🧑‍🎓 Student] -->|Browses Courses, Takes Quizzes| ReactApp
    Instructor[👨‍🏫 Instructor] -->|Uploads Videos, Manages Courses| ReactApp

    %% Frontend
    subgraph Frontend [React SPA Client]
        ReactApp[📱 React 19 + Vite]
        Router[React Router DOM]
        ReactApp --- Router
    end

    %% API Layer
    ReactApp -- REST API (JWT Auth) --> NodeServer

    %% Backend Server
    subgraph Backend [Express API Server]
        NodeServer[⚙️ Express.js Gateway]
        Multer[💾 Multer Storage System]
        AuthGuard[🔐 Role-Based Middleware]
        NodeServer --- AuthGuard
        NodeServer --- Multer
    end

    %% External & Persistence Layer
    subgraph Data Layer
        Postgres[(🐘 PostgreSQL Database)]
        Gemini[🧠 Google Gemini AI]
    end

    %% Backend Connections
    NodeServer -- Relational Queries --> Postgres
    NodeServer -- Quiz Prompts --> Gemini
```

---

## 🚀 Key Features

### 🔐 Authentication & Security
- **Secure Sign-Up/Login**: Powered by `bcrypt` for password hashing and `jsonwebtoken` (JWT) for stateless authentication.
- **Role-Based Access Control (RBAC)**: Strict separation between `Student` and `Instructor` privileges.
- **Protected Routes**: Custom Express middleware to validate and decode session tokens before serving protected resources.

### 🧑‍🎓 Student Experience
- **Course Discovery**: Browse through carefully categorized educational content.
- **Fluid Video Player**: Watch instructor-uploaded lectures seamlessly.
- **AI-Powered Assessments**: Immediately test knowledge after a lecture using 10-question multiple-choice quizzes logically generated on-the-fly by **Google Gemini**.
- **Progress Tracking**: Monitor completion percentages and track learning visually.

### 👩‍🏫 Instructor Dashboard
- **Course Crafting**: Create beautifully structured courses nested within logical categories.
- **Lecture Management**: Define the sequence of lectures so students learn step-by-step.
- **Media Uploads**: Directly upload large video files seamlessly via the `Multer` integration.

### 🧠 Gemini AI Quiz Engine
- Instantly analyzes lecture topics to generate dynamically unique MCQs.
- Automatically scores students based on completion logic and records their progression directly into the PostgreSQL Database.

---

## �️ Complete Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend UI** | React 19, Vite, React Router DOM v7, Lucide React (Icons) |
| **Backend API** | Node.js, Express.js (v5) |
| **Database** | PostgreSQL (`pg` library) |
| **File Storage** | Multer (Local Disk Storage for Videos) |
| **AI Integration** | Google Gemini API |
| **Security** | Express CORS, bcrypt, jsonwebtoken |

---

## 📦 Data Schema Blueprint

```mermaid
erDiagram
    USERS ||--o{ ENROLLMENTS : enrolls
    USERS ||--o{ COURSES : creates
    CATEGORIES ||--o{ COURSES : contains
    COURSES ||--o{ LECTURES : consists_of
    LECTURES ||--o{ QUIZZES : evaluated_by
    QUIZZES ||--o{ QUIZ_PROGRESS : tracks

    USERS {
        int id PK
        string name
        string email
        string password_hash
        string role "Student | Instructor"
    }
    COURSES {
        int id PK
        string title
        string description
        int instructor_id FK
        int category_id FK
    }
    LECTURES {
        int id PK
        string title
        string video_url
        int course_id FK
        int sequence_order
    }
```

---

## � Local Development Setup

To get this project running up locally:

### 1. Prerequisites
- **Node.js**: v18+ Recommended
- **PostgreSQL**: Running locally or via cloud URL
- **Google Gemini API Key**: For quiz generation

### 2. Clone the Repository
```bash
git clone https://github.com/divyanshsing-ds/LMS_project1.git
cd LMS_project1
```

### 3. Setup Backend Environment
Create a `.env` in the `Backend/server` folder:
```env
PORT=5000
DATABASE_URL=postgres://user:password@localhost:5432/lms_db
JWT_SECRET=your_super_secret_key
GEMINI_API_KEY=your_gemini_key
```

### 4. Install Dependencies
```bash
# Root (Frontend)
npm install

# Backend
cd Backend/server
npm install
```

### 5. Start Development Servers
You will need two terminal windows:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
cd Backend/server
node server.js
```
