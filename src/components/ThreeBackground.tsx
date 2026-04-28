"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

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
      radius={100} 
      depth={50} 
      count={5000} 
      factor={4} 
      saturation={0} 
      fade 
      speed={1} 
    />
  );
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <AnimatedStars />
        <ambientLight intensity={0.5} />
      </Canvas>
      {/* Overlay to darken slightly and make UI pop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
    </div>
  );
}
