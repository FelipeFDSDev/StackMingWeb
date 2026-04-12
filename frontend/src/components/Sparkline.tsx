import React from "react";
import { Reading } from "../data/mockSensors";

interface Props {
  data: Reading[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline: React.FC<Props> = ({
  data,
  width = 120,
  height = 36,
  color = "#6366f1",
}) => {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i: number) => (i / (data.length - 1)) * width;
  const toY = (v: number) => height - ((v - min) / range) * (height * 0.8) - height * 0.1;

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(" ");
  const area = `M${toX(0)},${height} L${points.split(" ").map((p, i) => (i === 0 ? `${toX(0)},${toY(data[0].value)}` : p)).join(" ")} L${toX(data.length - 1)},${height} Z`;
  const line = `M${points.split(" ").map((p, i) => `${i === 0 ? "M" : "L"}${p}`).join(" ")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={toX(data.length - 1)} cy={toY(values[values.length - 1])} r="3" fill={color} />
    </svg>
  );
};