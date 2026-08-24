import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
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
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import "./admin.css";

const CATEGORY_LABELS = {
  jobs: "الوظائف",
  cars: "السيارات",
  realestate: "العقارات",
  clinics: "العيادات",
  phones: "الهواتف",
  services: "الخدمات المنزلية",
  more: "المزيد",
};

const STATUS_LABELS = {
  active: "نشط",
  pending: "قيد المراجعة",
  hidden: "مخفي",
};

function normalizeAdmins(value) {
  return String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

async function hasAdminAccess(user) {
  if (!user) return false;

  const configuredUids = normalizeAdmins(import.meta.env.VITE_MAURIONE_ADMIN_UIDS);
  if (configuredUids.includes(user.uid)) return true;

  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    return snap.exists() && snap.data()?.active !== false;
  } catch (error) {
    console.error("Admin access check failed", error);
    return false;
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat("ar").format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "—";
  }
}

function StatusBadge({ status }) {
  const normalized = status || "active";
  return <span className={`admin-status admin-status-${normalized}`}>{STATUS_LABELS[normalized] || normalized}</span>;
}

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <article className="admin-metric-card">
      <div className="admin-metric-icon"><Icon size={20} /></div>
      <div>
        <div className="admin-metric-value">{value}</div>
        <div className="admin-metric-label">{label}</div>
        {note ? <div className="admin-metric-note">{note}</div> : null}
      </div>
    </article>
  );
}

function LoginPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      console.error(err);
      setError("تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-auth-shell" dir="rtl">
      <section className="admin-auth-card">
        <div className="admin-brand-mark" aria-hidden="true">
          <span className="admin-brand-shape admin-brand-shape-dark" />
          <span className="admin-brand-shape admin-brand-shape-gold" />
        </div>
        <div className="admin-wordmark"><strong>Mauri</strong><span>One</span></div>
        <p className="admin-auth-kicker">لوحة التحكم</p>
        <h1>تسجيل دخول الإدارة</h1>
        <p>هذه المنطقة مخصصة لإدارة منصة MauriOne فقط.</p>
        <form onSubmit={submit} className="admin-auth-form">
          <label>
            البريد الإلكتروني
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label>
            كلمة المرور
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </label>
          {error ? <div className="admin-error">{error}</div> : null}
          <button type="submit" disabled={loading}>{loading ? "جارٍ الدخول..." : "دخول لوحة التحكم"}</button>
        </form>
        <a className="admin-back-link" href="/">العودة إلى MauriOne</a>
      </section>
    </main>
  );
}

function UnauthorizedPanel({ user }) {
  return (
    <main className="admin-auth-shell" dir="rtl">
      <section className="admin-auth-card">
        <div className="admin-lock"><ShieldCheck size={32} /></div>
        <h1>الحساب غير مخوّل للإدارة</h1>
        <p>تم تسجيل الدخول بحساب <b>{user?.email || user?.uid}</b>، لكنه لا يملك صلاحية Admin.</p>
        <div className="admin-auth-actions">
          <button onClick={() => signOut(auth)}>تسجيل الخروج</button>
          <a href="/">العودة للموقع</a>
        </div>
      </section>
    </main>
  );
}

export default function AdminDashboard() {
  const [user, setUser] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [ads, setAds] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [busyId, setBusyId] = useState("");

  useEffect(() => onAuthStateChanged(auth, async (nextUser) => {
    setUser(nextUser || null);
    setChecking(true);
    setIsAdmin(nextUser ? await hasAdminAccess(nextUser) : false);
    setChecking(false);
  }), []);

  useEffect(() => {
    if (!isAdmin) return undefined;
    setLoadError("");
    const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setAds(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, (error) => {
      console.error(error);
      setLoadError("تعذر تحميل الإعلانات. تحقق من صلاحيات Firestore.");
    });
  }, [isAdmin]);

  const metrics = useMemo(() => {
    const totalViews = ads.reduce((sum, ad) => sum + Number(ad.views || 0), 0);
    const ownerIds = new Set(ads.map((ad) => ad.ownerId).filter(Boolean));
    return {
      total: ads.length,
      active: ads.filter((ad) => (ad.status || "active") === "active").length,
      pending: ads.filter((ad) => ad.status === "pending").length,
      hidden: ads.filter((ad) => ad.status === "hidden").length,
      featured: ads.filter((ad) => Boolean(ad.featured)).length,
      views: totalViews,
      advertisers: ownerIds.size,
    };
  }, [ads]);

  const visibleAds = useMemo(() => {
    const needle = searchText.trim().toLowerCase();
    return ads.filter((ad) => {
      const adStatus = ad.status || "active";
      if (category !== "all" && ad.cat !== category) return false;
      if (status !== "all" && adStatus !== status) return false;
      if (!needle) return true;
      return [ad.title, ad.city, ad.area, ad.seller, ad.ownerId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [ads, category, searchText, status]);

  const advertisers = useMemo(() => {
    const map = new Map();
    ads.forEach((ad) => {
      if (!ad.ownerId) return;
      const current = map.get(ad.ownerId) || {
        ownerId: ad.ownerId,
        seller: ad.seller || "معلن",
        ads: 0,
        views: 0,
        lastCreatedAt: null,
      };
      current.ads += 1;
      current.views += Number(ad.views || 0);
      if (!current.lastCreatedAt || (ad.createdAt?.seconds || 0) > (current.lastCreatedAt?.seconds || 0)) {
        current.lastCreatedAt = ad.createdAt;
      }
      if (ad.seller) current.seller = ad.seller;
      map.set(ad.ownerId, current);
    });
    return [...map.values()].sort((a, b) => b.ads - a.ads);
  }, [ads]);

  const runAction = async (adId, action) => {
    setBusyId(adId);
    try {
      await action();
    } catch (error) {
      console.error(error);
      window.alert("لم تنجح العملية. تحقق من صلاحيات الإدارة في Firestore.");
    } finally {
      setBusyId("");
    }
  };

  const setAdStatus = (ad, nextStatus) => runAction(ad.id, () => updateDoc(doc(db, "ads", ad.id), { status: nextStatus }));
  const toggleFeatured = (ad) => runAction(ad.id, () => updateDoc(doc(db, "ads", ad.id), { featured: !ad.featured }));
  const removeAd = (ad) => {
    if (!window.confirm(`حذف الإعلان «${ad.title || ad.id}» نهائيًا؟`)) return;
    runAction(ad.id, () => deleteDoc(doc(db, "ads", ad.id)));
  };

  if (checking || user === undefined) {
    return <main className="admin-loading" dir="rtl">جارٍ التحقق من صلاحيات الإدارة...</main>;
  }
  if (!user) return <LoginPanel />;
  if (!isAdmin) return <UnauthorizedPanel user={user} />;

  return (
    <div className="admin-shell" dir="rtl">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark admin-brand-mark-small" aria-hidden="true">
            <span className="admin-brand-shape admin-brand-shape-dark" />
            <span className="admin-brand-shape admin-brand-shape-gold" />
          </div>
          <div>
            <div className="admin-wordmark admin-wordmark-small"><strong>Mauri</strong><span>One</span></div>
            <small>Admin</small>
          </div>
        </div>

        <nav className="admin-nav">
          <button className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
            <LayoutDashboard size={19} /> نظرة عامة
          </button>
          <button className={activeTab === "ads" ? "active" : ""} onClick={() => setActiveTab("ads")}>
            <FileText size={19} /> الإعلانات
          </button>
          <button className={activeTab === "advertisers" ? "active" : ""} onClick={() => setActiveTab("advertisers")}>
            <Users size={19} /> المعلنون
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <a href="/">فتح الموقع</a>
          <button onClick={() => signOut(auth)}><LogOut size={18} /> تسجيل الخروج</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p>لوحة تحكم MauriOne</p>
            <h1>{activeTab === "overview" ? "نظرة عامة" : activeTab === "ads" ? "إدارة الإعلانات" : "المعلنون"}</h1>
          </div>
          <div className="admin-user-chip">
            <span>{user.email}</span>
            <ShieldCheck size={18} />
          </div>
        </header>

        {loadError ? <div className="admin-banner-error">{loadError}</div> : null}

        {activeTab === "overview" ? (
          <>
            <section className="admin-metrics">
              <MetricCard icon={FileText} label="إجمالي الإعلانات" value={formatNumber(metrics.total)} />
              <MetricCard icon={CheckCircle2} label="الإعلانات النشطة" value={formatNumber(metrics.active)} />
              <MetricCard icon={Eye} label="إجمالي المشاهدات" value={formatNumber(metrics.views)} />
              <MetricCard icon={Users} label="المعلنون" value={formatNumber(metrics.advertisers)} note="حسب أصحاب الإعلانات الحاليين" />
              <MetricCard icon={Star} label="الإعلانات المميزة" value={formatNumber(metrics.featured)} />
              <MetricCard icon={EyeOff} label="المخفية / المراجعة" value={formatNumber(metrics.hidden + metrics.pending)} />
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>أحدث الإعلانات</h2>
                  <p>آخر الإعلانات الموجودة حاليًا في Firestore.</p>
                </div>
                <button className="admin-text-button" onClick={() => setActiveTab("ads")}>عرض الكل</button>
              </div>
              <AdsTable ads={ads.slice(0, 8)} busyId={busyId} onStatus={setAdStatus} onFeatured={toggleFeatured} onDelete={removeAd} />
            </section>
          </>
        ) : null}

        {activeTab === "ads" ? (
          <section className="admin-panel">
            <div className="admin-panel-heading admin-panel-heading-stack">
              <div>
                <h2>إدارة الإعلانات</h2>
                <p>ابحث، راجع، أخفِ، فعّل أو احذف أي إعلان.</p>
              </div>
              <div className="admin-filters">
                <label className="admin-search">
                  <Search size={18} />
                  <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="ابحث بعنوان، مدينة أو معلن..." />
                </label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="all">كل الأقسام</option>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط</option>
                  <option value="pending">قيد المراجعة</option>
                  <option value="hidden">مخفي</option>
                </select>
              </div>
            </div>
            <div className="admin-results-count">{formatNumber(visibleAds.length)} إعلان</div>
            <AdsTable ads={visibleAds} busyId={busyId} onStatus={setAdStatus} onFeatured={toggleFeatured} onDelete={removeAd} />
          </section>
        ) : null}

        {activeTab === "advertisers" ? (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>المعلنون</h2>
                <p>قائمة مبنية من أصحاب الإعلانات الحالية. إدارة حسابات Firebase Auth الكاملة ستأتي في المرحلة التالية عبر Backend آمن.</p>
              </div>
            </div>
            <div className="admin-advertiser-grid">
              {advertisers.map((item) => (
                <article className="admin-advertiser-card" key={item.ownerId}>
                  <div className="admin-avatar">{(item.seller || "م").trim().charAt(0)}</div>
                  <div className="admin-advertiser-info">
                    <h3>{item.seller}</h3>
                    <code>{item.ownerId}</code>
                    <div><span>{formatNumber(item.ads)} إعلانات</span><span>{formatNumber(item.views)} مشاهدة</span></div>
                    <small>آخر نشاط: {formatDate(item.lastCreatedAt)}</small>
                  </div>
                </article>
              ))}
              {!advertisers.length ? <div className="admin-empty">لا يوجد معلنون حتى الآن.</div> : null}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function AdsTable({ ads, busyId, onStatus, onFeatured, onDelete }) {
  if (!ads.length) return <div className="admin-empty">لا توجد إعلانات مطابقة.</div>;

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>الإعلان</th>
            <th>القسم</th>
            <th>السعر</th>
            <th>المدينة</th>
            <th>الحالة</th>
            <th>المشاهدات</th>
            <th>التاريخ</th>
            <th>إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {ads.map((ad) => {
            const disabled = busyId === ad.id;
            return (
              <tr key={ad.id}>
                <td>
                  <div className="admin-ad-cell">
                    {ad.images?.[0] ? <img src={ad.images[0]} alt="" loading="lazy" /> : <div className="admin-ad-placeholder" />}
                    <div>
                      <strong>{ad.title || "بدون عنوان"}</strong>
                      <small>{ad.seller || ad.ownerId || "—"}</small>
                    </div>
                  </div>
                </td>
                <td>{CATEGORY_LABELS[ad.cat] || ad.cat || "—"}</td>
                <td><b>{ad.price || "—"}</b> <small>{ad.currency || ""}</small></td>
                <td>{ad.city || "—"}</td>
                <td><StatusBadge status={ad.status} /></td>
                <td>{formatNumber(ad.views)}</td>
                <td>{formatDate(ad.createdAt)}</td>
                <td>
                  <div className="admin-actions">
                    <button disabled={disabled} title={ad.featured ? "إلغاء التمييز" : "تمييز الإعلان"} className={ad.featured ? "is-featured" : ""} onClick={() => onFeatured(ad)}><Star size={16} /></button>
                    {(ad.status || "active") !== "active" ? <button disabled={disabled} title="تفعيل" onClick={() => onStatus(ad, "active")}><CheckCircle2 size={16} /></button> : null}
                    {ad.status !== "hidden" ? <button disabled={disabled} title="إخفاء" onClick={() => onStatus(ad, "hidden")}><EyeOff size={16} /></button> : null}
                    <button disabled={disabled} className="danger" title="حذف" onClick={() => onDelete(ad)}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
