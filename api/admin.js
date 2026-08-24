import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("ADMIN_FIREBASE_NOT_CONFIGURED");
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

function allowedAdmins() {
  return new Set(
    (process.env.ADMIN_EMAILS || "limamahmd16@gmail.com")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function requireAdmin(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("UNAUTHENTICATED");
  const app = getAdminApp();
  const decoded = await getAuth(app).verifyIdToken(token);
  const email = String(decoded.email || "").toLowerCase();
  if (!decoded.email_verified || !allowedAdmins().has(email)) throw new Error("FORBIDDEN");
  return { app, decoded };
}

function json(res, status, body) {
  res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

function tsToJSON(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate().toISOString();
  return value;
}

function cleanDoc(doc) {
  const data = doc.data();
  const out = { id: doc.id, ...data };
  for (const [key, value] of Object.entries(out)) {
    if (value && typeof value.toDate === "function") out[key] = tsToJSON(value);
  }
  return out;
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (!req.body) return {};
  try { return JSON.parse(req.body); } catch { return {}; }
}

export default async function handler(req, res) {
  try {
    const { app } = await requireAdmin(req);
    const db = getFirestore(app);
    const auth = getAuth(app);
    const action = String(req.query.action || "summary");

    if (req.method === "GET" && action === "summary") {
      const [adsSnap, reportsSnap] = await Promise.all([
        db.collection("ads").get(),
        db.collection("reports").get().catch(() => ({ docs: [], size: 0 })),
      ]);
      let users = 0;
      let pageToken;
      do {
        const page = await auth.listUsers(1000, pageToken);
        users += page.users.length;
        pageToken = page.pageToken;
      } while (pageToken);
      const ads = adsSnap.docs.map(cleanDoc);
      return json(res, 200, {
        ok: true,
        summary: {
          ads: ads.length,
          users,
          reports: reportsSnap.size || 0,
          views: ads.reduce((n, a) => n + Number(a.views || 0), 0),
          featured: ads.filter((a) => a.featured).length,
          hidden: ads.filter((a) => ["hidden", "rejected"].includes(a.status)).length,
        },
      });
    }

    if (req.method === "GET" && action === "ads") {
      const snap = await db.collection("ads").orderBy("createdAt", "desc").limit(500).get();
      return json(res, 200, { ok: true, ads: snap.docs.map(cleanDoc) });
    }

    if (req.method === "GET" && action === "users") {
      const limit = Math.min(Number(req.query.limit || 200), 1000);
      const page = await auth.listUsers(limit, req.query.pageToken || undefined);
      return json(res, 200, {
        ok: true,
        users: page.users.map((u) => ({
          uid: u.uid,
          email: u.email || "",
          displayName: u.displayName || "",
          phoneNumber: u.phoneNumber || "",
          photoURL: u.photoURL || "",
          disabled: u.disabled,
          emailVerified: u.emailVerified,
          creationTime: u.metadata.creationTime,
          lastSignInTime: u.metadata.lastSignInTime,
          providers: u.providerData.map((p) => p.providerId),
        })),
        nextPageToken: page.pageToken || null,
      });
    }

    if (req.method === "GET" && action === "reports") {
      const snap = await db.collection("reports").orderBy("createdAt", "desc").limit(300).get().catch(async () => db.collection("reports").limit(300).get());
      return json(res, 200, { ok: true, reports: snap.docs.map(cleanDoc) });
    }

    if (req.method === "GET" && action === "settings") {
      const snap = await db.collection("siteSettings").doc("general").get();
      return json(res, 200, { ok: true, settings: snap.exists ? snap.data() : {} });
    }

    const body = await readBody(req);

    if (req.method === "POST" && action === "updateAd") {
      const id = String(body.id || "");
      if (!id) return json(res, 400, { ok: false, error: "MISSING_ID" });
      const allowed = ["title", "price", "currency", "city", "area", "description", "status", "featured", "cat", "phone", "whatsapp"];
      const patch = {};
      for (const key of allowed) if (Object.prototype.hasOwnProperty.call(body.patch || {}, key)) patch[key] = body.patch[key];
      patch.adminUpdatedAt = FieldValue.serverTimestamp();
      await db.collection("ads").doc(id).update(patch);
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && action === "deleteAd") {
      const id = String(body.id || "");
      if (!id) return json(res, 400, { ok: false, error: "MISSING_ID" });
      await db.collection("ads").doc(id).delete();
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && action === "setUserDisabled") {
      const uid = String(body.uid || "");
      if (!uid) return json(res, 400, { ok: false, error: "MISSING_UID" });
      await auth.updateUser(uid, { disabled: Boolean(body.disabled) });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && action === "updateUser") {
      const uid = String(body.uid || "");
      if (!uid) return json(res, 400, { ok: false, error: "MISSING_UID" });
      const changes = {};
      if (typeof body.displayName === "string") changes.displayName = body.displayName;
      if (typeof body.emailVerified === "boolean") changes.emailVerified = body.emailVerified;
      await auth.updateUser(uid, changes);
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && action === "deleteUser") {
      const uid = String(body.uid || "");
      if (!uid) return json(res, 400, { ok: false, error: "MISSING_UID" });
      await auth.deleteUser(uid);
      const batch = db.batch();
      const userRef = db.collection("users").doc(uid);
      batch.delete(userRef);
      const adsSnap = await db.collection("ads").where("ownerId", "==", uid).get();
      adsSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return json(res, 200, { ok: true, deletedAds: adsSnap.size });
    }

    if (req.method === "POST" && action === "saveSettings") {
      const allowed = ["siteName", "tagline", "maintenance", "postingEnabled", "defaultCurrency", "supportEmail", "announcement"];
      const settings = {};
      for (const key of allowed) if (Object.prototype.hasOwnProperty.call(body.settings || {}, key)) settings[key] = body.settings[key];
      settings.updatedAt = FieldValue.serverTimestamp();
      await db.collection("siteSettings").doc("general").set(settings, { merge: true });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && action === "resolveReport") {
      const id = String(body.id || "");
      if (!id) return json(res, 400, { ok: false, error: "MISSING_ID" });
      await db.collection("reports").doc(id).set({ status: "resolved", resolvedAt: FieldValue.serverTimestamp() }, { merge: true });
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { ok: false, error: "UNKNOWN_ACTION" });
  } catch (error) {
    console.error("admin-api", error);
    const message = String(error?.message || error);
    if (message === "ADMIN_FIREBASE_NOT_CONFIGURED") return json(res, 503, { ok: false, error: "ADMIN_FIREBASE_NOT_CONFIGURED" });
    if (message === "UNAUTHENTICATED") return json(res, 401, { ok: false, error: "UNAUTHENTICATED" });
    if (message === "FORBIDDEN") return json(res, 403, { ok: false, error: "FORBIDDEN" });
    return json(res, 500, { ok: false, error: "ADMIN_API_ERROR", detail: message });
  }
}
