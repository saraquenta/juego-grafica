"use client";

import React from "react";

export type ObstacleShape =
  // ── Estáticos GD ──
  | "spike"
  | "spike-ceil"
  | "column"
  | "block"
  | "spike-group"
  // ── Dinámicos voladores ──
  | "circle"
  | "triangle"
  | "square-spikes"
  | "slider-triangle"
  | "slider-circle";

interface ObstacleItemProps {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: ObstacleShape;
  rotation?: number;
}

// ─────────────────────── GD static shapes ────────────────────────────────────

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
      {Array.from({length:rows}).flatMap((_,r) =>
        Array.from({length:cols}).map((_,c) => (
          <rect key={`${r}-${c}`} x={c*gs+1} y={r*gs+1} width={gs-2} height={gs-2}
            fill="none" stroke="rgba(167,139,250,0.2)" strokeWidth="1"/>
        ))
      )}
      <rect x={0} y={0} width={w} height={h} fill="none" stroke="#a78bfa" strokeWidth="2.5"/>
      <rect x={0} y={0} width={w} height={h} fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth="9"/>
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
      {[1,2].map((i) => (
        <React.Fragment key={i}>
          <line x1={w/3*i} y1={0} x2={w/3*i} y2={h} stroke="rgba(167,139,250,0.3)" strokeWidth="1"/>
          <line x1={0} y1={h/3*i} x2={w} y2={h/3*i} stroke="rgba(167,139,250,0.3)" strokeWidth="1"/>
        </React.Fragment>
      ))}
      <rect x={0} y={0} width={w} height={h} fill="none" stroke="#818cf8" strokeWidth="2"/>
      <rect x={3} y={3} width={w-6} height={h-6} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
    </svg>
  );
}

// ─────────────────────── Dynamic flying shapes ────────────────────────────────

function MeteorCircle({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <defs>
        <radialGradient id="metG" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fb7185"/><stop offset="100%" stopColor="#9f1239"/>
        </radialGradient>
      </defs>
      <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#metG)" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
      <circle cx={s*0.35} cy={s*0.35} r={s*0.09} fill="rgba(255,255,255,0.28)"/>
    </svg>
  );
}

function FlyTriangle({ s, color1, color2 }: { s: number; color1: string; color2: string }) {
  const h = s * 0.87;
  const gid = `triG${color1.replace("#","")}`;
  return (
    <svg width={s} height={h} viewBox={`0 0 ${s} ${h}`}>
      <defs>
        <linearGradient id={gid} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color2}/><stop offset="100%" stopColor={color1}/>
        </linearGradient>
      </defs>
      <polygon points={`${s/2},0 ${s},${h} 0,${h}`}
        fill={`url(#${gid})`} stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    </svg>
  );
}

function SpikeySquare({ s }: { s: number }) {
  const sp = s * 0.28;
  return (
    <svg width={s+sp*2} height={s+sp*2} viewBox={`${-sp} ${-sp} ${s+sp*2} ${s+sp*2}`} overflow="visible">
      <defs>
        <radialGradient id="sqG" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#fb923c"/><stop offset="100%" stopColor="#c2410c"/>
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={s} height={s} fill="url(#sqG)" rx={4}/>
      {/* 8 pinchos en esquinas */}
      <polygon points={`0,0 ${-sp},${-sp} ${sp},0`} fill="#f97316"/>
      <polygon points={`0,0 ${-sp},${-sp} 0,${sp}`} fill="#f97316"/>
      <polygon points={`${s},0 ${s+sp},${-sp} ${s-sp},0`} fill="#f97316"/>
      <polygon points={`${s},0 ${s+sp},${-sp} ${s},${sp}`} fill="#f97316"/>
      <polygon points={`0,${s} ${-sp},${s+sp} ${sp},${s}`} fill="#f97316"/>
      <polygon points={`0,${s} ${-sp},${s+sp} 0,${s-sp}`} fill="#f97316"/>
      <polygon points={`${s},${s} ${s+sp},${s+sp} ${s-sp},${s}`} fill="#f97316"/>
      <polygon points={`${s},${s} ${s+sp},${s+sp} ${s},${s-sp}`} fill="#f97316"/>
    </svg>
  );
}

function SliderCircle({ s }: { s: number }) {
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <defs>
        <radialGradient id="slcG" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#67e8f9"/><stop offset="100%" stopColor="#0e7490"/>
        </radialGradient>
      </defs>
      <circle cx={s/2} cy={s/2} r={s/2-2} fill="url(#slcG)" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
      <circle cx={s*0.35} cy={s*0.35} r={s*0.1} fill="rgba(255,255,255,0.3)"/>
    </svg>
  );
}

// ─────────────────────── Main export ─────────────────────────────────────────

export default function ObstacleItem({ x, y, width, height, shape, rotation = 0 }: ObstacleItemProps) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: x, top: y,
    width, height,
    transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
    zIndex: 20,
  };

  // ── Static GD
  if (shape === "spike")
    return <div style={{...base, filter:"drop-shadow(0 0 6px rgba(255,255,255,0.7))"}}>
      <Spike w={width} h={height}/>
    </div>;

  if (shape === "spike-ceil")
    return <div style={{...base, filter:"drop-shadow(0 0 6px rgba(167,139,250,0.9))"}}>
      <Spike w={width} h={height} flipped/>
    </div>;

  if (shape === "spike-group")
    return <div style={{...base, filter:"drop-shadow(0 0 8px rgba(255,255,255,0.5))"}}>
      <SpikeGroup w={width} h={height}/>
    </div>;

  if (shape === "column")
    return <div style={{...base, filter:"drop-shadow(0 0 14px rgba(167,139,250,0.7))"}}>
      <Column w={width} h={height}/>
    </div>;

  if (shape === "block")
    return <div style={{...base, filter:"drop-shadow(0 0 8px rgba(129,140,248,0.6))"}}>
      <GDBlock w={width} h={height}/>
    </div>;

  // ── Dynamic flying
  if (shape === "circle")
    return <div style={{...base, filter:"drop-shadow(0 0 10px rgba(244,63,94,0.8))"}}>
      <MeteorCircle s={width}/>
    </div>;

  if (shape === "triangle")
    return <div style={{...base, height: width*0.87, filter:"drop-shadow(0 0 10px rgba(244,63,94,0.7))"}}>
      <FlyTriangle s={width} color1="#f43f5e" color2="#7f1d1d"/>
    </div>;

  if (shape === "slider-triangle")
    return <div style={{...base, height: width*0.87, filter:"drop-shadow(0 0 10px rgba(168,85,247,0.8))"}}>
      <FlyTriangle s={width} color1="#a855f7" color2="#4c1d95"/>
    </div>;

  if (shape === "square-spikes")
    return <div style={{...base, overflow:"visible", filter:"drop-shadow(0 0 12px rgba(249,115,22,0.8))"}}>
      <SpikeySquare s={width}/>
    </div>;

  if (shape === "slider-circle")
    return <div style={{...base, filter:"drop-shadow(0 0 12px rgba(34,211,238,0.8))"}}>
      <SliderCircle s={width}/>
    </div>;

  return null;
}