"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Sparkles } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

const CAM_RENKLERI = ["#8fcbb8", "#d9aa67", "#e7a2a7", "#b7d8d0"];

type Parca = {
  aci: number;
  yariCap: number;
  yukseklik: number;
  hiz: number;
  boyut: number;
  renk: string;
};

function CamParcaciklar({ cekim }: { cekim: boolean }) {
  const grup = useRef<THREE.Group>(null);
  const parcalar = useMemo<Parca[]>(() => [
    { aci: 0.2, yariCap: 1.3, yukseklik: 0.12, hiz: 0.34, boyut: 0.22, renk: CAM_RENKLERI[0] },
    { aci: 1.55, yariCap: 1.05, yukseklik: -0.25, hiz: -0.28, boyut: 0.15, renk: CAM_RENKLERI[1] },
    { aci: 2.7, yariCap: 1.38, yukseklik: 0.32, hiz: 0.22, boyut: 0.2, renk: CAM_RENKLERI[2] },
    { aci: 4.05, yariCap: 1.12, yukseklik: -0.18, hiz: -0.31, boyut: 0.17, renk: CAM_RENKLERI[3] },
    { aci: 5.2, yariCap: 1.3, yukseklik: 0.28, hiz: 0.26, boyut: 0.13, renk: CAM_RENKLERI[0] },
  ], []);

  useFrame((_, delta) => {
    if (!grup.current) return;
    grup.current.rotation.y += delta * (cekim ? 0.5 : 0.12);
    grup.current.rotation.z = THREE.MathUtils.damp(grup.current.rotation.z, cekim ? -0.16 : 0.04, 3, delta);
    grup.current.children.forEach((cocuk, index) => {
      const parca = parcalar[index];
      const hedef = cekim ? 0.62 : 1;
      cocuk.position.multiplyScalar(THREE.MathUtils.damp(1, hedef, 2, delta));
      cocuk.rotation.x += delta * parca.hiz;
      cocuk.rotation.y -= delta * parca.hiz * 0.7;
    });
  });

  return (
    <group ref={grup}>
      {parcalar.map((parca, index) => {
        const x = Math.cos(parca.aci) * parca.yariCap;
        const z = Math.sin(parca.aci) * parca.yariCap;
        return (
          <mesh key={index} position={[x, parca.yukseklik, z]} scale={parca.boyut} castShadow>
            <icosahedronGeometry args={[1, 4]} />
            <meshPhysicalMaterial color={parca.renk} transmission={0.62} thickness={0.28} roughness={0.08} ior={1.46} clearcoat={1} clearcoatRoughness={0.04} transparent opacity={0.94} />
          </mesh>
        );
      })}
    </group>
  );
}

function AnaCamKure({ cekim }: { cekim: boolean }) {
  const kure = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!kure.current) return;
    kure.current.rotation.y += delta * (cekim ? 0.28 : 0.08);
    kure.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.32) * 0.045;
    const hedef = cekim ? 1.07 : 1;
    kure.current.scale.lerp(new THREE.Vector3(hedef, hedef, hedef), 1 - Math.exp(-delta * 4));
  });

  return (
    <mesh ref={kure} castShadow receiveShadow>
      <sphereGeometry args={[1.02, 96, 96]} />
      <meshPhysicalMaterial color="#4d9887" transmission={0.54} thickness={1.45} roughness={0.07} ior={1.46} clearcoat={1} clearcoatRoughness={0.03} transparent opacity={0.96} />
    </mesh>
  );
}

function Sahne({ cekim }: { cekim: boolean }) {
  return (
    <>
      <color attach="background" args={["#f6f5ef"]} />
      <ambientLight intensity={1.4} color="#eaf4ef" />
      <directionalLight position={[-3, 4, 5]} intensity={3.2} color="#fff8e9" castShadow />
      <pointLight position={[3, 1, 2]} intensity={2.4} color="#82c9b2" />
      <pointLight position={[-2, -1, 1]} intensity={1.5} color="#e6b77b" />
      <group position={[0.4, 0, 0]}>
        <AnaCamKure cekim={cekim} />
        <CamParcaciklar cekim={cekim} />
        <Sparkles count={34} scale={3.4} size={1.6} speed={0.22} color="#fff8e9" opacity={0.72} />
      </group>
      <Environment preset="city" environmentIntensity={0.72} />
    </>
  );
}

export default function CamOrbitSahnesi() {
  const [cekim, setCekim] = useState(false);

  return (
    <div
      className="cam-orbit-sahnesi"
      role="img"
      aria-label="Etkileşimli cam orbit görseli"
      onClick={() => setCekim((deger) => !deger)}
    >
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4.7], fov: 34 }} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <Sahne cekim={cekim} />
      </Canvas>
      <span className="sr-only">Cam orbiti hareket ettirmek için tıklayın.</span>
    </div>
  );
}
