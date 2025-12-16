import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/Checkout.css";

function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("user-token");

  const category = state?.category;
  const [courses, setCourses] = useState(state?.courses || []);

  // Guard: unauthorized or invalid navigation
  if (!token || !category) {
    navigate("/");
    return null;
  }

  // Remove a selected course
  function removeCourse(course) {
    setCourses((prevCourses) => prevCourses.filter((c) => c !== course));
  }

  // Navigate back to course selection while preserving state
  function addMoreCourses() {
    navigate("/Course", {
      state: {
        category: category,
        selectedCourses: courses,
      },
    });
  }

  // Confirm enrollment and persist data
  function confirmEnrollment() {
    if (courses.length === 0) {
      alert("Please select at least one course.");
      return;
    }

    fetch("http://localhost:3030/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ courses }),
    })
      .then((res) => res.json())
      .then(() => {
        navigate("/dashboard");
      })
      .catch((err) => {
        console.error("Enrollment failed:", err);
        alert("Unable to complete enrollment. Please try again.");
      });
  }

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <h2>Checkout</h2>
        <p>{category}</p>

        <div className="course-list">
          {courses.map((course) => (
            <div key={course} className="course-item">
              <span>{course}</span>

              <button
                className="delete-btn"
                onClick={() => removeCourse(course)}
                aria-label="Remove course"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="checkout-footer">
          <div className="total-text">
            Total Courses: <span>{courses.length}</span>
          </div>

          <div className="action-btns">
            <button className="add-btn" onClick={addMoreCourses}>
              Add More Courses
            </button>

            <button
              className="confirm-btn"
              onClick={confirmEnrollment}
              disabled={courses.length === 0}
            >
              Confirm Enrollment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
