'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, PerspectiveCamera, Stars } from '@react-three/drei';
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
  // Impulse uses its own smooth damping — separate from camera for natural feel
  const smoothImpulseT = useRef(0);
  // Reusable vectors to avoid per-frame allocations (prevents GC stutters)
  const _targetPos = useMemo(() => new THREE.Vector3(), []);
  const _impulsePos = useMemo(() => new THREE.Vector3(), []);

  // Custom curve-based trail (replaces Trail which glitches on direction reversal)
  const trailLineRef = useRef<any>(null);
  const trailSegments = 60;
  const trailSpan = 0.07; // how far behind on the curve the trail extends
  const _tp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_state, delta) => {
    // Clamp delta to avoid huge jumps when the tab loses focus
    const dt = Math.min(delta, 0.05);
    const rawT = scrollYProgress.get(); // 0 to 1

    // Frame-rate-independent exponential damping for camera scroll
    const camDamping = 6;
    const camFactor = 1 - Math.exp(-camDamping * dt);
    smoothScrollRef.current = THREE.MathUtils.lerp(smoothScrollRef.current, rawT, camFactor);
    const t = smoothScrollRef.current;

    // --- Impulse: smooth exponential damping (no step-clamping) ---
    // Higher damping = more responsive to scroll; lower = more floaty/smooth
    const impulseDamping = 4;
    const impulseFactor = 1 - Math.exp(-impulseDamping * dt);
    const impulseTarget = Math.min(t + 0.05, 1);
    smoothImpulseT.current = THREE.MathUtils.lerp(smoothImpulseT.current, impulseTarget, impulseFactor);

    if (impulseRef.current) {
      curve.getPoint(smoothImpulseT.current, _impulsePos);
      impulseRef.current.position.copy(_impulsePos);
    }

    // --- Update curve-based trail: sample points on the curve behind the impulse ---
    if (trailLineRef.current) {
      const headT = smoothImpulseT.current;
      const tailT = Math.max(headT - trailSpan, 0);
      const positions = new Float32Array(trailSegments * 3);
      const colors = new Float32Array(trailSegments * 3);

      for (let i = 0; i < trailSegments; i++) {
        const frac = i / (trailSegments - 1); // 0 = tail, 1 = head
        const curveT = THREE.MathUtils.lerp(tailT, headT, frac);
        curve.getPoint(curveT, _tp);
        positions[i * 3]     = _tp.x;
        positions[i * 3 + 1] = _tp.y;
        positions[i * 3 + 2] = _tp.z;

        // Fade: transparent at tail → bright #00ffcc at head (quadratic ease)
        const intensity = frac * frac;
        colors[i * 3]     = 0;
        colors[i * 3 + 1] = intensity;
        colors[i * 3 + 2] = intensity * 0.8;
      }

      trailLineRef.current.geometry.setPositions(positions);
      trailLineRef.current.geometry.setColors(colors);
    }

    // Move camera down the path
    if (cameraGroupRef.current) {
      const camPos = curve.getPoint(t);

      // Smoothly interpolate camera position (frame-rate independent)
      _targetPos.set(camPos.x * 0.3, camPos.y, camPos.z + 8);
      cameraGroupRef.current.position.lerp(_targetPos, camFactor);

      // Add a slight rotation based on scroll for a "dorky" dynamic feel
      cameraGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        cameraGroupRef.current.rotation.z,
        camPos.x * 0.05,
        camFactor
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

      {/* Custom curve-sampled trail — always follows the curve, never glitches */}
      <Line
        ref={trailLineRef}
        points={Array.from({ length: trailSegments }, () => [0, 0, 0] as [number, number, number])}
        vertexColors={Array.from({ length: trailSegments }, () => [0, 0, 0] as [number, number, number])}
        lineWidth={8}
        transparent
        opacity={0.9}
      />

      {/* The Impulse head */}
      <mesh ref={impulseRef}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
        <pointLight color="#00ffcc" intensity={8} distance={15} />
      </mesh>
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
