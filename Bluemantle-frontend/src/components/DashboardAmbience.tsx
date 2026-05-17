"use client";

import "./DashboardAmbience.css";

const TRACERS = [
  { top: "15%", left: "1%", size: 65, opacity: 0.55, delay: "0s", rotate: 0 },
  { top: "42%", left: "0%", size: 50, opacity: 0.35, delay: "0.4s", rotate: 20 },
  { top: "72%", left: "2%", size: 40, opacity: 0.5, delay: "0.8s", rotate: -15 },
  { top: "20%", right: "1%", size: 60, opacity: 0.5, delay: "0.2s", rotate: 10 },
  { top: "55%", right: "0%", size: 45, opacity: 0.4, delay: "0.6s", rotate: -25 },
  { top: "80%", right: "2%", size: 35, opacity: 0.3, delay: "1s", rotate: 30 },
  { top: "30%", left: "-1%", size: 75, opacity: 0.2, delay: "0.3s", rotate: 45 },
  { top: "85%", left: "0.5%", size: 30, opacity: 0.45, delay: "1.2s", rotate: -30 },
  { top: "10%", right: "-1%", size: 80, opacity: 0.2, delay: "0.7s", rotate: -10 },
  { top: "65%", right: "1%", size: 55, opacity: 0.35, delay: "0.9s", rotate: 15 },
];

type Tracer = {
  top: string;
  left?: string;
  right?: string;
  size: number;
  opacity: number;
  delay: string;
  rotate: number;
};

function PolylineTracer({ size, delay, rotate }: { size: number; delay: string; rotate: number }) {
  const half = size / 2;
  const pad = size * 0.25;
  const pts = `${half},${pad} ${pad},${half} ${half},${size - pad} ${size - pad},${half} ${half},${pad}`;

  return (
    <div
      className="polyline-loading"
      style={{ transform: `rotate(${rotate}deg)`, animationDelay: delay }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polyline id="poly-back" points={pts} />
        <polyline id="poly-front" points={pts} style={{ animationDelay: delay }} />
      </svg>
    </div>
  );
}

export function DashboardAmbience() {
  return (
    <>
      {TRACERS.map((t: Tracer, i) => (
        <div
          key={i}
          className="fixed z-[2] pointer-events-none hidden xl:block"
          style={{
            top: t.top,
            left: t.left,
            right: t.right,
            opacity: t.opacity,
          }}
          aria-hidden="true"
        >
          <PolylineTracer size={t.size} delay={t.delay} rotate={t.rotate} />
        </div>
      ))}
    </>
  );
}
