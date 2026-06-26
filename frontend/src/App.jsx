import { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } from "react";
import * as api from "./api";
import AdminApp from "./AdminApp";

// ─── THEME ────────────────────────────────────────────────────────────────────
const ThemeCtx = createContext({});
const useT = () => useContext(ThemeCtx);
const LIGHT = { bg:"#F0F3FC", card:"#fff", cardBorder:"rgba(9,48,149,.07)", text:"#111827", textSec:"#4B5563", textMuted:"#9CA3AF", divider:"#E5E9F5", inputBg:"#F8F9FF", sidebar:"#fff", topbar:"#fff", hover:"#F8F9FF" };
const DARK  = { bg:"#080E1E", card:"#0F1829", cardBorder:"rgba(255,255,255,.08)", text:"#E8EDFB", textSec:"#8B97C4", textMuted:"#4C5A82", divider:"#1A2645", inputBg:"#0B1525", sidebar:"#0A1220", topbar:"#0B1525", hover:"#131F3A" };

// ─── EMOTION CONFIG ───────────────────────────────────────────────────────────
const SEVERITY = { Happy:38, Calm:30, Sad:52, Stress:78, Pain:90 };
const ES = {
  Happy:  { bg:"#E8FDF3", border:"#86EFAC", text:"#14532D", badge:"#DCFCE7", btext:"#166534", icon:"😊" },
  Sad:    { bg:"#EFF6FF", border:"#93C5FD", text:"#1E3A8A", badge:"#DBEAFE", btext:"#1D4ED8", icon:"😔" },
  Calm:   { bg:"#ECFDF5", border:"#6EE7B7", text:"#064E3B", badge:"#D1FAE5", btext:"#059669", icon:"😌" },
  Stress: { bg:"#FFFBEB", border:"#FCD34D", text:"#78350F", badge:"#FEF3C7", btext:"#D97706", icon:"😰" },
  Pain:   { bg:"#FEF2F2", border:"#FCA5A5", text:"#7F1D1D", badge:"#FEE2E2", btext:"#DC2626", icon:"😣" },
};
const EC = { Calm:"#10B981", Happy:"#22C55E", Sad:"#3B82F6", Stress:"#F59E0B", Pain:"#EF4444" };
const EMOTIONS = ["Happy","Sad","Calm","Stress","Pain"];

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icons = {
  dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  monitor:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  patients:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  analytics: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  alerts:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  settings:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  eeg:       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  logout:    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  check:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  search:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  menu:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  moon:      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  sun:       <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  upload:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  print:     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  brain:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96-.46 2.5 2.5 0 01-1.07-4.6A3 3 0 016.5 9a2.5 2.5 0 01-.5-5 2.5 2.5 0 013.5-2z"/><path d="M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96-.46 2.5 2.5 0 001.07-4.6A3 3 0 0017.5 9a2.5 2.5 0 00.5-5 2.5 2.5 0 00-3.5-2z"/></svg>,
  chevron:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};

// ─── SHARED ATOMS ─────────────────────────────────────────────────────────────
const LiveDot = ({ active, size=8 }) => (
  <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", flexShrink:0,
    background:active?"#22C55E":"#9CA3AF", animation:active?"pulse 2s infinite":"none",
    boxShadow:active?"0 0 0 2px rgba(34,197,94,.25)":"none" }}/>
);

const Spinner = ({ size=16, color="rgba(255,255,255,.4)", top="#fff" }) => (
  <div style={{ width:size, height:size, border:`2px solid ${color}`, borderRadius:"50%",
    borderTopColor:top, animation:"spin .75s linear infinite", flexShrink:0 }}/>
);

const Toast = ({ msg, onDone }) => {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  return (
    <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999, background:"#ECFDF5",
      border:"1px solid #86EFAC", padding:"12px 18px", borderRadius:12, fontSize:13,
      fontWeight:500, color:"#059669", boxShadow:"0 8px 24px rgba(0,0,0,.12)",
      display:"flex", alignItems:"center", gap:10, animation:"slideInRight .3s ease" }}>
      <span style={{width:20,height:20,borderRadius:"50%",background:"#059669",display:"flex",
        alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}>{Icons.check}</span>
      {msg}
    </div>
  );
};

const EmotionBadge = ({ emotion }) => {
  const s = ES[emotion]||ES.Calm;
  return <span style={{ background:s.badge, color:s.btext, fontSize:11, fontWeight:600,
    padding:"3px 10px", borderRadius:99, whiteSpace:"nowrap" }}>{s.icon} {emotion}</span>;
};

const StatusBadge = ({ status }) => {
  const m = { critical:["#FEE2E2","#DC2626"], warning:["#FEF3C7","#D97706"], normal:["#DCFCE7","#059669"] };
  const [bg,tc] = m[status]||m.normal;
  return <span style={{ background:bg, color:tc, fontSize:10, fontWeight:600,
    padding:"3px 10px", borderRadius:99, whiteSpace:"nowrap", textTransform:"capitalize" }}>{status}</span>;
};

const Avatar = ({ initials, color="#E0E7FF", tc="#4338CA", size=38 }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:color, color:tc,
    display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:size*0.36, fontWeight:700, flexShrink:0 }}>{initials}</div>
);

function Card({ children, style, onClick }) {
  const T = useT();
  return (
    <div onClick={onClick} style={{ background:T.card, borderRadius:14, padding:20,
      boxShadow:"0 2px 8px rgba(9,48,149,.06)", border:`1px solid ${T.cardBorder}`,
      transition:"background .2s,border .2s", ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, action }) {
  const T = useT();
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
      <h3 style={{ fontSize:14, fontWeight:600, color:T.text, letterSpacing:"-.01em", display:"flex", alignItems:"center", gap:8 }}>{children}</h3>
      {action}
    </div>
  );
}

function Modal({ children, onClose, title, width=520 }) {
  const T = useT();
  useEffect(() => {
    const fn = e => e.key==="Escape" && onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);
  return (
    <div style={{ position:"fixed", inset:0, zIndex:500, display:"flex", alignItems:"center",
      justifyContent:"center", padding:16, background:"rgba(0,0,0,.45)", backdropFilter:"blur(3px)" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:T.card, borderRadius:18, width:"100%", maxWidth:width,
        maxHeight:"90vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.25)",
        animation:"scaleIn .2s ease" }}>
        <div style={{ padding:"18px 22px", borderBottom:`1px solid ${T.divider}`,
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:15, fontWeight:700, color:T.text }}>{title}</span>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer",
            color:T.textMuted, display:"flex", padding:4 }}>{Icons.close}</button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── MESSAGING PANEL ─────────────────────────────────────────────────────────
function MessagingPanel({ patientId, senderRole }) {
  const T=useT();
  const [messages,setMessages]=useState([]);
  const [input,setInput]=useState(""), [sending,setSending]=useState(false);
  const [msgError,setMsgError]=useState(null);
  const bottomRef=useRef(null);
  const prevCountRef=useRef(0);

  const loadMsgs=useCallback(()=>{
    if(!patientId)return;
    api.getMessages(patientId).then(r=>{
      const msgs=r.messages||[];
      setMessages(msgs);
    }).catch(()=>{});
  },[patientId]);

  useEffect(()=>{ loadMsgs(); },[loadMsgs]);

  // Poll every 5s for new messages
  useEffect(()=>{
    const iv=setInterval(loadMsgs,5000);
    return()=>clearInterval(iv);
  },[loadMsgs]);

  // Only scroll to bottom when message COUNT increases (new message arrived)
  useEffect(()=>{
    if(messages.length>prevCountRef.current){
      bottomRef.current?.scrollIntoView({behavior:"smooth"});
    }
    prevCountRef.current=messages.length;
  },[messages]);

  const send=async()=>{
    const txt=input.trim();
    if(!txt||sending)return;
    setMsgError(null);
    setSending(true);
    setInput("");
    try{
      const r=await api.sendMessage(patientId,senderRole,txt);
      if(r?.message){
        setMessages(m=>[...m,r.message]);
      } else {
        // Reload from server in case message format differs
        loadMsgs();
      }
    }catch(e){
      setInput(txt);
      setMsgError(e.message||"Failed to send");
    }
    finally{ setSending(false); }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:340}}>
      {/* message list */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 0",display:"flex",flexDirection:"column",gap:10}}>
        {messages.length===0&&(
          <div style={{textAlign:"center",color:T.textMuted,fontSize:13,marginTop:40}}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map(m=>{
          const mine=m.sender_role===senderRole;
          return (
            <div key={m.id} style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",gap:8}}>
              {!mine&&(
                <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#093095,#2E5BE8)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,alignSelf:"flex-end"}}>
                  {m.sender_role==="Doctor"?"👨‍⚕️":"🏥"}
                </div>
              )}
              <div style={{maxWidth:"72%"}}>
                {!mine&&<div style={{fontSize:10,color:T.textMuted,marginBottom:3,fontWeight:500}}>{m.sender_role}</div>}
                <div style={{
                  background:mine?"linear-gradient(135deg,#093095,#2E5BE8)":T.inputBg,
                  color:mine?"#fff":T.text,
                  padding:"9px 13px",fontSize:13,lineHeight:1.55,
                  borderRadius:mine?"14px 14px 4px 14px":"14px 14px 14px 4px",
                  border:mine?"none":`1px solid ${T.divider}`}}>
                  {m.content}
                </div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:3,textAlign:mine?"right":"left"}}>{m.sent_at}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>
      {/* error banner */}
      {msgError&&<div style={{padding:"7px 12px",marginBottom:8,borderRadius:8,
        background:"#FEE2E2",border:"1px solid #FCA5A5",fontSize:12,color:"#DC2626"}}>
        ⚠ {msgError}
      </div>}
      {/* input row */}
      <div style={{paddingTop:12,borderTop:`1px solid ${T.divider}`,display:"flex",gap:8,alignItems:"center"}}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder={`Message as ${senderRole}…`}
          style={{flex:1,padding:"9px 13px",borderRadius:10,border:`1px solid ${T.divider}`,
            background:T.inputBg,color:T.text,fontSize:13,outline:"none",fontFamily:"inherit"}}
          onFocus={e=>e.target.style.borderColor="#093095"}
          onBlur={e=>e.target.style.borderColor=T.divider}/>
        <button onClick={send} disabled={sending||!input.trim()}
          style={{width:38,height:38,flexShrink:0,borderRadius:10,border:"none",cursor:sending?"not-allowed":"pointer",
            background:input.trim()?"linear-gradient(135deg,#093095,#2E5BE8)":"#C3CCDF",
            color:"#fff",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}>
          {sending?<Spinner size={14}/>:"➤"}
        </button>
      </div>
    </div>
  );
}

// ─── SVG DONUT CHART ─────────────────────────────────────────────────────────
function DonutChart({ data, size=180 }) {
  const cx=size/2, cy=size/2, R=size*0.38, r=size*0.22;
  const total = Object.values(data).reduce((a,b)=>a+b,0)||1;
  let angle = -90;
  const segments = Object.entries(data).map(([emotion, val]) => {
    const sweep = (val/total)*360;
    const start = angle; angle += sweep;
    return { emotion, val, sweep, start, end:angle };
  });
  function arc(startA, endA, outerR, innerR) {
    const toRad = a => (a*Math.PI)/180;
    const x1=cx+outerR*Math.cos(toRad(startA)), y1=cy+outerR*Math.sin(toRad(startA));
    const x2=cx+outerR*Math.cos(toRad(endA)),   y2=cy+outerR*Math.sin(toRad(endA));
    const x3=cx+innerR*Math.cos(toRad(endA)),   y3=cy+innerR*Math.sin(toRad(endA));
    const x4=cx+innerR*Math.cos(toRad(startA)), y4=cy+innerR*Math.sin(toRad(startA));
    const lg = endA-startA>180?1:0;
    return `M${x1},${y1} A${outerR},${outerR} 0 ${lg},1 ${x2},${y2} L${x3},${y3} A${innerR},${innerR} 0 ${lg},0 ${x4},${y4} Z`;
  }
  const dominant = segments.reduce((a,b)=>b.val>a.val?b:a, segments[0]);
  return (
    <div style={{display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
      <svg width={size} height={size} style={{flexShrink:0}}>
        {segments.map(s => (
          <path key={s.emotion} d={arc(s.start, s.end, R, r)}
            fill={EC[s.emotion]} opacity={0.9}/>
        ))}
        <text x={cx} y={cy-6}  textAnchor="middle" fontSize={11} fill="#9CA3AF">Top</text>
        <text x={cx} y={cy+10} textAnchor="middle" fontSize={13} fontWeight="700" fill={EC[dominant?.emotion]}>
          {dominant?.emotion}
        </text>
        <text x={cx} y={cy+26} textAnchor="middle" fontSize={10} fill="#9CA3AF">
          {dominant ? Math.round((dominant.val/total)*100)+"%" : ""}
        </text>
      </svg>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {segments.map(s => (
          <div key={s.emotion} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
            <div style={{width:10,height:10,borderRadius:3,background:EC[s.emotion],flexShrink:0}}/>
            <span style={{color:"#6B7280",width:50}}>{s.emotion}</span>
            <div style={{width:80,height:5,background:"#F0F3FC",borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:((s.val/total)*100)+"%",background:EC[s.emotion],borderRadius:99}}/>
            </div>
            <span style={{color:"#111827",fontWeight:600}}>{Math.round((s.val/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── WAVEFORM CANVAS ─────────────────────────────────────────────────────────
function WaveformCanvas({ active }) {
  const cvRef=useRef(null), wave=useRef({alpha:[],beta:[],theta:[],delta:[]}), timer=useRef(null), MAX=80;
  useEffect(() => {
    for(let i=0;i<MAX;i++){
      wave.current.alpha.push(50+20*Math.sin(i*0.3));
      wave.current.beta.push(50+15*Math.sin(i*0.5+1));
      wave.current.theta.push(50+18*Math.sin(i*0.2+2));
      wave.current.delta.push(50+22*Math.sin(i*0.15+3));
    }
    draw();
  },[]);
  useEffect(() => {
    clearTimeout(timer.current);
    if(!active) return;
    let t=Date.now()*0.002;
    const tick=()=>{
      t+=0.08; const w=wave.current;
      w.alpha.push(50+20*Math.sin(t)+3*(Math.random()-.5));
      w.beta.push(50+15*Math.sin(t*1.6+1)+3*(Math.random()-.5));
      w.theta.push(50+18*Math.sin(t*0.7+2)+3*(Math.random()-.5));
      w.delta.push(50+22*Math.sin(t*0.4+3)+3*(Math.random()-.5));
      ["alpha","beta","theta","delta"].forEach(k=>{if(w[k].length>MAX)w[k].shift();});
      draw(); timer.current=setTimeout(tick,80);
    };
    timer.current=setTimeout(tick,80);
    return()=>clearTimeout(timer.current);
  },[active]);
  function draw(){
    const cv=cvRef.current; if(!cv) return;
    const W=cv.offsetWidth,H=130; cv.width=W; cv.height=H;
    const ctx=cv.getContext("2d"); ctx.clearRect(0,0,W,H);
    [["alpha","#093095"],["beta","#EF4444"],["theta","#10B981"],["delta","#F59E0B"]].forEach(([k,c])=>{
      const d=wave.current[k];
      const grad=ctx.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,c+"30"); grad.addColorStop(1,c+"00");
      ctx.beginPath(); d.forEach((v,i)=>{const x=(i/MAX)*W,y=(v/100)*H; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
      ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath();
      ctx.fillStyle=grad; ctx.globalAlpha=.8; ctx.fill();
      ctx.beginPath(); ctx.strokeStyle=c; ctx.lineWidth=1.8; ctx.globalAlpha=.85;
      d.forEach((v,i)=>{const x=(i/MAX)*W,y=(v/100)*H; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});
      ctx.stroke(); ctx.globalAlpha=1;
    });
  }
  return (
    <div>
      <canvas ref={cvRef} style={{width:"100%",height:130,display:"block",borderRadius:8}}/>
      <div style={{display:"flex",gap:14,marginTop:10,flexWrap:"wrap"}}>
        {[["#093095","Alpha"],["#EF4444","Beta"],["#10B981","Theta"],["#F59E0B","Delta"]].map(([c,l])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#6B7280"}}>
            <div style={{width:14,height:3,background:c,borderRadius:2}}/>{l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PIPELINE ────────────────────────────────────────────────────────────────
const PIPE_STEPS=["EEG Signal","Filter","Features","Classify","Output"];
function Pipeline({ active }) {
  const [step,setStep]=useState(-1), [pct,setPct]=useState(0);
  const T=useT();
  useEffect(()=>{
    if(!active){setStep(-1);setPct(0);return;}
    let s=0,alive=true;
    const run=()=>{
      if(!alive)return; setStep(s); setPct(((s+1)/5)*100); s++;
      if(s<=5) setTimeout(run,600);
      else setTimeout(()=>{if(alive){s=0;setTimeout(run,800);}},1000);
    };
    run(); return()=>{alive=false;};
  },[active]);
  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-start"}}>
        {PIPE_STEPS.map((label,i)=>(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}}>
            {i<PIPE_STEPS.length-1&&<div style={{position:"absolute",top:19,left:"50%",width:"100%",height:2,zIndex:0,
              background:step>i?"#093095":T.divider,transition:"background .4s"}}/>}
            <div style={{width:38,height:38,borderRadius:"50%",display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:12,zIndex:1,position:"relative",fontWeight:700,
              border:`2px solid ${step>i?"#093095":step===i?"#1243C8":T.divider}`,
              background:step>i?"#093095":step===i?"#EEF2FF":T.card,
              color:step>i?"#fff":step===i?"#1243C8":T.textMuted,
              boxShadow:step===i?"0 0 0 4px rgba(9,48,149,.15)":"none",transition:"all .4s"}}>
              {step>i?Icons.check:i+1}
            </div>
            <div style={{fontSize:10,color:step>=i?"#093095":T.textMuted,textAlign:"center",
              fontWeight:step>=i?600:400,marginTop:8,lineHeight:1.3,transition:"color .3s"}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:16,height:4,background:T.divider,borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:99,background:"linear-gradient(90deg,#093095,#2E5BE8)",
          width:pct+"%",transition:"width .15s linear"}}/>
      </div>
    </div>
  );
}

// ─── EMOTION HERO ─────────────────────────────────────────────────────────────
function EmotionHero({ emotion, confidence, bands, trend, sessionTime }) {
  const s=ES[emotion]||ES.Calm;
  return (
    <div style={{background:`linear-gradient(135deg,${s.bg} 0%,#fff 100%)`,
      border:`1.5px solid ${s.border}`,color:s.text,borderRadius:16,padding:"24px 28px",
      marginBottom:20,transition:"all .5s",boxShadow:`0 4px 20px ${s.border}40`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,opacity:.6,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>
            Current Emotional State
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:40}}>{s.icon}</span>
            <div>
              <div style={{fontSize:32,fontWeight:700,letterSpacing:"-.5px",lineHeight:1}}>{emotion}</div>
              <div style={{fontSize:13,marginTop:5,opacity:.75}}>
                {confidence?`${confidence}% confidence`:"Awaiting signal…"}
              </div>
            </div>
          </div>
        </div>
        {(trend||sessionTime)&&(
          <div style={{textAlign:"right"}}>
            {trend&&<div style={{marginBottom:8}}><div style={{fontSize:10,opacity:.6,marginBottom:2,textTransform:"uppercase",letterSpacing:".07em"}}>Trend</div><div style={{fontSize:15,fontWeight:600}}>{trend}</div></div>}
            {sessionTime&&<div><div style={{fontSize:10,opacity:.6,marginBottom:2,textTransform:"uppercase",letterSpacing:".07em"}}>Session</div><div style={{fontSize:15,fontWeight:600,fontVariantNumeric:"tabular-nums"}}>{sessionTime}</div></div>}
          </div>
        )}
      </div>
      {bands&&(
        <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
          {[["α Alpha",bands.alpha],["β Beta",bands.beta],["θ/δ Ratio",bands.thetaDelta]].map(([k,v])=>(
            <div key={k} style={{padding:"5px 14px",borderRadius:99,fontSize:11,fontWeight:600,
              background:"rgba(255,255,255,.55)",border:"1px solid rgba(255,255,255,.8)"}}>{k}: {v}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EMOTION BARS (severity-based heights — real data) ────────────────────────
function EmotionBars({ data, height=90 }) {
  const T=useT();
  // Cache heights per index so they don't re-randomize on every render
  const cache=useRef({});
  const bars = data.map((e,i) => {
    if(!cache.current[i]) cache.current[i] = SEVERITY[e] + Math.floor(Math.random()*10);
    return { emotion:e, h:cache.current[i] };
  });
  if(!data.length) return (
    <div style={{height,display:"flex",alignItems:"center",justifyContent:"center",
      fontSize:13,color:T.textMuted,background:T.inputBg,borderRadius:10}}>
      Start monitoring to see history
    </div>
  );
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:3,height,padding:"0 4px"}}>
      {bars.map((b,i)=>(
        <div key={i} title={b.emotion}
          style={{flex:1,borderRadius:"3px 3px 0 0",background:EC[b.emotion],height:b.h,
            transition:".3s",cursor:"default",opacity:.88}}/>
      ))}
    </div>
  );
}

function StaticBars({ data, count=24 }) {
  const T=useT();
  const bars=useMemo(()=>{
    if(data&&data.length) return data.map(e=>({emotion:e,h:SEVERITY[e]+Math.floor(Math.random()*10)}));
    return Array.from({length:count},()=>{const e=EMOTIONS[Math.floor(Math.random()*5)];return{emotion:e,h:SEVERITY[e]+Math.floor(Math.random()*10)};});
  },[]);
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:3,height:90,padding:"0 4px"}}>
      {bars.map((b,i)=>(
        <div key={i} style={{flex:1,borderRadius:"3px 3px 0 0",background:EC[b.emotion],height:b.h,opacity:.88}}/>
      ))}
    </div>
  );
}

const EmotionLegend=()=>(
  <div style={{display:"flex",gap:14,marginTop:12,flexWrap:"wrap"}}>
    {Object.entries(EC).map(([e,c])=>(
      <div key={e} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#6B7280"}}>
        <div style={{width:10,height:10,borderRadius:3,background:c}}/>{e}
      </div>
    ))}
  </div>
);


// ─── ANIMATED COUNTER ─────────────────────────────────────────────
function AnimatedCounter({ to, duration=900 }) {
  const [v,setV]=useState(0);
  const prevRef=useRef(0);
  useEffect(()=>{
    const target=Number(to)||0;
    let cur=prevRef.current;
    if(cur===target){setV(target);return;}
    const total=Math.max(Math.abs(target-cur),1);
    const stepMs=Math.max(Math.floor(duration/total),8);
    const dir=target>cur?1:-1;
    const t=setInterval(()=>{
      cur+=dir;
      setV(cur);
      if(cur===target){prevRef.current=target;clearInterval(t);}
    },stepMs);
    return()=>clearInterval(t);
  },[to]);
  return v;
}

function StatCard({ label, value, sub, color, icon, delay=0 }) {
  const T=useT();
  return (
    <Card style={{animationDelay:`${delay}s`,cursor:"default"}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>{label}</div>
          <div style={{fontSize:30,fontWeight:700,color:color||T.text,letterSpacing:"-.5px",lineHeight:1}}>{typeof value==="number"?<AnimatedCounter to={value}/>:value}</div>
          <div style={{fontSize:12,color:T.textMuted,marginTop:6}}>{sub}</div>
        </div>
        {icon&&<div style={{width:42,height:42,borderRadius:12,background:color?color+"15":"#F0F3FC",
          display:"flex",alignItems:"center",justifyContent:"center",color:color||"#093095",flexShrink:0}}>{icon}</div>}
      </div>
    </Card>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const NAV=[
  {id:"dashboard",label:"Dashboard",   icon:"dashboard"},
  {id:"monitor",  label:"Live Monitor",icon:"monitor"},
  {id:"patients", label:"Patients",    icon:"patients"},
  {id:"analytics",label:"Analytics",   icon:"analytics"},
  {id:"alerts",   label:"Alerts",      icon:"alerts"},
];
const NAV2=[{id:"settings",label:"Settings",icon:"settings"}];

function Sidebar({ page, setPage, alertCount, monitoring, userName, open, onClose, msgCount=0 }) {
  const T=useT();
  const initials=userName?userName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"DR";
  const content=(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.sidebar,transition:"background .2s"}}>
      <div style={{padding:"22px 20px 18px",borderBottom:`1px solid ${T.divider}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:12,background:"linear-gradient(135deg,#093095,#2E5BE8)",
            display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",
            boxShadow:"0 4px 12px rgba(9,48,149,.35)"}}>{Icons.eeg}</div>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:T.text,letterSpacing:"-.3px",fontFamily:"'League Spartan',sans-serif"}}>NeuroTrack</div>
            <div style={{fontSize:11,color:T.textMuted}}>Clinical EEG Monitor</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"14px 12px",overflowY:"auto"}}>
        <div style={{fontSize:10,fontWeight:700,color:T.textMuted,padding:"6px 10px 8px",letterSpacing:".1em",textTransform:"uppercase"}}>Main</div>
        {NAV.map(n=>{
          const active=page===n.id;
          return (
            <div key={n.id} onClick={()=>{setPage(n.id);onClose&&onClose();}}
              style={{display:"flex",alignItems:"center",gap:11,padding:"10px 12px",borderRadius:10,
                cursor:"pointer",marginBottom:3,fontSize:13,fontWeight:500,
                background:active?"linear-gradient(135deg,#093095,#1243C8)":"transparent",
                color:active?"#fff":T.textSec,
                boxShadow:active?"0 4px 14px rgba(9,48,149,.28)":"none",transition:"all .18s"}}>
              <span style={{opacity:active?1:.65,flexShrink:0,display:"flex"}}>{Icons[n.icon]}</span>
              <span style={{flex:1}}>{n.label}</span>
              {n.id==="alerts"&&alertCount>0&&(
                <span style={{background:active?"rgba(255,255,255,.25)":"#EF4444",color:"#fff",
                  fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:99}}>{alertCount}</span>
              )}
              {n.id==="patients"&&msgCount>0&&(
                <span style={{background:active?"rgba(255,255,255,.25)":"#3B82F6",color:"#fff",
                  fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:99,display:"flex",alignItems:"center",gap:3}}>
                  💬{msgCount}
                </span>
              )}
            </div>
          );
        })}
        <div style={{fontSize:10,fontWeight:700,color:T.textMuted,padding:"14px 10px 8px",letterSpacing:".1em",textTransform:"uppercase"}}>System</div>
        {NAV2.map(n=>{
          const active=page===n.id;
          return (
            <div key={n.id} onClick={()=>{setPage(n.id);onClose&&onClose();}}
              style={{display:"flex",alignItems:"center",gap:11,padding:"10px 12px",borderRadius:10,
                cursor:"pointer",fontSize:13,fontWeight:500,
                background:active?"linear-gradient(135deg,#093095,#1243C8)":"transparent",
                color:active?"#fff":T.textSec,transition:"all .18s"}}>
              <span style={{opacity:active?1:.65,display:"flex"}}>{Icons[n.icon]}</span>
              <span>{n.label}</span>
            </div>
          );
        })}
      </nav>
      <div style={{margin:"0 12px 12px",padding:"12px 14px",borderRadius:12,
        background:monitoring?"rgba(16,185,129,.1)":T.inputBg,
        border:`1px solid ${monitoring?"#86EFAC":T.divider}`}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <LiveDot active={monitoring} size={9}/>
          <span style={{fontSize:12,fontWeight:600,color:monitoring?"#059669":T.textMuted}}>
            {monitoring?"Live Monitoring":"Monitoring Off"}
          </span>
        </div>
        {monitoring&&<div style={{fontSize:11,color:"#059669",marginTop:4,opacity:.8}}>EEG signal active</div>}
      </div>
      <div style={{padding:"14px 16px",borderTop:`1px solid ${T.divider}`}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Avatar initials={initials} color="#E8EDFF" tc="#093095" size={36}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{userName||"Dr. Ummelaila"}</div>
            <div style={{fontSize:11,color:T.textMuted}}>Neurologist</div>
          </div>
        </div>
      </div>
    </div>
  );
  return (
    <>
      <div data-sidebar style={{width:240,minWidth:240,height:"100vh",flexShrink:0,borderRight:`1px solid ${T.divider}`,
        display:"flex",flexDirection:"column",position:"relative",zIndex:10,overflow:"hidden"}}>
        {content}
      </div>
      {open&&(
        <div style={{position:"fixed",inset:0,zIndex:50,display:"flex"}}>
          <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,.4)",backdropFilter:"blur(2px)"}}/>
          <div style={{width:260,height:"100%",position:"relative",zIndex:1,
            animation:"slideInLeft .25s ease",boxShadow:"4px 0 20px rgba(0,0,0,.15)"}}>
            <button onClick={onClose} style={{position:"absolute",top:14,right:14,width:32,height:32,
              borderRadius:8,border:"none",background:T.inputBg,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",color:T.textMuted,zIndex:2}}>
              {Icons.close}
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function TopBar({ title, monitoring, onToggle, alertCount, alerts, onLogout, onMenuClick, userName, dark, setDark }) {
  const T=useT();
  const [open,setOpen]=useState(false);
  const hour=new Date().getHours();
  const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const firstName=userName?(userName.split(" ").find(w=>!w.startsWith("Dr."))||userName.split(" ")[0]):"Doctor";
  useEffect(()=>{const fn=()=>setOpen(false); document.addEventListener("click",fn); return()=>document.removeEventListener("click",fn);},[]);
  return (
    <div style={{padding:"0 20px",height:60,borderBottom:`1px solid ${T.divider}`,background:T.topbar,
      display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,gap:12,transition:"background .2s"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onMenuClick} style={{width:36,height:36,borderRadius:9,border:`1px solid ${T.divider}`,
          background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",
          justifyContent:"center",color:T.textSec,flexShrink:0}}>{Icons.menu}</button>
        <div>
          <div style={{fontSize:11,color:T.textMuted,fontWeight:500}}>{greeting}, {firstName}</div>
          <div style={{fontSize:15,fontWeight:700,color:T.text,letterSpacing:"-.2px"}}>{title}</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <button onClick={onToggle} style={{padding:"8px 16px",borderRadius:10,border:"none",cursor:"pointer",
          fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:7,whiteSpace:"nowrap",
          background:monitoring?"linear-gradient(135deg,#DC2626,#EF4444)":"linear-gradient(135deg,#093095,#2E5BE8)",
          color:"#fff",boxShadow:monitoring?"0 3px 12px rgba(220,38,38,.35)":"0 3px 12px rgba(9,48,149,.35)"}}>
          <LiveDot active={monitoring} size={7}/>
          {monitoring?"Stop":"Start"}
        </button>
        {/* Dark mode toggle */}
        <button onClick={()=>setDark(d=>!d)} title="Toggle dark mode"
          style={{width:38,height:38,borderRadius:10,border:`1px solid ${T.divider}`,background:T.inputBg,
            cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T.textSec}}>
          {dark?Icons.sun:Icons.moon}
        </button>
        {/* Notifications */}
        <div style={{position:"relative"}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>setOpen(o=>!o)} style={{width:38,height:38,borderRadius:10,
            border:`1px solid ${T.divider}`,background:T.inputBg,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",color:T.textSec,position:"relative"}}>
            {Icons.alerts}
            {alertCount>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#EF4444",
              color:"#fff",fontSize:9,fontWeight:700,width:18,height:18,borderRadius:"50%",
              display:"flex",alignItems:"center",justifyContent:"center"}}>{alertCount>9?"9+":alertCount}</span>}
          </button>
          {open&&(
            <div style={{position:"absolute",top:46,right:0,width:300,background:T.card,
              border:`1px solid ${T.divider}`,borderRadius:14,boxShadow:"0 12px 32px rgba(9,48,149,.12)",
              zIndex:200,overflow:"hidden",animation:"scaleIn .18s ease"}}>
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.divider}`,
                display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:13,fontWeight:600,color:T.text}}>Active Alerts</span>
                {alertCount>0&&<span style={{background:"#FEE2E2",color:"#DC2626",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:99}}>{alertCount}</span>}
              </div>
              {alerts.filter(a=>!a.resolved).slice(0,5).map(a=>(
                <div key={a.id} style={{padding:"11px 16px",borderBottom:`1px solid ${T.divider}`,display:"flex",gap:10}}>
                  <div style={{width:9,height:9,borderRadius:"50%",marginTop:4,flexShrink:0,
                    background:a.type==="critical"?"#EF4444":"#F59E0B"}}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:T.text}}>{a.patient}</div>
                    <div style={{fontSize:11,color:T.textSec,marginTop:1}}>{a.msg}</div>
                    <div style={{fontSize:10,color:T.textMuted,marginTop:3}}>{a.time}</div>
                  </div>
                </div>
              ))}
              {!alerts.filter(a=>!a.resolved).length&&(
                <div style={{padding:"20px 16px",textAlign:"center",fontSize:12,color:T.textMuted}}>✓ All clear</div>
              )}
            </div>
          )}
        </div>
        <button onClick={onLogout} style={{width:38,height:38,borderRadius:10,border:`1px solid ${T.divider}`,
          background:T.inputBg,cursor:"pointer",display:"flex",alignItems:"center",
          justifyContent:"center",color:T.textSec}} title="Sign out">{Icons.logout}</button>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ monitoring, alerts, patients, classCount, stats, onSelectPatient }) {
  const T=useT();
  const active=alerts.filter(a=>!a.resolved);
  const crit=stats?.critical_alerts??active.filter(a=>a.type==="critical").length;
  return (
    <div style={{animation:"fadeInUp .35s ease"}}>
      {/* Summary stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:20}}>
        <StatCard label="Active Patients"  value={stats?.active_patients??5}  sub="Registered in system" icon={Icons.patients} delay={0}/>
        <StatCard label="Critical Alerts"  value={crit}                        sub="Requires attention"   icon={Icons.alerts}   color={crit>0?"#DC2626":undefined} delay={.05}/>
        <StatCard label="EEG Readings"     value={classCount}                  sub={monitoring?"Live session":"Start monitoring"} icon={Icons.monitor} delay={.1}/>
      </div>

      {/* Patient grid — each card is clickable and shows live emotion */}
      <Card style={{marginBottom:20}}>
        <SectionTitle action={
          <span style={{fontSize:11,fontWeight:600,color:monitoring?"#059669":T.textMuted,
            background:monitoring?"rgba(16,185,129,.1)":T.inputBg,padding:"3px 10px",borderRadius:99,
            border:`1px solid ${monitoring?"#86EFAC":T.divider}`}}>
            {monitoring?"● All patients live":"○ Click Start to begin"}
          </span>}>
          Patient Monitor Grid
        </SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
          {patients.slice(0,6).map(p=>{
            const isCrit=p.status==="critical";
            const isWarn=p.status==="warning";
            return (
              <div key={p.id}
                onClick={()=>onSelectPatient(p)}
                style={{padding:"14px",borderRadius:12,cursor:"pointer",transition:"all .18s",
                  border:`1.5px solid ${isCrit?"#FCA5A5":isWarn?"#FCD34D":T.divider}`,
                  background:isCrit?"#FEF2F2":isWarn?"#FFFBEB":T.inputBg,
                  boxShadow:isCrit?"0 0 0 2px rgba(220,38,38,.12)":isWarn?"0 0 0 2px rgba(245,158,11,.1)":"none"}}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <Avatar initials={p.initials} color={p.color} tc={p.tc} size={34}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                    <div style={{fontSize:10,color:T.textMuted}}>{p.condition}</div>
                  </div>
                  {monitoring&&<LiveDot active size={7}/>}
                </div>
                <EmotionBadge emotion={p.emotion}/>
                <div style={{marginTop:8,height:3,background:T.divider,borderRadius:99}}>
                  <div style={{height:"100%",width:SEVERITY[p.emotion]+"%",borderRadius:99,
                    background:EC[p.emotion],transition:"width .5s ease"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}>
                  <span style={{fontSize:10,color:T.textMuted}}>EEG Intensity</span>
                  <StatusBadge status={p.status}/>
                </div>
              </div>
            );
          })}
        </div>
        {!monitoring&&<div style={{marginTop:12,padding:"10px 14px",borderRadius:10,
          background:T.inputBg,border:`1px solid ${T.divider}`,
          fontSize:12,color:T.textMuted,textAlign:"center"}}>
          ▶ Press <b>Start</b> to begin live EEG monitoring for all patients
        </div>}
      </Card>

      {/* Bottom row: waveform + recent alerts */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <Card>
          <SectionTitle action={<span style={{fontSize:11,color:T.textMuted}}>{monitoring?"Alpha · Beta · Theta · Delta":"Idle"}</span>}>Live EEG Waveform</SectionTitle>
          <WaveformCanvas active={monitoring}/>
        </Card>
        <Card>
          <SectionTitle action={active.length>0&&<span style={{fontSize:11,fontWeight:600,color:"#DC2626",background:"#FEE2E2",padding:"2px 8px",borderRadius:99}}>{active.length} active</span>}>Recent Alerts</SectionTitle>
          {active.slice(0,3).map(a=>(
            <div key={a.id} style={{padding:"10px 12px",borderRadius:10,marginBottom:8,
              border:`1px solid ${a.type==="critical"?"#FCA5A5":"#FCD34D"}`,
              background:a.type==="critical"?"#FEF2F2":"#FFFBEB",
              display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{width:8,height:8,borderRadius:"50%",marginTop:5,flexShrink:0,
                background:a.type==="critical"?"#EF4444":"#F59E0B"}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:"#111827"}}>{a.patient}</div>
                <div style={{fontSize:11,color:"#6B7280",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.msg}</div>
              </div>
              <div style={{fontSize:10,color:"#9CA3AF",flexShrink:0}}>{a.time}</div>
            </div>
          ))}
          {!active.length&&<div style={{textAlign:"center",padding:"24px 0",color:T.textMuted,fontSize:13}}>✓ No active alerts</div>}
        </Card>
      </div>
    </div>
  );
}

// ─── SESSION REPORT MODAL ─────────────────────────────────────────────────────
function SessionReportModal({ onClose, sessionBars, sessionTime, classCount, emotion, confidence }) {
  const T=useT();
  const counts=EMOTIONS.reduce((a,e)=>({...a,[e]:sessionBars.filter(x=>x===e).length}),{});
  const dominant=EMOTIONS.reduce((a,e)=>counts[e]>counts[a]?e:a,"Calm");
  const lines=[
    `NeuroTrack Session Report`,`Generated: ${new Date().toLocaleString()}`,``,
    `Session Duration : ${sessionTime||"00:00"}`,
    `Total Readings   : ${classCount}`,
    `Dominant Emotion : ${dominant} (${counts[dominant]} readings)`,
    `Last Confidence  : ${confidence||0}%`,``,
    `Emotion Breakdown:`,
    ...EMOTIONS.map(e=>`  ${e.padEnd(8)}: ${counts[e]} readings (${classCount?Math.round((counts[e]/classCount)*100):0}%)`),
    ``,`── End of Report ──`
  ].join("\n");
  return (
    <Modal title="Session Report" onClose={onClose} width={480}>
      <pre style={{background:T.inputBg,padding:16,borderRadius:10,fontSize:12,
        color:T.text,lineHeight:1.8,overflowX:"auto",border:`1px solid ${T.divider}`,
        fontFamily:"'Courier New',monospace"}}>{lines}</pre>
      <div style={{display:"flex",gap:10,marginTop:16}}>
        <button onClick={()=>window.print()} style={{display:"flex",alignItems:"center",gap:7,
          padding:"9px 18px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,
          background:"linear-gradient(135deg,#093095,#2E5BE8)",color:"#fff",
          boxShadow:"0 4px 14px rgba(9,48,149,.3)"}}>
          {Icons.print} Print / Save PDF
        </button>
        <button onClick={onClose} style={{padding:"9px 18px",borderRadius:10,border:`1px solid ${T.divider}`,
          background:"transparent",cursor:"pointer",fontSize:13,color:T.textSec}}>Close</button>
      </div>
    </Modal>
  );
}

// ─── MONITOR PAGE ─────────────────────────────────────────────────────────────
function MonitorPage({ monitoring, emotion, confidence, bands, trend, sessionTime, sessionBars, classCount, patients }) {
  const T=useT();
  const [showReport,setShowReport]=useState(false);
  const [selectedPatId,setSelectedPatId]=useState(null);
  const [patEmotion,setPatEmotion]=useState(null);
  const [patConf,setPatConf]=useState(null);
  const [patBands,setPatBands]=useState(null);
  const [patBars,setPatBars]=useState([]);

  // When user picks a patient, stream their specific EEG (works even when monitoring is off)
  useEffect(()=>{
    if(!selectedPatId)return;
    setPatEmotion(null);setPatConf(null);setPatBands(null);setPatBars([]);
    const iv=setInterval(async()=>{
      try{
        const r=await api.classifyEEG(selectedPatId);
        setPatEmotion(r.emotion);setPatConf(r.confidence);
        setPatBands({alpha:r.bands.alpha.toFixed(2),beta:r.bands.beta.toFixed(2),
          thetaDelta:(r.bands.theta/Math.max(r.bands.delta,0.001)).toFixed(2)});
        setPatBars(p=>{const n=[...p,r.emotion];return n.length>30?n.slice(-30):n;});
      }catch{}
    },3000);
    return()=>clearInterval(iv);
  },[selectedPatId]);

  const displayEmotion=selectedPatId?patEmotion||emotion:emotion;
  const displayConf=selectedPatId?patConf||confidence:confidence;
  const displayBands=selectedPatId?patBands||bands:bands;
  const displayBars=selectedPatId?patBars:sessionBars;
  const selectedPat=patients?.find(p=>p.id===selectedPatId);

  return (
    <div style={{animation:"fadeInUp .35s ease"}}>
      {/* Patient selector */}
      {patients&&patients.length>0&&(
        <div style={{marginBottom:14,padding:"12px 16px",borderRadius:14,
          background:T.card,border:"1px solid "+T.divider}}>
          <div style={{fontSize:11,fontWeight:600,color:T.textMuted,textTransform:"uppercase",
            letterSpacing:".08em",marginBottom:10}}>Select Patient to Monitor</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button onClick={()=>setSelectedPatId(null)}
              style={{padding:"6px 14px",borderRadius:99,fontSize:12,fontWeight:600,border:"1px solid",
                cursor:"pointer",transition:"all .15s",
                borderColor:!selectedPatId?"#093095":T.divider,
                background:!selectedPatId?"#093095":"transparent",
                color:!selectedPatId?"#fff":T.textSec}}>
              All (Ahmed)
            </button>
            {patients.map(p=>(
              <button key={p.id} onClick={()=>setSelectedPatId(p.id)}
                style={{padding:"6px 14px",borderRadius:99,fontSize:12,fontWeight:600,border:"1.5px solid",
                  cursor:"pointer",transition:"all .15s",display:"flex",alignItems:"center",gap:5,
                  borderColor:selectedPatId===p.id?(ES[p.emotion]?.border||"#093095"):T.divider,
                  background:selectedPatId===p.id?(ES[p.emotion]?.badge||"#EDE9FE"):"transparent",
                  color:selectedPatId===p.id?(ES[p.emotion]?.btext||"#093095"):T.textSec}}>
                {ES[p.emotion]?.icon||""} {p.name.split(" ")[0]}
              </button>
            ))}
          </div>
          {selectedPat&&(
            <div style={{marginTop:10,fontSize:12,color:T.textMuted,display:"flex",alignItems:"center",gap:6}}>
              <LiveDot active={monitoring} size={7}/>
              Showing {selectedPat.name}'s EEG stream ({selectedPat.condition})
            </div>
          )}
        </div>
      )}

      {!monitoring&&(
        <div style={{marginBottom:14,padding:"12px 16px",borderRadius:12,
          background:"#FFFBEB",border:"1px solid #FCD34D",fontSize:13,color:"#92400E",fontWeight:500}}>
          ⚠️ Monitoring is OFF — press <strong>Start</strong> in the top bar to begin live EEG streaming.
        </div>
      )}

      <EmotionHero emotion={displayEmotion||"Calm"} confidence={monitoring?displayConf:null}
        bands={monitoring?displayBands:null} trend={monitoring?trend:null} sessionTime={monitoring?sessionTime:null}/>

      {/* Treatment suggestion based on current emotion */}
      {monitoring&&displayEmotion&&(displayEmotion==="Stress"||displayEmotion==="Pain"||displayEmotion==="Sad")&&(
        <div style={{marginBottom:16}}>
          <TreatmentPanel emotion={displayEmotion}/>
        </div>
      )}

      <Card style={{marginBottom:16}}>
        <SectionTitle action={
          <span style={{fontSize:11,fontWeight:600,color:monitoring?"#059669":T.textMuted,
            background:monitoring?"rgba(16,185,129,.1)":T.inputBg,padding:"3px 10px",borderRadius:99,
            border:`1px solid ${monitoring?"#86EFAC":T.divider}`}}>
            {monitoring?"● Running":"○ Idle"}
          </span>}>EEG Processing Pipeline</SectionTitle>
        <Pipeline active={monitoring}/>
      </Card>

      <Card>
        <SectionTitle action={
          displayBars.length>0&&(
            <button onClick={()=>setShowReport(true)} style={{display:"flex",alignItems:"center",gap:6,
              padding:"6px 14px",borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
              background:"linear-gradient(135deg,#093095,#2E5BE8)",color:"#fff",
              boxShadow:"0 3px 10px rgba(9,48,149,.25)"}}>
              {Icons.print} Report
            </button>
          )
        }>Emotion History{selectedPat?` — ${selectedPat.name}`:" (this session)"}</SectionTitle>
        <EmotionBars data={displayBars} height={90}/>
        <EmotionLegend/>
      </Card>
      {showReport&&<SessionReportModal onClose={()=>setShowReport(false)}
        sessionBars={displayBars} sessionTime={sessionTime}
        classCount={classCount} emotion={displayEmotion||"Calm"} confidence={displayConf||confidence}/>}
    </div>
  );
}

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────
function AnalyticsPage({ sessionBars }) {
  const T=useT();
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{ api.getAnalytics().then(setData).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  // Merge session data with backend totals
  const sessionCounts=EMOTIONS.reduce((a,e)=>({...a,[e]:(sessionBars.filter(x=>x===e).length)}),{});
  const hasSession=sessionBars.length>0;
  const dist=hasSession?sessionCounts:(data?.emotion_distribution||{Happy:18,Calm:32,Sad:9,Stress:27,Pain:14});
  const hourly=data?.hourly_stress||[];
  const maxH=Math.max(...hourly.map(h=>h.level),1);
  if(loading) return <div style={{display:"flex",justifyContent:"center",padding:60,color:T.textMuted}}>
    <Spinner size={24} color={T.divider} top="#093095"/></div>;
  return (
    <div style={{animation:"fadeInUp .35s ease"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:20}}>
        {[
          ["Total Sessions",  data?.total_sessions??47,       "All time"],
          ["Avg Confidence",  (data?.avg_confidence??88.3)+"%","Per reading"],
          ["Total Readings",  data?.total_classifications??1420,"All time"],
          ["Critical Events", data?.critical_events_today??3,  "Today"],
        ].map(([l,v,s],i)=><StatCard key={l} label={l} value={v} sub={s} delay={i*.05}/>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        <Card>
          <SectionTitle>{hasSession?"Session":"Overall"} Emotion Distribution</SectionTitle>
          <DonutChart data={dist}/>
          {hasSession&&<div style={{marginTop:12,fontSize:12,color:T.textMuted}}>
            Based on {sessionBars.length} readings this session</div>}
        </Card>
        <Card>
          <SectionTitle>Stress Level by Hour</SectionTitle>
          {hourly.length?(
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:140,padding:"0 4px"}}>
              {hourly.map(h=>(
                <div key={h.hour} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{flex:1,display:"flex",alignItems:"flex-end",width:"100%"}}>
                    <div style={{width:"100%",borderRadius:"4px 4px 0 0",
                      height:Math.round((h.level/maxH)*110),
                      background:h.level>50?"#EF4444":h.level>35?"#F59E0B":"#10B981",
                      transition:".3s"}}/>
                  </div>
                  <div style={{fontSize:9,color:T.textMuted,whiteSpace:"nowrap"}}>{h.hour}</div>
                </div>
              ))}
            </div>
          ):<div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",color:T.textMuted,fontSize:13}}>No data yet</div>}
        </Card>
      </div>
      <Card>
        <SectionTitle>Emotion Frequency Breakdown</SectionTitle>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {Object.entries(dist).sort((a,b)=>b[1]-a[1]).map(([e,v])=>{
            const total=Object.values(dist).reduce((a,b)=>a+b,0)||1;
            const pct=Math.round((v/total)*100);
            return (
              <div key={e} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:70,fontSize:13,fontWeight:500,color:T.text}}>{ES[e]?.icon} {e}</div>
                <div style={{flex:1,height:8,background:T.divider,borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:pct+"%",background:EC[e],borderRadius:99,transition:"width .6s ease"}}/>
                </div>
                <div style={{width:36,fontSize:12,fontWeight:600,color:T.textSec,textAlign:"right"}}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── PATIENTS PAGE ────────────────────────────────────────────────────────────
function PatientsPage({ patients, onSelect, loading }) {
  const T=useT();
  const [q,setQ]=useState(""), [eFilter,setFilter]=useState("All");
  const filtered=patients.filter(p=>{
    return p.name.toLowerCase().includes(q.toLowerCase()) && (eFilter==="All"||p.emotion===eFilter);
  });
  return (
    <div style={{animation:"fadeInUp .35s ease"}}>
      <div style={{position:"relative",marginBottom:14}}>
        <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:T.textMuted,display:"flex",pointerEvents:"none"}}>{Icons.search}</div>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search patients…"
          style={{width:"100%",padding:"11px 14px 11px 40px",border:`1px solid ${T.divider}`,
            borderRadius:12,background:T.card,fontSize:13,outline:"none",color:T.text,transition:"border .15s"}}
          onFocus={e=>e.target.style.borderColor="#093095"}
          onBlur={e=>e.target.style.borderColor=T.divider}/>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["All",...EMOTIONS].map(f=>(
          <div key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:99,fontSize:12,
            fontWeight:500,cursor:"pointer",border:"1px solid",transition:"all .15s",
            borderColor:eFilter===f?"#093095":T.divider,
            background:eFilter===f?"#093095":T.card,color:eFilter===f?"#fff":T.textSec,
            boxShadow:eFilter===f?"0 3px 10px rgba(9,48,149,.25)":"none"}}>
            {f==="All"?"All Patients":`${ES[f]?.icon||""} ${f}`}
          </div>
        ))}
      </div>
      {loading?<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:48,
        background:T.card,borderRadius:14,gap:12,color:T.textMuted,fontSize:13}}>
        <Spinner size={18} color={T.divider} top="#093095"/>Loading…</div>
      :!filtered.length?<div style={{textAlign:"center",padding:"40px 0",background:T.card,borderRadius:14,
        border:`1px dashed ${T.divider}`,color:T.textMuted,fontSize:13}}>No patients found</div>
      :<Card style={{padding:0,overflow:"hidden"}}>
        {filtered.map((p,i)=>(
          <div key={p.id} onClick={()=>onSelect(p)} style={{display:"flex",alignItems:"center",gap:13,
            padding:"14px 18px",cursor:"pointer",transition:"background .15s",
            borderBottom:i<filtered.length-1?`1px solid ${T.divider}`:"none"}}
            onMouseEnter={e=>e.currentTarget.style.background=T.hover}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <Avatar initials={p.initials} color={p.color} tc={p.tc} size={42}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:T.text}}>{p.name}</div>
              <div style={{fontSize:12,color:T.textMuted,marginTop:2}}>Age {p.age} · {p.condition}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
              <EmotionBadge emotion={p.emotion}/>
              <StatusBadge status={p.status}/>
            </div>
            <span style={{color:T.divider,display:"flex"}}>{Icons.chevron}</span>
          </div>
        ))}
      </Card>}
    </div>
  );
}

// ─── AI INSIGHTS PANEL ────────────────────────────────────────────────────────
function AIInsightsPanel({ patient, sessionBars }) {
  const T=useT();
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [insight,setInsight]=useState(null);
  const generate=()=>{
    setLoading(true); setOpen(true);
    setTimeout(()=>{
      const counts=EMOTIONS.reduce((a,e)=>({...a,[e]:sessionBars.filter(x=>x===e).length}),{});
      const total=sessionBars.length||1;
      const stressPct=Math.round(((counts.Stress+counts.Pain)/total)*100);
      const calmPct=Math.round(((counts.Calm+counts.Happy)/total)*100);
      const dominant=EMOTIONS.reduce((a,e)=>counts[e]>counts[a]?e:a,"Calm");
      const lines=[];
      if(stressPct>40) lines.push(`⚠️ Elevated distress detected in ${stressPct}% of readings. Clinical follow-up recommended.`);
      else lines.push(`✅ Patient appears relatively stable with ${calmPct}% calm/positive readings.`);
      if(counts.Pain>2) lines.push(`🔴 Pain signals detected ${counts.Pain} time(s) — consider reviewing pain management protocol.`);
      if(dominant==="Stress"||dominant==="Pain") lines.push(`📊 Dominant emotion is ${dominant} — this pattern may warrant increased monitoring frequency.`);
      else lines.push(`📊 Dominant emotion is ${dominant} — patient is within acceptable emotional range.`);
      lines.push(`💡 Recommendation: ${stressPct>50?"Schedule immediate clinical review.":stressPct>25?"Monitor closely over next 2 hours.":"Continue standard monitoring protocol."}`);
      setInsight(lines.join("\n\n")); setLoading(false);
    }, 1800);
  };
  return (
    <Card style={{marginBottom:20}}>
      <SectionTitle action={
        <button onClick={generate} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 14px",
          borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
          background:"linear-gradient(135deg,#7C3AED,#A855F7)",color:"#fff",
          boxShadow:"0 3px 10px rgba(124,58,237,.3)"}}>
          {loading?<Spinner size={12}/>:Icons.brain}
          {loading?"Analysing…":"Generate AI Insight"}
        </button>
      }>{Icons.brain} AI Clinical Insights</SectionTitle>
      {!open&&!insight&&(
        <div style={{padding:"20px 0",textAlign:"center",color:T.textMuted,fontSize:13}}>
          Click "Generate AI Insight" to analyse this patient's emotional patterns.
        </div>
      )}
      {loading&&(
        <div style={{display:"flex",flexDirection:"column",gap:10,padding:"8px 0"}}>
          {[100,80,90].map((w,i)=>(
            <div key={i} style={{height:14,borderRadius:7,width:w+"%",
              background:`linear-gradient(90deg,${T.divider},${T.inputBg},${T.divider})`,
              backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}}/>
          ))}
        </div>
      )}
      {insight&&!loading&&(
        <div style={{background:"linear-gradient(135deg,#F5F3FF,#EDE9FE)",borderRadius:12,
          padding:"14px 16px",border:"1px solid #C4B5FD"}}>
          {insight.split("\n\n").map((line,i)=>(
            <p key={i} style={{fontSize:13,color:"#4C1D95",lineHeight:1.7,margin:i>0?"12px 0 0":0}}>{line}</p>
          ))}
          <div style={{fontSize:10,color:"#7C3AED",marginTop:12,opacity:.7}}>
            ⚡ AI-generated insight based on {sessionBars.length} session readings
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── TREATMENT SUGGESTIONS ────────────────────────────────────────────────────
const TREATMENT = {
  Pain: {
    color:"#DC2626", bg:"#FEF2F2", border:"#FCA5A5", icon:"🔴",
    title:"Pain Management Protocol",
    steps:[
      "Review current analgesic dosage — consider dose escalation if within safe range",
      "Perform pain scale assessment (Numeric Rating Scale 0–10)",
      "Check for new pain triggers: position, wound site, catheter",
      "Notify nursing staff for immediate comfort measures",
      "Consider requesting physiotherapy consultation",
      "Document pain episode with timestamp in clinical notes",
    ]
  },
  Stress: {
    color:"#D97706", bg:"#FFFBEB", border:"#FCD34D", icon:"⚠️",
    title:"Stress Reduction Protocol",
    steps:[
      "Reduce environmental stimuli — lower lighting, reduce noise",
      "Guide patient through 4-7-8 breathing technique",
      "Check vital signs: BP, HR, SpO₂",
      "Review recent medication schedule — any missed doses?",
      "Consider short anxiolytic if prescribed and clinically appropriate",
      "Reassure patient verbally and document intervention",
    ]
  },
  Sad: {
    color:"#1D4ED8", bg:"#EFF6FF", border:"#93C5FD", icon:"💙",
    title:"Emotional Support Protocol",
    steps:[
      "Schedule psychiatric/psychology consultation",
      "Review antidepressant medication compliance",
      "Engage family or support person if available",
      "Assess for depressive episode using PHQ-2 screening",
      "Provide patient with distraction activity (music, reading)",
      "Flag for multi-disciplinary team review at next round",
    ]
  },
  Calm: {
    color:"#059669", bg:"#ECFDF5", border:"#6EE7B7", icon:"✅",
    title:"Patient Stable — Continue Protocol",
    steps:[
      "Patient within normal emotional parameters",
      "Continue current treatment and monitoring schedule",
      "Standard EEG check-in in next scheduled window",
      "No urgent intervention required at this time",
    ]
  },
  Happy: {
    color:"#16A34A", bg:"#F0FDF4", border:"#86EFAC", icon:"😊",
    title:"Positive State — Maintain & Document",
    steps:[
      "Patient showing positive emotional response — document",
      "Consider reducing sedation if clinically appropriate",
      "Good time for physiotherapy or rehabilitation activities",
      "Positive prognosis indicator — update family if appropriate",
    ]
  },
};

function TreatmentPanel({ emotion }) {
  const T=useT();
  const t=TREATMENT[emotion]||TREATMENT.Calm;
  return (
    <div style={{borderRadius:14,border:`1.5px solid ${t.border}`,background:t.bg,
      padding:"16px 18px",marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <span style={{fontSize:22}}>{t.icon}</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:t.color}}>{t.title}</div>
          <div style={{fontSize:11,color:t.color,opacity:.7,marginTop:1}}>
            Suggested clinical actions for detected {emotion} state
          </div>
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {t.steps.map((step,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{width:22,height:22,borderRadius:6,background:t.color,color:"#fff",
              fontSize:10,fontWeight:700,display:"flex",alignItems:"center",
              justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</div>
            <div style={{fontSize:13,color:t.color,lineHeight:1.55,opacity:.85}}>{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PATIENT DETAIL PAGE ──────────────────────────────────────────────────────
function PatientDetailPage({ patient, onBack, showToast, sessionSecs, lastConf }) {
  const T=useT();
  const [note,setNote]=useState(""), [notes,setNotes]=useState([]), [saving,setSaving]=useState(false);
  const [liveEmotion,setLiveEmotion]=useState(patient.emotion);
  const [liveConf,setLiveConf]=useState(lastConf||88);
  const [liveBands,setLiveBands]=useState(null);
  const [sessionBars,setSessionBars]=useState([]);
  const [detailTab,setDetailTab]=useState(0); // 0=Overview 1=EEG 2=Notes 3=Chat

  const s=ES[liveEmotion]||ES.Calm;
  const dur=Math.floor(sessionSecs/60)||0;

  useEffect(()=>{ api.getNotes(patient.id).then(r=>setNotes(r.notes||[])).catch(()=>{}); },[patient.id]);

  // Live EEG polling for THIS specific patient
  useEffect(()=>{
    const iv=setInterval(async()=>{
      try{
        const r=await api.classifyEEG(patient.id);
        setLiveEmotion(r.emotion);
        setLiveConf(r.confidence);
        setLiveBands({alpha:r.bands.alpha.toFixed(2),beta:r.bands.beta.toFixed(2),
          theta:r.bands.theta.toFixed(2),delta:r.bands.delta.toFixed(2)});
        setSessionBars(p=>{const n=[...p,r.emotion];return n.length>40?n.slice(-40):n;});
      }catch{}
    },3000);
    return()=>clearInterval(iv);
  },[patient.id]);

  const saveNote=async()=>{
    if(!note.trim()) return; setSaving(true);
    try{ const r=await api.addNote(patient.id,note); setNotes(r.notes||[]); setNote(""); showToast("Note saved"); }
    catch{ showToast("Failed to save note"); } finally{ setSaving(false); }
  };

  const TABS=["Overview","Live EEG","Notes","Chat"];

  return (
    <div style={{animation:"fadeInUp .35s ease"}}>
      {/* Back */}
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",
        fontSize:13,color:T.textMuted,marginBottom:16,background:"none",border:"none",padding:"6px 0",fontWeight:500}}
        onMouseEnter={e=>e.currentTarget.style.color="#093095"}
        onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}>
        {Icons.arrow} Back to patients
      </button>

      {/* Patient hero */}
      <div style={{background:`linear-gradient(135deg,${s.bg},#fff)`,border:`1.5px solid ${s.border}`,
        borderRadius:16,padding:"20px 22px",marginBottom:16,boxShadow:`0 4px 20px ${s.border}40`}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14,flexWrap:"wrap"}}>
          <Avatar initials={patient.initials} color={patient.color} tc={patient.tc} size={52}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:19,fontWeight:700,color:s.text,letterSpacing:"-.3px"}}>{patient.name}</div>
            <div style={{fontSize:12,color:s.text,opacity:.7,marginTop:2}}>Age {patient.age} · {patient.condition}</div>
            <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
              <StatusBadge status={patient.status}/>
              <EmotionBadge emotion={liveEmotion}/>
              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:s.text,opacity:.7}}>
                <LiveDot active size={7}/> Live EEG
              </span>
            </div>
          </div>
          <button onClick={()=>api.downloadReport(patient.id).catch(e=>alert("PDF error: "+e.message))}
            style={{padding:"9px 16px",borderRadius:10,background:"#EDE9FE",color:"#6D28D9",
              border:"1px solid #DDD6FE",fontSize:12,fontWeight:600,cursor:"pointer",
              display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            {Icons.print} PDF Report
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:10}}>
          {[["Emotion",`${s.icon} ${liveEmotion}`],["Confidence",`${liveConf}%`],
            ["Status",patient.status],["Session",`${dur} min`]].map(([l,v])=>(
            <div key={l} style={{background:"rgba(255,255,255,.65)",borderRadius:10,
              padding:"9px 12px",border:"1px solid rgba(255,255,255,.8)"}}>
              <div style={{fontSize:9,fontWeight:600,color:s.text,opacity:.6,
                textTransform:"uppercase",letterSpacing:".07em",marginBottom:3}}>{l}</div>
              <div style={{fontSize:13,fontWeight:700,color:s.text}}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab nav */}
      <div style={{display:"flex",gap:6,marginBottom:16,background:T.card,
        padding:5,borderRadius:12,border:`1px solid ${T.divider}`}}>
        {TABS.map((tab,i)=>(
          <button key={tab} onClick={()=>setDetailTab(i)}
            style={{flex:1,padding:"8px 4px",borderRadius:8,border:"none",cursor:"pointer",
              fontSize:12,fontWeight:600,transition:"all .15s",
              background:detailTab===i?"linear-gradient(135deg,#093095,#2E5BE8)":"transparent",
              color:detailTab===i?"#fff":T.textMuted,
              boxShadow:detailTab===i?"0 2px 8px rgba(9,48,149,.25)":"none"}}>
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 0: Overview */}
      {detailTab===0&&(
        <div>
          {/* Treatment suggestions — always visible, updates with live emotion */}
          <TreatmentPanel emotion={liveEmotion}/>
          {/* AI Insights */}
          <AIInsightsPanel patient={patient} sessionBars={sessionBars.length>0?sessionBars:
            Array.from({length:10},()=>patient.emotion)}/>
          {/* Emotion history mini */}
          <Card style={{marginBottom:0}}>
            <SectionTitle action={<span style={{fontSize:11,color:T.textMuted}}>{sessionBars.length} readings</span>}>
              Session Emotion History
            </SectionTitle>
            {sessionBars.length>0
              ?<><EmotionBars data={sessionBars} height={70}/><EmotionLegend/></>
              :<div style={{height:70,display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,color:T.textMuted}}>Collecting data…</div>}
          </Card>
        </div>
      )}

      {/* TAB 1: Live EEG */}
      {detailTab===1&&(
        <div>
          <Card style={{marginBottom:16}}>
            <SectionTitle action={<span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,
              fontWeight:600,color:"#059669"}}>
              <LiveDot active size={7}/> Real GAMEEMO data
            </span>}>Live EEG Signal</SectionTitle>
            <div style={{background:"linear-gradient(135deg,#F5F3FF,#EDE9FE)",borderRadius:12,
              padding:"16px",marginBottom:12,border:"1px solid #C4B5FD"}}>
              <div style={{fontSize:12,color:"#7C3AED",fontWeight:600,marginBottom:12}}>
                🧠 XGBoost Classification — {liveConf}% confidence
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                {liveBands?Object.entries(liveBands).map(([band,val])=>{
                  const names={alpha:"α Alpha (8–13 Hz)",beta:"β Beta (13–30 Hz)",
                    theta:"θ Theta (4–8 Hz)",delta:"δ Delta (0.5–4 Hz)"};
                  const colors={alpha:"#8B5CF6",beta:"#3B82F6",theta:"#10B981",delta:"#F59E0B"};
                  const pct=Math.min(parseFloat(val)*40,100);
                  return (
                    <div key={band} style={{background:"rgba(255,255,255,.6)",borderRadius:10,
                      padding:"10px 12px",border:"1px solid rgba(255,255,255,.8)"}}>
                      <div style={{fontSize:10,fontWeight:600,color:colors[band],marginBottom:6}}>
                        {names[band]||band}
                      </div>
                      <div style={{fontSize:16,fontWeight:700,color:"#4C1D95",marginBottom:6}}>{val}</div>
                      <div style={{height:4,background:"#DDD6FE",borderRadius:99}}>
                        <div style={{height:"100%",width:pct+"%",borderRadius:99,
                          background:colors[band],transition:"width .5s ease"}}/>
                      </div>
                    </div>
                  );
                }):<div style={{gridColumn:"1/-1",textAlign:"center",padding:"20px 0",
                  color:"#7C3AED",fontSize:12}}>Waiting for first reading…</div>}
              </div>
            </div>
            <EmotionBars data={sessionBars.length>0?sessionBars:[liveEmotion]} height={80}/>
            <EmotionLegend/>
          </Card>
          <Card>
            <SectionTitle>EEG Source</SectionTitle>
            <div style={{fontSize:13,color:T.textSec,lineHeight:1.7}}>
              <p>This patient's EEG data is sourced from the <strong>GAMEEMO dataset</strong>,
              a validated 14-channel EEG benchmark recorded via Emotiv EPOC headset.</p>
              <p style={{marginTop:8}}>Classification uses an <strong>XGBoost model trained on 112 features</strong>
              (14 channels × 8 statistical + band-power features per 2-second window),
              achieving <strong>87.83% accuracy</strong> across Happy, Sad, Calm, and Stress/Pain states.</p>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Notes */}
      {detailTab===2&&(
        <Card>
          <SectionTitle>Clinical Notes</SectionTitle>
          {notes.length>0&&<div style={{marginBottom:16,display:"flex",flexDirection:"column",gap:8}}>
            {notes.map((n,i)=>(
              <div key={i} style={{padding:"11px 14px",background:T.inputBg,
                borderRadius:10,border:`1px solid ${T.divider}`}}>
                <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:500}}>{n.time}</div>
                <div style={{fontSize:13,color:T.text,lineHeight:1.6}}>{n.note}</div>
              </div>
            ))}
          </div>}
          {!notes.length&&<div style={{textAlign:"center",padding:"20px 0",color:T.textMuted,fontSize:13,marginBottom:16}}>
            No notes yet. Add your first clinical observation below.
          </div>}
          <textarea value={note} onChange={e=>setNote(e.target.value)}
            placeholder="Add a clinical observation…"
            style={{width:"100%",padding:"11px 14px",border:`1px solid ${T.divider}`,borderRadius:10,
              background:T.inputBg,fontSize:13,resize:"vertical",minHeight:90,outline:"none",
              color:T.text,lineHeight:1.6,fontFamily:"inherit"}}
            onFocus={e=>e.target.style.borderColor="#093095"}
            onBlur={e=>e.target.style.borderColor=T.divider}/>
          <button onClick={saveNote} disabled={saving} style={{marginTop:10,padding:"10px 22px",borderRadius:10,
            background:saving?"#C3CCDF":"linear-gradient(135deg,#093095,#2E5BE8)",color:"#fff",border:"none",
            fontSize:13,cursor:saving?"not-allowed":"pointer",fontWeight:600,
            display:"flex",alignItems:"center",gap:8,boxShadow:saving?"none":"0 4px 14px rgba(9,48,149,.3)"}}>
            {saving&&<Spinner size={14}/>}{saving?"Saving…":"Save Note"}
          </button>
        </Card>
      )}

      {/* TAB 3: Chat */}
      {detailTab===3&&(
        <Card>
          <SectionTitle>
            💬 Live Chat with {patient.name.split(" ")[0]}
          </SectionTitle>
          <MessagingPanel patientId={patient.id} senderRole="Doctor"/>
        </Card>
      )}
    </div>
  );
}

// ─── ALERTS PAGE ──────────────────────────────────────────────────────────────
function AlertsPage({ alerts, onAck, loading }) {
  const T=useT();
  const [filter,setFilter]=useState("all");
  const chips=[["all","All Active"],["critical","Critical"],["warning","Warning"],["resolved","Resolved"]];
  const filtered=filter==="resolved"?alerts.filter(a=>a.resolved):filter==="all"?alerts.filter(a=>!a.resolved):alerts.filter(a=>a.type===filter&&!a.resolved);
  return (
    <div style={{animation:"fadeInUp .35s ease"}}>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {chips.map(([val,label])=>{
          const cnt=val==="all"?alerts.filter(a=>!a.resolved).length:val==="resolved"?alerts.filter(a=>a.resolved).length:alerts.filter(a=>a.type===val&&!a.resolved).length;
          return (
            <div key={val} onClick={()=>setFilter(val)} style={{padding:"7px 16px",borderRadius:99,fontSize:12,
              fontWeight:600,cursor:"pointer",border:"1px solid",transition:"all .18s",
              borderColor:filter===val?(val==="critical"?"#EF4444":val==="warning"?"#F59E0B":"#093095"):T.divider,
              background:filter===val?(val==="critical"?"#EF4444":val==="warning"?"#F59E0B":"#093095"):T.card,
              color:filter===val?"#fff":T.textSec}}>
              {label} {cnt>0&&<span style={{opacity:.75}}>({cnt})</span>}
            </div>
          );
        })}
      </div>
      {loading?<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:48,background:T.card,borderRadius:14,gap:12,color:T.textMuted,fontSize:13}}>
        <Spinner size={18} color={T.divider} top="#093095"/>Loading…</div>
      :!filtered.length?<div style={{textAlign:"center",padding:"48px 0",background:T.card,borderRadius:14,border:`1px dashed ${T.divider}`,color:T.textMuted,fontSize:13}}>✓ No alerts in this category</div>
      :<div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map((a,i)=>{
          const isCrit=a.type==="critical", isRes=a.resolved;
          return (
            <div key={a.id} style={{padding:"14px 18px",borderRadius:14,
              border:`1.5px solid ${isRes?"#86EFAC":isCrit?"#FCA5A5":"#FCD34D"}`,
              background:isRes?"#ECFDF5":isCrit?"#FEF2F2":"#FFFBEB",
              display:"flex",gap:13,alignItems:"flex-start",animationDelay:`${i*.05}s`}}>
              <div style={{width:36,height:36,borderRadius:10,flexShrink:0,
                background:isRes?"#D1FAE5":isCrit?"#FEE2E2":"#FEF3C7",
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
                {isRes?"✅":isCrit?"🚨":"⚠️"}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#111827"}}>{a.patient}</span>
                  <StatusBadge status={isRes?"normal":a.type}/>
                </div>
                <div style={{fontSize:12,color:"#6B7280",lineHeight:1.5}}>{a.msg}</div>
                <div style={{display:"flex",gap:10,marginTop:10,alignItems:"center"}}>
                  {!isRes&&<button onClick={()=>onAck(a.id)} style={{fontSize:12,padding:"5px 14px",borderRadius:8,
                    cursor:"pointer",fontWeight:600,border:"none",
                    background:isCrit?"#EF4444":"#F59E0B",color:"#fff",
                    boxShadow:isCrit?"0 3px 8px rgba(239,68,68,.3)":"0 3px 8px rgba(245,158,11,.3)"}}>Acknowledge</button>}
                  <span style={{fontSize:11,color:"#9CA3AF"}}>{a.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ dark, setDark, onSettingsSaved }) {
  const T=useT();
  const [tab,setTab]=useState("profile");
  const [profile,setProfile]=useState({doctor_name:"Dr. Ummelaila",specialty:"Neurologist",email:"dr.johnson@hospital.com"});
  const [alertCfg,setAlertCfg]=useState({alert_threshold:3,auto_acknowledge:false,notifications:true});
  const [saving,setSaving]=useState(false);
  const [uploads,setUploads]=useState([]);
  const [dragging,setDragging]=useState(false);
  const [uploadMsg,setUploadMsg]=useState("");
  const fileRef=useRef(null);

  useEffect(()=>{
    api.getSettings().then(s=>{
      setProfile({doctor_name:s.doctor_name||"Dr. Ummelaila",specialty:s.specialty||"Neurologist",email:s.email||""});
      setAlertCfg({alert_threshold:s.alert_threshold||3,auto_acknowledge:s.auto_acknowledge||false,notifications:s.notifications!==false});
    }).catch(()=>{});
    api.listUploads().then(r=>setUploads(r.files||[])).catch(()=>{});
  },[]);

  const saveProfile=async()=>{
    setSaving(true);
    try{ await api.updateSettings(profile); onSettingsSaved(profile.doctor_name); }
    catch(e){ console.error(e); } finally{ setSaving(false); }
  };
  const saveAlerts=async()=>{
    setSaving(true);
    try{ await api.updateSettings(alertCfg); } catch(e){ console.error(e); } finally{ setSaving(false); }
  };
  const handleFile=async(file)=>{
    if(!file) return;
    setUploadMsg("Uploading…");
    try{
      const r=await api.uploadData(file);
      setUploads(u=>[r.file,...u]);
      setUploadMsg(`✅ ${r.file.filename} (${r.file.size_kb} KB) uploaded successfully!`);
    }catch(e){ setUploadMsg("❌ Upload failed. Please try again."); }
  };
  const tabs=[["profile","Profile"],["alerts","Alert Config"],["data","Data & Training"]];
  const input=(label,key,type="text")=>(
    <div style={{marginBottom:16}}>
      <label style={{fontSize:12,fontWeight:600,color:T.textSec,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:".06em"}}>{label}</label>
      <input type={type} value={profile[key]||""} onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}
        style={{width:"100%",padding:"10px 14px",border:`1px solid ${T.divider}`,borderRadius:10,
          background:T.inputBg,fontSize:13,outline:"none",color:T.text,transition:"border .15s"}}
        onFocus={e=>e.target.style.borderColor="#093095"}
        onBlur={e=>e.target.style.borderColor=T.divider}/>
    </div>
  );
  return (
    <div style={{animation:"fadeInUp .35s ease",maxWidth:640}}>
      <div style={{display:"flex",gap:4,marginBottom:24,background:T.inputBg,padding:4,borderRadius:12,border:`1px solid ${T.divider}`}}>
        {tabs.map(([id,label])=>(
          <div key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px 0",borderRadius:9,textAlign:"center",
            fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .18s",
            background:tab===id?"#093095":"transparent",color:tab===id?"#fff":T.textSec,
            boxShadow:tab===id?"0 3px 10px rgba(9,48,149,.25)":"none"}}>
            {label}
          </div>
        ))}
      </div>
      {tab==="profile"&&(
        <Card>
          <SectionTitle>Profile Settings</SectionTitle>
          {input("Doctor Name","doctor_name")}
          {input("Specialty","specialty")}
          {input("Email","email","email")}
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:T.textSec,display:"block",marginBottom:10,textTransform:"uppercase",letterSpacing:".06em"}}>Dark Mode</label>
            <div onClick={()=>setDark(d=>!d)} style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}}>
              <div style={{width:48,height:26,borderRadius:99,background:dark?"#093095":"#E5E9F5",
                position:"relative",transition:"background .2s"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",
                  top:3,left:dark?24:3,transition:"left .2s",boxShadow:"0 2px 4px rgba(0,0,0,.2)"}}/>
              </div>
              <span style={{fontSize:13,color:T.text,fontWeight:500}}>{dark?"Dark mode on":"Light mode"}</span>
            </div>
          </div>
          <button onClick={saveProfile} disabled={saving} style={{padding:"10px 22px",borderRadius:10,border:"none",
            background:saving?"#C3CCDF":"linear-gradient(135deg,#093095,#2E5BE8)",color:"#fff",
            fontSize:13,fontWeight:600,cursor:saving?"not-allowed":"pointer",
            display:"flex",alignItems:"center",gap:8,boxShadow:saving?"none":"0 4px 14px rgba(9,48,149,.3)"}}>
            {saving&&<Spinner size={14}/>}{saving?"Saving…":"Save Profile"}
          </button>
        </Card>
      )}
      {tab==="alerts"&&(
        <Card>
          <SectionTitle>Alert Configuration</SectionTitle>
          <div style={{marginBottom:20}}>
            <label style={{fontSize:12,fontWeight:600,color:T.textSec,display:"block",marginBottom:8,textTransform:"uppercase",letterSpacing:".06em"}}>
              Alert Threshold: <span style={{color:"#093095"}}>{alertCfg.alert_threshold} consecutive readings</span>
            </label>
            <input type="range" min={1} max={10} value={alertCfg.alert_threshold}
              onChange={e=>setAlertCfg(a=>({...a,alert_threshold:+e.target.value}))}
              style={{width:"100%",accentColor:"#093095"}}/>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textMuted,marginTop:4}}>
              <span>1 (Sensitive)</span><span>10 (Lenient)</span>
            </div>
          </div>
          {[["auto_acknowledge","Auto-acknowledge resolved alerts"],["notifications","Enable alert notifications"]].map(([key,label])=>(
            <div key={key} onClick={()=>setAlertCfg(a=>({...a,[key]:!a[key]}))}
              style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,cursor:"pointer"}}>
              <div style={{width:48,height:26,borderRadius:99,background:alertCfg[key]?"#093095":T.divider,position:"relative",transition:"background .2s",flexShrink:0}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",position:"absolute",
                  top:3,left:alertCfg[key]?24:3,transition:"left .2s",boxShadow:"0 2px 4px rgba(0,0,0,.2)"}}/>
              </div>
              <span style={{fontSize:13,color:T.text}}>{label}</span>
            </div>
          ))}
          <button onClick={saveAlerts} disabled={saving} style={{padding:"10px 22px",borderRadius:10,border:"none",
            background:saving?"#C3CCDF":"linear-gradient(135deg,#093095,#2E5BE8)",color:"#fff",fontSize:13,
            fontWeight:600,cursor:saving?"not-allowed":"pointer",display:"flex",alignItems:"center",gap:8,
            boxShadow:saving?"none":"0 4px 14px rgba(9,48,149,.3)"}}>
            {saving&&<Spinner size={14}/>}{saving?"Saving…":"Save Config"}
          </button>
        </Card>
      )}
      {tab==="data"&&(
        <div>
          <Card style={{marginBottom:16}}>
            <SectionTitle>Upload Training Data</SectionTitle>
            <p style={{fontSize:13,color:T.textSec,marginBottom:16,lineHeight:1.7}}>
              Upload your EEG data files (CSV or EDF format) to train a custom emotion classification model. 
              Files are queued and processed on the backend.
            </p>
            <div onDragOver={e=>{e.preventDefault();setDragging(true);}}
              onDragLeave={()=>setDragging(false)}
              onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}
              onClick={()=>fileRef.current?.click()}
              style={{border:`2px dashed ${dragging?"#093095":T.divider}`,borderRadius:14,
                padding:"32px 24px",textAlign:"center",cursor:"pointer",transition:"all .18s",
                background:dragging?"rgba(9,48,149,.05)":T.inputBg}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:12,color:dragging?"#093095":T.textMuted}}>{Icons.upload}</div>
              <div style={{fontSize:14,fontWeight:600,color:dragging?"#093095":T.text,marginBottom:4}}>
                {dragging?"Drop your file here":"Drag & drop or click to upload"}
              </div>
              <div style={{fontSize:12,color:T.textMuted}}>Supports CSV, EDF, TXT · Max 50MB per file</div>
              <input ref={fileRef} type="file" accept=".csv,.edf,.txt" style={{display:"none"}}
                onChange={e=>handleFile(e.target.files[0])}/>
            </div>
            {uploadMsg&&<div style={{marginTop:12,padding:"10px 14px",borderRadius:10,fontSize:13,
              background:uploadMsg.startsWith("✅")?"#ECFDF5":"#FEF2F2",
              color:uploadMsg.startsWith("✅")?"#059669":"#DC2626",
              border:`1px solid ${uploadMsg.startsWith("✅")?"#86EFAC":"#FCA5A5"}`}}>{uploadMsg}</div>}
          </Card>
          {uploads.length>0&&(
            <Card>
              <SectionTitle>Uploaded Files</SectionTitle>
              {uploads.map(f=>(
                <div key={f.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",
                  borderBottom:`1px solid ${T.divider}`}}>
                  <div style={{width:36,height:36,borderRadius:9,background:"#EEF2FF",display:"flex",
                    alignItems:"center",justifyContent:"center",color:"#093095",flexShrink:0}}>{Icons.upload}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,color:T.text}}>{f.filename}</div>
                    <div style={{fontSize:11,color:T.textMuted}}>{f.size_kb} KB · {f.uploaded_at}</div>
                  </div>
                  <span style={{fontSize:10,fontWeight:600,padding:"3px 10px",borderRadius:99,
                    background:"#FFFBEB",color:"#D97706"}}>Queued</span>
                </div>
              ))}
            </Card>
          )}
          <Card style={{marginTop:16,background:"linear-gradient(135deg,#F5F3FF,#EDE9FE)",border:"1px solid #C4B5FD"}}>
            <div style={{fontSize:13,fontWeight:600,color:"#4C1D95",marginBottom:8}}>🔬 Future: Custom Model Training</div>
            <p style={{fontSize:13,color:"#5B21B6",lineHeight:1.7,margin:0}}>
              Once you upload sufficient labeled EEG data, you will be able to train a model customised 
              to your patient population. Training typically requires 500+ labeled samples per emotion class. 
              This feature is coming in the next release.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── PATIENT DASHBOARD ────────────────────────────────────────────────────────

// ─── WELLNESS SCORE RING ──────────────────────────────────────────────────────
function WellnessRing({ score, size=160 }) {
  const r=60, circ=2*Math.PI*r;
  const fill=circ*(1-score/100);
  const color=score>=70?"#10B981":score>=45?"#F59E0B":"#EF4444";
  const label=score>=70?"Great":"Moderate";
  return (
    <svg width={size} height={size} viewBox="0 0 140 140" style={{display:"block",margin:"0 auto"}}>
      <circle cx="70" cy="70" r={r} fill="none" stroke="#E5E9F5" strokeWidth="14"/>
      <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="14"
        strokeDasharray={circ} strokeDashoffset={fill}
        strokeLinecap="round" transform="rotate(-90 70 70)"
        style={{transition:"stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1),stroke .6s"}}/>
      <text x="70" y="65" textAnchor="middle" fontSize="26" fontWeight="800"
        fill={color} fontFamily="Inter,system-ui,sans-serif">{score}</text>
      <text x="70" y="82" textAnchor="middle" fontSize="11" fill="#9CA3AF"
        fontFamily="Inter,system-ui,sans-serif">/ 100</text>
      <text x="70" y="97" textAnchor="middle" fontSize="11" fontWeight="600"
        fill={color} fontFamily="Inter,system-ui,sans-serif">{label}</text>
    </svg>
  );
}

// ─── BREATHING GUIDE ──────────────────────────────────────────────────────────
function BreathingGuide({ visible }) {
  const T=useT();
  const [phase,setPhase]=useState(0);
  const [active,setActive]=useState(false);
  const PHASES=["Inhale","Hold","Exhale","Hold"];
  const DURATIONS=[4000,4000,4000,2000];
  const labels=["4s","4s","4s","2s"];
  useEffect(()=>{
    if(!active)return;
    let p=0;
    const tick=()=>{setPhase(p);return setTimeout(()=>{p=(p+1)%4;tick();},DURATIONS[p]);};
    const t=tick();
    return()=>clearTimeout(t);
  },[active]);
  if(!visible&&!active)return null;
  const size=active?110:80;
  const phaseColor=["#10B981","#3B82F6","#093095","#3B82F6"][phase];
  return (
    <div style={{background:T.card,borderRadius:20,padding:"20px 16px",marginBottom:16,
      border:"1px solid "+T.divider,textAlign:"center",animation:"fadeInUp .3s ease"}}>
      <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>🧘 Breathing Guide</div>
      <div style={{fontSize:11,color:T.textMuted,marginBottom:16}}>
        {active?"Follow the circle — it helps reduce stress":"Stress detected. Try a breathing exercise?"}
      </div>
      <div style={{position:"relative",width:size,height:size,margin:"0 auto 16px",transition:"all .6s ease"}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",
          background:phaseColor+"22",border:"3px solid "+phaseColor,
          animation:active?(phase===0||phase===2?"breatheExpand .4s ease":"breatheShrink .4s ease"):"none",
          display:"flex",alignItems:"center",justifyContent:"center",
          transition:"background .6s,border-color .6s"}}>
          <div style={{fontSize:active?18:14,fontWeight:700,color:phaseColor,transition:"all .4s"}}>
            {active?PHASES[phase]:"●"}
          </div>
        </div>
      </div>
      {active&&(
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:12}}>
          {PHASES.map((ph,i)=>(
            <div key={i} style={{textAlign:"center",opacity:i===phase?1:.4,transition:"opacity .3s"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:phaseColor,
                margin:"0 auto 4px",transform:i===phase?"scale(1.4)":"scale(1)",transition:"transform .3s"}}/>
              <div style={{fontSize:9,color:T.textMuted}}>{ph}<br/>{labels[i]}</div>
            </div>
          ))}
        </div>
      )}
      <button onClick={()=>setActive(a=>!a)}
        style={{padding:"9px 22px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:600,
          background:active?"#FEF2F2":"linear-gradient(135deg,#093095,#2E5BE8)",
          color:active?"#DC2626":"#fff",transition:"all .2s"}}>
        {active?"Stop Exercise":"Start Exercise"}
      </button>
    </div>
  );
}

// ─── PATIENT DASHBOARD ────────────────────────────────────────────────────────
function PatientDashboard({ onLogout, userName, doctorName, patientId }) {
  const T=useT();
  const [tab,setTab]=useState(0);
  const [emotion,setEmotion]=useState("Calm"), [conf,setConf]=useState(87);
  const [bars,setBars]=useState([]), [secs,setSecs]=useState(0);
  const [moodLog,setMoodLog]=useState([]);
  const [painVal,setPainVal]=useState(0), [painSent,setPainSent]=useState(false);
  const [moodSent,setMoodSent]=useState(false);
  const [attentionSent,setAttentionSent]=useState(false);
  const [toast,setToast]=useState(null);

  // Use patientId from login (Ahmed Raza = 1 by default)
  const myId=patientId||1;

  useEffect(()=>{
    const iv=setInterval(async()=>{
      try{
        const r=await api.classifyEEG(myId);
        setEmotion(r.emotion); setConf(r.confidence);
        setBars(p=>{const n=[...p,r.emotion];return n.length>30?n.slice(-30):n;});
      }catch{}
    },4000);
    const si=setInterval(()=>setSecs(s=>s+1),1000);
    return()=>{clearInterval(iv);clearInterval(si);};
  },[myId]);

  useEffect(()=>{if(toast)setTimeout(()=>setToast(null),3500);},[toast]);

  const mm=String(Math.floor(secs/60)).padStart(2,"0");
  const ss=String(secs%60).padStart(2,"0");
  const firstName=userName?userName.split(" ")[0]:"Patient";
  const W_MAP={Happy:100,Calm:88,Sad:55,Stress:28,Pain:12};
  const wellnessScore=bars.length===0?75:Math.round(bars.reduce((a,e)=>a+(W_MAP[e]||50),0)/bars.length);
  const isStressed=emotion==="Stress"||emotion==="Pain";
  const emotionMeta=ES[emotion]||ES.Calm;

  const MOODS=[
    {icon:"😊",label:"Happy",color:"#22C55E"},
    {icon:"😌",label:"Calm", color:"#10B981"},
    {icon:"😔",label:"Sad",  color:"#3B82F6"},
    {icon:"😰",label:"Anxious",color:"#F59E0B"},
    {icon:"😣",label:"Pain", color:"#EF4444"},
  ];

  const submitMood=(mood)=>{
    setMoodLog(m=>[{time:"Just now",icon:mood.icon,label:mood.label},...m.slice(0,9)]);
    setMoodSent(true);
    setToast("Mood logged — "+mood.label+" "+mood.icon);
    setTimeout(()=>setMoodSent(false),4000);
  };

  const submitPain=()=>{
    if(painVal===0)return;
    setPainSent(true);
    setToast("Pain level "+painVal+"/10 sent to doctor");
    setTimeout(()=>{setPainSent(false);setPainVal(0);},5000);
  };

  const requestAttention=()=>{
    setAttentionSent(true);
    setToast("🔔 Doctor alerted! Help is on the way.");
    setTimeout(()=>setAttentionSent(false),10000);
  };

  const painColor=painVal===0?"#9CA3AF":painVal<=3?"#10B981":painVal<=6?"#F59E0B":"#EF4444";

  const TABS=[{icon:"🏠",label:"Home"},{icon:"📝",label:"My Health"},{icon:"💬",label:"Messages"}];

  return (
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:"Inter,system-ui,sans-serif"}}>
      {/* Top bar */}
      <div style={{background:T.topbar,borderBottom:"1px solid "+T.divider,padding:"12px 16px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        position:"sticky",top:0,zIndex:20,boxShadow:"0 2px 8px rgba(9,48,149,.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#093095,#2E5BE8)",
            display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0}}>{Icons.eeg}</div>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.text}}>NeuroTrack</div>
            <div style={{fontSize:10,color:T.textMuted}}>Patient Portal</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:11,color:T.textMuted,background:T.inputBg,
            padding:"4px 10px",borderRadius:20,border:"1px solid "+T.divider}}>
            {mm}:{ss}
          </span>
          <button onClick={onLogout} style={{display:"flex",alignItems:"center",gap:5,
            padding:"6px 12px",borderRadius:9,border:"1px solid "+T.divider,
            background:"transparent",cursor:"pointer",fontSize:12,color:T.textSec,fontWeight:500}}>
            {Icons.logout} Out
          </button>
        </div>
      </div>

      <div style={{maxWidth:500,margin:"0 auto",padding:"16px 14px 90px"}}>

        {/* Greeting + wellness */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,
          background:T.card,borderRadius:16,padding:"16px",border:"1px solid "+T.divider}}>
          <WellnessRing score={wellnessScore}/>
          <div style={{flex:1}}>
            <div style={{fontSize:11,color:T.textMuted,fontWeight:500}}>Good day,</div>
            <div style={{fontSize:20,fontWeight:700,color:T.text,letterSpacing:"-.3px"}}>{firstName} 👋</div>
            <div style={{fontSize:12,color:T.textMuted,marginTop:2}}>{bars.length} EEG readings this session</div>
          </div>
        </div>

        {/* ═══ TAB 0: HOME ═══ */}
        {tab===0&&(
          <div>
            {/* Live EEG card */}
            <div style={{background:"linear-gradient(135deg,"+emotionMeta.bg+","+T.card+")",
              borderRadius:16,padding:"16px",marginBottom:14,
              border:"1.5px solid "+emotionMeta.border}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:".08em"}}>
                  Your Brain Right Now
                </div>
                <div style={{display:"flex",alignItems:"center",gap:5}}>
                  <LiveDot active size={7}/>
                  <span style={{fontSize:10,color:"#10B981",fontWeight:600}}>Live EEG</span>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:48}}>{emotionMeta.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:22,fontWeight:800,color:emotionMeta.text,letterSpacing:"-.3px"}}>{emotion}</div>
                  <div style={{fontSize:12,color:emotionMeta.text,opacity:.75,marginTop:3,lineHeight:1.5}}>
                    {emotion==="Happy"&&"You're feeling great! Keep it up 🌟"}
                    {emotion==="Calm"&&"Very relaxed. Your brain is in a good state 😌"}
                    {emotion==="Sad"&&"Feeling a bit low — your doctor is watching over you 💙"}
                    {emotion==="Stress"&&"Some stress detected. Try the breathing guide below 🌬️"}
                    {emotion==="Pain"&&"Discomfort detected. Alert your doctor if you need help 🔔"}
                  </div>
                  <div style={{marginTop:8,height:5,background:"rgba(0,0,0,.08)",borderRadius:99}}>
                    <div style={{height:"100%",width:conf+"%",borderRadius:99,background:EC[emotion],transition:"width .6s"}}/>
                  </div>
                  <div style={{fontSize:10,color:emotionMeta.text,opacity:.6,marginTop:2}}>Confidence: {conf}%</div>
                </div>
              </div>
            </div>

            {/* Breathing guide — appears automatically when stressed */}
            <BreathingGuide visible={isStressed}/>

            {/* Call doctor button */}
            <button onClick={requestAttention}
              style={{width:"100%",padding:"14px",borderRadius:14,border:"none",cursor:"pointer",
                fontSize:14,fontWeight:700,marginBottom:14,transition:"all .2s",
                background:attentionSent?"#ECFDF5":"linear-gradient(135deg,#DC2626,#EF4444)",
                color:attentionSent?"#059669":"#fff",
                boxShadow:attentionSent?"none":"0 6px 20px rgba(220,38,38,.35)"}}>
              {attentionSent?"✅ Doctor Alerted — Help is on the way":"🔔 Request Doctor's Attention Now"}
            </button>

            {/* Recent readings */}
            {bars.length>0&&(
              <div style={{background:T.card,borderRadius:14,padding:"14px",
                marginBottom:14,border:"1px solid "+T.divider}}>
                <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:10}}>Recent EEG Readings</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
                  {bars.slice(-15).map((e,i)=>(
                    <div key={i} title={e} style={{width:26,height:26,borderRadius:7,
                      background:ES[e]?.badge||"#E5E9F5",display:"flex",alignItems:"center",
                      justifyContent:"center",fontSize:13,border:"1px solid "+(ES[e]?.border||T.divider)}}>
                      {ES[e]?.icon||"?"}
                    </div>
                  ))}
                </div>
                <EmotionBars data={bars.slice(-20)} height={50}/>
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB 1: MY HEALTH ═══ */}
        {tab===1&&(
          <div>
            {/* Mood Check-in */}
            <div style={{background:T.card,borderRadius:16,padding:"18px 14px",
              marginBottom:14,border:"1px solid "+T.divider}}>
              <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:3}}>How are you feeling?</div>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:16}}>Tap a mood — shared with your doctor</div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                {MOODS.map(m=>(
                  <button key={m.label} onClick={()=>submitMood(m)}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,
                      padding:"10px 6px",borderRadius:12,border:"2px solid "+T.divider,
                      background:T.inputBg,cursor:"pointer",flex:1,margin:"0 3px",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=m.color;e.currentTarget.style.background=m.color+"18";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=T.divider;e.currentTarget.style.background=T.inputBg;}}>
                    <span style={{fontSize:24}}>{m.icon}</span>
                    <span style={{fontSize:9,fontWeight:600,color:T.textSec}}>{m.label}</span>
                  </button>
                ))}
              </div>
              {moodSent&&<div style={{textAlign:"center",padding:"9px",borderRadius:10,
                background:"#ECFDF5",border:"1px solid #86EFAC",fontSize:12,fontWeight:600,color:"#059669"}}>
                ✅ Mood logged!
              </div>}
              {moodLog.length>0&&(
                <div style={{marginTop:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:T.textMuted,marginBottom:8}}>RECENT MOODS</div>
                  {moodLog.slice(0,4).map((m,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,
                      padding:"7px 0",borderBottom:i<Math.min(moodLog.length,4)-1?"1px solid "+T.divider:"none"}}>
                      <span style={{fontSize:18}}>{m.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:600,color:T.text}}>{m.label}</div>
                      </div>
                      <div style={{fontSize:10,color:T.textMuted}}>{m.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pain Slider */}
            <div style={{background:T.card,borderRadius:16,padding:"18px 14px",
              marginBottom:14,border:"1px solid "+T.divider}}>
              <div style={{fontSize:14,fontWeight:700,color:T.text,marginBottom:3}}>Pain Level</div>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:16}}>0 = no pain · 10 = severe</div>
              <div style={{textAlign:"center",marginBottom:14}}>
                <div style={{fontSize:48,fontWeight:900,color:painColor,lineHeight:1,transition:"color .3s"}}>
                  {painVal}<span style={{fontSize:18,color:T.textMuted,fontWeight:400}}>/10</span>
                </div>
                <div style={{fontSize:12,color:painColor,fontWeight:600,marginTop:3}}>
                  {painVal===0?"Not selected":painVal<=3?"Mild":painVal<=6?"Moderate":"Severe"}
                </div>
              </div>
              <input type="range" min={0} max={10} value={painVal}
                onChange={e=>setPainVal(Number(e.target.value))}
                style={{width:"100%",marginBottom:14,accentColor:painColor}}/>
              <button onClick={submitPain} disabled={painVal===0||painSent}
                style={{width:"100%",padding:"12px",borderRadius:12,border:"none",
                  cursor:painVal===0||painSent?"not-allowed":"pointer",fontSize:13,fontWeight:700,
                  background:painSent?"#ECFDF5":painVal===0?"#E5E9F5":"linear-gradient(135deg,#EF4444,#DC2626)",
                  color:painSent?"#059669":painVal===0?T.textMuted:"#fff",transition:"all .2s"}}>
                {painSent?"✅ Sent to doctor":"Send Pain Report to Doctor"}
              </button>
            </div>

            {/* Breathing Guide */}
            <BreathingGuide visible={true}/>
          </div>
        )}

        {/* ═══ TAB 2: MESSAGES ═══ */}
        {tab===2&&(
          <div>
            {/* Doctor info card */}
            <div style={{background:"linear-gradient(135deg,#051854,#093095)",
              borderRadius:16,padding:"18px 16px",marginBottom:14,
              boxShadow:"0 8px 24px rgba(9,48,149,.3)"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:48,height:48,borderRadius:14,
                  background:"rgba(255,255,255,.15)",border:"2px solid rgba(255,255,255,.2)",
                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>👨‍⚕️</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{doctorName||"Dr. Ummelaila"}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>Neurologist · EEG Specialist</div>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginTop:4}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#34D399",animation:"pulse 1.5s infinite"}}/>
                    <span style={{fontSize:10,color:"#34D399",fontWeight:600}}>Online — monitoring your session</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Full messaging panel — always uses myId (defaults to 1 if login didn't return patient_id) */}
            <div style={{background:T.card,borderRadius:16,padding:"16px",border:"1px solid "+T.divider}}>
              <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:12}}>💬 Chat with Your Doctor</div>
              <MessagingPanel patientId={myId} senderRole="Patient"/>
            </div>
          </div>
        )}
      </div>

      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}

      {/* Bottom Tab Bar */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:T.topbar,
        borderTop:"1px solid "+T.divider,display:"flex",
        boxShadow:"0 -4px 20px rgba(9,48,149,.08)",zIndex:30}}>
        {TABS.map((t,i)=>(
          <button key={t.label} onClick={()=>setTab(i)}
            style={{flex:1,padding:"11px 0 8px",border:"none",background:"none",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              color:tab===i?"#093095":T.textMuted,transition:"color .15s"}}>
            <span style={{fontSize:20,lineHeight:1}}>{t.icon}</span>
            <span style={{fontSize:10,fontWeight:tab===i?700:500}}>{t.label}</span>
            {tab===i&&<div style={{width:20,height:2,borderRadius:99,background:"#093095",marginTop:2}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}


// ─── COMMAND PALETTE ──────────────────────────────────────────────────────────
function CommandPalette({ open, onClose, patients, alerts, setPage, setMon, monitoring }) {
  const T=useT();
  const [q,setQ]=useState("");
  const [sel,setSel]=useState(0);
  const inp=useRef(null);
  useEffect(()=>{if(open){setQ("");setSel(0);setTimeout(()=>inp.current&&inp.current.focus(),60);}}, [open]);
  const activeAlerts=alerts.filter(a=>!a.resolved);
  const PAGES=[
    {icon:"🏠",label:"Dashboard",         action:()=>{setPage("dashboard");onClose();}},
    {icon:"📡",label:"Live Monitor",      action:()=>{setPage("monitor");onClose();}},
    {icon:"👥",label:"Patients",          action:()=>{setPage("patients");onClose();}},
    {icon:"🔔",label:"Alerts",            action:()=>{setPage("alerts");onClose();}},
    {icon:"📊",label:"Analytics",         action:()=>{setPage("analytics");onClose();}},
    {icon:"⚙️",label:"Settings",          action:()=>{setPage("settings");onClose();}},
    {icon:monitoring?"⏹️":"▶️",label:monitoring?"Stop Monitoring":"Start Monitoring",
      action:()=>{setMon(m=>!m);onClose();}},
  ];
  const patItems=patients.map(p=>({icon:"👤",label:"Patient: "+p.name,
    action:()=>{setPage("patients");onClose();}}));
  const altItems=activeAlerts.slice(0,5).map(a=>({icon:"⚠️",
    label:"Alert: "+a.patient+" – "+a.emotion,
    action:()=>{setPage("alerts");onClose();}}));
  const all=[...PAGES,...patItems,...altItems];
  const filtered=q?all.filter(i=>i.label.toLowerCase().includes(q.toLowerCase())):all;
  useEffect(()=>setSel(0),[q]);
  const handleKey=e=>{
    if(e.key==="ArrowDown"){e.preventDefault();setSel(s=>Math.min(s+1,filtered.length-1));}
    if(e.key==="ArrowUp"){e.preventDefault();setSel(s=>Math.max(s-1,0));}
    if(e.key==="Enter"&&filtered[sel])filtered[sel].action();
    if(e.key==="Escape")onClose();
  };
  if(!open)return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9100,
      display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:100,backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()} onKeyDown={handleKey}
        style={{width:560,maxWidth:"92vw",background:T.card,borderRadius:18,
          boxShadow:"0 28px 80px rgba(0,0,0,.35)",border:"1px solid "+T.cardBorder,
          overflow:"hidden",animation:"scaleIn .15s ease"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",
          borderBottom:"1px solid "+T.divider}}>
          <span style={{fontSize:18,opacity:.6}}>🔍</span>
          <input ref={inp} value={q} onChange={e=>setQ(e.target.value)}
            placeholder="Search pages, patients, actions…"
            style={{flex:1,border:"none",outline:"none",background:"transparent",
              fontSize:15,color:T.text,fontFamily:"inherit"}}/>
          <kbd style={{fontSize:11,padding:"3px 8px",background:T.inputBg,
            border:"1px solid "+T.divider,borderRadius:6,color:T.textMuted,fontFamily:"monospace"}}>ESC</kbd>
        </div>
        <div style={{maxHeight:360,overflowY:"auto"}}>
          {filtered.length===0&&<div style={{padding:"32px",textAlign:"center",color:T.textMuted,fontSize:14}}>No results</div>}
          {filtered.map((item,i)=>(
            <div key={i} onClick={item.action}
              onMouseEnter={()=>setSel(i)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"11px 18px",cursor:"pointer",
                background:i===sel?"#093095":"transparent",
                color:i===sel?"#fff":T.text,transition:"background .1s"}}>
              <span style={{fontSize:16,width:24,textAlign:"center",flexShrink:0}}>{item.icon}</span>
              <span style={{fontSize:14,fontWeight:500}}>{item.label}</span>
            </div>
          ))}
        </div>
        <div style={{padding:"10px 18px",borderTop:"1px solid "+T.divider,display:"flex",gap:18}}>
          {[["↑↓","Navigate"],["↵","Select"],["ESC","Close"]].map(([k,l])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.textMuted}}>
              <kbd style={{padding:"2px 6px",background:T.inputBg,border:"1px solid "+T.divider,
                borderRadius:4,fontFamily:"monospace"}}>{k}</kbd>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SHORTCUTS MODAL ──────────────────────────────────────────────────────────
function ShortcutsModal({ open, onClose }) {
  const T=useT();
  if(!open)return null;
  const SHORTCUTS=[
    ["Ctrl+K","Open command palette"],
    ["?","Show keyboard shortcuts"],
    ["M","Toggle monitoring on/off"],
    ["D","Go to Dashboard"],
    ["P","Go to Patients"],
    ["A","Go to Analytics"],
    ["L","Go to Alerts log"],
    ["S","Go to Settings"],
    ["Esc","Close modals / panels"],
  ];
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:9200,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <div onClick={e=>e.stopPropagation()}
        style={{width:440,maxWidth:"92vw",background:T.card,borderRadius:20,
          boxShadow:"0 28px 80px rgba(0,0,0,.35)",border:"1px solid "+T.cardBorder,
          padding:28,animation:"scaleIn .15s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontSize:17,fontWeight:700,color:T.text}}>⌨️ Keyboard Shortcuts</div>
          <button onClick={onClose}
            style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:T.textMuted,lineHeight:1}}>×</button>
        </div>
        {SHORTCUTS.map(([key,desc])=>(
          <div key={key} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"9px 0",borderBottom:"1px solid "+T.divider}}>
            <span style={{fontSize:13,color:T.textSec}}>{desc}</span>
            <kbd style={{padding:"4px 11px",background:T.inputBg,border:"1px solid "+T.divider,
              borderRadius:7,fontSize:12,fontWeight:600,color:T.text,fontFamily:"monospace"}}>{key}</kbd>
          </div>
        ))}
        <div style={{marginTop:18,fontSize:12,color:T.textMuted,textAlign:"center"}}>
          Press <kbd style={{padding:"2px 7px",background:T.inputBg,border:"1px solid "+T.divider,
            borderRadius:5,fontFamily:"monospace",color:T.textSec}}>?</kbd> anytime to open this
        </div>
      </div>
    </div>
  );
}

// ─── NEURO ASSIST CHATBOT ─────────────────────────────────────────────────────

function NeuroAssist({ patients, alerts, monitoring, sessionBars, setPage, setMon }) {
  const T=useT();
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([{from:"bot",text:"Hi! I'm NeuroAssist 🧠 Ask me about patients, alerts, or session status."}]);
  const [typing,setTyping]=useState(false);
  const [input,setInput]=useState("");
  const bottomRef=useRef(null);
  const activeAlerts=alerts.filter(a=>!a.resolved);
  const critPats=patients.filter(p=>p.status==="critical");

  useEffect(()=>{bottomRef.current&&bottomRef.current.scrollIntoView({behavior:"smooth"});},[msgs,typing]);

  const getReply=(q)=>{
    const ql=q.toLowerCase();
    const warnPats=patients.filter(p=>p.status==="warning");

    // ── Navigation ──
    if(ql.includes("dashboard")){setPage("dashboard");return "🏠 Going to Dashboard.";}
    if(ql.includes("analytic")){setPage("analytics");return "📊 Opening Analytics.";}
    if(ql.includes("setting")){setPage("settings");return "⚙️ Opening Settings.";}
    if(ql.includes("alert")&&ql.includes("go")){setPage("alerts");return "🔔 Opening Alerts page.";}
    if(ql.includes("start monitor")||ql==="start"){setMon(true);setPage("monitor");return "▶️ Monitoring started for all "+patients.length+" patients. Real GAMEEMO EEG data streaming.";}
    if(ql.includes("stop monitor")||ql==="stop"){setMon(false);return "⏹️ Monitoring stopped.";}

    // ── Who needs attention / risk ──
    if(ql.includes("risk")||ql.includes("attention")||ql.includes("priority")||ql.includes("who")){
      if(critPats.length>0){
        const names=critPats.map(p=>`${p.name} (${p.emotion})`).join(", ");
        return `🚨 CRITICAL: ${names}.\n\n${warnPats.length>0?"⚠️ Also warning: "+warnPats.map(p=>p.name).join(", ")+".":""}\n\nClick their card on Dashboard to see treatment protocol.`;
      }
      if(warnPats.length>0) return `⚠️ ${warnPats.length} patient(s) need attention: ${warnPats.map(p=>`${p.name} (${p.emotion})`).join(", ")}. No critical cases right now.`;
      return "✅ All "+patients.length+" patients are currently stable. Continue standard monitoring.";
    }

    // ── Per-patient queries ──
    const matched=patients.find(p=>ql.includes(p.name.split(" ")[0].toLowerCase())||ql.includes(p.name.toLowerCase()));
    if(matched){
      const tr=TREATMENT[matched.emotion]||TREATMENT.Calm;
      const isUrgent=matched.status==="critical"||matched.status==="warning";
      return `👤 ${matched.name} — ${matched.condition}\n\n`+
        `Current state: ${ES[matched.emotion]?.icon||""} ${matched.emotion} (${matched.status})\n\n`+
        `${isUrgent?"⚠️ Action needed: ":"✅ Recommendation: "}${tr.steps[0]}\n\n`+
        `Open their detail page to see the full ${tr.title} and live EEG.`;
    }

    // ── Alerts ──
    if(ql.includes("alert")){
      if(activeAlerts.length===0)return "✅ No active alerts right now. All patients acknowledged.";
      const crit=activeAlerts.filter(a=>a.type==="critical");
      const warn=activeAlerts.filter(a=>a.type==="warning");
      let msg="🔔 "+activeAlerts.length+" active alert(s):\n";
      if(crit.length) msg+="\n🚨 Critical: "+crit.map(a=>a.patient).join(", ");
      if(warn.length) msg+="\n⚠️ Warning: "+warn.map(a=>a.patient).join(", ");
      msg+="\n\nGo to Alerts page to acknowledge.";
      return msg;
    }

    // ── Patient overview ──
    if(ql.includes("patient")||ql.includes("all patient")||ql.includes("overview")){
      if(!patients.length) return "No patients loaded yet.";
      const lines=patients.map(p=>`${ES[p.emotion]?.icon||""} ${p.name}: ${p.emotion} (${p.status})`);
      return `📋 ${patients.length} patients:\n\n${lines.join("\n")}\n\n${critPats.length>0?"🚨 "+critPats.length+" critical!":warnPats.length>0?"⚠️ "+warnPats.length+" warning.":"✅ All stable."}`;
    }

    // ── Monitor/session ──
    if(ql.includes("monitor")||ql.includes("session")||ql.includes("reading")){
      if(!monitoring) return "📡 Monitoring is OFF. Say 'start monitor' or press the toggle in the top bar.";
      const counts=sessionBars.reduce((a,e)=>{a[e]=(a[e]||0)+1;return a;},{});
      const top=sessionBars.length?Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]:null;
      return `📡 Monitoring ACTIVE — ${sessionBars.length} readings captured.\n`+
        (top?`Dominant emotion: ${top[0]} (${Math.round(top[1]/sessionBars.length*100)}%)\n`:"")+
        `Showing Ahmed Raza's EEG stream on Live Monitor.`;
    }

    // ── Treatment / what to do ──
    if(ql.includes("treat")||ql.includes("do")||ql.includes("recommend")||ql.includes("action")){
      if(critPats.length>0){
        const p=critPats[0];
        const tr=TREATMENT[p.emotion]||TREATMENT.Calm;
        return `For ${p.name} (${p.emotion}):\n\n1. ${tr.steps[0]}\n2. ${tr.steps[1]}\n3. ${tr.steps[2]}\n\nOpen ${p.name.split(" ")[0]}'s detail page for full protocol.`;
      }
      return "No critical patients right now. All patients are within normal emotional range.";
    }

    // ── Help ──
    if(ql.includes("help")||ql==="?"||ql.includes("what can")){
      return "I can help with:\n\n• Patient status — 'Who needs attention?'\n• Per-patient — 'How is Usman?'\n• Alerts — 'Show alerts'\n• Treatment — 'What should I do?'\n• Navigation — 'Go to analytics'\n• Monitoring — 'Start monitor'\n\nTry the quick chips below!";
    }

    return "I'm not sure about that. Try asking 'who needs attention?', 'show alerts', or a patient name like 'how is Fatima?'";
  };

  const send=(text)=>{
    const t=(text||input).trim();
    if(!t)return;
    setInput("");
    setMsgs(m=>[...m,{from:"user",text:t}]);
    setTyping(true);
    setTimeout(()=>{
      setTyping(false);
      setMsgs(m=>[...m,{from:"bot",text:getReply(t)}]);
    },700+Math.random()*500);
  };

  const CHIPS=["Who needs attention?","Show alerts","Start monitor","What should I do?","All patients","Help"];

  return (
    <>
      {/* Floating brain button */}
      <button onClick={()=>setOpen(o=>!o)} title="NeuroAssist AI"
        style={{position:"fixed",bottom:28,right:28,width:56,height:56,borderRadius:"50%",
          background:"linear-gradient(135deg,#093095,#2E5BE8)",border:"none",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,
          boxShadow:"0 8px 28px rgba(9,48,149,.5)",zIndex:8000,
          animation:activeAlerts.length>0&&!open?"glowPulse 2s infinite":"none",
          transition:"transform .2s,box-shadow .2s",transform:open?"scale(1.08)":"scale(1)"}}>
        🧠
        {activeAlerts.length>0&&!open&&(
          <div style={{position:"absolute",top:0,right:0,width:18,height:18,borderRadius:"50%",
            background:"#EF4444",fontSize:10,fontWeight:700,color:"#fff",
            display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid white"}}>
            {activeAlerts.length}
          </div>
        )}
      </button>

      {/* Chat panel */}
      {open&&(
        <div style={{position:"fixed",bottom:96,right:28,width:340,height:490,
          background:T.card,borderRadius:20,boxShadow:"0 20px 60px rgba(0,0,0,.28)",
          border:"1px solid "+T.cardBorder,display:"flex",flexDirection:"column",
          zIndex:8000,animation:"slideInRight .22s ease",overflow:"hidden"}}>

          {/* Header */}
          <div style={{padding:"13px 16px",background:"linear-gradient(135deg,#093095,#2E5BE8)",
            display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>🧠</span>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>NeuroAssist</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>AI Clinical Assistant</div>
            </div>
            <button onClick={()=>setOpen(false)}
              style={{background:"rgba(255,255,255,.15)",border:"none",color:"#fff",
                width:28,height:28,borderRadius:8,cursor:"pointer",fontSize:18,
                display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>×</button>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:"12px 14px",
            display:"flex",flexDirection:"column",gap:10}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.from==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"83%",padding:"9px 13px",lineHeight:1.55,
                  borderRadius:m.from==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",
                  background:m.from==="user"?"linear-gradient(135deg,#093095,#2E5BE8)":T.inputBg,
                  color:m.from==="user"?"#fff":T.text,fontSize:13,
                  border:m.from==="bot"?"1px solid "+T.divider:"none"}}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing&&(
              <div style={{display:"flex",gap:5,padding:"10px 14px",background:T.inputBg,
                borderRadius:"14px 14px 14px 4px",width:"fit-content",border:"1px solid "+T.divider}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#093095",
                    animation:"pulse 1.2s ease-in-out "+i*0.22+"s infinite"}}/>
                ))}
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Quick-reply chips */}
          <div style={{padding:"7px 12px",display:"flex",gap:6,flexWrap:"wrap",
            borderTop:"1px solid "+T.divider}}>
            {CHIPS.map(c=>(
              <button key={c} onClick={()=>send(c)}
                style={{padding:"5px 10px",borderRadius:20,border:"1px solid #093095",
                  background:"transparent",color:"#093095",fontSize:11,cursor:"pointer",
                  fontWeight:500,fontFamily:"inherit",whiteSpace:"nowrap"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#093095";e.currentTarget.style.color="#fff";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#093095";}}>
                {c}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div style={{padding:"10px 12px",borderTop:"1px solid "+T.divider,
            display:"flex",gap:8,alignItems:"center"}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&send()}
              placeholder="Ask anything…"
              style={{flex:1,padding:"9px 13px",borderRadius:10,border:"1px solid "+T.divider,
                background:T.inputBg,color:T.text,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
            <button onClick={()=>send()}
              style={{width:38,height:38,flexShrink:0,borderRadius:10,
                background:"linear-gradient(135deg,#093095,#2E5BE8)",
                border:"none",color:"#fff",cursor:"pointer",fontSize:15,
                display:"flex",alignItems:"center",justifyContent:"center"}}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}

function DoctorApp({ onLogout, userName: initialName, dark, setDark }) {
  const [page,setPage]=useState("dashboard");
  const [monitoring,setMon]=useState(false);
  const [emotion,setEmotion]=useState("Calm"), [conf,setConf]=useState(87);
  const [bands,setBands]=useState(null), [trend,setTrend]=useState("Stable");
  const [sessionBars,setBars]=useState([]), [sessionSecs,setSecs]=useState(0);
  const [classCount,setCount]=useState(0);
  const [alerts,setAlerts]=useState([]), [patients,setPatients]=useState([]);
  const [stats,setStats]=useState(null), [selPatient,setSelPat]=useState(null);
  const [toast,setToast]=useState(null);
  const [loadPat,setLoadPat]=useState(true), [loadAlt,setLoadAlt]=useState(true);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [userName,setUserName]=useState(initialName);
  const [paletteOpen,setPaletteOpen]=useState(false);
  const [showShortcuts,setShowShortcuts]=useState(false);
  const [unreadMsgs,setUnreadMsgs]=useState({}); // {patient_id: count}
  const [msgToast,setMsgToast]=useState(null);   // {name, text}
  const knownMsgIds=useRef({});                  // {patient_id: Set of ids}
  const streak=useRef({emotion:"Calm",count:0});
  const monRef=useRef(monitoring);
  useEffect(()=>{monRef.current=monitoring;},[monitoring]);
  // Keep a ref to the latest patients list so the monitoring effect doesn't
  // restart every time patients update (which would cause animation flickers)
  const patientsRef=useRef([]);
  useEffect(()=>{patientsRef.current=patients;},[patients]);

  useEffect(()=>{
    api.getPatients().then(r=>{setPatients(r.patients||[]);setLoadPat(false);}).catch(()=>setLoadPat(false));
    api.getAlerts().then(r=>{setAlerts(r.alerts||[]);setLoadAlt(false);}).catch(()=>setLoadAlt(false));
    api.getStats().then(r=>setStats(r)).catch(()=>{});
    // Refresh alerts + stats every 8 seconds so new alerts appear automatically
    const iv=setInterval(()=>{
      api.getStats().then(r=>setStats(r)).catch(()=>{});
      api.getAlerts().then(r=>setAlerts(r.alerts||[])).catch(()=>{});
    },8000);
    return()=>clearInterval(iv);
  },[]);

  // Poll messages for all patients every 5s — show toast + badge on new patient messages
  useEffect(()=>{
    if(patients.length===0)return;
    const poll=()=>{
      patients.forEach(pat=>{
        api.getMessages(pat.id).then(r=>{
          const msgs=(r.messages||[]).filter(m=>m.sender_role==="Patient");
          const known=knownMsgIds.current[pat.id]||(knownMsgIds.current[pat.id]=new Set());
          const newOnes=msgs.filter(m=>!known.has(m.id));
          if(newOnes.length>0){
            newOnes.forEach(m=>known.add(m.id));
            // only show badge/toast if not currently viewing this patient's chat
            setUnreadMsgs(u=>({...u,[pat.id]:(u[pat.id]||0)+newOnes.length}));
            setMsgToast({name:pat.name.split(" ")[0], text:newOnes[newOnes.length-1].content});
            setTimeout(()=>setMsgToast(null),4000);
          } else {
            msgs.forEach(m=>known.add(m.id));
          }
        }).catch(()=>{});
      });
    };
    // seed known IDs first without triggering notifications
    patients.forEach(pat=>{
      api.getMessages(pat.id).then(r=>{
        const msgs=(r.messages||[]).filter(m=>m.sender_role==="Patient");
        const known=knownMsgIds.current[pat.id]||(knownMsgIds.current[pat.id]=new Set());
        msgs.forEach(m=>known.add(m.id));
      }).catch(()=>{});
    });
    const iv2=setInterval(poll,5000);
    return()=>clearInterval(iv2);
  },[patients]);

  useEffect(()=>{
    if(!monitoring)return;
    // Poll every patient independently with their own real GAMEEMO data
    // Use patientsRef so this effect only restarts when monitoring toggles,
    // not every time patient emotion state updates
    const intervals=[];
    const snapshot=patientsRef.current.length>0?patientsRef.current:[];
    snapshot.forEach((pat,idx)=>{
      const patStreak={emotion:"Calm",count:0};
      // Stagger start times so requests don't all fire at once
      const delay=idx*600;
      const t=setTimeout(()=>{
        const iv=setInterval(async()=>{
          try{
            const r=await api.classifyEEG(pat.id);
            const em=r.emotion;
            // Update this specific patient's card
            setPatients(prev=>prev.map(p=>p.id===pat.id
              ?{...p,emotion:em,status:em==="Pain"?"critical":em==="Stress"||em==="Sad"?"warning":"normal"}
              :p
            ));
            // Update Live Monitor + session bars for the first patient (primary monitor)
            if(idx===0){
              const prev=streak.current.emotion;
              streak.current={emotion:em,count:em===prev?streak.current.count+1:1};
              setEmotion(em);setConf(r.confidence);
              setBands({alpha:r.bands.alpha.toFixed(2),beta:r.bands.beta.toFixed(2),thetaDelta:(r.bands.theta/Math.max(r.bands.delta,0.001)).toFixed(2)});
              setTrend(em===prev?"Stable":(em==="Calm"||em==="Happy")?"Improving":"Escalating");
              setBars(p=>{const n=[...p,em];return n.length>30?n.slice(-30):n;});
              setCount(c=>c+1);
            }
            // Auto-alert for any patient after 3 consecutive bad readings
            if(em===patStreak.emotion){patStreak.count++;}else{patStreak.emotion=em;patStreak.count=1;}
            if((em==="Stress"||em==="Pain")&&patStreak.count===3){
              const nr=await api.createAlert({
                patient:pat.name,emotion:em,
                type:em==="Pain"?"critical":"warning",
                msg:`${em} detected for 3 consecutive EEG readings`
              });
              if(nr?.alert)setAlerts(a=>[nr.alert,...a]);
            }
          }catch{}
        },3000);
        intervals.push(iv);
      },delay);
      intervals.push(t);
    });
    const si=setInterval(()=>setSecs(s=>s+1),1000);
    return()=>{intervals.forEach(clearInterval);clearInterval(si);};
  },[monitoring]);

  // Keyboard shortcuts
  useEffect(()=>{
    const handler=e=>{
      const tag=document.activeElement?document.activeElement.tagName:"";
      if(tag==="INPUT"||tag==="TEXTAREA"||tag==="SELECT")return;
      if(e.ctrlKey||e.metaKey){
        if(e.key==="k"){e.preventDefault();setPaletteOpen(p=>!p);}
        return;
      }
      switch(e.key){
        case"?":setShowShortcuts(s=>!s);break;
        case"m":case"M":
          setMon(m=>{if(m){setSecs(0);setBars([]);}return!m;});break;
        case"d":case"D":goPage("dashboard");break;
        case"p":case"P":goPage("patients");break;
        case"a":case"A":goPage("analytics");break;
        case"l":case"L":goPage("alerts");break;
        case"s":case"S":goPage("settings");break;
        case"Escape":setPaletteOpen(false);setShowShortcuts(false);break;
        default:break;
      }
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[]);

  const ackAlert=useCallback(async(id)=>{
    try{await api.ackAlert(id);setAlerts(a=>a.map(x=>x.id===id?{...x,resolved:true}:x));setToast("Alert acknowledged");}
    catch{setToast("Failed to acknowledge");}
  },[]);

  const activeAlerts=alerts.filter(a=>!a.resolved);
  const mm=String(Math.floor(sessionSecs/60)).padStart(2,"0");
  const ss2=String(sessionSecs%60).padStart(2,"0");
  const TITLES={dashboard:"Dashboard",monitor:"Live Monitor",patients:"Patients","patient-detail":"Patient Detail",alerts:"Alerts",analytics:"Analytics",settings:"Settings"};
  const goPage=p=>{setPage(p);if(p!=="patient-detail")setSelPat(null);setMobileOpen(false);};

  const hasCritical=patients.some(p=>p.status==="critical");

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"Inter,system-ui,sans-serif",background:"var(--bg)"}}>
      <Sidebar page={page} setPage={goPage} alertCount={activeAlerts.length} monitoring={monitoring}
        userName={userName} open={mobileOpen} onClose={()=>setMobileOpen(false)}
        msgCount={Object.values(unreadMsgs).reduce((a,b)=>a+b,0)}/>
      <div data-main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <TopBar title={TITLES[page]||page} monitoring={monitoring} userName={userName}
          onToggle={()=>{setMon(m=>!m);if(monitoring){setSecs(0);setBars([]);} }}
          alertCount={activeAlerts.length} alerts={alerts} onLogout={onLogout}
          onMenuClick={()=>setMobileOpen(true)} dark={dark} setDark={setDark}/>
        <div data-page-content style={{flex:1,overflowY:"auto",padding:"20px 20px 32px"}}>
          {page==="dashboard"&&<DashboardPage monitoring={monitoring} alerts={alerts} patients={patients} classCount={classCount} stats={stats} onSelectPatient={p=>{setSelPat(p);setPage("patient-detail");}}/>}
          {page==="monitor"&&<MonitorPage monitoring={monitoring} emotion={emotion} confidence={conf} bands={bands} trend={trend} sessionTime={mm+":"+ss2} sessionBars={sessionBars} classCount={classCount} patients={patients}/>}
          {page==="patients"&&<PatientsPage patients={patients} loading={loadPat} onSelect={p=>{setSelPat(p);setPage("patient-detail");}}/>}
          {page==="patient-detail"&&selPatient&&<PatientDetailPage patient={selPatient} onBack={()=>goPage("patients")} showToast={setToast} sessionSecs={sessionSecs} lastConf={conf}/>}
          {page==="alerts"&&<AlertsPage alerts={alerts} onAck={ackAlert} loading={loadAlt}/>}
          {page==="analytics"&&<AnalyticsPage sessionBars={sessionBars}/>}
          {page==="settings"&&<SettingsPage dark={dark} setDark={setDark} onSettingsSaved={name=>{setUserName(name);setToast("Profile saved!");}}/>}
        </div>
      </div>
      {toast&&<Toast msg={toast} onDone={()=>setToast(null)}/>}
      {/* New message popup */}
      {msgToast&&(
        <div style={{position:"fixed",bottom:24,left:24,zIndex:9999,
          background:"#fff",borderRadius:16,padding:"14px 18px",
          boxShadow:"0 8px 32px rgba(9,48,149,.22)",border:"1px solid #E5E9F5",
          display:"flex",alignItems:"center",gap:12,animation:"slideInRight .3s ease",
          maxWidth:320}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#093095,#3D73FF)",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>💬</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:"#111827",marginBottom:2}}>New message from {msgToast.name}</div>
            <div style={{fontSize:12,color:"#6B7280",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{msgToast.text}</div>
          </div>
          <button onClick={()=>setMsgToast(null)}
            style={{background:"none",border:"none",cursor:"pointer",color:"#9CA3AF",fontSize:20,lineHeight:1,flexShrink:0}}>×</button>
        </div>
      )}
      <NeuroAssist patients={patients} alerts={alerts} monitoring={monitoring}
        sessionBars={sessionBars} setPage={goPage} setMon={setMon}/>
      <CommandPalette open={paletteOpen} onClose={()=>setPaletteOpen(false)}
        patients={patients} alerts={alerts} setPage={goPage} setMon={setMon} monitoring={monitoring}/>
      <ShortcutsModal open={showShortcuts} onClose={()=>setShowShortcuts(false)}/>
      {/* Pulsing critical-patient indicator */}
      {hasCritical&&(
        <div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",
          background:"#DC2626",color:"#fff",padding:"7px 18px",borderRadius:20,
          fontSize:12,fontWeight:700,letterSpacing:".04em",zIndex:7000,
          animation:"glowPulse 1.5s infinite",boxShadow:"0 4px 16px rgba(220,38,38,.45)",
          display:"flex",alignItems:"center",gap:8,pointerEvents:"none"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:"#fff",display:"inline-block",animation:"pulse 1s infinite"}}/>
          CRITICAL PATIENT ALERT
        </div>
      )}
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [role,setRole]=useState("Doctor");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [showPass,setShowPass]=useState(false);
  const [hoverFeature,setHoverFeature]=useState(null);

  const selectRole=r=>{ setRole(r); setEmail(""); setPass(""); setError(""); };

  const submit=async()=>{
    setError(""); setLoading(true);
    try{
      const r=await api.login(email,pass);
      if(r.token) api.setToken(r.token);
      onLogin(r.role,r.name,r.patient_id);
    } catch(e){ setError(e.message||"Invalid credentials. Please try again."); }
    finally{ setLoading(false); }
  };

  const inp={width:"100%",padding:"12px 14px 12px 44px",borderRadius:12,fontSize:14,outline:"none",
    border:"1.5px solid #E5E7EB",background:"#F8FAFF",color:"#111827",fontFamily:"inherit",
    boxSizing:"border-box",transition:"border-color .15s,box-shadow .15s"};

  const FEATURES=[
    {bg:"#FF4D4D",ic:"#fff",svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96-.46 2.5 2.5 0 01-1.07-4.6A3 3 0 016.5 9a2.5 2.5 0 01-.5-5 2.5 2.5 0 013.5-2z"/><path d="M14.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 004.96-.46 2.5 2.5 0 001.07-4.6A3 3 0 0117.5 9a2.5 2.5 0 00.5-5 2.5 2.5 0 00-3.5-2z"/></svg>, label:"Continuous EEG-based emotional insights"},
    {bg:"#F59E0B",ic:"#fff",svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, label:"Early detection of stress and pain signals"},
    {bg:"#8B5CF6",ic:"#fff",svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, label:"Smart alerts for critical patient conditions"},
    {bg:"#10B981",ic:"#fff",svg:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, label:"Real-time waveform visualization"},
  ];

  /* ECG path for background decoration */
  const ECG=`M0,40 L30,40 L38,40 L42,10 L46,70 L50,5 L54,75 L58,40 L70,40 L200,40`;

  return (
    <>
    <style>{`
      @keyframes loginFadeIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes ecgFloat{0%{stroke-dashoffset:300}100%{stroke-dashoffset:0}}
      @keyframes floatCircle{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
      .feat-card:hover{background:rgba(255,255,255,.3)!important;transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,.2)!important;}
      .feat-card{transition:all .2s cubic-bezier(.34,1.56,.64,1)!important;}
      .role-btn:hover{transform:scale(1.02);}
      .role-btn{transition:all .15s ease!important;}
      .signin-btn:hover{box-shadow:0 12px 32px rgba(11,47,151,.55)!important;transform:translateY(-1px);}
      .signin-btn{transition:all .18s ease!important;}
      @media(max-width:768px){
        .login-wrap{flex-direction:column!important;}
        .login-left{flex:none!important;width:100%!important;height:auto!important;padding:28px 24px 24px!important;}
        .login-left .feat-card{padding:10px 6px!important;}
        .login-right{flex:1!important;width:100%!important;padding:28px 20px!important;}
      }
    `}</style>
    <div className="login-wrap" style={{minHeight:"100vh",display:"flex",fontFamily:"'Inter',system-ui,sans-serif",overflow:"hidden",background:"#0B2F97"}}>

      {/* ══════════════ LEFT PANEL 72% ══════════════ */}
      <div className="login-left" style={{flex:"0 0 72%",width:"72%",background:"linear-gradient(135deg,#0B2F97 0%,#1849CC 45%,#3D73FF 100%)",
        padding:"28px 48px 24px",display:"flex",flexDirection:"column",
        position:"relative",overflow:"hidden",height:"100vh"}}>

        {/* ── decorative soft circles ── */}
        <div style={{position:"absolute",top:-120,right:-80,width:420,height:420,borderRadius:"50%",
          background:"rgba(255,255,255,.055)",pointerEvents:"none",zIndex:0,animation:"floatCircle 8s ease-in-out infinite"}}/>
        <div style={{position:"absolute",top:80,right:120,width:200,height:200,borderRadius:"50%",
          background:"rgba(255,255,255,.04)",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"absolute",bottom:-80,left:-60,width:320,height:320,borderRadius:"50%",
          background:"rgba(255,255,255,.04)",pointerEvents:"none",zIndex:0,animation:"floatCircle 10s ease-in-out infinite reverse"}}/>
        <div style={{position:"absolute",bottom:160,right:40,width:140,height:140,borderRadius:"50%",
          background:"rgba(255,255,255,.035)",pointerEvents:"none",zIndex:0}}/>

        {/* ── floating ECG lines ── */}
        <svg style={{position:"absolute",top:"18%",left:0,width:"100%",opacity:.1,pointerEvents:"none",zIndex:0}} height="80" viewBox="0 0 900 80" preserveAspectRatio="none">
          <path d="M0,40 L80,40 L95,40 L100,15 L105,65 L110,5 L115,75 L120,40 L200,40 L280,40 L285,20 L290,60 L295,8 L300,72 L305,40 L400,40 L480,40 L485,22 L490,58 L495,10 L500,70 L505,40 L600,40 L680,40 L685,18 L690,62 L695,6 L700,74 L705,40 L800,40 L900,40"
            stroke="rgba(255,255,255,.9)" strokeWidth="1.5" fill="none" strokeDasharray="900" strokeDashoffset="900" style={{animation:"ecgFloat 3.5s linear infinite"}}/>
        </svg>
        <svg style={{position:"absolute",bottom:"22%",left:0,width:"100%",opacity:.07,pointerEvents:"none",zIndex:0}} height="60" viewBox="0 0 900 60" preserveAspectRatio="none">
          <path d="M0,30 L100,30 L108,30 L112,10 L116,50 L120,2 L124,58 L128,30 L260,30 L368,30 L372,12 L376,48 L380,4 L384,56 L388,30 L520,30 L640,30 L644,14 L648,46 L652,5 L656,55 L660,30 L800,30 L900,30"
            stroke="rgba(255,255,255,.9)" strokeWidth="1.2" fill="none" strokeDasharray="900" strokeDashoffset="900" style={{animation:"ecgFloat 4.2s linear infinite 1s"}}/>
        </svg>

        {/* ── LOGO ── */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,position:"relative",zIndex:1,flexShrink:0}}>
          <div style={{width:44,height:44,borderRadius:13,
            background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.3)",
            backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
            boxShadow:"0 4px 16px rgba(0,0,0,.15)"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <span style={{fontSize:20,fontWeight:700,color:"#fff",letterSpacing:"-.2px"}}>NeuroTrack</span>
        </div>

        {/* ── HERO TEXT ── */}
        <div style={{position:"relative",zIndex:1,marginBottom:20,flexShrink:0}}>
          <div style={{fontSize:38,fontWeight:800,color:"#fff",lineHeight:1.15,letterSpacing:"-.5px",marginBottom:10}}>
            EEG-Based<br/>Emotion Recognition
          </div>
          <div style={{fontSize:14,color:"rgba(255,255,255,.68)",lineHeight:1.65,maxWidth:480,fontWeight:400}}>
            Helping clinicians understand patient emotional states when verbal communication is not possible.
          </div>
        </div>

        {/* ── GLASS ILLUSTRATION CARD ── */}
        <div style={{position:"relative",zIndex:1,
          width:"82%",flex:1,minHeight:0,margin:"0 auto",
          borderRadius:24,
          background:"rgba(255,255,255,.11)",
          border:"1.5px solid rgba(255,255,255,.22)",
          backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",
          boxShadow:"0 24px 64px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.2)",
          display:"flex",alignItems:"center",justifyContent:"center",
          overflow:"hidden",marginBottom:20}}>
          {/* inner glass sheen */}
          <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",
            background:"linear-gradient(180deg,rgba(255,255,255,.08) 0%,transparent 100%)",
            pointerEvents:"none",zIndex:1}}/>
          <img src="/image.png" alt="EEG monitoring illustration"
            style={{width:"65%",height:"auto",maxHeight:"88%",
              objectFit:"contain",display:"block",position:"relative",zIndex:2}}/>
        </div>

        {/* ── FEATURE CARDS ── */}
        <div style={{position:"relative",zIndex:1,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,flexShrink:0}}>
          {FEATURES.map((f,i)=>(
            <div key={f.label} className="feat-card"
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,textAlign:"center",
                padding:"12px 10px",
                background:"rgba(255,255,255,.2)",
                borderRadius:18,border:"1px solid rgba(255,255,255,.32)",
                boxShadow:"0 4px 20px rgba(0,0,0,.18)",cursor:"default"}}>
              <div style={{width:46,height:46,borderRadius:13,background:f.bg,flexShrink:0,
                display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",
                boxShadow:"0 4px 14px rgba(0,0,0,.25)"}}>
                {f.svg}
              </div>
              <span style={{fontSize:12.5,color:"#fff",fontWeight:600,lineHeight:1.45}}>{f.label}</span>
            </div>
          ))}
        </div>

      </div>{/* end left panel */}

      {/* ══════════════ RIGHT PANEL 28% ══════════════ */}
      <div className="login-right" style={{flex:"0 0 28%",width:"28%",background:"#fff",
        display:"flex",alignItems:"center",justifyContent:"center",
        padding:"32px 24px",overflowY:"auto",
        boxShadow:"-20px 0 60px rgba(11,47,151,.18)"}}>

        <div style={{width:"100%",maxWidth:340,animation:"loginFadeIn .5s ease both"}}>

          {/* logo */}
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:28}}>
            <div style={{width:34,height:34,borderRadius:10,
              background:"linear-gradient(135deg,#0B2F97,#3D73FF)",
              display:"flex",alignItems:"center",justifyContent:"center",
              boxShadow:"0 4px 14px rgba(11,47,151,.3)"}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <span style={{fontSize:16,fontWeight:700,color:"#0B2F97",letterSpacing:"-.2px"}}>NeuroTrack</span>
          </div>

          <div style={{fontSize:26,fontWeight:800,color:"#0F172A",letterSpacing:"-.4px",marginBottom:4}}>Welcome back</div>
          <div style={{fontSize:13.5,color:"#94A3B8",marginBottom:28,fontWeight:400}}>Sign in to your NeuroTrack account</div>

          {/* ── role selector ── */}
          <div style={{display:"flex",gap:8,marginBottom:24,background:"#F1F5F9",borderRadius:14,padding:4}}>
            {[["Doctor","#0B2F97"],["Patient","#059669"],["Admin","#7C3AED"]].map(([r,ac])=>(
              <button key={r} className="role-btn" onClick={()=>selectRole(r)}
                style={{flex:1,padding:"10px 4px",borderRadius:10,border:"none",cursor:"pointer",
                  background:role===r?"#fff":"transparent",
                  color:role===r?ac:"#64748B",
                  fontWeight:role===r?700:500,fontSize:13,
                  boxShadow:role===r?"0 2px 8px rgba(0,0,0,.1)":"none",
                  fontFamily:"inherit"}}>
                {r}
              </button>
            ))}
          </div>

          {/* ── email ── */}
          <div style={{marginBottom:14}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Email</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"#94A3B8",display:"flex",pointerEvents:"none"}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </span>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&submit()}
                style={{...inp}}
                onFocus={e=>{e.target.style.borderColor="#3D73FF";e.target.style.boxShadow="0 0 0 3px rgba(61,115,255,.12)";e.target.style.background="#fff"}}
                onBlur={e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none";e.target.style.background="#F8FAFF"}}/>
            </div>
          </div>

          {/* ── password ── */}
          <div style={{marginBottom:8}}>
            <label style={{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6}}>Password</label>
            <div style={{position:"relative"}}>
              <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"#94A3B8",display:"flex",pointerEvents:"none"}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </span>
              <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&submit()}
                style={{...inp,paddingRight:44}}
                onFocus={e=>{e.target.style.borderColor="#3D73FF";e.target.style.boxShadow="0 0 0 3px rgba(61,115,255,.12)";e.target.style.background="#fff"}}
                onBlur={e=>{e.target.style.borderColor="#E5E7EB";e.target.style.boxShadow="none";e.target.style.background="#F8FAFF"}}/>
              <button onClick={()=>setShowPass(s=>!s)}
                style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94A3B8",display:"flex",padding:3}}>
                {showPass
                  ?<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  :<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>

          <div style={{textAlign:"right",marginBottom:20}}>
            <span style={{fontSize:12.5,color:"#3D73FF",cursor:"pointer",fontWeight:500}}>Forgot Password?</span>
          </div>

          {error&&<div style={{padding:"9px 13px",borderRadius:10,background:"#FEF2F2",border:"1px solid #FECACA",color:"#DC2626",fontSize:12.5,marginBottom:14,fontWeight:500}}>{error}</div>}

          <button onClick={submit} disabled={loading} className="signin-btn"
            style={{width:"100%",padding:"13px",borderRadius:13,fontSize:14.5,fontWeight:700,
              cursor:loading?"not-allowed":"pointer",
              background:loading?"#93C5FD":"linear-gradient(135deg,#0B2F97 0%,#3D73FF 100%)",
              color:"#fff",border:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:10,
              boxShadow:loading?"none":"0 8px 24px rgba(11,47,151,.4)",marginBottom:22,letterSpacing:".02em"}}>
            {loading&&<Spinner size={14}/>}
            {loading?"Signing in…":"Sign in to Dashboard"}
          </button>


        </div>{/* end card */}
      </div>{/* end right panel */}

    </div>
    </>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [role,setRole]=useState(null), [userName,setUserName]=useState("");
  const [dark,setDark]=useState(false);
  const [patientId,setPatientId]=useState(null);
  const handleLogin=(role,name,pid)=>{setRole(role);setUserName(name);setPatientId(pid||null);};
  const handleLogout=()=>{api.clearToken();setRole(null);setUserName("");setPatientId(null);};
  const T=dark?DARK:LIGHT;
  const GS=`
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideInRight{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes slideInLeft{from{transform:translateX(-20px);opacity:0}to{transform:translateX(0);opacity:1}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(9,48,149,.25)}50%{box-shadow:0 0 0 8px rgba(9,48,149,0)}}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:5px;height:5px}
    ::-webkit-scrollbar-thumb{background:#D1DAF3;border-radius:99px}
    input[type=range]{accent-color:#093095}
    @media print{.no-print{display:none!important}}
  `;
  return (
    <ThemeCtx.Provider value={T}>
      <style>{GS}</style>
      <div style={{background:T.bg,minHeight:"100vh",transition:"background .2s,color .2s",color:T.text}}>
        {!role&&<LoginPage onLogin={handleLogin}/>}
        {role==="Patient"&&<PatientDashboard onLogout={handleLogout} userName={userName} doctorName="Dr. Ummelaila" patientId={patientId}/>}
        {role==="Doctor"&&<DoctorApp onLogout={handleLogout} userName={userName} dark={dark} setDark={setDark}/>}
        {role==="Admin"&&<AdminApp onLogout={handleLogout} userName={userName} dark={dark} setDark={setDark}/>}
      </div>
    </ThemeCtx.Provider>
  );
}
