import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import GlobeFallback from './GlobeFallback'

const GLOBE_RADIUS = 2

// Cheap, one-time WebGL capability probe. Returns false when the browser can't
// create a WebGL context (disabled, blocklisted GPU, headless), so we can show
// a static fallback instead of mounting a canvas that will never paint.
function isWebGLAvailable() {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

/* ---------- geometry helpers ---------- */

// Even point distribution on a sphere (Fibonacci lattice) for the "dotted globe".
function fibonacciSphere(count, radius) {
  const points = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    const theta = golden * i
    points[i * 3] = Math.cos(theta) * r * radius
    points[i * 3 + 1] = y * radius
    points[i * 3 + 2] = Math.sin(theta) * r * radius
  }
  return points
}

function latLngToVec3(lat, lng, radius) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

// A great-circle-ish arc that bows away from the surface between two points.
function buildArc(start, end, lift = 0.55) {
  const startV = latLngToVec3(start[0], start[1], GLOBE_RADIUS)
  const endV = latLngToVec3(end[0], end[1], GLOBE_RADIUS)
  const mid = startV.clone().add(endV).multiplyScalar(0.5)
  const distance = startV.distanceTo(endV)
  mid.normalize().multiplyScalar(GLOBE_RADIUS + distance * lift)
  const curve = new THREE.QuadraticBezierCurve3(startV, mid, endV)
  return { curve, points: curve.getPoints(60), startV, endV }
}

// Representative freight lanes (lat/lng endpoints) — purely decorative.
const ROUTES = [
  [
    [40.7, -74.0],
    [51.5, -0.12],
  ], // New York -> London
  [
    [51.5, -0.12],
    [25.2, 55.27],
  ], // London -> Dubai
  [
    [25.2, 55.27],
    [1.35, 103.8],
  ], // Dubai -> Singapore
  [
    [1.35, 103.8],
    [35.6, 139.7],
  ], // Singapore -> Tokyo
  [
    [19.07, 72.87],
    [25.2, 55.27],
  ], // Mumbai -> Dubai
  [
    [-33.86, 151.2],
    [1.35, 103.8],
  ], // Sydney -> Singapore
  [
    [37.77, -122.4],
    [35.6, 139.7],
  ], // San Francisco -> Tokyo
  [
    [48.85, 2.35],
    [40.7, -74.0],
  ], // Paris -> New York
]

/* ---------- sub-components ---------- */

function DottedGlobe() {
  const positions = useMemo(() => fibonacciSphere(1100, GLOBE_RADIUS), [])
  const dotTexture = useMemo(() => {
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    )
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.fill()
    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        map={dotTexture}
        transparent
        depthWrite={false}
        color="#5b6b82"
        sizeAttenuation
        opacity={0.9}
      />
    </points>
  )
}

function RouteArc({ route, index }) {
  const { curve, points, startV, endV } = useMemo(
    () => buildArc(route[0], route[1]),
    [route],
  )
  // Native THREE.Line replaces drei's <Line>. At lineWidth 1 the two are
  // visually identical, and this drops the whole @react-three/drei dependency
  // (and its transitive deps) from the lazy 3D chunk.
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: '#4cc9f0',
      transparent: true,
      opacity: 0.32,
    })
    return new THREE.Line(geometry, material)
  }, [points])

  // Dispose the geometry/material when this arc unmounts or its points change.
  useEffect(() => {
    return () => {
      line.geometry.dispose()
      line.material.dispose()
    }
  }, [line])

  const travellerRef = useRef()
  const speed = 0.16 + (index % 3) * 0.05
  const offset = index * 0.17

  useFrame(({ clock }) => {
    if (!travellerRef.current) return
    const t = (clock.elapsedTime * speed + offset) % 1
    const p = curve.getPointAt(t)
    travellerRef.current.position.copy(p)
    const scale = 0.7 + Math.sin(t * Math.PI) * 0.9
    travellerRef.current.scale.setScalar(scale)
  })

  return (
    <group>
      <primitive object={line} />
      {/* endpoint hubs */}
      <mesh position={startV}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshBasicMaterial color="#ff6a2c" />
      </mesh>
      <mesh position={endV}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshBasicMaterial color="#ff6a2c" />
      </mesh>
      {/* travelling shipment glow */}
      <mesh ref={travellerRef}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#8fe3f7" />
      </mesh>
    </group>
  )
}

function Atmosphere() {
  return (
    <mesh scale={1.18}>
      <sphereGeometry args={[GLOBE_RADIUS, 32, 32]} />
      <meshBasicMaterial
        color="#1b4a63"
        transparent
        opacity={0.12}
        side={THREE.BackSide}
      />
    </mesh>
  )
}

function GlobeRig({ pointer }) {
  const group = useRef()

  useFrame((state, delta) => {
    if (!group.current) return
    // Constant slow spin + gentle parallax lean toward the cursor.
    group.current.rotation.y += delta * 0.06
    const targetX = pointer.current.y * 0.18
    const targetZ = pointer.current.x * 0.12
    group.current.rotation.x += (targetX - group.current.rotation.x) * 0.05
    group.current.rotation.z += (targetZ - group.current.rotation.z) * 0.05
  })

  return (
    <group ref={group} rotation={[0.35, 0, 0.1]}>
      <DottedGlobe />
      <Atmosphere />
      {ROUTES.map((route, i) => (
        <RouteArc key={i} route={route} index={i} />
      ))}
    </group>
  )
}

export default function GlobeScene() {
  const pointer = useRef({ x: 0, y: 0 })
  // Probe once on mount; if WebGL isn't available, skip the canvas entirely.
  const webglOk = useMemo(() => isWebGLAvailable(), [])
  // Reduced-motion users get a single static frame instead of the continuous
  // spin/parallax — the globe is still shown, it just holds still.
  const reduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  // Canvas has pointer-events:none (so it never eats hero clicks), so we read
  // the cursor from a passive window listener instead of canvas events.
  useEffect(() => {
    const onMove = (e) => {
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      }
    }
    if (!webglOk) return
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [webglOk])

  if (!webglOk) return <GlobeFallback />

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 42 }}
      dpr={[1, 1.6]}
      // 'never' renders one frame then holds — no per-frame useFrame updates,
      // so the whole scene is motionless for reduced-motion users.
      frameloop={reduced ? 'never' : 'always'}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.6} />
      <GlobeRig pointer={pointer} />
    </Canvas>
  )
}
