"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { ContactShadows, CubeCamera, Environment, Sparkles, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";

const CAM_RENKLERI = ["#4d9887", "#d9aa67", "#e7a2a7", "#b7d8d0", "#244f4a", "#d8eee6"];
const CAM_ORBIT_SURUM = "physical-material-v2";

type Parca = {
  aci: number;
  yariCap: number;
  yukseklik: number;
  hiz: number;
  boyut: number;
  renk: string;
};

function CamParca({ parca, harita, uydu, index, ilceAdi }: { parca: Parca; harita: THREE.Texture; uydu: THREE.Texture; index: number; ilceAdi: string }) {
  const isimDokusu = useMemo(() => {
    const tuval = document.createElement("canvas");
    tuval.width = 1024;
    tuval.height = 512;
    const ctx = tuval.getContext("2d");
    if (!ctx) return null;
    ctx.translate(1024, 512);
    ctx.rotate(Math.PI);
    ctx.font = "700 68px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.strokeStyle = "rgba(23,63,57,0.9)";
    ctx.lineWidth = 7;
    ctx.strokeText(ilceAdi, 512, 256);
    ctx.fillText(ilceAdi, 512, 256);
    const texture = new THREE.CanvasTexture(tuval);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 16;
    texture.needsUpdate = true;
    return texture;
  }, [ilceAdi]);
  const ilceHaritasi = useMemo(() => {
    const kopya = harita.clone();
    const uyduKopya = uydu.clone();
    const ilceKadrajlari: Array<{ tekrar: [number, number]; konum: [number, number] }> = [
      { tekrar: [0.34, 0.52], konum: [0, 0.48] },
      { tekrar: [0.34, 0.52], konum: [0.33, 0.48] },
      { tekrar: [0.34, 0.52], konum: [0.66, 0.48] },
      { tekrar: [0.34, 0.52], konum: [0, 0] },
      { tekrar: [0.34, 0.52], konum: [0.33, 0] },
      { tekrar: [0.34, 0.52], konum: [0.66, 0] },
    ];
    const kadraj = ilceKadrajlari[index] ?? ilceKadrajlari[0];
    kopya.repeat.set(...kadraj.tekrar);
    kopya.offset.set(...kadraj.konum);
    kopya.wrapS = THREE.ClampToEdgeWrapping;
    kopya.wrapT = THREE.ClampToEdgeWrapping;
    kopya.colorSpace = THREE.SRGBColorSpace;
    kopya.anisotropy = 16;
    uyduKopya.repeat.copy(kopya.repeat);
    uyduKopya.offset.copy(kopya.offset);
    uyduKopya.wrapS = THREE.ClampToEdgeWrapping;
    uyduKopya.wrapT = THREE.ClampToEdgeWrapping;
    uyduKopya.colorSpace = THREE.SRGBColorSpace;
    uyduKopya.anisotropy = 16;
    kopya.needsUpdate = true;
    uyduKopya.needsUpdate = true;
    return { sinir: kopya, uydu: uyduKopya };
  }, [harita, uydu, index]);

  return (
    <CubeCamera frames={1} resolution={512} near={0.1} far={30}>
      {(yansima) => (
        <group>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[1, 64, 64]} />
            <meshPhysicalMaterial
              color="#ffffff"
              metalness={0}
              transmission={0.9}
              thickness={0.72}
              roughness={0.075}
              ior={1.46}
              clearcoat={0.72}
              clearcoatRoughness={0.055}
              iridescence={0.08}
              iridescenceIOR={1.33}
              map={ilceHaritasi.sinir}
              envMap={yansima}
              envMapIntensity={1.65}
              attenuationColor={parca.renk}
              attenuationDistance={1.8}
              transparent
              opacity={0.82}
              depthWrite={true}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh scale={1.006}>
            <icosahedronGeometry args={[1, 8]} />
            <meshBasicMaterial map={ilceHaritasi.uydu} transparent opacity={0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          {isimDokusu && (
            <mesh scale={1.012}>
              <sphereGeometry args={[1, 96, 96]} />
              <meshBasicMaterial map={isimDokusu} transparent opacity={0.82} depthTest={true} depthWrite={false} />
            </mesh>
          )}
        </group>
      )}
    </CubeCamera>
  );
}

type CamEtkilesimProps = {
  onKureSec: (ilce?: string) => void;
};

function sagTikSec(event: ThreeEvent<PointerEvent>, onKureSec: () => void) {
  if (event.nativeEvent.button !== 2) return;
  event.stopPropagation();
  event.nativeEvent.preventDefault();
  onKureSec();
}

function CamParcaciklar({ cekim, mobil, onKureSec }: { cekim: boolean; mobil: boolean; onKureSec: (ilce: string) => void }) {
  const grup = useRef<THREE.Group>(null);
  const [kktcHaritasi, uyduHaritasi] = useTexture([
    "/images/kktc-ilce-atlasi.png",
    "/images/kktc-ilce-atlasi.png",
  ]);
  const ilceAdlari = ["Girne", "Lefkoşa", "Gazimağusa", "Güzelyurt", "İskele", "Lefke"] as const;
  const parcalar = useMemo<Parca[]>(() => [
    { aci: 0.2, yariCap: 1.72, yukseklik: 0.12, hiz: 0.34, boyut: 0.22, renk: CAM_RENKLERI[0] },
    { aci: 1.55, yariCap: 1.58, yukseklik: -0.25, hiz: -0.28, boyut: 0.15, renk: CAM_RENKLERI[1] },
    { aci: 2.7, yariCap: 1.76, yukseklik: 0.32, hiz: 0.22, boyut: 0.2, renk: CAM_RENKLERI[2] },
    { aci: 4.05, yariCap: 1.62, yukseklik: -0.18, hiz: -0.31, boyut: 0.17, renk: CAM_RENKLERI[3] },
    { aci: 5.2, yariCap: 1.7, yukseklik: 0.28, hiz: 0.26, boyut: 0.13, renk: CAM_RENKLERI[4] },
    { aci: 0.92, yariCap: 1.84, yukseklik: -0.34, hiz: -0.2, boyut: 0.12, renk: CAM_RENKLERI[5] },
  ], []);

  useFrame((_, delta) => {
    if (!grup.current) return;
    grup.current.rotation.y += delta * (cekim ? 0.5 : 0.12);
    grup.current.rotation.z = THREE.MathUtils.damp(grup.current.rotation.z, cekim ? -0.16 : 0.04, 3, delta);
    grup.current.children.forEach((cocuk, index) => {
      const parca = parcalar[index];
      const hedef = cekim ? 0.62 : 1;
      const uzaklik = Math.hypot(cocuk.position.x, cocuk.position.z) || 1;
      const minimumAnaKureUzakligi = 1.02 + parca.boyut + 0.12;
      const hedefUzaklik = Math.max(parca.yariCap * hedef, minimumAnaKureUzakligi);
      const yeniUzaklik = THREE.MathUtils.damp(uzaklik, hedefUzaklik, 3.2, delta);
      const oran = yeniUzaklik / uzaklik;
      cocuk.position.x *= oran;
      cocuk.position.z *= oran;
      cocuk.position.y = THREE.MathUtils.damp(cocuk.position.y, parca.yukseklik * (cekim ? 0.82 : 1), 2.4, delta);
      const hedefBoyut = parca.boyut * (cocuk.userData.hovered ? 1.18 : 1);
      const boyut = THREE.MathUtils.damp(cocuk.scale.x, hedefBoyut, cocuk.userData.hovered ? 9 : 5, delta);
      cocuk.scale.setScalar(boyut);
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
          <group
            key={index}
            position={[x, parca.yukseklik, z]}
            scale={parca.boyut}
            onContextMenu={(event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation();
              event.nativeEvent.preventDefault();
              onKureSec(ilceAdlari[index]);
            }}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
              if (event.nativeEvent.button === 2) sagTikSec(event, () => onKureSec(ilceAdlari[index]));
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              if (event.object.parent) event.object.parent.userData.hovered = true;
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(event) => {
              event.stopPropagation();
              if (event.object.parent) event.object.parent.userData.hovered = false;
              document.body.style.cursor = "";
            }}
          >
            <mesh
              userData={{ kureHit: true }}
              raycast={THREE.Mesh.prototype.raycast}
              onPointerDown={(event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                onKureSec(ilceAdlari[index]);
              }}
            >
              <sphereGeometry args={[1.015, 32, 32]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <CamParca parca={parca} harita={kktcHaritasi} uydu={uyduHaritasi} index={index} ilceAdi={ilceAdlari[index]} />
          </group>

        );
      })}
    </group>
  );
}

function CamOrbitKure({ cekim, mobil, onKureSec }: { cekim: boolean; mobil: boolean; onKureSec: () => void }) {
  const kure = useRef<THREE.Mesh>(null);
  const kktcHaritasi = useTexture("/images/kktc-uydu-haritasi.jpg");
  kktcHaritasi.colorSpace = THREE.SRGBColorSpace;
  kktcHaritasi.anisotropy = 16;
  kktcHaritasi.wrapS = THREE.ClampToEdgeWrapping;
  kktcHaritasi.wrapT = THREE.ClampToEdgeWrapping;
  kktcHaritasi.repeat.set(1, 1);
  kktcHaritasi.offset.set(0, 0);
  useFrame((state, delta) => {
    if (!kure.current) return;
    kure.current.rotation.y += delta * (cekim ? 0.28 : 0.08);
    kure.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.32) * 0.045;
    const hedef = (cekim ? 1.07 : 1) * (kure.current.userData.hovered ? 1.08 : 1);
    const hoverDamp = 1 - Math.exp(-delta * 12);
    kure.current.scale.lerp(new THREE.Vector3(hedef, hedef, hedef), hoverDamp);
  });

  return (
    <CubeCamera frames={1} resolution={mobil ? 256 : 512} near={0.1} far={100}>
      {(texture) => (
        <group>
          <mesh
            ref={kure}
            castShadow
            receiveShadow
            onContextMenu={(event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation();
              event.nativeEvent.preventDefault();
              onKureSec();
            }}
              onPointerDown={(event: ThreeEvent<PointerEvent>) => {
                event.stopPropagation();
                event.nativeEvent.preventDefault();
                onKureSec();
              }}
            onPointerOver={(event) => {
              event.stopPropagation();
              event.object.userData.hovered = true;
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(event) => {
              event.stopPropagation();
              event.object.userData.hovered = false;
              document.body.style.cursor = "";
            }}
          >
            <sphereGeometry args={[1.02, 128, 128]} />
          <meshPhysicalMaterial
            map={kktcHaritasi}
            color="#ffffff"
            metalness={0.01}
            roughness={mobil ? 0.16 : 0.14}
            ior={1.46}
            transmission={mobil ? 0.22 : 0.34}
            thickness={mobil ? 0.32 : 0.42}
            clearcoat={0.78}
            clearcoatRoughness={mobil ? 0.1 : 0.08}
            envMap={texture}
            envMapIntensity={mobil ? 1.8 : 1.55}
            attenuationColor="#8fcbb8"
            attenuationDistance={2.4}
            transparent
            opacity={mobil ? 0.42 : 0.58}
            depthWrite={true}
            side={THREE.FrontSide}
            />
          </mesh>
        </group>
      )}
    </CubeCamera>
  );
}

function Sahne({ cekim, mobil, onKureSec, kaydirma, imlec, kaydirmaIvmesi }: { cekim: boolean; mobil: boolean; onKureSec: CamEtkilesimProps["onKureSec"]; kaydirma: MutableRefObject<number>; imlec: MutableRefObject<THREE.Vector2>; kaydirmaIvmesi: MutableRefObject<number> }) {
  const grup = useRef<THREE.Group>(null);
  const ivme = useRef(0);

  useFrame((_, delta) => {
    if (!grup.current) return;
    const ilerleme = kaydirma.current;
    const imlecX = imlec.current.x;
    const imlecY = imlec.current.y;
    const takipX = THREE.MathUtils.clamp(imlecX, -1, 1);
    const takipY = THREE.MathUtils.clamp(imlecY, -1, 1);
    ivme.current = THREE.MathUtils.damp(ivme.current, 0, 3.2, delta);
    kaydirmaIvmesi.current = THREE.MathUtils.damp(kaydirmaIvmesi.current, 0, 2.8, delta);
    grup.current.rotation.x = THREE.MathUtils.damp(grup.current.rotation.x, takipY * -0.34 + ilerleme * 0.22 + ivme.current * 0.12, 18, delta);
    grup.current.rotation.y = THREE.MathUtils.damp(grup.current.rotation.y, takipX * 0.52 + ilerleme * 0.5 + kaydirmaIvmesi.current * 0.7 + ivme.current * 0.42, 18, delta);
    grup.current.rotation.z = THREE.MathUtils.damp(grup.current.rotation.z, takipX * takipY * 0.16, 16, delta);
    grup.current.position.y = THREE.MathUtils.damp(grup.current.position.y, takipY * 0.2 + ilerleme * (mobil ? -0.2 : -0.36), 4, delta);
    grup.current.position.x = THREE.MathUtils.damp(grup.current.position.x, takipX * 0.24 + ilerleme * (mobil ? 0.07 : 0.2), 4, delta);
  });

  return (
    <>
      <color attach="background" args={["#f6f5ef"]} />
      <ambientLight intensity={1.4} color="#eaf4ef" />
      <directionalLight position={[-3, 4, 5]} intensity={3.2} color="#fff8e9" castShadow />
      <pointLight position={[3, 1, 2]} intensity={2.4} color="#82c9b2" />
      <pointLight position={[-2, -1, 1]} intensity={1.5} color="#e6b77b" />
      <group ref={grup} position={[0.4, 0, 0]}>
        <CamOrbitKure cekim={cekim} mobil={mobil} onKureSec={() => onKureSec()} />
        <CamParcaciklar cekim={cekim} mobil={mobil} onKureSec={(ilce) => onKureSec(ilce)} />
        <Sparkles count={mobil ? 12 : 34} scale={3.4} size={mobil ? 1.2 : 1.6} speed={0.22} color="#fff8e9" opacity={0.72} />
      </group>
      <ContactShadows position={[0, -1.22, 0]} opacity={0.28} scale={5} blur={2.6} far={3.5} resolution={mobil ? 512 : 1024} color="#1d5148" />
      <Environment preset="studio" environmentIntensity={0.72} />
    </>
  );
}

export default function CamOrbitSahnesi({ onKureSec }: CamEtkilesimProps) {
  const [cekim, setCekim] = useState(false);
  const [mobil, setMobil] = useState(false);
  const kaydirma = useRef(0);
  const imlec = useRef(new THREE.Vector2());
  const kaydirmaIvmesi = useRef(0);

  useEffect(() => {
    let oncekiKaydirma = window.scrollY;
    const guncelle = () => {
      const delta = window.scrollY - oncekiKaydirma;
      oncekiKaydirma = window.scrollY;
      const toplam = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      kaydirma.current = THREE.MathUtils.clamp(window.scrollY / toplam, 0, 1);
      kaydirmaIvmesi.current = THREE.MathUtils.clamp(delta / 180, -1, 1);
    };
    guncelle();
    window.addEventListener("scroll", guncelle, { passive: true });
    window.addEventListener("resize", guncelle, { passive: true });
    return () => {
      window.removeEventListener("scroll", guncelle);
      window.removeEventListener("resize", guncelle);
    };
  }, []);

  useEffect(() => {
    const medya = window.matchMedia("(max-width: 767px)");
    const guncelle = () => setMobil(medya.matches);
    guncelle();
    medya.addEventListener("change", guncelle);
    return () => medya.removeEventListener("change", guncelle);
  }, []);

  const kureSec = (ilce?: string) => {
    setCekim(false);
    window.requestAnimationFrame(() => setCekim(true));
    onKureSec(ilce);
  };

  return (
    <div
      className="cam-orbit-sahnesi"
      data-cam-orbit-version={CAM_ORBIT_SURUM}
      role="img"
      aria-label="Etkileşimli cam orbit görseli"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
        const y = THREE.MathUtils.clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1), -1, 1);
        imlec.current.set(x, y);
      }}
      onPointerLeave={() => imlec.current.set(0, 0)}
    >
      <Canvas dpr={mobil ? [1, 1.35] : [1, 2]} camera={{ position: [0, 0, mobil ? 5.8 : 5.35], fov: mobil ? 32 : 29 }} frameloop="always" gl={{ alpha: true, antialias: !mobil, powerPreference: "high-performance" }} onPointerMissed={() => setCekim((deger) => !deger)} onContextMenu={(event) => event.preventDefault()}>
        <Sahne cekim={cekim} mobil={mobil} onKureSec={kureSec} kaydirma={kaydirma} imlec={imlec} kaydirmaIvmesi={kaydirmaIvmesi} />
      </Canvas>
      <span className="sr-only">Cam orbiti hareket ettirmek için tıklayın.</span>
    </div>
  );
}
