"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";

const HERO_GRADIENT = ["#a163f1", "#6363f1", "#3498ea", "#40dfa3"] as const;

function Core() {
  const sphereRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (sphereRef.current) {
      const pulse = 1 + Math.sin(t * 2.2) * 0.05;
      sphereRef.current.scale.setScalar(pulse);
    }

    if (haloRef.current) {
      haloRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group>
      <mesh ref={sphereRef}>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshPhysicalMaterial
          color="#0f172a"
          metalness={0.85}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.25}
          emissive="#2563eb"
          emissiveIntensity={0.35}
        />
      </mesh>

      <mesh ref={haloRef}>
        <sphereGeometry args={[0.62, 32, 32]} />
        <meshBasicMaterial
          color="#60a5fa"
          opacity={0.12}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function Orbit({
  radius,
  color,
  tilt,
  speed,
}: {
  radius: number;
  color: string;
  tilt: number;
  speed: number;
}) {
  const orbitRef = useRef<THREE.Group>(null);
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i += 1) {
      const t = (i / 200) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(t) * radius,
          Math.sin(t) * radius * 0.55,
          0,
        ),
      );
    }
    return pts;
  }, [radius]);

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
        linewidth={1.35}
        transparent
        opacity={0.8}
        toneMapped={false}
      />
    </group>
  );
}

function Arc({
  points,
  color,
  speed = 0.4,
}: {
  points: Array<[number, number, number]>;
  color: string;
  speed?: number;
}) {
  const tubeRef = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const vectors = points.map((p) => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(vectors, false, "centripetal");
  }, [points]);

  useFrame((_, delta) => {
    if (tubeRef.current) {
      tubeRef.current.rotation.y += delta * speed * 0.15;
    }
  });

  return (
    <mesh ref={tubeRef}>
      <tubeGeometry args={[curve, 60, 0.05, 16, false]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

function Node({
  position,
  color,
  delay = 0,
}: {
  position: [number, number, number];
  color: string;
  delay?: number;
}) {
  const nodeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (nodeRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + delay) * 0.12;
      nodeRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <mesh position={position} ref={nodeRef}>
      <sphereGeometry args={[0.12, 24, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        metalness={0.9}
        roughness={0.25}
      />
    </mesh>
  );
}

function Sculpture() {
  return (
    <group rotation={[Math.PI / 10, -Math.PI / 12, 0]}>
      <Core />
      <Orbit radius={0.95} color="#67e8f9" tilt={0.25} speed={0.2} />
      <Orbit radius={0.78} color="#c084fc" tilt={-0.35} speed={0.15} />

      <Arc
        color={HERO_GRADIENT[0]}
        points={[
          [-0.2, -0.15, 0],
          [-0.05, 0.2, 0.25],
          [0.35, 0.4, 0.35],
          [0.7, 0.5, 0.25],
        ]}
      />
      <Arc
        color={HERO_GRADIENT[2]}
        points={[
          [0.15, -0.25, 0],
          [0.35, -0.35, -0.25],
          [-0.1, -0.55, -0.3],
          [-0.45, -0.65, -0.1],
        ]}
        speed={0.3}
      />

      <Node position={[0.75, 0.4, 0.25]} color={HERO_GRADIENT[0]} />
      <Node position={[-0.6, -0.55, -0.18]} color={HERO_GRADIENT[2]} delay={0.8} />
    </group>
  );
}

function LightRig() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 6]} intensity={1.4} />
      <directionalLight position={[-3, -4, -5]} intensity={0.8} />
      <pointLight position={[0, 0, 4]} intensity={0.9} color="#60a5fa" />
      <pointLight position={[1, -1, -3]} intensity={0.6} color="#c084fc" />
    </>
  );
}

interface LogoProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

export default function Logo({ size = "medium", className = "" }: LogoProps) {
  const sizeMap = {
    small: { canvas: 40, camera: 3.4 },
    medium: { canvas: 62, camera: 4.4 },
    large: { canvas: 110, camera: 6.1 },
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
