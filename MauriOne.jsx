import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  Car,
  Search,
  MapPin,
  Gauge,
  CalendarDays,
  Fuel,
  Settings2,
  MessageCircle,
  ChevronLeft,
  X,
  Plus,
  LogIn,
  LogOut,
  Pencil,
  Trash2,
  ShieldCheck,
  Star,
  CheckCircle2,
} from "lucide-react";
import { auth, db } from "./firebase.js";

const BRAND = "#0f8a5f";
const CURRENCY = "MRU";

const demoCars = [
  {
    id: "demo-1",
    title: "Toyota Corolla 2020",
    brand: "Toyota",
    model: "Corolla",
    year: 2020,
    price: 420000,
    mileage: 85000,
    fuel: "بنزين",
    transmission: "أوتوماتيك",
    city: "نواكشوط",
    color: "أبيض",
    featured: true,
    reference: "MO-0125",
    description: "سيارة نظيفة، جاهزة للمعاينة. هذا إعلان تجريبي لتوضيح شكل الموقع.",
    images: ["https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1400&q=85"],
    demo: true,
  },
  {
    id: "demo-2",
    title: "Toyota RAV4 2018",
    brand: "Toyota",
    model: "RAV4",
    year: 2018,
    price: 590000,
    mileage: 102000,
    fuel: "بنزين",
    transmission: "أوتوماتيك",
    city: "نواكشوط",
    color: "رمادي",
    featured: false,
    reference: "MO-0126",
    description: "إعلان تجريبي. سيتم استبداله بسيارات حقيقية من لوحة الإدارة.",
    images: ["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=85"],
    demo: true,
  },
  {
    id: "demo-3",
    title: "Toyota Hilux 2019",
    brand: "Toyota",
    model: "Hilux",
    year: 2019,
    price: 980000,
    mileage: 118000,
    fuel: "ديزل",
    transmission: "عادي",
    city: "نواكشوط",
    color: "أبيض",
    featured: false,
    reference: "MO-0127",
    description: "إعلان تجريبي لعرض تصميم بطاقة السيارة.",
    images: ["https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1400&q=85"],
    demo: true,
  },
];

const emptyForm = {
  title: "",
  brand: "",
  model: "",
  year: "",
  price: "",
  mileage: "",
  fuel: "بنزين",
  transmission: "أوتوماتيك",
  city: "نواكشوط",
  color: "",
  reference: "",
  description: "",
  imageUrls: "",
  featured: false,
};

const number = (value) =>
  new Intl.NumberFormat("fr-MR", { maximumFractionDigits: 0 }).format(Number(value || 0));

function IconInfo({ icon: Icon, children }) {
  return (
    <span className="info-chip">
      <Icon size={16} strokeWidth={1.9} />
      {children}
    </span>
  );
}

function App() {
  const [cars, setCars] = useState([]);
  const [dbReady, setDbReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [adminMode, setAdminMode] = useState(() => window.location.hash === "#admin");
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const handleHash = () => setAdminMode(window.location.hash === "#admin");
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    const q = query(collection(db, "cars"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCars(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setDbReady(true);
      },
      () => setDbReady(true)
    );
    return unsub;
  }, []);

  const visibleCars = dbReady && cars.length ? cars : demoCars;

  const brands = useMemo(
    () => [...new Set(visibleCars.map((c) => c.brand).filter(Boolean))].sort(),
    [visibleCars]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return visibleCars.filter((c) => {
      const hay = `${c.title || ""} ${c.brand || ""} ${c.model || ""} ${c.reference || ""}`.toLowerCase();
      return (
        (!term || hay.includes(term)) &&
        (!brand || c.brand === brand) &&
        (!maxPrice || Number(c.price || 0) <= Number(maxPrice))
      );
    });
  }, [visibleCars, search, brand, maxPrice]);

  const contactWhatsApp = (car) => {
    const text = encodeURIComponent(
      `السلام عليكم، أريد الاستفسار عن ${car.title || "هذه السيارة"} - المرجع: ${car.reference || car.id}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, login.email.trim(), login.password);
    } catch {
      setLoginError("بيانات الدخول غير صحيحة.");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const editCar = (car) => {
    if (car.demo) {
      setNotice("هذا إعلان تجريبي وليس محفوظًا في قاعدة البيانات.");
      return;
    }
    setEditingId(car.id);
    setForm({
      title: car.title || "",
      brand: car.brand || "",
      model: car.model || "",
      year: car.year || "",
      price: car.price || "",
      mileage: car.mileage || "",
      fuel: car.fuel || "بنزين",
      transmission: car.transmission || "أوتوماتيك",
      city: car.city || "نواكشوط",
      color: car.color || "",
      reference: car.reference || "",
      description: car.description || "",
      imageUrls: Array.isArray(car.images) ? car.images.join("\n") : "",
      featured: Boolean(car.featured),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveCar = async (e) => {
    e.preventDefault();
    setSaving(true);
    setNotice("");
    const payload = {
      title: form.title.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      price: Number(form.price),
      mileage: Number(form.mileage || 0),
      fuel: form.fuel,
      transmission: form.transmission,
      city: form.city.trim(),
      color: form.color.trim(),
      reference: form.reference.trim(),
      description: form.description.trim(),
      featured: Boolean(form.featured),
      images: form.imageUrls
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
      updatedAt: serverTimestamp(),
    };
    try {
      if (editingId) {
        await updateDoc(doc(db, "cars", editingId), payload);
        setNotice("تم تحديث الإعلان.");
      } else {
        await addDoc(collection(db, "cars"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setNotice("تم نشر السيارة على الموقع.");
      }
      resetForm();
    } catch {
      setNotice("تعذر الحفظ. تحقق من صلاحيات Firebase.");
    } finally {
      setSaving(false);
    }
  };

  const removeCar = async (car) => {
    if (car.demo) return;
    if (!window.confirm(`حذف إعلان ${car.title}؟`)) return;
    try {
      await deleteDoc(doc(db, "cars", car.id));
      setNotice("تم حذف الإعلان.");
    } catch {
      setNotice("تعذر حذف الإعلان.");
    }
  };

  if (adminMode) {
    return (
      <div className="app" dir="rtl">
        <GlobalStyles />
        <header className="topbar">
          <a className="brand" href="#">
            <Brand />
          </a>
          <a className="secondary-btn" href="#">
            <ChevronLeft size={18} /> عرض الموقع
          </a>
        </header>

        <main className="admin-shell">
          {!user ? (
            <section className="login-card">
              <div className="admin-icon"><ShieldCheck size={28} /></div>
              <h1>دخول إدارة MauriOne</h1>
              <p>هذه الصفحة خاصة بإدارة إعلانات السيارات.</p>
              <form onSubmit={submitLogin} className="stack">
                <label>البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={login.email}
                  onChange={(e) => setLogin({ ...login, email: e.target.value })}
                  placeholder="admin@example.com"
                />
                <label>كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={login.password}
                  onChange={(e) => setLogin({ ...login, password: e.target.value })}
                />
                {loginError && <div className="error">{loginError}</div>}
                <button className="primary-btn wide" type="submit">
                  <LogIn size={18} /> دخول
                </button>
              </form>
            </section>
          ) : (
            <>
              <section className="admin-head">
                <div>
                  <span className="eyebrow">لوحة الإدارة</span>
                  <h1>{editingId ? "تعديل السيارة" : "نشر سيارة جديدة"}</h1>
                  <p>أنت فقط من يستطيع إضافة الإعلانات من هذه الصفحة.</p>
                </div>
                <button className="secondary-btn" onClick={() => signOut(auth)}>
                  <LogOut size={17} /> تسجيل الخروج
                </button>
              </section>

              {notice && <div className="notice">{notice}</div>}

              <form className="admin-form" onSubmit={saveCar}>
                <div className="form-grid">
                  <Field label="عنوان الإعلان">
                    <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Toyota Corolla 2020" />
                  </Field>
                  <Field label="المرجع">
                    <input required value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="MO-0128" />
                  </Field>
                  <Field label="الماركة">
                    <input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Toyota" />
                  </Field>
                  <Field label="الموديل">
                    <input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Corolla" />
                  </Field>
                  <Field label="السنة">
                    <input required inputMode="numeric" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2020" />
                  </Field>
                  <Field label={`السعر (${CURRENCY})`}>
                    <input required inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="420000" />
                  </Field>
                  <Field label="الكيلومترات">
                    <input inputMode="numeric" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} placeholder="85000" />
                  </Field>
                  <Field label="المدينة">
                    <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </Field>
                  <Field label="الوقود">
                    <select value={form.fuel} onChange={(e) => setForm({ ...form, fuel: e.target.value })}>
                      <option>بنزين</option><option>ديزل</option><option>هجين</option><option>كهرباء</option>
                    </select>
                  </Field>
                  <Field label="ناقل الحركة">
                    <select value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })}>
                      <option>أوتوماتيك</option><option>عادي</option>
                    </select>
                  </Field>
                  <Field label="اللون">
                    <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="أبيض" />
                  </Field>
                  <Field label="الإعلان المميز">
                    <label className="check">
                      <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
                      تثبيت كسيارة مميزة
                    </label>
                  </Field>
                </div>

                <Field label="روابط الصور — رابط في كل سطر">
                  <textarea rows="5" value={form.imageUrls} onChange={(e) => setForm({ ...form, imageUrls: e.target.value })} placeholder="https://..." />
                </Field>
                <Field label="وصف السيارة">
                  <textarea rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="الحالة، التجهيزات، الملاحظات..." />
                </Field>

                <div className="actions-row">
                  <button className="primary-btn" disabled={saving}>
                    {editingId ? <Pencil size={18} /> : <Plus size={18} />}
                    {saving ? "جارٍ الحفظ..." : editingId ? "حفظ التعديلات" : "نشر الإعلان"}
                  </button>
                  {editingId && <button type="button" className="secondary-btn" onClick={resetForm}>إلغاء</button>}
                </div>
              </form>

              <section className="admin-list">
                <div className="section-title">
                  <div><span className="eyebrow">الإعلانات</span><h2>السيارات المنشورة</h2></div>
                  <span className="count">{cars.length}</span>
                </div>
                {cars.length === 0 ? (
                  <div className="empty">لا توجد سيارات حقيقية بعد. أضف أول سيارة من النموذج أعلاه.</div>
                ) : (
                  <div className="admin-cars">
                    {cars.map((car) => (
                      <div className="admin-car" key={car.id}>
                        <img src={car.images?.[0] || "https://placehold.co/240x160?text=MauriOne"} alt="" />
                        <div className="admin-car-main">
                          <strong>{car.title}</strong>
                          <span>{number(car.price)} {CURRENCY} · {car.reference}</span>
                        </div>
                        <button onClick={() => editCar(car)} title="تعديل"><Pencil size={18} /></button>
                        <button className="danger" onClick={() => removeCar(car)} title="حذف"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="app" dir="rtl">
      <GlobalStyles />
      <header className="topbar">
        <a className="brand" href="#"><Brand /></a>
        <nav>
          <a href="#cars">السيارات</a>
          <a href="#how">كيف نعمل</a>
          <a href="#contact">تواصل معنا</a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-bg" />
          <div className="hero-content">
            <span className="hero-pill"><ShieldCheck size={16}/> إعلانات مختارة من MauriOne</span>
            <h1>سيارتك القادمة<br /><em>تبدأ من هنا.</em></h1>
            <p>سوق سيارات موريتاني بسيط وواضح. اختر السيارة، تواصل معنا، ونحن ننسّق لك مع البائع.</p>
            <div className="search-panel">
              <div className="search-input">
                <Search size={20} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن Toyota، Corolla، رقم الإعلان..." />
              </div>
              <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="">كل الماركات</option>
                {brands.map((b) => <option key={b}>{b}</option>)}
              </select>
              <input className="price-filter" inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="أعلى سعر" />
              <a href="#cars" className="primary-btn"><Search size={18}/> بحث</a>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div><CheckCircle2 size={20}/><span><strong>إعلانات واضحة</strong><small>معلومات السيارة في مكان واحد</small></span></div>
          <div><MessageCircle size={20}/><span><strong>تواصل مباشر معنا</strong><small>عبر WhatsApp</small></span></div>
          <div><ShieldCheck size={20}/><span><strong>وساطة منظمة</strong><small>مرجع مستقل لكل سيارة</small></span></div>
        </section>

        <section id="cars" className="section">
          <div className="section-title">
            <div>
              <span className="eyebrow">MauriOne Cars</span>
              <h2>أحدث السيارات</h2>
            </div>
            <span className="count">{filtered.length}</span>
          </div>

          {dbReady && cars.length === 0 && (
            <div className="demo-banner">هذه السيارات للمعاينة فقط. ستختفي تلقائيًا عند نشر أول إعلان حقيقي من لوحة الإدارة.</div>
          )}

          <div className="car-grid">
            {filtered.map((car) => (
              <article className="car-card" key={car.id} onClick={() => setSelected(car)}>
                <div className="car-image">
                  <img src={car.images?.[0] || "https://placehold.co/900x600?text=MauriOne"} alt={car.title} />
                  {car.featured && <span className="featured"><Star size={14} fill="currentColor"/> مميزة</span>}
                  {car.demo && <span className="demo">نموذج</span>}
                </div>
                <div className="car-body">
                  <div className="card-topline">
                    <span className="ref">{car.reference}</span>
                    <span className="location"><MapPin size={14}/>{car.city}</span>
                  </div>
                  <h3>{car.title}</h3>
                  <div className="price">{number(car.price)} <small>{CURRENCY}</small></div>
                  <div className="spec-row">
                    <IconInfo icon={CalendarDays}>{car.year}</IconInfo>
                    <IconInfo icon={Gauge}>{number(car.mileage)} km</IconInfo>
                    <IconInfo icon={Settings2}>{car.transmission}</IconInfo>
                  </div>
                  <button className="card-action">عرض التفاصيل <ChevronLeft size={18}/></button>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && <div className="empty">لا توجد سيارة مطابقة للبحث.</div>}
        </section>

        <section id="how" className="how">
          <div className="how-copy">
            <span className="eyebrow">كيف تعمل MauriOne؟</span>
            <h2>نختصر المسافة بينك وبين السيارة.</h2>
            <p>كل سيارة تحمل رقمًا مرجعيًا واضحًا. عندما تعجبك سيارة، تواصل معنا بالمرجع وسننسّق لك الخطوة التالية.</p>
          </div>
          <div className="steps">
            <div><b>01</b><span><strong>اختر السيارة</strong><small>ابحث وقارن الإعلانات.</small></span></div>
            <div><b>02</b><span><strong>أرسل المرجع</strong><small>تواصل معنا عبر WhatsApp.</small></span></div>
            <div><b>03</b><span><strong>ننسّق المعاينة</strong><small>نربطك بصاحب السيارة.</small></span></div>
          </div>
        </section>
      </main>

      <footer id="contact">
        <Brand light />
        <p>سوق السيارات في موريتانيا.</p>
        <div className="footer-row">
          <span>© {new Date().getFullYear()} MauriOne</span>
          <a href="#admin" className="admin-link">الإدارة</a>
        </div>
      </footer>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setSelected(null)}><X size={22}/></button>
            <div className="modal-image">
              <img src={selected.images?.[0] || "https://placehold.co/1200x800?text=MauriOne"} alt={selected.title} />
              {selected.featured && <span className="featured"><Star size={14} fill="currentColor"/> مميزة</span>}
            </div>
            <div className="modal-body">
              <div className="card-topline">
                <span className="ref">{selected.reference}</span>
                <span className="location"><MapPin size={14}/>{selected.city}</span>
              </div>
              <h2>{selected.title}</h2>
              <div className="modal-price">{number(selected.price)} <small>{CURRENCY}</small></div>
              <div className="details-grid">
                <Detail label="السنة" value={selected.year} icon={CalendarDays}/>
                <Detail label="الكيلومترات" value={`${number(selected.mileage)} km`} icon={Gauge}/>
                <Detail label="الوقود" value={selected.fuel} icon={Fuel}/>
                <Detail label="ناقل الحركة" value={selected.transmission} icon={Settings2}/>
                <Detail label="اللون" value={selected.color || "—"} icon={Car}/>
                <Detail label="المدينة" value={selected.city} icon={MapPin}/>
              </div>
              {selected.description && <p className="description">{selected.description}</p>}
              <button className="whatsapp" onClick={() => contactWhatsApp(selected)}>
                <MessageCircle size={20}/> تواصل مع MauriOne عبر WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Brand({ light = false }) {
  return (
    <span className={`brand-lockup ${light ? "light" : ""}`}>
      <span className="brand-mark"><Car size={24} strokeWidth={2.2}/></span>
      <span><strong>MauriOne</strong><small>سوق السيارات في موريتانيا</small></span>
    </span>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function Detail({ icon: Icon, label, value }) {
  return <div className="detail"><Icon size={18}/><span><small>{label}</small><strong>{value}</strong></span></div>;
}

function GlobalStyles() {
  return (
    <style>{`
      *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f6f7f8;color:#111827;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif}button,input,select,textarea{font:inherit}button,a{-webkit-tap-highlight-color:transparent}.app{min-height:100vh}.topbar{height:78px;padding:0 clamp(18px,5vw,72px);display:flex;align-items:center;justify-content:space-between;background:#fff;border-bottom:1px solid #e5e7eb;position:sticky;top:0;z-index:40}.brand{text-decoration:none;color:inherit}.brand-lockup{display:flex;align-items:center;gap:11px}.brand-mark{width:42px;height:42px;border-radius:14px;background:${BRAND};display:grid;place-items:center;color:#fff}.brand-lockup>span:last-child{display:flex;flex-direction:column}.brand-lockup strong{font-size:20px;letter-spacing:-.5px}.brand-lockup small{font-size:10px;color:#6b7280;margin-top:1px}.brand-lockup.light strong,.brand-lockup.light small{color:#fff}.topbar nav{display:flex;gap:28px}.topbar nav a{text-decoration:none;color:#374151;font-weight:700;font-size:14px}.hero{min-height:540px;position:relative;display:flex;align-items:center;overflow:hidden;background:#101827}.hero-bg{position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,16,25,.94) 0%,rgba(9,16,25,.82) 48%,rgba(9,16,25,.3) 100%),url("https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1800&q=85") center/cover}.hero-content{position:relative;width:min(1180px,calc(100% - 36px));margin:auto;color:#fff;padding:70px 0}.hero-pill{display:inline-flex;gap:8px;align-items:center;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);padding:9px 13px;border-radius:999px;font-size:12px;font-weight:700}.hero h1{font-size:clamp(42px,6vw,74px);line-height:1.03;margin:20px 0 18px;letter-spacing:-2.6px;max-width:680px}.hero h1 em{font-style:normal;color:#34d399}.hero p{max-width:600px;line-height:1.9;color:#d1d5db;font-size:17px;margin:0 0 30px}.search-panel{background:#fff;padding:10px;border-radius:18px;display:grid;grid-template-columns:1.7fr .8fr .7fr auto;gap:9px;width:min(900px,100%);box-shadow:0 20px 50px rgba(0,0,0,.25)}.search-input{display:flex;align-items:center;gap:9px;padding:0 13px;color:#6b7280}.search-panel input,.search-panel select{border:0;outline:0;background:#f5f6f7;border-radius:11px;padding:13px 14px;color:#111827;width:100%}.search-input input{background:transparent;padding:13px 0}.primary-btn,.secondary-btn,.whatsapp,.card-action{border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;font-weight:800;border-radius:11px;transition:.2s}.primary-btn{background:${BRAND};color:#fff;padding:13px 18px}.primary-btn:hover{filter:brightness(.94);transform:translateY(-1px)}.secondary-btn{background:#fff;color:#111827;border:1px solid #d1d5db;padding:11px 14px}.wide{width:100%}.trust-strip{width:min(1180px,calc(100% - 36px));margin:-34px auto 0;position:relative;background:#fff;border-radius:18px;box-shadow:0 15px 45px rgba(17,24,39,.09);display:grid;grid-template-columns:repeat(3,1fr);padding:24px}.trust-strip>div{display:flex;align-items:center;gap:13px;padding:0 22px;border-left:1px solid #e5e7eb;color:${BRAND}}.trust-strip>div:last-child{border-left:0}.trust-strip span{display:flex;flex-direction:column;color:#111827}.trust-strip strong{font-size:14px}.trust-strip small{font-size:12px;color:#6b7280;margin-top:4px}.section{width:min(1180px,calc(100% - 36px));margin:80px auto}.section-title{display:flex;align-items:end;justify-content:space-between;margin-bottom:24px}.eyebrow{color:${BRAND};font-weight:900;font-size:12px;letter-spacing:.6px}.section-title h2,.admin-head h1,.how h2{font-size:clamp(28px,3.3vw,42px);margin:7px 0 0;letter-spacing:-1px}.count{min-width:38px;height:38px;padding:0 12px;border-radius:12px;background:#fff;border:1px solid #e5e7eb;display:grid;place-items:center;font-weight:800}.demo-banner,.notice,.error{padding:13px 15px;border-radius:12px;margin:0 0 18px;font-size:13px}.demo-banner{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412}.notice{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}.error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}.car-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.car-card{background:#fff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;cursor:pointer;transition:.25s}.car-card:hover{transform:translateY(-4px);box-shadow:0 18px 45px rgba(17,24,39,.1);border-color:#d1d5db}.car-image{aspect-ratio:16/10;position:relative;background:#e5e7eb;overflow:hidden}.car-image img,.modal-image img{width:100%;height:100%;object-fit:cover;display:block}.featured,.demo{position:absolute;top:13px;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:900;display:flex;align-items:center;gap:5px}.featured{right:13px;background:#111827;color:#fff}.demo{left:13px;background:#fff;color:#111827}.car-body{padding:18px}.card-topline{display:flex;align-items:center;justify-content:space-between;color:#6b7280;font-size:12px}.ref{font-weight:900;color:${BRAND};background:#ecfdf5;padding:5px 8px;border-radius:8px}.location{display:flex;align-items:center;gap:4px}.car-body h3{font-size:20px;margin:15px 0 8px}.price,.modal-price{font-weight:900;color:#111827;font-size:25px}.price small,.modal-price small{font-size:12px;color:#6b7280}.spec-row{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0}.info-chip{display:flex;align-items:center;gap:5px;background:#f3f4f6;padding:7px 8px;border-radius:9px;font-size:11px;color:#4b5563}.card-action{width:100%;padding:11px;background:#f9fafb;color:#111827;border:1px solid #e5e7eb}.how{width:min(1180px,calc(100% - 36px));margin:90px auto;background:#111827;color:#fff;padding:55px;border-radius:24px;display:grid;grid-template-columns:1fr 1fr;gap:60px}.how-copy p{color:#9ca3af;line-height:1.9;max-width:520px}.steps{display:grid;gap:12px}.steps>div{display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);padding:16px;border-radius:14px}.steps b{font-size:12px;color:#34d399}.steps span{display:flex;flex-direction:column}.steps small{color:#9ca3af;margin-top:4px}.empty{padding:40px;text-align:center;background:#fff;border:1px dashed #d1d5db;border-radius:16px;color:#6b7280}footer{background:#0b111b;color:#fff;padding:45px clamp(18px,5vw,72px)}footer>p{color:#9ca3af}.footer-row{margin-top:30px;padding-top:22px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;color:#6b7280;font-size:12px}.admin-link{color:#6b7280;text-decoration:none}.modal-backdrop{position:fixed;inset:0;background:rgba(3,7,18,.7);display:grid;place-items:center;padding:20px;z-index:100;backdrop-filter:blur(6px)}.modal{width:min(900px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;position:relative}.close{position:absolute;top:14px;left:14px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.92);display:grid;place-items:center;cursor:pointer;z-index:2}.modal-image{height:380px;position:relative}.modal-body{padding:26px}.modal-body h2{font-size:32px;margin:16px 0 7px}.modal-price{font-size:30px;color:${BRAND}}.details-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px 0}.detail{display:flex;align-items:center;gap:10px;background:#f9fafb;border:1px solid #eef0f2;padding:12px;border-radius:12px;color:${BRAND}}.detail span{display:flex;flex-direction:column}.detail small{color:#6b7280;font-size:10px}.detail strong{color:#111827;font-size:13px;margin-top:3px}.description{line-height:1.9;color:#4b5563}.whatsapp{width:100%;padding:15px;background:#16a34a;color:#fff;margin-top:15px}.admin-shell{width:min(1000px,calc(100% - 36px));margin:45px auto 80px}.login-card{width:min(430px,100%);margin:70px auto;background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:28px;box-shadow:0 18px 45px rgba(17,24,39,.06)}.login-card h1{margin:15px 0 8px}.login-card p,.admin-head p{color:#6b7280}.admin-icon{width:55px;height:55px;border-radius:16px;background:#ecfdf5;color:${BRAND};display:grid;place-items:center}.stack{display:grid;gap:9px;margin-top:24px}.stack label,.field>span{font-size:12px;font-weight:800;color:#374151}.stack input,.field input,.field select,.field textarea{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:12px 13px;outline:0;background:#fff}.stack input:focus,.field input:focus,.field select:focus,.field textarea:focus{border-color:${BRAND};box-shadow:0 0 0 3px rgba(15,138,95,.09)}.admin-head{display:flex;justify-content:space-between;align-items:start;margin-bottom:25px}.admin-form,.admin-list{background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:24px;margin-bottom:24px}.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.field{display:grid;gap:7px;margin-bottom:16px}.check{display:flex!important;align-items:center;gap:9px;padding-top:10px}.check input{width:auto}.actions-row{display:flex;gap:10px}.admin-cars{display:grid;gap:10px}.admin-car{display:grid;grid-template-columns:95px 1fr auto auto;gap:12px;align-items:center;border:1px solid #e5e7eb;border-radius:12px;padding:8px}.admin-car img{width:95px;height:65px;object-fit:cover;border-radius:9px}.admin-car-main{display:flex;flex-direction:column;gap:5px}.admin-car-main span{font-size:12px;color:#6b7280}.admin-car button{width:38px;height:38px;border:1px solid #e5e7eb;background:#fff;border-radius:9px;display:grid;place-items:center;cursor:pointer}.admin-car button.danger{color:#dc2626}.price-filter{text-align:right}
      @media(max-width:850px){.topbar{height:68px}.topbar nav{display:none}.hero{min-height:620px}.hero-content{padding:55px 0}.hero h1{font-size:47px;letter-spacing:-1.6px}.search-panel{grid-template-columns:1fr 1fr}.search-input{grid-column:1/-1}.trust-strip{grid-template-columns:1fr;margin-top:-28px;padding:8px}.trust-strip>div{border-left:0;border-bottom:1px solid #e5e7eb;padding:16px}.trust-strip>div:last-child{border-bottom:0}.car-grid{grid-template-columns:repeat(2,1fr)}.how{grid-template-columns:1fr;padding:34px;gap:30px}.details-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:580px){.brand-lockup small{display:none}.hero{min-height:650px}.hero-bg{background:linear-gradient(180deg,rgba(9,16,25,.85),rgba(9,16,25,.96)),url("https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1000&q=80") center/cover}.hero h1{font-size:42px}.hero p{font-size:14px}.search-panel{grid-template-columns:1fr}.search-input{grid-column:auto}.car-grid{grid-template-columns:1fr}.section{margin:58px auto}.modal-backdrop{padding:0}.modal{height:100%;max-height:none;border-radius:0}.modal-image{height:270px}.details-grid{grid-template-columns:1fr 1fr}.how{border-radius:18px;padding:27px}.form-grid{grid-template-columns:1fr}.admin-head{flex-direction:column;gap:15px}.admin-form,.admin-list{padding:16px}.admin-car{grid-template-columns:72px 1fr auto}.admin-car img{width:72px;height:58px}.admin-car button.danger{grid-column:3}.admin-car button:not(.danger){grid-column:3}.footer-row{gap:20px}}
    `}</style>
  );
}

export default App;
