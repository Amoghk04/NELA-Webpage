'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, PerspectiveCamera, Stars, Trail } from '@react-three/drei';
import * as THREE from 'three';
import { MotionValue } from 'motion/react';

function Scene({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  // Create a long, curvy path for the neural circuit
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(-4, 5, -2),
      new THREE.Vector3(5, 0, -4),
      new THREE.Vector3(-3, -5, -1),
      new THREE.Vector3(6, -10, -5),
      new THREE.Vector3(-5, -15, -2),
      new THREE.Vector3(4, -20, -6),
      new THREE.Vector3(-2, -25, -3),
      new THREE.Vector3(0, -30, 0),
    ]);
  }, []);

  const points = useMemo(() => curve.getPoints(300), [curve]);
  const impulseRef = useRef<THREE.Mesh>(null);
  const cameraGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = scrollYProgress.get(); // 0 to 1
    
    // Move impulse slightly ahead of the camera
    if (impulseRef.current) {
      const impulsePos = curve.getPoint(Math.min(t + 0.05, 1));
      impulseRef.current.position.copy(impulsePos);
    }

    // Move camera down the path
    if (cameraGroupRef.current) {
      const camPos = curve.getPoint(t);
      
      // Smoothly interpolate camera position
      cameraGroupRef.current.position.lerp(
        new THREE.Vector3(camPos.x * 0.3, camPos.y, camPos.z + 8), 
        0.05
      );
      
      // Add a slight rotation based on scroll for a "dorky" dynamic feel
      cameraGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        cameraGroupRef.current.rotation.z,
        (camPos.x * 0.05),
        0.05
      );
    }
  });

  // Generate deterministic dendrites branching off the main axon
  const dendrites = useMemo(() => {
    const branches = [];
    for (let i = 0; i < points.length; i += 15) {
      const p = points[i];
      // Simple deterministic pseudo-random based on index
      const pseudoRandom = (seed: number) => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
      };
      
      const branchEnd = new THREE.Vector3(
        p.x + (pseudoRandom(i) - 0.5) * 10,
        p.y + (pseudoRandom(i + 1) - 0.5) * 5,
        p.z + (pseudoRandom(i + 2) - 0.5) * 10
      );
      branches.push({ start: p, end: branchEnd });
    }
    return branches;
  }, [points]);

  return (
    <>
      <group ref={cameraGroupRef}>
        <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={60} />
      </group>

      {/* Main Axon */}
      <Line points={points} color="#00ffcc" lineWidth={3} transparent opacity={0.3} />
      
      {/* Branches (Dendrites) */}
      {dendrites.map((branch, i) => (
        <group key={i}>
          <Line points={[branch.start, branch.end]} color="#ec4899" lineWidth={1} transparent opacity={0.15} />
          <mesh position={branch.end}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color="#ec4899" transparent opacity={0.4} />
          </mesh>
        </group>
      ))}

      {/* The Impulse */}
      <Trail width={3} color="#00ffcc" length={15} decay={1} local={false}>
        <mesh ref={impulseRef}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
          <pointLight color="#00ffcc" intensity={8} distance={15} />
        </mesh>
      </Trail>
    </>
  );
}

export default function NeuralBackground({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas>
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 20]} />
        <ambientLight intensity={0.2} />
        <Stars radius={100} depth={50} count={4000} factor={4} saturation={1} fade speed={1} />
        <Scene scrollYProgress={scrollYProgress} />
      </Canvas>
    </div>
  );
}
