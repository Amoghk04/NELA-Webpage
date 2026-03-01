'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MotionValue } from 'motion/react';
import { useTheme } from './ThemeProvider';

const THEME_COLORS = {
  dark: {
    bg: '#06061a',
    fogColor: '#06061a',
    fogNear: 8, fogFar: 35,
    accent: '#00ffcc',
    axonOpacity: 0.3,
    ambientIntensity: 0.15,
    showStars: true,
    particleColor: '#7dd3fc',
    particleOpacity: 0.18,
    geoColor: '#00ffcc',
    geoOpacity: 0.035,
    nebulaColor1: '#1e1b4b',
    nebulaColor2: '#164e63',
    nebulaColor3: '#0c4a6e',
  },
  light: {
    bg: '#f0f4f8',
    fogColor: '#f0f4f8',
    fogNear: 60, fogFar: 120,
    accent: '#00b894',
    axonOpacity: 0.35,
    ambientIntensity: 0.6,
    showStars: false,
    particleColor: '#059669',
    particleOpacity: 0.35,
    geoColor: '#059669',
    geoOpacity: 0.12,
    nebulaColor1: '#93c5fd',
    nebulaColor2: '#6ee7b7',
    nebulaColor3: '#c4b5fd',
  },
} as const;

type TC = (typeof THEME_COLORS)[keyof typeof THEME_COLORS];

/* ────────────────── Floating particle field (replaces Stars) ────────────────── */

function FloatingParticles({ count = 120, tc, isLightMode = false }: { count?: number; tc: TC; isLightMode?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // In light mode, massively reduce particle count to fix performance
  const actualCount = isLightMode ? 25 : count;
  const scaleMultiplier = isLightMode ? 4.0 : 1.5;

  const particles = useMemo(() => {
    const pr = (seed: number) => {
      const x = Math.sin(seed * 127.1 + seed * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: actualCount }, (_, i) => ({
      pos: new THREE.Vector3(
        (pr(i * 3) - 0.5) * (isLightMode ? 60 : 100),
        (pr(i * 3 + 1) - 0.5) * (isLightMode ? 80 : 100),
        (pr(i * 3 + 2) - 0.5) * (isLightMode ? 25 : 50) - (isLightMode ? 5 : 15),
      ),
      scale: (pr(i * 7) * 0.12 + 0.015) * scaleMultiplier,
      speed: pr(i * 11) * 0.25 + 0.08,
      phase: pr(i * 13) * Math.PI * 2,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualCount, isLightMode]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      dummy.position.set(
        p.pos.x + Math.sin(t * p.speed + p.phase) * 0.6,
        p.pos.y + Math.cos(t * p.speed * 0.6 + p.phase) * 0.4,
        p.pos.z + Math.sin(t * p.speed * 0.3 + p.phase * 1.7) * 0.3,
      );
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, actualCount]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={tc.particleColor} transparent opacity={tc.particleOpacity} />
    </instancedMesh>
  );
}

/* ────────────────── Wireframe geometric shapes floating in space ────────────── */

const GEO_DEFS = [
  { pos: [-12, 8, -18] as const, geo: 'icosa', scale: 2.5, rotSpeed: [0.08, 0.12, 0.05] },
  { pos: [14, -6, -22] as const, geo: 'octa', scale: 2, rotSpeed: [0.06, 0.09, 0.11] },
  { pos: [-8, -18, -14] as const, geo: 'icosa', scale: 3, rotSpeed: [0.1, 0.07, 0.04] },
  { pos: [10, 15, -20] as const, geo: 'dodeca', scale: 2.5, rotSpeed: [0.05, 0.14, 0.08] },
] as const;

function AmbientGeo({ tc, zOffset = 0, isLightMode = false }: { tc: TC; zOffset?: number; isLightMode?: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  // In light mode, only render 2 geometric shapes instead of 4 to save draw calls
  const activeGeoDefs = isLightMode ? GEO_DEFS.slice(0, 2) : GEO_DEFS;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    activeGeoDefs.forEach((def, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.rotation.x = t * def.rotSpeed[0];
      m.rotation.y = t * def.rotSpeed[1];
      m.rotation.z = t * def.rotSpeed[2];
    });
  });

  return (
    <>
      {activeGeoDefs.map((def, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={[def.pos[0], def.pos[1], def.pos[2] + zOffset]}
          scale={def.scale}
        >
          {def.geo === 'icosa' && <icosahedronGeometry args={[1, 0]} />}
          {def.geo === 'octa' && <octahedronGeometry args={[1, 0]} />}
          {def.geo === 'dodeca' && <dodecahedronGeometry args={[1, 0]} />}
          <meshBasicMaterial color={tc.geoColor} wireframe transparent opacity={tc.geoOpacity} />
        </mesh>
      ))}
    </>
  );
}

/* ────────────────── Nebula clouds — soft depth blobs (dark mode) ────────────── */

function NebulaClouds({ tc }: { tc: TC }) {
  const group = useRef<THREE.Group>(null);

  const colors3 = [tc.nebulaColor1, tc.nebulaColor2, tc.nebulaColor3];

  const clouds = useMemo(() => {
    const pr = (seed: number) => {
      const x = Math.sin(seed * 93.7 + seed * 271.3) * 34519.31;
      return x - Math.floor(x);
    };
    return Array.from({ length: 6 }, (_, i) => ({
      pos: new THREE.Vector3(
        (pr(i * 5) - 0.5) * 60,
        (pr(i * 5 + 1) - 0.5) * 80,
        -20 - pr(i * 5 + 2) * 20,
      ),
      scale: pr(i * 5 + 3) * 6 + 3,
      color: colors3[i % 3],
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tc.nebulaColor1, tc.nebulaColor2, tc.nebulaColor3]);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    group.current.children.forEach((child, i) => {
      child.position.x = clouds[i].pos.x + Math.sin(t * 0.04 + i) * 1.5;
      child.position.y = clouds[i].pos.y + Math.cos(t * 0.03 + i * 0.7) * 1.0;
    });
  });

  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <mesh key={i} position={c.pos}>
          <sphereGeometry args={[c.scale, 16, 16]} />
          <meshBasicMaterial color={c.color} transparent opacity={0.08} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ──────────── Static Minimalist Art (For Light Mode) ───────────── */

function StaticLightModeArt({ tc }: { tc: TC }) {
  // Purely static, completely passive artistic elements
  return (
    <group position={[0, -5, -15]}>
      {/* Massive soft glowing background sphere */}
      <mesh position={[15, 10, -30]}>
        <sphereGeometry args={[25, 64, 64]} />
        <meshBasicMaterial color={tc.nebulaColor2} transparent opacity={0.06} />
      </mesh>

      {/* Elegant thin, structural rings */}
      <mesh position={[-10, 8, -5]} rotation={[0.4, 0.2, 0]}>
        <torusGeometry args={[12, 0.03, 16, 100]} />
        <meshBasicMaterial color={tc.accent} transparent opacity={0.3} />
      </mesh>
      
      <mesh position={[12, -15, -10]} rotation={[-0.3, 0.1, 0]}>
        <torusGeometry args={[18, 0.02, 16, 100]} />
        <meshBasicMaterial color={tc.nebulaColor1} transparent opacity={0.4} />
      </mesh>

      {/* Solid geometric primitive standing tall */}
      <mesh position={[-12, -18, -20]} rotation={[Math.PI / 4, Math.PI / 5, 0]}>
        <octahedronGeometry args={[8]} />
        <meshBasicMaterial color={tc.nebulaColor3} transparent opacity={0.08} wireframe />
      </mesh>

      {/* Thin structural diagonal lines */}
      <mesh position={[0, 0, -8]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.015, 0.015, 60, 8]} />
        <meshBasicMaterial color={tc.accent} transparent opacity={0.15} />
      </mesh>

      <mesh position={[-5, -10, -12]} rotation={[0, 0, Math.PI / 3]}>
        <cylinderGeometry args={[0.01, 0.01, 50, 8]} />
        <meshBasicMaterial color={tc.nebulaColor2} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function Scene({ scrollYProgress, tc }: { scrollYProgress: MotionValue<number>; tc: TC }) {
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
  const trailSegments = 25;
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

  return (
    <>
      <group ref={cameraGroupRef}>
        <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={60} />
      </group>

      {/* Main Axon */}
      <Line points={points} color={tc.accent} lineWidth={3} transparent opacity={tc.axonOpacity} />

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
        <meshBasicMaterial color={tc.showStars ? '#ffffff' : '#000000'} />
        <pointLight color={tc.accent} intensity={8} distance={15} />
      </mesh>
    </>
  );
}

export default function NeuralBackground({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const { theme } = useTheme();
  const tc = THEME_COLORS[theme];

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas dpr={[1, 1.5]} performance={{ min: 0.5 }}>
        <color attach="background" args={[tc.bg]} />
        <ambientLight intensity={tc.ambientIntensity} />

        {/* Stars — dark mode only */}
        {tc.showStars && <Stars radius={100} depth={50} count={1200} factor={6} saturation={1} fade speed={1} />}

        {/* Atmospheric layers */}
        {tc.showStars && (
          <>
            <NebulaClouds tc={tc} />
            <FloatingParticles tc={tc} isLightMode={!tc.showStars} />
            <AmbientGeo tc={tc} zOffset={0} isLightMode={!tc.showStars} />
          </>
        )}

        {/* Minimalist Light Mode Art */}
        {!tc.showStars && <StaticLightModeArt tc={tc} />}

        {/* Neural impulse scene */}
        <Scene scrollYProgress={scrollYProgress} tc={tc} />
      </Canvas>
    </div>
  );
}
