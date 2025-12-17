import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, PlayCircle } from "lucide-react";
import "../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("user-token");

  const [data, setData] = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [activeLecture, setActiveLecture] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    fetch("http://localhost:3030/dashboard", {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((result) => {
        if (!result || result === "Invalid token") {
          navigate("/");
        } else {
          setData(result);
        }
      })
      .catch(() => navigate("/"));
  }, []);

  useEffect(() => {
    if (data && data.courses.length > 0 && !activeCourse) {
      openCourse(data.courses[0]);
    }
  }, [data]);

  function openCourse(course) {
    setActiveCourse(course);
    setLectures([]);
    setActiveLecture(null);

    fetch(`http://localhost:3030/lectures/${encodeURIComponent(course)}`, {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((result) => {
        setLectures(result);
        if (result.length > 0) {
          setActiveLecture(result[0]);
        }
      });
  }

  useEffect(() => {
    fetch("http://localhost:3030/progress", {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((d) => setProgress(d.percent));
  }, []);

  if (!data) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>Welcome, {data.name}</h2>

        <button
          className="logout-btn"
          onClick={() => {
            localStorage.removeItem("user-token");
            navigate("/");
          }}
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* ================= STATS ================= */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{data.totalCourses}</h3>
          <p>Total Courses</p>
        </div>

        <div className="stat-card progress-card">
          <div className="semi-circle">
            <svg viewBox="0 0 100 50">
              <defs>
                <linearGradient id="progressGradient">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="50%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>

              {/* Background arc */}
              <path d="M10 50 A40 40 0 0 1 90 50" className="bg" />

              {/* Progress arc */}
              <path
                d="M10 50 A40 40 0 0 1 90 50"
                className="fg"
                style={{
                  strokeDasharray: `${(progress / 100) * 126} 126`,
                }}
              />
            </svg>

            <div className="progress-text">{progress}%</div>
          </div>

          <p>Overall Progress</p>
        </div>
      </div>

      {/* ================= COURSES ================= */}
      <h3 className="section-title">Your Courses</h3>

      <div className="course-grid">
        {data.courses.map((course) => (
          <div
            key={course}
            className={`course-card ${activeCourse === course ? "active" : ""}`}
            onClick={() => openCourse(course)}
          >
            {course}
          </div>
        ))}
      </div>

      {activeCourse && (
        <div className="learning-panel">
          {/* LECTURES */}
          <div className="lecture-panel">
            <h4>Lectures</h4>

            {lectures.map((lec) => (
              <div
                key={lec.id}
                className={`lecture-item ${
                  activeLecture?.id === lec.id ? "active" : ""
                }`}
                onClick={() => setActiveLecture(lec)}
              >
                <PlayCircle size={16} />
                {lec.lecture_title}
              </div>
            ))}
          </div>

          {/* VIDEO */}
          <div className="video-panel">
            {activeLecture?.video_url ? (
              <video
                controls
                className="video-player"
                key={activeLecture.video_url}
              >
                <source src={activeLecture.video_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="video-placeholder">
                <span>🎬 Video Coming Soon</span>
              </div>
            )}

            <div className="video-footer">
              <h4>{activeLecture?.lecture_title}</h4>
              <button
                className="quiz-btn"
                disabled={!activeLecture}
                onClick={() => navigate(`/quiz/${activeLecture.id}`)}
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
