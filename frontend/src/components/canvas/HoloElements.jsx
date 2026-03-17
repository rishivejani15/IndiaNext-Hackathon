'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Icosahedron } from '@react-three/drei'

export function HoloElements() {
  const ringRef = useRef()
  const ringInnerRef = useRef()
  const markerGroupRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    if (ringRef.current) {
      ringRef.current.rotation.x = 0.72
      ringRef.current.rotation.y = t * 0.065
      ringRef.current.rotation.z = Math.cos(t * 0.05) * 0.03
    }
    if (ringInnerRef.current) {
      ringInnerRef.current.rotation.x = 0.92
      ringInnerRef.current.rotation.y = -t * 0.08
      ringInnerRef.current.rotation.z = Math.sin(t * 0.06) * 0.025
    }
    if (markerGroupRef.current) {
      markerGroupRef.current.rotation.y = t * 0.045
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Minimal tactical arcs */}
      <mesh ref={ringRef} name="accentRing" position={[0, 0.15, -0.2]}>
        <torusGeometry args={[2.75, 0.012, 16, 180, Math.PI * 0.86]} />
        <meshBasicMaterial color="#00ff41" toneMapped={false} transparent opacity={0.56} />
      </mesh>

      <mesh ref={ringInnerRef} position={[0, -0.15, -0.05]}>
        <torusGeometry args={[2.18, 0.01, 14, 140, Math.PI * 0.66]} />
        <meshBasicMaterial color="#75ffaa" toneMapped={false} transparent opacity={0.44} />
      </mesh>

      {/* Sparse markers only, no noisy text clouds */}
      <group ref={markerGroupRef}>
        <group position={[2.35, 0.2, 0.5]}>
          <Icosahedron args={[0.14, 0]}>
            <meshBasicMaterial color="#8cffb8" wireframe transparent opacity={0.65} />
          </Icosahedron>
        </group>
        <group position={[-2.15, -0.55, -0.2]}>
          <Icosahedron args={[0.12, 0]}>
            <meshBasicMaterial color="#6dff9e" wireframe transparent opacity={0.55} />
          </Icosahedron>
        </group>
        <group position={[0.35, 1.1, -0.65]}>
          <Icosahedron args={[0.1, 0]}>
            <meshBasicMaterial color="#9affc4" wireframe transparent opacity={0.45} />
          </Icosahedron>
        </group>
      </group>
    </group>
  )
}
