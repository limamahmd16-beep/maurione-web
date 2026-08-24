export default function handler(req, res) {
  res.status(200).setHeader("Cache-Control", "no-store").json({
    ok: true,
    firebaseAdminConfigured: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY)),
    bootstrapCodeConfigured: Boolean(process.env.ADMIN_BOOTSTRAP_CODE),
    adminEmailsConfigured: Boolean(process.env.ADMIN_EMAILS),
  });
}
