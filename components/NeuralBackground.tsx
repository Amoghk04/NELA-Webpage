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

  // Smoothed scroll value for the camera
  const smoothScrollRef = useRef(0);
  // Impulse's own t parameter — walks along the curve incrementally
  const impulseT = useRef(0);
  // Reusable vectors to avoid per-frame allocations (prevents GC stutters)
  const _targetPos = useMemo(() => new THREE.Vector3(), []);
  const _impulsePos = useMemo(() => new THREE.Vector3(), []);

  useFrame((_state, delta) => {
    const rawT = scrollYProgress.get(); // 0 to 1

    // Frame-rate-independent exponential damping for camera scroll
    const damping = 6;
    const factor = 1 - Math.exp(-damping * delta);
    smoothScrollRef.current = THREE.MathUtils.lerp(smoothScrollRef.current, rawT, factor);
    const t = smoothScrollRef.current;

    // --- Impulse: walk along the curve incrementally, never teleport ---
    // Target is slightly ahead of the camera
    const impulseTarget = Math.min(t + 0.05, 1);
    const diff = impulseTarget - impulseT.current;
    // Max step per frame — keeps the impulse tracing the curve even during fast scrolls
    // ~0.3 units/sec along the curve parameter
    const maxStep = 0.3 * delta;
    // Clamp the step so the impulse never jumps more than maxStep along the curve
    const step = Math.sign(diff) * Math.min(Math.abs(diff), maxStep);
    impulseT.current = THREE.MathUtils.clamp(impulseT.current + step, 0, 1);

    if (impulseRef.current) {
      curve.getPoint(impulseT.current, _impulsePos);
      impulseRef.current.position.copy(_impulsePos);
    }

    // Move camera down the path
    if (cameraGroupRef.current) {
      const camPos = curve.getPoint(t);

      // Smoothly interpolate camera position (frame-rate independent)
      _targetPos.set(camPos.x * 0.3, camPos.y, camPos.z + 8);
      cameraGroupRef.current.position.lerp(_targetPos, factor);

      // Add a slight rotation based on scroll for a "dorky" dynamic feel
      cameraGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        cameraGroupRef.current.rotation.z,
        camPos.x * 0.05,
        factor
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
