import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import TruckFallback from './TruckFallback'

/* ---------- capability probe (shared pattern with GlobeScene) ---------- */

// Cheap, one-time WebGL capability probe. Returns false when the browser can't
// create a WebGL context, so we can show a static fallback instead of mounting
// a canvas that will never paint.
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

/* ---------- scene constants ---------- */

// The truck drives left→right along X as scroll progress goes 0→1.
const PATH_START = -9
const PATH_END = 9
const WHEEL_RADIUS = 0.62

// Cinematic camera: five offsets from the truck's world position. The active
// band is chosen from scroll progress and the offset is lerped between the two
// bracketing keyframes — wide establishing → side push-in → cruising 3/4 →
// swoop over the top → settled delivery shot.
const CAM_BANDS = [
  new THREE.Vector3(3, 6.5, 16), // 0.00  establishing wide
  new THREE.Vector3(-11, 2.4, 7), // 0.25  low side push-in
  new THREE.Vector3(-7.5, 4, 11), // 0.50  cruising 3/4 front
  new THREE.Vector3(9, 6.5, 6), // 0.75  swoop over the far side
  new THREE.Vector3(0.5, 3, 13.5), // 1.00  final delivery shot
]
const LOOK_OFFSET = new THREE.Vector3(0, 1.4, 0)

// Wheel X positions (truck-local); mirrored on both sides (±Z).
const WHEEL_X = [3.1, -0.6, -3.9]
const WHEEL_Z = 1.15

// Lane dashes down the road centreline so travel reads clearly.
const LANE_DASHES = Array.from({ length: 14 }, (_, i) => -13 + i * 2)

/* ---------- sub-components ---------- */

function Wheel({ position, segments, wheelRef }) {
  return (
    // Outer group owns the rolling rotation (about Z). The inner mesh only
    // orients the cylinder so its axis runs along Z (side-facing disc).
    <group position={position} ref={wheelRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.4, segments]} />
        <meshStandardMaterial color="#0d1119" roughness={0.75} metalness={0.2} />
      </mesh>
      {/* hub cap — makes the roll visible */}
      <mesh position={[0, 0, WHEEL_Z > 0 ? 0.22 : -0.22]}>
        <cylinderGeometry args={[0.2, 0.2, 0.06, Math.max(6, segments / 2)]} />
        <meshStandardMaterial color="#93a0b4" roughness={0.4} metalness={0.6} />
      </mesh>
    </group>
  )
}

function Truck({ segments, truckRef, wheels }) {
  return (
    <group ref={truckRef} position={[PATH_START, 0, 0]}>
      {/* chassis rail */}
      <mesh position={[-0.6, 1.0, 0]} castShadow>
        <boxGeometry args={[8.2, 0.35, 2.1]} />
        <meshStandardMaterial color="#0d1119" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* trailer box */}
      <mesh position={[-2.4, 2.9, 0]} castShadow>
        <boxGeometry args={[6.2, 3.2, 2.5]} />
        <meshStandardMaterial color="#c7d0dd" roughness={0.35} metalness={0.35} />
      </mesh>
      {/* trailer accent stripe */}
      <mesh position={[-2.4, 2.9, 1.27]}>
        <boxGeometry args={[6.2, 0.5, 0.02]} />
        <meshStandardMaterial
          color="#ff6a2c"
          emissive="#ff6a2c"
          emissiveIntensity={0.35}
          roughness={0.4}
        />
      </mesh>

      {/* cab */}
      <mesh position={[2.4, 2.2, 0]} castShadow>
        <boxGeometry args={[2.0, 2.4, 2.4]} />
        <meshStandardMaterial color="#ff6a2c" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* hood */}
      <mesh position={[3.7, 1.45, 0]} castShadow>
        <boxGeometry args={[1.1, 1.3, 2.3]} />
        <meshStandardMaterial color="#ff6a2c" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* windshield */}
      <mesh position={[1.9, 2.85, 0]}>
        <boxGeometry args={[0.12, 1.1, 2.0]} />
        <meshStandardMaterial
          color="#8fe3f7"
          emissive="#4cc9f0"
          emissiveIntensity={0.25}
          roughness={0.1}
          metalness={0.6}
        />
      </mesh>

      {/* wheels — both sides */}
      {WHEEL_X.map((x, i) => (
        <Wheel
          key={`r-${i}`}
          position={[x, WHEEL_RADIUS, WHEEL_Z]}
          segments={segments}
          wheelRef={(el) => (wheels.current[i * 2] = el)}
        />
      ))}
      {WHEEL_X.map((x, i) => (
        <Wheel
          key={`l-${i}`}
          position={[x, WHEEL_RADIUS, -WHEEL_Z]}
          segments={segments}
          wheelRef={(el) => (wheels.current[i * 2 + 1] = el)}
        />
      ))}
    </group>
  )
}

function TruckRig({ progressRef, segments }) {
  const truckRef = useRef()
  const wheels = useRef([])
  const eased = useRef(0)
  const { camera } = useThree()

  // Scratch vectors reused every frame — no per-frame allocation.
  const truckPos = useMemo(() => new THREE.Vector3(), [])
  const offset = useMemo(() => new THREE.Vector3(), [])
  const lookAt = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    const truck = truckRef.current
    if (!truck) return

    // Ease toward the scroll-driven target so motion stays silky no matter how
    // coarse the scrub updates are. progressRef is written by the section's
    // ScrollTrigger, so the truck only moves when the user scrolls.
    const prev = eased.current
    const cur = prev + (progressRef.current - prev) * 0.12
    eased.current = cur

    const x = THREE.MathUtils.lerp(PATH_START, PATH_END, cur)
    const prevX = THREE.MathUtils.lerp(PATH_START, PATH_END, prev)
    truck.position.x = x

    // Wheels roll by the DISTANCE ACTUALLY TRAVELLED between frames, so they
    // look right whether you scroll fast or slow, and stop when you stop.
    const roll = (x - prevX) / WHEEL_RADIUS
    const list = wheels.current
    for (let i = 0; i < list.length; i++) {
      if (list[i]) list[i].rotation.z -= roll
    }

    // Cinematic camera: pick the band, lerp the offset from truck position.
    truck.getWorldPosition(truckPos)
    const spans = CAM_BANDS.length - 1
    const scaled = THREE.MathUtils.clamp(cur, 0, 1) * spans
    const i = Math.min(spans - 1, Math.floor(scaled))
    const t = scaled - i
    const a = CAM_BANDS[i]
    const b = CAM_BANDS[i + 1]
    offset.set(
      THREE.MathUtils.lerp(a.x, b.x, t),
      THREE.MathUtils.lerp(a.y, b.y, t),
      THREE.MathUtils.lerp(a.z, b.z, t),
    )
    camera.position.copy(truckPos).add(offset)
    lookAt.copy(truckPos).add(LOOK_OFFSET)
    camera.lookAt(lookAt)
  })

  return (
    <>
      <Truck segments={segments} truckRef={truckRef} wheels={wheels} />
      {/* ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 40]} />
        <meshStandardMaterial color="#080b12" roughness={1} />
      </mesh>
      {/* lane dashes */}
      {LANE_DASHES.map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, 0]}>
          <planeGeometry args={[1.1, 0.18]} />
          <meshStandardMaterial
            color="#ff6a2c"
            emissive="#ff6a2c"
            emissiveIntensity={0.3}
            roughness={0.5}
          />
        </mesh>
      ))}
    </>
  )
}

/**
 * Scroll-driven 3D truck built from primitive geometry only (no external model).
 * Position + camera + wheels are all derived from a scroll-progress ref written
 * by the host section's ScrollTrigger — nothing here runs on real time.
 *
 * @param {{ current: number }} progressRef - normalized 0→1 scroll progress.
 * @param {boolean} inView - pauses the render loop when the section is offscreen.
 */
export default function TruckScene({ progressRef, inView = true }) {
  const webglOk = useMemo(() => isWebGLAvailable(), [])
  // Cap geometry detail + dpr on small screens, same spirit as GlobeScene.
  const isMobile = useMemo(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
    [],
  )

  if (!webglOk) return <TruckFallback />

  const segments = isMobile ? 12 : 24
  const dpr = isMobile ? [1, 1.5] : [1, 1.6]

  return (
    <Canvas
      camera={{ position: [3, 6.5, 16], fov: 42 }}
      dpr={dpr}
      // Skip rendering entirely while the section is scrolled out of view so an
      // idle truck never burns the GPU/battery below the fold.
      frameloop={inView ? 'always' : 'never'}
      shadows={!isMobile}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.3}
        castShadow={!isMobile}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-8, 4, -6]} intensity={0.4} color="#4cc9f0" />
      <TruckRig progressRef={progressRef} segments={segments} />
    </Canvas>
  )
}
