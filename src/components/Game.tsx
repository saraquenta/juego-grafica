"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Moveable from "react-moveable";
import { Play, RotateCcw, ShieldAlert, Trophy } from "lucide-react";
import ObstacleItem, { ObstacleShape } from "./ObstacleItem";

// ─── Types & Constants ────────────────────────────────────────────────────────
interface StaticObstacle { id: number; x: number; y: number; width: number; height: number; shape: ObstacleShape; rotation: number; }
interface DynamicObstacle { id: number; x: number; y: number; width: number; height: number; speedX: number; speedY: number; shape: ObstacleShape; rotation: number; rotationSpeed: number; }

const FLOOR_H = 70;
const SCROLL_SPEED = 4;
const WORLD_WIDTH = 4000;
const MAX_COLLISIONS = 3; 

// ─── Generators ───────────────────────────────────────────────────────────────
function generateStaticObstacles(screenH: number): StaticObstacle[] {
  const obs: StaticObstacle[] = [];
  let id = 0;
  const usableH = screenH - FLOOR_H;

  const blockPositions = [320, 500, 750, 1050, 2300, 2600, 3200];
  blockPositions.forEach((bx) => {
    const bh = 60 + Math.floor(Math.random() * 3) * 60;
    obs.push({ id: id++, x: bx, y: usableH - bh, width: 60, height: bh, shape: "block", rotation: 0 });
  });

  const spikePositions = [250, 600, 900, 1300, 1850, 2350, 2800, 3300];
  spikePositions.forEach((sx) => {
    obs.push({ id: id++, x: sx, y: usableH - 40, width: 40, height: 40, shape: "spike", rotation: 0 });
  });

  // --- PORTALES DE TELETRANSPORTE (Más grandes) ---
  obs.push({ id: 998, x: 1200, y: usableH - 180, width: 100, height: 160, shape: "portal-in", rotation: 0 });
  obs.push({ id: 999, x: 2000, y: usableH - 180, width: 100, height: 160, shape: "portal-out", rotation: 0 });

  // --- PORTAL DE VICTORIA (Gigante, al final del mapa) ---
  obs.push({ id: 1000, x: 3700, y: usableH - 280, width: 160, height: 260, shape: "portal-win", rotation: 0 });

  return obs;
}

function generateDynamicObstacles(screenW: number, screenH: number): DynamicObstacle[] {
  const usableH = screenH - FLOOR_H;
  const dynamicShapes: ObstacleShape[] = ["circle", "triangle", "square-spikes", "slider-triangle", "slider-circle"];

  return Array.from({ length: 6 }).map((_, i) => {
    const shape = dynamicShapes[i % dynamicShapes.length];
    const size = 44 + Math.random() * 24;
    return {
      id: 1000 + i,
      x: Math.random() * (screenW - size),
      y: FLOOR_H + Math.random() * (usableH - size - FLOOR_H),
      width: size, height: size,
      speedX: (Math.random() - 0.5) * 4,
      speedY: (Math.random() - 0.5) * 4,
      shape, rotation: Math.random() * 360, rotationSpeed: (Math.random() - 0.5) * 5,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Game() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false); 
  const [timeLeft, setTimeLeft] = useState(25); // 25s para llegar a la meta
  const [score, setScore] = useState(0);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  
  const [staticObs, setStaticObs] = useState<StaticObstacle[]>([]);
  const [dynamicObs, setDynamicObs] = useState<DynamicObstacle[]>([]);
  const [scrollX, setScrollX] = useState(0);
  const [vipRotation, setVipRotation] = useState(0);

  const targetRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const scrollRef = useRef(0);
  const staticRef = useRef<StaticObstacle[]>([]);
  const dynamicRef = useRef<DynamicObstacle[]>([]);
  const isInvulRef = useRef(false);
  const vipRotRef = useRef(0);
  const prevScoreRef = useRef(0); 

  // ── Audio Handlers
  const playEffect = useCallback((file: string) => {
    const audio = new Audio(`/sounds/${file}`);
    audio.volume = 0.5;
    audio.play().catch((e) => console.warn("Audio bloqueado:", e));
  }, []);

  const playRetroCollisionSound = useCallback(() => {
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

  useEffect(() => { staticRef.current = staticObs; }, [staticObs]);
  useEffect(() => { dynamicRef.current = dynamicObs; }, [dynamicObs]);

  useEffect(() => {
    if (score > prevScoreRef.current) {
      if (score >= MAX_COLLISIONS) {
        setIsGameOver(true); setIsPlaying(false); setHasWon(false);
        playEffect("muerte.mp3"); 
      } else {
        playRetroCollisionSound(); 
      }
    }
    prevScoreRef.current = score;
  }, [score, playEffect, playRetroCollisionSound]);

  const startGame = () => {
    const sw = window.innerWidth, sh = window.innerHeight;
    setIsPlaying(true); setIsGameOver(false); setHasWon(false);
    setTimeLeft(25); setScore(0); prevScoreRef.current = 0;
    setIsInvulnerable(false); setScrollX(0); setVipRotation(0);
    scrollRef.current = 0; vipRotRef.current = 0; isInvulRef.current = false;

    if (targetRef.current) {
        targetRef.current.style.opacity = "1";
        targetRef.current.style.transform = "translate(0px,0px)";
    }

    const s = generateStaticObstacles(sh);
    const d = generateDynamicObstacles(sw, sh);
    setStaticObs(s); setDynamicObs(d);
  };

  const triggerHit = useCallback(() => {
    setScore((s) => s + 1);
    isInvulRef.current = true;
    setIsInvulnerable(true);
    setTimeout(() => { isInvulRef.current = false; setIsInvulnerable(false); }, 1200);
  }, []);

  const gameLoop = useCallback(() => {
    if (!isPlaying || isGameOver || hasWon) return;
    const sw = window.innerWidth, sh = window.innerHeight;
    const usableH = sh - FLOOR_H;

    scrollRef.current += SCROLL_SPEED;
    setScrollX(scrollRef.current);
    vipRotRef.current = (vipRotRef.current + 4) % 360;
    setVipRotation(vipRotRef.current);

    const newDynamic = dynamicRef.current.map((d) => {
      let nx = d.x + d.speedX, ny = d.y + d.speedY;
      let sx = d.speedX, sy = d.speedY;
      if (nx <= 0 || nx + d.width >= sw) { sx *= -1; nx = Math.max(0, Math.min(nx, sw - d.width)); }
      if (ny <= FLOOR_H || ny + d.height >= usableH) { sy *= -1; ny = Math.max(FLOOR_H, Math.min(ny, usableH - d.height)); }
      return { ...d, x: nx, y: ny, speedX: sx, speedY: sy, rotation: (d.rotation + d.rotationSpeed + 360) % 360 };
    });
    
    setDynamicObs(newDynamic);
    dynamicRef.current = newDynamic;

    if (targetRef.current && !isInvulRef.current) {
      const vip = targetRef.current.getBoundingClientRect();

      for (const obs of staticRef.current) {
        const sx = obs.x - scrollRef.current;
        if (sx + obs.width < 0 || sx > sw) continue;

        if (vip.left < sx + obs.width && vip.right > sx &&
            vip.top < obs.y + obs.height && vip.bottom > obs.y) {
          
          // --- PORTAL DE VICTORIA ---
          if (obs.shape === "portal-win") {
             setHasWon(true);
             setIsPlaying(false);
             playEffect("win.mp3");
             break;
          }

          // --- PORTAL DE SALTO ---
          if (obs.shape === "portal-in") {
            const exitPortal = staticRef.current.find(p => p.shape === "portal-out" && p.x > obs.x);
            if (exitPortal) {
              const jumpDistance = (exitPortal.x - obs.x) - 100;
              scrollRef.current += jumpDistance;
              targetRef.current.style.opacity = "0";
              setTimeout(() => { if(targetRef.current) targetRef.current.style.opacity = "1"; }, 150);
              break;
            }
          }

          if (obs.shape !== "portal-out") {
            triggerHit(); break;
          }
        }
      }

      if (!isInvulRef.current) {
        for (const d of newDynamic) {
          if (vip.left < d.x + d.width && vip.right > d.x &&
              vip.top < d.y + d.height && vip.bottom > d.y) {
            triggerHit(); break;
          }
        }
      }
    }

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [isPlaying, isGameOver, hasWon, triggerHit, playEffect]);

  // Lógica de Timer (Ahora es condición de derrota)
  useEffect(() => {
    if (isPlaying && !isGameOver && !hasWon && timeLeft > 0) {
      const t = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { 
            // Si el tiempo llega a 0 y no has tocado el portal dorado
            setIsGameOver(true);
            setIsPlaying(false); 
            playEffect("muerte.mp3"); 
            return 0; 
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [isPlaying, isGameOver, hasWon, timeLeft, playEffect]);

  useEffect(() => {
    if (isPlaying && !isGameOver && !hasWon) frameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, isGameOver, hasWon, gameLoop]);

  const usableH = typeof window !== "undefined" ? window.innerHeight - FLOOR_H : 530;

  return (
    <div className="relative w-full h-screen overflow-hidden z-10 pointer-events-none">
      
      {/* HUD */}
      <div className="absolute top-5 left-6 right-6 flex justify-between items-center z-50">
        <div className="bg-black/40 backdrop-blur-md border border-purple-500/30 px-6 py-3 rounded-2xl shadow-xl flex gap-6 text-white font-bold">
          <div className="flex flex-col items-center">
            <span className="text-xs text-purple-300 uppercase tracking-widest">Tiempo</span>
            <span className={`text-3xl ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-emerald-400"}`}>{timeLeft}s</span>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-purple-300 uppercase tracking-widest">Daño VIP</span>
            <span className={`text-3xl ${score >= 2 ? "text-rose-500 animate-pulse" : "text-amber-400"}`}>{score}/{MAX_COLLISIONS}</span>
          </div>
        </div>
      </div>

      {/* Start / Game Over / Win Screen */}
      {(!isPlaying || isGameOver || hasWon) && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white pointer-events-auto">
          <div className={`bg-[#1a0a3a]/90 border p-10 rounded-3xl shadow-2xl flex flex-col items-center text-center max-w-md w-full transition-colors ${hasWon ? 'border-amber-500/50 shadow-amber-900/50' : 'border-purple-500/40'}`}>
            
            <h1 className={`text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r ${hasWon ? 'from-amber-400 to-yellow-600' : (isGameOver ? 'from-rose-400 to-red-600' : 'from-purple-400 to-indigo-400')}`}>
              {hasWon ? "¡Portal Alcanzado!" : (isGameOver ? "¡Destruido!" : "VIP Guard")}
            </h1>
            
            {hasWon && (
              <div className="mb-8 flex flex-col items-center gap-2">
                <Trophy className="w-16 h-16 text-amber-400" />
                <span className="text-xl text-slate-300 mt-2">Llegaste a la meta con solo</span>
                <span className="text-4xl font-black text-amber-400">{score} daños</span>
              </div>
            )}

            {isGameOver && (
              <div className="mb-8 flex flex-col items-center gap-2">
                 <ShieldAlert className="w-16 h-16 text-rose-500" />
                <span className="text-xl text-slate-300 mt-2">{score >= MAX_COLLISIONS ? "Recibiste demasiado daño" : "Se acabó el tiempo"}</span>
              </div>
            )}

            {!isGameOver && !hasWon && (
               <p className="text-slate-300 mb-8 text-base px-4">
                 Arrastra al VIP para protegerlo. Tienes <strong>3 vidas</strong> y 25 segundos para alcanzar el Portal Dorado.
               </p>
            )}

            <button onClick={startGame} className={`group relative px-8 py-4 transition-all rounded-xl font-bold text-xl flex items-center gap-3 overflow-hidden border ${hasWon ? 'bg-amber-700 hover:bg-amber-600 border-amber-400/30' : 'bg-purple-700 hover:bg-purple-600 border-purple-400/30'}`}>
              <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              {(isGameOver || hasWon) ? <RotateCcw className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              <span>{(isGameOver || hasWon) ? "Jugar de nuevo" : "Comenzar"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Play Area */}
      {isPlaying && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-auto">
          <div className="absolute top-0 left-0 h-full z-10 transition-transform duration-100 ease-linear"
               style={{ width: WORLD_WIDTH, transform: `translateX(${-scrollX}px)`, willChange: "transform" }}>
            {staticObs.map((obs) => <ObstacleItem key={obs.id} {...obs} />)}
          </div>

          <div className="absolute inset-0 z-20 pointer-events-none">
            {dynamicObs.map((d) => <ObstacleItem key={d.id} {...d} />)}
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-30" style={{ height: FLOOR_H }}>
            <div className="w-full h-full bg-gradient-to-b from-[#2d0080] to-[#1a0050] border-t-2 border-purple-400/60" />
          </div>

          <div ref={targetRef} className={`absolute w-16 h-16 z-40 cursor-grab active:cursor-grabbing transition-opacity ${isInvulnerable ? "opacity-40 animate-pulse" : "opacity-100"}`}
               style={{ top: usableH / 2 - 32, left: "22%", transform: `rotate(${vipRotation}deg)`, background: "linear-gradient(135deg,#86efac 0%,#22c55e 50%,#15803d 100%)", borderRadius: "6px" }}>
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-green-300 font-black text-xs tracking-widest uppercase drop-shadow">VIP</span>
          </div>

          <Moveable target={targetRef} draggable={true} origin={false}
            onDrag={({ target, left, top }) => { target.style.left = `${left}px`; target.style.top = `${top}px`; }}
            renderDirections={[]} hideDefaultLines={true}
          />
        </div>
      )}
    </div>
  );
}