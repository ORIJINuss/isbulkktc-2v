"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, CubeCamera, Environment, Sparkles, useTexture } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

const CAM_RENKLERI = ["#8fcbb8", "#d9aa67", "#e7a2a7", "#b7d8d0"];
const CAM_ORBIT_SURUM = "physical-material-v2";

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
      const uzaklik = Math.hypot(cocuk.position.x, cocuk.position.z) || 1;
      const hedefUzaklik = parca.yariCap * hedef;
      const yeniUzaklik = THREE.MathUtils.damp(uzaklik, hedefUzaklik, 3.2, delta);
      const oran = yeniUzaklik / uzaklik;
      cocuk.position.x *= oran;
      cocuk.position.z *= oran;
      cocuk.position.y = THREE.MathUtils.damp(cocuk.position.y, parca.yukseklik * (cekim ? 0.82 : 1), 2.4, delta);
      cocuk.rotation.x += delta * parca.hiz;
      cocuk.rotation.z += delta * parca.hiz * 0.35;
      cocuk.rotation.y -= delta * parca.hiz * 0.7;
    });

    for (let i = 0; i < grup.current.children.length; i += 1) {
      for (let j = i + 1; j < grup.current.children.length; j += 1) {
        const ilk = grup.current.children[i];
        const ikinci = grup.current.children[j];
        const fark = ilk.position.clone().sub(ikinci.position);
        const mesafe = fark.length() || 0.001;
        const minimum = parcalar[i].boyut + parcalar[j].boyut + 0.08;
        if (mesafe >= minimum) continue;
        const itme = fark.normalize().multiplyScalar((minimum - mesafe) * 0.5);
        ilk.position.add(itme);
        ikinci.position.sub(itme);
      }
    }
  });

  return (
    <group ref={grup}>
      {parcalar.map((parca, index) => {
        const x = Math.cos(parca.aci) * parca.yariCap;
        const z = Math.sin(parca.aci) * parca.yariCap;
        return (
          <mesh key={index} position={[x, parca.yukseklik, z]} scale={parca.boyut} castShadow receiveShadow>
            <icosahedronGeometry args={[1, 6]} />
            <meshPhysicalMaterial color={parca.renk} metalness={0.01} transmission={0.88} thickness={0.38} roughness={0.035} ior={1.46} clearcoat={1} clearcoatRoughness={0.025} envMapIntensity={1.5} transparent opacity={0.97} />
          </mesh>
        );
      })}
    </group>
  );
}

function CamOrbitKure({ cekim }: { cekim: boolean }) {
  const kure = useRef<THREE.Mesh>(null);
  const kktcHaritasi = useTexture("/images/kktc-uydu-haritasi.jpg");
  useFrame((state, delta) => {
    if (!kure.current) return;
    kure.current.rotation.y += delta * (cekim ? 0.28 : 0.08);
    kure.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.32) * 0.045;
    const hedef = cekim ? 1.07 : 1;
    kure.current.scale.lerp(new THREE.Vector3(hedef, hedef, hedef), 1 - Math.exp(-delta * 4));
  });

  return (
    <CubeCamera frames={1} resolution={512} near={0.1} far={100}>
      {(texture) => (
        <group>
          <mesh ref={kure} castShadow receiveShadow>
            <sphereGeometry args={[1.02, 128, 128]} />
          <meshPhysicalMaterial
            color="#4d9887"
            metalness={0.02}
            roughness={0.035}
            ior={1.46}
            transmission={0.92}
            thickness={1.55}
            clearcoat={1}
            clearcoatRoughness={0.025}
            envMap={texture}
            envMapIntensity={1.8}
            map={kktcHaritasi}
            transparent
            opacity={0.98}
            />
          </mesh>
          <mesh scale={1.025} renderOrder={2}>
            <sphereGeometry args={[1.02, 128, 128]} />
            <meshBasicMaterial map={kktcHaritasi} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      )}
    </CubeCamera>
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
        <CamOrbitKure cekim={cekim} />
        <CamParcaciklar cekim={cekim} />
        <Sparkles count={34} scale={3.4} size={1.6} speed={0.22} color="#fff8e9" opacity={0.72} />
      </group>
      <ContactShadows position={[0, -1.22, 0]} opacity={0.28} scale={5} blur={2.6} far={3.5} resolution={1024} color="#1d5148" />
      <Environment preset="studio" environmentIntensity={1.15} />
    </>
  );
}

export default function CamOrbitSahnesi() {
  const [cekim, setCekim] = useState(false);

  return (
    <div
      className="cam-orbit-sahnesi"
      data-cam-orbit-version={CAM_ORBIT_SURUM}
      role="img"
      aria-label="Etkileşimli cam orbit görseli"
      onClick={() => setCekim((deger) => !deger)}
    >
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4.7], fov: 34 }} frameloop="always" gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <Sahne cekim={cekim} />
      </Canvas>
      <span className="sr-only">Cam orbiti hareket ettirmek için tıklayın.</span>
    </div>
  );
}
