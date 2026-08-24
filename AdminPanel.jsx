import React, { useEffect, useMemo, useState } from "react";
import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  BarChart3,
  Ban,
  CheckCircle2,
  Eye,
  Flag,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import "./admin.css";

const ADMIN_EMAILS = new Set(["limamahmd16@gmail.com"]);

function Brand() {
  return <div className="adm-brand"><span className="adm-mark"><i/><b/></span><strong>Mauri<span>One</span></strong></div>;
}

function Login() {
  const [email, setEmail] = useState("limamahmd16@gmail.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const emailLogin = async (e) => {
    e.preventDefault(); setBusy(true); setError(""); setNotice("");
    try { await signInWithEmailAndPassword(auth, email.trim(), password); }
    catch (err) { setError(`تعذّر تسجيل الدخول بالبريد${err?.code ? ` (${err.code})` : ""}.`); }
    finally { setBusy(false); }
  };

  const googleLogin = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(`تعذّر تسجيل الدخول عبر Google${err?.code ? ` (${err.code})` : ""}. افتح الرابط في Safari إذا كنت داخل متصفح مدمج.`);
    } finally { setBusy(false); }
  };

  const resetPassword = async () => {
    setBusy(true); setError(""); setNotice("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice("تم إرسال رسالة تعيين كلمة المرور إلى بريد الإدارة إن كان الحساب يدعم تسجيل الدخول بالبريد.");
    } catch (err) {
      setError(`تعذّر إرسال رابط كلمة المرور${err?.code ? ` (${err.code})` : ""}.`);
    } finally { setBusy(false); }
  };

  return <main className="adm-login" dir="rtl"><section className="adm-login-card">
    <Brand />
    <div className="adm-badge"><ShieldCheck size={16}/> لوحة الإدارة</div>
    <h1>لوحة تحكم MauriOne</h1>
    <p>هذه اللوحة مخصصة لإدارة الموقع بالكامل.</p>
    <form onSubmit={emailLogin}>
      <label>البريد الإلكتروني</label>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <label>كلمة المرور</label>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      {error && <div className="adm-error">{error}</div>}
      {notice && <div className="adm-notice">{notice}</div>}
      <button className="adm-primary" disabled={busy}>{busy ? "جارٍ التحقق..." : "تسجيل الدخول"}</button>
      <button type="button" className="adm-google" onClick={googleLogin} disabled={busy}>الدخول باستخدام Google</button>
      <button type="button" className="adm-link-button" onClick={resetPassword} disabled={busy}>تعيين / استعادة كلمة المرور</button>
    </form>
    <a href="/">العودة إلى MauriOne</a>
  </section></main>;
}

async function adminRequest(user, action, options = {}) {
  const token = await user.getIdToken(true);
  const res = await fetch(`/api/admin?action=${encodeURIComponent(action)}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `HTTP_${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function Stat({ icon: Icon, label, value }) {
  return <div><Icon/><span>{label}</span><strong>{value ?? "—"}</strong></div>;
}

export default function AdminPanel() {
  const [user, setUser] = useState(undefined);
  const [section, setSection] = useState("dashboard");
  const [summary, setSummary] = useState(null);
  const [ads, setAds] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [settings, setSettingsState] = useState({ siteName:"MauriOne", tagline:"كل ما تحتاجه بين يديك", maintenance:false, postingEnabled:true, defaultCurrency:"MRU", supportEmail:"limamahmd16@gmail.com", announcement:"" });
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  const isAdmin = !!user && ADMIN_EMAILS.has((user.email || "").toLowerCase());

  const loadAll = async () => {
    if (!user || !isAdmin) return;
    setLoading(true); setApiError("");
    try {
      const [s, a, u, r, st] = await Promise.all([
        adminRequest(user, "summary"),
        adminRequest(user, "ads"),
        adminRequest(user, "users"),
        adminRequest(user, "reports"),
        adminRequest(user, "settings"),
      ]);
      setSummary(s.summary || null);
      setAds(a.ads || []);
      setUsers(u.users || []);
      setReports(r.reports || []);
      setSettingsState(x => ({ ...x, ...(st.settings || {}) }));
    } catch (err) {
      if (err.message === "ADMIN_FIREBASE_NOT_CONFIGURED") setApiError("لوحة التحكم جاهزة، لكن خادم الإدارة لم يُربط بعد بمفتاح Firebase الإداري.");
      else if (err.message === "FORBIDDEN") setApiError("هذا الحساب لا يملك صلاحية الإدارة على الخادم.");
      else setApiError(`تعذّر تحميل لوحة الإدارة: ${err.message}`);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAdmin) loadAll(); }, [isAdmin]);

  const filteredAds = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return ads;
    return ads.filter(a => [a.title,a.city,a.area,a.seller,a.phone,a.id].some(v => String(v||"").toLowerCase().includes(s)));
  }, [ads, search]);

  const filteredUsers = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return users;
    return users.filter(u => [u.displayName,u.email,u.phoneNumber,u.uid].some(v => String(v||"").toLowerCase().includes(s)));
  }, [users, search]);

  const run = async (key, action, body, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(key); setApiError("");
    try { await adminRequest(user, action, { method:"POST", body }); await loadAll(); }
    catch (err) { setApiError(`تعذّر تنفيذ العملية: ${err.message}`); }
    finally { setBusy(""); }
  };

  const saveSettings = async () => {
    setBusy("settings"); setApiError("");
    try { await adminRequest(user, "saveSettings", { method:"POST", body:{ settings } }); await loadAll(); }
    catch (err) { setApiError(`تعذّر حفظ الإعدادات: ${err.message}`); }
    finally { setBusy(""); }
  };

  if (user === undefined) return <div className="adm-loading">جارٍ تحميل لوحة MauriOne…</div>;
  if (!user) return <Login/>;
  if (!isAdmin) return <main className="adm-login" dir="rtl"><section className="adm-login-card"><XCircle size={44}/><h1>هذا الحساب ليس مديرًا</h1><p>{user.email}</p><button className="adm-google" onClick={()=>signOut(auth)}>تسجيل الخروج</button></section></main>;

  const nav = [
    ["dashboard", LayoutDashboard, "نظرة عامة"],
    ["ads", BarChart3, "الإعلانات"],
    ["users", Users, "المستخدمون"],
    ["reports", Flag, "البلاغات"],
    ["settings", Settings, "إعدادات الموقع"],
  ];

  return <div className="adm-app" dir="rtl">
    <aside className="adm-side"><Brand/><nav>{nav.map(([id,Icon,label])=><button key={id} className={section===id?"active":""} onClick={()=>{setSection(id);setSearch("");}}><Icon size={17}/>{label}</button>)}</nav><div className="adm-user"><small>{user.email}</small><button onClick={()=>signOut(auth)}><LogOut size={16}/> خروج</button></div></aside>
    <main className="adm-main">
      <header><div><h1>{nav.find(n=>n[0]===section)?.[2]}</h1><p>إدارة منصة MauriOne</p></div><div className="adm-head-actions"><button onClick={loadAll} disabled={loading}><RefreshCw size={16}/>{loading?"تحديث...":"تحديث"}</button><a href="/" target="_blank" rel="noreferrer"><Eye size={17}/> فتح الموقع</a></div></header>
      <section className="adm-content">
        {apiError && <div className="adm-api-error"><ShieldCheck size={20}/><div><b>تنبيه الإدارة</b><span>{apiError}</span></div></div>}

        {section === "dashboard" && <>
          <div className="adm-hero"><div><span>التحكم الكامل</span><h2>إدارة MauriOne من مكان واحد</h2><p>الإعلانات، المستخدمون، البلاغات وإعدادات الموقع.</p></div><ShieldCheck size={52}/></div>
          <div className="adm-stats">
            <Stat icon={BarChart3} label="الإعلانات" value={summary?.ads}/>
            <Stat icon={Eye} label="المشاهدات" value={summary?.views?.toLocaleString?.()}/>
            <Stat icon={Users} label="المستخدمون" value={summary?.users}/>
            <Stat icon={Flag} label="البلاغات" value={summary?.reports}/>
          </div>
          <div className="adm-card"><div className="adm-card-head"><div><h3>حالة المنصة</h3><p>مؤشرات سريعة</p></div></div><div className="adm-status-grid"><div><b>{summary?.featured ?? "—"}</b><span>إعلانات مميزة</span></div><div><b>{summary?.hidden ?? "—"}</b><span>إعلانات مخفية</span></div><div><b>{settings.postingEnabled===false?"موقوف":"مفتوح"}</b><span>نشر الإعلانات</span></div><div><b>{settings.maintenance?"مفعّل":"غير مفعّل"}</b><span>وضع الصيانة</span></div></div></div>
        </>}

        {section === "ads" && <div className="adm-card">
          <div className="adm-card-head"><div><h3>إدارة جميع الإعلانات</h3><p>{filteredAds.length} إعلان</p></div><div className="adm-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="العنوان، الهاتف، المدينة أو المعرّف"/></div></div>
          <div className="adm-table-wrap"><table><thead><tr><th>الإعلان</th><th>المعلن</th><th>السعر</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{filteredAds.map(ad=><tr key={ad.id}><td><div className="adm-ad">{ad.images?.[0]?<img src={ad.images[0]} alt=""/>:<span/>}<div><b>{ad.title||"بدون عنوان"}</b><small>{ad.city||"—"} · {ad.id}</small></div></div></td><td>{ad.seller||"—"}</td><td>{ad.price||"—"} {ad.currency||""}</td><td>{ad.status||"published"}</td><td><div className="adm-actions"><button title="تمييز" disabled={busy===ad.id} className={ad.featured?"on":""} onClick={()=>run(ad.id,"updateAd",{id:ad.id,patch:{featured:!ad.featured}})}><Star size={16}/></button><button title={ad.status==="hidden"?"إعادة النشر":"إخفاء"} disabled={busy===ad.id} onClick={()=>run(ad.id,"updateAd",{id:ad.id,patch:{status:ad.status==="hidden"?"published":"hidden"}})}><Eye size={16}/></button><button title="حذف نهائي" disabled={busy===ad.id} className="danger" onClick={()=>run(ad.id,"deleteAd",{id:ad.id},`حذف الإعلان «${ad.title||ad.id}» نهائيًا؟`)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>
        </div>}

        {section === "users" && <div className="adm-card">
          <div className="adm-card-head"><div><h3>إدارة المستخدمين</h3><p>{filteredUsers.length} حساب</p></div><div className="adm-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="الاسم، البريد، الهاتف أو UID"/></div></div>
          <div className="adm-table-wrap"><table><thead><tr><th>المستخدم</th><th>الدخول</th><th>البريد</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>{filteredUsers.map(u=><tr key={u.uid}><td><div className="adm-user-cell">{u.photoURL?<img src={u.photoURL} alt=""/>:<span/>}<div><b>{u.displayName||"مستخدم"}</b><small>{u.uid}</small></div></div></td><td>{u.providers?.join(", ")||"—"}</td><td>{u.email||u.phoneNumber||"—"}</td><td>{u.disabled?<b className="adm-red">موقوف</b>:<b className="adm-green">نشط</b>}</td><td><div className="adm-actions"><button title={u.disabled?"تفعيل الحساب":"إيقاف الحساب"} disabled={busy===u.uid} onClick={()=>run(u.uid,"setUserDisabled",{uid:u.uid,disabled:!u.disabled},`${u.disabled?"تفعيل":"إيقاف"} حساب ${u.email||u.uid}؟`)}>{u.disabled?<UserCheck size={16}/>:<Ban size={16}/>}</button><button title="حذف الحساب نهائيًا" className="danger" disabled={busy===u.uid} onClick={()=>run(u.uid,"deleteUser",{uid:u.uid},`حذف حساب ${u.email||u.uid} وجميع إعلاناته نهائيًا؟`)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div>
        </div>}

        {section === "reports" && <div className="adm-card"><div className="adm-card-head"><div><h3>البلاغات</h3><p>{reports.length} بلاغ</p></div></div><div className="adm-report-list">{reports.length?reports.map(r=><div className="adm-report" key={r.id}><Flag size={18}/><div><b>{r.reason||"بلاغ"}</b><span>{r.adId?`إعلان: ${r.adId}`:""} {r.status?`· ${r.status}`:""}</span></div>{r.status!=="resolved"&&<button disabled={busy===r.id} onClick={()=>run(r.id,"resolveReport",{id:r.id})}><CheckCircle2 size={16}/> تم الحل</button>}</div>):<div className="adm-empty">لا توجد بلاغات.</div>}</div></div>}

        {section === "settings" && <div className="adm-card adm-settings"><div className="adm-card-head"><div><h3>إعدادات الموقع</h3><p>تحكم في التشغيل والبيانات العامة</p></div></div><div className="adm-form-grid"><label>اسم الموقع<input value={settings.siteName||""} onChange={e=>setSettingsState({...settings,siteName:e.target.value})}/></label><label>العبارة التعريفية<input value={settings.tagline||""} onChange={e=>setSettingsState({...settings,tagline:e.target.value})}/></label><label>البريد الداعم<input type="email" value={settings.supportEmail||""} onChange={e=>setSettingsState({...settings,supportEmail:e.target.value})}/></label><label>العملة الافتراضية<input value={settings.defaultCurrency||""} onChange={e=>setSettingsState({...settings,defaultCurrency:e.target.value})}/></label><label className="wide">إعلان عام<textarea value={settings.announcement||""} onChange={e=>setSettingsState({...settings,announcement:e.target.value})}/></label><label className="adm-toggle"><input type="checkbox" checked={settings.postingEnabled!==false} onChange={e=>setSettingsState({...settings,postingEnabled:e.target.checked})}/><span>السماح بنشر الإعلانات</span></label><label className="adm-toggle"><input type="checkbox" checked={!!settings.maintenance} onChange={e=>setSettingsState({...settings,maintenance:e.target.checked})}/><span>وضع الصيانة</span></label></div><button className="adm-primary adm-save" onClick={saveSettings} disabled={busy==="settings"}><Save size={17}/>{busy==="settings"?"جارٍ الحفظ...":"حفظ الإعدادات"}</button></div>}
      </section>
    </main>
  </div>;
}
