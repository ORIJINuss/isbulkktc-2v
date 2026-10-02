"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { ContactShadows, CubeCamera, Environment, Sparkles, useTexture } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";

const CAM_RENKLERI = ["#4d9887", "#d9aa67", "#e7a2a7", "#b7d8d0", "#244f4a", "#d8eee6"];
const ILCE_KODLARI = ["GIR", "LEF", "GAM", "GUZ", "ISK", "LEFKE"] as const;
const CAM_ORBIT_SURUM = "physical-material-v3";
type IlceKodu = (typeof ILCE_KODLARI)[number];

type Parca = {
  aci: number;
  yariCap: number;
  yukseklik: number;
  hiz: number;
  boyut: number;
  renk: string;
};

function CamParca({ parca, harita, uydu, mobil, index, ilceAdi }: { parca: Parca; harita: THREE.Texture; uydu: THREE.Texture; mobil: boolean; index: number; ilceAdi: string }) {
  const isimDokusu = useMemo(() => {
    const tuval = document.createElement("canvas");
    tuval.width = 1024;
    tuval.height = 512;
    const ctx = tuval.getContext("2d");
    if (!ctx) return null;
    ctx.translate(1024, 512);
    ctx.rotate(Math.PI);
    ctx.font = "700 92px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.strokeStyle = "rgba(23,63,57,0.9)";
    ctx.lineWidth = 9;
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
    <CubeCamera frames={1} resolution={mobil ? 128 : 256} near={0.1} far={30}>
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
  onKureSec: (ilce?: IlceKodu) => void;
  ilceAdlari: readonly [string, string, string, string, string, string];
};

function sagTikSec(event: ThreeEvent<PointerEvent>, onKureSec: () => void) {
  if (event.nativeEvent.button !== 2) return;
  event.stopPropagation();
  event.nativeEvent.preventDefault();
  onKureSec();
}

function CamParcaciklar({ cekim, mobil, hareketAzaltildi, onKureSec, ilceAdlari }: { cekim: boolean; mobil: boolean; hareketAzaltildi: boolean; onKureSec: (ilce: IlceKodu) => void; ilceAdlari: CamEtkilesimProps["ilceAdlari"] }) {
  const grup = useRef<THREE.Group>(null);
  const [kktcHaritasi, uyduHaritasi] = useTexture([
    "/images/kktc-ilce-atlasi.png",
    "/images/kktc-ilce-atlasi.png",
  ]);
  const parcalar = useMemo<Parca[]>(() => [
    { aci: 0.2, yariCap: 1.72, yukseklik: 0.12, hiz: 0.34, boyut: 0.22, renk: CAM_RENKLERI[0] },
    { aci: 1.55, yariCap: 1.58, yukseklik: -0.25, hiz: -0.28, boyut: 0.15, renk: CAM_RENKLERI[1] },
    { aci: 2.7, yariCap: 1.76, yukseklik: 0.32, hiz: 0.22, boyut: 0.2, renk: CAM_RENKLERI[2] },
    { aci: 4.05, yariCap: 1.62, yukseklik: -0.18, hiz: -0.31, boyut: 0.17, renk: CAM_RENKLERI[3] },
    { aci: 5.2, yariCap: 1.7, yukseklik: 0.28, hiz: 0.26, boyut: 0.13, renk: CAM_RENKLERI[4] },
    { aci: 0.92, yariCap: 1.84, yukseklik: -0.34, hiz: -0.2, boyut: 0.12, renk: CAM_RENKLERI[5] },
  ], []);

  useFrame((_, delta) => {
    if (hareketAzaltildi || !grup.current) return;
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
        const ilceKodu = ILCE_KODLARI[index];
        const ilceAdi = ilceAdlari[index];
        if (!ilceKodu || !ilceAdi) return null;
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
              onKureSec(ilceKodu);
            }}
            onPointerDown={(event: ThreeEvent<PointerEvent>) => {
              if (event.nativeEvent.button === 2) sagTikSec(event, () => onKureSec(ilceKodu));
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
                if (event.nativeEvent.button !== 0) return;
                event.stopPropagation();
                onKureSec(ilceKodu);
              }}
            >
              <sphereGeometry args={[1.015, 32, 32]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
            <CamParca parca={parca} harita={kktcHaritasi} uydu={uyduHaritasi} mobil={mobil} index={index} ilceAdi={ilceAdi} />
          </group>

        );
      })}
    </group>
  );
}

function CamOrbitKure({ cekim, mobil, hareketAzaltildi, onKureSec }: { cekim: boolean; mobil: boolean; hareketAzaltildi: boolean; onKureSec: () => void }) {
  const kure = useRef<THREE.Mesh>(null);
  const kktcHaritasi = useTexture("/images/kktc-uydu-haritasi.jpg");
  kktcHaritasi.colorSpace = THREE.SRGBColorSpace;
  kktcHaritasi.anisotropy = 16;
  kktcHaritasi.wrapS = THREE.ClampToEdgeWrapping;
  kktcHaritasi.wrapT = THREE.ClampToEdgeWrapping;
  kktcHaritasi.repeat.set(1, 1);
  kktcHaritasi.offset.set(0, 0);
  useFrame((state, delta) => {
    if (hareketAzaltildi || !kure.current) return;
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
                if (event.nativeEvent.button !== 0) return;
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
            transmission={mobil ? 0.24 : 0.28}
            thickness={mobil ? 0.32 : 0.42}
            clearcoat={0.68}
            clearcoatRoughness={mobil ? 0.12 : 0.1}
            envMap={texture}
            envMapIntensity={mobil ? 1.2 : 1.25}
            attenuationColor="#8fcbb8"
            attenuationDistance={2.4}
            transparent
            opacity={mobil ? 0.7 : 0.72}
            depthWrite={true}
            side={THREE.FrontSide}
            />
          </mesh>
        </group>
      )}
    </CubeCamera>
  );
}

function Sahne({ cekim, mobil, hareketAzaltildi, onKureSec, ilceAdlari, kaydirma, imlec, kaydirmaIvmesi }: { cekim: boolean; mobil: boolean; hareketAzaltildi: boolean; onKureSec: CamEtkilesimProps["onKureSec"]; ilceAdlari: CamEtkilesimProps["ilceAdlari"]; kaydirma: MutableRefObject<number>; imlec: MutableRefObject<THREE.Vector2>; kaydirmaIvmesi: MutableRefObject<number> }) {
  const { camera, invalidate } = useThree();
  const grup = useRef<THREE.Group>(null);
  const ivme = useRef(0);

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.position.set(0, 0, mobil ? 5.6 : 7.2);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, mobil]);

  useFrame((_, delta) => {
    if (hareketAzaltildi || !grup.current) return;
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
      <group ref={grup}>
        <CamOrbitKure cekim={cekim} mobil={mobil} hareketAzaltildi={hareketAzaltildi} onKureSec={() => onKureSec()} />
        <CamParcaciklar cekim={cekim} mobil={mobil} hareketAzaltildi={hareketAzaltildi} onKureSec={onKureSec} ilceAdlari={ilceAdlari} />
        <Sparkles count={mobil ? 12 : 34} scale={3.4} size={mobil ? 1.2 : 1.6} speed={0.22} color="#fff8e9" opacity={0.72} />
      </group>
      <ContactShadows position={[0, -1.22, 0]} opacity={0.28} scale={5} blur={2.6} far={3.5} resolution={mobil ? 512 : 1024} color="#1d5148" />
      <Environment preset="studio" environmentIntensity={0.72} />
    </>
  );
}

export default function CamOrbitSahnesi({ onKureSec, ilceAdlari }: CamEtkilesimProps) {
  const [cekim, setCekim] = useState(false);
  const [mobil, setMobil] = useState(false);
  const [hareketAzaltildi, setHareketAzaltildi] = useState(false);
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

  useEffect(() => {
    const medya = window.matchMedia("(prefers-reduced-motion: reduce)");
    const guncelle = () => setHareketAzaltildi(medya.matches);
    guncelle();
    medya.addEventListener("change", guncelle);
    return () => medya.removeEventListener("change", guncelle);
  }, []);

  const kureSec = (ilce?: IlceKodu) => {
    setCekim(false);
    window.requestAnimationFrame(() => setCekim(true));
    onKureSec(ilce);
  };

  return (
    <div
      className="cam-orbit-sahnesi"
      data-cam-orbit-version={CAM_ORBIT_SURUM}
      aria-hidden="true"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
        const y = THREE.MathUtils.clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1), -1, 1);
        imlec.current.set(x, y);
      }}
      onPointerLeave={() => imlec.current.set(0, 0)}
    >
      <Canvas dpr={mobil ? [1, 1.2] : [1, 1.5]} camera={{ position: [0, 0, 7.2], fov: 34 }} frameloop={hareketAzaltildi ? "demand" : "always"} gl={{ alpha: true, antialias: !mobil, powerPreference: "high-performance", premultipliedAlpha: true }} onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.domElement.style.background = "transparent"; }} onPointerMissed={() => setCekim((deger) => !deger)} onContextMenu={(event) => event.preventDefault()}>
        <Sahne cekim={cekim} mobil={mobil} hareketAzaltildi={hareketAzaltildi} onKureSec={kureSec} ilceAdlari={ilceAdlari} kaydirma={kaydirma} imlec={imlec} kaydirmaIvmesi={kaydirmaIvmesi} />
      </Canvas>
    </div>
  );
}
