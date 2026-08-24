import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase.js";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { BarChart3, Eye, LogOut, Search, ShieldCheck, Star, Trash2, Users, XCircle } from "lucide-react";
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

  const emailLogin = async (e) => {
    e.preventDefault(); setBusy(true); setError("");
    try { await signInWithEmailAndPassword(auth, email.trim(), password); }
    catch (err) { setError("هذا الحساب قد يكون مسجلاً عبر Google فقط. جرّب زر Google أدناه."); }
    finally { setBusy(false); }
  };

  const googleLogin = async () => {
    setBusy(true); setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error(err);
      setError("تعذّر بدء تسجيل الدخول عبر Google.");
      setBusy(false);
    }
  };

  return <main className="adm-login" dir="rtl"><section className="adm-login-card">
    <Brand />
    <div className="adm-badge"><ShieldCheck size={16}/> لوحة الإدارة</div>
    <h1>لوحة تحكم MauriOne</h1>
    <p>سجّل الدخول بحساب الإدارة المعتمد.</p>
    <form onSubmit={emailLogin}>
      <label>البريد الإلكتروني</label>
      <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <label>كلمة المرور</label>
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      {error && <div className="adm-error">{error}</div>}
      <button className="adm-primary" disabled={busy}>{busy ? "جارٍ التحقق..." : "تسجيل الدخول"}</button>
      <button type="button" className="adm-google" onClick={googleLogin} disabled={busy}>الدخول باستخدام Google</button>
    </form>
    <a href="/">العودة إلى MauriOne</a>
  </section></main>;
}

export default function AdminPanel() {
  const [user, setUser] = useState(undefined);
  const [ads, setAds] = useState([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);
  const isAdmin = !!user && ADMIN_EMAILS.has((user.email || "").toLowerCase());

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setAds(snap.docs.map(d => ({ id:d.id, ...d.data() }))), console.error);
  }, [isAdmin]);

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return ads;
    return ads.filter(a => [a.title,a.city,a.seller,a.phone].some(v => String(v||"").toLowerCase().includes(s)));
  }, [ads, search]);

  const advertisers = new Set(ads.map(a=>a.ownerId).filter(Boolean)).size;
  const views = ads.reduce((n,a)=>n+Number(a.views||0),0);

  const patch = async (ad, values) => { setBusy(ad.id); try { await updateDoc(doc(db,"ads",ad.id), values); } catch(e){ alert("تعذّر تنفيذ العملية. نحتاج تفعيل صلاحيات الإدارة في Firestore."); } finally { setBusy(""); } };
  const remove = async ad => { if(!confirm(`حذف الإعلان «${ad.title || ad.id}» نهائيًا؟`)) return; setBusy(ad.id); try { await deleteDoc(doc(db,"ads",ad.id)); } catch(e){ alert("تعذّر الحذف. نحتاج تفعيل صلاحيات الإدارة في Firestore."); } finally { setBusy(""); } };

  if (user === undefined) return <div className="adm-loading">جارٍ تحميل لوحة MauriOne…</div>;
  if (!user) return <Login/>;
  if (!isAdmin) return <main className="adm-login" dir="rtl"><section className="adm-login-card"><XCircle size={44}/><h1>هذا الحساب ليس مديرًا</h1><p>{user.email}</p><button className="adm-google" onClick={()=>signOut(auth)}>تسجيل الخروج</button></section></main>;

  return <div className="adm-app" dir="rtl">
    <aside className="adm-side"><Brand/><nav><b>نظرة عامة</b><span>إدارة الإعلانات</span><span>المعلنون</span></nav><div className="adm-user"><small>{user.email}</small><button onClick={()=>signOut(auth)}><LogOut size={16}/> خروج</button></div></aside>
    <main className="adm-main">
      <header><div><h1>لوحة التحكم</h1><p>إدارة منصة MauriOne</p></div><a href="/" target="_blank" rel="noreferrer"><Eye size={17}/> فتح الموقع</a></header>
      <section className="adm-content">
        <div className="adm-hero"><div><span>الإدارة</span><h2>مرحبًا بك في MauriOne</h2><p>راجع الإعلانات وأدر النشاط من مكان واحد.</p></div><ShieldCheck size={52}/></div>
        <div className="adm-stats">
          <div><BarChart3/><span>الإعلانات</span><strong>{ads.length}</strong></div>
          <div><Eye/><span>المشاهدات</span><strong>{views.toLocaleString()}</strong></div>
          <div><Users/><span>المعلنون</span><strong>{advertisers}</strong></div>
          <div><Star/><span>المميزة</span><strong>{ads.filter(a=>a.featured).length}</strong></div>
        </div>
        <div className="adm-card">
          <div className="adm-card-head"><div><h3>إدارة الإعلانات</h3><p>{visible.length} إعلان</p></div><div className="adm-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث في الإعلانات"/></div></div>
          <div className="adm-table-wrap"><table><thead><tr><th>الإعلان</th><th>المعلن</th><th>السعر</th><th>المشاهدات</th><th>الإجراءات</th></tr></thead><tbody>
            {visible.map(ad=><tr key={ad.id}><td><div className="adm-ad">{ad.images?.[0]?<img src={ad.images[0]} alt=""/>:<span/>}<div><b>{ad.title||"بدون عنوان"}</b><small>{ad.city||"—"}</small></div></div></td><td>{ad.seller||"—"}</td><td>{ad.price||"—"} {ad.currency||""}</td><td>{Number(ad.views||0).toLocaleString()}</td><td><div className="adm-actions"><button disabled={busy===ad.id} className={ad.featured?"on":""} onClick={()=>patch(ad,{featured:!ad.featured})}><Star size={16}/></button><button disabled={busy===ad.id} onClick={()=>patch(ad,{status:ad.status==="hidden"?"published":"hidden"})}><Eye size={16}/></button><button disabled={busy===ad.id} className="danger" onClick={()=>remove(ad)}><Trash2 size={16}/></button></div></td></tr>)}
          </tbody></table></div>
        </div>
      </section>
    </main>
  </div>;
}
