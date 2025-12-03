"use client";

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshTransmissionMaterial, Environment, Float, SpotLight, QuadraticBezierLine } from '@react-three/drei';
import * as THREE from 'three';

const palette = {
  cyan: '#67e8f9',
  violet: '#c084fc',
  magenta: '#f472b6',
  amber: '#fcd34d',
  teal: '#2dd4bf',
};

function AtomicCore() {
  const innerRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (innerRef.current) {
      innerRef.current.rotation.y += delta * 0.8;
      innerRef.current.rotation.x += delta * 0.4;
    }
    if (auraRef.current) {
      const scale = 1.15 + Math.sin(t * 1.8) * 0.05;
      auraRef.current.scale.setScalar(scale);
      const material = auraRef.current.material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = 0.18 + (Math.cos(t * 1.5) + 1) * 0.08;
      }
    }
  });

  return (
    <group>
      <pointLight intensity={2.4} distance={9} color={palette.cyan} />
      <Sphere ref={innerRef} args={[0.6, 64, 64]}>
        <meshStandardMaterial
          color={palette.violet}
          metalness={0.5}
          roughness={0.12}
          emissive="#818cf8"
          emissiveIntensity={0.8}
        />
      </Sphere>
      <Sphere args={[0.95, 128, 128]}>
        <MeshTransmissionMaterial
          backside
          samples={32}
          resolution={1024}
          thickness={3.2}
          transmission={0.92}
          ior={1.4}
          color={palette.cyan}
          chromaticAberration={0.65}
          anisotropy={0.4}
          distortion={0.5}
          distortionScale={0.25}
          temporalDistortion={0.12}
          iridescence={0.75}
          iridescenceIOR={1.1}
          iridescenceThicknessRange={[120, 1400]}
          roughness={0.05}
        />
      </Sphere>
      <mesh ref={auraRef}>
        <sphereGeometry args={[1.25, 64, 64]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function EnergyHalo() {
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!haloRef.current) return;
    const scale = 1.4 + Math.sin(state.clock.elapsedTime * 1.2) * 0.08;
    haloRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.35, 1.65, 128]} />
      <meshBasicMaterial color={palette.teal} transparent opacity={0.35} />
    </mesh>
  );
}

type OrbitRingProps = {
  radius: number;
  color: string;
  speed: number;
  tilt: [number, number, number];
  nodeCount: number;
  thickness?: number;
};

function OrbitRing({ radius, color, speed, tilt, nodeCount, thickness = 0.05 }: OrbitRingProps) {
  const ringRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const nodes = useMemo(() => {
    return Array.from({ length: nodeCount }, (_, index) => {
      const angle = (index / nodeCount) * Math.PI * 2;
      return [Math.cos(angle) * radius, Math.sin(angle) * radius, 0];
    });
  }, [nodeCount, radius]);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * speed;
    }
    if (pulseRef.current) {
      const material = pulseRef.current.material as THREE.MeshStandardMaterial;
      if (material) {
        material.emissiveIntensity = 0.2 + (Math.sin(state.clock.elapsedTime * 2) + 1) * 0.25;
      }
    }
  });

  return (
    <group ref={ringRef} rotation={tilt}>
      <mesh ref={pulseRef}>
        <torusGeometry args={[radius, thickness, 64, 256]} />
        <meshStandardMaterial
          color={color}
          metalness={0.8}
          roughness={0.15}
          emissive={color}
          emissiveIntensity={0.45}
        />
      </mesh>
      {nodes.map((position, index) => (
        <mesh key={index} position={position as [number, number, number]}>
          <sphereGeometry args={[0.08, 32, 32]} />
          <meshStandardMaterial color="#f8fafc" emissive={color} emissiveIntensity={0.6} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

type DataArcProps = {
  start: [number, number, number];
  end: [number, number, number];
  mid: [number, number, number];
  color: string;
  speed: number;
};

function DataArc({ start, end, mid, color, speed }: DataArcProps) {
  const lineRef = useRef<any>(null);

  useFrame((_, delta) => {
    const material = lineRef.current?.material as { dashOffset?: number };
    if (material?.dashOffset !== undefined) {
      material.dashOffset -= delta * speed;
    }
  });

  return (
    <QuadraticBezierLine
      ref={lineRef}
      start={start}
      end={end}
      mid={mid}
      color={color}
      lineWidth={1.5}
      dashed
      dashScale={1}
      dashSize={0.35}
      dashOffset={0}
      transparent
      opacity={0.7}
    />
  );
}

function DataArcs() {
  const arcs = useMemo(
    () => [
      {
        start: [-1.7, 0.2, 0.4] as [number, number, number],
        end: [1.6, 0.4, -0.6] as [number, number, number],
        mid: [0, 1.4, 0.3] as [number, number, number],
        color: palette.cyan,
        speed: 0.25,
      },
      {
        start: [-1.1, -0.8, -0.3] as [number, number, number],
        end: [1.2, -0.2, 0.9] as [number, number, number],
        mid: [0, -1.2, -0.5] as [number, number, number],
        color: palette.violet,
        speed: 0.35,
      },
      {
        start: [0.2, 1.1, -1.3] as [number, number, number],
        end: [-0.4, -1.5, 1.1] as [number, number, number],
        mid: [0.4, 0.6, 1.6] as [number, number, number],
        color: palette.amber,
        speed: 0.18,
      },
    ],
    []
  );

  return (
    <>
      {arcs.map((arc, index) => (
        <DataArc key={index} {...arc} />
      ))}
    </>
  );
}

const generateParticleData = () => {
  return Array.from({ length: 22 }, (_, i) => {
    const seed = i * 0.618033988749;
    const normalize = (val: number) => {
      const normalized = val % 1;
      return normalized < 0 ? normalized + 1 : normalized;
    };
    const random1 = normalize(Math.sin(seed * 12.9898) * 43758.5453);
    const random2 = normalize(Math.sin((seed + 1) * 12.9898) * 43758.5453);
    const random3 = normalize(Math.sin((seed + 2) * 12.9898) * 43758.5453);
    const random4 = normalize(Math.sin((seed + 3) * 12.9898) * 43758.5453);
    const random5 = normalize(Math.sin((seed + 4) * 12.9898) * 43758.5453);

    const radius = 3 + random1 * 1.8;
    const theta = random2 * Math.PI * 2;
    const phi = Math.acos(random3 * 2 - 1);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    const colors = [
      { color: palette.cyan, emissive: '#22d3ee' },
      { color: palette.violet, emissive: '#a855f7' },
      { color: palette.magenta, emissive: '#fb7185' },
      { color: palette.teal, emissive: '#14b8a6' },
    ];
    const colorIndex = Math.floor(random4 * colors.length);
    const chosen = colors[Math.max(0, Math.min(colors.length - 1, colorIndex))];

    return {
      position: [x, y, z] as [number, number, number],
      speed: 0.2 + random5 * 0.25,
      floatSpeed: 0.4 + random1 * 0.6,
      color: chosen.color,
      emissive: chosen.emissive,
    };
  });
};

const PARTICLE_DATA = generateParticleData();

function FloatingParticles() {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<(THREE.Group | null)[]>([]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
      groupRef.current.rotation.x += delta * 0.08;
    }

    particlesRef.current.forEach((particle, i) => {
      if (particle && PARTICLE_DATA[i]) {
        const time = state.clock.elapsedTime;
        const data = PARTICLE_DATA[i];
        const floatOffset = Math.sin(time * data.floatSpeed) * 0.12;
        const floatOffsetY = Math.cos(time * data.floatSpeed * 0.7) * 0.1;

        particle.position.y = data.position[1] + floatOffset;
        particle.position.x = data.position[0] + floatOffsetY * 0.5;
        particle.rotation.x += delta * data.speed;
        particle.rotation.y += delta * data.speed * 0.7;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {PARTICLE_DATA.map((particle, i) => (
        <Float
          key={i}
          speed={particle.floatSpeed}
          rotationIntensity={0.4}
          floatIntensity={0.25}
          floatingRange={[-0.1, 0.1]}
        >
          <group
            ref={(el) => {
              if (el) particlesRef.current[i] = el;
            }}
            position={particle.position}
          >
            <Sphere args={[0.12, 32, 32]}>
              <meshStandardMaterial
                color={particle.color}
                emissive={particle.emissive}
                emissiveIntensity={0.85}
                roughness={0.05}
                metalness={0.9}
                transparent
                opacity={0.9}
              />
            </Sphere>
          </group>
        </Float>
      ))}
    </group>
  );
}

function EnergyGrid() {
  return (
    <group position={[0, -1.7, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.4, 64]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.12} wireframe />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.2, 2.6, 64]} />
        <meshBasicMaterial color={palette.cyan} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

function AtomicReadySystem({ mouse }: { mouse: [number, number] }) {
  const systemRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!systemRef.current) return;
    systemRef.current.rotation.y += (mouse[0] * 0.6 - systemRef.current.rotation.y) * 0.08;
    systemRef.current.rotation.x += (mouse[1] * 0.4 - systemRef.current.rotation.x) * 0.08;
    systemRef.current.position.x += (mouse[0] * 0.5 - systemRef.current.position.x) * 0.05;
    systemRef.current.position.y += (mouse[1] * 0.3 - systemRef.current.position.y) * 0.05;
  });

  return (
    <group ref={systemRef}>
      <Float speed={0.9} rotationIntensity={0.25} floatIntensity={0.5} floatingRange={[-0.15, 0.15]}>
        <group>
          <AtomicCore />
          <EnergyHalo />
        </group>
      </Float>
      <OrbitRing radius={1.35} color={palette.cyan} speed={0.35} tilt={[0.5, 0.1, 0.2]} nodeCount={6} />
      <OrbitRing
        radius={1.9}
        color={palette.violet}
        speed={-0.25}
        tilt={[0.2, -0.4, -0.1]}
        nodeCount={7}
        thickness={0.06}
      />
      <OrbitRing
        radius={2.4}
        color={palette.magenta}
        speed={0.18}
        tilt={[0.8, 0.3, -0.2]}
        nodeCount={8}
        thickness={0.04}
      />
      <DataArcs />
      <FloatingParticles />
      <EnergyGrid />
    </group>
  );
}

export default function HeroAnimation() {
  const [mouse, setMouse] = useState<[number, number]>([0, 0]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    setMouse([x, y]);
  };

  return (
    <div
      className="h-[500px] lg:h-[600px] w-full relative"
      style={{
        margin: 0,
        padding: 0,
        border: 'none',
        outline: 'none',
        background: 'transparent',
        backgroundColor: 'transparent',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse([0, 0])}
    >
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 42 }}
        dpr={[1, 2]}
        style={{
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
          margin: 0,
          padding: 0,
          display: 'block',
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          premultipliedAlpha: false,
          preserveDrawingBuffer: false,
          clearColor: 'transparent',
        }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[5, 5, 5]} intensity={1.8} color="#cbd5f5" />
        <directionalLight position={[-5, -3, 4]} intensity={1.2} color="#fdf2f8" />
        <SpotLight position={[4, 6, 4]} intensity={3} color={palette.cyan} penumbra={0.6} distance={18} />
        <SpotLight position={[-4, -5, 5]} intensity={2.8} color={palette.violet} penumbra={0.5} distance={18} />
        <SpotLight position={[0, 4, -4]} intensity={2.2} color={palette.amber} penumbra={0.5} distance={16} />

        <AtomicReadySystem mouse={mouse} />

        <Environment preset="studio" blur={0.9} background={false} />
      </Canvas>
    </div>
  );
}