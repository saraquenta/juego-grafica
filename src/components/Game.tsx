"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Moveable from "react-moveable";
import { Play, RotateCcw } from "lucide-react";
import ObstacleItem, { ObstacleShape } from "./ObstacleItem";

// ─── Types ────────────────────────────────────────────────────────────────────
/** Obstáculo estático: posición en coordenadas del mundo (scrollea con el nivel) */
interface StaticObstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: ObstacleShape;
  rotation: number;
}

/** Obstáculo dinámico: posición en coordenadas de PANTALLA (se mueve solo) */
interface DynamicObstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speedX: number;
  speedY: number;
  shape: ObstacleShape;
  rotation: number;
  rotationSpeed: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const FLOOR_H = 70;
const SCROLL_SPEED = 4;
const WORLD_WIDTH = 4000;

// ─── Level generator (static obstacles) ──────────────────────────────────────
function generateStaticObstacles(screenH: number): StaticObstacle[] {
  const obs: StaticObstacle[] = [];
  let id = 0;
  const usableH = screenH - FLOOR_H;

  const blockPositions = [320, 500, 750, 1050, 1400, 1700, 2000, 2300, 2600, 2900, 3200, 3500];
  blockPositions.forEach((bx) => {
    const bh = 60 + Math.floor(Math.random() * 3) * 60;
    obs.push({ id: id++, x: bx, y: usableH - bh, width: 60, height: bh, shape: "block", rotation: 0 });
  });

  const colPositions = [420, 820, 1150, 1600, 1900, 2200, 2500, 2800, 3100, 3400];
  colPositions.forEach((cx) => {
    const ch = 80 + Math.floor(Math.random() * 3) * 60;
    obs.push({ id: id++, x: cx, y: 0, width: 60, height: ch, shape: "column", rotation: 0 });
  });

  const spikePositions = [250, 460, 600, 680, 900, 1200, 1300, 1450, 1850, 2100, 2350, 2650, 2800, 3050, 3300, 3600, 3800];
  spikePositions.forEach((sx) => {
    obs.push({ id: id++, x: sx, y: usableH - 40, width: 40, height: 40, shape: "spike", rotation: 0 });
  });

  const groupPositions = [370, 700, 1100, 1550, 2000, 2450, 3000, 3550];
  groupPositions.forEach((gx) => {
    obs.push({ id: id++, x: gx, y: usableH - 40, width: 120, height: 40, shape: "spike-group", rotation: 0 });
  });

  const ceilPositions = [550, 950, 1250, 1700, 2100, 2500, 2900, 3300];
  ceilPositions.forEach((cx) => {
    obs.push({ id: id++, x: cx, y: 0, width: 40, height: 40, shape: "spike-ceil", rotation: 0 });
  });

  return obs;
}

/** Genera obstáculos dinámicos en coordenadas de pantalla */
function generateDynamicObstacles(screenW: number, screenH: number): DynamicObstacle[] {
  const usableH = screenH - FLOOR_H;
  const dynamicShapes: ObstacleShape[] = ["circle", "triangle", "square-spikes", "slider-triangle", "slider-circle"];

  return Array.from({ length: 8 }).map((_, i) => {
    const shape = dynamicShapes[i % dynamicShapes.length];
    const size = 44 + Math.random() * 24;
    // Sliders vienen desde un borde
    const isSlider = i >= 5;
    const fromRight = i % 2 === 0;
    return {
      id: 1000 + i,
      x: isSlider ? (fromRight ? screenW + size : -size) : Math.random() * (screenW - size),
      y: isSlider
        ? FLOOR_H + Math.random() * (usableH - size - FLOOR_H)
        : FLOOR_H + Math.random() * (usableH - size - FLOOR_H),
      width: size,
      height: size,
      speedX: isSlider
        ? (fromRight ? -(2.5 + Math.random() * 2) : (2.5 + Math.random() * 2))
        : (Math.random() - 0.5) * 4,
      speedY: isSlider ? (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 4,
      shape,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 5,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Game() {
  const [isPlaying, setIsPlaying]         = useState(false);
  const [isGameOver, setIsGameOver]       = useState(false);
  const [timeLeft, setTimeLeft]           = useState(30);
  const [score, setScore]                 = useState(0);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [staticObs, setStaticObs]         = useState<StaticObstacle[]>([]);
  const [dynamicObs, setDynamicObs]       = useState<DynamicObstacle[]>([]);
  const [scrollX, setScrollX]             = useState(0);
  const [vipRotation, setVipRotation]     = useState(0);

  const targetRef         = useRef<HTMLDivElement>(null);
  const frameRef          = useRef<number>(0);
  const scrollRef         = useRef(0);
  const staticRef         = useRef<StaticObstacle[]>([]);
  const dynamicRef        = useRef<DynamicObstacle[]>([]);
  const isInvulRef        = useRef(false);
  const vipRotRef         = useRef(0);

  useEffect(() => { staticRef.current  = staticObs;  }, [staticObs]);
  useEffect(() => { dynamicRef.current = dynamicObs; }, [dynamicObs]);
  useEffect(() => { isInvulRef.current = isInvulnerable; }, [isInvulnerable]);

  const playCollisionSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.25);
    } catch (_) {}
  }, []);

  const startGame = () => {
    const sw = window.innerWidth, sh = window.innerHeight;
    setIsPlaying(true); setIsGameOver(false);
    setTimeLeft(30); setScore(0);
    setIsInvulnerable(false); setScrollX(0); setVipRotation(0);
    scrollRef.current = 0; vipRotRef.current = 0; isInvulRef.current = false;

    if (targetRef.current) targetRef.current.style.transform = "translate(0px,0px)";

    const s = generateStaticObstacles(sh);
    const d = generateDynamicObstacles(sw, sh);
    setStaticObs(s); staticRef.current = s;
    setDynamicObs(d); dynamicRef.current = d;
  };

  const triggerHit = useCallback(() => {
    setScore((s) => s + 1);
    isInvulRef.current = true;
    setIsInvulnerable(true);
    playCollisionSound();
    setTimeout(() => { isInvulRef.current = false; setIsInvulnerable(false); }, 1200);
  }, [playCollisionSound]);

  const gameLoop = useCallback(() => {
    if (!isPlaying || isGameOver) return;

    const sw = window.innerWidth, sh = window.innerHeight;
    const usableH = sh - FLOOR_H;

    // ── Scroll
    scrollRef.current += SCROLL_SPEED;
    setScrollX(scrollRef.current);

    // ── VIP rotation
    vipRotRef.current = (vipRotRef.current + 4) % 360;
    setVipRotation(vipRotRef.current);

    // ── Move dynamic obstacles (screen coords)
    const newDynamic = dynamicRef.current.map((d) => {
      let nx = d.x + d.speedX;
      let ny = d.y + d.speedY;
      let sx = d.speedX, sy = d.speedY;

      if (d.speedX !== 0 && Math.abs(d.speedX) < 3.5) {
        // Bouncer: rebota en bordes
        if (nx <= 0 || nx + d.width >= sw) { sx *= -1; nx = Math.max(0, Math.min(nx, sw - d.width)); }
        if (ny <= FLOOR_H || ny + d.height >= usableH) { sy *= -1; ny = Math.max(FLOOR_H, Math.min(ny, usableH - d.height)); }
      } else {
        // Slider: reaparece por el lado opuesto
        if (nx > sw + 80)  nx = -d.width - 10;
        if (nx < -d.width - 80) nx = sw + 10;
        if (ny > usableH + 80) ny = FLOOR_H - d.height - 10;
        if (ny < FLOOR_H - 80) ny = usableH + 10;
      }

      return { ...d, x: nx, y: ny, speedX: sx, speedY: sy, rotation: (d.rotation + d.rotationSpeed + 360) % 360 };
    });
    setDynamicObs(newDynamic);
    dynamicRef.current = newDynamic;

    // ── Collision detection
    if (targetRef.current && !isInvulRef.current) {
      const vip = targetRef.current.getBoundingClientRect();

      // vs static (world coords → screen)
      for (const obs of staticRef.current) {
        const sx = obs.x - scrollRef.current;
        if (sx + obs.width < 0 || sx > sw) continue; // fuera de pantalla
        if (vip.left < sx + obs.width && vip.right > sx &&
            vip.top  < obs.y + obs.height && vip.bottom > obs.y) {
          triggerHit(); break;
        }
      }

      // vs dynamic (screen coords)
      if (!isInvulRef.current) {
        for (const d of newDynamic) {
          if (vip.left < d.x + d.width && vip.right > d.x &&
              vip.top  < d.y + d.height && vip.bottom > d.y) {
            triggerHit(); break;
          }
        }
      }
    }

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, isGameOver, triggerHit]);

  useEffect(() => {
    if (isPlaying && !isGameOver) frameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, isGameOver, gameLoop]);

  useEffect(() => {
    if (isPlaying && !isGameOver && timeLeft > 0) {
      const t = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { setIsGameOver(true); setIsPlaying(false); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [isPlaying, isGameOver, timeLeft]);

  const usableH = typeof window !== "undefined" ? window.innerHeight - FLOOR_H : 530;

  return (
    <div className="relative w-full h-screen overflow-hidden z-10">

      {/* HUD */}
      <div className="absolute top-5 left-6 right-6 flex justify-between items-center z-50 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md border border-purple-500/30 px-6 py-3 rounded-2xl shadow-xl flex gap-6 text-white font-bold">
          <div className="flex flex-col items-center">
            <span className="text-xs text-purple-300 uppercase tracking-widest">Tiempo</span>
            <span className={`text-3xl ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>{timeLeft}s</span>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-purple-300 uppercase tracking-widest">Colisiones</span>
            <span className="text-3xl text-rose-400">{score}</span>
          </div>
        </div>
        {/* Leyenda */}
        <div className="bg-black/30 backdrop-blur-md border border-purple-500/20 px-4 py-2 rounded-xl text-purple-300 text-xs font-medium">
          ⬆ Arrastra el VIP para esquivar
        </div>
      </div>

      {/* Start / Game Over */}
      {(!isPlaying || isGameOver) && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
          <div className="bg-[#1a0a3a]/90 border border-purple-500/40 p-10 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-md w-full">
            <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
              {isGameOver ? "¡Game Over!" : "VIP Guard"}
            </h1>
            {isGameOver && (
              <div className="mb-8 flex flex-col items-center gap-1">
                <span className="text-xl text-slate-300">Colisiones totales</span>
                <span className="text-6xl font-black text-rose-500">{score}</span>
              </div>
            )}
            {!isGameOver && (
              <p className="text-slate-300 mb-8 text-base">
                Esquiva pinchos, columnas, bloques <strong>y</strong> figuras voladoras. ¡30 segundos!
              </p>
            )}
            <button
              onClick={startGame}
              className="group relative px-8 py-4 bg-purple-700 hover:bg-purple-600 transition-all rounded-xl font-bold text-xl flex items-center gap-3 overflow-hidden border border-purple-400/30"
            >
              <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              {isGameOver ? <RotateCcw className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              <span>{isGameOver ? "Reiniciar" : "Jugar"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Play Area */}
      {isPlaying && (
        <div className="absolute inset-0 w-full h-full overflow-hidden">

          {/* Fondo GD */}
          <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(180deg,#1a0050 0%,#2d0080 60%,#3b0099 100%)" }}>
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.18 }}>
              <defs>
                <pattern id="gdgrid" x={-(scrollX % 60)} y={0} width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#a78bfa" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#gdgrid)" />
            </svg>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="absolute h-px bg-purple-400/15" style={{ top: `${12 + i * 16}%`, left: 0, right: 0 }} />
            ))}
          </div>

          {/* ── Mundo estático (scrollea con el nivel) ── */}
          <div
            className="absolute top-0 left-0 h-full z-10"
            style={{ width: WORLD_WIDTH, transform: `translateX(${-scrollX}px)`, willChange: "transform" }}
          >
            {staticObs.map((obs) => (
              <ObstacleItem key={obs.id} {...obs} />
            ))}
          </div>

          {/* ── Obstáculos dinámicos (coords de pantalla, z encima del mundo) ── */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {dynamicObs.map((d) => (
              <ObstacleItem key={d.id} {...d} />
            ))}
          </div>

          {/* Suelo */}
          <div className="absolute bottom-0 left-0 right-0 z-30" style={{ height: FLOOR_H }}>
            <div className="w-full h-full bg-gradient-to-b from-[#2d0080] to-[#1a0050] border-t-2 border-purple-400/60 relative overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
                <defs>
                  <pattern id="floorGrid" x={-(scrollX % 60)} y={0} width="60" height="60" patternUnits="userSpaceOnUse">
                    <rect width="60" height="60" fill="none" stroke="#a78bfa" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#floorGrid)" />
              </svg>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.9)]" />
            </div>
          </div>

          {/* VIP Box */}
          <div
            ref={targetRef}
            className={`absolute w-16 h-16 z-40 cursor-grab active:cursor-grabbing transition-opacity ${
              isInvulnerable ? "opacity-40 animate-pulse" : "opacity-100"
            }`}
            style={{
              top: usableH / 2 - 32,
              left: "22%",
              transform: `rotate(${vipRotation}deg)`,
              background: "linear-gradient(135deg,#86efac 0%,#22c55e 50%,#15803d 100%)",
              border: "3px solid rgba(255,255,255,0.5)",
              borderRadius: "6px",
              boxShadow: isInvulnerable
                ? "0 0 20px rgba(239,68,68,0.9)"
                : "0 0 20px rgba(34,197,94,0.7),inset 0 0 10px rgba(255,255,255,0.2)",
            }}
          >
            <div className="absolute inset-1.5 border-2 border-white/40 rounded-sm" />
            <div className="absolute inset-3 border border-white/20 rounded-sm" />
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-green-300 font-black text-xs tracking-widest uppercase drop-shadow">VIP</span>
          </div>

          <Moveable
            target={targetRef}
            draggable={true}
            origin={false}
            onDrag={({ target, left, top }) => {
              target.style.left = `${left}px`;
              target.style.top  = `${top}px`;
            }}
            renderDirections={[]}
            hideDefaultLines={true}
          />
        </div>
      )}
    </div>
  );
}