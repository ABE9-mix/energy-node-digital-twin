import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'

const slotCycle = ['idle', 'charging', 'error']
const slotLabels = { idle: '空闲', charging: '充电', error: '故障' }
const slotColors = {
  idle: { bg: 'rgba(60,60,70,0.9)', border: '#777', text: '#ccc' },
  charging: { bg: 'rgba(46,204,113,0.9)', border: '#2ecc71', text: '#fff' },
  error: { bg: 'rgba(231,76,60,0.9)', border: '#e74c3c', text: '#fff' },
}

function SlotLabel({ slotIndex, state, onClick }) {
  const c = slotColors[state]
  return (
    <div
      onClick={onClick}
      style={{
        background: c.bg,
        border: `2px solid ${c.border}`,
        borderRadius: '8px',
        padding: '12px 24px',
        color: c.text,
        fontFamily: "'SimHei','Microsoft YaHei',sans-serif",
        fontSize: '22px',
        fontWeight: 'bold',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        transform: 'scale(1.4)',
        transformOrigin: 'center center',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        minWidth: '200px',
        justifyContent: 'center',
        letterSpacing: '1px',
      }}
    >
      <span style={{ opacity: 0.5, fontSize: '18px' }}>#{slotIndex}</span>
      <span>{slotLabels[state]}</span>
    </div>
  )
}

function useMeshCenters(obj) {
  return useMemo(() => {
    if (!obj) return []
    const centers = []
    let idx = 0
    obj.traverse((child) => {
      if (child.isMesh && idx < 6) {
        const geom = child.geometry
        geom.computeBoundingBox()
        const center = new THREE.Vector3()
        geom.boundingBox.getCenter(center)
        centers.push(center)
        idx++
      }
    })
    return centers
  }, [obj])
}

function ModelInfo({ obj, onCenter }) {
  useEffect(() => {
    if (!obj) return
    const box = new THREE.Box3().setFromObject(obj)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    onCenter?.(center)
    window.dispatchEvent(new CustomEvent('model-center', { detail: center }))

    let verts = 0, faces = 0
    obj.traverse((child) => {
      if (child.isMesh) {
        const g = child.geometry
        if (g.index) { verts += g.attributes.position.count; faces += g.index.count / 3 }
        else if (g.attributes.position) { verts += g.attributes.position.count; faces += g.attributes.position.count / 3 }
      }
    })
    window.__modelInfo = {
      vertices: verts.toLocaleString(),
      faces: Math.round(faces).toLocaleString(),
      materials: obj.children.length,
      maxDim: Math.max(size.x, size.y, size.z),
      size: { x: size.x.toFixed(1), y: size.y.toFixed(1), z: size.z.toFixed(1) },
    }
    window.dispatchEvent(new CustomEvent('model-loaded', { detail: window.__modelInfo }))
  }, [obj])
  return null
}

const INITIAL_SLOTS = { 1: 'charging', 2: 'charging', 3: 'idle', 4: 'charging', 5: 'idle', 6: 'error' }
if (!window.__slotStates) window.__slotStates = { ...INITIAL_SLOTS }

// Simple dashed line as a <primitive> Three.js Line
function DirLine({ from, to, color }) {
  const line = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(from[0], from[1], from[2]),
      new THREE.Vector3(to[0], to[1], to[2]),
    ])
    const mat = new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity: 0.6,
      dashSize: 0.3,
      gapSize: 0.4,
      depthWrite: false,
    })
    const l = new THREE.Line(geom, mat)
    l.computeLineDistances()
    return l
  }, [from[0], from[1], from[2], to[0], to[1], to[2], color])
  return <primitive object={line} />
}

// Parts that are flashing indicator lights (sidebar 1-indexed: 33,35,37,39 → 0-indexed: 32,34,36,38)
const LIGHT_PART_INDICES = [32, 34, 36, 38]

function FlashingLights({ obj, on }) {
  const meshesRef = useRef([])
  const restoreRef = useRef([])

  useEffect(() => {
    if (!obj) return
    const meshes = []
    const restore = []
    let idx = 0
    obj.traverse((child) => {
      if (child.isMesh) {
        if (LIGHT_PART_INDICES.includes(idx)) {
          meshes.push(child)
          restore.push({
            color: child.material.emissive?.clone() || new THREE.Color(0x000000),
            intensity: child.material.emissiveIntensity || 0,
          })
        }
        idx++
      }
    })
    meshesRef.current = meshes
    restoreRef.current = restore
  }, [obj])

  useFrame(({ clock }) => {
    if (!on) {
      meshesRef.current.forEach((mesh, i) => {
        if (restoreRef.current[i]) {
          mesh.material.emissive.copy(restoreRef.current[i].color)
          mesh.material.emissiveIntensity = restoreRef.current[i].intensity
        }
      })
      return
    }
    const glow = 0.6 + 0.6 * Math.sin(clock.elapsedTime * 4)
    meshesRef.current.forEach((mesh) => {
      mesh.material.emissive.set('#ffaa44')
      mesh.material.emissiveIntensity = glow
    })
  })

  return null
}

function ModelViewer({ selectedPart }) {
  const groupRef = useRef()
  const [slotStates, setSlotStates] = useState({ ...window.__slotStates })
  const [lightOn, setLightOn] = useState(false)

  useEffect(() => {
    const handler = (e) => setLightOn(e.detail.on)
    window.addEventListener('light-change', handler)
    return () => window.removeEventListener('light-change', handler)
  }, [])

  const toggleSlot = useCallback((idx) => {
    setSlotStates(prev => {
      const current = prev[idx]
      const nextIdx = (slotCycle.indexOf(current) + 1) % slotCycle.length
      const nextState = slotCycle[nextIdx]
      const updated = { ...prev, [idx]: nextState }
      window.__slotStates = updated
      if (window.__setUISlot) window.__setUISlot(idx, nextState)
      window.dispatchEvent(new CustomEvent('slot-change', { detail: { slot: idx, state: nextState } }))
      return updated
    })
  }, [])

  const { scene: obj } = useGLTF('/models/bat.glb')

  const scale = useMemo(() => {
    obj.traverse((child) => {
      if (child.isMesh) {
        // Merge vertices for smooth shading (welds vertices at same position)
        const merged = mergeVertices(child.geometry)
        merged.computeVertexNormals()
        child.geometry = merged
      }
    })
    obj.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(obj)
    const size = box.getSize(new THREE.Vector3())
    return 50 / Math.max(size.x, size.y, size.z)
  }, [obj])

  const meshCenters = useMeshCenters(obj)

  useEffect(() => {
    const meshList = []
    let meshIdx = 0
    obj.traverse((child) => {
      if (child.isMesh) {
        const mat = child.material
        const r = mat.color ? mat.color.r : 0.5
        const g = mat.color ? mat.color.g : 0.5
        const b = mat.color ? mat.color.b : 0.5
        const hex = '#' + [r, g, b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('')
        meshList.push({ name: `Part ${meshIdx + 1}`, materialName: mat.name || 'default', materialLabel: (mat.name || 'default').slice(0, 8), color: hex, meshIndex: meshIdx })
        meshIdx++
      }
    })
    window.__modelParts = meshList
    window.dispatchEvent(new CustomEvent('model-parts', { detail: meshList }))
  }, [obj])

  // Cast/receive shadow on all meshes (NO material brightening — GLB has authored materials)
  useEffect(() => {
    obj.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [obj])

  // Selection highlight
  useEffect(() => {
    const toRemove = []
    obj.traverse((child) => { if (child.userData?._isHighlight) toRemove.push(child) })
    toRemove.forEach((line) => { line.geometry?.dispose(); line.material?.dispose(); line.parent?.remove(line) })
    if (selectedPart == null || selectedPart < 0) return
    let idx = 0
    obj.traverse((child) => {
      if (child.isMesh) {
        if (idx === selectedPart) {
          const edges = new THREE.EdgesGeometry(child.geometry)
          const mat = new THREE.LineBasicMaterial({ color: '#00ffaa', transparent: true, opacity: 0.95 })
          const line = new THREE.LineSegments(edges, mat)
          line.userData._isHighlight = true
          line.position.copy(child.position)
          line.rotation.copy(child.rotation)
          line.scale.copy(child.scale).multiplyScalar(1.005)
          child.parent.add(line)
        }
        idx++
      }
    })
  }, [obj, selectedPart])

  return (
    <group ref={groupRef} scale={scale}>
      <ModelInfo obj={obj} onCenter={() => {}} />
      <primitive object={obj} />
      <FlashingLights obj={obj} on={lightOn} />

      {meshCenters.map((pos, i) => {
        const slotIdx = i + 1
        const state = slotStates[slotIdx] || 'idle'
        const c = slotColors[state].border

        // Radial direction from origin to mesh center, for outward label placement
        const len = Math.sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z) || 1
        const dx = pos.x / len, dy = pos.y / len, dz = pos.z / len
        const labelOffset = 12
        const lx = pos.x + dx * labelOffset
        const ly = pos.y + dy * labelOffset
        const lz = pos.z + dz * labelOffset

        return (
          <group key={i}>
            <DirLine
              from={[pos.x, pos.y, pos.z]}
              to={[pos.x + dx * 2, pos.y + dy * 2, pos.z + dz * 2]}
              color={c}
            />
            <mesh position={[pos.x, pos.y, pos.z]}>
              <sphereGeometry args={[0.4, 6, 6]} />
              <meshBasicMaterial color={c} transparent opacity={0.7} />
            </mesh>
            <Html position={[lx, ly, lz]} center distanceFactor={30} style={{ pointerEvents: 'auto' }}>
              <SlotLabel slotIndex={slotIdx} state={state} onClick={() => toggleSlot(slotIdx)} />
            </Html>
          </group>
        )
      })}
    </group>
  )
}

export default ModelViewer
