import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Selectcategory.css";

function Selectcategory() {
  const navigate = useNavigate();
  const token = localStorage.getItem("user-token");

  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);

  function getRoleFromToken(token) {
    try {
      return JSON.parse(atob(token.split(".")[1])).role;
    } catch {
      return null;
    }
  }

  const role = getRoleFromToken(token);

  /*FIRST TIME CHECK*/
  useEffect(() => {
    if (!token || !role) {
      navigate("/");
      return;
    }

    // STUDENT FLOW
    if (role === "student") {
      fetch("http://localhost:3030/student-status", {
        headers: { Authorization: token },
      })
        .then((res) => res.json())
        .then((status) => {
          if (status.completed) {
            navigate("/dashboard");
          } else {
            setLoading(false);
          }
        })
        .catch(() => navigate("/"));
    }

    // INSTRUCTOR FLOW
    if (role === "instructor") {
      fetch("http://localhost:3030/instructor-status", {
        headers: { Authorization: token },
      })
        .then((res) => res.json())
        .then((status) => {
          if (status.completed) {
            navigate("/instructor-dashboard");
          } else {
            setLoading(false);
          }
        })
        .catch(() => navigate("/"));
    }
  }, []);

  /*LOAD CATEGORIES*/
  useEffect(() => {
    if (!loading) {
      fetch("http://localhost:3030/categories")
        .then((res) => res.json())
        .then((data) => setCategories(data));
    }
  }, [loading]);

  /*CATEGORY SELECT LOGIC*/
  function toggleCategory(category) {
    // STUDENT → ONLY ONE CATEGORY
    if (role === "student") {
      setSelected([category]);
      return;
    }

    // INSTRUCTOR → MULTIPLE CATEGORIES
    if (selected.includes(category)) {
      setSelected((prev) => prev.filter((c) => c !== category));
    } else {
      setSelected((prev) => [...prev, category]);
    }
  }

  /*SAVE SELECTION*/
  function saveSelection() {
    if (selected.length === 0) {
      alert("Please select at least one category");
      return;
    }

    // STUDENT
    if (role === "student") {
      navigate("/Course", {
        state: { category: selected[0] },
      });
    }

    // INSTRUCTOR
    if (role === "instructor") {
      fetch("http://localhost:3030/instructor-category", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ categories: selected }),
      }).then(() => navigate("/instructor-dashboard"));
    }
  }

  if (loading) return null;

  return (
    <div className="select-category-page">
      <h2>
        {role === "student"
          ? "Select Your Learning Category"
          : "Select Categories You Want To Teach"}
      </h2>

      <div className="category-grid">
        {categories.map((c) => (
          <div
            key={c.category}
            className={`category-box ${
              selected.includes(c.category) ? "active" : ""
            }`}
            onClick={() => toggleCategory(c.category)}
          >
            <img src={c.photo} alt={c.category} />
            <span>{c.category}</span>
          </div>
        ))}
      </div>

      <button className="save-btn" onClick={saveSelection}>
        {role === "student" ? "Continue" : "Save Categories"}
      </button>
    </div>
  );
}

export default Selectcategory;
