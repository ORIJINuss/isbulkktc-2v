"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const ORBIT_COLORS = ["#4a7c8e", "#5fa29d", "#336b5f", "#a8d4dd"] as const;

type Parca = {
  radius: number;
  distance: number;
  speed: number;
  phase: number;
  tilt: number;
  color: string;
  scale: number;
};

function CamKiyasla({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  useFrame(({ camera }) => {
    const hedef = scrollRef.current * 0.00018;
    camera.position.y = THREE.MathUtils.damp(camera.position.y, hedef, 3, 1 / 60);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function OrbitParcalari({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const grup = useRef<THREE.Group>(null);
  const parcaciklar = useMemo<Parca[]>(() =>
    Array.from({ length: 13 }, (_, index) => ({
      radius: 0.13 + (index % 4) * 0.045,
      distance: 0.92 + (index % 5) * 0.22,
      speed: 0.18 + (index % 4) * 0.045,
      phase: (index / 13) * Math.PI * 2,
      tilt: -0.38 + (index % 3) * 0.38,
      color: ORBIT_COLORS[index % ORBIT_COLORS.length],
      scale: 0.82 + (index % 3) * 0.16,
    })),
  []);

  useFrame(({ clock }) => {
    if (!grup.current) return;
    const time = clock.getElapsedTime();
    const scrollInfluence = scrollRef.current * 0.00008;
    grup.current.rotation.y = time * 0.06 + scrollInfluence;
    grup.current.rotation.z = Math.sin(time * 0.16) * 0.06;
    grup.current.position.y = Math.sin(time * 0.28) * 0.035 - scrollInfluence * 0.3;
    parcaciklar.forEach((parca, index) => {
      const child = grup.current?.children[index + 4];
      if (!child) return;

      const angle = parca.phase + time * parca.speed + scrollInfluence * (index % 2 ? 1 : -1);
      child.position.set(
        Math.cos(angle) * parca.distance,
        Math.sin(angle) * parca.distance * Math.sin(parca.tilt),
        Math.sin(angle) * parca.distance * Math.cos(parca.tilt),
      );
      child.rotation.x = time * 0.22 + index;
      child.rotation.y = time * 0.16;
    });
  });

  return (
    <group ref={grup} position={[0.95, 0.12, 0]} scale={1.65} rotation={[0.24, 0, -0.2]}>
      <mesh rotation={[Math.PI / 2.2, 0.12, 0]}>
        <torusGeometry args={[1.28, 0.012, 12, 96]} />
        <meshBasicMaterial color="#4a7c8e" transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[0.68, 0.2, 0.34]} scale={[1, 0.62, 1]}>
        <torusGeometry args={[1.36, 0.01, 12, 96]} />
        <meshBasicMaterial color="#5fa29d" transparent opacity={0.72} />
      </mesh>
      <mesh rotation={[0.2, 0.78, 0.18]} scale={[1, 0.72, 1]}>
        <torusGeometry args={[1.18, 0.008, 12, 96]} />
        <meshBasicMaterial color="#a8d4dd" transparent opacity={0.78} />
      </mesh>
      <mesh scale={1.35}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshBasicMaterial color="#a8d4dd" transparent opacity={0.98} />
      </mesh>
      {parcaciklar.map((parca, index) => (
        <mesh key={index} scale={parca.scale}>
          <sphereGeometry args={[parca.radius, 24, 24]} />
          <meshStandardMaterial color={parca.color} emissive={parca.color} emissiveIntensity={0.18} roughness={0.22} metalness={0.12} transparent opacity={0.96} />
        </mesh>
      ))}
    </group>
  );
}

function OrbitSahnesi() {
  const scrollRef = useRef(0);

  useEffect(() => {
    const onScroll = () => { scrollRef.current = window.scrollY; };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="orbit-3d-sahnesi" aria-hidden="true">
      <div className="orbit-3d-fallback">
        <span className="orbit-fallback-ring orbit-fallback-ring-one" />
        <span className="orbit-fallback-ring orbit-fallback-ring-two" />
        <span className="orbit-fallback-core" />
      </div>
      <Canvas camera={{ position: [0, 0, 3.8], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={1.4} color="#d0e6ec" />
        <directionalLight position={[2, 3, 4]} intensity={3.2} color="#f7fbfd" />
        <pointLight position={[-2, -1, 2]} intensity={12} distance={6} color="#5fa29d" />
        <pointLight position={[2, 1, -1]} intensity={10} distance={5} color="#a8d4dd" />
        <CamKiyasla scrollRef={scrollRef} />
        <OrbitParcalari scrollRef={scrollRef} />
        <AdaptiveDpr pixelated />
        <Preload all />
      </Canvas>
    </div>
  );
}

export default OrbitSahnesi;
