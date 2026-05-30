import { useEffect, useRef } from 'react'

const cssContent = `
.ui-prototype {
  --bg: #000;
  --border: #222;
  --text: #fff;
  --dim: #555;
  --acc: #2ecc71;
  --warn: #e74c3c;
}

.ui-prototype {
  font-family: 'SimHei','Microsoft YaHei','Heiti SC',sans-serif;
  background: #000;
  color: #fff;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.ui-prototype .display {
  width: 100%;
  height: 100%;
  background: #000;
  color: #fff;
  padding: 10px;
  font-size: 14px;
  line-height: 1.3;
  display: flex;
  flex-direction: row;
  gap: 8px;
  position: relative;
}

.ui-prototype .col-slots {
  width: 120px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.ui-prototype .col-title {
  font-size: 12px;
  font-weight: bold;
  text-align: center;
  padding: 2px;
  border-bottom: 1px solid #555;
  margin-bottom: 2px;
}

.ui-prototype .slot {
  border: 2px solid #555;
  padding: 6px 8px;
  font-size: 13px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  min-height: 0;
  transition: border-color .3s;
}

.ui-prototype .slot.error { border-color: var(--warn); }

.ui-prototype .slot-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.ui-prototype .slot-num { font-weight: bold; font-size: 20px; }
.ui-prototype .slot-state { font-size: 14px; }

.ui-prototype .slot-pct {
  font-size: 34px;
  font-weight: bold;
  line-height: 1.1;
  margin: 3px 0 5px;
}

.ui-prototype .slot-bar {
  width: 100%;
  height: 8px;
  background: rgba(255,255,255,0.10);
  border-radius: 3px;
  overflow: hidden;
  flex-shrink: 0;
}

.ui-prototype .slot-bar div {
  height: 100%;
  width: 0%;
  background: #fff;
  border-radius: 3px;
  transition: width .4s ease;
}

.ui-prototype .slot.charged .slot-bar div,
.ui-prototype .slot.charged .slot-pct { color: var(--acc); }
.ui-prototype .slot.charged .slot-bar div { background: var(--acc); }
.ui-prototype .slot.error .slot-bar div { background: var(--warn); }

.ui-prototype .main {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 2px solid #555;
  padding: 6px;
  background: rgba(255,255,255,0.03);
  position: relative;
  overflow: hidden;
}

.ui-prototype .pages-wrap {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.ui-prototype .pages {
  display: flex;
  flex-wrap: nowrap;
  width: 100%;
  transition: transform .3s ease;
}

.ui-prototype .page {
  flex: 0 0 100%;
  display: flex;
  flex-direction: column;
  padding: 0 4px;
  min-width: 0;
}

.ui-prototype .dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: auto;
  padding-top: 4px;
}

.ui-prototype .dot { width: 5px; height: 5px; border-radius: 50%; background: #555; transition: background .2s; }
.ui-prototype .dot.on { background: #fff; }

.ui-prototype .topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.ui-prototype .node { display: flex; align-items: center; gap: 8px; }

.ui-prototype .signal {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}

.ui-prototype .signal div { width: 3px; background: #fff; }
.ui-prototype .signal div:nth-child(1) { height: 4px; }
.ui-prototype .signal div:nth-child(2) { height: 7px; }
.ui-prototype .signal div:nth-child(3) { height: 10px; }
.ui-prototype .signal div:nth-child(4) { height: 14px; }
.ui-prototype .signal .off { background: #444; }

.ui-prototype .nid { font-size: 13px; font-weight: bold; }

.ui-prototype .topright { display: flex; align-items: center; gap: 8px; }
.ui-prototype .pgroup { display: flex; align-items: center; gap: 8px; }
.ui-prototype .psrc { display: flex; align-items: center; gap: 4px; }

.ui-prototype .ps {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 8px;
  padding: 2px 3px;
  border: 1px solid #555;
  color: #555;
  transition: all .3s;
}

.ui-prototype .ps.on { border-color: #fff; color: #fff; }

.ui-prototype .stat { font-size: 11px; font-weight: bold; }
.ui-prototype .stat.chg { animation: up-blink 1s infinite; }

@keyframes up-blink {
  0%, 45% { opacity: 1; }
  50%, 95% { opacity: 0; }
  100% { opacity: 1; }
}

.ui-prototype .big {
  font-size: 80px;
  font-weight: 900;
  text-align: left;
  letter-spacing: 2px;
  line-height: .85;
  min-width: 3ch;
}

.ui-prototype .btm { margin-top: auto; display: flex; flex-direction: column; }

.ui-prototype .srow { display: flex; justify-content: center; gap: 12px; margin-bottom: 4px; }

.ui-prototype .si { text-align: center; }
.ui-prototype .si .sv { font-weight: bold; font-size: 14px; display: block; }
.ui-prototype .si .sl { color: #888; font-size: 9px; }

.ui-prototype .barbox { height: 12px; border: 2px solid #555; background: rgba(255,255,255,0.1); }
.ui-prototype .bar { height: 100%; background: #fff; transition: width .5s ease; min-width: 0; }

.ui-prototype .bar.low {
  background: repeating-linear-gradient(45deg,#fff,#fff 3px,transparent 3px,transparent 6px);
}

.ui-prototype .outs {
  display: flex;
  justify-content: space-between;
  margin: 2px 0 4px;
  padding: 0 2px 3px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.ui-prototype .op {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 2px 4px;
  border-left: 1px solid rgba(255,255,255,0.1);
}

.ui-prototype .op:first-child { border-left: none; }
.ui-prototype .opn { font-size: 7px; color: #888; }
.ui-prototype .ops { font-size: 8px; font-weight: bold; color: #555; }
.ui-prototype .ops.on { color: #fff; }

.ui-prototype .pg1 { display: flex; flex-direction: column; flex: 1; gap: 6px; padding: 2px 0; }
.ui-prototype .pg1 .ib { font-size: 12px; font-weight: bold; text-align: center; padding: 4px; border: 2px solid #fff; width: 100%; }
.ui-prototype .pg1 .grid { display: flex; flex-wrap: wrap; gap: 4px; }

.ui-prototype .pg1 .grid .oc {
  flex: 1 0 calc(50% - 2px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px;
  border: 2px solid #555;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all .25s;
  user-select: none;
}

.ui-prototype .pg1 .grid .oc.on { border-color: var(--acc); background: rgba(46,204,113,0.08); }
.ui-prototype .pg1 .grid .oc.off { border-color: #555; background: transparent; }
.ui-prototype .pg1 .grid .oc .ocn { font-weight: bold; }
.ui-prototype .pg1 .grid .oc .ocv { font-size: 10px; color: #888; }
.ui-prototype .pg1 .grid .oc.on .ocv { color: var(--acc); }
.ui-prototype .pg1 .grid .oc:active { opacity: .6; }

.ui-prototype .pg1 .lo {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-top: auto;
}

.ui-prototype .pg1 .lo .lov { color: #888; }
.ui-prototype .pg1 .lo .lov.on { color: #fff; font-weight: bold; }

.ui-prototype .sys { display: flex; flex-direction: column; justify-content: center; gap: 6px; flex: 1; padding: 0 8px; }
.ui-prototype .sr { display: flex; justify-content: space-between; padding: 5px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }
.ui-prototype .sr .lb { color: #888; font-size: 11px; }
.ui-prototype .sr .vl { font-weight: bold; font-size: 12px; }

.ui-prototype .fb {
  position: absolute;
  top: 0; left: 0; right: 0;
  background: #8b0000;
  color: #fff;
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  z-index: 15;
  border-bottom: 2px solid #ff4444;
}

.ui-prototype .fb.show { display: flex; }
.ui-prototype .fbx { display: flex; align-items: center; gap: 8px; }
.ui-prototype .fbi { font-size: 14px; font-weight: bold; }
.ui-prototype .fbt { font-size: 12px; font-weight: bold; }
.ui-prototype .fbc { font-size: 16px; cursor: pointer; padding: 0 6px; user-select: none; border: 1px solid rgba(255,255,255,.5); border-radius: 2px; }
.ui-prototype .fbc:active { opacity: .5; }

/* Alarm overlays */
.ui-prototype .ao {
  display: none;
  position: absolute;
  inset: 0;
  z-index: 20;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  text-align: center;
}
.ui-prototype .ao.show { display: flex; }
.ui-prototype .ao.gas { background: rgba(35,20,10,0.92); }
.ui-prototype .ao.liquid { background: rgba(10,20,40,0.92); }
.ui-prototype .aoi { font-size: 40px; font-weight: bold; margin-bottom: 10px; }
.ui-prototype .aot { font-size: 20px; font-weight: bold; margin-bottom: 8px; color: #fff; }
.ui-prototype .aov { font-size: 28px; font-weight: bold; color: #e74c3c; margin-bottom: 12px; }
.ui-prototype .aom { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.5; margin-bottom: 16px; }
.ui-prototype .aoc {
  padding: 8px 20px;
  border: 2px solid rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.08);
  color: #fff;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
}
.ui-prototype .aoc:active { opacity: .6; }

/* Burst overlay */
.ui-prototype .bo {
  display: none;
  position: absolute;
  inset: 0;
  z-index: 18;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.92);
}
.ui-prototype .bo.show { display: flex; }
.ui-prototype .bo .bc { text-align: center; }
.ui-prototype .bo .bct { font-size: 24px; font-weight: bold; color: #e74c3c; margin-bottom: 12px; animation: pulse-text 0.8s infinite; }
.ui-prototype .bo .bcm { font-size: 16px; color: rgba(255,255,255,0.7); line-height: 1.6; }
@keyframes pulse-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Burst running state */
.ui-prototype .bo .br { display: none; flex-direction: column; width: 100%; height: 100%; padding: 16px; }
.ui-prototype .bo .br.show { display: flex; }
.ui-prototype .brh { text-align: center; font-size: 14px; font-weight: bold; padding-bottom: 8px; border-bottom: 2px solid rgba(255,255,255,.4); }
.ui-prototype .brm { display: flex; justify-content: space-around; align-items: center; flex: 1; }
.ui-prototype .brbv { font-size: 56px; font-weight: bold; }
.ui-prototype .brbl { font-size: 12px; color: rgba(255,255,255,.6); text-align: center; }
.ui-prototype .brtv { font-size: 36px; font-weight: bold; }
.ui-prototype .brs { display: flex; justify-content: space-around; padding: 8px; border-top: 2px solid rgba(255,255,255,.4); }
.ui-prototype .brsv { font-size: 20px; font-weight: bold; }
.ui-prototype .brsl { font-size: 11px; color: rgba(255,255,255,.6); }

/* Burst complete */
.ui-prototype .bo .bc2 { display: none; text-align: center; }
.ui-prototype .bo .bc2.show { display: block; }
.ui-prototype .bcpt { font-size: 28px; font-weight: bold; margin-bottom: 12px; }
.ui-prototype .bcpm { font-size: 18px; color: rgba(255,255,255,0.7); line-height: 1.6; }
`

function UIScreen() {
  const hostRef = useRef(null)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = cssContent
    style.id = 'ui-prototype-styles'
    document.head.appendChild(style)
    return () => {
      const s = document.getElementById('ui-prototype-styles')
      if (s) s.remove()
    }
  }, [])

  useEffect(() => {
    const root = hostRef.current
    if (!root) return

    root.innerHTML = `
<div class="display">
  <div class="col-slots">
    <div class="col-title">槽 1-3</div>
    <div class="slot" id="s1"><div class="slot-top"><span class="slot-num">1</span><span class="slot-state">充电</span></div><div class="slot-pct">65%</div><div class="slot-bar"><div></div></div></div>
    <div class="slot" id="s2"><div class="slot-top"><span class="slot-num">2</span><span class="slot-state">充电</span></div><div class="slot-pct">42%</div><div class="slot-bar"><div></div></div></div>
    <div class="slot" id="s3"><div class="slot-top"><span class="slot-num">3</span><span class="slot-state">空闲</span></div><div class="slot-pct">--</div><div class="slot-bar"><div></div></div></div>
  </div>

  <div class="main" id="mainArea">
    <div class="fb" id="fb"><div class="fbx"><span class="fbi">⚠</span><span class="fbt" id="fbt">电池故障</span></div><span class="fbc" id="fbc">✕</span></div>

    <div class="topbar">
      <div class="node">
        <div class="signal"><div></div><div></div><div></div><div></div></div>
        <span class="nid">节点-01</span>
      </div>
      <div class="topright">
        <div class="pgroup">
          <div class="psrc">
            <div class="ps on" id="ps0">☀︎ 太阳能</div>
            <div class="ps" id="ps1">~ 220V</div>
            <div class="ps" id="ps2">▣ 48V</div>
          </div>
        </div>
        <div class="stat chg" id="stat">● 充电中</div>
      </div>
    </div>

    <div class="pages-wrap"><div class="pages" id="pages">
      <div class="page">
        <div class="btm">
          <div class="outs">
            <div class="op"><span class="opn">USB-A</span><span class="ops" id="ouA">--</span></div>
            <div class="op"><span class="opn">USB-C</span><span class="ops on" id="ouC">45W</span></div>
            <div class="op"><span class="opn">SB30</span><span class="ops on" id="oSB">350W</span></div>
            <div class="op"><span class="opn">220V</span><span class="ops" id="oAc">--</span></div>
          </div>
          <div class="big" id="big">78%</div>
          <div class="srow">
            <div class="si"><span class="sv" id="svV">25.8V</span><span class="sl">电压</span></div>
            <div class="si"><span class="sv" id="svT">32°C</span><span class="sl">温度</span></div>
            <div class="si"><span class="sv" id="svR">2.5h</span><span class="sl">续航</span></div>
            <div class="si"><span class="sv" id="svC">128</span><span class="sl">循环</span></div>
          </div>
          <div class="barbox"><div class="bar" id="bar" style="width:78%"></div></div>
        </div>
      </div>

      <div class="page">
        <div class="pg1">
          <div class="ib" id="ib">● 太阳能供电中</div>
          <div class="grid" id="outGrid">
            <div class="oc on" data-port="sb30"><span class="ocn">SB30</span><span class="ocv">350W</span></div>
            <div class="oc off" data-port="light"><span class="ocn">💡 照明</span><span class="ocv">30W</span></div>
            <div class="oc on" style="border-color:#888;cursor:default;opacity:0.7" title="USB 常驻"><span class="ocn">USB</span><span class="ocv">18+100W</span></div>
            <div class="oc on" data-port="ac"><span class="ocn">220V</span><span class="ocv">500W</span></div>
            <div class="oc off" data-port="light2"><span class="ocn">💡 照明 2</span><span class="ocv">30W</span></div>
          </div>
          <div class="lo">
            <span>总输出</span>
            <span class="lov on" id="totOut">888W</span>
          </div>
        </div>
      </div>

      <div class="page">
        <div class="sys">
          <div class="sr"><span class="lb">设备型号</span><span class="vl">HMP-750</span></div>
          <div class="sr"><span class="lb">固件版本</span><span class="vl">V2.2.1</span></div>
          <div class="sr"><span class="lb">电池健康</span><span class="vl" id="sysH">98%</span></div>
          <div class="sr"><span class="lb">充满循环</span><span class="vl" id="sysC">128</span></div>
          <div class="sr"><span class="lb">运行时长</span><span class="vl">1,280h</span></div>
          <div class="sr"><span class="lb">防护等级</span><span class="vl">IP67</span></div>
        </div>
      </div>
    </div></div>

    <div class="dots" id="dots"><div class="dot on"></div><div class="dot"></div><div class="dot"></div></div>
  </div>

  <div class="col-slots">
    <div class="col-title">槽 4-6</div>
    <div class="slot" id="s4"><div class="slot-top"><span class="slot-num">4</span><span class="slot-state">充电</span></div><div class="slot-pct">88%</div><div class="slot-bar"><div></div></div></div>
    <div class="slot" id="s5"><div class="slot-top"><span class="slot-num">5</span><span class="slot-state">空闲</span></div><div class="slot-pct">--</div><div class="slot-bar"><div></div></div></div>
    <div class="slot error" id="s6"><div class="slot-top"><span class="slot-num">6</span><span class="slot-state">故障</span></div><div class="slot-pct">ERR</div><div class="slot-bar"><div></div></div></div>
  </div>

  <div class="ao gas" id="aoGas"><div class="aoi">☠</div><div class="aot">可燃气体浓度过高</div><div class="aov" id="aoGasV">0% LEL</div><div class="aom">存在爆炸风险<br>已切断所有充电回路</div><button class="aoc" id="aoGasC">关闭</button></div>
  <div class="ao liquid" id="aoLiq"><div class="aoi">💧</div><div class="aot">液体侵入告警</div><div class="aov">检测到液体渗入</div><div class="aom">设备存在短路风险<br>已切断所有充电回路</div><button class="aoc" id="aoLiqC">关闭</button></div>

  <div class="bo" id="aoBurst">
    <div class="bc" id="burstBc">
      <div class="bct">⚡ 爆发输出模式</div>
      <div class="bcm">将以最大功率输出<br>直至电量耗尽</div>
    </div>
    <div class="br" id="burstBr">
      <div class="brh">⚡ 爆发输出中</div>
      <div class="brm">
        <div><div class="brbv" id="bbv">78%</div><div class="brbl">剩余电量</div></div>
        <div><div class="brtv" id="btv">00:00</div><div class="brbl">预计剩余时间</div></div>
      </div>
      <div class="brs">
        <div><div class="brsv" id="bts">45°C</div><div class="brsl">主机温度</div></div>
        <div><div class="brsv" id="bpw">720W</div><div class="brsl">实时功率</div></div>
      </div>
    </div>
    <div class="bc2" id="burstBc2">
      <div class="bcpt">✓ 能量已释放完毕</div>
      <div class="bcpm">该能源节点已完成使命<br>请勿继续使用</div>
    </div>
  </div>
</div>
`

    // ── State ──
    const SC = {
      slots: {
        1:{s:'charging',p:65},2:{s:'charging',p:42},3:{s:'idle',p:null},
        4:{s:'charging',p:88},5:{s:'idle',p:null},6:{s:'error',p:null}
      },
      ports: { sb30:{on:true,w:350}, light:{on:false,w:30}, ac:{on:true,w:500}, light2:{on:false,w:30} },
      portMap: { sb30:'oSB', ac:'oAc' },
      portLabels: { usbA:'18W', usbC:'45W', oSB:'350W', ac:'220V' },
      pi: 0, bs: 'normal', bbv: 78, bt: null, lastErr: '', powerSrc: 'solar'
    }

    const $ = (id) => root.querySelector('#' + id)

    // ── Init slot bars ──
    for (let i = 1; i <= 6; i++) {
      const el = $('s' + i)
      const bar = el?.querySelector('.slot-bar > div')
      const d = SC.slots[i]
      if (!el || !bar) continue
      if (d.s === 'charging' && d.p != null) {
        bar.style.width = d.p + '%'
        if (d.p >= 80) el.classList.add('charged')
      } else if (d.s === 'error') {
        bar.style.width = '100%'
      }
    }

    // ── calcStatus ──
    function calcStatus() {
      if (SC.bs !== 'normal') return
      const st = $('stat')
      if (!st) return
      const chrg = Object.values(SC.slots).some(s => s.s === 'charging')
      const err = Object.values(SC.slots).some(s => s.s === 'error')
      const anyOut = Object.values(SC.ports).some(p => p.on)
      const inOn = SC.powerSrc !== 'none'
      const batVal = parseInt($('big')?.textContent || '0')
      const full = batVal >= 99

      if (anyOut) {
        st.textContent = '● 放电中'; st.className = 'stat'
      } else if (inOn && (chrg || !full)) {
        st.textContent = '● 充电中'; st.className = 'stat chg'
      } else if (inOn && full) {
        st.textContent = '● 满电待机'; st.className = 'stat'
      } else if (!inOn && chrg) {
        st.textContent = '● 放电中'; st.className = 'stat'
      } else if (err && !chrg && !anyOut && !inOn) {
        st.textContent = '◆ 故障'; st.className = 'stat'
      } else {
        st.textContent = '○ 待机'; st.className = 'stat'
      }
    }

    // ── checkFault ──
    function checkFault() {
      if (SC.bs !== 'normal') return
      const e = []
      for (let i = 1; i <= 6; i++) {
        if (SC.slots[i].s === 'error') e.push(i + '号')
      }
      const k = e.join(','), fb = $('fb'), fbt = $('fbt')
      if (!fb || !fbt) return
      if (k !== SC.lastErr) { SC.lastErr = k; fb.dataset.d = 'false' }
      if (e.length && fb.dataset.d !== 'true') { fbt.textContent = e.join('、') + '槽 电池故障'; fb.classList.add('show') }
      else { fb.classList.remove('show') }
    }
    $('fbc')?.addEventListener('click', () => {
      const fb = $('fb')
      if (fb) { fb.dataset.d = 'true'; fb.classList.remove('show') }
    })

    // ── stopAllCharging ──
    function stopAllCharging() {
      for (let i = 1; i <= 6; i++) {
        if (SC.slots[i].s === 'charging') {
          SC.slots[i].s = 'idle'; SC.slots[i].p = null
          const el = $('s' + i)
          if (el) {
            el.classList.remove('charged', 'error')
            const se = el.querySelector('.slot-state')
            const pe = el.querySelector('.slot-pct')
            const be = el.querySelector('.slot-bar > div')
            if (se) se.textContent = '空闲'
            if (pe) pe.textContent = '--'
            if (be) { be.style.width = '0%'; be.style.background = '' }
          }
        }
      }
      checkFault(); calcStatus()
    }

    // ── Stop all (for safety alarms) ──
    function safetyStop() {
      for (let i = 1; i <= 6; i++) {
        if (SC.slots[i].s === 'charging') {
          SC.slots[i].s = 'idle'; SC.slots[i].p = null
          const el = $('s' + i)
          if (el) {
            el.classList.remove('charged', 'error')
            const se = el.querySelector('.slot-state')
            const pe = el.querySelector('.slot-pct')
            const be = el.querySelector('.slot-bar > div')
            if (se) se.textContent = '空闲'
            if (pe) pe.textContent = '--'
            if (be) { be.style.width = '0%'; be.style.background = '' }
          }
        }
      }
      // Also sync to 3D labels if the function exists
      if (window.__slotStates) {
        for (const [n, _st] of Object.entries(window.__slotStates)) {
          if (SC.slots[Number(n)]?.s === 'idle') {
            window.__slotStates[Number(n)] = 'idle'
            // The 3D label sync will happen if defined
          }
        }
      }
      checkFault(); calcStatus()
    }

    // ── Output grid click ──
    root.querySelectorAll('.oc').forEach(el => {
      el.addEventListener('click', function () {
        if (SC.bs !== 'normal') return
        const p = this.dataset.port
        if (!p || !SC.ports[p]) return
        SC.ports[p].on = !SC.ports[p].on
        this.classList.toggle('on', SC.ports[p].on)
        this.classList.toggle('off', !SC.ports[p].on)
        const idObj = SC.portMap[p]
        if (idObj) {
          const e = $(idObj)
          if (e) {
            if (SC.ports[p].on) { e.textContent = SC.portLabels[idObj]; e.classList.add('on') }
            else { e.textContent = '--'; e.classList.remove('on') }
          }
        }
        calcTotal(); calcStatus()
        if (p === 'light' || p === 'light2') {
          window.dispatchEvent(new CustomEvent('light-change', {
            detail: { on: SC.ports.light.on || SC.ports.light2.on }
          }))
        }
      })
    })

    function calcTotal() {
      let t = 0
      Object.values(SC.ports).forEach(p => { if (p.on) t += p.w })
      const el = $('totOut')
      if (el) { el.textContent = t + 'W'; el.classList.toggle('on', t > 0) }
    }

    // ── Power source switching ──
    function setPowerSource(src) {
      SC.powerSrc = src
      const ids = { solar: 'ps0', mains: 'ps1', diesel: 'ps2' }
      Object.entries(ids).forEach(([k, id]) => {
        const el = $(id)
        if (el) el.classList.toggle('on', k === src)
      })
      const map = { solar: '太阳能', mains: '220V市电', diesel: '48V柴油发电机', none: '无' }
      const ib = $('ib')
      if (ib) ib.textContent = src === 'none' ? '○ 无输入' : '● ' + map[src] + '供电中'
      calcStatus()
    }
    // Expose for SensorPanel control
    window.__setPowerSource = setPowerSource

    // ── Page switch ──
    function go(n) {
      const all = root.querySelectorAll('.page')
      if (n < 0) n = 0; if (n >= all.length) n = all.length - 1
      SC.pi = n
      const pages = $('pages')
      if (pages) pages.style.transform = 'translateX(-' + (n * 100) + '%)'
      root.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('on', i === n))
    }

    let md = false, msX = 0
    const mainArea = $('mainArea')
    root.addEventListener('mousedown', e => {
      if (mainArea && !mainArea.contains(e.target)) return
      md = true; msX = e.screenX
    })
    root.addEventListener('mouseup', e => {
      if (!md) return; md = false
      const d = msX - e.screenX
      if (Math.abs(d) > 30) go(d > 0 ? SC.pi + 1 : SC.pi - 1)
    })
    // Keyboard nav
    root.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') go(SC.pi - 1)
      if (e.key === 'ArrowRight') go(SC.pi + 1)
    })

    calcTotal()

    // ── Global: set slot ──
    window.__setUISlot = (n, state) => {
      const slotEl = $('s' + n)
      if (!slotEl) return
      const stateEl = slotEl.querySelector('.slot-state')
      const pctEl = slotEl.querySelector('.slot-pct')
      const barEl = slotEl.querySelector('.slot-bar > div')
      if (!SC.slots[n]) SC.slots[n] = { s: state, p: null }
      SC.slots[n].s = state
      slotEl.classList.remove('charged', 'error')
      if (state === 'charging') {
        const pct = SC.slots[n].p ?? Math.floor(20 + Math.random() * 60)
        SC.slots[n].p = pct
        if (stateEl) stateEl.textContent = '充电'
        if (pctEl) pctEl.textContent = pct + '%'
        if (barEl) { barEl.style.width = pct + '%'; barEl.style.background = '' }
        if (pct >= 80) slotEl.classList.add('charged')
      } else if (state === 'idle') {
        if (stateEl) stateEl.textContent = '空闲'
        if (pctEl) pctEl.textContent = '--'
        if (barEl) { barEl.style.width = '0%'; barEl.style.background = '' }
      } else if (state === 'error') {
        slotEl.classList.add('error')
        if (stateEl) stateEl.textContent = '故障'
        if (pctEl) pctEl.textContent = 'ERR'
        if (barEl) { barEl.style.width = '100%'; barEl.style.background = '#e74c3c' }
      }
      checkFault()
      calcStatus()
    }

    // ── Global: gas alert ──
    window.__setGasAlert = (level) => {
      const el = $('aoGas')
      const val = $('aoGasV')
      if (!el) return
      if (level >= 10) {
        el.classList.add('show')
        if (val) val.textContent = level + '% LEL'
        if (level >= 80) safetyStop()
      } else {
        el.classList.remove('show')
      }
    }

    // ── Global: liquid alert ──
    window.__setLiquidAlert = (alarmed) => {
      const el = $('aoLiq')
      if (!el) return
      el.classList.toggle('show', alarmed)
      if (alarmed) safetyStop()
    }

    // ── Global: burst state ──
    window.__setBurstState = (state) => {
      const bo = $('aoBurst'), bc = $('burstBc'), br = $('burstBr'), bc2 = $('burstBc2')
      if (!bo) return
      if (state === 'confirm') {
        bo.classList.add('show')
        if (bc) bc.style.display = 'block'
        if (br) { br.classList.remove('show'); br.style.display = 'none' }
        if (bc2) { bc2.classList.remove('show'); bc2.style.display = 'none' }
      } else if (state === 'active') {
        bo.classList.add('show')
        if (bc) bc.style.display = 'none'
        if (br) { br.classList.add('show'); br.style.display = 'flex' }
        if (bc2) { bc2.classList.remove('show'); bc2.style.display = 'none' }
        startBurstCountdown()
      } else if (state === 'done') {
        if (bc) bc.style.display = 'none'
        if (br) { br.classList.remove('show'); br.style.display = 'none' }
        if (bc2) { bc2.classList.add('show'); bc2.style.display = 'block' }
      } else {
        bo.classList.remove('show')
        if (SC.bt) { clearInterval(SC.bt); SC.bt = null }
      }
    }

    // ── Burst countdown ──
    function startBurstCountdown() {
      if (SC.bt) { clearInterval(SC.bt); SC.bt = null }
      let sec = Math.floor(SC.bbv * 0.5 * 60)
      document.getElementById('bbv').textContent = Math.floor(SC.bbv) + '%'
      const mm = Math.floor(sec / 60), ss = sec % 60
      document.getElementById('btv').textContent = String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0')
      SC.bt = setInterval(() => {
        if (SC.bs !== 'running') { clearInterval(SC.bt); SC.bt = null; return }
        SC.bbv = Math.max(0, SC.bbv - 0.5)
        sec = Math.max(0, sec - 1)
        document.getElementById('bbv').textContent = Math.floor(SC.bbv) + '%'
        const m = Math.floor(sec / 60), s = sec % 60
        document.getElementById('btv').textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
        document.getElementById('bts').textContent = (40 + Math.floor(Math.random() * 15)) + '°C'
        document.getElementById('bpw').textContent = (650 + Math.floor(Math.random() * 150)) + 'W'
        if (SC.bbv <= 0) {
          clearInterval(SC.bt); SC.bt = null
          if (window.__setBurstState) window.__setBurstState('done')
          if (window.__onBurstComplete) window.__onBurstComplete()
        }
      }, 100)
    }

    // ── Global: set burst starting battery ──
    window.__setBurstBBV = (pct) => {
      SC.bbv = pct
    }

    // ── Expose burst completion callback for SensorPanel sync ──
    window.__onBurstComplete = null

    // ── Close buttons ──
    $('aoGasC')?.addEventListener('click', () => {
      $('aoGas')?.classList.remove('show')
      if (window.__sensorPanel) window.__sensorPanel.clearGas()
    })
    $('aoLiqC')?.addEventListener('click', () => {
      $('aoLiq')?.classList.remove('show')
      if (window.__sensorPanel) window.__sensorPanel.clearLiquid()
    })

    // ── 3s simulation interval ──
    const simInterval = setInterval(() => {
      if (SC.bs !== 'normal') return
      const svT = $('svT')
      const svV = $('svV')
      const sysH = $('sysH')
      if (svT) svT.textContent = (30 + Math.floor(Math.random() * 8)) + '°C'
      if (svV) svV.textContent = (25.5 + Math.random() * 0.6).toFixed(1) + 'V'
      if (sysH) sysH.textContent = (95 + Math.floor(Math.random() * 5)) + '%'
      for (let i = 1; i <= 6; i++) {
        if (SC.slots[i].s === 'charging') {
          const p = Math.min(100, (SC.slots[i].p || 0) + Math.floor(Math.random() * 3))
          SC.slots[i].p = p
          const el = $('s' + i)
          if (el) {
            const pctEl = el.querySelector('.slot-pct')
            const barEl = el.querySelector('.slot-bar > div')
            if (pctEl) pctEl.textContent = p + '%'
            if (barEl) barEl.style.width = p + '%'
            el.classList.toggle('charged', p >= 80)
          }
        }
      }
    }, 3000)

    // ── Apply initial state from SensorPanel ──
    if (window.__slotStates) {
      for (const [n, st] of Object.entries(window.__slotStates)) {
        window.__setUISlot(Number(n), st)
      }
    }

    // ── Cleanup on unmount ──
    return () => {
      clearInterval(simInterval)
      if (SC.bt) { clearInterval(SC.bt); SC.bt = null }
    }
  }, [])

  return <div ref={hostRef} className="ui-prototype" tabIndex={0} />
}

export default UIScreen
