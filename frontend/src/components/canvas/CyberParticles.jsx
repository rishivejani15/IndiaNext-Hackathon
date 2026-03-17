'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function CyberParticles({ count = 1000 }) {
  const mesh = useRef()
  const lightMesh = useRef()
  
  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const distance = 15
    for (let i = 0; i < count; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360) 
      const phi = THREE.MathUtils.randFloatSpread(360) 

      let x = distance * Math.sin(theta) * Math.cos(phi)
      let y = distance * Math.sin(theta) * Math.sin(phi)
      let z = distance * Math.cos(theta)
      
      positions.set([x, y, z], i * 3)
    }
    return positions
  }, [count])

  // A secondary set of particles for "bits" 0s and 1s flowing around
  const bitParticles = useMemo(() => {
    const positions = new Float32Array(500 * 3)
    const sizes = new Float32Array(500)
    for (let i = 0; i < 500; i++) {
      positions.set([
        (Math.random() - 0.5) * 20,
        Math.random() * 20 - 10,
        (Math.random() - 0.5) * 20
      ], i * 3)
      sizes[i] = Math.random() * 0.5 + 0.1
    }
    return { positions, sizes }
  }, [])

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.getElapsedTime() * 0.05
      mesh.current.rotation.x = state.clock.getElapsedTime() * 0.02
    }
    if (lightMesh.current) {
      lightMesh.current.rotation.y = state.clock.getElapsedTime() * 0.1
      lightMesh.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 2
    }
  })

  return (
    <>
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={particlesPosition}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#00ff41" transparent opacity={0.6} sizeAttenuation />
      </points>

      <points ref={lightMesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={500}
            array={bitParticles.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={500}
            array={bitParticles.sizes}
            itemSize={1}
          />
        </bufferGeometry>
        {/* We use a simple point material for performance, simulating digital dust/bits */}
        <pointsMaterial size={0.1} color="#00aa22" transparent opacity={0.8} toneMapped={false} />
      </points>
    </>
  )
}
