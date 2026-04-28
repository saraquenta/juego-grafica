"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Volume2, VolumeX } from 'lucide-react';

function AnimatedStars() {
  const starsRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0002;
      starsRef.current.rotation.x += 0.0001;
    }
  });

  return (
    <Stars 
      ref={starsRef}
      radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} 
    />
  );
}

export default function ThreeBackground() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio("/sounds/menu.mp3");
    audio.loop = true;
    audio.volume = 0.3;
    audioRef.current = audio;

    const playAudio = () => { audio.play().catch(() => console.log("Autoplay bloqueado.")); };
    playAudio();

    return () => { audio.pause(); audioRef.current = null; };
  }, []);

  const toggleMute = () => {
    if (audioRef.current) {
      const nextMute = !isMuted;
      audioRef.current.muted = nextMute;
      setIsMuted(nextMute);
      if (audioRef.current.paused) audioRef.current.play();
    }
  };

  return (
    <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <AnimatedStars />
        <ambientLight intensity={0.5} />
      </Canvas>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
      
      <button 
        onClick={toggleMute}
        className="absolute bottom-6 right-6 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all text-white/70 hover:text-white"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>
    </div>
  );
}