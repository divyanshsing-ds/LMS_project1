import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/InstructorDashboard.css";

function InstructorDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("user-token");

  const [active, setActive] = useState("profile");

  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);

  const [courses, setCourses] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [allCategories, setAllCategories] = useState([]);

  const [editMode, setEditMode] = useState(false);

  const [newCategory, setNewCategory] = useState("");
  const [newCourse, setNewCourse] = useState("");

  const [lectureTitle, setLectureTitle] = useState("");
  const [lectureOrder, setLectureOrder] = useState("");

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editCategory, setEditCategory] = useState("");
  const [editCourse, setEditCourse] = useState("");

  const [videoFile, setVideoFile] = useState(null);
  const [editingLecture, setEditingLecture] = useState(null);
  const [editLectureTitle, setEditLectureTitle] = useState("");
  const [editLectureOrder, setEditLectureOrder] = useState("");

  /* ================= AUTH FETCH ================= */
  function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: token,
      },
    }).then((res) => {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("user-token");
        navigate("/");
        throw new Error("Unauthorized");
      }
      return res.json();
    });
  }

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    authFetch("http://localhost:3030/instructor/profile").then(setProfile);

    authFetch("http://localhost:3030/instructor/students").then(setStudents);

    authFetch("http://localhost:3030/instructor/categories").then(
      setAllCategories
    );
  }, []);

  /* ================= TAB CHANGE ================= */
  useEffect(() => {
    setEditMode(false);

    if (active === "course") {
      authFetch("http://localhost:3030/instructor/courses").then(setCourses);
    }
  }, [active]);

  /* ================= ACTIONS ================= */
  function updateProfile() {
    fetch("http://localhost:3030/instructor/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        name: profile.name,
        mobile: profile.mobile_no,
        category: profile.category,
      }),
    }).then(() => setEditMode(false));
  }

  function logout() {
    localStorage.removeItem("user-token");
    navigate("/");
  }

  if (!profile) return null;

  return (
    <div className="inst-layout">
      {/* ========== SIDEBAR ========== */}
      <aside className="inst-sidebar">
        <h2>Instructor</h2>

        <button
          className={active === "profile" ? "active" : ""}
          onClick={() => setActive("profile")}
        >
          Overview
        </button>

        <button
          className={active === "course" ? "active" : ""}
          onClick={() => setActive("course")}
        >
          Courses
        </button>

        <button
          className={active === "lecture" ? "active" : ""}
          onClick={() => setActive("lecture")}
        >
          Lectures
        </button>

        <button
          className={active === "students" ? "active" : ""}
          onClick={() => setActive("students")}
        >
          Students
        </button>
      </aside>

      {/* ========== MAIN ========== */}
      <main className="inst-main">
        <h1>Instructor Dashboard</h1>

        {/* ========== PROFILE ========== */}
        {active === "profile" && (
          <div className="card">
            <h3>Profile</h3>

            <label>Name</label>
            <input
              value={profile.name}
              disabled={!editMode}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />

            <label>Email</label>
            <input value={profile.email} disabled />

            <label>Mobile</label>
            <input
              value={profile.mobile_no}
              disabled={!editMode}
              onChange={(e) =>
                setProfile({ ...profile, mobile_no: e.target.value })
              }
            />

            <label>Categories</label>
            <div className="category-wrapper">
              <div
                className={`category-input ${!editMode ? "disabled" : ""}`}
                onClick={() => editMode && setCategoryOpen(!categoryOpen)}
              >
                {profile.category?.length
                  ? profile.category.join(", ")
                  : "Select categories"}
                <span className="arrow">▾</span>
              </div>

              {categoryOpen && (
                <div className="category-dropdown">
                  {allCategories.map((cat) => (
                    <div
                      key={cat}
                      className="category-option"
                      onClick={() => {
                        const updated = profile.category.includes(cat)
                          ? profile.category.filter((c) => c !== cat)
                          : [...profile.category, cat];

                        setProfile({ ...profile, category: updated });
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={profile.category?.includes(cat)}
                        readOnly
                      />
                      <span>{cat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card-actions">
              <button
                onClick={() => (editMode ? updateProfile() : setEditMode(true))}
              >
                {editMode ? "Save" : "Edit"}
              </button>

              <button className="logout" onClick={logout}>
                Logout
              </button>
            </div>
          </div>
        )}

        {/* ========== COURSES ========== */}
        {active === "course" && (
          <div className="card">
            <h3>Your Courses</h3>

            {courses.map((c) => (
              <div key={c.id} className="student-row">
                {editingCourse === c.id ? (
                  <>
                    <input
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    />

                    <input
                      value={editCourse}
                      onChange={(e) => setEditCourse(e.target.value)}
                    />

                    <button
                      onClick={() => {
                        fetch(
                          `http://localhost:3030/instructor/course/${c.id}`,
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: token,
                            },
                            body: JSON.stringify({
                              category: editCategory,
                              course: editCourse,
                            }),
                          }
                        ).then(() => {
                          setEditingCourse(null);
                          authFetch(
                            "http://localhost:3030/instructor/courses"
                          ).then(setCourses);
                        });
                      }}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <span>{c.category}</span>
                    <span className="clickable">{c.course}</span>

                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditingCourse(c.id);
                        setEditCategory(c.category);
                        setEditCourse(c.course);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="danger"
                      onClick={() =>
                        fetch(
                          `http://localhost:3030/instructor/course/${c.id}`,
                          {
                            method: "DELETE",
                            headers: { Authorization: token },
                          }
                        ).then(() =>
                          setCourses(courses.filter((x) => x.id !== c.id))
                        )
                      }
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))}

            <hr />

            <h3>Add Course</h3>

            <input
              placeholder="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <input
              placeholder="Course Name"
              value={newCourse}
              onChange={(e) => setNewCourse(e.target.value)}
            />

            <button
              onClick={() =>
                fetch("http://localhost:3030/instructor/course", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                  },
                  body: JSON.stringify({
                    category: newCategory,
                    course: newCourse,
                  }),
                }).then(() => {
                  setNewCategory("");
                  setNewCourse("");
                  authFetch("http://localhost:3030/instructor/courses").then(
                    setCourses
                  );
                })
              }
            >
              Add Course
            </button>
          </div>
        )}

        {/* ========== LECTURES ========== */}
        {active === "lecture" && (
          <div className="card">
            <h3>Lectures</h3>

            {/* ================= SELECT COURSE ================= */}
            <select
              value={selectedCourse}
              onChange={(e) => {
                const courseId = e.target.value;
                setSelectedCourse(courseId);

                if (courseId) {
                  authFetch(
                    `http://localhost:3030/instructor/lectures/${courseId}`
                  ).then(setLectures);
                } else {
                  setLectures([]);
                }
              }}
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course}
                </option>
              ))}
            </select>

            {!selectedCourse && <p>Select a course first</p>}

            <hr />

            {/* ================= EXISTING LECTURES ================= */}
            {lectures.map((l) => (
              <div key={l.id} className="lecture-row">
                {editingLecture === l.id ? (
                  <>
                    <input
                      value={editLectureTitle}
                      onChange={(e) => setEditLectureTitle(e.target.value)}
                    />

                    <input
                      value={editLectureOrder}
                      onChange={(e) => setEditLectureOrder(e.target.value)}
                    />

                    <button
                      onClick={() => {
                        fetch(
                          `http://localhost:3030/instructor/lecture/${l.id}`,
                          {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: token,
                            },
                            body: JSON.stringify({
                              title: editLectureTitle,
                              order: editLectureOrder,
                            }),
                          }
                        ).then(() => {
                          setEditingLecture(null);
                          authFetch(
                            `http://localhost:3030/instructor/lectures/${selectedCourse}`
                          ).then(setLectures);
                        });
                      }}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <span>{l.lecture_title}</span>
                    <span>Order: {l.lecture_order}</span>
                    <span>{l.video_url ? "🎥 Uploaded" : "❌ No Video"}</span>

                    <button
                      id="ed"
                      onClick={() => {
                        setEditingLecture(l.id);
                        setEditLectureTitle(l.lecture_title);
                        setEditLectureOrder(l.lecture_order);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      id="ed"
                      className="danger"
                      onClick={() =>
                        fetch(
                          `http://localhost:3030/instructor/lecture/${l.id}`,
                          {
                            method: "DELETE",
                            headers: { Authorization: token },
                          }
                        ).then(() =>
                          setLectures(lectures.filter((x) => x.id !== l.id))
                        )
                      }
                    >
                      Delete
                    </button>

                    {/* ================= VIDEO UPLOAD ================= */}
                    <input
                      className="card input"
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files[0])}
                    />

                    <button
                      onClick={() => {
                        const fd = new FormData();
                        fd.append("video", videoFile);
                        fd.append("lecture_id", l.id);

                        fetch(
                          "http://localhost:3030/instructor/lecture/video",
                          {
                            method: "POST",
                            headers: {
                              Authorization: token,
                            },
                            body: fd,
                          }
                        ).then(() => {
                          authFetch(
                            `http://localhost:3030/instructor/lectures/${selectedCourse}`
                          ).then(setLectures);
                        });
                      }}
                    >
                      Upload Video
                    </button>
                  </>
                )}
              </div>
            ))}

            <hr />

            {/* ================= ADD LECTURE ================= */}
            <h3>Add Lecture</h3>

            <input
              placeholder="Lecture Title"
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
            />

            <input
              placeholder="Order"
              value={lectureOrder}
              onChange={(e) => setLectureOrder(e.target.value)}
            />

            <button
              disabled={!selectedCourse}
              onClick={() =>
                fetch("http://localhost:3030/instructor/lecture", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                  },
                  body: JSON.stringify({
                    course_id: selectedCourse,
                    title: lectureTitle,
                    order: lectureOrder,
                  }),
                }).then(() => {
                  setLectureTitle("");
                  setLectureOrder("");
                  authFetch(
                    `http://localhost:3030/instructor/lectures/${selectedCourse}`
                  ).then(setLectures);
                })
              }
            >
              Add Lecture
            </button>
          </div>
        )}

        {/* ========== STUDENTS ========== */}
        {active === "students" && (
          <div className="card">
            <h3>Students</h3>

            <div className="student-table">
              <div className="student-header">
                <span>Name</span>
                <span>Email</span>
                <span>Courses</span>
                <span>Score</span>
              </div>

              {students.map((s, i) => (
                <div key={i} className="student-row">
                  <span>{s.name}</span>
                  <span>{s.email}</span>
                  <span>{s.course?.join(", ")}</span>
                  <span className="score">{s.total_score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default InstructorDashboard;
