import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/Quiz.css";

function Quiz() {
  const { lectureId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("user-token");

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:3030/quiz/${lectureId}`, {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid quiz data");
        }
        setQuestions(data);
        setLoading(false);
      })
  }, [lectureId]);

  function submitQuiz() {
    let score = 0;

    questions.forEach((q, i) => {
      if (answers[i] === q.answer) score++;
    });

    fetch("http://localhost:3030/quiz/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        lecture_id: lectureId,
        score,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        alert(
          result.status === "COMPLETED"
            ? "🎉 Lecture Completed!"
            : "❌ Retry Required"
        );
        navigate("/dashboard");
      });
  }

  if (loading) return <p className="quiz-loading">Loading quiz...</p>;

  return (
    <div className="quiz-page">
      <div className="quiz-card">
        <h2>Lecture Quiz</h2>

        {questions.map((q, i) => (
          <div key={i} className="quiz-question">
            <p>
              {i + 1}. {q.question}
            </p>

            {q.options.map((opt) => (
              <label key={opt} className="quiz-option">
                <input
                  type="radio"
                  name={`q-${i}`}
                  value={opt}
                  onChange={() => setAnswers((prev) => ({ ...prev, [i]: opt }))}
                />
                {opt}
              </label>
            ))}
          </div>
        ))}

        <button className="quiz-submit" onClick={submitQuiz}>
          Submit Quiz
        </button>
      </div>
    </div>
  );
}

export default Quiz;
