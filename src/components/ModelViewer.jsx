import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import * as THREE from 'three'

// Module-level cache for GLTF computation results (StrictMode-proof)
const _glbMeta = new Map()

const slotCycle = ['idle', 'charging', 'error']
const slotLabels = { idle: '空闲', charging: '充电', error: '故障' }
const slotColors = {
  idle: { bg: 'rgba(60,60,70,0.9)', border: '#777', text: '#ccc' },
  charging: { bg: 'rgba(46,204,113,0.9)', border: '#2ecc71', text: '#fff' },
  error: { bg: 'rgba(231,76,60,0.9)', border: '#e74c3c', text: '#fff' },
}

function SlotLabel({ slotIndex, state, onClick }) {
  const c = slotColors[state]

  const icons = { idle: '\u23F8', charging: '\u26A1', error: '\u26A0' }
  const glowMap = {
    idle: '0 0 6px rgba(100,100,120,0.4)',
    charging: '0 0 10px rgba(46,204,113,0.5)',
    error: '0 0 10px rgba(231,76,60,0.5)',
  }

  return (
    <div
      onClick={onClick}
      className="slot-label-3d"
      data-state={state}
      style={{
        background: `linear-gradient(135deg, ${c.bg}, rgba(0,0,0,0.6))`,
        border: `1.5px solid ${c.border}`,
        borderRadius: '8px',
        padding: '5px 12px',
        color: c.text,
        fontFamily: "'SimHei','Microsoft YaHei','SF Pro Text',sans-serif",
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: `${glowMap[state]}, 0 4px 16px rgba(0,0,0,0.4)`,
        minWidth: '100px',
        justifyContent: 'center',
        letterSpacing: '0.5px',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.fontSize = '17px'
        e.currentTarget.style.boxShadow = `0 0 16px ${c.border}44, 0 6px 24px rgba(0,0,0,0.5)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.fontSize = '15px'
        e.currentTarget.style.boxShadow = `${glowMap[state]}, 0 4px 16px rgba(0,0,0,0.4)`
      }}
    >
      {/* Shine overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Slot number badge */}
      <div style={{
        fontSize: '10px',
        fontWeight: '700',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '4px',
        padding: '2px 6px',
        letterSpacing: '0',
        border: `1px solid ${c.border}33`,
      }}>
        {slotIndex}
      </div>

      {/* Status icon */}
      <span style={{ fontSize: '14px', lineHeight: 1 }}>{icons[state]}</span>

      {/* Status text */}
      <span style={{
        fontSize: '13px',
        fontWeight: '700',
        letterSpacing: '1px',
        textShadow: `0 0 8px ${c.border}33`,
      }}>
        {slotLabels[state]}
      </span>

      {/* State indicator dot */}
      <div style={{
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: c.border,
        boxShadow: `0 0 3px ${c.border}`,
        animation: state === 'charging' ? 'labelPulse 1.2s ease-in-out infinite' :
                   state === 'error' ? 'labelPulse 0.6s ease-in-out infinite' : 'none',
      }} />
    </div>
  )
}

function useMeshCenters(obj) {
  // Slot labels 1～3 → Part 21～23 (mesh indices 20～22), Slot 4～6 → Part 17/20/18 (mesh indices 16, 19, 17)
  // Returns GLB-space centers (from _slotCenters, computed during mergeVertices
  // before group scale is applied). worldLabels multiplies by scale later.
  const sv = obj?.userData?._slotVersion ?? 0
  return useMemo(() => {
    if (!obj) return []
    if (obj.userData._slotCenters) {
      return obj.userData._slotCenters
    }
    return []
  }, [obj, sv])
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
// Animated energy beam connector
function EnergyBeam({ from, to, color }) {
  const lineRef = useRef()
  const glowRef = useRef()

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(from[0], from[1], from[2]),
      new THREE.Vector3(to[0], to[1], to[2]),
    ])
    return g
  }, [from[0], from[1], from[2], to[0], to[1], to[2]])

  useFrame(({ clock }) => {
    if (lineRef.current) {
      lineRef.current.material.opacity = 0.4 + 0.3 * Math.sin(clock.elapsedTime * 0.8)
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.15 + 0.15 * Math.sin(clock.elapsedTime * 0.8 + 1)
      glowRef.current.scale.setScalar(1 + 0.02 * Math.sin(clock.elapsedTime * 1.2))
    }
  })

  return (
    <>
      {/* Main line */}
      <line ref={lineRef} geometry={geom}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </line>
      {/* Glow line (wider) */}
      <line ref={glowRef} geometry={geom}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          linewidth={1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </line>
    </>
  )
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

/** Helper: build local-to-obj transform by walking parent chain */
function localToObjXform(child, obj) {
  const xform = new THREE.Matrix4()
  let node = child
  while (node && node !== obj) {
    xform.premultiply(node.matrix)
    node = node.parent
  }
  return xform
}

function ModelViewer({ selectedPart, showSlotLabels = true }) {
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

  // ONCE per GLTF scene (survives StrictMode double-mount via module-level _glbMeta)
  if (!_glbMeta.has(obj.uuid)) {
    // Collect all meshes first (by traversal order, matching Part numbering)
    const allMeshes = []
    obj.traverse((child) => {
      if (child.isMesh) allMeshes.push(child)
    })

    // Compute ORIGINAL scene bounding box in GLB-local space
    // Never rely on matrixWorld — it may include parent-group scale on
    // StrictMode remount. Use local-to-obj transforms instead.
    const origBox = new THREE.Box3()
    allMeshes.forEach((child) => {
      if (child.geometry.boundingBox) {
        const bb = new THREE.Box3().copy(child.geometry.boundingBox)
        bb.applyMatrix4(localToObjXform(child, obj))
        origBox.union(bb)
      }
    })
    const origSize = origBox.getSize(new THREE.Vector3())
    const computedScale = 50 / Math.max(origSize.x, origSize.y, origSize.z)

    // Pre-compute GLB-space centers for slot parts
    // Slot 1～3 = Part 21～23 (mesh 20～22), Slot 4～6 = Part 17/20/18 (mesh 16,19,17)
    const SLOT_MESH_INDICES = [20, 21, 22, 16, 19, 17]
    const slotCenters = SLOT_MESH_INDICES.map((idx) => {
      const child = allMeshes[idx]
      child.geometry.computeBoundingBox()
      const center = new THREE.Vector3()
      child.geometry.boundingBox.getCenter(center)
      center.applyMatrix4(localToObjXform(child, obj))
      return center
    })

    // Store in module-level cache (survives StrictMode unmount/remount)
    _glbMeta.set(obj.uuid, {
      origScale: computedScale,
      slotCenters,
    })
    // Also write to userData for useMeshCenters and other consumers
    obj.userData._origScale = computedScale
    obj.userData._slotCenters = slotCenters
    obj.userData._slotVersion = (obj.userData._slotVersion || 0) + 1

    // Merge vertices on clone to smooth normals
    allMeshes.forEach((child) => {
      const merged = mergeVertices(child.geometry.clone())
      merged.computeVertexNormals()
      child.geometry = merged
    })
    obj.userData._mvDone = true
  } else if (!obj.userData._mvDone) {
    // Second StrictMode mount: restore userData from module cache
    const cached = _glbMeta.get(obj.uuid)
    obj.userData._origScale = cached.origScale
    obj.userData._slotCenters = cached.slotCenters
    obj.userData._slotVersion = (obj.userData._slotVersion || 0) + 1
    obj.userData._mvDone = true
  }

  const scale = useMemo(() => {
    if (obj.userData._origScale) {
      return obj.userData._origScale
    }
    // Fallback if mergeVertices hasn't run yet
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

  // Cast/receive shadow on all meshes
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

  // World-space label positions (scaled from model space)
  const worldLabels = useMemo(() => {
    return meshCenters.map(pos => {
      const len = Math.sqrt(pos.x*pos.x + pos.y*pos.y + pos.z*pos.z) || 1
      const dx = pos.x / len, dy = pos.y / len, dz = pos.z / len
      const atX = pos.x * scale, atY = pos.y * scale, atZ = pos.z * scale
      return {
        at: [atX, atY, atZ],
        labelAt: [atX + dx * 12, atY + dy * 12, atZ + dz * 12],
        guideTo: [atX + dx * 3, atY + dy * 3, atZ + dz * 3],
      }
    })
  }, [meshCenters, scale])

  return (
    <>
      <group ref={groupRef} scale={scale}>
        <ModelInfo obj={obj} onCenter={() => {}} />
        <primitive object={obj} />
        <FlashingLights obj={obj} on={lightOn} />
      </group>

      {showSlotLabels && worldLabels.map((wl, i) => {
        const slotIdx = i + 1
        const state = slotStates[slotIdx] || 'idle'
        const c = slotColors[state].border
        const { at, labelAt, guideTo } = wl

        return (
          <group key={`3d-${i}`}>
            {/* Animated connector beam */}
            <EnergyBeam from={at} to={guideTo} color={c} />
            {/* Pulsing origin node */}
            <mesh position={at}>
              <sphereGeometry args={[0.5, 12, 12]} />
              <meshBasicMaterial color={c} transparent opacity={0.6} depthTest={false} />
            </mesh>
            {/* Outer glow ring */}
            <mesh position={at}>
              <ringGeometry args={[0.5, 0.7, 12]} />
              <meshBasicMaterial
                color={c}
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          </group>
        )
      })}

      {showSlotLabels && worldLabels.map((wl, i) => {
        const slotIdx = i + 1
        const state = slotStates[slotIdx] || 'idle'
        return (
          <Html key={`html-${i}`} position={wl.labelAt} center occlude={false} style={{ pointerEvents: 'auto' }}>
            <SlotLabel slotIndex={slotIdx} state={state} onClick={() => toggleSlot(slotIdx)} />
          </Html>
        )
      })}
    </>
  )
}

export default ModelViewer
