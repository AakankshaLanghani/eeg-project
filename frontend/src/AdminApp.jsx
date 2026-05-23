import { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import * as api from "./api";

// ─── THEME (mirrors App.jsx) ───────────────────────────────────────────────────
const LIGHT = { bg:"#F0F3FC", card:"#fff", cardBorder:"rgba(9,48,149,.07)", text:"#111827", textSec:"#4B5563", textMuted:"#9CA3AF", divider:"#E5E9F5", inputBg:"#F8F9FF", sidebar:"#fff", topbar:"#fff", hover:"#F8F9FF" };
const DARK  = { bg:"#080E1E", card:"#0F1829", cardBorder:"rgba(255,255,255,.08)", text:"#E8EDFB", textSec:"#8B97C4", textMuted:"#4C5A82", divider:"#1A2645", inputBg:"#0B1525", sidebar:"#0A1220", topbar:"#0B1525", hover:"#131F3A" };
const ThemeCtx = createContext({});
const useT = () => useContext(ThemeCtx);

// ─── ROLE COLORS ──────────────────────────────────────────────────────────────
const ROLE_STYLE = {
  Admin:   { bg:"#F5F3FF", tc:"#6D28D9", border:"#C4B5FD" },
  Doctor:  { bg:"#EFF6FF", tc:"#1D4ED8", border:"#93C5FD" },
  Patient: { bg:"#ECFDF5", tc:"#059669", border:"#6EE7B7" },
};
const STATUS_STYLE = {
  normal:   { bg:"#DCFCE7", tc:"#059669" },
  warning:  { bg:"#FEF3C7", tc:"#D97706" },
  critical: { bg:"#FEE2E2", tc:"#DC2626" },
};
const EMOTION_C = { Calm:"#10B981", Happy:"#22C55E", Sad:"#3B82F6", Stress:"#F59E0B", Pain:"#EF4444" };

// ─── ICONS ────────────────────────────────────────────────────────────────────
const I = {
  overview: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  users:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  patients: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  alerts:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  audit:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  logout:   <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  add:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  edit:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  close:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  search:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  check:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  shield:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  moon:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  sun:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  refresh:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>,
  eeg:      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  menu:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  warning:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

// ─── SHARED ATOMS ─────────────────────────────────────────────────────────────
const Spinner = ({ size=16, color="rgba(255,255,255,.4)", top="#fff" }) => (
  <div style={{ width:size, height:size, border:`2px solid ${color}`, borderRadius:"50%",
    borderTopColor:top, animation:"spin .75s linear infinite", flexShrink:0 }}/>
);

function Toast({ msg, type="success", onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, []);
  const colors = { success:["#ECFDF5","#86EFAC","#059669"], error:["#FEF2F2","#FCA5A5","#DC2626"] };
  const [bg, border, tc] = colors[type] || colors.success;
  return (
    <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999, background:bg,
      border:`1px solid ${border}`, padding:"12px 18px", borderRadius:12, fontSize:13,
      fontWeight:500, color:tc, boxShadow:"0 8px 24px rgba(0,0,0,.12)",
      display:"flex", alignItems:"center", gap:10, animation:"slideInRight .3s ease" }}>
      <span style={{width:20,height:20,borderRadius:"50%",background:tc,display:"flex",
        alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0,fontSize:11}}>
        {type==="success"?I.check:"!"}
      </span>
      {msg}
    </div>
  );
}

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

function Modal({ children, onClose, title, width=520 }) {
  const T = useT();
  useEffect(() => {
    const fn = e => e.key === "Escape" && onClose();
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
            color:T.textMuted, display:"flex", padding:4 }}>{I.close}</button>
        </div>
        <div style={{ padding:22 }}>{children}</div>
      </div>
    </div>
  );
}

function Avatar({ initials, color="#E0E7FF", tc="#4338CA", size=36 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:color, color:tc,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.36, fontWeight:700, flexShrink:0 }}>{initials}</div>
  );
}

function RoleBadge({ role }) {
  const s = ROLE_STYLE[role] || ROLE_STYLE.Patient;
  return <span style={{ background:s.bg, color:s.tc, border:`1px solid ${s.border}`,
    fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:99 }}>{role}</span>;
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.normal;
  return <span style={{ background:s.bg, color:s.tc, fontSize:10, fontWeight:600,
    padding:"3px 9px", borderRadius:99, textTransform:"capitalize" }}>{status}</span>;
}

function StatCard({ label, value, sub, color="#093095", icon, loading }) {
  const T = useT();
  return (
    <Card>
      <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between"}}>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:11, fontWeight:600, color:T.textMuted, textTransform:"uppercase",
            letterSpacing:".08em", marginBottom:10}}>{label}</div>
          {loading
            ? <div style={{height:30, width:60, borderRadius:6, background:T.divider, animation:"shimmer 1.5s infinite"}}/>
            : <div style={{fontSize:30, fontWeight:700, color:color, letterSpacing:"-.5px", lineHeight:1}}>{value}</div>
          }
          <div style={{fontSize:12, color:T.textMuted, marginTop:6}}>{sub}</div>
        </div>
        {icon && <div style={{width:42, height:42, borderRadius:12, background:color+"18",
          display:"flex", alignItems:"center", justifyContent:"center", color:color, flexShrink:0}}>{icon}</div>}
      </div>
    </Card>
  );
}

function FieldInput({ label, value, onChange, type="text", required=false, placeholder="" }) {
  const T = useT();
  return (
    <div style={{marginBottom:14}}>
      <label style={{fontSize:12, fontWeight:600, color:T.textSec, display:"block",
        marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>
        {label}{required && <span style={{color:"#EF4444", marginLeft:3}}>*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{width:"100%", padding:"10px 14px", border:`1px solid ${T.divider}`,
          borderRadius:10, background:T.inputBg, fontSize:13, outline:"none", color:T.text,
          transition:"border .15s", boxSizing:"border-box"}}
        onFocus={e => e.target.style.borderColor="#093095"}
        onBlur={e => e.target.style.borderColor=T.divider}/>
    </div>
  );
}

function FieldSelect({ label, value, onChange, options, required=false }) {
  const T = useT();
  return (
    <div style={{marginBottom:14}}>
      <label style={{fontSize:12, fontWeight:600, color:T.textSec, display:"block",
        marginBottom:6, textTransform:"uppercase", letterSpacing:".06em"}}>
        {label}{required && <span style={{color:"#EF4444", marginLeft:3}}>*</span>}
      </label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{width:"100%", padding:"10px 14px", border:`1px solid ${T.divider}`,
          borderRadius:10, background:T.inputBg, fontSize:13, outline:"none", color:T.text,
          boxSizing:"border-box", cursor:"pointer"}}
        onFocus={e => e.target.style.borderColor="#093095"}
        onBlur={e => e.target.style.borderColor=T.divider}>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );
}

// ─── ADMIN SIDEBAR ────────────────────────────────────────────────────────────
const ADMIN_NAV = [
  { id:"overview",  label:"Overview",         icon:"overview"  },
  { id:"users",     label:"User Management",  icon:"users"     },
  { id:"patients",  label:"Patients",         icon:"patients"  },
  { id:"alerts",    label:"Alert Rules",      icon:"alerts"    },
  { id:"audit",     label:"Audit Log",        icon:"audit"     },
  { id:"system",    label:"System Settings",  icon:"settings"  },
];

function AdminSidebar({ page, setPage, userName, onLogout }) {
  const T = useT();
  const initials = userName ? userName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "SA";
  return (
    <div style={{width:240, minWidth:240, height:"100vh", background:T.sidebar,
      borderRight:`1px solid ${T.divider}`, display:"flex", flexDirection:"column",
      flexShrink:0, zIndex:10, transition:"background .2s"}}>
      {/* Logo */}
      <div style={{padding:"22px 20px 18px", borderBottom:`1px solid ${T.divider}`}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <div style={{width:38, height:38, borderRadius:12,
            background:"linear-gradient(135deg,#6D28D9,#7C3AED)",
            display:"flex", alignItems:"center", justifyContent:"center", color:"#fff",
            boxShadow:"0 4px 12px rgba(109,40,217,.35)"}}>{I.shield}</div>
          <div>
            <div style={{fontSize:15, fontWeight:700, color:T.text, letterSpacing:"-.3px"}}>NeuroTrack</div>
            <div style={{fontSize:11, color:"#7C3AED", fontWeight:600}}>Admin Console</div>
          </div>
        </div>
      </div>
      {/* Nav */}
      <nav style={{flex:1, padding:"14px 12px", overflowY:"auto"}}>
        <div style={{fontSize:10, fontWeight:700, color:T.textMuted, padding:"6px 10px 8px",
          letterSpacing:".1em", textTransform:"uppercase"}}>Administration</div>
        {ADMIN_NAV.map(n => {
          const active = page === n.id;
          return (
            <div key={n.id} onClick={() => setPage(n.id)}
              style={{display:"flex", alignItems:"center", gap:11, padding:"10px 12px",
                borderRadius:10, cursor:"pointer", marginBottom:3, fontSize:13, fontWeight:500,
                background:active?"linear-gradient(135deg,#6D28D9,#7C3AED)":"transparent",
                color:active?"#fff":T.textSec,
                boxShadow:active?"0 4px 14px rgba(109,40,217,.28)":"none",
                transition:"all .18s"}}>
              <span style={{opacity:active?1:.65, flexShrink:0, display:"flex"}}>{I[n.icon]}</span>
              <span style={{flex:1}}>{n.label}</span>
            </div>
          );
        })}
      </nav>
      {/* User strip */}
      <div style={{padding:"14px 16px", borderTop:`1px solid ${T.divider}`}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <Avatar initials={initials} color="#EDE9FE" tc="#6D28D9" size={36}/>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13, fontWeight:600, color:T.text, whiteSpace:"nowrap",
              overflow:"hidden", textOverflow:"ellipsis"}}>{userName || "System Admin"}</div>
            <div style={{fontSize:11, color:"#7C3AED", fontWeight:500}}>Administrator</div>
          </div>
          <button onClick={onLogout} title="Sign out"
            style={{background:"none", border:"none", cursor:"pointer", color:T.textMuted,
              display:"flex", padding:4, borderRadius:6}}>{I.logout}</button>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN TOPBAR ─────────────────────────────────────────────────────────────
function AdminTopBar({ title, dark, setDark, userName }) {
  const T = useT();
  const hour = new Date().getHours();
  const greeting = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const firstName = userName ? (userName.split(" ").find(w=>!w.startsWith("System"))||"Admin") : "Admin";
  return (
    <div style={{padding:"0 24px", height:60, borderBottom:`1px solid ${T.divider}`,
      background:T.topbar, display:"flex", alignItems:"center",
      justifyContent:"space-between", flexShrink:0, transition:"background .2s"}}>
      <div>
        <div style={{fontSize:11, color:T.textMuted, fontWeight:500}}>{greeting}, {firstName}</div>
        <div style={{fontSize:15, fontWeight:700, color:T.text, letterSpacing:"-.2px"}}>{title}</div>
      </div>
      <div style={{display:"flex", alignItems:"center", gap:8}}>
        <div style={{padding:"5px 12px", borderRadius:20, background:"#F5F3FF",
          border:"1px solid #C4B5FD", fontSize:11, fontWeight:600, color:"#6D28D9",
          display:"flex", alignItems:"center", gap:6}}>
          {I.shield} <span>Admin Console</span>
        </div>
        <button onClick={() => setDark(d => !d)} title="Toggle dark mode"
          style={{width:38, height:38, borderRadius:10, border:`1px solid ${T.divider}`,
            background:T.inputBg, cursor:"pointer", display:"flex", alignItems:"center",
            justifyContent:"center", color:T.textSec}}>
          {dark ? I.sun : I.moon}
        </button>
      </div>
    </div>
  );
}

// ─── PAGE: OVERVIEW ───────────────────────────────────────────────────────────
function AdminOverviewPage() {
  const T = useT();
  const [stats, setStats] = useState(null);
  const [patients, setPatients] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, audit, al] = await Promise.all([
        api.getAdminStats(), api.getPatients(), api.getAdminAuditLog(), api.getAlerts()
      ]);
      setStats(s);
      setPatients(p.patients || []);
      setAuditLog(audit.log || []);
      setAlerts(al.alerts || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const ACTION_COLOR = {
    login: "#10B981", login_failed: "#EF4444",
    note_added: "#3B82F6", alert_acknowledged: "#F59E0B",
    settings_updated: "#8B5CF6", user_created: "#10B981",
    user_deleted: "#EF4444", patient_added: "#10B981",
    patient_deleted: "#EF4444", patient_updated: "#3B82F6",
    alert_rules_updated: "#F59E0B",
  };

  return (
    <div style={{animation:"fadeInUp .35s ease"}}>
      {/* Stat cards */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:14, marginBottom:24}}>
        <StatCard label="Total Users"    value={stats?.total_users??0}      sub={`${stats?.total_doctors??0} doctors`}         color="#6D28D9" icon={I.users}    loading={loading}/>
        <StatCard label="Total Patients" value={stats?.total_patients??0}   sub="Registered in system"                          color="#093095" icon={I.patients} loading={loading}/>
        <StatCard label="Active Alerts"  value={stats?.active_alerts??0}    sub={`${stats?.critical_alerts??0} critical`}       color={stats?.critical_alerts>0?"#DC2626":"#059669"} icon={I.alerts} loading={loading}/>
        <StatCard label="Audit Entries"  value={stats?.audit_entries??0}    sub="Total logged events"                           color="#8B5CF6" icon={I.audit}    loading={loading}/>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20}}>
        {/* Patient status table */}
        <Card>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
            <span style={{fontSize:14, fontWeight:700, color:T.text}}>All Patients</span>
            <span style={{fontSize:11, color:T.textMuted}}>{patients.length} total</span>
          </div>
          {patients.length === 0 && !loading && (
            <div style={{textAlign:"center", padding:"20px 0", color:T.textMuted, fontSize:13}}>No patients</div>
          )}
          {patients.slice(0, 8).map((p, i) => (
            <div key={p.id} style={{display:"flex", alignItems:"center", gap:10, padding:"9px 0",
              borderBottom:i<Math.min(patients.length,8)-1?`1px solid ${T.divider}`:"none"}}>
              <div style={{width:30, height:30, borderRadius:"50%", background:p.color||"#E0E7FF",
                color:p.tc||"#4338CA", display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:700, flexShrink:0}}>{p.initials}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:600, color:T.text}}>{p.name}</div>
                <div style={{fontSize:11, color:T.textMuted}}>{p.condition}</div>
              </div>
              <StatusBadge status={p.status}/>
            </div>
          ))}
        </Card>

        {/* Recent audit activity */}
        <Card>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
            <span style={{fontSize:14, fontWeight:700, color:T.text}}>Recent Activity</span>
            <button onClick={load}
              style={{display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#6D28D9",
                background:"#F5F3FF", border:"1px solid #C4B5FD", borderRadius:7,
                padding:"4px 10px", cursor:"pointer", fontWeight:600}}>
              {I.refresh} Refresh
            </button>
          </div>
          {auditLog.length === 0 && (
            <div style={{textAlign:"center", padding:"20px 0", color:T.textMuted, fontSize:13}}>
              No activity yet — start using the app to see events here.
            </div>
          )}
          {auditLog.slice(0, 8).map((entry, i) => (
            <div key={entry.id} style={{display:"flex", alignItems:"flex-start", gap:10, padding:"8px 0",
              borderBottom:i<Math.min(auditLog.length,8)-1?`1px solid ${T.divider}`:"none"}}>
              <div style={{width:8, height:8, borderRadius:"50%", marginTop:5, flexShrink:0,
                background:ACTION_COLOR[entry.action]||"#9CA3AF"}}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:"flex", alignItems:"center", gap:6}}>
                  <span style={{fontSize:12, fontWeight:600, color:T.text}}>{entry.actor}</span>
                  <span style={{fontSize:11, color:T.textMuted}}>{entry.action.replace(/_/g," ")}</span>
                </div>
                {entry.target && <div style={{fontSize:11, color:T.textMuted, marginTop:1}}>{entry.target}</div>}
              </div>
              <div style={{fontSize:10, color:T.textMuted, flexShrink:0, whiteSpace:"nowrap"}}>{entry.time?.slice(11,16)}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Active alerts strip */}
      {alerts.filter(a=>!a.resolved).length > 0 && (
        <Card style={{background:"linear-gradient(135deg,#FEF2F2,#fff)", border:"1.5px solid #FCA5A5"}}>
          <div style={{fontSize:14, fontWeight:700, color:"#DC2626", marginBottom:12}}>
            🚨 {alerts.filter(a=>!a.resolved).length} Active Alert{alerts.filter(a=>!a.resolved).length>1?"s":""}
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            {alerts.filter(a=>!a.resolved).slice(0,3).map(a => (
              <div key={a.id} style={{display:"flex", gap:10, alignItems:"center",
                padding:"8px 12px", borderRadius:10, background:"#FEF2F2", border:"1px solid #FCA5A5"}}>
                <div style={{fontSize:14}}>{a.type==="critical"?"🚨":"⚠️"}</div>
                <div style={{flex:1}}>
                  <span style={{fontSize:12, fontWeight:600, color:"#111827"}}>{a.patient}</span>
                  <span style={{fontSize:11, color:"#6B7280", marginLeft:8}}>{a.msg}</span>
                </div>
                <span style={{fontSize:10, color:"#9CA3AF"}}>{a.time}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── PAGE: USER MANAGEMENT ────────────────────────────────────────────────────
function AdminUsersPage() {
  const T = useT();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.getAdminUsers(); setUsers(r.users || []); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(q.toLowerCase()) ||
    u.email.toLowerCase().includes(q.toLowerCase()) ||
    u.role.toLowerCase().includes(q.toLowerCase())
  );

  const handleDelete = async (email) => {
    setSaving(true);
    try {
      await api.deleteAdminUser(email);
      setUsers(u => u.filter(x => x.email !== email));
      setToast({ msg:`User ${email} deleted`, type:"success" });
    } catch (e) { setToast({ msg:e.message||"Delete failed", type:"error" }); }
    setSaving(false); setConfirmDel(null);
  };

  return (
    <div style={{animation:"fadeInUp .35s ease"}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18}}>
        <div style={{position:"relative", flex:1, maxWidth:360}}>
          <div style={{position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
            color:T.textMuted, display:"flex", pointerEvents:"none"}}>{I.search}</div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name, email or role…"
            style={{width:"100%", padding:"10px 14px 10px 36px", border:`1px solid ${T.divider}`,
              borderRadius:10, background:T.card, fontSize:13, outline:"none", color:T.text}}
            onFocus={e=>e.target.style.borderColor="#6D28D9"}
            onBlur={e=>e.target.style.borderColor=T.divider}/>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{display:"flex", alignItems:"center", gap:7, padding:"10px 18px",
            borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
            background:"linear-gradient(135deg,#6D28D9,#7C3AED)", color:"#fff",
            boxShadow:"0 4px 14px rgba(109,40,217,.3)", marginLeft:12, whiteSpace:"nowrap"}}>
          {I.add} Add User
        </button>
      </div>

      <Card style={{padding:0, overflow:"hidden"}}>
        {/* Table header */}
        <div style={{display:"grid", gridTemplateColumns:"2fr 2fr 1fr 120px",
          padding:"12px 20px", borderBottom:`1px solid ${T.divider}`,
          background:T.inputBg, fontSize:11, fontWeight:700, color:T.textMuted,
          textTransform:"uppercase", letterSpacing:".07em"}}>
          <span>Name</span><span>Email</span><span>Role</span><span style={{textAlign:"right"}}>Actions</span>
        </div>
        {loading && (
          <div style={{display:"flex", justifyContent:"center", padding:40, color:T.textMuted, gap:12}}>
            <Spinner size={18} color={T.divider} top="#6D28D9"/> Loading users…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{textAlign:"center", padding:40, color:T.textMuted, fontSize:13}}>No users found</div>
        )}
        {filtered.map((u, i) => (
          <div key={u.email} style={{display:"grid", gridTemplateColumns:"2fr 2fr 1fr 120px",
            alignItems:"center", padding:"13px 20px",
            borderBottom:i<filtered.length-1?`1px solid ${T.divider}`:"none",
            transition:"background .12s"}}
            onMouseEnter={e => e.currentTarget.style.background=T.hover}
            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <Avatar initials={u.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                color={ROLE_STYLE[u.role]?.bg||"#E0E7FF"} tc={ROLE_STYLE[u.role]?.tc||"#4338CA"} size={34}/>
              <span style={{fontSize:13, fontWeight:600, color:T.text}}>{u.name}</span>
            </div>
            <span style={{fontSize:13, color:T.textSec}}>{u.email}</span>
            <RoleBadge role={u.role}/>
            <div style={{display:"flex", gap:6, justifyContent:"flex-end"}}>
              <button onClick={() => setEditUser(u)}
                style={{width:30, height:30, borderRadius:8, border:`1px solid ${T.divider}`,
                  background:T.inputBg, cursor:"pointer", display:"flex", alignItems:"center",
                  justifyContent:"center", color:"#3B82F6"}} title="Edit">{I.edit}</button>
              <button onClick={() => setConfirmDel(u.email)}
                style={{width:30, height:30, borderRadius:8, border:`1px solid ${T.divider}`,
                  background:T.inputBg, cursor:"pointer", display:"flex", alignItems:"center",
                  justifyContent:"center", color:"#EF4444"}} title="Delete">{I.trash}</button>
            </div>
          </div>
        ))}
        <div style={{padding:"12px 20px", borderTop:`1px solid ${T.divider}`,
          background:T.inputBg, fontSize:12, color:T.textMuted}}>
          {filtered.length} user{filtered.length!==1?"s":""} shown
        </div>
      </Card>

      {/* Add user modal */}
      {showAdd && <AddUserModal onClose={() => setShowAdd(false)}
        onSaved={(u) => { setUsers(prev => [...prev, u]); setToast({msg:`User ${u.email} created`,type:"success"}); setShowAdd(false); }}/>}

      {/* Edit user modal */}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)}
        onSaved={(updated) => {
          setUsers(prev => prev.map(x => x.email===editUser.email ? {...x,...updated} : x));
          setToast({msg:"User updated",type:"success"}); setEditUser(null);
        }}/>}

      {/* Confirm delete */}
      {confirmDel && (
        <Modal title="Confirm Delete" onClose={() => setConfirmDel(null)} width={400}>
          <p style={{fontSize:14, color:T.text, marginBottom:20, lineHeight:1.6}}>
            Are you sure you want to delete <strong>{confirmDel}</strong>? This action cannot be undone.
          </p>
          <div style={{display:"flex", gap:10}}>
            <button onClick={() => handleDelete(confirmDel)} disabled={saving}
              style={{padding:"10px 20px", borderRadius:10, border:"none",
                background:"#EF4444", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600,
                display:"flex", alignItems:"center", gap:8}}>
              {saving && <Spinner size={13}/>}{saving?"Deleting…":"Delete User"}
            </button>
            <button onClick={() => setConfirmDel(null)}
              style={{padding:"10px 20px", borderRadius:10, border:`1px solid ${T.divider}`,
                background:"transparent", cursor:"pointer", fontSize:13, color:T.textSec}}>Cancel</button>
          </div>
        </Modal>
      )}
      {toast && <Toast {...toast} onDone={() => setToast(null)}/>}
    </div>
  );
}

function AddUserModal({ onClose, onSaved }) {
  const T = useT();
  const [form, setForm] = useState({ name:"", email:"", password:"", role:"Doctor" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = k => v => setForm(f => ({...f,[k]:v}));

  const submit = async () => {
    if (!form.name||!form.email||!form.password) { setError("All fields are required."); return; }
    setSaving(true); setError("");
    try {
      await api.createAdminUser(form);
      onSaved({ name:form.name, email:form.email, role:form.role });
    } catch (e) { setError(e.message||"Failed to create user"); setSaving(false); }
  };
  return (
    <Modal title="Add New User" onClose={onClose} width={440}>
      <FieldInput label="Full Name" value={form.name} onChange={set("name")} required placeholder="Dr. John Smith"/>
      <FieldInput label="Email" value={form.email} onChange={set("email")} type="email" required placeholder="doctor@hospital.com"/>
      <FieldInput label="Password" value={form.password} onChange={set("password")} type="password" required placeholder="Min 6 characters"/>
      <FieldSelect label="Role" value={form.role} onChange={set("role")} required
        options={[{value:"Doctor",label:"Doctor"},{value:"Patient",label:"Patient"},{value:"Admin",label:"Admin"}]}/>
      {error && <div style={{padding:"10px 14px", borderRadius:10, background:"#FEF2F2",
        border:"1px solid #FCA5A5", color:"#DC2626", fontSize:13, marginBottom:14}}>{error}</div>}
      <div style={{display:"flex", gap:10, marginTop:4}}>
        <button onClick={submit} disabled={saving}
          style={{padding:"10px 22px", borderRadius:10, border:"none",
            background:saving?"#C3CCDF":"linear-gradient(135deg,#6D28D9,#7C3AED)",
            color:"#fff", cursor:saving?"not-allowed":"pointer", fontSize:13, fontWeight:600,
            display:"flex", alignItems:"center", gap:8, boxShadow:saving?"none":"0 4px 14px rgba(109,40,217,.3)"}}>
          {saving && <Spinner size={13}/>}{saving?"Creating…":"Create User"}
        </button>
        <button onClick={onClose} style={{padding:"10px 18px", borderRadius:10,
          border:`1px solid ${T.divider}`, background:"transparent", cursor:"pointer",
          fontSize:13, color:T.textSec}}>Cancel</button>
      </div>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onSaved }) {
  const T = useT();
  const [form, setForm] = useState({ name:user.name, role:user.role, password:"" });
  const [saving, setSaving] = useState(false);
  const set = k => v => setForm(f => ({...f,[k]:v}));

  const submit = async () => {
    setSaving(true);
    try {
      const payload = { name:form.name, role:form.role };
      if (form.password) payload.password = form.password;
      await api.updateAdminUser(user.email, payload);
      onSaved(payload);
    } catch (e) { alert(e.message||"Update failed"); setSaving(false); }
  };
  return (
    <Modal title={`Edit: ${user.email}`} onClose={onClose} width={440}>
      <FieldInput label="Full Name" value={form.name} onChange={set("name")} required/>
      <FieldSelect label="Role" value={form.role} onChange={set("role")} required
        options={[{value:"Doctor",label:"Doctor"},{value:"Patient",label:"Patient"},{value:"Admin",label:"Admin"}]}/>
      <FieldInput label="New Password (leave blank to keep current)" value={form.password} onChange={set("password")} type="password" placeholder="••••••••"/>
      <div style={{display:"flex", gap:10, marginTop:4}}>
        <button onClick={submit} disabled={saving}
          style={{padding:"10px 22px", borderRadius:10, border:"none",
            background:saving?"#C3CCDF":"linear-gradient(135deg,#6D28D9,#7C3AED)", color:"#fff",
            cursor:saving?"not-allowed":"pointer", fontSize:13, fontWeight:600,
            display:"flex", alignItems:"center", gap:8}}>
          {saving && <Spinner size={13}/>}{saving?"Saving…":"Save Changes"}
        </button>
        <button onClick={onClose} style={{padding:"10px 18px", borderRadius:10,
          border:`1px solid ${T.divider}`, background:"transparent", cursor:"pointer",
          fontSize:13, color:T.textSec}}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─── PAGE: PATIENT MANAGEMENT ─────────────────────────────────────────────────
function AdminPatientsPage() {
  const T = useT();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editPat, setEditPat] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.getPatients(); setPatients(r.patients||[]); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.condition.toLowerCase().includes(q.toLowerCase())
  );

  const handleDelete = async (id, name) => {
    setSaving(true);
    try {
      await api.deleteAdminPatient(id);
      setPatients(prev => prev.filter(p => p.id !== id));
      setToast({msg:`${name} removed`,type:"success"});
    } catch (e) { setToast({msg:e.message||"Delete failed",type:"error"}); }
    setSaving(false); setConfirmDel(null);
  };

  return (
    <div style={{animation:"fadeInUp .35s ease"}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18}}>
        <div style={{position:"relative", flex:1, maxWidth:360}}>
          <div style={{position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
            color:T.textMuted, display:"flex", pointerEvents:"none"}}>{I.search}</div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search patients…"
            style={{width:"100%", padding:"10px 14px 10px 36px", border:`1px solid ${T.divider}`,
              borderRadius:10, background:T.card, fontSize:13, outline:"none", color:T.text}}
            onFocus={e=>e.target.style.borderColor="#093095"}
            onBlur={e=>e.target.style.borderColor=T.divider}/>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{display:"flex", alignItems:"center", gap:7, padding:"10px 18px",
            borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600,
            background:"linear-gradient(135deg,#093095,#2E5BE8)", color:"#fff",
            boxShadow:"0 4px 14px rgba(9,48,149,.3)", marginLeft:12, whiteSpace:"nowrap"}}>
          {I.add} Add Patient
        </button>
      </div>

      <Card style={{padding:0, overflow:"hidden"}}>
        <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 2fr 1fr 1fr 100px",
          padding:"12px 20px", borderBottom:`1px solid ${T.divider}`, background:T.inputBg,
          fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:".07em"}}>
          <span>Patient</span><span>Age</span><span>Condition</span><span>Emotion</span><span>Status</span><span style={{textAlign:"right"}}>Actions</span>
        </div>
        {loading && (
          <div style={{display:"flex", justifyContent:"center", padding:40, color:T.textMuted, gap:12}}>
            <Spinner size={18} color={T.divider} top="#093095"/> Loading…
          </div>
        )}
        {!loading && filtered.length===0 && (
          <div style={{textAlign:"center", padding:40, color:T.textMuted, fontSize:13}}>No patients found</div>
        )}
        {filtered.map((p, i) => (
          <div key={p.id} style={{display:"grid", gridTemplateColumns:"2fr 1fr 2fr 1fr 1fr 100px",
            alignItems:"center", padding:"13px 20px",
            borderBottom:i<filtered.length-1?`1px solid ${T.divider}`:"none",
            transition:"background .12s"}}
            onMouseEnter={e=>e.currentTarget.style.background=T.hover}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <div style={{width:34, height:34, borderRadius:"50%", background:p.color||"#E0E7FF",
                color:p.tc||"#4338CA", display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:700, flexShrink:0}}>{p.initials}</div>
              <span style={{fontSize:13, fontWeight:600, color:T.text}}>{p.name}</span>
            </div>
            <span style={{fontSize:13, color:T.textSec}}>{p.age}</span>
            <span style={{fontSize:12, color:T.textSec}}>{p.condition}</span>
            <span style={{fontSize:12, fontWeight:600, color:EMOTION_C[p.emotion]||"#6B7280"}}>
              {p.emotion}
            </span>
            <StatusBadge status={p.status}/>
            <div style={{display:"flex", gap:6, justifyContent:"flex-end"}}>
              <button onClick={() => setEditPat(p)}
                style={{width:30, height:30, borderRadius:8, border:`1px solid ${T.divider}`,
                  background:T.inputBg, cursor:"pointer", display:"flex", alignItems:"center",
                  justifyContent:"center", color:"#3B82F6"}}>{I.edit}</button>
              <button onClick={() => setConfirmDel(p)}
                style={{width:30, height:30, borderRadius:8, border:`1px solid ${T.divider}`,
                  background:T.inputBg, cursor:"pointer", display:"flex", alignItems:"center",
                  justifyContent:"center", color:"#EF4444"}}>{I.trash}</button>
            </div>
          </div>
        ))}
        <div style={{padding:"12px 20px", borderTop:`1px solid ${T.divider}`, background:T.inputBg,
          fontSize:12, color:T.textMuted}}>
          {filtered.length} patient{filtered.length!==1?"s":""} shown
        </div>
      </Card>

      {showAdd && <AddPatientModal onClose={() => setShowAdd(false)}
        onSaved={(p) => { setPatients(prev=>[...prev,p]); setToast({msg:`${p.name} added`,type:"success"}); setShowAdd(false); }}/>}
      {editPat && <EditPatientModal patient={editPat} onClose={() => setEditPat(null)}
        onSaved={(updated) => {
          setPatients(prev => prev.map(x => x.id===editPat.id ? {...x,...updated} : x));
          setToast({msg:"Patient updated",type:"success"}); setEditPat(null);
        }}/>}
      {confirmDel && (
        <Modal title="Confirm Remove Patient" onClose={() => setConfirmDel(null)} width={400}>
          <p style={{fontSize:14, color:T.text, marginBottom:20, lineHeight:1.6}}>
            Remove <strong>{confirmDel.name}</strong> from the system? Their notes and history will be lost.
          </p>
          <div style={{display:"flex", gap:10}}>
            <button onClick={() => handleDelete(confirmDel.id, confirmDel.name)} disabled={saving}
              style={{padding:"10px 20px", borderRadius:10, border:"none",
                background:"#EF4444", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600,
                display:"flex", alignItems:"center", gap:8}}>
              {saving && <Spinner size={13}/>}{saving?"Removing…":"Remove Patient"}
            </button>
            <button onClick={() => setConfirmDel(null)}
              style={{padding:"10px 18px", borderRadius:10, border:`1px solid ${T.divider}`,
                background:"transparent", cursor:"pointer", fontSize:13, color:T.textSec}}>Cancel</button>
          </div>
        </Modal>
      )}
      {toast && <Toast {...toast} onDone={() => setToast(null)}/>}
    </div>
  );
}

function AddPatientModal({ onClose, onSaved }) {
  const T = useT();
  const [form, setForm] = useState({ name:"", age:"", condition:"", emotion:"Calm", status:"normal",
    color:"#EDE9FE", tc:"#6C3FF7" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = k => v => setForm(f => ({...f,[k]:v}));

  const submit = async () => {
    if (!form.name||!form.age||!form.condition) { setError("Name, age and condition are required."); return; }
    setSaving(true); setError("");
    try {
      const r = await api.addAdminPatient({...form, age:parseInt(form.age)||0});
      onSaved(r.patient);
    } catch (e) { setError(e.message||"Failed to add patient"); setSaving(false); }
  };
  return (
    <Modal title="Add New Patient" onClose={onClose} width={480}>
      <FieldInput label="Full Name" value={form.name} onChange={set("name")} required placeholder="Ahmed Raza"/>
      <FieldInput label="Age" value={form.age} onChange={set("age")} type="number" required placeholder="34"/>
      <FieldInput label="Condition / Diagnosis" value={form.condition} onChange={set("condition")} required placeholder="Epilepsy monitoring"/>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
        <FieldSelect label="Initial Emotion" value={form.emotion} onChange={set("emotion")}
          options={["Happy","Calm","Sad","Stress","Pain"]}/>
        <FieldSelect label="Status" value={form.status} onChange={set("status")}
          options={[{value:"normal",label:"Normal"},{value:"warning",label:"Warning"},{value:"critical",label:"Critical"}]}/>
      </div>
      {error && <div style={{padding:"10px 14px", borderRadius:10, background:"#FEF2F2",
        border:"1px solid #FCA5A5", color:"#DC2626", fontSize:13, marginBottom:14}}>{error}</div>}
      <div style={{display:"flex", gap:10, marginTop:4}}>
        <button onClick={submit} disabled={saving}
          style={{padding:"10px 22px", borderRadius:10, border:"none",
            background:saving?"#C3CCDF":"linear-gradient(135deg,#093095,#2E5BE8)", color:"#fff",
            cursor:saving?"not-allowed":"pointer", fontSize:13, fontWeight:600,
            display:"flex", alignItems:"center", gap:8, boxShadow:saving?"none":"0 4px 14px rgba(9,48,149,.3)"}}>
          {saving && <Spinner size={13}/>}{saving?"Adding…":"Add Patient"}
        </button>
        <button onClick={onClose} style={{padding:"10px 18px", borderRadius:10,
          border:`1px solid ${T.divider}`, background:"transparent", cursor:"pointer",
          fontSize:13, color:T.textSec}}>Cancel</button>
      </div>
    </Modal>
  );
}

function EditPatientModal({ patient, onClose, onSaved }) {
  const T = useT();
  const [form, setForm] = useState({
    name: patient.name, age: String(patient.age), condition: patient.condition,
    emotion: patient.emotion, status: patient.status,
  });
  const [saving, setSaving] = useState(false);
  const set = k => v => setForm(f => ({...f,[k]:v}));

  const submit = async () => {
    setSaving(true);
    try {
      await api.updateAdminPatient(patient.id, {...form, age:parseInt(form.age)||patient.age});
      onSaved({...form, age:parseInt(form.age)||patient.age});
    } catch (e) { alert(e.message||"Update failed"); setSaving(false); }
  };
  return (
    <Modal title={`Edit: ${patient.name}`} onClose={onClose} width={480}>
      <FieldInput label="Full Name" value={form.name} onChange={set("name")} required/>
      <FieldInput label="Age" value={form.age} onChange={set("age")} type="number" required/>
      <FieldInput label="Condition / Diagnosis" value={form.condition} onChange={set("condition")} required/>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
        <FieldSelect label="Emotion" value={form.emotion} onChange={set("emotion")}
          options={["Happy","Calm","Sad","Stress","Pain"]}/>
        <FieldSelect label="Status" value={form.status} onChange={set("status")}
          options={[{value:"normal",label:"Normal"},{value:"warning",label:"Warning"},{value:"critical",label:"Critical"}]}/>
      </div>
      <div style={{display:"flex", gap:10, marginTop:4}}>
        <button onClick={submit} disabled={saving}
          style={{padding:"10px 22px", borderRadius:10, border:"none",
            background:saving?"#C3CCDF":"linear-gradient(135deg,#093095,#2E5BE8)", color:"#fff",
            cursor:saving?"not-allowed":"pointer", fontSize:13, fontWeight:600,
            display:"flex", alignItems:"center", gap:8}}>
          {saving && <Spinner size={13}/>}{saving?"Saving…":"Save Changes"}
        </button>
        <button onClick={onClose} style={{padding:"10px 18px", borderRadius:10,
          border:`1px solid ${T.divider}`, background:"transparent", cursor:"pointer",
          fontSize:13, color:T.textSec}}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─── PAGE: ALERT RULES ────────────────────────────────────────────────────────
function AdminAlertsPage() {
  const T = useT();
  const [rules, setRules] = useState({ thresholds:{ Stress:3, Pain:2, Sad:5, Happy:10, Calm:10 }, auto_acknowledge:false });
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([api.getAdminAlertRules(), api.getAlerts()])
      .then(([r, a]) => { setRules(r); setAlerts(a.alerts||[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveRules = async () => {
    setSaving(true);
    try {
      await api.updateAdminAlertRules(rules);
      setToast({msg:"Alert rules saved",type:"success"});
    } catch (e) { setToast({msg:e.message||"Save failed",type:"error"}); }
    setSaving(false);
  };

  const EMOTION_LABELS = { Stress:"😰 Stress", Pain:"😣 Pain", Sad:"😔 Sad", Happy:"😊 Happy", Calm:"😌 Calm" };
  const EMOTION_COLORS = { Stress:"#F59E0B", Pain:"#EF4444", Sad:"#3B82F6", Happy:"#22C55E", Calm:"#10B981" };

  const filtered = filter==="resolved" ? alerts.filter(a=>a.resolved)
    : filter==="all" ? alerts.filter(a=>!a.resolved)
    : alerts.filter(a=>a.type===filter&&!a.resolved);

  const chips = [["all","All Active"],["critical","Critical"],["warning","Warning"],["resolved","Resolved"]];

  return (
    <div style={{animation:"fadeInUp .35s ease"}}>
      {/* Rules config */}
      <Card style={{marginBottom:20}}>
        <div style={{fontSize:14, fontWeight:700, color:T.text, marginBottom:4}}>Alert Threshold Rules</div>
        <div style={{fontSize:13, color:T.textSec, marginBottom:20, lineHeight:1.6}}>
          Set how many consecutive EEG readings of each emotion type trigger an alert.
          Lower = more sensitive, Higher = fewer false positives.
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:20, marginBottom:20}}>
          {Object.entries(rules.thresholds).map(([emotion, val]) => (
            <div key={emotion}>
              <label style={{fontSize:12, fontWeight:600, color:T.textSec, display:"block", marginBottom:8,
                textTransform:"uppercase", letterSpacing:".06em"}}>
                {EMOTION_LABELS[emotion] || emotion}
                <span style={{color:EMOTION_COLORS[emotion], marginLeft:8, fontWeight:700}}>
                  {val} reading{val!==1?"s":""}
                </span>
              </label>
              <input type="range" min={1} max={10} value={val}
                onChange={e => setRules(r => ({...r, thresholds:{...r.thresholds,[emotion]:+e.target.value}}))}
                style={{width:"100%", accentColor:EMOTION_COLORS[emotion]}}/>
              <div style={{display:"flex", justifyContent:"space-between", fontSize:11, color:T.textMuted, marginTop:3}}>
                <span>1 (Sensitive)</span><span>10 (Lenient)</span>
              </div>
            </div>
          ))}
        </div>
        <div onClick={() => setRules(r => ({...r,auto_acknowledge:!r.auto_acknowledge}))}
          style={{display:"flex", alignItems:"center", gap:12, marginBottom:20, cursor:"pointer"}}>
          <div style={{width:48, height:26, borderRadius:99, position:"relative", transition:"background .2s",
            background:rules.auto_acknowledge?"#6D28D9":T.divider, flexShrink:0}}>
            <div style={{width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute",
              top:3, left:rules.auto_acknowledge?24:3, transition:"left .2s", boxShadow:"0 2px 4px rgba(0,0,0,.2)"}}/>
          </div>
          <span style={{fontSize:13, color:T.text}}>Auto-acknowledge resolved alerts</span>
        </div>
        <button onClick={saveRules} disabled={saving}
          style={{padding:"10px 22px", borderRadius:10, border:"none",
            background:saving?"#C3CCDF":"linear-gradient(135deg,#6D28D9,#7C3AED)", color:"#fff",
            cursor:saving?"not-allowed":"pointer", fontSize:13, fontWeight:600,
            display:"flex", alignItems:"center", gap:8,
            boxShadow:saving?"none":"0 4px 14px rgba(109,40,217,.3)"}}>
          {saving && <Spinner size={13}/>}{saving?"Saving…":"Save Alert Rules"}
        </button>
      </Card>

      {/* Alert history */}
      <div style={{display:"flex", gap:8, marginBottom:16, flexWrap:"wrap"}}>
        {chips.map(([val, label]) => {
          const cnt = val==="all"?alerts.filter(a=>!a.resolved).length
            : val==="resolved"?alerts.filter(a=>a.resolved).length
            : alerts.filter(a=>a.type===val&&!a.resolved).length;
          return (
            <div key={val} onClick={() => setFilter(val)}
              style={{padding:"7px 16px", borderRadius:99, fontSize:12, fontWeight:600,
                cursor:"pointer", border:"1px solid",
                borderColor:filter===val?(val==="critical"?"#EF4444":val==="warning"?"#F59E0B":"#6D28D9"):T.divider,
                background:filter===val?(val==="critical"?"#EF4444":val==="warning"?"#F59E0B":"#6D28D9"):T.card,
                color:filter===val?"#fff":T.textSec, transition:"all .15s"}}>
              {label} {cnt>0&&<span style={{opacity:.75}}>({cnt})</span>}
            </div>
          );
        })}
      </div>

      {loading
        ? <div style={{display:"flex", justifyContent:"center", padding:40, color:T.textMuted, gap:12}}>
            <Spinner size={18} color={T.divider} top="#6D28D9"/> Loading alerts…
          </div>
        : filtered.length===0
          ? <Card><div style={{textAlign:"center", padding:"24px 0", color:T.textMuted, fontSize:13}}>
              ✓ No alerts in this category
            </div></Card>
          : <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {filtered.map((a) => (
                <div key={a.id} style={{padding:"14px 18px", borderRadius:14,
                  border:`1.5px solid ${a.resolved?"#86EFAC":a.type==="critical"?"#FCA5A5":"#FCD34D"}`,
                  background:a.resolved?"#ECFDF5":a.type==="critical"?"#FEF2F2":"#FFFBEB",
                  display:"flex", gap:13, alignItems:"flex-start"}}>
                  <div style={{width:36, height:36, borderRadius:10, flexShrink:0,
                    background:a.resolved?"#D1FAE5":a.type==="critical"?"#FEE2E2":"#FEF3C7",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:16}}>
                    {a.resolved?"✅":a.type==="critical"?"🚨":"⚠️"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:4}}>
                      <span style={{fontSize:13, fontWeight:700, color:"#111827"}}>{a.patient}</span>
                      <StatusBadge status={a.resolved?"normal":a.type}/>
                    </div>
                    <div style={{fontSize:12, color:"#6B7280"}}>{a.msg}</div>
                  </div>
                  <span style={{fontSize:11, color:"#9CA3AF", flexShrink:0}}>{a.time}</span>
                </div>
              ))}
            </div>
      }
      {toast && <Toast {...toast} onDone={() => setToast(null)}/>}
    </div>
  );
}

// ─── PAGE: AUDIT LOG ──────────────────────────────────────────────────────────
function AdminAuditPage() {
  const T = useT();
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [actorFilter, setActorFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try { const r = await api.getAdminAuditLog(); setLog(r.log||[]); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const actors = ["all", ...new Set(log.map(e => e.actor))];
  const actionTypes = ["all", ...new Set(log.map(e => e.action))];

  const filtered = log.filter(e => {
    const matchQ = !q || e.actor.includes(q) || e.action.includes(q) || e.target.includes(q);
    const matchActor = actorFilter==="all" || e.actor===actorFilter;
    const matchAction = actionFilter==="all" || e.action===actionFilter;
    return matchQ && matchActor && matchAction;
  });

  const ACTION_COLOR = {
    login:"#10B981", login_failed:"#EF4444", note_added:"#3B82F6",
    alert_acknowledged:"#F59E0B", settings_updated:"#8B5CF6",
    user_created:"#10B981", user_deleted:"#EF4444", user_updated:"#3B82F6",
    patient_added:"#10B981", patient_deleted:"#EF4444", patient_updated:"#3B82F6",
    alert_rules_updated:"#F59E0B",
  };

  return (
    <div style={{animation:"fadeInUp .35s ease"}}>
      <div style={{display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center"}}>
        <div style={{position:"relative", flex:1, minWidth:200}}>
          <div style={{position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
            color:T.textMuted, display:"flex", pointerEvents:"none"}}>{I.search}</div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search log…"
            style={{width:"100%", padding:"9px 14px 9px 36px", border:`1px solid ${T.divider}`,
              borderRadius:10, background:T.card, fontSize:13, outline:"none", color:T.text,
              boxSizing:"border-box"}}
            onFocus={e=>e.target.style.borderColor="#6D28D9"}
            onBlur={e=>e.target.style.borderColor=T.divider}/>
        </div>
        <select value={actorFilter} onChange={e=>setActorFilter(e.target.value)}
          style={{padding:"9px 14px", border:`1px solid ${T.divider}`, borderRadius:10,
            background:T.card, fontSize:13, outline:"none", color:T.text, cursor:"pointer"}}>
          {actors.map(a => <option key={a} value={a}>{a==="all"?"All Actors":a}</option>)}
        </select>
        <select value={actionFilter} onChange={e=>setActionFilter(e.target.value)}
          style={{padding:"9px 14px", border:`1px solid ${T.divider}`, borderRadius:10,
            background:T.card, fontSize:13, outline:"none", color:T.text, cursor:"pointer"}}>
          {actionTypes.map(a => <option key={a} value={a}>{a==="all"?"All Actions":a.replace(/_/g," ")}</option>)}
        </select>
        <button onClick={load}
          style={{display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
            borderRadius:10, border:`1px solid ${T.divider}`, background:T.card,
            cursor:"pointer", fontSize:12, fontWeight:600, color:"#6D28D9"}}>
          {I.refresh} Refresh
        </button>
      </div>

      <Card style={{padding:0, overflow:"hidden"}}>
        <div style={{display:"grid", gridTemplateColumns:"140px 130px 160px 1fr",
          padding:"12px 20px", borderBottom:`1px solid ${T.divider}`, background:T.inputBg,
          fontSize:11, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:".07em"}}>
          <span>Timestamp</span><span>Actor</span><span>Action</span><span>Target / Details</span>
        </div>
        {loading && (
          <div style={{display:"flex", justifyContent:"center", padding:40, color:T.textMuted, gap:12}}>
            <Spinner size={18} color={T.divider} top="#6D28D9"/> Loading audit log…
          </div>
        )}
        {!loading && filtered.length===0 && (
          <div style={{textAlign:"center", padding:48, color:T.textMuted, fontSize:13}}>
            {log.length===0
              ? "No audit entries yet. Log in as doctor or patient to start generating events."
              : "No entries match your filters."}
          </div>
        )}
        {filtered.map((entry, i) => (
          <div key={entry.id} style={{display:"grid", gridTemplateColumns:"140px 130px 160px 1fr",
            alignItems:"center", padding:"11px 20px",
            borderBottom:i<filtered.length-1?`1px solid ${T.divider}`:"none",
            transition:"background .12s"}}
            onMouseEnter={e=>e.currentTarget.style.background=T.hover}
            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            <span style={{fontSize:11, fontFamily:"monospace", color:T.textMuted}}>{entry.time}</span>
            <span style={{fontSize:12, fontWeight:600, color:T.text}}>{entry.actor}</span>
            <div style={{display:"flex", alignItems:"center", gap:6}}>
              <div style={{width:7, height:7, borderRadius:"50%", flexShrink:0,
                background:ACTION_COLOR[entry.action]||"#9CA3AF"}}/>
              <span style={{fontSize:12, color:T.textSec}}>{entry.action.replace(/_/g," ")}</span>
            </div>
            <span style={{fontSize:12, color:T.textMuted}}>{entry.target||"—"}</span>
          </div>
        ))}
        <div style={{padding:"12px 20px", borderTop:`1px solid ${T.divider}`, background:T.inputBg,
          fontSize:12, color:T.textMuted}}>
          {filtered.length} of {log.length} entries shown
        </div>
      </Card>
    </div>
  );
}

// ─── PAGE: SYSTEM SETTINGS ────────────────────────────────────────────────────
function AdminSystemPage() {
  const T = useT();
  const [settings, setSettings] = useState({
    doctor_name:"Dr. Ummelaila", specialty:"Neurologist",
    alert_threshold:3, auto_acknowledge:false, notifications:true,
    dark_mode:false, ai_insights_enabled:true, max_patients:50,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.getSettings().then(s => setSettings(prev => ({...prev,...s}))).catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try { await api.updateSettings(settings); setToast({msg:"System settings saved",type:"success"}); }
    catch (e) { setToast({msg:e.message||"Save failed",type:"error"}); }
    setSaving(false);
  };

  const Toggle = ({ label, desc, k }) => (
    <div onClick={() => setSettings(s => ({...s,[k]:!s[k]}))}
      style={{display:"flex", alignItems:"center", gap:14, padding:"14px 0",
        borderBottom:`1px solid ${T.divider}`, cursor:"pointer"}}>
      <div style={{flex:1}}>
        <div style={{fontSize:13, fontWeight:600, color:T.text}}>{label}</div>
        {desc && <div style={{fontSize:12, color:T.textMuted, marginTop:2}}>{desc}</div>}
      </div>
      <div style={{width:48, height:26, borderRadius:99, position:"relative", transition:"background .2s",
        background:settings[k]?"#6D28D9":T.divider, flexShrink:0}}>
        <div style={{width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute",
          top:3, left:settings[k]?24:3, transition:"left .2s", boxShadow:"0 2px 4px rgba(0,0,0,.2)"}}/>
      </div>
    </div>
  );

  return (
    <div style={{animation:"fadeInUp .35s ease", maxWidth:640}}>
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:14, fontWeight:700, color:T.text, marginBottom:16}}>Doctor Profile</div>
        <FieldInput label="Default Doctor Name" value={settings.doctor_name||""}
          onChange={v => setSettings(s=>({...s,doctor_name:v}))} placeholder="Dr. Ummelaila"/>
        <FieldInput label="Specialty" value={settings.specialty||""}
          onChange={v => setSettings(s=>({...s,specialty:v}))} placeholder="Neurologist"/>
      </Card>

      <Card style={{marginBottom:16}}>
        <div style={{fontSize:14, fontWeight:700, color:T.text, marginBottom:4}}>Alert Settings</div>
        <div style={{fontSize:13, color:T.textMuted, marginBottom:16}}>
          Global alert threshold: triggers alert after this many consecutive readings
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:12, fontWeight:600, color:T.textSec, display:"block", marginBottom:8,
            textTransform:"uppercase", letterSpacing:".06em"}}>
            Threshold: <span style={{color:"#6D28D9"}}>{settings.alert_threshold} readings</span>
          </label>
          <input type="range" min={1} max={10} value={settings.alert_threshold||3}
            onChange={e => setSettings(s=>({...s,alert_threshold:+e.target.value}))}
            style={{width:"100%", accentColor:"#6D28D9"}}/>
          <div style={{display:"flex", justifyContent:"space-between", fontSize:11, color:T.textMuted, marginTop:4}}>
            <span>1 (Sensitive)</span><span>10 (Lenient)</span>
          </div>
        </div>
        <Toggle k="auto_acknowledge" label="Auto-acknowledge resolved alerts"
          desc="Automatically marks alerts as resolved when EEG returns to normal"/>
        <Toggle k="notifications" label="Enable alert notifications"
          desc="Show popup notifications for new critical alerts"/>
      </Card>

      <Card style={{marginBottom:16}}>
        <div style={{fontSize:14, fontWeight:700, color:T.text, marginBottom:4}}>Feature Flags</div>
        <div style={{fontSize:13, color:T.textMuted, marginBottom:12}}>
          Toggle product features system-wide.
        </div>
        <Toggle k="ai_insights_enabled" label="AI Clinical Insights"
          desc="Enable the AI insight generator on patient detail pages"/>
      </Card>

      <button onClick={save} disabled={saving}
        style={{padding:"12px 28px", borderRadius:12, border:"none",
          background:saving?"#C3CCDF":"linear-gradient(135deg,#6D28D9,#7C3AED)", color:"#fff",
          cursor:saving?"not-allowed":"pointer", fontSize:14, fontWeight:700,
          display:"flex", alignItems:"center", gap:8,
          boxShadow:saving?"none":"0 6px 20px rgba(109,40,217,.35)"}}>
        {saving && <Spinner size={15}/>}{saving?"Saving…":"Save System Settings"}
      </button>

      {/* Danger Zone */}
      <div style={{marginTop:28, padding:20, borderRadius:14, border:"1.5px solid #FCA5A5",
        background:"#FEF2F2"}}>
        <div style={{fontSize:14, fontWeight:700, color:"#DC2626", marginBottom:4}}>⚠️ Danger Zone</div>
        <div style={{fontSize:13, color:"#6B7280", marginBottom:14}}>
          These actions are destructive and cannot be undone from the UI. They are shown here for completeness — connect a real database and auth layer before enabling them in production.
        </div>
        {[
          ["Clear All Alerts", "Removes all active and resolved alerts from memory"],
          ["Reset Patient Emotions", "Resets all patient emotion states to 'Calm'"],
        ].map(([label, desc]) => (
          <div key={label} style={{display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"10px 0", borderTop:"1px solid #FCA5A5"}}>
            <div>
              <div style={{fontSize:13, fontWeight:600, color:"#DC2626"}}>{label}</div>
              <div style={{fontSize:12, color:"#9CA3AF"}}>{desc}</div>
            </div>
            <button onClick={() => alert("Connect to the backend first to enable this action.")}
              style={{padding:"7px 16px", borderRadius:8, border:"1px solid #FCA5A5",
                background:"transparent", color:"#DC2626", fontSize:12, cursor:"pointer",
                fontWeight:600, flexShrink:0, marginLeft:12}}>
              {label}
            </button>
          </div>
        ))}
      </div>
      {toast && <Toast {...toast} onDone={() => setToast(null)}/>}
    </div>
  );
}

// ─── ADMIN APP ROOT ───────────────────────────────────────────────────────────
const PAGE_TITLES = {
  overview: "System Overview",
  users:    "User Management",
  patients: "Patient Management",
  alerts:   "Alert Rules & History",
  audit:    "Audit Log",
  system:   "System Settings",
};

export default function AdminApp({ onLogout, userName, dark, setDark }) {
  const [page, setPage] = useState("overview");
  const T = dark ? DARK : LIGHT;

  return (
    <ThemeCtx.Provider value={T}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInRight{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#D1DAF3;border-radius:99px}
      `}</style>
      <div style={{display:"flex", height:"100vh", fontFamily:"Inter,system-ui,sans-serif",
        background:T.bg, transition:"background .2s", color:T.text}}>
        <AdminSidebar page={page} setPage={setPage} userName={userName} onLogout={onLogout}/>
        <div style={{flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0}}>
          <AdminTopBar title={PAGE_TITLES[page]||page} dark={dark} setDark={setDark} userName={userName}/>
          <div style={{flex:1, overflowY:"auto", padding:"24px 24px 40px"}}>
            {page==="overview"  && <AdminOverviewPage/>}
            {page==="users"     && <AdminUsersPage/>}
            {page==="patients"  && <AdminPatientsPage/>}
            {page==="alerts"    && <AdminAlertsPage/>}
            {page==="audit"     && <AdminAuditPage/>}
            {page==="system"    && <AdminSystemPage/>}
          </div>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}
