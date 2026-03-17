'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

export function Shield() {
  const shieldRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (shieldRef.current) {
      shieldRef.current.rotation.y = t * 0.05
      shieldRef.current.rotation.z = t * 0.02
    }
  })

  return (
    <group position={[0, 0, -2]}>
      {/* Dark Organic Wireframe Blob */}
      <Sphere ref={shieldRef} args={[4, 32, 32]}>
        <MeshDistortMaterial
          color="#001a00"
          transparent
          opacity={0.8}
          roughness={0.8}
          metalness={0.2}
          distort={0.3}
          speed={1}
          wireframe={true}
        />
      </Sphere>
      
      {/* Inner dark core to prevent seeing completely through the back */}
      <Sphere args={[3.8, 16, 16]}>
        <meshBasicMaterial color="#020502" />
      </Sphere>
    </group>
  )
}
