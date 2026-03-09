import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/SelectCourse.css";

function SelectCourse() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("user-token");

  // 🔥 CATEGORY + PREVIOUS COURSES (IMPORTANT)
  const category = location.state?.category;
  const alreadySelected = location.state?.selectedCourses || [];

  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState(alreadySelected);

  useEffect(() => {
    if (!token || !category) {
      navigate("/");
      return;
    }

    fetch(`http://localhost:3030/courses/${encodeURIComponent(category)}`)
      .then((res) => res.json())
      .then((data) => setCourses(data));
  }, [category, token, navigate]);

  // ✅ TOGGLE SELECT COURSE
  function toggleCourse(course) {
    setSelectedCourses((prev) => {
      if (prev.includes(course)) {
        return prev.filter((c) => c !== course);
      } else {
        return [...prev, course];
      }
    });
  }

  // ✅ GO TO CHECKOUT
  function goCheckout() {
    if (selectedCourses.length === 0) {
      alert("Kam se kam ek course select kar");
      return;
    }

    navigate("/checkout", {
      state: {
        courses: selectedCourses,
        category: category,
      },
    });
  }

  return (
    <div className="select-course-page">
      <div className="select-course-card">
        <h2>{category}</h2>
        <p>Courses select kar (multiple allowed)</p>

        <div className="course-scroll-container">
          {courses.map((c) => (
            <div
              key={c.course}
              className={`course-card-premium ${selectedCourses.includes(c.course) ? "is-selected" : ""
                }`}
              onClick={() => toggleCourse(c.course)}
            >
              {/* Check Icon Tag */}
              {selectedCourses.includes(c.course) && (
                <div className="check-badge">
                  <span className="check-icon">✓</span>
                </div>
              )}

              <div className="card-image-wrapper">
                <img src={c.photo} alt={c.course} />
              </div>

              <div className="card-content-area">
                <span className="course-category-tag">{category}</span>
                <h3 className="course-title-main">{c.course}</h3>
                <p className="course-subtitle-small">Master the fundamentals and advanced concepts with step-by-step guidance.</p>
              </div>
            </div>
          ))}
        </div>

        {/* ✅ STICKY CHECKOUT BUTTON */}
        <div className="checkout-btn-container">
          <button className="checkout-btn" onClick={goCheckout}>
            Checkout ({selectedCourses.length})
          </button>
        </div>
      </div>
    </div>
  );
}

export default SelectCourse;
