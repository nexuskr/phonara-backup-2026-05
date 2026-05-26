// src/components/HeroScene.tsx
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function PremiumToken() {
  const group = useRef<THREE.Group>(null!);
  const coin = useRef<THREE.Mesh>(null!);
  const ring1 = useRef<THREE.Mesh>(null!);
  const ring2 = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    group.current.rotation.y = t * 0.15;
    if (coin.current) coin.current.position.y = Math.sin(t * 1.6) * 0.1;
    if (ring1.current) ring1.current.rotation.z = t * 0.6;
    if (ring2.current) ring2.current.rotation.z = -t * 0.45;
  });

  return (
    <group ref={group}>
      {/* 메인 코인 */}
      <mesh ref={coin}>
        <cylinderGeometry args={[1.4, 1.4, 0.28, 40]} />
        <meshPhongMaterial
          color="#c026ff"
          shininess={90}
          specular="#ffffff"
          emissive="#6b21a8"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 링 1 */}
      <mesh ref={ring1} rotation={[1.1, 0, 0]}>
        <torusGeometry args={[1.95, 0.05, 10, 50]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.7} />
      </mesh>

      {/* 링 2 */}
      <mesh ref={ring2} rotation={[-0.85, 0, 0]}>
        <torusGeometry args={[2.4, 0.035, 10, 50]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="w-full h-50 relative -mt-8 mb-2">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ background: "transparent" }}
        dpr={[1, 1.4]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false,
        }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[6, 5, 6]} intensity={1.6} color="#c026ff" />
        <pointLight position={[-6, -5, -6]} intensity={0.7} color="#67e8f9" />

        <PremiumToken />
      </Canvas>
    </div>
  );
}
