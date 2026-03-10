import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, BookOpen, Users, Video, Edit3, Trash2, Plus, CheckCircle, Upload, LogOut, ChevronDown } from "lucide-react";
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

    authFetch("http://localhost:3030/instructor/profile").then((p) => {
      setProfile({ ...p, category: p.category || [] });
    });

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
    }).then(() => {
      setEditMode(false);
      setCategoryOpen(false);
      alert("✅ Profile updated successfully!");
      authFetch("http://localhost:3030/instructor/profile").then((p) => {
        setProfile({ ...p, category: p.category || [] });
      });
    });
  }

  function handleTagToggle(cat) {
    const updated = profile.category.includes(cat)
      ? profile.category.filter((c) => c !== cat)
      : [...profile.category, cat];
    setProfile({ ...profile, category: updated });
  }

  return (
    <div className="inst-layout">
      {/* ================= SIDEBAR ================= */}
      <aside className="inst-sidebar">
        <h2>LMS Instructor</h2>

        <nav>
          <button className={active === "profile" ? "active" : ""} onClick={() => setActive("profile")}>
            <User size={18} /> Profile
          </button>
          <button className={active === "course" ? "active" : ""} onClick={() => setActive("course")}>
            <BookOpen size={18} /> Courses
          </button>
          <button className={active === "lecture" ? "active" : ""} onClick={() => setActive("lecture")}>
            <Video size={18} /> Lectures
          </button>
          <button className={active === "students" ? "active" : ""} onClick={() => setActive("students")}>
            <Users size={18} /> Students
          </button>
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button className="logout" onClick={() => { localStorage.removeItem("user-token"); navigate("/"); }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="inst-main">
        {/* ========== PROFILE ========== */}
        {active === "profile" && profile && (
          <div className="card">
            <h3><User size={20} color="#6d5dfc" /> General Information</h3>

            <label>Full Name</label>
            <input
              value={profile.name}
              disabled={!editMode}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />

            <label>Mobile Number</label>
            <input
              value={profile.mobile_no}
              disabled={!editMode}
              onChange={(e) =>
                setProfile({ ...profile, mobile_no: e.target.value })
              }
            />

            {/* CATEGORY SELECTOR */}
            <label>Teaching Specialties</label>
            <div className={`category-wrapper ${!editMode ? "disabled" : ""}`}>
              <div
                className={`category-input ${!editMode ? "disabled" : ""}`}
                onClick={() => editMode && setCategoryOpen(!categoryOpen)}
              >
                <div className="selected-tags">
                  {profile.category.length > 0 ? (
                    profile.category.map((c) => (
                      <span key={c} className="tag">
                        {c}
                        {editMode && (
                          <span
                            className="tag-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagToggle(c);
                            }}
                          >
                            ×
                          </span>
                        )}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#94a3b8" }}>Select Specialties...</span>
                  )}
                </div>
                <ChevronDown size={18} color="#94a3b8" />
              </div>

              {categoryOpen && editMode && (
                <div className="category-dropdown">
                  <div className="dropdown-scroll">
                    {allCategories.map((cat) => (
                      <div
                        key={cat}
                        className="category-option"
                        onClick={() => handleTagToggle(cat)}
                      >
                        <input
                          type="checkbox"
                          checked={profile.category.includes(cat)}
                          readOnly
                        />
                        <span>{cat}</span>
                      </div>
                    ))}
                  </div>

                  {/* ADD CUSTOM CATEGORY */}
                  <div className="category-custom">
                    <input
                      type="text"
                      placeholder="Add new specialty..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.target.value.trim()) {
                          const val = e.target.value.trim();
                          if (!profile.category.includes(val)) {
                            handleTagToggle(val);
                            e.target.value = "";
                          }
                        }
                      }}
                    />
                  </div>

                  <div className="category-footer">
                    <button className="done-btn" onClick={() => setCategoryOpen(false)}>
                      Apply Specialties
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card-actions">
              {editMode ? (
                <button className="btn-save" onClick={updateProfile}>Save Changes</button>
              ) : (
                <button className="edit-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
              )}
            </div>
          </div>
        )}

        {/* ========== COURSES ========== */}
        {active === "course" && (
          <div className="card">
            <h3><BookOpen size={20} color="#6d5dfc" /> Manage Courses</h3>

            {courses.map((c) => (
              <div key={c.id} className={editingCourse === c.id ? "course-edit-row" : "course-row"}>
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
                      className="btn-save"
                      onClick={() =>
                        fetch(`http://localhost:3030/instructor/course/${c.id}`, {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: token,
                          },
                          body: JSON.stringify({
                            category: editCategory,
                            course: editCourse,
                          }),
                        }).then(() => {
                          setEditingCourse(null);
                          authFetch("http://localhost:3030/instructor/courses").then(setCourses);
                        })
                      }
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="tag">{c.category}</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>{c.course}</span>
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditingCourse(c.id);
                        setEditCategory(c.category);
                        setEditCourse(c.course);
                      }}
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      className="danger"
                      onClick={() =>
                        fetch(`http://localhost:3030/instructor/course/${c.id}`, {
                          method: "DELETE",
                          headers: { Authorization: token },
                        }).then(() =>
                          setCourses(courses.filter((x) => x.id !== c.id))
                        )
                      }
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </>
                )}
              </div>
            ))}

            <div className="add-lecture" style={{ marginTop: '40px' }}>
              <h3><Plus size={18} /> New Course</h3>
              <div className="form-row">
                <input
                  placeholder="Category (e.g. Design)"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <input
                  placeholder="Course Name"
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                />
                <button className="btn-save"
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
                      authFetch("http://localhost:3030/instructor/courses").then(setCourses);
                    })
                  }
                >
                  Create Course
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== LECTURES ========== */}
        {active === "lecture" && (
          <div className="card">
            <h3><Video size={20} color="#6d5dfc" /> Lecture Curriculum</h3>

            <label>Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => {
                const courseId = e.target.value;
                setSelectedCourse(courseId);
                if (courseId) {
                  authFetch(`http://localhost:3030/instructor/lectures/${courseId}`).then(setLectures);
                } else {
                  setLectures([]);
                }
              }}
            >
              <option value="">Choose a Course to Edit...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.course}</option>
              ))}
            </select>

            <div className="lecture-list">
              {lectures.map((l) => (
                <div key={l.id} className="lecture-row">
                  {editingLecture === l.id ? (
                    <div className="lecture-edit">
                      <input
                        value={editLectureTitle}
                        onChange={(e) => setEditLectureTitle(e.target.value)}
                      />
                      <input
                        type="number"
                        value={editLectureOrder}
                        onChange={(e) => setEditLectureOrder(e.target.value)}
                      />
                      <button className="btn-save"
                        onClick={() => {
                          fetch(`http://localhost:3030/instructor/lecture/${l.id}`, {
                            method: "PUT",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: token,
                            },
                            body: JSON.stringify({
                              title: editLectureTitle,
                              order: editLectureOrder,
                            }),
                          }).then(() => {
                            setEditingLecture(null);
                            authFetch(`http://localhost:3030/instructor/lectures/${selectedCourse}`).then(setLectures);
                          });
                        }}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="lecture-top">
                        <span className="lecture-title">{l.lecture_title}</span>
                        <span className="lecture-order"># {l.lecture_order}</span>
                        <span className={`video-status ${l.video_url ? 'uploaded' : 'missing'}`}>
                          {l.video_url ? <><CheckCircle size={14} /> Ready</> : "No Video"}
                        </span>
                        <div className="lecture-actions">
                          <button className="edit-btn" onClick={() => {
                            setEditingLecture(l.id);
                            setEditLectureTitle(l.lecture_title);
                            setEditLectureOrder(l.lecture_order);
                          }}><Edit3 size={14} /></button>
                          <button className="danger" onClick={() => {
                            fetch(`http://localhost:3030/instructor/lecture/${l.id}`, {
                              method: "DELETE",
                              headers: { Authorization: token },
                            }).then(() => setLectures(lectures.filter((x) => x.id !== l.id)));
                          }}><Trash2 size={14} /></button>
                        </div>
                      </div>

                      <div className="upload-section" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => setVideoFile(e.target.files[0])}
                        />
                        <button className="upload-btn" onClick={() => {
                          const fd = new FormData();
                          fd.append("video", videoFile);
                          fd.append("lecture_id", l.id);
                          fetch("http://localhost:3030/instructor/lecture/video", {
                            method: "POST",
                            headers: { Authorization: token },
                            body: fd,
                          }).then(() => {
                            authFetch(`http://localhost:3030/instructor/lectures/${selectedCourse}`).then(setLectures);
                          });
                        }}>
                          <Upload size={14} /> {l.video_url ? "Update Video" : "Upload Video"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="add-lecture">
              <h3><Plus size={18} /> Add New Lecture</h3>
              <div className="form-row">
                <input
                  placeholder="Lecture Title (e.g. Introduction)"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                />
                <input
                  placeholder="Sequence Order"
                  type="number"
                  value={lectureOrder}
                  onChange={(e) => setLectureOrder(e.target.value)}
                />
                <button className="btn-save"
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
                      authFetch(`http://localhost:3030/instructor/lectures/${selectedCourse}`).then(setLectures);
                    })
                  }
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========== STUDENTS ========== */}
        {active === "students" && (
          <div className="card">
            <h3><Users size={20} color="#6d5dfc" /> Student Roster</h3>

            <div className="student-table">
              <div className="student-header">
                <span>Student</span>
                <span>Email</span>
                <span>Active Enrollments</span>
                <span>Performance</span>
              </div>

              {students.length === 0 && <div className="student-row" style={{ textAlign: 'center' }}>No students enrolled yet.</div>}

              {students.map((s, i) => (
                <div key={i} className="student-row">
                  <span style={{ fontWeight: 800 }}>{s.name}</span>
                  <span style={{ opacity: 0.7 }}>{s.email}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {s.course?.map(c => <span key={c} className="tag" style={{ border: 'none', background: '#f8fafc', fontSize: '11px' }}>{c}</span>)}
                  </div>
                  <span className="score">{s.total_score || 0} pts</span>
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
