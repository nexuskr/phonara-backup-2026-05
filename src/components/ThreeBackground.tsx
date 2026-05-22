import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticlesProps {
  count?: number;
  color?: string;
  size?: number;
}

function Particles({ count = 420, color = '#EAB308', size = 0.045 }: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null!);

  // Generate random positions
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 18; // spread
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      // Very slow, elegant rotation
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.015;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.008) * 0.2;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.7}
        sizeAttenuation={true}
      />
    </points>
  );
}

interface ThreeBackgroundProps {
  className?: string;
}

export default function ThreeBackground({ className = '' }: ThreeBackgroundProps) {
  return (
    <div className={`fixed inset-0 -z-10 ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 12], fov: 50 }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.4]}           // Limit resolution for mobile
        gl={{
          alpha: true,
          antialias: false,      // Better performance on mobile
          powerPreference: 'high-performance',
        }}
      >
        <Particles count={420} color="#EAB308" size={0.048} />
        {/* Optional subtle second layer */}
        <Particles count={180} color="#22D3EE" size={0.035} />
      </Canvas>
    </div>
  );
}
