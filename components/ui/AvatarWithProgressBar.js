const WORKOUT_GOAL = 11;

const AvatarWithProgressBar = ({ imageUrl, progress }) => {
  return (
    <div
      className="relative flex items-center justify-center mb-2"
      style={{ width: 132, height: 132 }}
    >
      {/* Progress border */}
      <svg
        width="132"
        height="132"
        className="absolute top-0 left-0 z-0"
        style={{ pointerEvents: "none" }}
      >
        <circle
          cx="66"
          cy="66"
          r="61.5"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="7.5"
        />
        <circle
          cx="66"
          cy="66"
          r="61.5"
          fill="none"
          stroke={
            progress >= WORKOUT_GOAL
              ? "#22c55e" // green
              : progress >= WORKOUT_GOAL * 0.75
              ? "#facc15" // yellow
              : progress >= WORKOUT_GOAL * 0.5
              ? "#f97316" // orange
              : "#ef4444" // red
          }
          strokeWidth="7.5"
          strokeDasharray={2 * Math.PI * 61.5}
          strokeDashoffset={
            2 *
            Math.PI *
            61.5 *
            (1 - Math.min(progress / WORKOUT_GOAL, 1))
          }
          style={{ transition: "stroke-dashoffset 0.5s, stroke 0.5s" }}
        />
      </svg>
      <img
        src={imageUrl}
        alt="user avatar"
        className="w-30 h-30 rounded-full object-cover border-4 border-white shadow z-10"
        style={{ position: "relative", width: 120, height: 120 }}
      />
      {/* Badge */}
      <span
        className="absolute top-3 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow border border-white z-20"
        style={{ transform: "translate(40%, -40%)" }}
      >
        {progress} / {WORKOUT_GOAL}
      </span>
    </div>
  );
};

export default AvatarWithProgressBar;