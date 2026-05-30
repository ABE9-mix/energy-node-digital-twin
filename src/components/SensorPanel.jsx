import { useState, useEffect, useCallback, useRef } from 'react'
import './SensorPanel.css'

const gasLabels = { safe: '安全', watch: '注意', alarm: '危险！' }
const gasColors = { safe: '#2ecc71', watch: '#e67e22', alarm: '#e74c3c' }

function SensorPanel() {
  const [gasLevel, setGasLevel] = useState(0)
  const [liquidAlarm, setLiquidAlarm] = useState(false)
  const [burstState, setBurstState] = useState('idle')
  const [powerSrc, setPowerSrc] = useState('solar')
  const [batPct, setBatPct] = useState(78)
  const [slotStates, setSlotStates] = useState({1:'charging',2:'charging',3:'idle',4:'charging',5:'idle',6:'error'})
  const burstTimeoutRef = useRef(null)

  const gasState = gasLevel < 10 ? 'safe' : gasLevel < 60 ? 'watch' : 'alarm'
  const gc = gasColors[gasState]

  // Register global clear functions for UI overlay buttons
  useEffect(() => {
    window.__sensorPanel = {
      clearGas: () => setGasLevel(0),
      clearLiquid: () => setLiquidAlarm(false),
    }
    return () => { delete window.__sensorPanel }
  }, [])

  // Expose slot states for UI sync
  useEffect(() => {
    window.__slotStates = slotStates
  }, [slotStates])

  // Sync gas alert to UIScreen
  useEffect(() => {
    if (window.__setGasAlert) window.__setGasAlert(gasLevel)
  }, [gasLevel])

  // Sync liquid alert to UIScreen
  useEffect(() => {
    if (window.__setLiquidAlert) window.__setLiquidAlert(liquidAlarm)
  }, [liquidAlarm])

  // Sync burst state to UIScreen
  useEffect(() => {
    if (window.__setBurstState) window.__setBurstState(burstState)
  }, [burstState])

  // Sync power source
  useEffect(() => {
    if (window.__setPowerSource) window.__setPowerSource(powerSrc)
  }, [powerSrc])

  // Sync battery percentage to UI prototype
  useEffect(() => {
    // The calcStatus in UIScreen reads battery from DOM, so update DOM directly
    const bigEl = document.querySelector('#big')
    const barEl = document.querySelector('#bar')
    if (bigEl) bigEl.textContent = batPct + '%'
    if (barEl) { barEl.style.width = batPct + '%'; barEl.classList.toggle('low', batPct <= 20) }
  }, [batPct])

  const handleSlotChange = useCallback((n, value) => {
    setSlotStates(prev => ({ ...prev, [n]: value }))
    if (window.__setUISlot) window.__setUISlot(n, value)
  }, [])

  const handleBurst = useCallback(() => {
    if (burstState === 'idle') {
      setBurstState('confirm')
      // Read current battery level into SC.bbv for countdown
      const bigEl = document.querySelector('#big')
      if (bigEl) {
        const pct = parseInt(bigEl.textContent) || 78
        if (window.__setBurstBBV) window.__setBurstBBV(pct)
      }
    }
    else if (burstState === 'confirm') {
      setBurstState('active')
    }
    else if (burstState === 'active') {
      // Cancel burst
      setBurstState('idle')
    }
    else if (burstState === 'done') {
      setBurstState('idle')
    }
  }, [burstState])

  // Auto-progress burst: confirm → active when user clicks again (handled above)
  // Auto-complete is handled by UIScreen countdown timer calling __setBurstState('done')

  // Register burst complete callback so UIScreen countdown can sync back
  useEffect(() => {
    window.__onBurstComplete = () => setBurstState('done')
    return () => { window.__onBurstComplete = null }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (burstTimeoutRef.current) clearTimeout(burstTimeoutRef.current)
    }
  }, [])

  return (
    <div className="sensor-panel">
      {/* 主电量控制 */}
      <div className="sensor-card">
        <div className="sensor-header">
          <span className="sensor-icon">🔋</span>
          <span className="sensor-title">主电量</span>
        </div>
        <div className="sensor-body">
          <div className="sensor-value">{batPct}%</div>
        </div>
        <div className="sensor-control">
          <input
            type="range" min="0" max="100" value={batPct}
            onChange={e => setBatPct(Number(e.target.value))}
          />
        </div>
      </div>

      {/* 电源输入选择 */}
      <div className="sensor-card">
        <div className="sensor-header">
          <span className="sensor-icon">⚡</span>
          <span className="sensor-title">电源输入</span>
        </div>
        <div className="sensor-control">
          <select
            value={powerSrc}
            onChange={e => setPowerSrc(e.target.value)}
            className="sensor-select"
          >
            <option value="solar">☀ 太阳能</option>
            <option value="mains">~ 220V 市电</option>
            <option value="diesel">▣ 48V 柴油发电机</option>
            <option value="none">○ 无输入</option>
          </select>
        </div>
      </div>

      {/* 插槽状态 */}
      <div className="sensor-card">
        <div className="sensor-header">
          <span className="sensor-icon">🔌</span>
          <span className="sensor-title">插槽状态</span>
        </div>
        <div className="sensor-body">
          {[1,2,3,4,5,6].map(n => (
            <div className="sensor-slot-row" key={n}>
              <span className="sensor-slot-label">槽{n}</span>
              <select
                value={slotStates[n]}
                onChange={e => handleSlotChange(n, e.target.value)}
                className="sensor-select slot-select"
              >
                <option value="idle">空闲</option>
                <option value="charging">充电</option>
                <option value="error">故障</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* 可燃气体监测 */}
      <div className="sensor-card" style={{ borderColor: gc }}>
        <div className="sensor-header">
          <span className="sensor-icon">🔥</span>
          <span className="sensor-title">可燃气体监测</span>
        </div>
        <div className="sensor-body">
          <div className="sensor-value" style={{ color: gc }}>{gasLevel}% LEL</div>
          <div className="sensor-state" style={{ color: gc }}>{gasLabels[gasState]}</div>
        </div>
        <div className="sensor-control">
          <input
            type="range" min="0" max="100" value={gasLevel}
            onChange={e => setGasLevel(Number(e.target.value))}
          />
        </div>
      </div>

      {/* 浸水监测 */}
      <div className="sensor-card" style={{ borderColor: liquidAlarm ? '#e74c3c' : '#555' }}>
        <div className="sensor-header">
          <span className="sensor-icon">💧</span>
          <span className="sensor-title">浸水监测</span>
        </div>
        <div className="sensor-body">
          <div className="sensor-value" style={{ color: liquidAlarm ? '#e74c3c' : '#aaa' }}>
            {liquidAlarm ? '⚠ 检测到液体渗入' : '✓ 正常'}
          </div>
        </div>
        <div className="sensor-control">
          <button
            className={`sensor-btn ${liquidAlarm ? 'danger' : 'normal'}`}
            onClick={() => setLiquidAlarm(!liquidAlarm)}
          >
            {liquidAlarm ? '解除警告' : '模拟触发'}
          </button>
        </div>
      </div>

      {/* 爆发输出 */}
      <div className="sensor-card burst-card">
        <div className="sensor-header">
          <span className="sensor-icon">⚡</span>
          <span className="sensor-title">爆发输出</span>
        </div>
        <div className="sensor-body centered">
          <button
            className={`burst-btn ${burstState}`}
            onClick={handleBurst}
            disabled={false}
          >
            <div className="burst-outer">
              <div className="burst-inner">
                <div className="burst-icon">
                  {burstState === 'done' ? '✓' : burstState === 'active' ? '⚡' : '⏻'}
                </div>
                <div className="burst-label">
                  {burstState === 'idle' ? 'STOP' :
                   burstState === 'confirm' ? '确认?' :
                   burstState === 'active' ? '放电' : '完成'}
                </div>
              </div>
            </div>
          </button>
          {burstState === 'active' && <div className="burst-status">爆发放电中...</div>}
          {burstState === 'done' && <div className="burst-status done">能量已释放完毕</div>}
          {burstState === 'confirm' && <div className="burst-status confirm">再次按下确认启动</div>}
        </div>
      </div>
    </div>
  )
}

export default SensorPanel
