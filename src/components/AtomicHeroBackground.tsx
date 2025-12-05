"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Line, PointMaterial, Points } from "@react-three/drei";
import type { MutableRefObject, MouseEvent } from "react";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";

const PALETTE = ["#5be2ff", "#8b5cf6", "#40dfa3"];
const BACKGROUND = "#020617";

type PointerRef = MutableRefObject<{ x: number; y: number }>;

type AtomConfig = {
  id: string;
  base: [number, number, number];
  radius: number;
  color: string;
  emissive: string;
  drift: number;
  speed: number;
  phase: number;
};

type BondConfig = {
  id: string;
  points: [[number, number, number], [number, number, number]];
  color: string;
  width: number;
  phase: number;
};

export default function AtomicHeroBackground() {
  const pointer = useRef({ x: 0, y: 0 });

  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
    };
  };

  const resetPointer = () => {
    pointer.current = { x: 0, y: 0 };
  };

  return (
    <div
      className="relative flex h-[420px] w-full items-center justify-center sm:h-[520px] lg:h-[640px]"
      aria-hidden="true"
      onMouseMove={handlePointerMove}
      onMouseLeave={resetPointer}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[40px] border border-white/5 bg-[#01030f]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, rgba(91,226,255,0.15), transparent 45%)," +
              "radial-gradient(circle at 80% 0%, rgba(139,92,246,0.2), transparent 40%)," +
              "radial-gradient(circle at 50% 80%, rgba(64,223,163,0.18), transparent 50%)," +
              BACKGROUND,
          }}
        />
        <Canvas
          className="absolute inset-0"
          style={{ pointerEvents: "none" }}
          dpr={[1, 1.8]}
          camera={{ position: [0, 0, 6], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <color attach="background" args={["transparent"]} />
            <fog attach="fog" args={[BACKGROUND, 8, 18]} />
            <ambientLight intensity={0.3} />
            <pointLight position={[4, 6, 2]} color="#62e7ff" intensity={1.2} />
            <pointLight position={[-5, -4, -2]} color="#c084fc" intensity={0.7} />
            <ParticleOrbits />
            <AtomicField pointer={pointer} />
          </Suspense>
        </Canvas>
        <div className="pointer-events-none absolute inset-0 rounded-[40px] border border-white/10" />
        <div className="pointer-events-none absolute inset-0 rounded-[40px] bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30 mix-blend-screen" />
        <div className="pointer-events-none absolute inset-x-12 bottom-6 h-32 rounded-full bg-[#5be2ff2b] blur-[80px]" />
      </div>
    </div>
  );
}

function AtomicField({ pointer }: { pointer: PointerRef }) {
  const group = useRef<THREE.Group>(null);
  const network = useMemo(() => createNetwork(), []);

  useFrame((state) => {
    if (!group.current) return;
    const targetX = pointer.current.y * 0.25;
    const targetY = pointer.current.x * 0.35 + state.clock.elapsedTime * 0.04;

    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetX, 0.05);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetY, 0.05);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, pointer.current.y * 0.1, 0.05);
  });

  return (
    <group ref={group}>
      {network.bonds.map((bond) => (
        <AnimatedBond key={bond.id} bond={bond} />
      ))}
      {network.atoms.map((atom) => (
        <AnimatedAtom key={atom.id} atom={atom} />
      ))}
    </group>
  );
}

function AnimatedAtom({ atom }: { atom: AtomConfig }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * atom.speed + atom.phase;
    const material = ref.current.material as THREE.MeshStandardMaterial;

    ref.current.position.set(
      atom.base[0] + Math.sin(t) * atom.drift,
      atom.base[1] + Math.cos(t * 0.9) * atom.drift * 0.6,
      atom.base[2] + Math.sin(t * 0.7) * atom.drift,
    );

    const pulse = 0.8 + 0.4 * Math.sin(t * 1.2);
    if (material) {
      material.emissiveIntensity = pulse;
    }
  });

  return (
    <mesh ref={ref} position={atom.base}>
      <sphereGeometry args={[atom.radius, 24, 24]} />
      <meshStandardMaterial
        color={atom.color}
        emissive={atom.emissive}
        emissiveIntensity={1.1}
        roughness={0.35}
        metalness={0.25}
      />
    </mesh>
  );
}

function AnimatedBond({ bond }: { bond: BondConfig }) {
  const ref = useRef<any>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const pulse = 0.35 + 0.3 * Math.sin(state.clock.elapsedTime * 1.4 + bond.phase);
    if (ref.current.material) {
      ref.current.material.opacity = 0.2 + pulse;
    }
  });

  return (
    <Line
      ref={ref}
      points={bond.points}
      color={bond.color}
      lineWidth={bond.width}
      transparent
      opacity={0.4}
      depthWrite={false}
    />
  );
}

function ParticleOrbits() {
  const group = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const count = 1400;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const radius = randomInRange(1.5, 4.8);
      const angle = randomInRange(0, Math.PI * 2);
      const height = randomInRange(-1.4, 1.4);
      arr[i * 3] = Math.cos(angle) * radius;
      arr[i * 3 + 1] = height;
      arr[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.08;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.08;
  });

  return (
    <group ref={group}>
      <Points positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#8be8ff"
          size={0.03}
          sizeAttenuation
          depthWrite={false}
          opacity={0.5}
        />
      </Points>
    </group>
  );
}

function createNetwork() {
  const atoms: AtomConfig[] = Array.from({ length: 26 }, (_, index) => {
    const base: [number, number, number] = [
      randomInRange(-2.4, 2.4),
      randomInRange(-1.3, 1.3),
      randomInRange(-1.8, 1.8),
    ];

    return {
      id: `atom-${index}`,
      base,
      radius: randomInRange(0.06, 0.16),
      color: PALETTE[index % PALETTE.length],
      emissive: PALETTE[(index + 1) % PALETTE.length],
      drift: randomInRange(0.04, 0.14),
      speed: randomInRange(0.4, 0.9),
      phase: Math.random() * Math.PI * 2,
    };
  });

  const bonds: BondConfig[] = Array.from({ length: 32 }, (_, index) => {
    const from = atoms[Math.floor(Math.random() * atoms.length)];
    let to = atoms[Math.floor(Math.random() * atoms.length)];
    if (from.id === to.id) {
      to = atoms[(index + 5) % atoms.length];
    }

    return {
      id: `bond-${index}`,
      points: [from.base, to.base],
      color: PALETTE[index % PALETTE.length],
      width: randomInRange(0.35, 0.65),
      phase: Math.random() * Math.PI * 2,
    };
  });

  return { atoms, bonds };
}

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}
