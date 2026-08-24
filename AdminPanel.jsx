import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase.js";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronLeft,
  Eye,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import "./admin.css";

const GOLD = "#c89b3c";

const CATEGORY_LABELS = {
  cars: "السيارات",
  jobs: "الوظائف",
  realestate: "العقارات",
  clinics: "العيادات",
  phones: "الهواتف",
  services: "الخدمات",
  more: "المزيد",
};

function formatDate(value) {
  if (!value) return "—";
  try {
    const d = value.toDate ? value.toDate() : new Date(value);
    return new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return "—";
  }
}

function money(ad) {
  return `${ad.price || "—"} ${ad.currency || ""}`.trim();
}

function Brand() {
  return (
    <div className="admin-brand">
      <div className="admin-brand-mark" aria-hidden="true">
        <span className="mark-dark" />
        <span className="mark-gold" />
      </div>
      <div className="admin-brand-word"><b>Mauri</b><span>One</span></div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError("تعذّر تسجيل الدخول. تحقق من البريد وكلمة المرور.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    setBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch {
      setError("تعذّر تسجيل الدخول باستخدام Google.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-login-shell" dir="rtl">
      <section className="admin-login-card">
        <Brand />
        <div className="admin-login-badge"><ShieldCheck size={16} /> لوحة الإدارة</div>
        <h1>الدخول إلى لوحة تحكم MauriOne</h1>
        <p>هذه المنطقة مخصصة لحسابات الإدارة المعتمدة فقط.</p>
        <form onSubmit={login} className="admin-login-form">
          <label>البريد الإلكتروني</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          <label>كلمة المرور</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          {error ? <div className="admin-error">{error}</div> : null}
          <button className="admin-primary" disabled={busy}>{busy ? "جارٍ التحقق..." : "تسجيل الدخول"}</button>
          <button type="button" className="admin-secondary" onClick={google} disabled={busy}>الدخول باستخدام Google</button>
        </form>
        <a className="admin-back-link" href="/">العودة إلى MauriOne</a>
      </section>
    </main>
  );
}

function AccessDenied({ user }) {
  return (
    <main className="admin-login-shell" dir="rtl">
      <section className="admin-login-card admin-denied">
        <XCircle size={44} />
        <h1>هذا الحساب ليس مديرًا</h1>
        <p>تم تسجيل الدخول باسم <b>{user?.email || "حساب Firebase"}</b>، لكن الحساب غير موجود في قائمة مديري MauriOne.</p>
        <div className="admin-setup-note">
          لتفعيل أول مدير: أنشئ مستندًا في Firestore باسم <code>admins/{user?.uid}</code> ثم أضف الحقل <code>active: true</code>.
        </div>
        <button className="admin-secondary" onClick={() => signOut(auth)}>تسجيل الخروج</button>
      </section>
    </main>
  );
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat-icon"><Icon size={20} /></div>
      <div><span>{label}</span><strong>{value}</strong>{sub ? <small>{sub}</small> : null}</div>
    </div>
  );
}

function StatusBadge({ ad }) {
  const status = ad.status || "published";
  if (status === "hidden" || status === "rejected") return <span className="status status-hidden">مخفي</span>;
  if (status === "pending") return <span className="status status-pending">قيد المراجعة</span>;
  return <span className="status status-live">منشور</span>;
}

export default function AdminPanel() {
  const [user, setUser] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(undefined);
  const [ads, setAds] = useState([]);
  const [reports, setReports] = useState([]);
  const [section, setSection] = useState("dashboard");
  const [queryText, setQueryText] = useState("");
  const [category, setCategory] = useState("all");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [busyId, setBusyId] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      if (user === null) setIsAdmin(false);
      return;
    }
    let live = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "admins", user.uid));
        if (live) setIsAdmin(snap.exists() && snap.data()?.active !== false);
      } catch {
        if (live) setIsAdmin(false);
      }
    })();
    return () => { live = false; };
  }, [user]);

  useEffect(() => {
    if (!user || !isAdmin) return undefined;
    const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setAds(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, console.error);
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user || !isAdmin) return undefined;
    return onSnapshot(collection(db, "reports"), (snap) => {
      setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => setReports([]));
  }, [user, isAdmin]);

  const advertisers = useMemo(() => {
    const map = new Map();
    ads.forEach((ad) => {
      const id = ad.ownerId || "unknown";
      if (!map.has(id)) map.set(id, { id, name: ad.seller || "معلن", ads: 0, views: 0, last: ad.createdAt });
      const x = map.get(id);
      x.ads += 1;
      x.views += Number(ad.views || 0);
    });
    return [...map.values()].sort((a, b) => b.ads - a.ads);
  }, [ads]);

  const filteredAds = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return ads.filter((ad) => {
      if (category !== "all" && ad.cat !== category) return false;
      if (!q) return true;
      return [ad.title, ad.city, ad.area, ad.seller, ad.phone].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [ads, queryText, category]);

  const totalViews = ads.reduce((s, a) => s + Number(a.views || 0), 0);
  const hiddenCount = ads.filter((a) => ["hidden", "rejected"].includes(a.status)).length;
  const featuredCount = ads.filter((a) => a.featured).length;

  const patchAd = async (ad, values) => {
    setBusyId(ad.id);
    try { await updateDoc(doc(db, "ads", ad.id), values); }
    finally { setBusyId(""); }
  };

  const removeAd = async (ad) => {
    if (!window.confirm(`حذف الإعلان «${ad.title || ad.id}» نهائيًا؟`)) return;
    setBusyId(ad.id);
    try { await deleteDoc(doc(db, "ads", ad.id)); }
    finally { setBusyId(""); }
  };

  if (user === undefined || (user && isAdmin === undefined)) return <div className="admin-loading">جارٍ تحميل لوحة MauriOne…</div>;
  if (!user) return <Login />;
  if (!isAdmin) return <AccessDenied user={user} />;

  const nav = [
    ["dashboard", LayoutDashboard, "نظرة عامة"],
    ["ads", BarChart3, "إدارة الإعلانات"],
    ["advertisers", Users, "المعلنون"],
    ["reports", Flag, "البلاغات"],
  ];

  return (
    <div className="admin-app" dir="rtl">
      <aside className={`admin-sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="admin-sidebar-head"><Brand /><button className="admin-mobile-close" onClick={() => setMobileMenu(false)}><ChevronLeft /></button></div>
        <nav>
          {nav.map(([id, Icon, label]) => (
            <button key={id} className={section === id ? "active" : ""} onClick={() => { setSection(id); setMobileMenu(false); }}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <div className="admin-user"><div className="admin-avatar"><UserRound size={18} /></div><div><b>{user.displayName || "مدير MauriOne"}</b><small>{user.email}</small></div></div>
          <button onClick={() => signOut(auth)}><LogOut size={17} /> تسجيل الخروج</button>
        </div>
      </aside>

      {mobileMenu ? <button className="admin-scrim" onClick={() => setMobileMenu(false)} /> : null}

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-button" onClick={() => setMobileMenu(true)}><Menu size={21} /></button>
          <div><h1>{nav.find((x) => x[0] === section)?.[2]}</h1><p>إدارة منصة MauriOne</p></div>
          <div className="admin-top-actions"><a href="/" target="_blank" rel="noreferrer"><Eye size={17} /> فتح الموقع</a><button><Bell size={18} /></button></div>
        </header>

        <main className="admin-content">
          {section === "dashboard" && (
            <>
              <section className="admin-hero">
                <div><span>لوحة التحكم</span><h2>مرحبًا بك في إدارة MauriOne</h2><p>راقب الإعلانات والمعلنين والنشاط من مكان واحد.</p></div>
                <ShieldCheck size={54} />
              </section>
              <section className="admin-stats-grid">
                <Stat icon={BarChart3} label="إجمالي الإعلانات" value={ads.length} sub={`${featuredCount} مميز`} />
                <Stat icon={Eye} label="إجمالي المشاهدات" value={totalViews.toLocaleString()} />
                <Stat icon={Users} label="المعلنون" value={advertisers.length} />
                <Stat icon={Flag} label="مخفي / مرفوض" value={hiddenCount} sub={`${reports.length} بلاغ`} />
              </section>
              <section className="admin-card">
                <div className="admin-card-title"><div><h3>أحدث الإعلانات</h3><p>آخر الإعلانات التي وصلت إلى المنصة</p></div><button onClick={() => setSection("ads")}>عرض الجميع</button></div>
                <AdsTable ads={ads.slice(0, 6)} busyId={busyId} onPatch={patchAd} onDelete={removeAd} />
              </section>
            </>
          )}

          {section === "ads" && (
            <section className="admin-card admin-card-full">
              <div className="admin-card-title"><div><h3>إدارة الإعلانات</h3><p>{filteredAds.length} إعلان ظاهر في النتائج</p></div></div>
              <div className="admin-filters">
                <div className="admin-search"><Search size={17} /><input value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="ابحث بالعنوان، المدينة، المعلن أو الهاتف" /></div>
                <select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">كل الأقسام</option>{Object.entries(CATEGORY_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
              </div>
              <AdsTable ads={filteredAds} busyId={busyId} onPatch={patchAd} onDelete={removeAd} />
            </section>
          )}

          {section === "advertisers" && (
            <section className="admin-card admin-card-full">
              <div className="admin-card-title"><div><h3>المعلنون</h3><p>مجمّعون من مالكي الإعلانات الحالية</p></div></div>
              <div className="admin-advertisers">
                {advertisers.map((x) => <div className="admin-advertiser" key={x.id}><div className="admin-avatar large"><UserRound /></div><div className="admin-advertiser-body"><b>{x.name}</b><small>معرّف: {x.id}</small></div><div><strong>{x.ads}</strong><small>إعلانات</small></div><div><strong>{x.views.toLocaleString()}</strong><small>مشاهدات</small></div></div>)}
                {!advertisers.length ? <div className="admin-empty">لا يوجد معلنون بعد.</div> : null}
              </div>
            </section>
          )}

          {section === "reports" && (
            <section className="admin-card admin-card-full">
              <div className="admin-card-title"><div><h3>البلاغات</h3><p>البلاغات المسجلة في مجموعة reports</p></div></div>
              {!reports.length ? <div className="admin-empty"><Flag size={30} /><b>لا توجد بلاغات مسجلة حاليًا</b><span>عندما نربط زر الإبلاغ بقاعدة البيانات ستظهر البلاغات هنا مباشرة.</span></div> : reports.map((r) => <div className="admin-report" key={r.id}><Flag size={18} /><div><b>{r.reason || "بلاغ"}</b><span>{r.adId ? `الإعلان: ${r.adId}` : ""}</span></div><small>{formatDate(r.createdAt)}</small></div>)}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function AdsTable({ ads, busyId, onPatch, onDelete }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>الإعلان</th><th>القسم</th><th>السعر</th><th>المعلن</th><th>المشاهدات</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
        <tbody>
          {ads.map((ad) => {
            const hidden = ["hidden", "rejected"].includes(ad.status);
            return <tr key={ad.id}>
              <td><div className="ad-cell">{ad.images?.[0] ? <img src={ad.images[0]} alt="" /> : <div className="ad-placeholder" />}<div><b>{ad.title || "إعلان بدون عنوان"}</b><small>{ad.city || "—"} · {formatDate(ad.createdAt)}</small></div></div></td>
              <td>{CATEGORY_LABELS[ad.cat] || ad.cat || "—"}</td>
              <td><b className="gold-text">{money(ad)}</b></td>
              <td>{ad.seller || "—"}</td>
              <td>{Number(ad.views || 0).toLocaleString()}</td>
              <td><StatusBadge ad={ad} /></td>
              <td><div className="admin-row-actions">
                <button title={ad.featured ? "إلغاء التمييز" : "تمييز الإعلان"} className={ad.featured ? "selected" : ""} disabled={busyId === ad.id} onClick={() => onPatch(ad, { featured: !ad.featured })}><Star size={16} /></button>
                <button title={hidden ? "إعادة النشر" : "إخفاء"} disabled={busyId === ad.id} onClick={() => onPatch(ad, { status: hidden ? "published" : "hidden" })}>{hidden ? <CheckCircle2 size={16} /> : <XCircle size={16} />}</button>
                <button title="حذف" className="danger" disabled={busyId === ad.id} onClick={() => onDelete(ad)}><Trash2 size={16} /></button>
              </div></td>
            </tr>;
          })}
          {!ads.length ? <tr><td colSpan="7"><div className="admin-empty">لا توجد إعلانات.</div></td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
