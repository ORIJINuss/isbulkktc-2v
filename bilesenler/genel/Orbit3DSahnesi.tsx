"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const RENKLER = ["#f3a953", "#e37b88", "#76c5b1", "#ecc875", "#f3d6cf", "#bfe6dc"];
const PARCA_SAYISI = 32;

type ScrollDurumu = { y: number; hiz: number };
type Parca = { position: THREE.Vector3; velocity: THREE.Vector3; radius: number; mass: number; seed: number; spin: number };

function KaydirmaKuvveti({ scrollRef }: { scrollRef: React.MutableRefObject<ScrollDurumu> }) {
  useFrame(({ camera, clock }, delta) => {
    const t = clock.getElapsedTime();
    const scroll = scrollRef.current;
    const normalized = THREE.MathUtils.clamp(scroll.y / 900, -1, 3);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, 0.18 + Math.sin(t * 0.18) * 0.12, 2.4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.1 - normalized * 0.12, 2.4, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, 6.2 - normalized * 0.25, 2.4, delta);
    camera.lookAt(0.8, -0.05, 0);
    scroll.hiz *= Math.pow(0.86, delta * 60);
  });
  return null;
}

function FizikOrbit({ scrollRef }: { scrollRef: React.MutableRefObject<ScrollDurumu> }) {
  const grup = useRef<THREE.Group>(null);
  const meshRefs = useRef<Array<THREE.Mesh | null>>([]);
  const parcalar = useRef<Parca[]>([]);
  const geometri = useMemo(() => new THREE.SphereGeometry(1, 32, 24), []);

  const ilkParcalar = useMemo(() => Array.from({ length: PARCA_SAYISI }, (_, i) => {
    const radius = THREE.MathUtils.lerp(0.14, 0.39, ((i * 29) % 100) / 100);
    const angle = i * 2.39996;
    const distance = 0.5 + ((i * 41) % 100) / 100 * 2.0;
    return {
      position: new THREE.Vector3(Math.cos(angle) * distance, (((i * 17) % 100) / 100 - 0.5) * 2.5, Math.sin(angle) * distance * 0.62),
      velocity: new THREE.Vector3(),
      radius,
      mass: Math.max(0.55, radius ** 3 * 20),
      seed: i * 1.83,
      spin: 0.18 + i * 0.004,
    } satisfies Parca;
  }), []);

  useEffect(() => {
    parcalar.current = ilkParcalar.map((p) => ({ ...p, position: p.position.clone(), velocity: p.velocity.clone() }));
    return () => geometri.dispose();
  }, [geometri, ilkParcalar]);

  useFrame(({ clock }, delta) => {
    const root = grup.current;
    if (!root) return;
    const dt = Math.min(delta, 1 / 30);
    const t = clock.getElapsedTime();
    const scroll = scrollRef.current;
    const vortex = THREE.MathUtils.clamp(Math.abs(scroll.hiz) * 0.025, 0, 1.4);

    root.rotation.y = THREE.MathUtils.damp(root.rotation.y, -0.22 + t * 0.045 + scroll.y * 0.0002, 1.8, dt);
    root.rotation.z = THREE.MathUtils.damp(root.rotation.z, -0.1 + scroll.hiz * 0.00028, 1.8, dt);
    root.position.y = THREE.MathUtils.damp(root.position.y, Math.sin(t * 0.45) * 0.06 - scroll.y * 0.00012, 2, dt);

    const items = parcalar.current;
    items.forEach((item, index) => {
      const radial = new THREE.Vector3(item.position.x, 0, item.position.z);
      const radialLength = Math.max(radial.length(), 0.001);
      const inward = radial.clone().multiplyScalar(-1.2 / radialLength);
      const tangent = new THREE.Vector3(-radial.z, 0, radial.x).multiplyScalar((scroll.hiz >= 0 ? 1 : -1) * vortex * 1.8 / radialLength);
      const spring = radial.clone().multiplyScalar(-0.3);
      const wobble = new THREE.Vector3(Math.sin(t * 0.8 + item.seed) * 0.045, Math.cos(t * 0.65 + item.seed) * 0.04, Math.sin(t * 0.52 + item.seed) * 0.045);
      item.velocity.addScaledVector(inward.add(tangent).add(spring).add(wobble), dt / item.mass);
      item.velocity.multiplyScalar(Math.pow(0.88, dt * 60));
      item.position.addScaledVector(item.velocity, dt);

      const bounds = { x: 2.65 - item.radius, y: 1.9 - item.radius, z: 1.25 - item.radius };
      if (Math.abs(item.position.x) > bounds.x) { item.position.x = Math.sign(item.position.x) * bounds.x; item.velocity.x *= -0.45; }
      if (Math.abs(item.position.y) > bounds.y) { item.position.y = Math.sign(item.position.y) * bounds.y; item.velocity.y *= -0.45; }
      if (Math.abs(item.position.z) > bounds.z) { item.position.z = Math.sign(item.position.z) * bounds.z; item.velocity.z *= -0.45; }

      const mesh = meshRefs.current[index];
      if (!mesh) return;
      mesh.position.copy(item.position);
      mesh.rotation.x += item.spin * dt;
      mesh.rotation.y += item.spin * 0.72 * dt;
    });

    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        const difference = b.position.clone().sub(a.position);
        const distance = difference.length();
        const minimum = (a.radius + b.radius) * 0.92;
        if (distance > 0.001 && distance < minimum) {
          difference.multiplyScalar((minimum - distance) / distance * 0.5);
          b.position.add(difference);
          a.position.sub(difference);
        }
      }
    }
  });

  return (
    <group ref={grup} position={[0.72, 0.02, 0]} scale={1.42}>
      <mesh rotation={[Math.PI / 2.3, 0.1, 0]}>
        <torusGeometry args={[2.1, 0.012, 12, 160]} />
        <meshBasicMaterial color="#4a7c8e" transparent opacity={0.62} />
      </mesh>
      <mesh rotation={[0.64, 0.25, 0.35]} scale={[1, 0.62, 1]}>
        <torusGeometry args={[2.25, 0.012, 12, 160]} />
        <meshBasicMaterial color="#5fa29d" transparent opacity={0.5} />
      </mesh>
      <mesh rotation={[0.2, 0.75, 0.18]} scale={[1, 0.7, 1]}>
        <torusGeometry args={[1.82, 0.009, 12, 160]} />
        <meshBasicMaterial color="#d8a35b" transparent opacity={0.42} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.34, 32, 24]} />
        <meshStandardMaterial color="#9ed2c6" emissive="#4e9586" emissiveIntensity={0.22} roughness={0.18} metalness={0.08} />
      </mesh>
      {ilkParcalar.map((item, index) => (
        <mesh key={item.seed} ref={(mesh) => { meshRefs.current[index] = mesh; }} scale={item.radius} geometry={geometri}>
          <meshStandardMaterial color={RENKLER[index % RENKLER.length]} emissive={RENKLER[index % RENKLER.length]} emissiveIntensity={0.1} roughness={0.2} metalness={0.08} />
        </mesh>
      ))}
    </group>
  );
}

export default function OrbitSahnesi() {
  const scrollRef = useRef<ScrollDurumu>({ y: 0, hiz: 0 });
  useEffect(() => {
    let previous = window.scrollY;
    const onScroll = () => {
      const current = window.scrollY;
      scrollRef.current.hiz += current - previous;
      scrollRef.current.y = current;
      previous = current;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="orbit-3d-sahnesi" aria-hidden="true">
      <div className="orbit-focal" />
      <Canvas camera={{ position: [0, 0.1, 6.2], fov: 39 }} dpr={[1, 2]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <ambientLight intensity={0.9} color="#e6f0ed" />
        <directionalLight position={[-4, 5, 6]} intensity={3.5} color="#fff7e8" />
        <pointLight position={[3, 1, 2]} intensity={14} distance={8} color="#f3a953" />
        <pointLight position={[-3, -1, 1]} intensity={10} distance={7} color="#76c5b1" />
        <KaydirmaKuvveti scrollRef={scrollRef} />
        <FizikOrbit scrollRef={scrollRef} />
        <AdaptiveDpr pixelated />
        <Preload all />
      </Canvas>
    </div>
  );
}
