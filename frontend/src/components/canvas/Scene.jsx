'use client'

import { Canvas } from '@react-three/fiber'
import { Html, useProgress, OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import { HackerModel } from './HackerModel'
import { Shield } from './Shield'
import { HoloElements } from './HoloElements'

function Loader() {
  const { progress } = useProgress()
  return <Html center className="text-neon-blue animate-pulse font-mono tracking-widest">{progress.toFixed(2)}% INITIATING</Html>
}

export function AbstractScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0.35, 8.6], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#050605']} />
        <fog attach="fog" args={['#050605', 6, 18]} />
        
        {/* Dramatic Cyberpunk Lighting */}
        <ambientLight intensity={0.34} />
        <pointLight position={[8, 8, 8]} intensity={1.1} color="#4dff88" />
        <pointLight position={[-8, 4, -8]} intensity={0.75} color="#00aa22" />
        <spotLight position={[0, 8, 2]} angle={0.28} penumbra={0.9} intensity={1.15} color="#66ffb0" castShadow />

        <Suspense fallback={<Loader />}>
          <group position={[0, -0.55, 0]}>
            <HackerModel />
            <Shield />
            <HoloElements />
          </group>
        </Suspense>

        <OrbitControls 
          target={[0, -0.08, 0]}
          autoRotate
          autoRotateSpeed={0.24}
          enableDamping
          dampingFactor={0.07}
          rotateSpeed={0.2}
          enableZoom={false} 
          enablePan={false}
          maxPolarAngle={Math.PI / 2 + 0.03}
          minPolarAngle={Math.PI / 2 - 0.08}
          maxAzimuthAngle={0.26}
          minAzimuthAngle={-0.26}
          makeDefault
        />
      </Canvas>
    </div>
  )
}
