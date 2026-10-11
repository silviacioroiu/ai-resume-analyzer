import { cn } from "@/lib/utils";

export function scoreTone(score: number) {
  if (score >= 75)
    return {
      label: "Strong match",
      color: "text-green-600",
      stroke: "stroke-green-500",
    };
  if (score >= 50)
    return {
      label: "Partial match",
      color: "text-amber-600",
      stroke: "stroke-amber-500",
    };
  return {
    label: "Weak match",
    color: "text-red-600",
    stroke: "stroke-red-500",
  };
}

/** Circular 0–100 gauge. */
export function ScoreRing({
  score,
  size = 120,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const tone = scoreTone(score);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        className="-rotate-90"
        width={size}
        height={size}
        role="img"
        aria-label={`Score ${score} out of 100`}
      >
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="stroke-gray-200"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className={cn(
            tone.stroke,
            "transition-[stroke-dashoffset] duration-700"
          )}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn("font-bold leading-none", tone.color)}
          style={{ fontSize: size * 0.28 }}
        >
          {score}
        </span>
        <span className="text-xs text-gray-500">/ 100</span>
      </div>
    </div>
  );
}
