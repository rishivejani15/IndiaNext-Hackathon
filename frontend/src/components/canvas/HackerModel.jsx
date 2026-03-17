'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

export function HackerModel() {
  const group = useRef()
  const screenRef = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (group.current) {
      group.current.position.y = Math.sin(t * 1.5) * 0.05
      group.current.rotation.y = Math.sin(t * 0.5) * 0.1
    }
    if (screenRef.current) {
      // Simulate scanning/flickering effect on the screen texture
      screenRef.current.opacity = 0.8 + Math.sin(t * 10) * 0.2
    }
  })

  return (
    <group ref={group} position={[0, -0.2, 0]} rotation={[0.2, -0.2, 0]}>
      {/* Laptop Base */}
      <mesh position={[0, 0, 0.6]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2.0, 0.05, 1.4]} />
        <meshStandardMaterial color="#050505" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Laptop Keyboard Area */}
      <mesh position={[0, 0.03, 0.6]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1.8, 1.0]} />
        <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
      </mesh>
      
      {/* Trackpad */}
      <mesh position={[0, 0.031, 1.1]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.6, 0.25]} />
        <meshStandardMaterial color="#080808" roughness={0.6} />
      </mesh>

      {/* Laptop Screen Assembly */}
      <group position={[0, 0.025, -0.1]} rotation={[-Math.PI / 10, 0, 0]}>
        {/* Screen Bezel */}
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[2.0, 1.4, 0.05]} />
          <meshStandardMaterial color="#050505" />
        </mesh>

        {/* Screen Display - Glowing Green Grid */}
        <mesh position={[0, 0.7, 0.026]}>
          <planeGeometry args={[1.9, 1.3]} />
          <meshBasicMaterial ref={screenRef} color="#00ff41" transparent opacity={0.9} wireframe />
        </mesh>
        
        {/* Screen Glass Reflection */}
        <mesh position={[0, 0.7, 0.027]}>
          <planeGeometry args={[1.9, 1.3]} />
          <meshStandardMaterial color="#002209" transparent opacity={0.6} metalness={0.8} roughness={0.1} />
        </mesh>

        {/* Digital Text on Screen */}
        <Text 
          position={[0, 0.7, 0.03]} 
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          ANALYZING THREAT...
        </Text>
      </group>
    </group>
  )
}
