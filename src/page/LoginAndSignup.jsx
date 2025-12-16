import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginAndSignup.css";

function LoginAndSignup() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("");
  let navigate = useNavigate();

  let [x, setx] = useState();
  let [full_name, setfn] = useState("");
  let [Email, sete] = useState("");
  let [pass, setpass] = useState("");
  let [course, setc] = useState("");
  let [mobile, setMobile] = useState(""); // ✅ FIX
  let [msg, setMsg] = useState("");

  function save() {
    fetch(
      `http://localhost:3030/signup?Name=${full_name}&Email=${Email}&Pass=${pass}&Role=${role}&Mobile=${mobile}`,
      { method: "POST" }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.role === "student") {
          localStorage.setItem("user-token", data.token);
          navigate("/category");
        } else {
          alert("Signup successful. Please login.");
          setMode("login");
        }
      });
  }

  function login() {
    if (!role) {
      alert("Please select role");
      return;
    }

    fetch(
      `http://localhost:3030/login?Email=${Email}&Password=${pass}&Role=${role}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (typeof data === "string") {
          alert(data);
          return;
        }

        if (!data.token) {
          alert("Login failed");
          return;
        }

        localStorage.setItem("user-token", data.token);

        // ✅ STUDENT FLOW
        if (role === "student") {
          navigate("/dashboard");
        }

        // ✅ INSTRUCTOR FLOW
        if (role === "instructor") {
          fetch("http://localhost:3030/instructor-status", {
            headers: {
              Authorization: data.token,
            },
          })
            .then((res) => res.json())
            .then((status) => {
              if (!status.completed) {
                navigate("/category");
              } else {
                navigate("/instructor-dashboard");
              }
            });
        }
      });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* LEFT PANEL (UNCHANGED) */}
        <div className="auth-left">
          <div className="left-text">
            <h2>{mode === "login" ? "Welcome Back" : "Create Your Account"}</h2>
            <p>
              {mode === "login"
                ? "Login to continue learning"
                : "Start your learning journey"}
            </p>
          </div>

          <img src="/peeking-boy.png" alt="welcome" className="side-img" />
          <h1>LMS Portal</h1>
          <p>
            Learn. Teach. Track progress.
            <br />
            All in one platform.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="mode-toggle">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setRole("");
              }}
            >
              Login
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setRole("");
              }}
            >
              Sign Up
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              mode === "signup" ? save() : login();
            }}
          >
            {mode === "signup" && (
              <div className="field">
                <input
                  value={full_name}
                  onChange={(e) => setfn(e.target.value)}
                  type="text"
                  required
                />
                <label>Full Name</label>
              </div>
            )}

            <div className="field">
              <input
                value={Email}
                onChange={(e) => sete(e.target.value)}
                type="email"
                required
              />
              <label>Email</label>
            </div>

            {mode === "signup" && (
              <div className="field">
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)} // ✅ FIX
                  type="number"
                  required
                />
                <label>Mobile No.</label>
              </div>
            )}

            <div className="field">
              <input
                value={pass}
                onChange={(e) => setpass(e.target.value)}
                type="password"
                required
              />
              <label>Password</label>
            </div>

            <select
              className="dropdown-animate"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Select Role</option>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>

            <button className="submit-btn">
              {mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginAndSignup;
