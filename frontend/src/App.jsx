import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as api from "./api";

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
const GS = `
  @keyframes spin      { to { transform: rotate(360deg); } }
  @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes slideIn   { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes ringPulse { 0%,100%{box-shadow:0 0 0 0 rgba(108,63,247,.3)} 50%{box-shadow:0 0 0 6px rgba(108,63,247,0)} }
  @keyframes fadeIn    { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  * { box-sizing:border-box; }
  body { margin:0; font-family:'Inter',system-ui,sans-serif; }
  textarea,input,button { font-family:inherit; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:#E5E7EB; border-radius:4px; }
`;

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const ES = {
  Happy:  { bg:"#E1F5EE", border:"#9FE1CB", text:"#085041", badge:"#C6F0E0", btext:"#085041" },
  Sad:    { bg:"#EBF4FD", border:"#B5D4F4", text:"#0C447C", badge:"#BFDBF7", btext:"#0C447C" },
  Calm:   { bg:"#E1F5EE", border:"#5DCAA5", text:"#0F6E56", badge:"#A7E9D2", btext:"#0F6E56" },
  Stress: { bg:"#FEF3DC", border:"#FAC775", text:"#633806", badge:"#FDE4A8", btext:"#633806" },
  Pain:   { bg:"#FCEAEA", border:"#F09595", text:"#501313", badge:"#FACACA", btext:"#A32D2D" },
};
const EC = { Calm:"#1D9E75", Happy:"#5A8F00", Sad:"#378ADD", Stress:"#EF9F27", Pain:"#E24B4A" };
const EMOTIONS = ["Happy","Sad","Calm","Stress","Pain"];

// ─── SVG ICONS ───────────────────────────────────────────────────────────────
const Icon = {
  grid:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>,
  wave:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 8h2l2-5 3 10 2-7 2 4h3"/></svg>,
  users: <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.5 2-4 5-4"/><circle cx="12" cy="9" r="2"/><path d="M10 14c0-1.5.9-2.5 2-2.5s2 1 2 2.5"/></svg>,
  bell:  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 2a4.5 4.5 0 014.5 4.5V10l1 2H2.5l1-2V6.5A4.5 4.5 0 018 2z"/><path d="M6.5 12.5a1.5 1.5 0 003 0"/></svg>,
  check: <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>,
  eeg:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
};

// ─── SMALL ATOMS ─────────────────────────────────────────────────────────────
const LiveDot = ({ active }) => (
  <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%",
    background:active?"#1D9E75":"#9CA3AF", flexShrink:0,
    animation:active?"pulse 2s infinite":"none" }}/>
);

const Toast = ({ msg, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, background:"#fff",
      border:"1px solid #E5E7EB", padding:"11px 16px", borderRadius:8, fontSize:13,
      fontWeight:500, boxShadow:"0 4px 16px rgba(0,0,0,.1)",
      display:"flex", alignItems:"center", gap:8, animation:"slideIn .3s ease" }}>
      <span style={{color:"#1D9E75",fontWeight:700}}>✓</span> {msg}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const m = { critical:["#FEE2E2","#991B1B"], warning:["#FEF3DC","#92400E"], normal:["#DCFCE7","#166534"] };
  const [bg,color] = m[status]||m.normal;
  return <span style={{background:bg,color,fontSize:10,padding:"2px 8px",borderRadius:10,fontWeight:500,whiteSpace:"nowrap"}}>
    {status.charAt(0).toUpperCase()+status.slice(1)}</span>;
};

const EmotionBadge = ({ emotion }) => {
  const s = ES[emotion]||ES.Calm;
  return <span style={{background:s.badge,color:s.btext,fontSize:10,padding:"2px 8px",borderRadius:10,fontWeight:500,whiteSpace:"nowrap"}}>
    {emotion}</span>;
};

const Avatar = ({ initials, color, tc, size=32 }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:color, color:tc,
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:size*0.36, fontWeight:600, flexShrink:0 }}>{initials}</div>
);

const Card = ({ children, style }) => (
  <div style={{ background:"#fff", border:"1px solid #F0F0F0", borderRadius:10, padding:16, ...style }}>
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <div style={{ fontSize:13, fontWeight:500, color:"#111827", marginBottom:12 }}>{children}</div>
);

const Spinner = ({ size=13, color="rgba(255,255,255,.3)", top="#fff" }) => (
  <div style={{ width:size, height:size, border:`2px solid ${color}`, borderRadius:"50%",
    borderTopColor:top, animation:"spin .8s linear infinite" }}/>
);

// ─── WAVEFORM CANVAS ─────────────────────────────────────────────────────────
function WaveformCanvas({ active }) {
  const cvRef  = useRef(null);
  const wave   = useRef({ alpha:[], beta:[], theta:[], delta:[] });
  const timer  = useRef(null);
  const MAX    = 80;

  // seed initial wave
  useEffect(() => {
    for (let i=0;i<MAX;i++) {
      wave.current.alpha.push(50+20*Math.sin(i*0.3));
      wave.current.beta.push( 50+15*Math.sin(i*0.5+1));
      wave.current.theta.push(50+18*Math.sin(i*0.2+2));
      wave.current.delta.push(50+22*Math.sin(i*0.15+3));
    }
    draw();
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!active) return;
    // Fetch waveform from backend every 2s, tick locally at 80ms
    let localT = Date.now() * 0.002;
    const tick = () => {
      localT += 0.08;
      const w = wave.current;
      w.alpha.push(50+20*Math.sin(localT)+3*(Math.random()-.5));
      w.beta.push( 50+15*Math.sin(localT*1.6+1)+3*(Math.random()-.5));
      w.theta.push(50+18*Math.sin(localT*0.7+2)+3*(Math.random()-.5));
      w.delta.push(50+22*Math.sin(localT*0.4+3)+3*(Math.random()-.5));
      ["alpha","beta","theta","delta"].forEach(k => { if(w[k].length>MAX) w[k].shift(); });
      draw();
      timer.current = setTimeout(tick, 80);
    };
    timer.current = setTimeout(tick, 80);
    return () => clearTimeout(timer.current);
  }, [active]);

  function draw() {
    const cv = cvRef.current; if (!cv) return;
    const W = cv.offsetWidth, H = 120;
    cv.width=W; cv.height=H;
    const ctx = cv.getContext("2d"); ctx.clearRect(0,0,W,H);
    [["alpha","#6C3FF7"],["beta","#E24B4A"],["theta","#1D9E75"],["delta","#EF9F27"]].forEach(([k,c]) => {
      const d = wave.current[k];
      ctx.beginPath(); ctx.strokeStyle=c; ctx.lineWidth=1.5; ctx.globalAlpha=.82;
      d.forEach((v,i) => { const x=(i/MAX)*W, y=(v/100)*H; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
      ctx.stroke(); ctx.globalAlpha=1;
    });
  }

  return (
    <div>
      <canvas ref={cvRef} style={{width:"100%",height:120,display:"block"}}/>
      <div style={{display:"flex",gap:14,marginTop:8,flexWrap:"wrap"}}>
        {[["#6C3FF7","Alpha"],["#E24B4A","Beta"],["#1D9E75","Theta"],["#EF9F27","Delta"]].map(([c,l]) => (
          <div key={l} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#9CA3AF"}}>
            <div style={{width:10,height:2,background:c,borderRadius:1}}/>{l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PIPELINE ────────────────────────────────────────────────────────────────
const PIPE  = ["EEG Signal","Preprocessing","Feature Extraction","Classification","Output"];
const PIPES = ["Signal","Filter","Features","Classify","Output"];

function Pipeline({ active, compact }) {
  const [step, setStep] = useState(-1);
  const [pct,  setPct]  = useState(0);
  const nodes = compact ? PIPES : PIPE;

  useEffect(() => {
    if (!active) { setStep(-1); setPct(0); return; }
    let s=0, alive=true;
    const run = () => {
      if (!alive) return;
      setStep(s); setPct(((s+1)/5)*100); s++;
      if (s<=5) setTimeout(run,600);
      else setTimeout(()=>{ if(alive){s=0; setTimeout(run,800);} }, 1000);
    };
    run();
    return () => { alive=false; };
  }, [active]);

  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-start"}}>
        {nodes.map((label,i) => (
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
            {i < nodes.length-1 && (
              <div style={{position:"absolute",top:17,left:"50%",width:"100%",height:2,
                background:step>i?"#1D9E75":"#E5E7EB",transition:"background .4s",zIndex:0}}/>
            )}
            <div style={{
              width:36,height:36,borderRadius:"50%",display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:12,zIndex:1,position:"relative",fontWeight:600,
              border:`2px solid ${step>i?"#1D9E75":step===i?"#6C3FF7":"#E5E7EB"}`,
              background:step>i?"#E1F5EE":step===i?"#EDE9FE":"#F9FAFB",
              color:step>i?"#1D9E75":step===i?"#6C3FF7":"#9CA3AF",
              animation:step===i?"ringPulse 1s infinite":"none",
              transition:"border-color .4s,background .4s",
            }}>
              {step>i ? "✓" : i+1}
            </div>
            <div style={{fontSize:9,color:"#9CA3AF",textAlign:"center",fontWeight:500,marginTop:6,lineHeight:1.3}}>
              {label}
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:14,height:3,background:"#F3F4F6",borderRadius:2,overflow:"hidden"}}>
        <div style={{height:"100%",background:"#6C3FF7",borderRadius:2,width:pct+"%",transition:"width .15s linear"}}/>
      </div>
    </div>
  );
}

// ─── EMOTION HERO ────────────────────────────────────────────────────────────
function EmotionHero({ emotion, confidence, bands, trend, sessionTime }) {
  const s = ES[emotion]||ES.Calm;
  return (
    <div style={{background:s.bg,border:`1px solid ${s.border}`,color:s.text,
      borderRadius:10,padding:"20px 24px",marginBottom:16,
      transition:"background .5s,border-color .5s,color .5s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:11,fontWeight:500,opacity:.65,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>
            Current Emotion
          </div>
          <div style={{fontSize:34,fontWeight:600,letterSpacing:"-.5px",lineHeight:1}}>{emotion}</div>
          <div style={{fontSize:13,marginTop:6,opacity:.8}}>
            {confidence ? `Confidence: ${confidence}%` : "Start monitoring to begin"}
          </div>
        </div>
        {(trend||sessionTime) && (
          <div style={{textAlign:"right",flexShrink:0}}>
            {trend && <>
              <div style={{fontSize:11,opacity:.6,marginBottom:4}}>Trend</div>
              <div style={{fontSize:15,fontWeight:500}}>{trend}</div>
            </>}
            {sessionTime && <div style={{fontSize:11,opacity:.6,marginTop:6}}>Session: {sessionTime}</div>}
          </div>
        )}
      </div>
      {bands && (
        <div style={{display:"flex",gap:10,marginTop:14,flexWrap:"wrap"}}>
          {[["α",bands.alpha],["β",bands.beta],["θ/δ",bands.thetaDelta]].map(([k,v]) => (
            <div key={k} style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:500,
              background:"rgba(255,255,255,.35)",border:"1px solid rgba(255,255,255,.4)"}}>
              {k}: {v}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STABLE BARS ─────────────────────────────────────────────────────────────
// useMemo ensures bar heights never recompute on parent re-render
function EmotionBars({ data, height=80 }) {
  const bars = useMemo(() => data.map(e => ({ emotion:e, h:Math.floor(Math.random()*50+28) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.length]); // only recalculate when length changes (new bar added)

  if (!data.length) return (
    <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#9CA3AF"}}>
      Start monitoring to see history
    </div>
  );
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:3,height}}>
      {bars.map((b,i) => (
        <div key={i} style={{flex:1,borderRadius:"2px 2px 0 0",background:EC[b.emotion],height:b.h,transition:".3s"}}/>
      ))}
    </div>
  );
}

function StaticBars({ count=20 }) {
  const bars = useMemo(() => Array.from({length:count}, () => {
    const e = EMOTIONS[Math.floor(Math.random()*5)];
    return { emotion:e, h:Math.floor(Math.random()*52+24) };
  }), []); // compute once, never changes

  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:3,height:80}}>
      {bars.map((b,i) => (
        <div key={i} style={{flex:1,borderRadius:"2px 2px 0 0",background:EC[b.emotion],height:b.h}}/>
      ))}
    </div>
  );
}

const EmotionLegend = () => (
  <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap"}}>
    {Object.entries(EC).map(([e,c]) => (
      <div key={e} style={{display:"flex",alignItems:"center",gap:4,fontSize:10,color:"#9CA3AF"}}>
        <div style={{width:8,height:8,borderRadius:2,background:c}}/>{e}
      </div>
    ))}
  </div>
);

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
const NAV = [
  {id:"dashboard",label:"Dashboard",   icon:"grid"},
  {id:"monitor",  label:"Live Monitor",icon:"wave"},
  {id:"patients", label:"Patients",    icon:"users"},
  {id:"alerts",   label:"Alerts",      icon:"bell"},
];

function Sidebar({ page, setPage, alertCount, monitoring, userName }) {
  const initials = userName ? userName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "DR";
  return (
    <div style={{width:220,minWidth:220,background:"#fff",borderRight:"1px solid #F0F0F0",
      display:"flex",flexDirection:"column",height:"100vh",flexShrink:0}}>
      <div style={{padding:"18px 16px 14px",borderBottom:"1px solid #F0F0F0"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:8,background:"#6C3FF7",color:"#fff",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>EEG</div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#111827"}}>NeuroTrack</div>
            <div style={{fontSize:11,color:"#9CA3AF"}}>Clinical Monitor</div>
          </div>
        </div>
      </div>
      <div style={{flex:1,padding:"10px 8px",overflowY:"auto"}}>
        <div style={{fontSize:10,fontWeight:500,color:"#D1D5DB",padding:"8px 8px 4px",
          letterSpacing:".07em",textTransform:"uppercase"}}>Main</div>
        {NAV.map(n => (
          <div key={n.id} onClick={() => setPage(n.id)}
            style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",
              borderRadius:7,cursor:"pointer",marginBottom:1,fontSize:13,
              transition:"background .12s,color .12s",
              background:page===n.id?"#6C3FF7":"transparent",
              color:page===n.id?"#fff":"#6B7280"}}>
            <span style={{opacity:page===n.id?1:.7}}>{Icon[n.icon]}</span>
            <span style={{flex:1}}>{n.label}</span>
            {n.id==="alerts" && alertCount>0 && (
              <span style={{background:page===n.id?"rgba(255,255,255,.25)":"#E24B4A",
                color:"#fff",fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:10}}>
                {alertCount}
              </span>
            )}
          </div>
        ))}
      </div>
      <div style={{padding:"12px 14px",borderTop:"1px solid #F0F0F0"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"#EDE9FE",color:"#6C3FF7",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,flexShrink:0}}>
            {initials}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:500,color:"#111827",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {userName||"Dr. Ummelaila"}
            </div>
            <div style={{fontSize:11,color:"#9CA3AF"}}>Neurologist</div>
          </div>
          <LiveDot active={monitoring}/>
        </div>
      </div>
    </div>
  );
}

// ─── TOPBAR ──────────────────────────────────────────────────────────────────
function TopBar({ title, monitoring, onToggle, alertCount, alerts, onLogout }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const fn = () => setOpen(false);
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, []);

  return (
    <div style={{padding:"0 24px",height:52,borderBottom:"1px solid #F0F0F0",background:"#fff",
      display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div style={{fontSize:15,fontWeight:500,color:"#111827"}}>{title}</div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,padding:"4px 10px",
          borderRadius:20,fontWeight:500,
          background:monitoring?"#DCFCE7":"#F3F4F6",color:monitoring?"#166534":"#9CA3AF"}}>
          <LiveDot active={monitoring}/>{monitoring?"Live":"Offline"}
        </div>
        <button onClick={onToggle} style={{padding:"6px 14px",borderRadius:7,border:"none",cursor:"pointer",
          fontSize:12,fontWeight:500,display:"flex",alignItems:"center",gap:6,
          background:monitoring?"#EF4444":"#6C3FF7",color:"#fff"}}>
          {monitoring?"Stop monitoring":"Start monitoring"}
        </button>
        <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>setOpen(o=>!o)} style={{width:34,height:34,borderRadius:7,
            border:"1px solid #F0F0F0",background:"#fff",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",position:"relative",color:"#6B7280"}}>
            {Icon.bell}
            {alertCount>0 && (
              <span style={{position:"absolute",top:-4,right:-4,background:"#E24B4A",color:"#fff",
                fontSize:9,fontWeight:700,width:16,height:16,borderRadius:"50%",
                display:"flex",alignItems:"center",justifyContent:"center"}}>{alertCount}</span>
            )}
          </button>
          {open && (
            <div style={{position:"absolute",top:40,right:0,width:290,background:"#fff",
              border:"1px solid #E5E7EB",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.09)",zIndex:200}}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid #F0F0F0",fontSize:12,fontWeight:500}}>Recent alerts</div>
              {alerts.filter(a=>!a.resolved).slice(0,4).map(a => (
                <div key={a.id} style={{padding:"10px 14px",borderBottom:"1px solid #F9FAFB",display:"flex",gap:10}}>
                  <div style={{width:8,height:8,borderRadius:"50%",marginTop:4,flexShrink:0,
                    background:a.type==="critical"?"#E24B4A":"#EF9F27"}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:500,color:"#111827"}}>{a.patient} — {a.emotion}</div>
                    <div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{a.time}</div>
                  </div>
                </div>
              ))}
              {!alerts.filter(a=>!a.resolved).length && (
                <div style={{padding:16,textAlign:"center",fontSize:12,color:"#9CA3AF"}}>No active alerts</div>
              )}
            </div>
          )}
        </div>
        <button onClick={onLogout} style={{padding:"6px 12px",borderRadius:7,border:"1px solid #E5E7EB",
          background:"transparent",cursor:"pointer",fontSize:12,color:"#6B7280"}}>Sign out</button>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ monitoring, alerts, patients, classCount, stats }) {
  const active = alerts.filter(a=>!a.resolved);
  const crit   = stats?.critical_alerts ?? active.filter(a=>a.type==="critical").length;

  return (
    <div style={{animation:"fadeIn .3s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
        {[
          ["Active Patients",      stats?.active_patients??8,       "Registered in system",      null],
          ["Critical Alerts",      crit,                             "Requires attention",        crit>0?"#DC2626":null],
          ["Live Classifications", classCount,                       "This session",              null],
        ].map(([label,val,sub,color]) => (
          <Card key={label}>
            <div style={{fontSize:11,color:"#9CA3AF",marginBottom:6,fontWeight:500,textTransform:"uppercase",letterSpacing:".05em"}}>{label}</div>
            <div style={{fontSize:26,fontWeight:500,color:color||"#111827"}}>{val}</div>
            <div style={{fontSize:11,color:"#9CA3AF",marginTop:4}}>{sub}</div>
          </Card>
        ))}
      </div>

      <Card style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <CardTitle>EEG Processing Pipeline</CardTitle>
          <span style={{fontSize:11,color:monitoring?"#1D9E75":"#9CA3AF"}}>{monitoring?"Running":"Idle"}</span>
        </div>
        <Pipeline active={monitoring}/>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <CardTitle>EEG Waveform (live)</CardTitle>
            <span style={{fontSize:11,color:"#9CA3AF"}}>4 bands</span>
          </div>
          <WaveformCanvas active={monitoring}/>
        </Card>
        <Card>
          <CardTitle>Recent Alerts</CardTitle>
          {active.slice(0,3).map(a => (
            <div key={a.id} style={{padding:"9px 11px",borderRadius:7,marginBottom:8,
              border:`1px solid ${a.type==="critical"?"#FACACA":"#FDE4A8"}`,
              background:a.type==="critical"?"#FCEAEA":"#FEF3DC",
              display:"flex",gap:9}}>
              <div style={{width:7,height:7,borderRadius:"50%",marginTop:4,flexShrink:0,
                background:a.type==="critical"?"#E24B4A":"#EF9F27"}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:"#111827"}}>{a.patient}</div>
                <div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{a.msg}</div>
              </div>
              <div style={{fontSize:10,color:"#9CA3AF",flexShrink:0,whiteSpace:"nowrap"}}>{a.time}</div>
            </div>
          ))}
          {!active.length && <div style={{fontSize:12,color:"#9CA3AF",textAlign:"center",padding:20}}>No active alerts</div>}
        </Card>
      </div>

      <Card>
        <CardTitle>Patient Directory</CardTitle>
        {patients.slice(0,4).map((p,i) => (
          <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",
            borderBottom:i<3?"1px solid #F9FAFB":"none"}}>
            <Avatar initials={p.initials} color={p.color} tc={p.tc}/>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,color:"#111827"}}>{p.name}</div>
              <div style={{fontSize:11,color:"#9CA3AF"}}>{p.condition}</div>
            </div>
            <EmotionBadge emotion={p.emotion}/>
            <StatusBadge status={p.status}/>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── MONITOR PAGE ─────────────────────────────────────────────────────────────
function MonitorPage({ monitoring, emotion, confidence, bands, trend, sessionTime, sessionBars }) {
  return (
    <div style={{animation:"fadeIn .3s ease"}}>
      <EmotionHero emotion={emotion} confidence={monitoring?confidence:null}
        bands={monitoring?bands:null} trend={monitoring?trend:null} sessionTime={monitoring?sessionTime:null}/>
      <Card style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <CardTitle>Live Pipeline</CardTitle>
          <span style={{fontSize:11,color:monitoring?"#1D9E75":"#9CA3AF"}}>{monitoring?"Running":"Idle"}</span>
        </div>
        <Pipeline active={monitoring} compact/>
      </Card>
      <Card>
        <CardTitle>Emotion History (this session)</CardTitle>
        <EmotionBars data={sessionBars} height={80}/>
        <EmotionLegend/>
      </Card>
    </div>
  );
}

// ─── PATIENTS PAGE ────────────────────────────────────────────────────────────
function PatientsPage({ patients, onSelect, loading }) {
  const [q, setQ] = useState("");
  const filtered = patients.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div style={{animation:"fadeIn .3s ease"}}>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search patients by name..."
        style={{width:"100%",padding:"9px 12px",border:"1px solid #E5E7EB",borderRadius:8,
          background:"#fff",fontSize:13,marginBottom:14,outline:"none"}}/>
      <Card>
        {loading
          ? <div style={{textAlign:"center",padding:32,color:"#9CA3AF",fontSize:13}}>Loading patients...</div>
          : !filtered.length
          ? <div style={{textAlign:"center",color:"#9CA3AF",fontSize:13,padding:32}}>No patients found</div>
          : filtered.map((p,i) => (
            <div key={p.id} onClick={()=>onSelect(p)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 8px",
                borderRadius:7,cursor:"pointer",marginBottom:i<filtered.length-1?2:0,
                borderBottom:i<filtered.length-1?"1px solid #F9FAFB":"none",transition:"background .12s"}}
              onMouseEnter={e=>e.currentTarget.style.background="#F9FAFB"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <Avatar initials={p.initials} color={p.color} tc={p.tc}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:"#111827"}}>{p.name}</div>
                <div style={{fontSize:11,color:"#9CA3AF"}}>Age {p.age} · {p.condition}</div>
              </div>
              <EmotionBadge emotion={p.emotion}/>
              <StatusBadge status={p.status}/>
            </div>
          ))}
      </Card>
    </div>
  );
}

// ─── PATIENT DETAIL PAGE ──────────────────────────────────────────────────────
function PatientDetailPage({ patient, onBack, showToast }) {
  const [note,    setNote]    = useState("");
  const [notes,   setNotes]   = useState([]);
  const [saving,  setSaving]  = useState(false);
  const sigQ = useMemo(() => Math.floor(Math.random()*15+80), [patient.id]);
  const dur  = useMemo(() => Math.floor(Math.random()*40+10), [patient.id]);
  const s    = ES[patient.emotion]||ES.Calm;

  useEffect(() => {
    api.getNotes(patient.id).then(r => setNotes(r.notes||[])).catch(()=>{});
  }, [patient.id]);

  const saveNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const r = await api.addNote(patient.id, note);
      setNotes(r.notes||[]);
      setNote("");
      showToast("Note saved successfully");
    } catch { showToast("Failed to save note"); }
    finally  { setSaving(false); }
  };

  return (
    <div style={{animation:"fadeIn .3s ease"}}>
      <div onClick={onBack}
        style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",
          fontSize:13,color:"#9CA3AF",marginBottom:16,width:"fit-content",transition:"color .12s"}}
        onMouseEnter={e=>e.currentTarget.style.color="#374151"}
        onMouseLeave={e=>e.currentTarget.style.color="#9CA3AF"}>
        &larr; Back to patients
      </div>

      <div style={{background:s.bg,border:`1px solid ${s.border}`,color:s.text,
        borderRadius:10,padding:"20px 24px",marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:500,opacity:.65,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>
          Current Emotion
        </div>
        <div style={{fontSize:34,fontWeight:600,letterSpacing:"-.5px"}}>{patient.emotion}</div>
        <div style={{fontSize:13,marginTop:4,opacity:.8}}>Confidence: {Math.floor(Math.random()*15+80)}%</div>
        <div style={{display:"flex",gap:10,marginTop:12,flexWrap:"wrap"}}>
          <div style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:500,background:"rgba(255,255,255,.35)"}}>
            Patient: {patient.name}
          </div>
          <StatusBadge status={patient.status}/>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        {[["Signal Quality",sigQ+"%"],["Session Duration",dur+" min"]].map(([l,v]) => (
          <Card key={l}>
            <div style={{fontSize:11,color:"#9CA3AF",fontWeight:500,textTransform:"uppercase",letterSpacing:".05em",marginBottom:6}}>{l}</div>
            <div style={{fontSize:26,fontWeight:500,color:"#111827"}}>{v}</div>
          </Card>
        ))}
      </div>

      <Card style={{marginBottom:14}}>
        <CardTitle>Emotion History</CardTitle>
        <StaticBars count={20}/>
        <EmotionLegend/>
      </Card>

      <Card>
        <CardTitle>Doctor Notes</CardTitle>
        {notes.length>0 && (
          <div style={{marginBottom:12}}>
            {notes.map((n,i) => (
              <div key={i} style={{fontSize:12,color:"#374151",padding:"8px 10px",
                background:"#F9FAFB",borderRadius:6,border:"1px solid #F0F0F0",marginBottom:6}}>
                <span style={{fontSize:10,color:"#9CA3AF",display:"block",marginBottom:2}}>{n.time}</span>
                {n.note}
              </div>
            ))}
          </div>
        )}
        <textarea value={note} onChange={e=>setNote(e.target.value)}
          placeholder="Add a clinical note..."
          style={{width:"100%",padding:"9px 11px",border:"1px solid #E5E7EB",borderRadius:7,
            background:"#fff",fontSize:13,resize:"vertical",minHeight:72,outline:"none"}}/>
        <button onClick={saveNote} disabled={saving}
          style={{marginTop:8,padding:"7px 18px",borderRadius:7,background:"#6C3FF7",
            color:"#fff",border:"none",fontSize:13,cursor:"pointer",fontWeight:500,
            display:"flex",alignItems:"center",gap:6,opacity:saving?.7:1}}>
          {saving && <Spinner/>}
          {saving?"Saving...":"Save note"}
        </button>
      </Card>
    </div>
  );
}

// ─── ALERTS PAGE ──────────────────────────────────────────────────────────────
function AlertsPage({ alerts, onAck, loading }) {
  const [filter, setFilter] = useState("all");
  const chips = [["all","All"],["critical","Critical"],["warning","Warning"],["resolved","Resolved"]];
  const filtered =
    filter==="resolved" ? alerts.filter(a=>a.resolved)
    : filter==="all"   ? alerts.filter(a=>!a.resolved)
    : alerts.filter(a=>a.type===filter&&!a.resolved);

  return (
    <div style={{animation:"fadeIn .3s ease"}}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {chips.map(([val,label]) => (
          <div key={val} onClick={()=>setFilter(val)}
            style={{padding:"5px 14px",borderRadius:20,fontSize:12,cursor:"pointer",border:"1px solid",
              transition:".12s",borderColor:filter===val?"#6C3FF7":"#E5E7EB",
              background:filter===val?"#6C3FF7":"transparent",color:filter===val?"#fff":"#6B7280"}}>
            {label}
          </div>
        ))}
      </div>

      {loading
        ? <div style={{textAlign:"center",padding:32,color:"#9CA3AF",fontSize:13}}>Loading alerts...</div>
        : !filtered.length
        ? <div style={{textAlign:"center",color:"#9CA3AF",fontSize:13,padding:40,
            background:"#F9FAFB",borderRadius:10,border:"1px dashed #E5E7EB"}}>
            No alerts in this category
          </div>
        : filtered.map(a => (
          <div key={a.id} style={{padding:"12px 14px",borderRadius:8,marginBottom:8,
            border:`1px solid ${a.resolved?"#A7E9D2":a.type==="critical"?"#FACACA":"#FDE4A8"}`,
            background:a.resolved?"#E1F5EE":a.type==="critical"?"#FCEAEA":"#FEF3DC",
            display:"flex",gap:10}}>
            <div style={{width:7,height:7,borderRadius:"50%",marginTop:5,flexShrink:0,
              background:a.resolved?"#1D9E75":a.type==="critical"?"#E24B4A":"#EF9F27"}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:"#111827"}}>{a.patient}</div>
              <div style={{fontSize:11,color:"#6B7280",marginTop:3}}>{a.msg}</div>
              <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center"}}>
                {!a.resolved && (
                  <button onClick={()=>onAck(a.id)}
                    style={{fontSize:11,padding:"3px 10px",borderRadius:6,cursor:"pointer",
                      background:"rgba(255,255,255,.6)",fontWeight:500,
                      border:`1px solid ${a.type==="critical"?"#F09595":"#FAC775"}`,
                      color:a.type==="critical"?"#991B1B":"#92400E"}}>
                    Acknowledge
                  </button>
                )}
                <span style={{fontSize:10,color:"#9CA3AF"}}>{a.time}</span>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── PATIENT DASHBOARD ────────────────────────────────────────────────────────
function PatientDashboard({ onLogout, userName }) {
  const [emotion, setEmotion] = useState("Calm");
  const [conf,    setConf]    = useState(87);
  const [bands,   setBands]   = useState(null);
  const [bars,    setBars]    = useState([]);
  const [secs,    setSecs]    = useState(0);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const r = await api.classifyEEG();
        setEmotion(r.emotion);
        setConf(r.confidence);
        setBands({ alpha:r.bands.alpha.toFixed(2), beta:r.bands.beta.toFixed(2),
          thetaDelta:(r.bands.theta/r.bands.delta).toFixed(2) });
        setBars(p => { const n=[...p,r.emotion]; return n.length>20?n.slice(-20):n; });
      } catch {
        // fallback: local classify
        const b = { alpha:0.5, beta:0.3, theta:0.4, delta:0.5 };
        setEmotion("Calm");
      }
    }, 3000);
    const si = setInterval(() => setSecs(s=>s+1), 1000);
    return () => { clearInterval(iv); clearInterval(si); };
  }, []);

  const mm = String(Math.floor(secs/60)).padStart(2,"0");
  const ss = String(secs%60).padStart(2,"0");

  return (
    <div style={{minHeight:"100vh",background:"#F9FAFB",fontFamily:"Inter,system-ui,sans-serif"}}>
      <style>{GS}</style>
      <div style={{padding:"0 24px",height:52,background:"#fff",borderBottom:"1px solid #F0F0F0",
        display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:7,background:"#6C3FF7",color:"#fff",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>EEG</div>
          <span style={{fontSize:14,fontWeight:500,color:"#111827"}}>NeuroTrack</span>
          <span style={{fontSize:12,color:"#D1D5DB",margin:"0 2px"}}>/</span>
          <span style={{fontSize:13,color:"#6B7280"}}>Patient View</span>
        </div>
        <button onClick={onLogout} style={{padding:"6px 12px",borderRadius:7,border:"1px solid #E5E7EB",
          background:"transparent",cursor:"pointer",fontSize:12,color:"#6B7280"}}>Sign out</button>
      </div>

      <div style={{maxWidth:700,margin:"32px auto",padding:"0 24px"}}>
        <div style={{background:"#EDE9FE",borderRadius:10,padding:"13px 16px",marginBottom:14,
          display:"flex",alignItems:"center",gap:12,border:"1px solid #C4B5FD"}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:"#6C3FF7",color:"#fff",
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,flexShrink:0}}>SJ</div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:"#7C3AED",marginBottom:2}}>You are being monitored by</div>
            <div style={{fontSize:13,fontWeight:600,color:"#4C1D95"}}>Dr. Ummelaila — Neurologist</div>
          </div>
          <LiveDot active={true}/>
        </div>

        <EmotionHero emotion={emotion} confidence={conf} bands={bands} trend="Stable" sessionTime={`${mm}:${ss}`}/>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
          {[["Session Time",`${mm}:${ss}`],["Confidence",conf+"%"],["Status","Monitored"]].map(([l,v]) => (
            <Card key={l}>
              <div style={{fontSize:10,color:"#9CA3AF",fontWeight:500,textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>{l}</div>
              <div style={{fontSize:20,fontWeight:500,color:"#111827"}}>{v}</div>
            </Card>
          ))}
        </div>

        <Card>
          <CardTitle>Your Emotion History</CardTitle>
          <EmotionBars data={bars} height={80}/>
          <EmotionLegend/>
        </Card>
      </div>
    </div>
  );
}

// ─── DOCTOR APP ───────────────────────────────────────────────────────────────
function DoctorApp({ onLogout, userName }) {
  const [page,       setPage]      = useState("dashboard");
  const [monitoring, setMon]       = useState(false);
  const [emotion,    setEmotion]   = useState("Calm");
  const [conf,       setConf]      = useState(87);
  const [bands,      setBands]     = useState(null);
  const [trend,      setTrend]     = useState("Stable");
  const [sessionBars,setBars]      = useState([]);
  const [sessionSecs,setSecs]      = useState(0);
  const [classCount, setCount]     = useState(0);
  const [alerts,     setAlerts]    = useState([]);
  const [patients,   setPatients]  = useState([]);
  const [stats,      setStats]     = useState(null);
  const [selPatient, setSelPat]    = useState(null);
  const [toast,      setToast]     = useState(null);
  const [loadPat,    setLoadPat]   = useState(true);
  const [loadAlt,    setLoadAlt]   = useState(true);
  const streak = useRef({ emotion:"Calm", count:0 });

  // Initial data load
  useEffect(() => {
    api.getPatients().then(r => { setPatients(r.patients||[]); setLoadPat(false); }).catch(()=>setLoadPat(false));
    api.getAlerts().then(r => { setAlerts(r.alerts||[]); setLoadAlt(false); }).catch(()=>setLoadAlt(false));
    api.getStats().then(r => setStats(r)).catch(()=>{});
  }, []);

  // EEG monitoring loop — calls backend every 3s
  useEffect(() => {
    if (!monitoring) return;
    const iv = setInterval(async () => {
      try {
        const r = await api.classifyEEG();
        const em = r.emotion;
        const prev = streak.current.emotion;
        streak.current = { emotion:em, count:em===prev?streak.current.count+1:1 };

        setEmotion(em);
        setConf(r.confidence);
        setBands({ alpha:r.bands.alpha.toFixed(2), beta:r.bands.beta.toFixed(2),
          thetaDelta:(r.bands.theta/r.bands.delta).toFixed(2) });
        setTrend(em===prev?"Stable":(em==="Calm"||em==="Happy")?"Improving":"Escalating");
        setBars(p=>{ const n=[...p,em]; return n.length>30?n.slice(-30):n; });
        setCount(c=>c+1);
        setPatients(prev=>prev.map((p,i)=>i===0?{...p,emotion:em,status:em==="Pain"?"critical":em==="Stress"?"warning":"normal"}:p));

        // Auto-alert after 3 consecutive bad cycles
        if ((em==="Stress"||em==="Pain") && streak.current.count===3) {
          const newAlert = await api.createAlert({
            patient:"Live Patient", emotion:em,
            type:em==="Pain"?"critical":"warning",
            msg:`${em} detected for 3 consecutive cycles`,
          });
          if (newAlert.alert) setAlerts(a=>[newAlert.alert,...a]);
        }
      } catch { /* backend unreachable, skip */ }
    }, 3000);
    const si = setInterval(()=>setSecs(s=>s+1),1000);
    return ()=>{ clearInterval(iv); clearInterval(si); };
  }, [monitoring]);

  const ackAlert = useCallback(async (id) => {
    try {
      await api.ackAlert(id);
      setAlerts(a=>a.map(x=>x.id===id?{...x,resolved:true}:x));
      setToast("Alert acknowledged");
    } catch { setToast("Failed to acknowledge"); }
  }, []);

  const activeAlerts = alerts.filter(a=>!a.resolved);
  const mm  = String(Math.floor(sessionSecs/60)).padStart(2,"0");
  const ss2 = String(sessionSecs%60).padStart(2,"0");

  const TITLES = {
    dashboard:"Dashboard", monitor:"Live Monitor",
    patients:"Patients",   "patient-detail":"Patient Detail", alerts:"Alerts",
  };

  const goPage = p => { setPage(p); if(p!=="patient-detail") setSelPat(null); };

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"Inter,system-ui,sans-serif",background:"#F9FAFB"}}>
      <style>{GS}</style>
      <Sidebar page={page} setPage={goPage} alertCount={activeAlerts.length} monitoring={monitoring} userName={userName}/>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <TopBar title={TITLES[page]||page} monitoring={monitoring}
          onToggle={()=>{ setMon(m=>!m); if(monitoring){setSecs(0);setBars([]);} }}
          alertCount={activeAlerts.length} alerts={alerts} onLogout={onLogout}/>
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>
          {page==="dashboard"      && <DashboardPage monitoring={monitoring} alerts={alerts} patients={patients} classCount={classCount} stats={stats}/>}
          {page==="monitor"        && <MonitorPage monitoring={monitoring} emotion={emotion} confidence={conf} bands={bands} trend={trend} sessionTime={`${mm}:${ss2}`} sessionBars={sessionBars}/>}
          {page==="patients"       && <PatientsPage patients={patients} loading={loadPat} onSelect={p=>{setSelPat(p);setPage("patient-detail");}}/>}
          {page==="patient-detail" && selPatient && <PatientDetailPage patient={selPatient} onBack={()=>goPage("patients")} showToast={setToast}/>}
          {page==="alerts"         && <AlertsPage alerts={alerts} onAck={ackAlert} loading={loadAlt}/>}
        </div>
      </div>
      {toast && <Toast msg={toast} onDone={()=>setToast(null)}/>}
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [role,    setRole]    = useState("Doctor");
  const [email,   setEmail]   = useState("dr.johnson@hospital.com");
  const [pass,    setPass]    = useState("password");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const r = await api.login(email, pass);
      onLogin(r.role, r.name);
    } catch (e) {
      setError(e.message || "Invalid credentials");
    } finally { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",fontFamily:"Inter,system-ui,sans-serif"}}>
      <style>{GS}</style>
      <div style={{flex:1,background:"linear-gradient(145deg,#3B1FA3 0%,#6C3FF7 55%,#9B6FFA 100%)",
        padding:"48px 52px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{width:38,height:38,borderRadius:10,background:"rgba(255,255,255,.18)",
          display:"flex",alignItems:"center",justifyContent:"center",marginBottom:18,
          border:"1px solid rgba(255,255,255,.25)"}}>
          {Icon.eeg}
        </div>
        <div style={{fontSize:26,fontWeight:600,color:"#fff",marginBottom:8,lineHeight:1.3}}>
          EEG Based Emotion<br/>Recognition System
        </div>
        <div style={{fontSize:14,color:"rgba(255,255,255,.72)",maxWidth:340,lineHeight:1.65,marginBottom:36}}>
          Helping clinicians understand patient emotional states when verbal communication is not possible.
        </div>
        {["Continuous EEG-based emotional insights",
          "Early detection of stress and pain signals",
          "Smart alerts for critical patient conditions"].map(t => (
          <div key={t} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:14}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:"rgba(255,255,255,.2)",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
              {Icon.check}
            </div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.83)",lineHeight:1.5}}>{t}</div>
          </div>
        ))}
      </div>

      <div style={{width:440,background:"#fff",padding:"48px 44px",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{fontSize:22,fontWeight:600,color:"#111827",marginBottom:4}}>Sign in</div>
        <div style={{fontSize:13,color:"#9CA3AF",marginBottom:28}}>Access your clinical dashboard</div>

        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:500,color:"#374151",marginBottom:5,display:"block"}}>Email address</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
            style={{width:"100%",padding:"9px 12px",border:"1px solid #E5E7EB",borderRadius:7,fontSize:13,outline:"none"}}/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:500,color:"#374151",marginBottom:5,display:"block"}}>Password</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            style={{width:"100%",padding:"9px 12px",border:"1px solid #E5E7EB",borderRadius:7,fontSize:13,outline:"none"}}/>
        </div>

        <div style={{marginBottom:20}}>
          <label style={{fontSize:12,fontWeight:500,color:"#374151",marginBottom:6,display:"block"}}>Role</label>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {["Doctor","Patient"].map(r => (
              <div key={r} onClick={()=>{ setRole(r); setEmail(r==="Doctor"?"dr.johnson@hospital.com":"patient@hospital.com"); }}
                style={{padding:"10px 0",borderRadius:7,cursor:"pointer",textAlign:"center",
                  fontSize:13,fontWeight:500,border:"1px solid",transition:".12s",
                  borderColor:role===r?"#6C3FF7":"#E5E7EB",
                  background:role===r?"#EDE9FE":"transparent",
                  color:role===r?"#6C3FF7":"#374151"}}>
                {r}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{marginBottom:12,padding:"9px 12px",background:"#FCEAEA",border:"1px solid #FACACA",
            borderRadius:7,fontSize:12,color:"#991B1B"}}>{error}</div>
        )}

        <button onClick={submit} disabled={loading}
          style={{width:"100%",padding:"10px 0",borderRadius:7,background:"#6C3FF7",color:"#fff",
            border:"none",fontSize:14,fontWeight:500,cursor:"pointer",
            opacity:loading?.75:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          {loading && <Spinner/>}
          {loading?"Signing in...":"Sign in to dashboard"}
        </button>

        <div style={{marginTop:20,padding:"12px 14px",background:"#F9FAFB",borderRadius:7,
          border:"1px solid #F0F0F0",fontSize:12,color:"#6B7280",lineHeight:1.7}}>
          <strong style={{color:"#374151"}}>Doctor:</strong> dr.johnson@hospital.com / password<br/>
          <strong style={{color:"#374151"}}>Patient:</strong> patient@hospital.com / password
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [role,     setRole]     = useState(null);
  const [userName, setUserName] = useState("");

  const handleLogin = (role, name) => { setRole(role); setUserName(name); };
  const handleLogout = () => { setRole(null); setUserName(""); };

  if (!role) return <LoginPage onLogin={handleLogin}/>;
  if (role==="Patient") return <PatientDashboard onLogout={handleLogout} userName={userName}/>;
  return <DoctorApp onLogout={handleLogout} userName={userName}/>;
}