"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const ACCENT_COLORS = ["#b3f0ff", "#dff6ff", "#a8e2ff", "#f2fbff"];
const CORE_COLOR = "#f9fdff";

type OrbitalParticle = {
  radius: number;
  speed: number;
  size: number;
  phase: number;
  tilt: number;
  color: string;
};

function OrbitingParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo<OrbitalParticle[]>(
    () =>
      Array.from({ length: 90 }, (_, index) => ({
        radius: 1.1 + Math.random() * 1.8,
        speed: 0.15 + Math.random() * 0.35,
        size: 0.02 + Math.random() * 0.06,
        phase: Math.random() * Math.PI * 2,
        tilt: Math.random() * 0.8 - 0.4,
        color: ACCENT_COLORS[index % ACCENT_COLORS.length],
      })),
    []
  );

  useEffect(() => {
    if (!meshRef.current) {
      return;
    }

    particles.forEach((particle, index) => {
      meshRef.current?.setColorAt(index, new THREE.Color(particle.color));
    });

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [particles]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    particles.forEach((particle, index) => {
      const t = state.clock.elapsedTime * particle.speed + particle.phase;
      const x = Math.cos(t) * particle.radius;
      const z = Math.sin(t) * particle.radius;
      const y = Math.sin(t * 0.7) * 0.6 + Math.cos(t * 0.3 + particle.tilt) * 0.2;

      dummy.position.set(x, y, z);
      const scale = particle.size * 20;
      dummy.scale.set(scale, scale, scale);
      dummy.rotation.set(t * 0.3, t, 0);
      dummy.updateMatrix();

      mesh.setMatrixAt(index, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial vertexColors toneMapped={false} transparent opacity={0.85} />
    </instancedMesh>
  );
}

type RibbonRingProps = {
  radius: number;
  color: string;
  speed?: number;
  tilt?: number;
};

function RibbonRing({ radius, color, speed = 0.4, tilt = 0 }: RibbonRingProps) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * speed;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2 + tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.025, 48, 320]} />
      <meshStandardMaterial
        color={color}
        metalness={0.8}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.7}
      />
    </mesh>
  );
}

function CrystalCore() {
  const crystalRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!crystalRef.current) {
      return;
    }

    crystalRef.current.rotation.x += delta * 0.3;
    crystalRef.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh ref={crystalRef}>
      <icosahedronGeometry args={[0.7, 1]} />
      <meshPhysicalMaterial
        color={CORE_COLOR}
        roughness={0.25}
        metalness={0.35}
        transmission={0.95}
        thickness={0.9}
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={1.4}
      />
    </mesh>
  );
}

function AuroraBackdrop() {
  return (
    <mesh rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -1.2, -0.2]}>
      <cylinderGeometry args={[2.7, 3.5, 0.16, 96, 1, true]} />
      <meshStandardMaterial
        color={CORE_COLOR}
        transparent
        opacity={0.25}
        side={THREE.BackSide}
        metalness={0.1}
        roughness={0.9}
        emissive={CORE_COLOR}
        emissiveIntensity={0.35}
      />
    </mesh>
  );
}

function FloatingAssembly() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) {
      return;
    }

    const t = state.clock.elapsedTime;
    group.position.y = Math.sin(t * 0.45) * 0.25;
    group.position.x = Math.sin(t * 0.2) * 0.05;
    group.rotation.z = Math.sin(t * 0.18) * 0.06;
    group.rotation.y = Math.cos(t * 0.12) * 0.05;
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.05} rotationIntensity={0.3} floatIntensity={0.35}>
        <CrystalCore />
      </Float>
      <AuroraBackdrop />
      <RibbonRing radius={1} color="#e4f7ff" speed={0.55} tilt={0.08} />
      <RibbonRing radius={1.35} color="#b9ecff" speed={0.35} tilt={-0.04} />
      <RibbonRing radius={1.75} color="#dff6ff" speed={0.2} tilt={0.02} />
      <OrbitingParticles />
    </group>
  );
}

function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 6]} intensity={1.2} color="#f0fbff" />
      <pointLight position={[-2, -1, -3]} intensity={0.65} color="#c5f1ff" />
      <FloatingAssembly />
      <Sparkles color="#f6fbff" count={140} size={3.4} speed={0.35} opacity={0.5} scale={4.2} />
      <Environment preset="apartment" />
    </>
  );
}

export default function HeroAnimation() {
  return (
    <div
      className="relative flex h-[420px] w-full items-center justify-center sm:h-[520px] lg:h-[640px]"
      aria-hidden="true"
    >
      <Canvas
        className="h-full w-full"
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <HeroScene />
      </Canvas>
    </div>
  );
}
