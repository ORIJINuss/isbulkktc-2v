"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const RENKLER = ["#f3a953", "#e37b88", "#76c5b1", "#ecc875", "#f3d6cf", "#bfe6dc"];
const PARCA_SAYISI = 42;

type Parca = {
  mesh: THREE.Mesh;
  konum: THREE.Vector3;
  hiz: THREE.Vector3;
  yaricap: number;
  kutle: number;
  donus: THREE.Vector3;
  tohum: number;
};

function KaydirmaKuvveti({ scrollRef }: { scrollRef: React.MutableRefObject<{ y: number; hiz: number }> }) {
  useFrame(({ camera, clock }) => {
    const zaman = clock.getElapsedTime();
    const kaydirma = scrollRef.current.y * 0.0008;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, Math.sin(zaman * 0.08) * 0.38, 2.6, 1 / 60);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.25 - kaydirma * 0.7, 2.6, 1 / 60);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 6.8 - kaydirma * 1.8, 2.6, 1 / 60);
    camera.lookAt(0, 0.15, 0);
    scrollRef.current.hiz *= 0.91;
  });
  return null;
}

function FizikOrbit({ scrollRef }: { scrollRef: React.MutableRefObject<{ y: number; hiz: number }> }) {
  const grup = useRef<THREE.Group>(null);
  const parcalar = useRef<Parca[]>([]);
  const geometri = useMemo(() => new THREE.SphereGeometry(1, 24, 18), []);

  useEffect(() => () => geometri.dispose(), [geometri]);

  useFrame(({ clock }, delta) => {
    const grupNesnesi = grup.current;
    if (!grupNesnesi) return;
    const dt = Math.min(delta, 1 / 30);
    const zaman = clock.getElapsedTime();
    const scroll = scrollRef.current;
    const enerji = Math.min(Math.abs(scroll.hiz) * 0.03, 1.8);

    grupNesnesi.rotation.y = THREE.MathUtils.damp(grupNesnesi.rotation.y, zaman * 0.055 + scroll.y * 0.00034, 2.2, dt);
    grupNesnesi.rotation.x = THREE.MathUtils.damp(grupNesnesi.rotation.x, 0.1 + scroll.hiz * 0.00055, 2.2, dt);
    grupNesnesi.position.y = THREE.MathUtils.damp(grupNesnesi.position.y, Math.sin(zaman * 0.52) * 0.06 - scroll.y * 0.00018, 2.8, dt);

    const parcalarAktif = parcalar.current;
    for (let i = 0; i < parcalarAktif.length; i += 1) {
      const parca = parcalarAktif[i];
      const merkeze = new THREE.Vector3(-parca.konum.x, -parca.konum.y, -parca.konum.z);
      const mesafe = Math.max(merkeze.length(), 0.001);
      const cekim = merkeze.normalize().multiplyScalar(1.15 * Math.min(mesafe, 4));
      const t = zaman * 0.7 + parca.tohum;
      const salinim = new THREE.Vector3(Math.sin(t * 0.9) * 0.035, Math.cos(t * 0.72) * 0.035, Math.sin(t * 0.58) * 0.035);
      const radyal = new THREE.Vector3(parca.konum.x, 0, parca.konum.z);
      const radyalMesafe = Math.max(radyal.length(), 0.001);
      const teget = new THREE.Vector3(-radyal.z, 0, radyal.x).multiplyScalar((scroll.hiz >= 0 ? 1 : -1) * enerji * 2.2 / radyalMesafe);
      const firlatma = radyal.normalize().multiplyScalar(enerji * 0.42);

      parca.hiz.addScaledVector(cekim.add(salinim).add(teget).add(firlatma), dt / parca.kutle);
      parca.hiz.multiplyScalar(Math.pow(0.86, dt * 60));
      parca.konum.addScaledVector(parca.hiz, dt);

      const sinirX = 3.35 - parca.yaricap * 0.45;
      const sinirY = 2.25 - parca.yaricap * 0.45;
      const sinirZ = 1.7 - parca.yaricap * 0.45;
      if (Math.abs(parca.konum.x) > sinirX) { parca.konum.x = Math.sign(parca.konum.x) * sinirX; parca.hiz.x *= -0.32; }
      if (Math.abs(parca.konum.y) > sinirY) { parca.konum.y = Math.sign(parca.konum.y) * sinirY; parca.hiz.y *= -0.32; }
      if (Math.abs(parca.konum.z) > sinirZ) { parca.konum.z = Math.sign(parca.konum.z) * sinirZ; parca.hiz.z *= -0.32; }

      parca.mesh.position.copy(parca.konum);
      parca.mesh.rotation.x += parca.donus.x * dt;
      parca.mesh.rotation.y += parca.donus.y * dt;
      parca.mesh.rotation.z += parca.donus.z * dt;
    }

    for (let i = 0; i < parcalarAktif.length; i += 1) {
      for (let j = i + 1; j < parcalarAktif.length; j += 1) {
        const a = parcalarAktif[i];
        const b = parcalarAktif[j];
        const fark = new THREE.Vector3().subVectors(b.konum, a.konum);
        const mesafe = fark.length();
        const minimum = (a.yaricap + b.yaricap) * 0.76;
        if (mesafe > 0.001 && mesafe < minimum) {
          fark.multiplyScalar((minimum - mesafe) / mesafe * 0.5);
          b.konum.add(fark);
          a.konum.sub(fark);
        }
      }
    }
  });

  return (
    <group ref={grup} position={[0.9, 0.05, 0]} scale={1.15}>
      <mesh rotation={[Math.PI / 2.2, 0.12, 0]}>
        <torusGeometry args={[2.25, 0.012, 10, 160]} />
        <meshBasicMaterial color="#4a7c8e" transparent opacity={0.28} />
      </mesh>
      <mesh rotation={[0.6, 0.25, 0.35]} scale={[1, 0.64, 1]}>
        <torusGeometry args={[2.5, 0.01, 10, 160]} />
        <meshBasicMaterial color="#5fa29d" transparent opacity={0.24} />
      </mesh>
      {Array.from({ length: PARCA_SAYISI }, (_, index) => {
        const yaricap = THREE.MathUtils.lerp(0.13, 0.38, Math.pow((index * 17) % 31 / 30, 1.4));
        const aci = index * 2.39996;
        const mesafe = 0.4 + ((index * 37) % 100) / 100 * 2.5;
        const konum = new THREE.Vector3(Math.cos(aci) * mesafe, ((index * 19) % 100 / 100 - 0.5) * 3.3, Math.sin(aci) * mesafe * 0.66);
        const mesh = new THREE.Mesh(geometri, new THREE.MeshStandardMaterial({ color: RENKLER[index % RENKLER.length], emissive: RENKLER[index % RENKLER.length], emissiveIntensity: 0.12, roughness: 0.26, metalness: 0.08, transparent: true, opacity: 0.98 }));
        mesh.scale.setScalar(yaricap);
        parcalar.current[index] = { mesh, konum, hiz: new THREE.Vector3(), yaricap, kutle: Math.max(0.35, yaricap ** 3 * 18), donus: new THREE.Vector3(0.2 + index * 0.003, 0.16, 0.12), tohum: index * 1.73 };
        return <primitive key={index} object={mesh} />;
      })}
    </group>
  );
}

export default function OrbitSahnesi() {
  const scrollRef = useRef({ y: 0, hiz: 0 });
  useEffect(() => {
    let onceki = window.scrollY;
    const kaydir = () => {
      const y = window.scrollY;
      scrollRef.current.hiz += y - onceki;
      scrollRef.current.y = y;
      onceki = y;
    };
    kaydir();
    window.addEventListener("scroll", kaydir, { passive: true });
    return () => window.removeEventListener("scroll", kaydir);
  }, []);

  return (
    <div className="orbit-3d-sahnesi" aria-hidden="true">
      <Canvas camera={{ position: [0, 0.25, 5.8], fov: 38 }} dpr={[1, 1.75]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={1.05} color="#d7e4e5" />
        <directionalLight position={[-4, 6, 7]} intensity={3.8} color="#fff8ee" />
        <pointLight position={[3, 1, 2]} intensity={18} distance={8} color="#f3a953" />
        <pointLight position={[-3, -1, 1]} intensity={14} distance={7} color="#76c5b1" />
        <KaydirmaKuvveti scrollRef={scrollRef} />
        <FizikOrbit scrollRef={scrollRef} />
        <AdaptiveDpr pixelated />
        <Preload all />
      </Canvas>
    </div>
  );
}
