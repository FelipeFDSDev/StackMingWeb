import React from "react";
import { TrendPoint } from "../types/api";

interface Props {
  data:    TrendPoint[];
  width?:  number;
  height?: number;
  color?:  string;
}

export const Sparkline: React.FC<Props> = ({
  data,
  width  = 80,
  height = 28,
  color  = "#6366f1",
}) => {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min    = Math.min(...values);
  const max    = Math.max(...values);
  const range  = max - min || 1;

  const toX = (i: number) => (i / (data.length - 1)) * width;
  const toY = (v: number) => height - ((v - min) / range) * (height * 0.8) - height * 0.1;

  const pts   = values.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const first = `${toX(0)},${height}`;
  const last  = `${toX(data.length - 1)},${height}`;
  const area  = `M${first} L${pts} L${last} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={toX(data.length - 1)}
        cy={toY(values[values.length - 1])}
        r="2.5"
        fill={color}
      />
    </svg>
  );
};
