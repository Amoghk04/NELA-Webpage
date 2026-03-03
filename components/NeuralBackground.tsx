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
    bg: '#f5f0e8',
    fogColor: '#f5f0e8',
    fogNear: 60, fogFar: 120,
    accent: '#4f46e5',
    axonOpacity: 0.45,
    ambientIntensity: 0.55,
    showStars: false,
    particleColor: '#4338ca',
    particleOpacity: 0.35,
    geoColor: '#6366f1',
    geoOpacity: 0.15,
    nebulaColor1: '#c7d2fe',
    nebulaColor2: '#ddd6fe',
    nebulaColor3: '#e0e7ff',
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

/* ────────────────── 3D Holographic Earth Globe ────────────────── */

const EARTH_RADIUS = 4;
const EARTH_CENTER: [number, number, number] = [0, -34, -2];

function EarthGlobe({ tc, scrollYProgress }: { tc: TC; scrollYProgress: MotionValue<number> }) {
  const innerRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const mergeGlowRef = useRef<THREE.PointLight>(null);
  const energyRingsRef = useRef<(THREE.Mesh | null)[]>([]);

  const isLightMode = !tc.showStars;

  // Fibonacci-distributed surface dots with noise-based "continent" clusters
  const dotsGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions: number[] = [];
    const count = isLightMode ? 1500 : 2000;

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      // Simple multi-octave noise to form cluster patterns
      const n =
        Math.sin(x * 5 + 1) * Math.cos(y * 3 + z * 4) +
        Math.sin(y * 7) * Math.cos(z * 5 + x * 3) * 0.5;

      if (n > 0.1) {
        const r = EARTH_RADIUS * 1.005;
        positions.push(x * r, y * r, z * r);
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    return geo;
  }, [isLightMode]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const scroll = scrollYProgress.get();
    const proximity = Math.max(0, (scroll - 0.6) / 0.4); // 0 at 60% scroll, 1 at 100%

    // Gentle rotation
    if (innerRef.current) {
      innerRef.current.rotation.y = t * 0.08;
    }

    // Atmosphere glow — pulses brighter as impulse approaches
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      const pulse = 1 + Math.sin(t * 3) * 0.2 * proximity;
      mat.opacity = 0.08 + proximity * 0.2 * pulse;
      glowRef.current.scale.setScalar(1 + proximity * 0.12);
    }

    // Merge point light intensity
    if (mergeGlowRef.current) {
      mergeGlowRef.current.intensity = proximity * 30 * (1 + Math.sin(t * 4) * 0.25);
    }

    // Energy rings sweeping from top to bottom across the sphere
    const mergeProximity = Math.max(0, (scroll - 0.75) / 0.25);
    energyRingsRef.current.forEach((ring, i) => {
      if (!ring) return;
      const wave = ((t * 0.4 + i * 0.33) % 1);
      const lat = wave * Math.PI;
      const r = EARTH_RADIUS * Math.sin(lat);
      const y = EARTH_RADIUS * Math.cos(lat);

      ring.position.y = y;
      ring.scale.setScalar(Math.max(r, 0.01));
      ring.visible = r > 0.1;

      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = mergeProximity * 0.9 * (1 - wave * 0.5);
    });
  });

  const latitudes = isLightMode ? [-60, -30, 0, 30, 60] : [-60, -30, 0, 30, 60];
  const longitudes = isLightMode ? [0, 30, 60, 90, 120, 150] : [0, 30, 60, 90, 120, 150];

  return (
    <group position={EARTH_CENTER}>
      <group ref={innerRef}>
        {/* Core sphere — visible tinted fill */}
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
          <meshStandardMaterial
            color={isLightMode ? '#312e81' : tc.accent}
            transparent
            opacity={isLightMode ? 0.18 : 0.15}
            emissive={isLightMode ? '#4f46e5' : tc.accent}
            emissiveIntensity={isLightMode ? 0.5 : 0.4}
          />
        </mesh>

        {/* Wireframe overlay */}
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS * 1.001, 24, 24]} />
          <meshBasicMaterial color={isLightMode ? '#4338ca' : tc.accent} wireframe transparent opacity={isLightMode ? 0.35 : 0.22} />
        </mesh>

        {/* Latitude rings */}
        {latitudes.map((lat) => {
          const phi = (90 - lat) * (Math.PI / 180);
          const r = EARTH_RADIUS * Math.sin(phi);
          const y = EARTH_RADIUS * Math.cos(phi);
          return (
            <mesh key={`lat-${lat}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[r, isLightMode ? 0.04 : 0.03, 8, 128]} />
              <meshBasicMaterial color={isLightMode ? '#6366f1' : tc.accent} transparent opacity={isLightMode ? 0.5 : 0.4} />
            </mesh>
          );
        })}

        {/* Longitude rings */}
        {longitudes.map((lon) => (
          <mesh key={`lon-${lon}`} rotation={[0, (lon * Math.PI) / 180, 0]}>
            <torusGeometry args={[EARTH_RADIUS, isLightMode ? 0.04 : 0.03, 8, 128]} />
            <meshBasicMaterial color={isLightMode ? '#6366f1' : tc.accent} transparent opacity={isLightMode ? 0.5 : 0.4} />
          </mesh>
        ))}

        {/* Surface data dots — digital "continent" clusters */}
        <points geometry={dotsGeo}>
          <pointsMaterial
            color={isLightMode ? '#4338ca' : tc.accent}
            size={isLightMode ? 0.12 : 0.1}
            transparent
            opacity={isLightMode ? 0.85 : 0.8}
            sizeAttenuation
          />
        </points>
      </group>

      {/* Atmosphere glow — outer back-face sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[EARTH_RADIUS * 1.25, 64, 64]} />
        <meshBasicMaterial
          color={isLightMode ? '#818cf8' : tc.accent}
          transparent
          opacity={isLightMode ? 0.12 : 0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Constant ambient light inside globe for baseline visibility */}
      <pointLight color={tc.accent} intensity={isLightMode ? 8 : 5} distance={EARTH_RADIUS * 4} position={[0, 0, 0]} />

      {/* Merge point light — illuminates the top of the Earth on arrival */}
      <pointLight
        ref={mergeGlowRef}
        color={tc.accent}
        intensity={0}
        distance={25}
        position={[0, EARTH_RADIUS + 0.5, 0]}
      />

      {/* Energy rings — pulse from merge point across the globe */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`ering-${i}`}
          ref={(el) => {
            energyRingsRef.current[i] = el;
          }}
          position={[0, EARTH_RADIUS, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[1, 0.03, 8, 64]} />
          <meshBasicMaterial color={tc.accent} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ scrollYProgress, tc }: { scrollYProgress: MotionValue<number>; tc: TC }) {
  // Create a long, curvy path for the neural circuit — ends at the top of the Earth
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
      new THREE.Vector3(0, -30, -2),  // meets the top of the Earth sphere
    ]);
  }, []);

  const points = useMemo(() => curve.getPoints(300), [curve]);
  const impulseRef = useRef<THREE.Mesh>(null);
  const impulseLightRef = useRef<THREE.PointLight>(null);
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

      // Merge effect — impulse grows and intensifies near the Earth
      const mergeT = Math.max(0, (smoothImpulseT.current - 0.7) / 0.3);
      impulseRef.current.scale.setScalar(1 + mergeT * 2);
    }

    if (impulseLightRef.current) {
      const mergeT = Math.max(0, (smoothImpulseT.current - 0.7) / 0.3);
      impulseLightRef.current.intensity = 8 + mergeT * 25;
      impulseLightRef.current.distance = 15 + mergeT * 20;
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

        // Fade: transparent at tail → bright at head (quadratic ease)
        const intensity = frac * frac;
        if (tc.showStars) {
          // Dark mode: cyan-green trail (#00ffcc)
          colors[i * 3]     = 0;
          colors[i * 3 + 1] = intensity;
          colors[i * 3 + 2] = intensity * 0.8;
        } else {
          // Light mode: warm amber trail (#f59e0b)
          colors[i * 3]     = intensity * 0.96;
          colors[i * 3 + 1] = intensity * 0.62;
          colors[i * 3 + 2] = intensity * 0.04;
        }
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
        <meshBasicMaterial color={tc.showStars ? '#ffffff' : '#f59e0b'} />
        <pointLight ref={impulseLightRef} color={tc.showStars ? tc.accent : '#f59e0b'} intensity={8} distance={15} />
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

        {/* 3D Earth at the bottom — impulse merges into it */}
        <EarthGlobe tc={tc} scrollYProgress={scrollYProgress} />
      </Canvas>
    </div>
  );
}
