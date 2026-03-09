# 🎓 LMS Platform: Advanced Learning Management System

An interactive, role-based **Learning Management System** designed to bridge the gap between Instructors and Students. This platform features a high-performance **React Frontend**, a resilient **Node.js/Express Backend** with database pooling, and intelligent **Gemini AI** integration.

---

## 🏗️ System Architecture

```mermaid
graph TD
    %% Roles
    Student[🧑‍🎓 Student] -->|Browses Courses, Takes Quizzes| ReactApp
    Instructor[👨‍🏫 Instructor] -->|Uploads Videos, Manages Profile| ReactApp

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
        Pool[🏊 Pool: Concurrent Connections]
        Multer[💾 Multer Sanitized Storage]
        AuthGuard[🔐 Role-Based Middleware]
        NodeServer --- AuthGuard
        NodeServer --- Pool
        NodeServer --- Multer
    end

    %% External & Persistence Layer
    subgraph Data Layer
        Postgres[(🐘 PostgreSQL Database)]
        Gemini[🧠 Gemini 2.0 Flash AI]
    end

    %% Backend Connections
    NodeServer -- Scalable Pooling --> Postgres
    NodeServer -- AI Insights & Quizzes --> Gemini
```

---

## 🚀 Key Features (Latest Updates)

### 🧑‍🏫 Instructor Dashboard (Premium)
- **Interactive Profile Manager**: Manage specialty categories using a dynamic **tag-based selection system**.
- **Visual Analytics**: Premium **Circular Progress Rings** and real-time status indicators for course lectures.
- **Custom Categories**: Instructors can dynamically add new categories directly from their dashboard.
- **GPU Optimized UI**: Smooth dropdowns and transitions powered by hardware-accelerated CSS.

### 🧑‍🎓 Student Experience & Discovery
- **Smart Recommendations**: Personal course suggestions powered by Gemini AI's analysis of your interests.
- **AI Summary Engine**: Get instant **AI-generated summaries** for any lecture to grasp key points faster.
- **Case-Insensitive Search**: Improved course matching ensuring you find what you need regardless of capitalization.
- **Resilient Quiz System**: Dynamic MCQs generated on-the-fly, with built-in **fallback logic** so learning never stops, even if AI limits are reached.

### 🛠️ Backend Performance & Reliability
- **Concurrent Connection Pooling**: Switched from single-client to **PostgreSQL Pooling**, supporting multiple users simultaneously with zero lag.
- **Smart Video Handling**: 
  - Automated **Filename Sanitization**: Replaces spaces and special characters with safe underscores.
  - **Absolute Path Mapping**: Ensures video files are always stored and served from the correct server directory.
  - **URL Encoding**: Robust video source handling for cross-browser playback support.
- **AI Resilience**: Upgraded to **Gemini 2.0 Flash** with a robust fallback system that provides placeholder content if the API key hits quota limits.

---

## 🛠️ Complete Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend UI** | React 19, Vite, React Router DOM, Lucide React (Icons), CSS3 |
| **Backend API** | Node.js, Express.js (v5) |
| **Database** | PostgreSQL with `pg-pool` (Scalable Batching) |
| **File Storage** | Multer (Sanitized Local Disk Storage) |
| **AI Integration** | Google Gemini 2.0 Flash API (Quizzes, Summaries, Recommendations) |
| **Security** | Express CORS, bcrypt (5-round hashing), JWT Authentication |

---

## 📦 Data Schema Blueprint

```mermaid
erDiagram
    LOGIN ||--|| STUDENT : links
    LOGIN ||--|| INSTRUCTOR : links
    INSTRUCTOR ||--o{ COURSES : manages
    COURSES ||--o{ LECTURES : consists_of
    STUDENT ||--o{ PROGRESS : tracks
    LECTURES ||--o{ PROGRESS : evaluated_in

    LOGIN {
        int id PK
        string email
        string password_hash
        string role "Student | Instructor"
    }
    INSTRUCTOR {
        int id PK
        int login_id FK
        string name
        string[] category
    }
    COURSES {
        int id PK
        string course
        string category
        string photo
    }
    LECTURES {
        int id PK
        int course_id FK
        string lecture_title
        string video_url
        string summary
    }
```

---

## 💻 Local Development Setup

To get this project running locally:

### 1. Prerequisites
- **Node.js**: v18+ Recommended
- **PostgreSQL**: Local instance or Cloud URI
- **Google Gemini API Key**: [Get one here](https://aistudio.google.com/app/apikey)

### 2. Setup Backend Environment
In `Backend/server/.env`:
```env
PORT=3030
DATABASE_URL=postgres://user:password@localhost:5432/lms_db
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
BASE_URL=http://localhost:3030
```

### 3. Install & Start
```bash
# 1. Install all dependencies
npm install && cd Backend/server && npm install

# 2. Start Backend (Terminal 1)
node server.js

# 3. Start Frontend (Terminal 2)
cd ../..
npm run dev
```

---
*Maintained with ❤️ for superior learning experiences.*
