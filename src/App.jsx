import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Suspense, useEffect, useState } from 'react'
import ModelViewer from './components/ModelViewer'
import UIScreen from './components/UIScreen'
import SensorPanel from './components/SensorPanel'
import './App.css'

function Scene({ selectedPart, modelCenter }) {
  return (
    <>
      <color attach="background" args={['#1c1c20']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[15, 20, 15]} intensity={4} castShadow />
      <directionalLight position={[-15, 10, -15]} intensity={1.5} color="#bbbbdd" />
      <directionalLight position={[0, -10, 20]} intensity={1} color="#ddddaa" />
      <directionalLight position={[-10, 5, -10]} intensity={0.8} color="#bbddcc" />
      <hemisphereLight args={['#ffffff', '#666677', 0.3]} />
      <Suspense fallback={null}>
        <ModelViewer selectedPart={selectedPart} />
        <Environment files="/textures/clouds_2K.exr" />
      </Suspense>
      <OrbitControls
        makeDefault enableDamping dampingFactor={0.08}
        minDistance={10} maxDistance={500}
        target={modelCenter || [0, 0, 0]}
      />
    </>
  )
}

function App() {
  const [parts, setParts] = useState([])
  const [selectedPart, setSelectedPart] = useState(null)
  const [modelCenter, setModelCenter] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (window.__modelInfo) setTimeout(() => setLoading(false), 300)

    const handler = () => setTimeout(() => setLoading(false), 300)
    window.addEventListener('model-loaded', handler)
    const partsHandler = (e) => setParts(e.detail)
    window.addEventListener('model-parts', partsHandler)
    const centerHandler = (e) => setModelCenter(e.detail)
    window.addEventListener('model-center', centerHandler)

    if (window.__modelParts) setParts(window.__modelParts)

    return () => {
      window.removeEventListener('model-loaded', handler)
      window.removeEventListener('model-parts', partsHandler)
      window.removeEventListener('model-center', centerHandler)
    }
  }, [])

  return (
    <div className="app">
      {/* Floating controls hint - top-left */}
      <div className="controls-float">
        <span>🖱 左键旋转</span>
        <span>🔄 滚轮缩放</span>
        <span>✋ 右键平移</span>
      </div>

      <div className="main-layout">
        <div className="canvas-wrapper">
          <Canvas
            camera={{ position: [0, 0, 80], fov: 40, near: 1, far: 2000 }}
            gl={{ antialias: true, toneMapping: 3, toneMappingExposure: 1.2, alpha: false }}
            shadows
          >
            <Scene selectedPart={selectedPart} modelCenter={modelCenter} />
          </Canvas>

          <SensorPanel />

          <div className="prototype-float">
            <div className="proto-float-header">前瞻特性分支：输出控制</div>
            <div className="proto-float-body">
              <UIScreen />
            </div>
          </div>
        </div>

        <div className="part-sidebar">
          <div className="part-sidebar-header">
            模型零件
            {parts.length > 0 && <span className="part-count">{parts.length}</span>}
          </div>
          <div className="part-list">
            {parts.length === 0 ? (
              <div className="part-list-empty">加载中...</div>
            ) : (
              parts.map((p, i) => (
                <div
                  key={i}
                  className={`part-item${selectedPart === i ? ' selected' : ''}`}
                  onClick={() => setSelectedPart(selectedPart === i ? null : i)}
                >
                  <span className="part-color-dot" style={{ background: p.color || '#888' }} />
                  <span className="part-name">{p.name}</span>
                  <span className="part-material" title={p.materialName}>{p.materialLabel}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className={`loading-overlay${loading ? '' : ' hidden'}`}>
        <div className="spinner" /><p>正在加载模型...</p>
      </div>
    </div>
  )
}

export default App
