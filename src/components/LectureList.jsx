function LectureList() {
  const lectures = [
    "Introduction",
    "HTML Basics",
    "CSS Fundamentals",
    "JavaScript Basics",
    "React Intro",
    "Node.js Intro"
  ];

  return (
    <div className="lecture-list">
      {lectures.map((lec, index) => (
        <div className="lecture-card" key={index}>
          <div>
            <h4>Lecture {index + 1}</h4>
            <p>{lec}</p>
          </div>
          <button className="quiz-btn">Start Quiz</button>
        </div>
      ))}
    </div>
  );
}

export default LectureList;
