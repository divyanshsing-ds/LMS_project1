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
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3030/recommendations", {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((result) => setRecommendations(Array.isArray(result) ? result : []))
      .catch((err) => console.log("Rec Error:", err));
  }, []);

  useEffect(() => {
    if (activeLecture) {
      setSummary("");
      setLoadingSummary(true);
      fetch(`http://localhost:3030/lecture/summary/${activeLecture.id}`, {
        headers: { Authorization: token },
      })
        .then((res) => res.json())
        .then((result) => {
          setSummary(result.summary);
          setLoadingSummary(false);
        })
        .catch(() => setLoadingSummary(false));
    }
  }, [activeLecture]);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    fetch("http://localhost:3030/dashboard", {
      headers: { Authorization: token },
    })
      .then((res) => {
        if (res.status === 403 || res.status === 401) {
          localStorage.removeItem("user-token");
          navigate("/");
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((result) => {
        if (!result || result === "Invalid token") {
          navigate("/");
        } else {
          setData(result);
        }
      })
      .catch((err) => {
        console.error("Dashboard Fetch Error:", err);
        navigate("/");
      });
  }, []);

  useEffect(() => {
    if (data && data.courses && data.courses.length > 0 && !activeCourse) {
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
        setLectures(Array.isArray(result) ? result : []);
        if (result.length > 0) {
          setActiveLecture(result[0]);
        }
      })
      .catch(err => console.error("Lectures Fetch Error:", err));
  }

  useEffect(() => {
    fetch("http://localhost:3030/progress", {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((d) => setProgress(d.percent || 0))
      .catch(() => setProgress(0));
  }, []);

  if (!data) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2>Welcome, {data?.name || "Learner"}</h2>

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
          <h3>{data.totalCourses || 0}</h3>
          <p>Total Courses</p>
        </div>

        <div className="stat-card progress-card">
          <div className="progress-container">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6d5dfc" />
                  <stop offset="100%" stopColor="#4f46e5" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="60" r="54" className="progress-bg" />
              <circle
                cx="60"
                cy="60"
                r="54"
                className="progress-bar"
                style={{
                  strokeDasharray: 339,
                  strokeDashoffset: 339 - (339 * progress) / 100,
                }}
              />
            </svg>
            <div className="progress-inner">
              <span className="percent">{progress}%</span>
            </div>
          </div>
          <p className="progress-label">Overall Progress</p>
        </div>
      </div>

      {/* ================= COURSES ================= */}
      <h3 className="section-title">Your Courses</h3>

      <div className="course-grid">
        {data.courses?.map((course) => (
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
                className={`lecture-item ${activeLecture?.id === lec.id ? "active" : ""}`}
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
              <div className="title-section">
                <h4>{activeLecture?.lecture_title}</h4>
                <button
                  className="quiz-btn"
                  disabled={!activeLecture}
                  onClick={() => navigate(`/quiz/${activeLecture.id}`)}
                >
                  Start Quiz
                </button>
              </div>

              {loadingSummary && <p className="loading-text">Generating AI summary...</p>}
              {summary && !loadingSummary && (
                <div className="summary-box">
                  <p><strong>AI Insights:</strong> {summary}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= RECOMMENDATIONS ================= */}
      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3 className="section-title">Recommended for You 🧠</h3>
          <div className="rec-grid">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className="rec-card"
                onClick={() => navigate("/category")}
              >
                <img src={rec.photo} alt={rec.course} />
                <div className="rec-info">
                  <span className="rec-tag">{rec.category}</span>
                  <h5>{rec.course}</h5>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
