function SemiCircleProgress({ value }) {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div className="semi-circle">
      <div
        className="semi-circle-fill"
        style={{ transform: `rotate(${percentage * 1.8}deg)` }}
      ></div>
      <div className="semi-circle-cover">
        <span>{percentage}%</span>
      </div>
    </div>
  );
}

export default SemiCircleProgress;
