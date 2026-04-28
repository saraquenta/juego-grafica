"use client";

import React from "react";

export type ObstacleShape =
  | "spike" | "spike-ceil" | "column" | "block" | "spike-group"
  | "circle" | "triangle" | "square-spikes" | "slider-triangle" | "slider-circle"
  | "portal-in" | "portal-out" | "portal-win"; // Añadido portal-win

interface ObstacleItemProps {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: ObstacleShape;
  rotation?: number;
}

// --- Componentes SVG Estáticos ---
function Spike({ w, h, flipped = false }: { w: number; h: number; flipped?: boolean }) {
  const pts = flipped ? `0,0 ${w},0 ${w/2},${h}` : `0,${h} ${w},${h} ${w/2},0`;
  const gid = flipped ? "spikeCeil" : "spikeFloor";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={flipped ? "#a78bfa" : "#cbd5e1"} />
          <stop offset="100%" stopColor={flipped ? "#7c3aed" : "#ffffff"} />
        </linearGradient>
      </defs>
      <polygon points={pts} fill={`url(#${gid})`} stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
    </svg>
  );
}

function SpikeGroup({ w, h }: { w: number; h: number }) {
  const sw = w / 3;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="sgG" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#cbd5e1" /><stop offset="100%" stopColor="#fff" />
        </linearGradient>
      </defs>
      {[0,1,2].map((i) => (
        <polygon key={i} points={`${i*sw},${h} ${(i+1)*sw},${h} ${i*sw+sw/2},0`}
          fill="url(#sgG)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      ))}
    </svg>
  );
}

function Column({ w, h }: { w: number; h: number }) {
  const gs = 20, cols = Math.floor(w/gs), rows = Math.floor(h/gs);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="colG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1b4b"/><stop offset="100%" stopColor="#0f0a2e"/>
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={w} height={h} fill="url(#colG)" />
      <rect x={0} y={0} width={w} height={h} fill="none" stroke="#a78bfa" strokeWidth="2.5"/>
    </svg>
  );
}

function GDBlock({ w, h }: { w: number; h: number }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="blkG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#312e81"/><stop offset="100%" stopColor="#1e1b4b"/>
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={w} height={h} fill="url(#blkG)"/>
      <rect x={0} y={0} width={w} height={h} fill="none" stroke="#818cf8" strokeWidth="2"/>
    </svg>
  );
}

function Portal({ s, type }: { s: number; type: "in" | "out" | "win" }) {
  // Azul para entrada, Rosa para salida, Dorado para victoria
  const color = type === "in" ? "#38bdf8" : type === "out" ? "#f472b6" : "#fbbf24"; 
  return (
    <svg width={s} height={s * 1.5} viewBox={`0 0 ${s} ${s * 1.5}`}>
      <defs>
        <ellipse id={`pCore-${type}`} cx={s/2} cy={s*0.75} rx={s/2 - 5} ry={s*0.7} />
        <radialGradient id={`pGrad-${type}`}>
          <stop offset="0%" stopColor="white" />
          <stop offset="40%" stopColor={color} />
          <stop offset="100%" stopColor="black" />
        </radialGradient>
      </defs>
      <use href={`#pCore-${type}`} fill={color} filter="blur(8px)" opacity="0.6" />
      <use href={`#pCore-${type}`} fill={`url(#pGrad-${type})`} stroke={color} strokeWidth="3" />
      <rect x={s/2 - 2} y={s*0.2} width="4" height={s*1.1} fill="white" opacity="0.4" rx="2" />
    </svg>
  );
}

// --- Componentes SVG Dinámicos ---
function MeteorCircle({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <circle cx={s/2} cy={s/2} r={s/2-2} fill="#9f1239" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
    </svg>
  );
}

function FlyTriangle({ s, color1, color2 }: { s: number; color1: string; color2: string }) {
  const h = s * 0.87;
  return (
    <svg width={s} height={h} viewBox={`0 0 ${s} ${h}`}>
      <polygon points={`${s/2},0 ${s},${h} 0,${h}`} fill={color1} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    </svg>
  );
}

function SpikeySquare({ s }: { s: number }) {
  const sp = s * 0.28;
  return (
    <svg width={s+sp*2} height={s+sp*2} viewBox={`${-sp} ${-sp} ${s+sp*2} ${s+sp*2}`} overflow="visible">
      <rect x={0} y={0} width={s} height={s} fill="#c2410c" rx={4}/>
    </svg>
  );
}

function SliderCircle({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <circle cx={s/2} cy={s/2} r={s/2-2} fill="#0e7490" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
    </svg>
  );
}

// --- Export Principal ---
const ObstacleItem = ({ x, y, width, height, shape, rotation = 0 }: ObstacleItemProps) => {
  const base: React.CSSProperties = {
    position: "absolute", left: x, top: y, width, height,
    transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
    zIndex: 20, pointerEvents: "none"
  };

  if (shape === "spike") return <div style={base}><Spike w={width} h={height}/></div>;
  if (shape === "spike-ceil") return <div style={base}><Spike w={width} h={height} flipped/></div>;
  if (shape === "spike-group") return <div style={base}><SpikeGroup w={width} h={height}/></div>;
  if (shape === "column") return <div style={base}><Column w={width} h={height}/></div>;
  if (shape === "block") return <div style={base}><GDBlock w={width} h={height}/></div>;
  
  if (shape === "portal-in" || shape === "portal-out" || shape === "portal-win") {
    const type = shape.replace("portal-", "") as "in" | "out" | "win";
    const glowColor = type === "in" ? "#38bdf8" : type === "out" ? "#f472b6" : "#fbbf24";
    return (
      <div style={{ ...base, filter: `drop-shadow(0 0 25px ${glowColor})` }}>
        <Portal s={width} type={type} />
      </div>
    );
  }

  if (shape === "circle") return <div style={base}><MeteorCircle s={width}/></div>;
  if (shape === "triangle") return <div style={{...base, height: width*0.87}}><FlyTriangle s={width} color1="#f43f5e" color2="#7f1d1d"/></div>;
  if (shape === "slider-triangle") return <div style={{...base, height: width*0.87}}><FlyTriangle s={width} color1="#a855f7" color2="#4c1d95"/></div>;
  if (shape === "square-spikes") return <div style={{...base, overflow:"visible"}}><SpikeySquare s={width}/></div>;
  if (shape === "slider-circle") return <div style={base}><SliderCircle s={width}/></div>;

  return null;
};

export default React.memo(ObstacleItem);