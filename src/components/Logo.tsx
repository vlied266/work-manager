"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

const HERO_GRADIENT = ["#a163f1", "#6363f1", "#3498ea", "#40dfa3"] as const;

function DataCore() {
  const coreRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2) * 0.08;
      coreRef.current.scale.setScalar(pulse);
      coreRef.current.rotation.y += 0.01;
    }

    if (shellRef.current) {
      shellRef.current.rotation.x = Math.sin(t * 0.4) * 0.2;
      shellRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.42, 48, 48]} />
        <meshPhysicalMaterial
          color="#0f172a"
          metalness={0.95}
          roughness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.2}
          transmission={0.4}
          ior={1.25}
          emissive="#1d4ed8"
          emissiveIntensity={0.45}
        />
      </mesh>

      <mesh ref={shellRef}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshBasicMaterial
          color="#38bdf8"
          opacity={0.15}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function EnergyRibbon({
  color,
  radius,
  tube,
  twist,
  p = 2,
  q = 3,
  rotation = [0, 0, 0],
  speed = 0.25,
}: {
  color: string;
  radius: number;
  tube: number;
  twist: number;
  p?: number;
  q?: number;
  rotation?: [number, number, number];
  speed?: number;
}) {
  const ribbonRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ribbonRef.current) {
      ribbonRef.current.rotation.y += delta * speed;
      ribbonRef.current.rotation.x += delta * speed * 0.25;
    }
  });

  return (
    <mesh ref={ribbonRef} rotation={rotation}>
      <torusKnotGeometry args={[radius, tube, 240, 64, p, q]} />
      <meshPhysicalMaterial
        color={color}
        metalness={0.9}
        roughness={0.15}
        clearcoat={1}
        clearcoatRoughness={0.15}
        emissive={color}
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

function Orbit({
  radius,
  color,
  tilt,
  speed,
  squash = 0.45,
}: {
  radius: number;
  color: string;
  tilt: number;
  speed: number;
  squash?: number;
}) {
  const orbitRef = useRef<THREE.Group>(null);
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 240; i += 1) {
      const t = (i / 240) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(Math.cos(t) * radius, Math.sin(t) * radius * squash, 0),
      );
    }
    return pts;
  }, [radius, squash]);

  useFrame((_, delta) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y += delta * speed;
    }
  });

  return (
    <group ref={orbitRef} rotation={[tilt, 0, 0]}>
      <Line
        points={points}
        color={color}
        linewidth={1.75}
        transparent
        opacity={0.7}
        toneMapped={false}
      />
    </group>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const total = 360;
    const data = new Float32Array(total * 3);

    for (let i = 0; i < total; i += 1) {
      const radius = 0.4 + Math.random() * 1.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.9;

      const x = Math.cos(theta) * Math.cos(phi) * radius;
      const y = Math.sin(phi) * radius * 0.7;
      const z = Math.sin(theta) * Math.cos(phi) * radius;

      data[i * 3] = x;
      data[i * 3 + 1] = y;
      data[i * 3 + 2] = z;
    }

    return data;
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.08;
      pointsRef.current.rotation.x += delta * 0.03;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#f0fdfa"
        opacity={0.65}
        transparent
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function DataNodes() {
  const nodes: Array<{ position: [number, number, number]; color: string; delay: number }> =
    [
      { position: [0.95, 0.5, 0.25], color: HERO_GRADIENT[0], delay: 0 },
      { position: [-0.95, 0.5, -0.25], color: HERO_GRADIENT[1], delay: 0.4 },
      { position: [0.35, 1, 0.35], color: HERO_GRADIENT[2], delay: 0.8 },
      { position: [-0.35, -1, 0.25], color: HERO_GRADIENT[3], delay: 1.2 },
    ];

  return (
    <group>
      {nodes.map((node, index) => (
        <GlowingNode key={index} {...node} />
      ))}
    </group>
  );
}

function GlowingNode({
  position,
  color,
  delay,
}: {
  position: [number, number, number];
  color: string;
  delay: number;
}) {
  const nodeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (nodeRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.15;
      nodeRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <mesh position={position} ref={nodeRef}>
      <sphereGeometry args={[0.18, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.7}
        metalness={0.9}
        roughness={0.2}
      />
    </mesh>
  );
}

function Halo() {
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 0.15;
    }
  });

  return (
    <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.8, 1.2, 64]} />
      <meshBasicMaterial
        color="#bae6fd"
        opacity={0.2}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Sculpture() {
  return (
    <group rotation={[Math.PI / 9, -Math.PI / 7, 0]}>
      <ParticleField />
      <Halo />
      <DataCore />
      <DataNodes />

      <EnergyRibbon
        color={HERO_GRADIENT[0]}
        radius={0.85}
        tube={0.08}
        twist={2}
        q={4}
        rotation={[Math.PI / 4, 0, 0]}
        speed={0.35}
      />
      <EnergyRibbon
        color={HERO_GRADIENT[2]}
        radius={0.65}
        tube={0.06}
        twist={3}
        q={6}
        rotation={[-Math.PI / 6, Math.PI / 3, 0]}
        speed={0.28}
      />

      <Orbit radius={1.05} color="#67e8f9" tilt={0.35} speed={0.18} />
      <Orbit radius={0.95} color="#c084fc" tilt={-0.45} speed={0.12} />
    </group>
  );
}

function LightRig() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 8]} intensity={1.6} />
      <directionalLight position={[-4, -5, -6]} intensity={0.9} />
      <pointLight position={[0, 0, 4]} intensity={1} color="#60a5fa" />
      <pointLight position={[2, -1, -3]} intensity={0.6} color="#c084fc" />
    </>
  );
}

interface LogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export default function Logo({ size = "medium", className = "" }: LogoProps) {
  const sizeMap = {
    small: { canvas: 44, camera: 3.6 },
    medium: { canvas: 70, camera: 4.8 },
    large: { canvas: 128, camera: 6.5 },
  } as const;

  const { canvas, camera } = sizeMap[size];

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{
        width: `${canvas}px`,
        height: `${canvas}px`,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, camera], fov: 45 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        }}
      >
        <LightRig />
        <Sculpture />
      </Canvas>
    </div>
  );
}
