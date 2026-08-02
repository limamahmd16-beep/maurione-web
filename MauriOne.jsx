import React, { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { db } from "./firebase.js";
import { auth } from "./firebase.js";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc, increment, serverTimestamp } from "firebase/firestore";

// ===== Cloudinary: رفع الصور للسحابة =====
const CLOUDINARY_CLOUD = "bjlglhaw";
const CLOUDINARY_PRESET = "maurione";
async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (!data.secure_url) throw new Error("upload failed");
  return data.secure_url;
}
import {
  Search, Heart, MessageCircle, User, Plus, Home as HomeIcon,
  Phone, ChevronRight, ChevronLeft, MapPin, Clock, Camera, Check,
  Briefcase, Car, Building2, Stethoscope, Smartphone, Wrench,
  MoreHorizontal, Star, Share2, Flag, Send, ArrowRight, ArrowLeft,
  Filter, CheckCircle2, Menu, Bell, Settings, Eye, Calendar, Fuel,
  Gauge, Cog, Palette, ShieldCheck, Mic, Bookmark, ClipboardList,
  BarChart3, Wallet, HelpCircle, LogOut, Mail, Lock, ChevronDown,
  X, Globe, Edit3, RotateCcw, ShoppingBag, Sun, Moon
} from "lucide-react";

// ===== i18n (merged inline) =====
// MauriOne — نظام الترجمة (i18n) | ثلاث لغات: العربية، الفرنسية، الإنجليزية
// UI strings are translated; user-generated ad content (titles, descriptions) stays as provided by data.

const LANGS = {
  ar: { label: "العربية", dir: "rtl", flag: "ع" },
  fr: { label: "Français", dir: "ltr", flag: "FR" },
  en: { label: "English", dir: "ltr", flag: "EN" },
};

const T = {
  // ---- brand / tagline ----
  tagline: { ar: "كل ما تحتاجه بين يديك", fr: "Tout ce dont vous avez besoin à portée de main", en: "Everything you need in one place" },
  welcome: { ar: "مرحبًا بك في", fr: "Bienvenue sur", en: "Welcome to" },

  // ---- categories ----
  cat_jobs: { ar: "الوظائف", fr: "Emplois", en: "Jobs" },
  cat_cars: { ar: "السيارات", fr: "Voitures", en: "Cars" },
  cat_realestate: { ar: "العقارات", fr: "Immobilier", en: "Real Estate" },
  cat_clinics: { ar: "العيادات", fr: "Cliniques", en: "Clinics" },
  cat_phones: { ar: "الهواتف", fr: "Téléphones", en: "Phones" },
  cat_services: { ar: "خدمات منزلية", fr: "Services à domicile", en: "Home Services" },
  cat_more: { ar: "المزيد", fr: "Plus", en: "More" },
  cat_shop: { ar: "تسوق", fr: "Boutique", en: "Shop" },

  // ---- onboarding / auth ----
  start_now: { ar: "ابدأ الآن", fr: "Commencer", en: "Get Started" },
  login: { ar: "تسجيل الدخول", fr: "Se connecter", en: "Log In" },
  login_subtitle: { ar: "مرحبًا بك مرة أخرى، يرجى تسجيل الدخول لمتابعة استخدام", fr: "Bon retour, connectez-vous pour continuer avec", en: "Welcome back, please log in to continue with" },
  phone_or_email: { ar: "رقم الهاتف أو البريد الإلكتروني", fr: "Téléphone ou e-mail", en: "Phone or email" },
  password: { ar: "كلمة المرور", fr: "Mot de passe", en: "Password" },
  forgot_password: { ar: "نسيت كلمة المرور؟", fr: "Mot de passe oublié ?", en: "Forgot password?" },
  or: { ar: "أو", fr: "ou", en: "or" },
  login_google: { ar: "الدخول باستخدام Google", fr: "Continuer avec Google", en: "Continue with Google" },
  login_apple: { ar: "الدخول باستخدام Apple", fr: "Continuer avec Apple", en: "Continue with Apple" },
  no_account: { ar: "ليس لديك حساب؟", fr: "Pas de compte ?", en: "No account?" },
  create_account: { ar: "إنشاء حساب", fr: "Créer un compte", en: "Sign Up" },
  create_account_title: { ar: "إنشاء حساب جديد", fr: "Créer un nouveau compte", en: "Create a new account" },
  signup_subtitle: { ar: "أنشئ حسابًا جديدًا للمتابعة باستخدام", fr: "Créez un compte pour continuer avec", en: "Create an account to continue with" },
  full_name: { ar: "الاسم الكامل", fr: "Nom complet", en: "Full name" },
  email: { ar: "البريد الإلكتروني", fr: "E-mail", en: "Email" },
  phone_optional: { ar: "رقم الهاتف (اختياري)", fr: "Téléphone (facultatif)", en: "Phone (optional)" },
  confirm_password: { ar: "تأكيد كلمة المرور", fr: "Confirmer le mot de passe", en: "Confirm password" },
  agree_terms: { ar: "أوافق على الشروط والأحكام و سياسة الخصوصية", fr: "J'accepte les conditions et la politique de confidentialité", en: "I agree to the Terms and Privacy Policy" },
  signup_google: { ar: "التسجيل باستخدام Google", fr: "S'inscrire avec Google", en: "Sign up with Google" },
  signup_apple: { ar: "التسجيل باستخدام Apple", fr: "S'inscrire avec Apple", en: "Sign up with Apple" },
  have_account: { ar: "لديك حساب بالفعل؟", fr: "Vous avez déjà un compte ?", en: "Already have an account?" },
  otp_title: { ar: "التحقق من رقم الهاتف", fr: "Vérification du numéro", en: "Verify phone number" },
  otp_subtitle: { ar: "أدخل رمز التحقق المكوّن من 6 أرقام", fr: "Entrez le code à 6 chiffres", en: "Enter the 6-digit code" },
  otp_sent: { ar: "تم إرسال الرمز إلى", fr: "Code envoyé à", en: "Code sent to" },
  resend_in: { ar: "إعادة إرسال الرمز خلال", fr: "Renvoyer dans", en: "Resend in" },
  resend_code: { ar: "إعادة إرسال الرمز", fr: "Renvoyer le code", en: "Resend code" },
  confirm_continue: { ar: "تأكيد ومتابعة", fr: "Confirmer et continuer", en: "Confirm & continue" },

  // ---- home ----
  hello: { ar: "مرحبًا", fr: "Bonjour", en: "Hello" },
  search_placeholder: { ar: "ابحث عن سيارات، وظائف، عقارات، عيادات، هواتف...", fr: "Rechercher voitures, emplois, immobilier...", en: "Search cars, jobs, real estate..." },
  featured_ads: { ar: "الإعلانات المميزة", fr: "Annonces en vedette", en: "Featured Ads" },
  latest_ads: { ar: "أحدث الإعلانات", fr: "Dernières annonces", en: "Latest Ads" },
  view_all: { ar: "عرض الكل", fr: "Voir tout", en: "View all" },
  ad_count: { ar: "إعلان", fr: "annonces", en: "ads" },

  // ---- search ----
  advanced_search: { ar: "البحث المتقدم", fr: "Recherche avancée", en: "Advanced Search" },
  search_subtitle: { ar: "ابحث بدقة عن ما تحتاجه", fr: "Trouvez précisément ce qu'il vous faut", en: "Find exactly what you need" },
  saved: { ar: "المحفوظة", fr: "Enregistrés", en: "Saved" },
  search_short: { ar: "ابحث عن سيارات، وظائف، عقارات...", fr: "Rechercher...", en: "Search..." },
  voice_soon: { ar: "البحث الصوتي سيتوفر قريبًا", fr: "Recherche vocale bientôt disponible", en: "Voice search coming soon" },
  saved_searches: { ar: "عمليات البحث المحفوظة", fr: "Recherches enregistrées", en: "Saved searches" },
  search_btn: { ar: "بحث", fr: "Rechercher", en: "Search" },
  no_recent_search: { ar: "لا توجد عمليات بحث سابقة", fr: "Aucune recherche récente", en: "No recent searches" },
  choose_category: { ar: "اختر القسم", fr: "Choisir une catégorie", en: "Choose category" },
  city: { ar: "المدينة", fr: "Ville", en: "City" },
  all_cities: { ar: "كل المدن", fr: "Toutes les villes", en: "All cities" },
  sort: { ar: "الترتيب", fr: "Trier", en: "Sort" },
  sort_newest: { ar: "الأحدث", fr: "Plus récent", en: "Newest" },
  sort_cheapest: { ar: "الأقل سعرًا", fr: "Moins cher", en: "Cheapest" },
  sort_expensive: { ar: "الأعلى سعرًا", fr: "Plus cher", en: "Most expensive" },
  filters_of: { ar: "فلاتر", fr: "Filtres", en: "Filters" },
  all: { ar: "الكل", fr: "Tout", en: "All" },
  notify_matching: { ar: "أرسل لي إشعارًا عندما تتوفر إعلانات مطابقة", fr: "Me notifier des annonces correspondantes", en: "Notify me of matching ads" },
  results: { ar: "نتيجة", fr: "résultats", en: "results" },
  no_results: { ar: "لا توجد نتائج مطابقة", fr: "Aucun résultat", en: "No matching results" },

  // ---- ad details ----
  ad_details: { ar: "تفاصيل الإعلان", fr: "Détails de l'annonce", en: "Ad Details" },
  copied_share: { ar: "تم نسخ رابط المشاركة", fr: "Lien copié", en: "Share link copied" },
  report_sent: { ar: "تم إرسال البلاغ", fr: "Signalement envoyé", en: "Report sent" },
  location: { ar: "الموقع", fr: "Emplacement", en: "Location" },
  view_map: { ar: "عرض الخريطة", fr: "Voir la carte", en: "View map" },
  open_map: { ar: "سيتم فتح الخريطة", fr: "Ouverture de la carte", en: "Opening map" },
  description: { ar: "الوصف", fr: "Description", en: "Description" },
  show_more: { ar: "إظهار المزيد", fr: "Voir plus", en: "Show more" },
  show_less: { ar: "إخفاء", fr: "Voir moins", en: "Show less" },
  specifications: { ar: "المواصفات", fr: "Spécifications", en: "Specifications" },
  views: { ar: "مشاهدة", fr: "vues", en: "views" },
  verified_account: { ar: "حساب موثق", fr: "Compte vérifié", en: "Verified account" },
  advertiser: { ar: "معلن", fr: "Annonceur", en: "Advertiser" },
  view_profile: { ar: "عرض الملف", fr: "Voir le profil", en: "View profile" },
  view_seller_profile: { ar: "عرض الملف الشخصي للبائع", fr: "Voir le profil du vendeur", en: "View seller profile" },
  similar_ads: { ar: "إعلانات مشابهة", fr: "Annonces similaires", en: "Similar ads" },
  save: { ar: "حفظ", fr: "Enregistrer", en: "Save" },
  call: { ar: "اتصال", fr: "Appeler", en: "Call" },
  chat: { ar: "دردشة", fr: "Discuter", en: "Chat" },
  whatsapp: { ar: "واتساب", fr: "WhatsApp", en: "WhatsApp" },
  calling: { ar: "جارٍ الاتصال بـ", fr: "Appel de", en: "Calling" },
  opening_whatsapp: { ar: "سيتم فتح واتساب", fr: "Ouverture de WhatsApp", en: "Opening WhatsApp" },
  open_chat: { ar: "فتح المحادثة الداخلية", fr: "Ouvrir la messagerie", en: "Open in-app chat" },
  view_all_similar: { ar: "عرض جميع الإعلانات المشابهة", fr: "Voir toutes les annonces similaires", en: "View all similar ads" },

  // ---- add ad ----
  publish_new_ad: { ar: "نشر إعلان جديد", fr: "Publier une annonce", en: "Post a new ad" },
  add_details_hint: { ar: "أضف تفاصيل إعلانك ليظهر للجميع", fr: "Ajoutez les détails de votre annonce", en: "Add your ad details" },
  draft: { ar: "مسودة", fr: "Brouillon", en: "Draft" },
  draft_saved: { ar: "تم حفظ المسودة", fr: "Brouillon enregistré", en: "Draft saved" },
  step_details: { ar: "التفاصيل", fr: "Détails", en: "Details" },
  step_photos: { ar: "الصور", fr: "Photos", en: "Photos" },
  step_location: { ar: "الموقع", fr: "Emplacement", en: "Location" },
  step_extra: { ar: "معلومات إضافية", fr: "Infos suppl.", en: "Extra info" },
  step_review: { ar: "مراجعة ونشر", fr: "Réviser & publier", en: "Review & post" },
  ad_published: { ar: "تم نشر إعلانك بنجاح", fr: "Annonce publiée avec succès", en: "Ad published successfully" },
  ad_published_hint: { ar: "سيظهر إعلانك في قائمة أحدث الإعلانات بعد المراجعة.", fr: "Votre annonce apparaîtra après vérification.", en: "Your ad will appear after review." },
  back_home: { ar: "العودة للرئيسية", fr: "Retour à l'accueil", en: "Back to home" },
  post_another: { ar: "نشر إعلان آخر", fr: "Publier une autre", en: "Post another" },
  ad_title: { ar: "عنوان الإعلان", fr: "Titre de l'annonce", en: "Ad title" },
  ad_title_ph: { ar: "اكتب عنوانًا واضحًا وجذابًا لإعلانك", fr: "Titre clair et attractif", en: "Write a clear, catchy title" },
  ad_type: { ar: "نوع الإعلان", fr: "Type d'annonce", en: "Ad type" },
  price: { ar: "السعر", fr: "Prix", en: "Price" },
  salary: { ar: "الراتب", fr: "Salaire", en: "Salary" },
  consult_fee: { ar: "سعر الكشف", fr: "Prix de consultation", en: "Consultation fee" },
  enter_price: { ar: "أدخل السعر", fr: "Entrez le prix", en: "Enter price" },
  currency: { ar: "أوقية", fr: "MRU", en: "MRU" },
  product_condition: { ar: "حالة المنتج", fr: "État du produit", en: "Condition" },
  cond_new: { ar: "جديد", fr: "Neuf", en: "New" },
  cond_excellent: { ar: "مستعمل بحالة ممتازة", fr: "Occasion - excellent", en: "Used - excellent" },
  cond_good: { ar: "مستعمل بحالة جيدة", fr: "Occasion - bon", en: "Used - good" },
  desc_ph: { ar: "اكتب وصفًا دقيقًا عن المنتج أو الخدمة...", fr: "Décrivez précisément le produit ou service...", en: "Describe the item or service..." },
  ad_photos: { ar: "صور الإعلان", fr: "Photos de l'annonce", en: "Ad photos" },
  add_photo: { ar: "إضافة صورة", fr: "Ajouter une photo", en: "Add photo" },
  photos_hint: { ar: "يمكنك إضافة حتى 8 صور. الصورة الأولى ستكون صورة الغلاف.", fr: "Jusqu'à 8 photos. La première sera la couverture.", en: "Up to 8 photos. First is the cover." },
  neighborhood: { ar: "الحي / المنطقة", fr: "Quartier / Zone", en: "Neighborhood / Area" },
  neighborhood_ph: { ar: "اختر الحي أو المنطقة", fr: "Choisir le quartier", en: "Choose neighborhood" },
  extra_info: { ar: "معلومات إضافية", fr: "Informations supplémentaires", en: "Extra information" },
  phone_number: { ar: "رقم الهاتف", fr: "Numéro de téléphone", en: "Phone number" },
  enable_whatsapp: { ar: "تفعيل التواصل عبر واتساب", fr: "Activer WhatsApp", en: "Enable WhatsApp contact" },
  ads_safe_hint: { ar: "إعلاناتك آمنة معنا ولن يتم نشر رقم هاتفك للعامة بدون موافقتك.", fr: "Vos annonces sont protégées ; votre numéro ne sera pas public sans votre accord.", en: "Your ads are safe; your number won't be public without consent." },
  review_ad: { ar: "مراجعة الإعلان", fr: "Réviser l'annonce", en: "Review ad" },
  no_title: { ar: "بدون عنوان", fr: "Sans titre", en: "No title" },
  photo_word: { ar: "صورة", fr: "photo(s)", en: "photo(s)" },
  choose: { ar: "اختر...", fr: "Choisir...", en: "Choose..." },
  next: { ar: "التالي", fr: "Suivant", en: "Next" },
  back: { ar: "رجوع", fr: "Retour", en: "Back" },
  publish_ad: { ar: "نشر الإعلان", fr: "Publier l'annonce", en: "Publish ad" },
  details_of: { ar: "تفاصيل", fr: "Détails", en: "Details of" },
  // validation
  need_title: { ar: "يرجى إدخال عنوان الإعلان", fr: "Veuillez saisir un titre", en: "Please enter a title" },
  need_price: { ar: "يرجى إدخال السعر", fr: "Veuillez saisir un prix", en: "Please enter a price" },
  need_desc: { ar: "يرجى إدخال الوصف", fr: "Veuillez saisir une description", en: "Please enter a description" },
  need_city: { ar: "يرجى اختيار المدينة", fr: "Veuillez choisir une ville", en: "Please choose a city" },
  need_phone: { ar: "يرجى إدخال رقم الهاتف", fr: "Veuillez saisir un numéro", en: "Please enter a phone number" },
  // ad types
  type_sale: { ar: "للبيع", fr: "À vendre", en: "For sale" },
  type_rent: { ar: "للإيجار", fr: "À louer", en: "For rent" },
  type_wanted: { ar: "مطلوب", fr: "Recherché", en: "Wanted" },
  type_other: { ar: "أخرى", fr: "Autre", en: "Other" },
  type_other_placeholder: { ar: "اكتب الخيار المطلوب...", fr: "Saisissez votre choix...", en: "Type your option..." },

  // ---- notifications ----
  notifications: { ar: "الإشعارات", fr: "Notifications", en: "Notifications" },
  notif_subtitle: { ar: "ابق على اطلاع بكل ما يهمك", fr: "Restez informé de tout", en: "Stay updated on everything" },
  mark_all_read: { ar: "تحديد الكل كمقروء", fr: "Tout marquer comme lu", en: "Mark all as read" },
  marked_all_read: { ar: "تم تحديد الكل كمقروء", fr: "Tout marqué comme lu", en: "All marked as read" },
  unread: { ar: "غير المقروءة", fr: "Non lus", en: "Unread" },

  // ---- messages ----
  messages: { ar: "الرسائل", fr: "Messages", en: "Messages" },
  messages_subtitle: { ar: "تواصل بسهولة مع المشترين والبائعين", fr: "Échangez avec acheteurs et vendeurs", en: "Chat easily with buyers and sellers" },
  search_messages: { ar: "ابحث في الرسائل...", fr: "Rechercher des messages...", en: "Search messages..." },
  new_message: { ar: "رسالة جديدة", fr: "Nouveau message", en: "New message" },
  start_new_chat: { ar: "بدء محادثة جديدة", fr: "Démarrer une discussion", en: "Start a new chat" },
  unread_short: { ar: "غير مقروءة", fr: "Non lus", en: "Unread" },
  favorites_tab: { ar: "المفضلة", fr: "Favoris", en: "Favorites" },
  archive: { ar: "الأرشيف", fr: "Archives", en: "Archive" },
  seller: { ar: "بائع", fr: "Vendeur", en: "Seller" },
  buyer: { ar: "مشتري", fr: "Acheteur", en: "Buyer" },
  type_message: { ar: "اكتب رسالة...", fr: "Écrire un message...", en: "Type a message..." },
  secure_chat: { ar: "تواصل بأمان وثقة — جميع رسائلك محمية ولا يتم مشاركة بياناتك مع أي طرف.", fr: "Discussions sécurisées — vos messages sont protégés.", en: "Secure chat — your messages are protected." },

  // ---- favorites ----
  favorites: { ar: "المفضلة", fr: "Favoris", en: "Favorites" },
  no_favorites: { ar: "لم تحفظ أي إعلان بعد", fr: "Aucune annonce enregistrée", en: "No saved ads yet" },

  // ---- profile ----
  profile_bio: { ar: "أحب البساطة والجودة، هنا لأجد الأفضل وأشارك معكم.", fr: "J'aime la simplicité et la qualité.", en: "I love simplicity and quality." },
  member_since: { ar: "انضم في", fr: "Membre depuis", en: "Member since" },
  edit_profile: { ar: "تعديل الملف", fr: "Modifier le profil", en: "Edit profile" },
  stat_views: { ar: "المشاهدات", fr: "Vues", en: "Views" },
  stat_favorites: { ar: "المفضلة", fr: "Favoris", en: "Favorites" },
  stat_ads: { ar: "الإعلانات", fr: "Annonces", en: "Ads" },
  stat_followers: { ar: "المتابعون", fr: "Abonnés", en: "Followers" },
  my_ads: { ar: "إعلاناتي", fr: "Mes annonces", en: "My ads" },
  my_ads_sub: { ar: "إدارة وتعديل وإعادة نشر إعلاناتك", fr: "Gérer et republier vos annonces", en: "Manage & repost your ads" },
  fav_sub: { ar: "الإعلانات والعروض المحفوظة لديك", fr: "Vos annonces enregistrées", en: "Your saved ads and offers" },
  stats_title: { ar: "إحصائيات الإعلانات", fr: "Statistiques des annonces", en: "Ad statistics" },
  stats_sub: { ar: "مشاهدات وتفاعل إعلاناتك بالتفصيل", fr: "Vues et interactions détaillées", en: "Detailed views & engagement" },
  subscription: { ar: "الاشتراك والباقات", fr: "Abonnement & forfaits", en: "Subscription & plans" },
  subscription_sub: { ar: "إدارة اشتراكك والباقات المتاحة", fr: "Gérer votre abonnement", en: "Manage your subscription" },
  reviews_title: { ar: "التقييمات", fr: "Évaluations", en: "Reviews" },
  reviews_sub: { ar: "تقييماتك وتقييمات الآخرين لك", fr: "Vos évaluations", en: "Your and others' reviews" },
  settings: { ar: "الإعدادات", fr: "Paramètres", en: "Settings" },
  settings_sub: { ar: "إعدادات الحساب والتطبيق", fr: "Paramètres du compte et de l'app", en: "Account & app settings" },
  help_support: { ar: "المساعدة والدعم", fr: "Aide et support", en: "Help & support" },
  help_q1: { ar: "كيف أنشر إعلانًا؟", fr: "Comment publier une annonce ?", en: "How do I post an ad?" },
  help_a1: { ar: "اضغط زر (+) في الأسفل، اختر القسم، عبّئ التفاصيل والصور، ثم اضغط نشر.", fr: "Appuyez sur (+), choisissez une catégorie, remplissez les détails et publiez.", en: "Tap (+) at the bottom, pick a category, fill in details and photos, then publish." },
  help_q2: { ar: "كيف أتواصل مع البائع؟", fr: "Comment contacter le vendeur ?", en: "How do I contact a seller?" },
  help_a2: { ar: "افتح الإعلان، ثم استخدم أزرار الاتصال أو واتساب في الأسفل.", fr: "Ouvrez l'annonce et utilisez les boutons d'appel ou WhatsApp.", en: "Open the ad and use the call or WhatsApp buttons at the bottom." },
  help_q3: { ar: "كيف أعدّل أو أحذف إعلاني؟", fr: "Comment modifier ou supprimer mon annonce ?", en: "How do I edit or delete my ad?" },
  help_a3: { ar: "افتح إعلانك من (إعلاناتي) في حسابك، وستجد خيار الحذف.", fr: "Ouvrez votre annonce depuis (Mes annonces) dans votre profil.", en: "Open your ad from (My Ads) in your profile to find the delete option." },
  help_q4: { ar: "هل النشر مجاني؟", fr: "La publication est-elle gratuite ?", en: "Is posting free?" },
  help_a4: { ar: "نعم، نشر الإعلانات الأساسية مجاني تمامًا في MauriOne.", fr: "Oui, la publication de base est entièrement gratuite.", en: "Yes, basic ad posting is completely free on MauriOne." },
  help_contact: { ar: "تواصل معنا", fr: "Contactez-nous", en: "Contact us" },
  help_contact_sub: { ar: "للاستفسارات والدعم، راسلنا عبر البريد:", fr: "Pour toute question, écrivez-nous :", en: "For questions and support, email us:" },
  help_sub: { ar: "الأسئلة الشائعة وتواصل معنا", fr: "FAQ et contact", en: "FAQ and contact" },
  logout: { ar: "تسجيل الخروج", fr: "Se déconnecter", en: "Log out" },
  logout_sub: { ar: "تسجيل خروج من حسابك", fr: "Déconnexion de votre compte", en: "Sign out of your account" },
  open_my_ads: { ar: "فتح قائمة إعلاناتي", fr: "Ouvrir mes annonces", en: "Open my ads" },
  ad_deleted: { ar: "تم حذف الإعلان", fr: "Annonce supprimée", en: "Ad deleted" },
  all_ads_cleared: { ar: "تم حذف جميع الإعلانات", fr: "Toutes les annonces supprimées", en: "All ads cleared" },
  sample_restored: { ar: "تم استرجاع الإعلانات التجريبية", fr: "Exemples restaurés", en: "Sample ads restored" },
  delete: { ar: "حذف", fr: "Supprimer", en: "Delete" },
  delete_ad: { ar: "حذف الإعلان", fr: "Supprimer l'annonce", en: "Delete ad" },
  delete_confirm: { ar: "هل أنت متأكد من حذف هذا الإعلان؟", fr: "Supprimer cette annonce ?", en: "Delete this ad?" },
  confirm: { ar: "تأكيد", fr: "Confirmer", en: "Confirm" },
  cancel: { ar: "إلغاء", fr: "Annuler", en: "Cancel" },
  my_ads_title: { ar: "إعلاناتي", fr: "Mes annonces", en: "My Ads" },
  my_ads_empty: { ar: "لم تنشر أي إعلان بعد", fr: "Aucune annonce publiée", en: "No ads published yet" },
  my_ads_empty_hint: { ar: "اضغط زر + لنشر إعلانك الأول", fr: "Appuyez sur + pour publier", en: "Tap + to post your first ad" },
  clear_all: { ar: "حذف الكل", fr: "Tout supprimer", en: "Clear all" },
  restore_samples: { ar: "استرجاع الأمثلة", fr: "Restaurer les exemples", en: "Restore samples" },
  clear_all_confirm: { ar: "حذف جميع الإعلانات؟ لا يمكن التراجع.", fr: "Supprimer toutes les annonces ?", en: "Delete all ads? Cannot be undone." },
  home_empty: { ar: "لا توجد إعلانات بعد", fr: "Aucune annonce pour le moment", en: "No ads yet" },
  home_empty_hint: { ar: "اضغط زر + لنشر أول إعلان", fr: "Appuyez sur + pour publier", en: "Tap + to post the first ad" },
  post_now: { ar: "أنشئ إعلانًا", fr: "Publier une annonce", en: "Post an ad" },
  cover: { ar: "الغلاف", fr: "Couverture", en: "Cover" },
  username: { ar: "اسم المستخدم", fr: "Nom d'utilisateur", en: "Username" },
  bio: { ar: "نبذة", fr: "Bio", en: "Bio" },
  profile_saved: { ar: "تم حفظ الملف الشخصي", fr: "Profil enregistré", en: "Profile saved" },
  settings_appearance: { ar: "المظهر", fr: "Apparence", en: "Appearance" },
  settings_theme: { ar: "الوضع الداكن", fr: "Thème sombre", en: "Dark mode" },
  settings_theme_row: { ar: "المظهر (فاتح/داكن)", fr: "Thème (clair/sombre)", en: "Theme (light/dark)" },
  settings_language: { ar: "اللغة", fr: "Langue", en: "Language" },
  settings_notifications: { ar: "الإشعارات", fr: "Notifications", en: "Notifications" },
  settings_push: { ar: "تفعيل الإشعارات", fr: "Activer les notifications", en: "Enable notifications" },
  settings_account: { ar: "الحساب", fr: "Compte", en: "Account" },
  settings_privacy: { ar: "الخصوصية والأمان", fr: "Confidentialité", en: "Privacy & security" },
  settings_about: { ar: "عن التطبيق", fr: "À propos", en: "About" },
  settings_version: { ar: "الإصدار", fr: "Version", en: "Version" },
  theme_dark: { ar: "داكن", fr: "Sombre", en: "Dark" },
  theme_light: { ar: "فاتح", fr: "Clair", en: "Light" },
  stats_overview: { ar: "نظرة عامة", fr: "Aperçu", en: "Overview" },
  stats_total_views: { ar: "إجمالي المشاهدات", fr: "Vues totales", en: "Total views" },
  stats_total_ads: { ar: "عدد الإعلانات", fr: "Nombre d'annonces", en: "Total ads" },
  stats_total_favs: { ar: "مرات الحفظ", fr: "Enregistrements", en: "Times saved" },
  stats_avg_views: { ar: "متوسط المشاهدات", fr: "Vues moyennes", en: "Avg. views" },
  stats_per_ad: { ar: "مشاهدات كل إعلان", fr: "Vues par annonce", en: "Views per ad" },
  stats_no_ads: { ar: "لا توجد إعلانات لعرض إحصائياتها", fr: "Aucune annonce à analyser", en: "No ads to show stats for" },
  stats_top: { ar: "الأكثر مشاهدة", fr: "Les plus vues", en: "Most viewed" },
  plans_title: { ar: "الاشتراك والباقات", fr: "Abonnement & forfaits", en: "Subscription & Plans" },
  plans_subtitle: { ar: "طوّر حسابك واحصل على مزايا أكثر", fr: "Améliorez votre compte", en: "Upgrade for more features" },
  plan_free: { ar: "المجانية", fr: "Gratuit", en: "Free" },
  plan_silver: { ar: "الفضية", fr: "Argent", en: "Silver" },
  plan_gold: { ar: "الذهبية", fr: "Or", en: "Gold" },
  plan_current: { ar: "باقتك الحالية", fr: "Forfait actuel", en: "Current plan" },
  plan_choose: { ar: "اختيار", fr: "Choisir", en: "Choose" },
  plan_month: { ar: "شهريًا", fr: "/mois", en: "/month" },
  plan_free_f1: { ar: "نشر حتى 5 إعلانات", fr: "Jusqu'à 5 annonces", en: "Up to 5 ads" },
  plan_free_f2: { ar: "دعم أساسي", fr: "Support de base", en: "Basic support" },
  plan_silver_f1: { ar: "نشر حتى 30 إعلان", fr: "Jusqu'à 30 annonces", en: "Up to 30 ads" },
  plan_silver_f2: { ar: "إعلان مميز واحد", fr: "1 annonce en vedette", en: "1 featured ad" },
  plan_silver_f3: { ar: "دعم أولوية", fr: "Support prioritaire", en: "Priority support" },
  plan_gold_f1: { ar: "إعلانات غير محدودة", fr: "Annonces illimitées", en: "Unlimited ads" },
  plan_gold_f2: { ar: "5 إعلانات مميزة", fr: "5 annonces en vedette", en: "5 featured ads" },
  plan_gold_f3: { ar: "متجر رسمي موثّق", fr: "Boutique vérifiée", en: "Verified store" },
  plan_gold_f4: { ar: "إحصائيات متقدمة", fr: "Statistiques avancées", en: "Advanced stats" },
  plan_selected: { ar: "تم اختيار الباقة", fr: "Forfait sélectionné", en: "Plan selected" },
  reviews_screen_title: { ar: "التقييمات", fr: "Évaluations", en: "Reviews" },
  reviews_avg: { ar: "متوسط التقييم", fr: "Note moyenne", en: "Average rating" },
  reviews_count: { ar: "تقييم", fr: "avis", en: "reviews" },
  ads: { ar: "إعلان", fr: "annonces", en: "ads" },
  close: { ar: "إغلاق", fr: "Fermer", en: "Close" },
  seller_ads: { ar: "إعلانات البائع", fr: "Annonces du vendeur", en: "Seller's ads" },
  pin_location: { ar: "حدّد موقعك على الخريطة", fr: "Épinglez votre position", en: "Pin your location" },
  use_my_location: { ar: "استخدم موقعي الحالي", fr: "Utiliser ma position", en: "Use my location" },
  locating: { ar: "جارٍ تحديد الموقع...", fr: "Localisation...", en: "Locating..." },
  location_set: { ar: "تم تحديد الموقع ✓", fr: "Position définie ✓", en: "Location set ✓" },
  geo_denied: { ar: "تعذّر الوصول للموقع، فعّل الإذن", fr: "Accès refusé, activez l'autorisation", en: "Location denied, enable permission" },
  geo_unsupported: { ar: "المتصفح لا يدعم تحديد الموقع", fr: "Géolocalisation non supportée", en: "Geolocation not supported" },
  reviews_empty: { ar: "لا توجد تقييمات بعد", fr: "Aucun avis", en: "No reviews yet" },
  rate_seller: { ar: "تقييم البائع", fr: "Évaluer le vendeur", en: "Rate seller" },
  your_rating: { ar: "تقييمك", fr: "Votre note", en: "Your rating" },
  write_review: { ar: "اكتب تعليقًا (اختياري)", fr: "Écrire un avis (facultatif)", en: "Write a review (optional)" },
  submit_review: { ar: "إرسال التقييم", fr: "Envoyer", en: "Submit rating" },
  review_submitted: { ar: "تم إرسال تقييمك، شكرًا!", fr: "Avis envoyé, merci !", en: "Rating submitted, thanks!" },
  select_rating: { ar: "يرجى اختيار عدد النجوم", fr: "Veuillez choisir une note", en: "Please select a rating" },
  open_stats: { ar: "عرض إحصائيات الإعلانات", fr: "Voir les statistiques", en: "View ad statistics" },
  open_plans: { ar: "عرض الباقات والاشتراكات", fr: "Voir les forfaits", en: "View plans" },
  open_reviews: { ar: "عرض التقييمات", fr: "Voir les évaluations", en: "View reviews" },
  open_settings: { ar: "فتح الإعدادات", fr: "Ouvrir les paramètres", en: "Open settings" },
  open_help: { ar: "فتح المساعدة والدعم", fr: "Ouvrir l'aide", en: "Open help & support" },
  change_avatar: { ar: "تغيير صورة الملف الشخصي", fr: "Changer la photo de profil", en: "Change profile picture" },
  edit_profile_open: { ar: "فتح تعديل الملف الشخصي", fr: "Modifier le profil", en: "Open profile editor" },
  guest: { ar: "زائر MauriOne", fr: "Invité MauriOne", en: "MauriOne Guest" },

  // ---- nav ----
  nav_home: { ar: "الرئيسية", fr: "Accueil", en: "Home" },
  nav_search: { ar: "البحث", fr: "Recherche", en: "Search" },
  nav_messages: { ar: "الرسائل", fr: "Messages", en: "Messages" },
  nav_profile: { ar: "حسابي", fr: "Profil", en: "Profile" },

  // ---- misc / toasts ----
  lang_changed: { ar: "تم تغيير اللغة", fr: "Langue modifiée", en: "Language changed" },
  reset_password_sent: { ar: "سيتم إرسال رابط استعادة كلمة المرور", fr: "Lien de réinitialisation envoyé", en: "Reset link will be sent" },

  // notification bodies (UI-level templates use refs from data)
  n_new_message: { ar: "رسالة جديدة", fr: "Nouveau message", en: "New message" },
  n_new_like: { ar: "إعجاب جديد", fr: "Nouveau j'aime", en: "New like" },
  n_added_fav: { ar: "إضافة إلى المفضلة", fr: "Ajouté aux favoris", en: "Added to favorites" },
  n_ad_expiry: { ar: "انتهاء مدة الإعلان", fr: "Expiration de l'annonce", en: "Ad expiring" },
  n_ad_approved: { ar: "تمت الموافقة على إعلانك", fr: "Annonce approuvée", en: "Ad approved" },
  n_ad_rejected: { ar: "تم رفض إعلانك", fr: "Annonce rejetée", en: "Ad rejected" },
  n_new_offer: { ar: "عرض سعر جديد", fr: "Nouvelle offre", en: "New price offer" },
  n_system: { ar: "تنبيه من MauriOne", fr: "Avis de MauriOne", en: "MauriOne notice" },
};

// dynamic-field labels (add-ad / search) keyed by field key
const FIELD_LABELS = {
  brand: { ar: "الشركة", fr: "Marque", en: "Brand" },
  model: { ar: "الموديل", fr: "Modèle", en: "Model" },
  year: { ar: "سنة الصنع", fr: "Année", en: "Year" },
  mileage: { ar: "العداد (كم)", fr: "Kilométrage (km)", en: "Mileage (km)" },
  gearbox: { ar: "ناقل الحركة", fr: "Boîte de vitesses", en: "Gearbox" },
  fuel: { ar: "نوع الوقود", fr: "Carburant", en: "Fuel" },
  color: { ar: "اللون", fr: "Couleur", en: "Color" },
  propType: { ar: "نوع العقار", fr: "Type de bien", en: "Property type" },
  area: { ar: "المساحة (م²)", fr: "Surface (m²)", en: "Area (m²)" },
  rooms: { ar: "عدد الغرف", fr: "Chambres", en: "Rooms" },
  baths: { ar: "عدد الحمامات", fr: "Salles de bain", en: "Bathrooms" },
  floor: { ar: "الطابق", fr: "Étage", en: "Floor" },
  storage: { ar: "السعة", fr: "Stockage", en: "Storage" },
  battery: { ar: "حالة البطارية", fr: "État batterie", en: "Battery health" },
  warranty: { ar: "الضمان", fr: "Garantie", en: "Warranty" },
  company: { ar: "اسم الشركة", fr: "Entreprise", en: "Company" },
  role: { ar: "المسمى الوظيفي", fr: "Poste", en: "Job title" },
  worktime: { ar: "نوع الدوام", fr: "Type de contrat", en: "Work type" },
  experience: { ar: "الخبرة المطلوبة", fr: "Expérience", en: "Experience" },
  qualification: { ar: "المؤهل", fr: "Qualification", en: "Qualification" },
  clinicName: { ar: "اسم العيادة", fr: "Nom de la clinique", en: "Clinic name" },
  doctor: { ar: "اسم الطبيب", fr: "Médecin", en: "Doctor" },
  specialty: { ar: "التخصص", fr: "Spécialité", en: "Specialty" },
  hours: { ar: "أوقات العمل", fr: "Horaires", en: "Hours" },
  fee: { ar: "سعر الكشف", fr: "Tarif consultation", en: "Consultation fee" },
  serviceType: { ar: "نوع الخدمة", fr: "Type de service", en: "Service type" },
  workAreas: { ar: "مناطق العمل", fr: "Zones d'intervention", en: "Service areas" },
  priceRange: { ar: "السعر التقريبي", fr: "Prix approximatif", en: "Approx. price" },
  itemType: { ar: "نوع المنتج", fr: "Type de produit", en: "Item type" },
};

// ===== end i18n =====


// ---------- design tokens ----------
const THEMES = {
  dark: {
    bg: "#07111F",
    card: "#121C2B",
    cardAlt: "#0D1728",
    green: "#19C98A",
    greenDim: "#12b07a",
    white: "#FFFFFF",
    gray: "#9AA4B2",
    grayDim: "#5C6B7A",
    border: "#1D2A3D",
    red: "#E5484D",
    gold: "#F2B807",
    blue: "#4C8DFF",
  },
  light: {
    bg: "#F4F6FB",
    card: "#FFFFFF",
    cardAlt: "#EDF1F7",
    green: "#0FB57C",
    greenDim: "#0C9A69",
    white: "#0B1524",       // primary text on light = dark
    gray: "#5B6675",
    grayDim: "#9AA4B2",
    border: "#E2E7F0",
    red: "#E5484D",
    gold: "#D99A00",
    blue: "#2F6FE0",
  },
};

// Live palette object. Components reference C.bg, C.card, ... everywhere.
// Switching theme mutates these keys in place; a root-level state bump re-renders the tree.
const C = { ...THEMES.dark };
// Fixed dark palette for screens that are ALWAYS dark (splash, onboarding, auth) — never follows the theme toggle.
const D = { ...THEMES.dark };
function applyTheme(mode) {
  const src = THEMES[mode] || THEMES.dark;
  Object.keys(src).forEach((k) => { C[k] = src[k]; });
}

// ---------- safe persistent storage ----------
// Uses localStorage when available; falls back to an in-memory map when it's
// blocked (e.g. sandboxed preview). Same API either way, never throws.
const _memStore = {};
const Store = {
  ok: (() => {
    try {
      const k = "__mo_test__";
      window.localStorage.setItem(k, "1");
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  })(),
  get(key, fallback) {
    try {
      const raw = this.ok ? window.localStorage.getItem(key) : _memStore[key];
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try {
      const raw = JSON.stringify(value);
      if (this.ok) window.localStorage.setItem(key, raw); else _memStore[key] = raw;
    } catch (e) { /* ignore */ }
  },
  remove(key) {
    try {
      if (this.ok) window.localStorage.removeItem(key); else delete _memStore[key];
    } catch (e) { /* ignore */ }
  },
};
const ADS_KEY = "maurione_ads_v2";
const PROFILE_KEY = "maurione_profile_v1";

const CATEGORIES = [
  { id: "jobs", key: "cat_jobs", label: "الوظائف", icon: Briefcase, color: "#19C98A" },
  { id: "cars", key: "cat_cars", label: "السيارات", icon: Car, color: "#19C98A" },
  { id: "realestate", key: "cat_realestate", label: "العقارات", icon: Building2, color: "#F2B807" },
  { id: "clinics", key: "cat_clinics", label: "العيادات", icon: Stethoscope, color: "#4C8DFF" },
  { id: "phones", key: "cat_phones", label: "الهواتف", icon: Smartphone, color: "#A78BFA" },
  { id: "services", key: "cat_services", label: "خدمات منزلية", icon: Wrench, color: "#19C98A" },
  { id: "more", key: "cat_more", label: "المزيد", icon: MoreHorizontal, color: "#8A94A6" },
];
function catLabel(cat, lang) { return (cat && cat.key && T[cat.key] && T[cat.key][lang]) || (cat && cat.label) || ""; }

const CITIES = ["نواكشوط", "نواذيبو", "روصو", "كيفة", "ألاك", "أطار"];

function hexToRgba(hex, alpha) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// وقت نسبي حقيقي (منذ دقيقة/ساعة/يوم) من طابع زمني
function timeAgo(ts, lang) {
  if (!ts) return lang === "fr" ? "à l'instant" : lang === "en" ? "just now" : "الآن";
  let d;
  try { d = ts.toDate ? ts.toDate() : new Date(ts); } catch (e) { d = new Date(); }
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  const L = {
    now: { ar: "الآن", fr: "à l'instant", en: "just now" },
    min: { ar: "منذ دقيقة", fr: "il y a 1 min", en: "1 min ago" },
    mins: { ar: (n) => `منذ ${n} دقيقة`, fr: (n) => `il y a ${n} min`, en: (n) => `${n} min ago` },
    hour: { ar: "منذ ساعة", fr: "il y a 1 h", en: "1 hour ago" },
    hours: { ar: (n) => `منذ ${n} ساعة`, fr: (n) => `il y a ${n} h`, en: (n) => `${n} hours ago` },
    day: { ar: "منذ يوم", fr: "hier", en: "1 day ago" },
    days: { ar: (n) => `منذ ${n} يوم`, fr: (n) => `il y a ${n} j`, en: (n) => `${n} days ago` },
  };
  const g = (o) => (typeof o[lang] === "function" ? o[lang] : (n) => o[lang]);
  if (sec < 60) return L.now[lang];
  const min = Math.floor(sec / 60);
  if (min < 2) return L.min[lang];
  if (min < 60) return g(L.mins)(min);
  const hr = Math.floor(min / 60);
  if (hr < 2) return L.hour[lang];
  if (hr < 24) return g(L.hours)(hr);
  const day = Math.floor(hr / 24);
  if (day < 2) return L.day[lang];
  return g(L.days)(day);
}

// ---------- i18n context ----------
const LangContext = createContext({ lang: "ar", dir: "rtl", setLang: () => {}, t: (k) => k, theme: "dark", setTheme: () => {}, toggleTheme: () => {} });
function useT() { return useContext(LangContext); }
// translate a dynamic field label by key
function fieldLabel(key, lang) { return (FIELD_LABELS[key] && FIELD_LABELS[key][lang]) || key; }

// ---------- global toast (pub/sub) ----------
const _toastSubs = new Set();
function toast(msg) { _toastSubs.forEach((fn) => fn(msg)); }
function ToastHost() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    let timer;
    const fn = (m) => { setMsg(m); clearTimeout(timer); timer = setTimeout(() => setMsg(""), 1800); };
    _toastSubs.add(fn);
    return () => { _toastSubs.delete(fn); clearTimeout(timer); };
  }, []);
  if (!msg) return null;
  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 pointer-events-none"
      style={{ bottom: 96, maxWidth: 340, background: C.card, color: C.white, border: `1px solid ${C.border}`, boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}>
      <CheckCircle2 size={15} color={C.green} /> {msg}
    </div>
  );
}

const SEED_ADS = [
  { id: 1, cat: "realestate", title: "فيلا فاخرة للبيع", price: "28,000,000", currency: "أوقية", city: "نواكشوط", area: "تفرغ زينة", time: "منذ 20 دقيقة", views: 1245, featured: true, condition: "ممتازة", desc: "فيلا فاخرة بتصميم عصري، حديقة خاصة ومسبح، تشطيبات راقية وموقع هادئ قريب من الخدمات.", specs: [["المساحة", "420 م²", Gauge], ["الغرف", "5", Building2], ["الحمامات", "4", Building2], ["سنة البناء", "2022", Calendar]], phone: "22 45 67 89", seller: "مكتب دار الأمل العقارية", rating: 4.8, reviews: 124, verified: true },
  { id: 2, cat: "cars", title: "تويوتا لاند كروزر VX 2023", price: "8,500,000", currency: "أوقية", city: "نواكشوط", area: "حي كيلانولا", time: "منذ 3 أيام", views: 1245, featured: true, condition: "مستعمل - ممتازة", desc: "تويوتا لاند كروزر 2023 نسخة VX.R بحالة ممتازة جدًا، صيانة دورية في الوكالة، عداد منخفض، داخلية جلد فاخرة، جميع الإضافات متوفرة.", specs: [["الموديل", "2023", Calendar], ["ناقل الحركة", "أوتوماتيك", Cog], ["نوع الوقود", "بنزين", Fuel], ["العداد", "32,000 كم", Gauge], ["المحرك", "4.0 لتر", Cog], ["اللون", "أسود", Palette]], phone: "22 45 67 89", seller: "جون دو سوزا", rating: 4.8, reviews: 124, verified: true },
  { id: 3, cat: "realestate", title: "مكتب مجهز للإيجار", price: "150,000", currency: "أوقية/شهر", city: "نواكشوط", area: "تفرغ زينة", time: "منذ ساعة", views: 342, featured: true, condition: "جديد", desc: "مكتب مجهز بالكامل، طاولات اجتماعات، إنترنت عالي السرعة، موقع مركزي مناسب للشركات الناشئة.", specs: [["المساحة", "180 م²", Gauge], ["الغرف", "4", Building2]], phone: "22 11 22 33", seller: "عائشة منت أحمد", rating: 4.5, reviews: 40, verified: false },
  { id: 4, cat: "phones", title: "iPhone 14 Pro Max 256GB", price: "185,000", currency: "أوقية", city: "نواذيبو", area: "كيلا ميا", time: "منذ 20 دقيقة", views: 812, featured: false, condition: "مستعمل - ممتازة", desc: "الحالة ممتازة جدًا، البطارية 91%، مع العلبة والشاحن الأصلي، لا خدوش.", specs: [["السعة", "256GB", Smartphone], ["البطارية", "91%", Gauge], ["اللون", "أسود", Palette]], phone: "33 44 55 66", seller: "عبدالله", rating: 4.9, reviews: 61, verified: true },
  { id: 5, cat: "more", title: "أريكة جديدة 3 مقاعد", price: "95,000", currency: "أوقية", city: "نواكشوط", area: "كارينغيا", time: "منذ ساعة", views: 120, featured: false, condition: "جديد", desc: "أريكة عصرية 3 مقاعد، قماش عالي الجودة، لون رمادي أنيق مناسب لجميع الديكورات.", specs: [["اللون", "رمادي", Palette]], phone: "22 55 66 77", seller: "متجر الأناقة", rating: 4.2, reviews: 18, verified: false },
  { id: 6, cat: "jobs", title: "مطلوب مندوب مبيعات", price: "80,000", currency: "أوقية/شهر", city: "نواكشوط", area: "المرابطين", time: "منذ يوم", views: 530, featured: false, condition: "دوام كامل", desc: "خبرة لا تقل عن سنتين في المبيعات الميدانية، مهارات تواصل ممتازة ورخصة قيادة سارية.", specs: [["الخبرة", "سنتان+", Briefcase], ["المؤهل", "باكالوريا+", Briefcase]], phone: "22 99 88 77", seller: "شركة الأمل", rating: 4.6, reviews: 22, verified: true },
  { id: 7, cat: "clinics", title: "عيادة أسنان مجهزة", price: "3,000", currency: "أوقية/كشف", city: "نواكشوط", area: "هواميمو", time: "منذ 3 ساعات", views: 95, featured: false, condition: "حجز مباشر", desc: "حجز مواعيد أسنان، تنظيف وحشوات وتقويم بأحدث الأجهزة.", specs: [["التخصص", "طب أسنان", Stethoscope], ["أوقات العمل", "9ص - 6م", Clock]], phone: "22 77 66 55", seller: "د. سيدي محمد", rating: 4.7, reviews: 33, verified: true },
];

// ---------- Logo ----------
function Logo({ size = 40, withText = false, textSize = "text-xl", markColor }) {
  const mark = markColor || C.white;
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size * 1.15 }}>
        <Star size={size * 0.3} color={C.gold} fill={C.gold} className="absolute" style={{ top: -size * 0.16, left: "50%", transform: "translateX(-50%)" }} />
        <span
          className="font-black"
          style={{
            fontSize: size * 0.92,
            lineHeight: 1,
            letterSpacing: "-1px",
            background: `linear-gradient(88deg, ${mark} 0%, ${mark} 46%, ${C.green} 54%, ${C.green} 100%)`,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          M
        </span>
      </div>
      {withText && (
        <span className={`font-extrabold ${textSize}`} style={{ color: mark }}>
          Mauri<span style={{ color: C.green }}>One</span>
        </span>
      )}
    </div>
  );
}

// ---------- shared bits ----------
function Chip({ children, active, onClick, color }) {
  const c = color || C.green;
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? c : "transparent",
        color: active ? "#07130E" : C.gray,
        border: `1px solid ${active ? c : C.border}`,
      }}
      className="px-3.5 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors shrink-0 font-medium"
    >
      {children}
    </button>
  );
}

function CategoryIcon({ cat, size = 20, box = 56, active = false }) {
  const color = cat?.color || C.gray;
  const Icon = cat?.icon || MoreHorizontal;
  const radius = Math.round(box * 0.30);
  return (
    <div
      className="flex items-center justify-center shrink-0 relative overflow-hidden"
      style={{
        width: box,
        height: box,
        borderRadius: radius,
        // gradient tints the category color over the current surface (adapts to light/dark)
        background: `linear-gradient(145deg, ${hexToRgba(color, active ? 0.30 : 0.18)} 0%, ${hexToRgba(color, active ? 0.10 : 0.05)} 55%, ${C.card} 100%)`,
        border: `1px solid ${hexToRgba(color, active ? 0.60 : 0.30)}`,
        boxShadow: active
          ? `0 6px 16px ${hexToRgba(color, 0.28)}, inset 0 1px 0 ${hexToRgba("#FFFFFF", 0.12)}`
          : `0 3px 10px ${hexToRgba(color, 0.14)}, inset 0 1px 0 ${hexToRgba("#FFFFFF", 0.06)}`,
      }}
    >
      <span
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ height: "45%", background: `linear-gradient(180deg, ${hexToRgba("#FFFFFF", 0.12)}, transparent)`, borderTopLeftRadius: radius, borderTopRightRadius: radius }}
      />
      <Icon size={size} color={color} strokeWidth={2.1} style={{ filter: `drop-shadow(0 1px 2px ${hexToRgba(color, 0.35)})`, position: "relative", zIndex: 1 }} />
    </div>
  );
}

function TopBar({ title, onBack, right, transparent }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
      style={{ background: transparent ? "transparent" : C.bg, borderBottom: transparent ? "none" : `1px solid ${C.border}` }}
    >
      <div className="flex items-center gap-2">
        {onBack && (
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <ArrowRight size={16} color={C.white} />
          </button>
        )}
        {title && <h1 className="text-lg font-bold" style={{ color: C.white }}>{title}</h1>}
      </div>
      {right}
    </div>
  );
}

function BadgeIcon({ children, count }) {
  return (
    <div className="relative">
      {children}
      {count > 0 && (
        <span
          className="absolute -top-1.5 -left-1.5 h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: C.green, color: "#07130E", minWidth: 16 }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function IconCircle({ icon: Icon, color, size = 40 }) {
  return (
    <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: size, height: size, background: hexToRgba(color, 0.16) }}>
      <Icon size={size * 0.45} color={color} />
    </div>
  );
}

function Field({ icon: Icon, value, onChange, placeholder, type = "text", right }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3.5 py-3" style={{ background: "transparent", border: `1px solid ${D.border}` }}>
      {right}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="flex-1 bg-transparent outline-none text-sm text-right"
        style={{ color: D.white }}
      />
      {Icon && <Icon size={17} color={D.green} />}
    </div>
  );
}

function AdCard({ ad, isFav, onToggleFav, onOpen, variant = "grid" }) {
  const cat = CATEGORIES.find((c) => c.id === ad.cat);
  if (variant === "row") {
    return (
      <button onClick={() => onOpen(ad)} className="w-full flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: C.cardAlt }}>
          {ad.images && ad.images.length > 0
            ? <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
            : <CategoryIcon cat={cat} size={20} box={64} active />}
        </div>
        <div className="flex-1 text-right min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: C.white }}>{ad.title}</p>
          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: C.gray }}><MapPin size={10} />{ad.city} · {ad.time}</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: C.green }}>{ad.price} <span className="text-[11px] font-normal" style={{ color: C.gray }}>{ad.currency}</span></p>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleFav(ad.id); }} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: C.card }}>
          <Heart size={14} color={isFav ? C.green : C.gray} fill={isFav ? C.green : "none"} />
        </button>
      </button>
    );
  }
  return (
    <button
      onClick={() => onOpen(ad)}
      className="text-right rounded-2xl overflow-hidden flex flex-col w-full"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div className="relative h-28 flex items-center justify-center overflow-hidden" style={{ background: C.cardAlt }}>
        {ad.images && ad.images.length > 0
          ? <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
          : <CategoryIcon cat={cat} size={24} box={54} active />}
        {ad.featured && (
          <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: C.green, color: "#07130E" }}>مميز</span>
        )}
        <span onClick={(e) => { e.stopPropagation(); onToggleFav(ad.id); }} className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(7,17,31,0.75)" }}>
          <Heart size={14} color={isFav ? C.green : C.white} fill={isFav ? C.green : "none"} />
        </span>
      </div>
      <div className="p-2.5 flex flex-col gap-1">
        <p className="text-[13px] leading-snug line-clamp-2 font-medium" style={{ color: C.white }}>{ad.title}</p>
        <p className="text-sm font-bold" style={{ color: C.green }}>{ad.price} <span className="text-[11px] font-normal" style={{ color: C.gray }}>{ad.currency}</span></p>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px]" style={{ color: C.gray }}><MapPin size={10} />{ad.city}</span>
          <span className="text-[11px]" style={{ color: C.grayDim }}>{ad.time}</span>
        </div>
      </div>
    </button>
  );
}

// ---------- Splash ----------
// ---------- language switcher ----------
function LangSwitch({ style, className }) {
  const { lang, setLang, t } = useT();
  const order = ["ar", "fr", "en"];
  const cycle = () => {
    const next = order[(order.indexOf(lang) + 1) % order.length];
    setLang(next);
    toast(t("lang_changed") + " → " + LANGS[next].label);
  };
  return (
    <button onClick={cycle} className={className || "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"} style={style}>
      <Globe size={14} /> {LANGS[lang].label} <ChevronDown size={13} />
    </button>
  );
}

// ---------- language provider wrapper stub above ----------
function SplashScreen({ onDone }) {
  const { t } = useT();
  useEffect(() => {
    const timer = setTimeout(onDone, 1800);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden" style={{ background: "linear-gradient(180deg,#07111F 0%,#050C16 100%)" }}>
      <div className="flex flex-col items-center gap-3 z-10">
        <Logo size={64} markColor="#FFFFFF" />
        <p className="text-2xl font-extrabold" style={{ color: D.white }}>Mauri<span style={{ color: D.green }}>One</span></p>
        <p className="text-sm" style={{ color: D.gray }}>{t("tagline")}</p>
        <div className="w-40 h-1 rounded-full mt-4 relative overflow-hidden" style={{ background: D.border }}>
          <div className="absolute inset-y-0 right-0 rounded-full animate-pulse" style={{ width: "60%", background: `linear-gradient(90deg, ${D.blue}, ${D.green})` }} />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-40 opacity-40" style={{ background: `radial-gradient(ellipse at 50% 100%, ${hexToRgba(D.green, 0.25)}, transparent 70%)` }} />
    </div>
  );
}

// ---------- Onboarding ----------
const ORBIT = [
  { id: "realestate", x: 0, y: -128 },
  { id: "jobs", x: -112, y: -70 },
  { id: "cars", x: 112, y: -70 },
  { id: "phones", x: -112, y: 92 },
  { id: "services", x: 112, y: 92 },
  { id: "more", x: 0, y: 150 },
];

const ONBOARD_LABELS = { realestate: "cat_realestate", jobs: "cat_jobs", cars: "cat_cars", phones: "cat_shop", services: "cat_services", more: "cat_more" };
const ONBOARD_ICON = { realestate: HomeIcon, jobs: Briefcase, cars: Car, phones: ShoppingBag, services: Wrench, more: MoreHorizontal };
const ONBOARD_ICON_COLOR = { realestate: "#19C98A", jobs: "#19C98A", cars: "#19C98A", phones: "#A78BFA", services: "#19C98A", more: "#8A94A6" };

// deterministic pseudo-random particles for the glowing wave
const PARTICLES = Array.from({ length: 46 }).map((_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const r = seed / 233280;
  const seed2 = ((i + 7) * 4021 + 12345) % 233280;
  const r2 = seed2 / 233280;
  return { x: 4 + r * 92, y: 66 + r2 * 30, s: 1 + (i % 3), o: 0.25 + (i % 4) * 0.18 };
});

function OnboardingBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* base vertical gradient */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,#0A1830 0%,#081426 55%,#050D1B 100%)" }} />
      {/* teal glow rising from bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/2" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${hexToRgba(D.green, 0.22)}, transparent 70%)` }} />
      {/* city skyline silhouette */}
      <svg className="absolute inset-x-0 bottom-0 w-full" height="150" viewBox="0 0 430 150" preserveAspectRatio="none">
        <g fill={hexToRgba("#0C2036", 0.9)}>
          <rect x="6" y="70" width="26" height="80" /><rect x="34" y="92" width="20" height="58" />
          <rect x="60" y="55" width="18" height="95" /><rect x="82" y="80" width="24" height="70" />
          <rect x="112" y="100" width="18" height="50" /><rect x="300" y="88" width="22" height="62" />
          <rect x="326" y="64" width="18" height="86" /><rect x="348" y="96" width="22" height="54" />
          <rect x="374" y="52" width="16" height="98" /><rect x="392" y="82" width="26" height="68" />
        </g>
        {/* a couple of thin towers with a light dot */}
        <g stroke={hexToRgba(D.green, 0.4)} strokeWidth="1.5">
          <line x1="70" y1="30" x2="70" y2="55" /><line x1="382" y1="26" x2="382" y2="52" />
        </g>
        <circle cx="70" cy="30" r="2" fill={D.green} /><circle cx="382" cy="26" r="2" fill={D.green} />
      </svg>
      {/* glowing wave line */}
      <svg className="absolute inset-x-0 w-full" style={{ bottom: "18%" }} height="60" viewBox="0 0 430 60" preserveAspectRatio="none">
        <path d="M0,40 C90,10 150,55 220,32 C300,6 360,48 430,22" fill="none" stroke={hexToRgba(D.green, 0.55)} strokeWidth="1.5" />
      </svg>
      {/* particles */}
      {PARTICLES.map((p, i) => (
        <span key={i} className="absolute rounded-full" style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, background: i % 3 === 0 ? D.green : D.blue, opacity: p.o }} />
      ))}
    </div>
  );
}

function OnboardingScreen({ onStart, onLogin }) {
  const { t, lang, setLang, dir } = useT();
  const W = 300, H = 340, CX = W / 2, CY = H / 2;
  return (
    <div className="relative flex flex-col h-full px-6 pt-14 pb-6" style={{ background: D.bg }}>
      <OnboardingBackdrop />

      {/* scattered location pins */}
      <MapPin size={16} color={hexToRgba(D.blue, 0.55)} className="absolute z-10" style={{ top: "42%", left: "8%" }} />
      <MapPin size={16} color={hexToRgba(D.blue, 0.55)} className="absolute z-10" style={{ top: "40%", right: "9%" }} />

      <div className="flex justify-end mb-5 relative z-10">
        <LangSwitch style={{ border: `1px solid ${D.border}`, color: D.white, background: hexToRgba("#0A1830", 0.6) }} />
      </div>

      <div className="flex flex-col items-center gap-1.5 relative z-10">
        <Logo size={58} markColor="#FFFFFF" />
        <p className="text-2xl font-extrabold text-center mt-2" style={{ color: D.white }}>{t("welcome")}</p>
        <p className="text-3xl font-extrabold text-center -mt-1" style={{ color: D.white }}>Mauri<span style={{ color: D.green }}>One</span></p>
        <div className="flex items-center gap-2 my-1.5">
          <div className="h-px" style={{ width: 44, background: `linear-gradient(90deg, transparent, ${D.grayDim})` }} />
          <span className="rotate-45" style={{ width: 6, height: 6, background: D.blue, boxShadow: `0 0 6px ${D.blue}` }} />
          <div className="h-px" style={{ width: 44, background: `linear-gradient(270deg, transparent, ${D.grayDim})` }} />
        </div>
        <p className="text-base mb-2" style={{ color: D.gray }}>{t("tagline")}</p>
      </div>

      <div className="relative flex-1 flex items-center justify-center z-10 mt-4" style={{ maxHeight: H }}>
        <div className="relative" style={{ width: W, height: H }}>
          <svg width={W} height={H} className="absolute inset-0 pointer-events-none">
            {ORBIT.map((o) => {
              const ex = CX + o.x, ey = CY + o.y;
              const mx = (CX + ex) / 2, my = (CY + ey) / 2;
              return (
                <g key={o.id}>
                  <line x1={CX} y1={CY} x2={ex} y2={ey} stroke={hexToRgba(D.green, 0.28)} strokeWidth="1.2" strokeDasharray="2 5" />
                  <circle cx={mx} cy={my} r="1.6" fill={hexToRgba(D.green, 0.7)} />
                </g>
              );
            })}
          </svg>

          {/* phone mockup center */}
          <div className="absolute" style={{ left: CX, top: CY, transform: "translate(-50%,-50%)" }}>
            <div className="relative flex flex-col items-center justify-center" style={{ width: 96, height: 176, background: "#0A0F16", border: "3px solid #223247", borderRadius: 30, boxShadow: `0 0 34px ${hexToRgba(D.green, 0.25)}` }}>
              <div className="absolute top-2 w-9 h-1 rounded-full" style={{ background: "#223247" }} />
              <div className="flex flex-col items-center gap-1.5">
                <Logo size={26} markColor="#FFFFFF" />
                <span className="text-[11px] font-bold" style={{ color: D.white }}>MauriOne</span>
              </div>
            </div>
          </div>

          {ORBIT.map((o) => {
            const color = ONBOARD_ICON_COLOR[o.id];
            const Icon = ONBOARD_ICON[o.id];
            return (
              <div key={o.id} className="absolute flex flex-col items-center gap-1.5" style={{ left: CX + o.x, top: CY + o.y, transform: "translate(-50%,-50%)" }}>
                <div className="rounded-2xl flex items-center justify-center" style={{ width: 54, height: 54, background: hexToRgba(color === D.gray ? "#2A3546" : color, 0.12), border: `1.5px solid ${hexToRgba(color, 0.5)}`, boxShadow: `0 0 16px ${hexToRgba(color, 0.18)}` }}>
                  <Icon size={22} color={color} strokeWidth={2} />
                </div>
                <span className="text-xs font-medium" style={{ color: D.white }}>{t(ONBOARD_LABELS[o.id])}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 relative z-10">
        <button onClick={onStart} className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 text-base" style={{ background: D.green, color: "#07130E", boxShadow: `0 8px 24px ${hexToRgba(D.green, 0.35)}` }}>
          {t("start_now")} <ArrowLeft size={18} />
        </button>
        <button onClick={onLogin} className="w-full py-4 rounded-2xl font-bold text-base" style={{ border: `1px solid ${hexToRgba(D.green, 0.5)}`, color: D.white, background: hexToRgba("#0A1830", 0.4) }}>
          {t("login")}
        </button>
      </div>
    </div>
  );
}

// ---------- Auth ----------
function SocialButton({ label, symbol, color, onClick }) {
  return (
    <button onClick={onClick || (() => toast(label))} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl" style={{ border: `1px solid ${D.border}` }}>
      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black" style={{ background: color, color: "#0B0F14" }}>{symbol}</span>
      <span className="text-sm font-medium" style={{ color: D.white }}>{label}</span>
    </button>
  );
}

function AuthShell({ children, onBack }) {
  const { t, lang, setLang, dir } = useT();
  return (
    <div className="flex flex-col h-full px-6 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        {onBack ? (
          <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${D.border}` }}>
            <ArrowRight size={16} color={D.green} />
          </button>
        ) : <div />}
        <LangSwitch style={{ border: `1px solid ${D.border}`, color: D.gray }} />
      </div>
      <div className="flex flex-col items-center mb-6">
        <Logo size={56} markColor="#FFFFFF" />
      </div>
      {children}
    </div>
  );
}

function LoginScreen({ onLogin, onGoSignup, onBack, onGoogle }) {
  const { t, lang, setLang, dir } = useT();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  return (
    <AuthShell onBack={onBack}>
      <h2 className="text-xl font-bold text-center mb-1" style={{ color: D.white }}>{t("login")}</h2>
      <p className="text-sm text-center mb-6" style={{ color: D.gray }}>
        {t("login_subtitle")} <span style={{ color: D.green }}>MauriOne</span>
      </p>
      <div className="flex flex-col gap-3">
        <Field icon={User} value={id} onChange={setId} placeholder={t("phone_or_email")} />
        <Field icon={Lock} value={pw} onChange={setPw} placeholder={t("password")} type="password" />
        <button onClick={() => toast(t("reset_password_sent"))} className="text-sm text-left" style={{ color: D.green }}>{t("forgot_password")}</button>
        <button onClick={onLogin} className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 mt-1" style={{ background: D.green, color: "#07130E" }}>
          {t("login")} <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: D.border }} />
          <span className="text-xs" style={{ color: D.grayDim }}>{t("or")}</span>
          <div className="flex-1 h-px" style={{ background: D.border }} />
        </div>
        <SocialButton label={t("login_google")} symbol="G" color="#fff" onClick={onGoogle} />
        <SocialButton label={t("login_apple")} symbol="" color="#fff" />
        <button onClick={onGoSignup} className="text-sm text-center mt-2" style={{ color: D.gray }}>
          {t("no_account")} <span style={{ color: D.green, fontWeight: 700 }}>{t("create_account")}</span>
        </button>
      </div>
    </AuthShell>
  );
}

function SignupScreen({ onSignup, onGoLogin, onBack, onGoogle }) {
  const { t, lang, setLang, dir } = useT();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [agree, setAgree] = useState(false);
  return (
    <AuthShell onBack={onBack}>
      <h2 className="text-xl font-bold text-center mb-1" style={{ color: D.white }}>{t("create_account_title")}</h2>
      <p className="text-sm text-center mb-6" style={{ color: D.gray }}>
        {t("signup_subtitle")} <span style={{ color: D.green }}>MauriOne</span>
      </p>
      <div className="flex flex-col gap-3">
        <Field icon={User} value={name} onChange={setName} placeholder={t("full_name")} />
        <Field icon={Mail} value={email} onChange={setEmail} placeholder={t("email")} />
        <Field icon={Phone} value={phone} onChange={setPhone} placeholder={t("phone_optional")} />
        <Field icon={Lock} value={pw} onChange={setPw} placeholder={t("password")} type="password" />
        <Field icon={Lock} value={pw2} onChange={setPw2} placeholder={t("confirm_password")} type="password" />
        <button onClick={() => setAgree((a) => !a)} className="flex items-center gap-2 justify-end text-xs">
          <span style={{ color: D.gray }}>{t("agree_terms")}</span>
          <span className="w-4 h-4 rounded flex items-center justify-center" style={{ border: `1px solid ${D.green}`, background: agree ? D.green : "transparent" }}>
            {agree && <Check size={11} color="#07130E" />}
          </span>
        </button>
        <button onClick={onSignup} className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 mt-1" style={{ background: D.green, color: "#07130E" }}>
          {t("create_account")} <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 h-px" style={{ background: D.border }} />
          <span className="text-xs" style={{ color: D.grayDim }}>{t("or")}</span>
          <div className="flex-1 h-px" style={{ background: D.border }} />
        </div>
        <SocialButton label={t("signup_google")} symbol="G" color="#fff" onClick={onGoogle} />
        <SocialButton label={t("signup_apple")} symbol="" color="#fff" />
        <button onClick={onGoLogin} className="text-sm text-center mt-2" style={{ color: D.gray }}>
          {t("have_account")} <span style={{ color: D.green, fontWeight: 700 }}>{t("login")}</span>
        </button>
      </div>
    </AuthShell>
  );
}

function OtpScreen({ onVerify, onBack }) {
  const { t, lang, setLang, dir } = useT();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(56);
  const refs = useRef([]);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  return (
    <AuthShell onBack={onBack}>
      <h2 className="text-xl font-bold text-center mb-1" style={{ color: D.white }}>{t("otp_title")}</h2>
      <p className="text-sm text-center mb-1" style={{ color: D.gray }}>{t("otp_subtitle")}</p>
      <p className="text-sm text-center mb-5" style={{ color: D.gray }}>{t("otp_sent")} <span style={{ color: D.green }}>+222 45 67 89 xx</span></p>
      <div className="flex justify-center gap-2 mb-5" dir="ltr">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            maxLength={1}
            className="w-11 h-13 rounded-xl text-center text-lg font-bold outline-none"
            style={{ height: 52, background: "transparent", border: `1.5px solid ${d ? D.green : D.border}`, color: D.white }}
          />
        ))}
      </div>
      <p className="text-center text-sm mb-4" style={{ color: D.gray }}>
        {seconds > 0 ? `${t("resend_in")} 00:${seconds.toString().padStart(2, "0")}` : ""}
      </p>
      <button disabled={seconds > 0} onClick={() => setSeconds(56)} className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-3" style={{ border: `1px solid ${D.border}`, color: seconds > 0 ? D.grayDim : D.green }}>
        <RotateCcw size={15} /> {t("resend_code")}
      </button>
      <button onClick={onVerify} className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2" style={{ background: D.green, color: "#07130E" }}>
        {t("confirm_continue")} <ArrowLeft size={16} />
      </button>
    </AuthShell>
  );
}

// ---------- Home ----------
function HomeScreen({ ads, favorites, onToggleFav, onOpenAd, onSelectCategory, onGoSearch, onGoAdd, onOpenMenu, onOpenNotifs, onOpenMessages, notifCount, msgCount }) {
  const { t, lang, setLang, dir, theme, toggleTheme } = useT();
  const featured = ads.filter((a) => a.featured);
  const recent = [...ads].slice().reverse();
  const [slide, setSlide] = useState(0);

  return (
    <div className="pb-4">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onOpenMenu} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <Menu size={17} color={C.white} />
          </button>
          <button onClick={toggleTheme} aria-label="theme" className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            {theme === "dark" ? <Sun size={16} color={C.gold} /> : <Moon size={16} color={C.blue} />}
          </button>
        </div>
        <Logo size={30} withText textSize="text-lg" />
        <div className="flex items-center gap-2">
          <button onClick={onOpenNotifs} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <BadgeIcon count={notifCount}><Bell size={16} color={C.white} /></BadgeIcon>
          </button>
          <button onClick={onOpenMessages} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <BadgeIcon count={msgCount}><MessageCircle size={16} color={C.white} /></BadgeIcon>
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 flex gap-2">
        <button onClick={onGoSearch} className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ border: `1px solid ${C.border}` }}>
          <Search size={16} color={C.gray} />
          <span className="text-sm" style={{ color: C.gray }}>{t("search_placeholder")}</span>
        </button>
        <button onClick={onGoSearch} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ border: `1px solid ${C.border}` }}>
          <Filter size={16} color={C.green} />
        </button>
      </div>

      <div className="px-4 grid grid-cols-4 gap-y-4 pb-5 mo-cat-grid">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => onSelectCategory(c.id)} className="flex flex-col items-center gap-1.5">
            <CategoryIcon cat={c} size={20} box={52} active />
            <span className="text-[11px] text-center leading-tight" style={{ color: C.gray }}>{catLabel(c, lang)}</span>
          </button>
        ))}
      </div>

      {ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-8 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <ClipboardList size={28} color={C.grayDim} />
          </div>
          <p className="text-base font-bold" style={{ color: C.white }}>{t("home_empty")}</p>
          <p className="text-xs" style={{ color: C.grayDim }}>{t("home_empty_hint")}</p>
          <button onClick={onGoAdd} className="mt-1 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2" style={{ background: C.green, color: "#07130E" }}>
            <Plus size={16} /> {t("post_now")}
          </button>
        </div>
      ) : (
      <>
      <div className="px-4 flex items-center justify-between mb-2">
        <button onClick={onGoSearch} className="text-xs flex items-center gap-1" style={{ color: C.grayDim }}><ChevronLeft size={13} /> {t("view_all")}</button>
        <h2 className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.white }}>{t("featured_ads")} <span className="w-1 h-4 rounded-full inline-block" style={{ background: C.green }} /></h2>
      </div>
      <div
        className="px-4 flex gap-3 overflow-x-auto pb-2 snap-x"
        style={{ scrollbarWidth: "none" }}
        onScroll={(e) => setSlide(Math.round(e.target.scrollLeft / 160))}
      >
        {featured.map((ad) => (
          <div key={ad.id} className="w-40 shrink-0 snap-start">
            <AdCard ad={ad} isFav={favorites.has(ad.id)} onToggleFav={onToggleFav} onOpen={onOpenAd} />
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-1.5 pb-4">
        {featured.map((_, i) => (
          <span key={i} className="rounded-full transition-all" style={{ width: i === slide ? 16 : 6, height: 6, background: i === slide ? C.green : C.border }} />
        ))}
      </div>

      <div className="px-4 flex items-center justify-between mb-2">
        <button onClick={onGoSearch} className="text-xs flex items-center gap-1" style={{ color: C.grayDim }}><ChevronLeft size={13} /> {t("view_all")}</button>
        <h2 className="text-sm font-bold flex items-center gap-1.5" style={{ color: C.white }}>{t("latest_ads")} <span className="w-1 h-4 rounded-full inline-block" style={{ background: C.green }} /></h2>
      </div>
      <div className="px-4 flex flex-col mo-ad-rows">
        {recent.map((ad) => (
          <AdCard key={ad.id} ad={ad} isFav={favorites.has(ad.id)} onToggleFav={onToggleFav} onOpen={onOpenAd} variant="row" />
        ))}
      </div>
      </>
      )}
    </div>
  );
}

// ---------- Search ----------
function SearchScreen({ ads, favorites, onToggleFav, onOpenAd, initialCat }) {
  const { t, lang, setLang, dir } = useT();
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");   // النص المطبّق فعليًا بعد الضغط على بحث
  const [cat, setCat] = useState(initialCat && initialCat !== "all" ? initialCat : CATEGORIES[1].id);
  const [city, setCity] = useState("all");
  const [recent, setRecent] = useState(() => Store.get("maurione_recent_search", []) || []);
  const [showRecent, setShowRecent] = useState(false);

  const runSearch = (term) => {
    const val = (term !== undefined ? term : q).trim();
    setApplied(val);
    if (term !== undefined) setQ(term);
    if (val) {
      const next = [val, ...recent.filter((r) => r !== val)].slice(0, 8);
      setRecent(next);
      try { Store.set("maurione_recent_search", next); } catch (e) {}
    }
    setShowRecent(false);
  };
  const clearRecent = () => { setRecent([]); try { Store.set("maurione_recent_search", []); } catch (e) {} };

  const results = useMemo(() => {
    return ads.filter((a) => {
      const matchQ = applied === "" || (a.title && a.title.includes(applied)) || (a.desc && a.desc.includes(applied));
      const matchCat = cat === "all" || a.cat === cat;
      const matchCity = city === "all" || a.city === city;
      return matchQ && matchCat && matchCity;
    });
  }, [ads, applied, cat, city]);

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pb-1 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.white }}>{t("advanced_search")}</h1>
          <p className="text-xs" style={{ color: C.gray }}>{t("search_subtitle")}</p>
        </div>
        <button onClick={() => setShowRecent((v) => !v)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.gray }}>
          <Bookmark size={13} /> {t("saved")}
        </button>
      </div>

      {showRecent && (
        <div className="px-4 pb-2">
          <div className="rounded-xl p-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: C.white }}>{t("saved_searches")}</span>
              {recent.length > 0 && <button onClick={clearRecent} className="text-[11px]" style={{ color: C.red }}>{t("clear_all")}</button>}
            </div>
            {recent.length === 0 ? (
              <p className="text-xs text-center py-2" style={{ color: C.grayDim }}>{t("no_recent_search")}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button key={r} onClick={() => runSearch(r)} className="text-xs px-3 py-1.5 rounded-lg flex items-center gap-1" style={{ background: C.cardAlt, color: C.white }}>
                    <Clock size={11} color={C.gray} /> {r}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-4 pt-3 pb-3 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ border: `1px solid ${C.border}` }}>
          <Search size={16} color={C.gray} />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} placeholder={t("search_short")} className="bg-transparent outline-none text-sm w-full text-right" style={{ color: C.white }} />
          {q && <button onClick={() => { setQ(""); setApplied(""); }}><X size={14} color={C.gray} /></button>}
        </div>
        <button onClick={() => runSearch()} className="px-4 py-2.5 rounded-xl font-bold text-sm shrink-0" style={{ background: C.green, color: "#07130E" }}>{t("search_btn")}</button>
      </div>

      <div className="px-4 pb-2 text-sm font-bold" style={{ color: C.white }}>{t("choose_category")}</div>
      <div className="px-4 grid grid-cols-4 gap-y-3 pb-4">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className="flex flex-col items-center gap-1.5">
            <CategoryIcon cat={c} size={18} box={48} active={cat === c.id} />
            <span className="text-[10px] text-center" style={{ color: cat === c.id ? c.color : C.gray }}>{catLabel(c, lang)}</span>
          </button>
        ))}
      </div>

      <div className="px-4 flex gap-2 pb-3">
        <div className="flex-1 rounded-xl px-3 py-2.5" style={{ border: `1px solid ${C.border}` }}>
          <p className="text-[11px] mb-0.5" style={{ color: C.gray }}>{t("city")}</p>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="bg-transparent outline-none text-sm w-full" style={{ color: C.white }}>
            <option style={{ background: C.card }} value="all">{t("all_cities")}</option>
            {CITIES.map((c) => <option key={c} style={{ background: C.card }} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-1 rounded-xl px-3 py-2.5" style={{ border: `1px solid ${C.border}` }}>
          <p className="text-[11px] mb-0.5" style={{ color: C.gray }}>{t("sort")}</p>
          <select className="bg-transparent outline-none text-sm w-full" style={{ color: C.white }}>
            <option style={{ background: C.card }}>{t("sort_newest")}</option>
            <option style={{ background: C.card }}>{t("sort_cheapest")}</option>
            <option style={{ background: C.card }}>{t("sort_expensive")}</option>
          </select>
        </div>
      </div>

      {(CATEGORY_FIELDS[cat] || []).filter((f) => f.type === "select").length > 0 && (
        <div className="px-4 pb-3">
          <div className="rounded-xl p-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} color={C.green} />
              <p className="text-sm font-bold" style={{ color: C.white }}>{t("filters_of")} {catLabel(CATEGORIES.find((c) => c.id === cat), lang)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(CATEGORY_FIELDS[cat] || []).filter((f) => f.type === "select").map((f) => (
                <div key={f.key}>
                  <label className="text-[11px] mb-1 block" style={{ color: C.gray }}>{fieldLabel(f.key, lang)}</label>
                  <select className="w-full rounded-xl px-3 py-2 text-sm outline-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }}>
                    <option style={{ background: C.card }}>{t("all")}</option>
                    {f.options.map((o) => <option key={o} style={{ background: C.card }}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 pb-2 text-xs" style={{ color: C.gray }}>{results.length} {t("results")}</div>
      <div className="px-4 grid grid-cols-2 gap-3 mo-search-grid">
        {results.map((ad) => (
          <AdCard key={ad.id} ad={ad} isFav={favorites.has(ad.id)} onToggleFav={onToggleFav} onOpen={onOpenAd} />
        ))}
        {results.length === 0 && <p className="col-span-2 text-center text-sm py-10" style={{ color: C.grayDim }}>{t("no_results")}</p>}
      </div>
    </div>
  );
}

// ---------- Ad details ----------
function AdDetailsScreen({ ad, isFav, onToggleFav, onBack, ads, onOpenAd, onDelete }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const { t, lang, setLang, dir } = useT();
  const [toast, setToast] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [fullView, setFullView] = useState(false);
  const [rating, setRating] = useState(false);
  const [rateStars, setRateStars] = useState(0);
  const [rateText, setRateText] = useState("");
  const [showFull, setShowFull] = useState(false);
  const [showSeller, setShowSeller] = useState(false);
  const fireToast = (m) => { setToast(m); setTimeout(() => setToast(""), 1600); };
  const cat = CATEGORIES.find((c) => c.id === ad.cat);
  const gallery = ad.images && ad.images.length > 0 ? ad.images : [];
  const totalImgs = gallery.length;
  const similar = ads.filter((a) => a.cat === ad.cat && a.id !== ad.id).slice(0, 4);
  const sellerAds = ads.filter((a) => a.ownerId && a.ownerId === ad.ownerId);

  return (
    <div className="pb-28 relative">
      <TopBar
        onBack={onBack}
        title={null}
        right={
          <div className="flex items-center gap-2">
            <Logo size={26} withText textSize="text-base" />
          </div>
        }
      />
      <div className="flex items-center justify-between px-4 -mt-1 pb-2">
        <span />
        <div className="flex gap-2">
          {onDelete && (
            <button onClick={() => setConfirmDel(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.red}` }}><X size={15} color={C.red} /></button>
          )}
          <button onClick={async () => { const url = `https://maurione-web.vercel.app`; const shareData = { title: ad.title, text: `${ad.title} - ${ad.price} ${ad.currency || ""}`, url }; try { if (navigator.share) { await navigator.share(shareData); } else { await navigator.clipboard.writeText(`${ad.title} - ${url}`); fireToast(t("copied_share")); } } catch (e) {} }} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${C.border}` }}><Share2 size={14} color={C.white} /></button>
          <button onClick={() => onToggleFav(ad.id)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ border: `1px solid ${isFav ? C.red : C.border}` }}><Heart size={14} color={isFav ? C.red : C.white} fill={isFav ? C.red : "none"} /></button>
        </div>
      </div>

      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setConfirmDel(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full rounded-2xl p-5 flex flex-col gap-4" style={{ maxWidth: 320, background: C.card, border: `1px solid ${C.border}` }}>
            <p className="text-sm font-bold text-center" style={{ color: C.white }}>{t("delete_confirm")}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ border: `1px solid ${C.border}`, color: C.white }}>{t("cancel")}</button>
              <button onClick={() => { setConfirmDel(false); onDelete(ad.id); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.red, color: "#fff" }}>{t("confirm")}</button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex items-center justify-center mx-4 rounded-2xl overflow-hidden" style={{ height: 300, background: C.cardAlt }}>
        {totalImgs > 0 ? (
          <>
            <img src={gallery[imgIdx % totalImgs]} alt="" onClick={() => setFullView(true)} className="w-full h-full object-cover cursor-pointer" />
            {totalImgs > 1 && (
              <>
                <button onClick={() => setImgIdx((i) => (i - 1 + totalImgs) % totalImgs)} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(7,17,31,0.7)" }}>
                  <ChevronRight size={18} color="#fff" />
                </button>
                <button onClick={() => setImgIdx((i) => (i + 1) % totalImgs)} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(7,17,31,0.7)" }}>
                  <ChevronLeft size={18} color="#fff" />
                </button>
              </>
            )}
            <span className="absolute bottom-2 left-2 text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(7,17,31,0.75)", color: "#fff" }} dir="ltr">{(imgIdx % totalImgs) + 1} / {totalImgs}</span>
          </>
        ) : (
          <CategoryIcon cat={cat} size={46} box={100} active />
        )}
      </div>

      {fullView && totalImgs > 0 && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.94)" }} onClick={() => setFullView(false)}>
          <button onClick={() => setFullView(false)} className="absolute top-5 left-5 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: "rgba(255,255,255,0.12)" }}>
            <X size={20} color="#fff" />
          </button>
          <img src={gallery[imgIdx % totalImgs]} alt="" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          {totalImgs > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + totalImgs) % totalImgs); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.14)" }}>
                <ChevronRight size={22} color="#fff" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % totalImgs); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.14)" }}>
                <ChevronLeft size={22} color="#fff" />
              </button>
              <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm px-3 py-1 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.14)", color: "#fff" }} dir="ltr">{(imgIdx % totalImgs) + 1} / {totalImgs}</span>
            </>
          )}
        </div>
      )}

      <div className="px-4 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ background: C.card, color: C.green, border: `1px solid ${C.green}` }}>{ad.condition}</span>
        </div>
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-bold flex-1" style={{ color: C.white }}>{ad.title}</h2>
          <p className="text-lg font-black shrink-0" style={{ color: C.green }}>{ad.price}<span className="text-xs font-normal" style={{ color: C.gray }}> {ad.currency}</span></p>
        </div>
        <div className="flex items-center gap-4 text-xs mb-4" style={{ color: C.grayDim }}>
          <span className="flex items-center gap-1"><Calendar size={12} />{ad.time}</span>
          <span className="flex items-center gap-1"><Eye size={12} />{ad.views} {t("views")}</span>
          <span className="flex items-center gap-1"><MapPin size={12} />{ad.city}</span>
        </div>

        <div className="rounded-xl p-3 mb-4 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex-1">
            <p className="text-xs flex items-center gap-1 mb-1" style={{ color: C.gray }}><MapPin size={12} color={C.green} />{t("location")}</p>
            <p className="text-sm font-medium" style={{ color: C.white }}>{ad.city}</p>
            <p className="text-xs" style={{ color: C.grayDim }}>{ad.area}</p>
          </div>
          <div className="w-24 h-16 rounded-lg flex items-center justify-center shrink-0" style={{ background: C.cardAlt }}>
            <MapPin size={20} color={C.green} />
          </div>
          <button onClick={() => { const url = (ad.lat && ad.lng) ? `https://www.google.com/maps?q=${ad.lat},${ad.lng}` : `https://www.google.com/maps/search/${encodeURIComponent((ad.city || "") + " " + (ad.area || "") + " Mauritania")}`; window.open(url, "_blank"); }} className="text-xs px-2 py-2 rounded-lg font-bold shrink-0" style={{ border: `1px solid ${C.border}`, color: C.white }}>{t("view_map")}</button>
        </div>

        <div className="rounded-xl p-3 mb-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <p className="text-sm font-bold mb-2" style={{ color: C.white }}>{t("description")}</p>
          <p className={`text-sm leading-relaxed ${showFull ? "" : "line-clamp-3"}`} style={{ color: C.gray }}>{ad.desc}</p>
          <button onClick={() => setShowFull((s) => !s)} className="text-xs font-bold mt-1" style={{ color: C.green }}>{showFull ? t("show_less") : t("show_more")} <ChevronDown size={11} className="inline" /></button>
        </div>

        {ad.specs?.length > 0 && (
          <div className="rounded-xl p-3 mb-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <p className="text-sm font-bold mb-3" style={{ color: C.white }}>{t("specifications")}</p>
            <div className="grid grid-cols-3 gap-y-3">
              {ad.specs.map((sp, i) => {
                const k = Array.isArray(sp) ? sp[0] : sp.label;
                const v = Array.isArray(sp) ? sp[1] : sp.value;
                const iconRef = Array.isArray(sp) ? sp[2] : sp.icon;
                const SpecIcon = typeof iconRef === "function" ? iconRef : (SPEC_ICON[iconRef] || ClipboardList);
                return (
                  <div key={i} className="flex flex-col items-center text-center gap-1">
                    <SpecIcon size={16} color={C.green} />
                    <p className="text-[11px]" style={{ color: C.grayDim }}>{k}</p>
                    <p className="text-xs font-medium" style={{ color: C.white }}>{v}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="rounded-xl p-3 mb-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: C.cardAlt }}>
              <User size={19} color={C.gray} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold flex items-center gap-1" style={{ color: C.white }}>{ad.seller}{ad.verified && <CheckCircle2 size={13} color={C.green} />}</p>
              <p className="text-xs flex items-center gap-1" style={{ color: C.grayDim }}><Star size={11} color={C.gold} fill={C.gold} />{ad.rating} ({ad.reviews})</p>
            </div>
            <button onClick={() => setShowSeller(true)} className="text-xs px-3 py-2 rounded-lg font-bold shrink-0" style={{ border: `1px solid ${C.green}`, color: C.green }}>{t("view_profile")}</button>
          </div>
          <button onClick={() => { setRateStars(0); setRateText(""); setRating(true); }} className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: hexToRgba(C.gold, 0.14), color: C.gold, border: `1px solid ${hexToRgba(C.gold, 0.4)}` }}>
            <Star size={14} /> {t("rate_seller")}
          </button>
        </div>

        {showSeller && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setShowSeller(false)}>
            <div onClick={(e) => e.stopPropagation()} className="w-full rounded-t-3xl p-5 flex flex-col gap-3" style={{ maxWidth: 420, maxHeight: "85vh", overflowY: "auto", background: C.bg, borderTop: `1px solid ${C.border}` }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: C.border }} />
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: C.cardAlt }}>
                  {ad.sellerAvatar ? <img src={ad.sellerAvatar} alt="" className="w-full h-full object-cover" /> : <User size={26} color={C.gray} />}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold flex items-center gap-1" style={{ color: C.white }}>{ad.seller}{ad.verified && <CheckCircle2 size={15} color={C.green} />}</p>
                  {ad.sellerUsername && <p className="text-xs" style={{ color: C.green }}>@{ad.sellerUsername}</p>}
                  <p className="text-xs flex items-center gap-1 mt-1" style={{ color: C.gray }}><Star size={12} color={C.gold} fill={C.gold} />{ad.rating || 0} ({ad.reviews || 0} {t("reviews_count")}) · {sellerAds.length} {t("ads")}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-1">
                <button onClick={() => { const p = (ad.phone || "").replace(/[^0-9+]/g, ""); if (p) window.location.href = `tel:${p}`; }} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: C.green, color: "#07130E" }}><Phone size={14} /> {t("call")}</button>
                <button onClick={() => { let p = (ad.phone || "").replace(/[^0-9]/g, ""); if (p.startsWith("0")) p = p.slice(1); if (p && !p.startsWith("222")) p = "222" + p; if (p) window.open(`https://wa.me/${p}`, "_blank"); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: "#22C55E", color: "#06210F" }}><Send size={14} /> {t("whatsapp")}</button>
              </div>

              <p className="text-sm font-bold mt-2" style={{ color: C.white }}>{t("seller_ads")} ({sellerAds.length})</p>
              <div className="flex flex-col gap-2">
                {sellerAds.map((a) => (
                  <button key={a.id} onClick={() => { setShowSeller(false); onOpenAd(a); }} className="flex items-center gap-3 p-2 rounded-xl text-right" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center shrink-0" style={{ background: C.cardAlt }}>
                      {a.images && a.images[0] ? <img src={a.images[0]} alt="" className="w-full h-full object-cover" /> : <CategoryIcon cat={CATEGORIES.find((c) => c.id === a.cat)} size={16} box={56} active />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: C.white }}>{a.title}</p>
                      <p className="text-xs font-bold" style={{ color: C.green }}>{a.price} {a.currency}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button onClick={() => setShowSeller(false)} className="w-full py-3 rounded-xl text-sm font-bold mt-1" style={{ border: `1px solid ${C.border}`, color: C.white }}>{t("close")}</button>
            </div>
          </div>
        )}

        {rating && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setRating(false)}>
            <div onClick={(e) => e.stopPropagation()} className="w-full rounded-t-3xl p-5 flex flex-col gap-3" style={{ maxWidth: 420, background: C.card, borderTop: `1px solid ${C.border}` }}>
              <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: C.border }} />
              <p className="text-base font-bold text-center" style={{ color: C.white }}>{t("rate_seller")}</p>
              <p className="text-xs text-center" style={{ color: C.gray }}>{ad.seller}</p>
              <p className="text-xs text-center mt-1" style={{ color: C.gray }}>{t("your_rating")}</p>
              <div className="flex items-center justify-center gap-2 my-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} onClick={() => setRateStars(i)}>
                    <Star size={34} color={C.gold} fill={i <= rateStars ? C.gold : "none"} />
                  </button>
                ))}
              </div>
              <textarea value={rateText} onChange={(e) => setRateText(e.target.value)} rows={3} placeholder={t("write_review")} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }} />
              <div className="flex gap-2 mt-1">
                <button onClick={() => setRating(false)} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ border: `1px solid ${C.border}`, color: C.white }}>{t("cancel")}</button>
                <button onClick={() => { if (rateStars === 0) { fireToast(t("select_rating")); return; } setRating(false); fireToast(t("review_submitted")); }} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: C.green, color: "#07130E" }}>{t("submit_review")}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {similar.length > 0 && (
        <div className="pt-3">
          <div className="px-4 flex items-center justify-between mb-2">
            <button onClick={() => toast(t("view_all_similar"))} className="text-xs" style={{ color: C.grayDim }}>عرض الكل</button>
            <h3 className="text-sm font-bold" style={{ color: C.white }}>{t("similar_ads")}</h3>
          </div>
          <div className="px-4 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {similar.map((a) => (
              <div key={a.id} className="w-36 shrink-0">
                <AdCard ad={a} isFav={false} onToggleFav={() => {}} onOpen={onOpenAd} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 px-3 py-3 flex gap-2 mo-nav" style={{ margin: "0 auto", background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <button onClick={() => onToggleFav(ad.id)} className="w-12 py-3 rounded-xl flex items-center justify-center shrink-0" style={{ border: `1px solid ${C.red}` }}>
          <Heart size={16} color={C.red} fill={isFav ? C.red : "none"} />
        </button>
        <button onClick={() => { const p = (ad.phone || "").replace(/[^0-9+]/g, ""); if (p) window.location.href = `tel:${p}`; else fireToast(t("calling")); }} className="flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 font-bold text-sm" style={{ background: C.green, color: "#07130E" }}>
          <Phone size={14} /> {t("call")}
        </button>
        <button onClick={() => fireToast(t("open_chat"))} className="flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 font-bold text-sm" style={{ border: `1px solid ${C.blue}`, color: C.blue }}>
          <MessageCircle size={14} /> {t("chat")}
        </button>
        <button onClick={() => { let p = (ad.phone || "").replace(/[^0-9]/g, ""); if (p.startsWith("0")) p = p.slice(1); if (p && !p.startsWith("222")) p = "222" + p; const msg = encodeURIComponent(`مرحبًا، أنا مهتم بإعلانك: ${ad.title}`); if (p) window.open(`https://wa.me/${p}?text=${msg}`, "_blank"); else fireToast(t("opening_whatsapp")); }} className="flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 font-bold text-sm" style={{ background: "#22C55E", color: "#06210F" }}>
          <Send size={14} /> {t("whatsapp")}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-medium z-40" style={{ background: C.card, color: C.white, border: `1px solid ${C.border}` }}>{toast}</div>
      )}
    </div>
  );
}

// ---------- Add ad ----------
const STEPS = ["step_details", "step_photos", "step_location", "step_extra", "step_review"];
const AD_TYPES = [{ key: "type_sale" }, { key: "type_rent" }, { key: "type_wanted" }, { key: "type_other" }];
const CONDITIONS = [{ key: "cond_new" }, { key: "cond_excellent" }, { key: "cond_good" }];

// Category-specific fields shown in the "publish ad" details step.
// type: "text" | "number" | "select"; select fields carry an options array.
const CATEGORY_FIELDS = {
  cars: [
    { key: "brand", label: "الشركة", type: "select", options: ["تويوتا", "هيونداي", "كيا", "نيسان", "مرسيدس", "أخرى"] },
    { key: "model", label: "الموديل", type: "text", placeholder: "مثال: كورولا" },
    { key: "year", label: "سنة الصنع", type: "select", options: Array.from({ length: 26 }, (_, i) => String(2025 - i)) },
    { key: "mileage", label: "العداد (كم)", type: "number", placeholder: "مثال: 64000" },
    { key: "gearbox", label: "ناقل الحركة", type: "select", options: ["أوتوماتيك", "يدوي"] },
    { key: "fuel", label: "نوع الوقود", type: "select", options: ["بنزين", "ديزل", "كهرباء", "هجين"] },
    { key: "color", label: "اللون", type: "text", placeholder: "مثال: أسود" },
  ],
  realestate: [
    { key: "propType", label: "نوع العقار", type: "select", options: ["منزل", "شقة", "فيلا", "أرض", "محل", "مكتب", "مستودع", "مزرعة"] },
    { key: "area", label: "المساحة (م²)", type: "number", placeholder: "مثال: 120" },
    { key: "rooms", label: "عدد الغرف", type: "number", placeholder: "مثال: 3" },
    { key: "baths", label: "عدد الحمامات", type: "number", placeholder: "مثال: 2" },
    { key: "floor", label: "الطابق", type: "text", placeholder: "مثال: الأول" },
  ],
  phones: [
    { key: "brand", label: "العلامة", type: "select", options: ["Apple", "Samsung", "Xiaomi", "Huawei", "Infinix", "أخرى"] },
    { key: "model", label: "الموديل", type: "text", placeholder: "مثال: iPhone 14 Pro" },
    { key: "storage", label: "السعة", type: "select", options: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
    { key: "battery", label: "حالة البطارية", type: "text", placeholder: "مثال: 91%" },
    { key: "color", label: "اللون", type: "text", placeholder: "مثال: أسود" },
    { key: "warranty", label: "الضمان", type: "select", options: ["يوجد ضمان", "بدون ضمان"] },
  ],
  jobs: [
    { key: "company", label: "اسم الشركة", type: "text", placeholder: "مثال: شركة الأمل" },
    { key: "role", label: "المسمى الوظيفي", type: "text", placeholder: "مثال: محاسب" },
    { key: "worktime", label: "نوع الدوام", type: "select", options: ["دوام كامل", "دوام جزئي", "عن بُعد", "تدريب"] },
    { key: "experience", label: "الخبرة المطلوبة", type: "select", options: ["بدون خبرة", "سنة", "سنتان+", "5 سنوات+"] },
    { key: "qualification", label: "المؤهل", type: "text", placeholder: "مثال: باكالوريا+" },
  ],
  clinics: [
    { key: "clinicName", label: "اسم العيادة", type: "text", placeholder: "مثال: عيادة النور" },
    { key: "doctor", label: "اسم الطبيب", type: "text", placeholder: "مثال: د. سيدي محمد" },
    { key: "specialty", label: "التخصص", type: "select", options: ["أسنان", "عام", "جلدية", "أطفال", "عيون", "نساء وولادة", "أخرى"] },
    { key: "hours", label: "أوقات العمل", type: "text", placeholder: "مثال: 9ص - 6م" },
    { key: "fee", label: "سعر الكشف", type: "number", placeholder: "مثال: 3000" },
  ],
  services: [
    { key: "serviceType", label: "نوع الخدمة", type: "select", options: ["كهرباء", "سباكة", "تنظيف", "تكييف", "نجارة", "دهان", "نقل أثاث", "أخرى"] },
    { key: "experience", label: "سنوات الخبرة", type: "number", placeholder: "مثال: 8" },
    { key: "workAreas", label: "مناطق العمل", type: "text", placeholder: "مثال: نواكشوط والضواحي" },
    { key: "priceRange", label: "السعر التقريبي", type: "text", placeholder: "مثال: حسب المهمة" },
  ],
  more: [
    { key: "itemType", label: "نوع المنتج", type: "text", placeholder: "مثال: أثاث، ملابس..." },
    { key: "brand", label: "الماركة", type: "text", placeholder: "اختياري" },
  ],
};

// Which categories use "price" vs a different primary field, and whether "condition" applies
const NO_CONDITION_CATS = ["jobs", "clinics", "services"];

// icon per dynamic field key, used when rendering a published ad's specs
const SPEC_ICON = {
  brand: Car, model: Car, year: Calendar, mileage: Gauge, gearbox: Cog, fuel: Fuel, color: Palette,
  propType: Building2, area: Gauge, rooms: Building2, baths: Building2, floor: Building2,
  storage: Smartphone, battery: Gauge, warranty: ShieldCheck,
  company: Briefcase, role: Briefcase, worktime: Clock, experience: Briefcase, qualification: Briefcase,
  clinicName: Stethoscope, doctor: User, specialty: Stethoscope, hours: Clock, fee: ClipboardList,
  serviceType: Wrench, workAreas: MapPin, priceRange: ClipboardList,
  itemType: ClipboardList,
};

function StepDots({ step }) {
  const { t } = useT();
  return (
    <div className="flex items-center justify-between px-4 pb-4">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: i <= step ? C.green : "transparent", border: `1.5px solid ${i <= step ? C.green : C.border}`, color: i <= step ? "#07130E" : C.grayDim }}
            >
              {i < step ? <Check size={13} /> : i + 1}
            </div>
            <span className="text-[9px] text-center" style={{ color: i <= step ? C.green : C.grayDim, maxWidth: 52 }}>{t(s)}</span>
          </div>
          {i < STEPS.length - 1 && <div className="flex-1 h-px mx-0.5 -mt-4" style={{ background: i < step ? C.green : C.border }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function DynamicField({ field, value, onChange }) {
  const { t, lang } = useT();
  const base = { border: `1px solid ${C.border}`, color: C.white, background: "transparent" };
  const OTHER = ["أخرى", "Autre", "Other"];
  // هل القيمة الحالية قيمة حرة (ليست من الخيارات)؟
  const isCustom = field.type === "select" && value && !field.options.includes(value);
  const [otherMode, setOtherMode] = React.useState(isCustom);
  return (
    <div>
      <label className="text-xs mb-1 block" style={{ color: C.gray }}>{fieldLabel(field.key, lang)}</label>
      {field.type === "select" ? (
        <>
          <select
            value={otherMode ? "__other__" : (value || "")}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "__other__" || OTHER.includes(v)) { setOtherMode(true); onChange(""); }
              else { setOtherMode(false); onChange(v); }
            }}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-right"
            style={base}
          >
            <option value="" style={{ background: C.card }}>{t("choose")}</option>
            {field.options.filter((o) => !OTHER.includes(o)).map((o) => <option key={o} value={o} style={{ background: C.card }}>{o}</option>)}
            <option value="__other__" style={{ background: C.card }}>{t("type_other")}</option>
          </select>
          {otherMode && (
            <input
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={t("type_other_placeholder")}
              className="w-full mt-2 rounded-xl px-3 py-2.5 text-sm outline-none text-right"
              style={base}
            />
          )}
        </>
      ) : (
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          inputMode={field.type === "number" ? "numeric" : "text"}
          className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-right"
          style={base}
        />
      )}
    </div>
  );
}

function AddAdScreen({ onPublish, onExit }) {
  const { t, lang, setLang, dir } = useT();
  const [step, setStep] = useState(0);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({ cat: "cars", adType: "type_sale", title: "", price: "", condition: "cond_new", desc: "", city: "", area: "", phone: "", whatsapp: true, images: [], specs: {}, lat: null, lng: null });
  const [done, setDone] = useState(false);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const updateSpec = (k, v) => setForm((f) => ({ ...f, specs: { ...f.specs, [k]: v } }));
  const setCategory = (id) => setForm((f) => ({ ...f, cat: id, specs: {} })); // reset specs when switching category
  const fields = CATEGORY_FIELDS[form.cat] || [];
  const showCondition = !NO_CONDITION_CATS.includes(form.cat);

  const missingForStep = () => {
    if (step === 0) {
      if (!form.title) return t("need_title");
      if (!form.price) return t("need_price");
      if (!form.desc) return t("need_desc");
    }
    if (step === 2 && !form.city) return t("need_city");
    if (step === 3 && !form.phone) return t("need_phone");
    return null;
  };
  const handleNext = async () => {
    const missing = missingForStep();
    if (missing) { toast(missing); return; }
    if (step === 4) {
      setPublishing(true);
      const ok = await onPublish(form);
      setPublishing(false);
      if (ok) setDone(true);
      return;
    }
    setStep((s) => s + 1);
  };
  const canNext = !missingForStep();

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center px-8 text-center gap-3" style={{ minHeight: 520 }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: C.green }}><Check size={28} color="#07130E" /></div>
        <p className="text-lg font-bold" style={{ color: C.white }}>{t("ad_published")}</p>
        <p className="text-sm" style={{ color: C.gray }}>{t("ad_published_hint")}</p>
        <div className="flex flex-col gap-2 mt-2 w-full max-w-xs">
          <button onClick={onExit} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: C.green, color: "#07130E" }}>
            {t("back_home")}
          </button>
          <button onClick={() => { setDone(false); setStep(0); setForm({ cat: "cars", adType: "type_sale", title: "", price: "", condition: "cond_new", desc: "", city: "", area: "", phone: "", whatsapp: true, images: [], specs: {}, lat: null, lng: null }); }} className="w-full py-3 rounded-xl font-bold text-sm" style={{ border: `1px solid ${C.border}`, color: C.white }}>
            {t("post_another")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "100vh" }}>
      <TopBar
        onBack={onExit}
        title={null}
        right={<button onClick={() => toast(t("draft_saved"))} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.gray }}>{t("draft")} <ClipboardList size={13} /></button>}
      />
      <div className="px-4 pt-1 pb-3">
        <h1 className="text-lg font-bold" style={{ color: C.white }}>{t("publish_new_ad")}</h1>
        <p className="text-xs" style={{ color: C.gray }}>{t("add_details_hint")}</p>
      </div>
      <StepDots step={step} />

      <div className="px-4 flex flex-col gap-4 flex-1 pb-4">
        {step === 0 && (
          <>
            <p className="text-sm font-bold" style={{ color: C.white }}>{t("choose_category")}</p>
            <div className="grid grid-cols-4 gap-3 -mt-2">
              {CATEGORIES.map((c) => (
                <button key={c.id} onClick={() => setCategory(c.id)} className="flex flex-col items-center gap-1.5">
                  <CategoryIcon cat={c} size={17} box={44} active={form.cat === c.id} />
                  <span className="text-[10px]" style={{ color: form.cat === c.id ? c.color : C.gray }}>{catLabel(c, lang)}</span>
                </button>
              ))}
            </div>

            <p className="text-sm font-bold mt-1" style={{ color: C.white }}>{t("ad_details")}</p>
            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}><span style={{ color: C.red }}>*</span> {t("ad_title")}</label>
              <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder={t("ad_title_ph")} maxLength={60} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }} />
              <p className="text-[10px] text-left mt-1" style={{ color: C.grayDim }}>{form.title.length}/60</p>
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}><span style={{ color: C.red }}>*</span> {t("ad_type")}</label>
              <div className="flex gap-2">
                {AD_TYPES.map((at) => <Chip key={at.key} active={form.adType === at.key} onClick={() => update("adType", at.key)}>{t(at.key)}</Chip>)}
              </div>
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}><span style={{ color: C.red }}>*</span> {form.cat === "jobs" ? "الراتب" : form.cat === "clinics" ? "سعر الكشف" : "السعر"}</label>
              <div className="flex gap-2">
                <div className="rounded-xl px-3 py-2.5 flex items-center gap-1 text-sm" style={{ border: `1px solid ${C.border}`, color: C.white }}>{t("currency")} <ChevronDown size={13} /></div>
                <input value={form.price} onChange={(e) => update("price", e.target.value)} placeholder={t("enter_price")} inputMode="numeric" className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }} />
              </div>
            </div>

            {fields.length > 0 && (
              <div className="rounded-xl p-3 flex flex-col gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2">
                  <CategoryIcon cat={CATEGORIES.find((c) => c.id === form.cat)} size={15} box={30} active />
                  <p className="text-sm font-bold" style={{ color: C.white }}>{t("details_of")} {catLabel(CATEGORIES.find((c) => c.id === form.cat), lang)}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {fields.map((f) => (
                    <DynamicField key={f.key} field={f} value={form.specs[f.key]} onChange={(v) => updateSpec(f.key, v)} />
                  ))}
                </div>
              </div>
            )}

            {showCondition && (
              <div>
                <label className="text-xs mb-1 block" style={{ color: C.gray }}><span style={{ color: C.red }}>*</span> {t("product_condition")}</label>
                <div className="flex gap-2 flex-wrap">
                  {CONDITIONS.map((c) => <Chip key={c.key} active={form.condition === c.key} onClick={() => update("condition", c.key)}>{t(c.key)}</Chip>)}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}><span style={{ color: C.red }}>*</span> {t("description")}</label>
              <textarea value={form.desc} onChange={(e) => update("desc", e.target.value)} rows={4} maxLength={1000} placeholder={t("desc_ph")} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }} />
              <p className="text-[10px] text-left mt-1" style={{ color: C.grayDim }}>{form.desc.length}/1000</p>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm font-bold" style={{ color: C.white }}>{t("ad_photos")}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                const room = 8 - form.images.length;
                const picked = files.slice(0, Math.max(room, 0));
                e.target.value = "";
                for (const file of picked) {
                  setUploading((n) => n + 1);
                  try {
                    const url = await uploadToCloudinary(file);   // رفع حقيقي للسحابة
                    setForm((f) => (f.images.length >= 8 ? f : { ...f, images: [...f.images, url] }));
                  } catch (err) {
                    toast("تعذّر رفع الصورة");
                  } finally {
                    setUploading((n) => Math.max(0, n - 1));
                  }
                }
              }}
            />
            <div className="grid grid-cols-3 gap-3">
              {form.images.map((src, i) => (
                <div key={i} className="aspect-square rounded-xl relative overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && (
                    <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: C.green, color: "#07130E" }}>{t("cover")}</span>
                  )}
                  <button
                    onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                    className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(7,17,31,0.8)" }}
                  >
                    <X size={11} color="#fff" />
                  </button>
                </div>
              ))}
              {uploading > 0 && (
                <div className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1" style={{ border: `1px dashed ${C.green}`, background: hexToRgba(C.green, 0.06) }}>
                  <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: C.green, borderTopColor: "transparent" }} />
                  <span className="text-[10px]" style={{ color: C.green }}>جارٍ الرفع...</span>
                </div>
              )}
              {form.images.length + uploading < 8 && (
                <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1" style={{ border: `1px dashed ${C.border}` }}>
                  <Camera size={18} color={C.gray} />
                  <span className="text-[10px]" style={{ color: C.gray }}>{t("add_photo")}</span>
                </button>
              )}
            </div>
            <p className="text-xs" style={{ color: C.grayDim }}>{t("photos_hint")}</p>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm font-bold" style={{ color: C.white }}>{t("location")}</p>
            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}><span style={{ color: C.red }}>*</span> {t("city")}</label>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => <Chip key={c} active={form.city === c} onClick={() => update("city", c)}>{c}</Chip>)}
              </div>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}>{t("neighborhood")}</label>
              <input value={form.area} onChange={(e) => update("area", e.target.value)} placeholder={t("neighborhood_ph")} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}>{t("pin_location")}</label>
              <button
                onClick={() => {
                  if (!navigator.geolocation) { toast(t("geo_unsupported")); return; }
                  setLocating(true);
                  navigator.geolocation.getCurrentPosition(
                    (pos) => { update("lat", pos.coords.latitude); update("lng", pos.coords.longitude); setLocating(false); toast(t("location_set")); },
                    (err) => { setLocating(false); toast(t("geo_denied")); },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
                className="w-full rounded-xl h-24 flex flex-col items-center justify-center gap-1.5"
                style={{ background: (form.lat && form.lng) ? hexToRgba(C.green, 0.1) : C.card, border: `1px solid ${(form.lat && form.lng) ? C.green : C.border}` }}
              >
                {locating ? (
                  <><div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: C.green, borderTopColor: "transparent" }} /><span className="text-xs" style={{ color: C.green }}>{t("locating")}</span></>
                ) : (form.lat && form.lng) ? (
                  <><CheckCircle2 size={22} color={C.green} /><span className="text-xs font-bold" style={{ color: C.green }}>{t("location_set")}</span><span className="text-[10px]" style={{ color: C.grayDim }}>{form.lat.toFixed(4)}, {form.lng.toFixed(4)}</span></>
                ) : (
                  <><MapPin size={22} color={C.green} /><span className="text-xs" style={{ color: C.gray }}>{t("use_my_location")}</span></>
                )}
              </button>
              {form.lat && form.lng && (
                <button onClick={() => window.open(`https://www.google.com/maps?q=${form.lat},${form.lng}`, "_blank")} className="text-xs mt-1.5 flex items-center gap-1" style={{ color: C.green }}>
                  <Eye size={12} /> {t("view_map")}
                </button>
              )}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm font-bold" style={{ color: C.white }}>{t("extra_info")}</p>
            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}><span style={{ color: C.red }}>*</span> {t("phone_number")}</label>
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="22 xx xx xx" inputMode="tel" className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }} />
            </div>
            <button onClick={() => update("whatsapp", !form.whatsapp)} className="flex items-center justify-between rounded-xl px-3 py-3" style={{ border: `1px solid ${C.border}` }}>
              <span className="text-sm" style={{ color: C.white }}>{t("enable_whatsapp")}</span>
              <div className="w-10 h-6 rounded-full relative" style={{ background: form.whatsapp ? C.green : C.border }}>
                <div className="w-4.5 h-4.5 rounded-full absolute top-0.5 transition-all" style={{ width: 18, height: 18, background: C.white, [form.whatsapp ? "right" : "left"]: 2 }} />
              </div>
            </button>
            <p className="text-xs leading-relaxed" style={{ color: C.grayDim }}>
              {t("ads_safe_hint")}
            </p>
          </>
        )}

        {step === 4 && (
          <>
            <p className="text-sm font-bold" style={{ color: C.white }}>{t("review_ad")}</p>
            <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <div className="h-28 flex items-center justify-center overflow-hidden" style={{ background: C.cardAlt }}>
                {form.images.length > 0
                  ? <img src={form.images[0]} alt="" className="w-full h-full object-cover" />
                  : <CategoryIcon cat={CATEGORIES.find((c) => c.id === form.cat)} size={26} box={56} active />}
              </div>
              <div className="p-3">
                <p className="text-sm font-bold mb-1" style={{ color: C.white }}>{form.title || "بدون عنوان"}</p>
                <p className="text-lg font-black mb-2" style={{ color: C.green }}>{form.price || "0"} <span className="text-xs font-normal" style={{ color: C.gray }}>أوقية</span></p>
                <p className="text-sm mb-2" style={{ color: C.gray }}>{form.desc}</p>
                {fields.some((f) => form.specs[f.key]) && (
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 mb-2 pb-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                    {fields.filter((f) => form.specs[f.key]).map((f) => (
                      <div key={f.key} className="flex items-center justify-between text-xs">
                        <span style={{ color: C.grayDim }}>{fieldLabel(f.key, lang)}</span>
                        <span style={{ color: C.white }}>{form.specs[f.key]}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs" style={{ color: C.grayDim }}>{t(form.adType)}{showCondition ? ` · ${t(form.condition)}` : ""} · {form.city}{form.area ? ` - ${form.area}` : ""} · {form.phone} · {form.images.length} {t("photo_word")}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 left-0 right-0 px-4 py-3 flex gap-2" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
        {step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="px-5 py-3 rounded-xl font-bold text-sm" style={{ border: `1px solid ${C.border}`, color: C.white }}>{t("back")}</button>
        )}
        <button onClick={handleNext} disabled={publishing} className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5" style={{ background: canNext ? C.green : hexToRgba(C.green, 0.4), color: canNext ? "#07130E" : hexToRgba("#07130E", 0.7) }}>
          {step === 4 ? (publishing ? "جارٍ النشر..." : t("publish_ad")) : t("next")} <ArrowLeft size={15} />
        </button>
      </div>
    </div>
  );
}

// ---------- Notifications ----------
const NOTIF_TITLE_KEY = { message: "n_new_message", like: "n_new_like", save: "n_added_fav", expiry: "n_ad_expiry", approved: "n_ad_approved", rejected: "n_ad_rejected", offer: "n_new_offer", system: "n_system" };
const NOTIF_TYPES = {
  message: { icon: MessageCircle, color: "#19C98A" },
  like: { icon: Heart, color: "#E5484D" },
  save: { icon: Bookmark, color: "#F2B807" },
  expiry: { icon: Clock, color: "#A78BFA" },
  approved: { icon: ShieldCheck, color: "#19C98A" },
  rejected: { icon: X, color: "#E5484D" },
  offer: { icon: BarChart3, color: "#A78BFA" },
  system: { icon: Bell, color: "#4C8DFF" },
};

const NOTIFS = [
  { id: 1, type: "message", title: "رسالة جديدة", body: "أحمد محمد أرسل لك رسالة بخصوص", ref: "تويوتا لاند كروزر 2023", time: "منذ 2 دقيقة", unread: true },
  { id: 2, type: "like", title: "إعجاب جديد", body: "سارة بنت أحمد أعجبت بإعلانك", ref: "شقة حديثة للبيع في تفرغ زينة", time: "منذ 15 دقيقة", unread: true },
  { id: 3, type: "save", title: "إضافة إلى المفضلة", body: "عبد الرحمن حفظ إعلانك في المفضلة", ref: "iPhone 14 Pro Max 256GB", time: "منذ 35 دقيقة", unread: true },
  { id: 4, type: "expiry", title: "انتهاء مدة الإعلان", body: "إعلانك شقة دوبلكس للإيجار ينتهي بعد", ref: "يوم واحد", time: "منذ ساعة", unread: false },
  { id: 5, type: "approved", title: "تمت الموافقة على إعلانك", body: "تمت الموافقة على إعلانك وسيظهر قريبًا", ref: "وظيفة مندوب مبيعات", time: "منذ ساعتين", unread: false },
  { id: 6, type: "rejected", title: "تم رفض إعلانك", body: "تم رفض إعلانك لمخالفة سياسة النشر", ref: "سيارة مرسيدس 2010", time: "منذ 3 ساعات", unread: false },
  { id: 7, type: "offer", title: "عرض سعر جديد", body: "لديك عرض سعر جديد من محمد الأمين على", ref: "أرض للبيع في لكصر", time: "منذ 4 ساعات", unread: false },
  { id: 8, type: "system", title: "MauriOne", body: "تأكد من تحديث بيانات حسابك للاستمرار في استخدام جميع خدمات التطبيق.", ref: "", time: "منذ يوم", unread: false },
];

function NotificationsScreen({ onBack }) {
  const { t, lang, setLang, dir } = useT();
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState(NOTIFS);
  const unreadCount = items.filter((n) => n.unread).length;
  const list = tab === "unread" ? items.filter((n) => n.unread) : items;
  const markAllRead = () => { setItems((prev) => prev.map((n) => ({ ...n, unread: false }))); toast(t("marked_all_read")); };
  const markOne = (id) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  return (
    <div className="pb-6">
      <TopBar onBack={onBack} title={null} right={<button onClick={markAllRead} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg" style={{ border: `1px solid ${C.green}`, color: C.green }}><CheckCircle2 size={13} /> {t("mark_all_read")}</button>} />
      <div className="px-4 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: C.white }}>{t("notifications")}</h1>
          <p className="text-xs" style={{ color: C.gray }}>{t("notif_subtitle")}</p>
        </div>
        <div className="relative">
          <Bell size={30} color={C.gold} />
          {unreadCount > 0 && <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: C.gold, color: "#1a1400" }}>{unreadCount}</span>}
        </div>
      </div>
      <div className="px-4 flex gap-2 mb-3">
        <Chip active={tab === "all"} onClick={() => setTab("all")}>{t("all")} ({items.length})</Chip>
        <Chip active={tab === "unread"} onClick={() => setTab("unread")}>{t("unread")} ({unreadCount})</Chip>
      </div>
      <div className="px-4 flex flex-col gap-2">
        {list.map((n) => {
          const meta = NOTIF_TYPES[n.type];
          return (
            <button key={n.id} onClick={() => markOne(n.id)} className="w-full text-right flex items-center gap-3 rounded-xl p-3" style={{ background: C.card, border: `1px solid ${n.unread ? hexToRgba(C.green, 0.35) : C.border}` }}>
              <IconCircle icon={meta.icon} color={meta.color} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: C.white }}>{t(NOTIF_TITLE_KEY[n.type] || "n_system")}</p>
                <p className="text-xs" style={{ color: C.gray }}>{n.body}{n.ref && <span style={{ color: C.green }}> {n.ref}</span>}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px]" style={{ color: C.grayDim }}>{n.time}</span>
                {n.unread && <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Messages ----------
const MOCK_CHATS = [
  { id: 1, name: "محمد أحمد", role: "بائع", verified: true, ref: "iPhone 14 Pro Max 256GB", last: "مرحبًا، هل الهاتف ما زال متوفرًا؟", time: "09:40 ص", unread: 2 },
  { id: 2, name: "سارة بنت أحمد", role: "مشتري", verified: true, ref: "شقة حديثة للبيع", last: "شكرًا على الرد، هل يمكن تحديد موعد للمعاينة؟", time: "أمس", unread: 1 },
  { id: 3, name: "أحمد سالم", role: "مشتري", verified: false, ref: "تويوتا لاند كروزر 2023", last: "حسنًا، سأرسل لك العنوان", time: "أمس", unread: 0 },
  { id: 4, name: "مكتب دار الأمل العقارية", role: "بائع", verified: true, ref: "فيلا فاخرة للبيع", last: "مرحبًا، يسعدنا خدمتكم", time: "2 مايو", unread: 3 },
  { id: 5, name: "فاطمة محمد", role: "مشتري", verified: false, ref: "Samsung Galaxy S24 Ultra", last: "هل يوجد ضمان على الجهاز؟", time: "1 مايو", unread: 0 },
];

function MessagesScreen({ onBack }) {
  const { t, lang, setLang, dir } = useT();
  const [openChat, setOpenChat] = useState(null);
  const [tab, setTab] = useState("all");
  const [msg, setMsg] = useState("");
  const [msgs, setMsgs] = useState(["مرحبًا، هل الإعلان لا يزال متاحًا؟", "نعم متاح، تفضل"]);

  if (openChat) {
    return (
      <div className="flex flex-col" style={{ minHeight: "100vh" }}>
        <TopBar onBack={() => setOpenChat(null)} title={openChat.name} />
        <div className="flex-1 px-4 py-3 flex flex-col gap-2 overflow-y-auto">
          {msgs.map((m, i) => (
            <div key={i} className="max-w-[75%] px-3 py-2 rounded-2xl text-sm" style={i % 2 === 0 ? { background: C.card, color: C.white, alignSelf: "flex-start", border: `1px solid ${C.border}` } : { background: C.green, color: "#07130E", alignSelf: "flex-end" }}>{m}</div>
          ))}
        </div>
        <div className="sticky bottom-0 left-0 right-0 px-3 py-2 flex gap-2 items-center" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={t("type_message")} className="flex-1 rounded-full px-4 py-2.5 text-sm outline-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }} />
          <button onClick={() => { if (!msg.trim()) return; setMsgs((m) => [...m, msg]); setMsg(""); }} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.green }}><Send size={16} color="#07130E" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <div className="px-4 pt-4 pb-1 flex items-start justify-between">
        <div className="flex items-start gap-2">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center mt-0.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <ArrowRight size={16} color={C.white} />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold" style={{ color: C.white }}>{t("messages")}</h1>
            <p className="text-xs" style={{ color: C.gray }}>{t("messages_subtitle")}</p>
          </div>
        </div>
      </div>
      <div className="px-4 pt-3 pb-3 flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ border: `1px solid ${C.border}` }}>
          <Search size={15} color={C.gray} />
          <input placeholder={t("search_messages")} className="bg-transparent outline-none text-sm w-full text-right" style={{ color: C.white }} />
        </div>
        <button onClick={() => toast(t("start_new_chat"))} className="px-3 rounded-xl flex items-center gap-1.5 text-xs font-bold shrink-0" style={{ background: C.green, color: "#07130E" }}><Edit3 size={13} /> {t("new_message")}</button>
      </div>
      <div className="px-4 flex gap-2 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <Chip active={tab === "all"} onClick={() => setTab("all")}>{t("all")} ({MOCK_CHATS.length})</Chip>
        <Chip active={tab === "unread"} onClick={() => setTab("unread")}>{t("unread_short")} ({MOCK_CHATS.filter((c) => c.unread).length})</Chip>
        <Chip active={tab === "fav"} onClick={() => setTab("fav")}>{t("favorites_tab")}</Chip>
        <Chip active={tab === "archive"} onClick={() => setTab("archive")}>{t("archive")}</Chip>
      </div>
      <div className="px-2 mt-2">
        {MOCK_CHATS.filter((c) => tab !== "unread" || c.unread).map((c) => (
          <button key={c.id} onClick={() => setOpenChat(c)} className="w-full flex items-center gap-3 px-2 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: C.card }}><User size={18} color={C.gray} /></div>
            <div className="flex-1 text-right min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold flex items-center gap-1" style={{ color: C.white }}>{c.name}{c.verified && <CheckCircle2 size={12} color={C.green} />}</p>
                <span className="text-[11px]" style={{ color: C.grayDim }}>{c.time}</span>
              </div>
              <p className="text-[11px] mb-0.5">
                <span className="px-1.5 py-0.5 rounded font-medium" style={{ color: c.role === "بائع" ? C.green : C.blue, border: `1px solid ${c.role === "بائع" ? C.green : C.blue}` }}>{c.role === "بائع" ? t("seller") : t("buyer")}</span>
                <span style={{ color: C.grayDim }}> · {c.ref}</span>
              </p>
              <p className="text-xs truncate" style={{ color: C.gray }}>{c.last}</p>
            </div>
            {c.unread > 0 && <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: C.green, color: "#07130E" }}>{c.unread}</span>}
          </button>
        ))}
      </div>
      <div className="px-4 mt-3 flex items-center gap-2 rounded-xl p-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <ShieldCheck size={16} color={C.green} />
        <p className="text-xs" style={{ color: C.gray }}>{t("secure_chat")}</p>
      </div>
    </div>
  );
}

// ---------- Favorites ----------
function MyAdsScreen({ ads, favorites, onToggleFav, onOpenAd, onBack, onDelete, onClearAll, onRestore }) {
  const { t } = useT();
  const mine = ads;  // manage all ads here so anything can be deleted
  const [confirmId, setConfirmId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  return (
    <div className="pb-6">
      <TopBar onBack={onBack} title={t("my_ads_title")} right={
        <div className="flex items-center gap-2">
          <button onClick={onRestore} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ border: `1px solid ${C.border}`, color: C.gray }}>{t("restore_samples")}</button>
          {ads.length > 0 && <button onClick={() => setConfirmClear(true)} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ border: `1px solid ${C.red}`, color: C.red }}>{t("clear_all")}</button>}
        </div>
      } />

      {mine.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 px-8 text-center">
          <ClipboardList size={34} color={C.grayDim} />
          <p className="text-sm font-bold" style={{ color: C.white }}>{t("my_ads_empty")}</p>
          <p className="text-xs" style={{ color: C.grayDim }}>{t("my_ads_empty_hint")}</p>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-3 pt-2">
          {mine.map((ad) => (
            <div key={ad.id} className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <button onClick={() => onOpenAd(ad)} className="w-full flex items-center gap-3 p-2.5 text-right">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: C.cardAlt }}>
                  {ad.images && ad.images.length > 0
                    ? <img src={ad.images[0]} alt="" className="w-full h-full object-cover" />
                    : <CategoryIcon cat={CATEGORIES.find((c) => c.id === ad.cat)} size={20} box={64} active />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: C.white }}>{ad.title}</p>
                  <p className="text-sm font-bold" style={{ color: C.green }}>{ad.price} <span className="text-[11px] font-normal" style={{ color: C.gray }}>{ad.currency}</span></p>
                  <p className="text-[11px] flex items-center gap-1" style={{ color: C.grayDim }}><MapPin size={10} />{ad.city} · {ad.time}</p>
                </div>
              </button>
              <div className="flex" style={{ borderTop: `1px solid ${C.border}` }}>
                <button onClick={() => onOpenAd(ad)} className="flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5" style={{ color: C.white }}>
                  <Eye size={13} /> {t("view_profile")}
                </button>
                <div style={{ width: 1, background: C.border }} />
                <button onClick={() => setConfirmId(ad.id)} className="flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5" style={{ color: C.red }}>
                  <X size={13} /> {t("delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(confirmId != null || confirmClear) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => { setConfirmId(null); setConfirmClear(false); }}>
          <div onClick={(e) => e.stopPropagation()} className="w-full rounded-2xl p-5 flex flex-col gap-4" style={{ maxWidth: 320, background: C.card, border: `1px solid ${C.border}` }}>
            <p className="text-sm font-bold text-center" style={{ color: C.white }}>{confirmClear ? t("clear_all_confirm") : t("delete_confirm")}</p>
            <div className="flex gap-2">
              <button onClick={() => { setConfirmId(null); setConfirmClear(false); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ border: `1px solid ${C.border}`, color: C.white }}>{t("cancel")}</button>
              <button onClick={() => { if (confirmClear) { onClearAll(); } else { onDelete(confirmId); } setConfirmId(null); setConfirmClear(false); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: C.red, color: "#fff" }}>{t("confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HelpScreen({ onBack }) {
  const { t } = useT();
  const faqs = [
    { q: t("help_q1"), a: t("help_a1") },
    { q: t("help_q2"), a: t("help_a2") },
    { q: t("help_q3"), a: t("help_a3") },
    { q: t("help_q4"), a: t("help_a4") },
  ];
  const [open, setOpen] = useState(0);
  return (
    <div className="pb-6">
      <TopBar onBack={onBack} title={t("help_support")} />
      <div className="px-4 pt-2 flex flex-col gap-2">
        {faqs.map((f, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between px-4 py-3.5 text-right">
              <span className="text-sm font-bold flex-1" style={{ color: C.white }}>{f.q}</span>
              <ChevronDown size={16} color={C.gray} style={{ transform: open === i ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
            </button>
            {open === i && <p className="px-4 pb-4 text-xs leading-relaxed" style={{ color: C.gray }}>{f.a}</p>}
          </div>
        ))}
        <div className="rounded-2xl p-4 mt-2 text-center" style={{ background: hexToRgba(C.green, 0.08), border: `1px solid ${hexToRgba(C.green, 0.3)}` }}>
          <p className="text-sm font-bold mb-1" style={{ color: C.white }}>{t("help_contact")}</p>
          <p className="text-xs mb-2" style={{ color: C.gray }}>{t("help_contact_sub")}</p>
          <a href="mailto:support@maurione.mr" className="text-sm font-bold" style={{ color: C.green }}>support@maurione.mr</a>
        </div>
      </div>
    </div>
  );
}

function SettingsScreen({ onBack, onLogout, onOpenHelp }) {
  const { t, lang, theme, toggleTheme, setLang } = useT();
  const [push, setPush] = useState(true);
  const langOrder = ["ar", "fr", "en"];
  const cycleLang = () => setLang(langOrder[(langOrder.indexOf(lang) + 1) % langOrder.length]);

  const Section = ({ title, children }) => (
    <div className="mb-4">
      <p className="text-xs font-bold mb-2 px-1" style={{ color: C.grayDim }}>{title}</p>
      <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>{children}</div>
    </div>
  );
  const Row = ({ icon: Icon, label, value, onClick, right, last }) => (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-3.5 text-right" style={{ borderBottom: last ? "none" : `1px solid ${C.border}` }}>
      <IconCircle icon={Icon} color={C.green} size={34} />
      <span className="flex-1 text-sm font-medium" style={{ color: C.white }}>{label}</span>
      {value && <span className="text-xs" style={{ color: C.gray }}>{value}</span>}
      {right}
    </button>
  );
  const Toggle = ({ on, onChange }) => (
    <span onClick={(e) => { e.stopPropagation(); onChange(); }} className="w-10 h-6 rounded-full relative shrink-0" style={{ background: on ? C.green : C.border }}>
      <span className="rounded-full absolute top-0.5 transition-all" style={{ width: 18, height: 18, background: "#fff", [on ? "left" : "right"]: 2 }} />
    </span>
  );

  return (
    <div className="pb-6">
      <TopBar onBack={onBack} title={t("settings")} />
      <div className="px-4 pt-2">
        <Section title={t("settings_appearance")}>
          <Row icon={theme === "dark" ? Moon : Sun} label={t("settings_theme_row")} value={theme === "dark" ? t("theme_dark") : t("theme_light")} onClick={toggleTheme} right={<Toggle on={theme === "dark"} onChange={toggleTheme} />} />
          <Row icon={Globe} label={t("settings_language")} value={LANGS[lang].label} onClick={cycleLang} last />
        </Section>

        <Section title={t("settings_notifications")}>
          <Row icon={Bell} label={t("settings_push")} onClick={() => setPush((v) => !v)} right={<Toggle on={push} onChange={() => setPush((v) => !v)} />} last />
        </Section>

        <Section title={t("settings_account")}>
          <Row icon={User} label={t("edit_profile")} onClick={onBack} />
          <Row icon={ShieldCheck} label={t("settings_privacy")} onClick={() => toast(t("settings_privacy"))} />
          <Row icon={HelpCircle} label={t("help_support")} onClick={onOpenHelp} last />
        </Section>

        <Section title={t("settings_about")}>
          <Row icon={Star} label={t("settings_about")} onClick={() => toast("MauriOne")} />
          <Row icon={ClipboardList} label={t("settings_version")} value="1.0.0" onClick={() => {}} last />
        </Section>

        <button onClick={onLogout} className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2" style={{ border: `1px solid ${C.red}`, color: C.red }}>
          <LogOut size={15} /> {t("logout")}
        </button>
      </div>
    </div>
  );
}

function StatsScreen({ ads, onBack, onOpenAd }) {
  const { t } = useT();
  const mine = ads.filter((a) => a.mine);
  const totalViews = mine.reduce((s, a) => s + (a.views || 0), 0);
  const avg = mine.length ? Math.round(totalViews / mine.length) : 0;
  const top = [...mine].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
  const maxV = Math.max(1, ...mine.map((a) => a.views || 0));

  const bigStats = [
    { label: t("stats_total_views"), value: totalViews, icon: Eye, color: C.green },
    { label: t("stats_total_ads"), value: mine.length, icon: ClipboardList, color: C.blue },
    { label: t("stats_avg_views"), value: avg, icon: BarChart3, color: "#A78BFA" },
  ];

  return (
    <div className="pb-6">
      <TopBar onBack={onBack} title={t("stats_title")} />
      {mine.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 px-8 text-center">
          <BarChart3 size={34} color={C.grayDim} />
          <p className="text-sm" style={{ color: C.grayDim }}>{t("stats_no_ads")}</p>
        </div>
      ) : (
        <div className="px-4 pt-2">
          <p className="text-xs font-bold mb-2 px-1" style={{ color: C.grayDim }}>{t("stats_overview")}</p>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {bigStats.map((s) => (
              <div key={s.label} className="rounded-2xl py-4 flex flex-col items-center gap-1.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <IconCircle icon={s.icon} color={s.color} size={38} />
                <p className="text-lg font-black" style={{ color: C.white }}>{s.value}</p>
                <p className="text-[10px] text-center px-1" style={{ color: C.gray }}>{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xs font-bold mb-2 px-1" style={{ color: C.grayDim }}>{t("stats_per_ad")}</p>
          <div className="rounded-2xl p-3 mb-5 flex flex-col gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            {mine.map((a) => (
              <div key={a.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs truncate flex-1" style={{ color: C.white }}>{a.title}</span>
                  <span className="text-xs font-bold shrink-0 mr-2" style={{ color: C.green }}>{a.views || 0}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: C.cardAlt }}>
                  <div className="h-full rounded-full" style={{ width: `${((a.views || 0) / maxV) * 100}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.green})` }} />
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs font-bold mb-2 px-1" style={{ color: C.grayDim }}>{t("stats_top")}</p>
          <div className="flex flex-col">
            {top.map((a) => (
              <button key={a.id} onClick={() => onOpenAd(a)} className="w-full flex items-center gap-3 py-3 text-right" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: C.cardAlt }}>
                  {a.images && a.images.length > 0 ? <img src={a.images[0]} alt="" className="w-full h-full object-cover" /> : <CategoryIcon cat={CATEGORIES.find((c) => c.id === a.cat)} size={16} box={48} active />}
                </div>
                <span className="flex-1 text-sm truncate" style={{ color: C.white }}>{a.title}</span>
                <span className="text-xs flex items-center gap-1 shrink-0" style={{ color: C.gray }}><Eye size={12} />{a.views || 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlansScreen({ onBack }) {
  const { t } = useT();
  const [current, setCurrent] = useState("free");
  const plans = [
    { id: "free", name: t("plan_free"), price: "0", color: C.gray, features: [t("plan_free_f1"), t("plan_free_f2")] },
    { id: "silver", name: t("plan_silver"), price: "500", color: C.blue, features: [t("plan_silver_f1"), t("plan_silver_f2"), t("plan_silver_f3")] },
    { id: "gold", name: t("plan_gold"), price: "1500", color: C.gold, features: [t("plan_gold_f1"), t("plan_gold_f2"), t("plan_gold_f3"), t("plan_gold_f4")] },
  ];
  return (
    <div className="pb-6">
      <TopBar onBack={onBack} title={t("plans_title")} />
      <div className="px-4 pt-1 pb-4">
        <p className="text-sm" style={{ color: C.gray }}>{t("plans_subtitle")}</p>
      </div>
      <div className="px-4 flex flex-col gap-3">
        {plans.map((p) => {
          const active = current === p.id;
          return (
            <div key={p.id} className="rounded-2xl p-4" style={{ background: C.card, border: `1.5px solid ${active ? p.color : C.border}`, boxShadow: active ? `0 6px 18px ${hexToRgba(p.color, 0.18)}` : "none" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconCircle icon={p.id === "gold" ? Star : p.id === "silver" ? ShieldCheck : User} color={p.color} size={38} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: C.white }}>{p.name}</p>
                    {active && <p className="text-[10px]" style={{ color: p.color }}>{t("plan_current")}</p>}
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-lg font-black" style={{ color: C.white }}>{p.price}<span className="text-[10px] font-normal" style={{ color: C.gray }}> {t("currency")}</span></p>
                  <p className="text-[10px]" style={{ color: C.grayDim }}>{t("plan_month")}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mb-3">
                {p.features.map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 size={13} color={p.color} />
                    <span className="text-xs" style={{ color: C.gray }}>{f}</span>
                  </div>
                ))}
              </div>
              <button
                disabled={active}
                onClick={() => { setCurrent(p.id); toast(t("plan_selected") + " — " + p.name); }}
                className="w-full py-2.5 rounded-xl text-sm font-bold"
                style={active ? { border: `1px solid ${C.border}`, color: C.grayDim } : { background: p.color, color: "#07130E" }}
              >
                {active ? t("plan_current") : t("plan_choose")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const MOCK_REVIEWS = [
  { id: 1, name: "أحمد سالم", rating: 5, text: "تعامل ممتاز وصادق، أنصح بالتعامل معه.", time: "منذ يومين" },
  { id: 2, name: "فاطمة محمد", rating: 4, text: "المنتج مطابق للوصف، والتوصيل سريع.", time: "منذ أسبوع" },
  { id: 3, name: "سيدي محمد", rating: 5, text: "بائع محترم ومتعاون، شكرًا.", time: "منذ أسبوعين" },
];

function ReviewsScreen({ onBack }) {
  const { t } = useT();
  const avg = (MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);
  const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: MOCK_REVIEWS.filter((r) => r.rating === star).length }));
  return (
    <div className="pb-6">
      <TopBar onBack={onBack} title={t("reviews_screen_title")} />
      <div className="px-4 pt-2">
        <div className="rounded-2xl p-4 mb-4 flex items-center gap-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex flex-col items-center shrink-0">
            <p className="text-3xl font-black" style={{ color: C.white }}>{avg}</p>
            <div className="flex gap-0.5 my-1">
              {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} color={C.gold} fill={i <= Math.round(avg) ? C.gold : "none"} />)}
            </div>
            <p className="text-[10px]" style={{ color: C.gray }}>{MOCK_REVIEWS.length} {t("reviews_count")}</p>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            {dist.map((d) => (
              <div key={d.star} className="flex items-center gap-2">
                <span className="text-[10px] w-3" style={{ color: C.gray }}>{d.star}</span>
                <Star size={9} color={C.gold} fill={C.gold} />
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.cardAlt }}>
                  <div className="h-full rounded-full" style={{ width: `${(d.count / MOCK_REVIEWS.length) * 100}%`, background: C.gold }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          {MOCK_REVIEWS.map((r) => (
            <div key={r.id} className="py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.cardAlt }}><User size={16} color={C.gray} /></div>
                <div className="flex-1">
                  <p className="text-sm font-bold" style={{ color: C.white }}>{r.name}</p>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={10} color={C.gold} fill={i <= r.rating ? C.gold : "none"} />)}
                    </div>
                    <span className="text-[10px]" style={{ color: C.grayDim }}>· {r.time}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: C.gray }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FavoritesScreen({ ads, favorites, onToggleFav, onOpenAd, onBack }) {
  const { t, lang, setLang, dir } = useT();
  const favAds = ads.filter((a) => favorites.has(a.id));
  return (
    <div>
      <TopBar onBack={onBack} title={t("favorites")} />
      {favAds.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <Heart size={32} color={C.grayDim} />
          <p className="text-sm" style={{ color: C.grayDim }}>{t("no_favorites")}</p>
        </div>
      ) : (
        <div className="px-4 grid grid-cols-2 gap-3 mo-fav-grid">
          {favAds.map((ad) => <AdCard key={ad.id} ad={ad} isFav onToggleFav={onToggleFav} onOpen={onOpenAd} />)}
        </div>
      )}
    </div>
  );
}

// ---------- Profile ----------
function ProfileScreen({ profile, setProfile, myAdsCount, totalViews, onOpenFavorites, onOpenMyAds, onOpenSettings, onOpenStats, onOpenPlans, onOpenReviews, onOpenHelp, favCount, msgCount, notifCount, onLogout, onOpenNotifs, onOpenMessages }) {
  const { t, lang, setLang, dir } = useT();
  const avatarInputRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const openEdit = () => { setDraft(profile); setEditing(true); };
  const saveEdit = () => { setProfile(draft); setEditing(false); toast(t("profile_saved")); };
  const pickAvatar = (e) => {
    const file = (e.target.files || [])[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfile((p) => ({ ...p, avatar: ev.target.result }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const menu = [
    { label: t("my_ads"), sub: t("my_ads_sub"), icon: ClipboardList, color: C.green, onClick: onOpenMyAds },
    { label: t("favorites"), sub: t("fav_sub"), icon: Heart, color: C.red, onClick: onOpenFavorites },
    { label: t("stats_title"), sub: t("stats_sub"), icon: BarChart3, color: "#A78BFA", onClick: onOpenStats },
    { label: t("subscription"), sub: t("subscription_sub"), icon: Wallet, color: C.gold, onClick: onOpenPlans },
    { label: t("reviews_title"), sub: t("reviews_sub"), icon: Star, color: C.blue, onClick: onOpenReviews },
    { label: t("settings"), sub: t("settings_sub"), icon: Settings, color: C.gray, onClick: onOpenSettings },
    { label: t("help_support"), sub: t("help_sub"), icon: HelpCircle, color: "#A78BFA", onClick: onOpenHelp },
    { label: t("logout"), sub: t("logout_sub"), icon: LogOut, color: C.red, onClick: onLogout },
  ];
  const stats = [
    { label: t("stat_views"), value: totalViews, icon: Eye },
    { label: t("stat_favorites"), value: favCount, icon: Heart },
    { label: t("stat_ads"), value: myAdsCount, icon: ClipboardList },
    { label: t("stat_followers"), value: 218, icon: User },
  ];
  const quick = [
    { label: t("messages"), value: msgCount, icon: MessageCircle, onClick: onOpenMessages },
    { label: t("notifications"), value: notifCount, icon: Bell, onClick: onOpenNotifs },
    { label: t("favorites"), value: favCount, icon: Heart, onClick: onOpenFavorites },
    { label: t("my_ads"), value: myAdsCount, icon: ClipboardList, onClick: onOpenMyAds },
  ];
  return (
    <div className="pb-4">
      <div className="px-4 pt-4 flex items-center justify-between mb-4">
        <Logo size={28} withText textSize="text-base" />
        <div className="flex items-center gap-2">
          <BadgeIcon count={notifCount}><button onClick={onOpenNotifs} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}><Bell size={16} color={C.white} /></button></BadgeIcon>
          <button onClick={onOpenSettings} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.card, border: `1px solid ${C.border}` }}><Settings size={16} color={C.white} /></button>
        </div>
      </div>

      <div className="px-4 rounded-2xl p-4 mb-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={pickAvatar} />
        <div className="flex items-start gap-3 mb-3">
          <div className="relative">
            <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden" style={{ background: C.cardAlt }}>
              {profile.avatar
                ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                : <User size={26} color={C.gray} />}
            </div>
            <button onClick={() => avatarInputRef.current && avatarInputRef.current.click()} className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.green, border: `2px solid ${C.card}` }}><Camera size={11} color="#07130E" /></button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base flex items-center gap-1" style={{ color: C.white }}>{profile.name || t("guest")} <CheckCircle2 size={14} color={C.green} /></p>
            <p className="text-xs" style={{ color: C.green }}>@{profile.username || "user"}</p>
          </div>
        </div>
        {profile.bio ? <p className="text-xs leading-relaxed mb-2" style={{ color: C.gray }}>{profile.bio}</p> : null}
        <div className="flex items-center gap-3 text-xs mb-3" style={{ color: C.grayDim }}>
          <span className="flex items-center gap-1"><MapPin size={11} />{profile.city || "—"}</span>
          <span className="flex items-center gap-1"><Calendar size={11} />{t("member_since")} 2024</span>
        </div>
        <button onClick={openEdit} className="w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5" style={{ border: `1px solid ${C.green}`, color: C.green }}><Edit3 size={13} /> {t("edit_profile")}</button>
      </div>

      <div className="px-4 grid grid-cols-4 gap-2 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl py-3 flex flex-col items-center gap-1" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <s.icon size={15} color={C.green} />
            <p className="text-sm font-bold" style={{ color: C.white }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: C.gray }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="px-4 grid grid-cols-4 gap-2 mb-4">
        {quick.map((q) => (
          <button key={q.label} onClick={q.onClick} className="rounded-xl py-3 flex flex-col items-center gap-1 relative" style={{ background: C.card, border: `1px solid ${C.border}` }}>
            <BadgeIcon count={q.value}><q.icon size={16} color={C.white} /></BadgeIcon>
            <p className="text-[10px] mt-1" style={{ color: C.gray }}>{q.label}</p>
          </button>
        ))}
      </div>

      <div className="px-4 flex flex-col gap-2">
        {menu.map((m) => (
          <button key={m.label} onClick={m.onClick} className="flex items-center gap-3 py-2.5 px-1">
            <IconCircle icon={m.icon} color={m.color} />
            <div className="flex-1 text-right">
              <p className="text-sm font-bold" style={{ color: C.white }}>{m.label}</p>
              <p className="text-[11px]" style={{ color: C.grayDim }}>{m.sub}</p>
            </div>
            <ChevronRight size={15} color={C.grayDim} style={{ transform: "rotate(180deg)" }} />
          </button>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setEditing(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full rounded-t-3xl p-5 flex flex-col gap-3" style={{ maxWidth: 420, background: C.card, borderTop: `1px solid ${C.border}` }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: C.border }} />
            <p className="text-base font-bold text-center mb-1" style={{ color: C.white }}>{t("edit_profile")}</p>

            <div className="flex flex-col items-center gap-2 mb-1">
              <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden relative" style={{ background: C.cardAlt }}>
                {profile.avatar ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" /> : <User size={30} color={C.gray} />}
              </div>
              <button onClick={() => avatarInputRef.current && avatarInputRef.current.click()} className="text-xs font-bold flex items-center gap-1" style={{ color: C.green }}><Camera size={12} /> {t("change_avatar")}</button>
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}>{t("full_name")}</label>
              <input value={draft.name} onChange={(e) => { const nm = e.target.value; const uname = nm.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_\u0600-\u06FF]/g, ""); setDraft({ ...draft, name: nm, username: uname }); }} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}>{t("username")}</label>
              <input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value.replace(/\s/g, "") })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}>{t("bio")}</label>
              <textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} rows={2} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: C.gray }}>{t("city")}</label>
              <select value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} className="w-full rounded-xl px-3 py-2.5 text-sm outline-none text-right" style={{ border: `1px solid ${C.border}`, color: C.white, background: "transparent" }}>
                {CITIES.map((c) => <option key={c} value={c} style={{ background: C.card }}>{c}</option>)}
              </select>
            </div>

            <div className="flex gap-2 mt-2">
              <button onClick={() => setEditing(false)} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ border: `1px solid ${C.border}`, color: C.white }}>{t("cancel")}</button>
              <button onClick={saveEdit} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: C.green, color: "#07130E" }}>{t("save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- app shell ----------
const NAV = [
  { id: "home", key: "nav_home", icon: HomeIcon },
  { id: "search", key: "nav_search", icon: Search },
  { id: "add", key: null, icon: Plus },
  { id: "messages", key: "nav_messages", icon: MessageCircle },
  { id: "profile", key: "nav_profile", icon: User },
];

function MauriOneInner() {
  const { lang, dir, t } = useT();
  const [phase, setPhase] = useState("splash"); // splash -> onboarding -> login/signup/otp -> app
  const [tab, setTab] = useState("home");
  const [ads, setAds] = useState([]);           // الإعلانات من Firestore (سحابية، للجميع)
  const [favorites, setFavorites] = useState(new Set());
  const [selectedAd, setSelectedAd] = useState(null);
  const [searchCat, setSearchCat] = useState("all");
  const [showNotifs, setShowNotifs] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showMyAds, setShowMyAds] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [profile, setProfile] = useState(() => {
    const saved = Store.get(PROFILE_KEY, null);
    return saved || { name: "محمد الأمين", username: "mohamed_amine", bio: "", city: "نواكشوط", avatar: null };
  });
  useEffect(() => { Store.set(PROFILE_KEY, profile); }, [profile]);

  // معرّف الجهاز: يميّز إعلانات هذا المستخدم (بديل مؤقت عن الحسابات)
  const deviceId = useMemo(() => {
    let id = Store.get("maurione_device", null);
    if (!id) { id = "u" + Math.random().toString(36).slice(2) + Date.now().toString(36); Store.set("maurione_device", id); }
    return id;
  }, []);

  // حساب المستخدم الحقيقي من Firebase (تسجيل الدخول بقوقل)
  const [user, setUser] = useState(null);
  useEffect(() => {
    try {
      const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        if (u) {
          // تحديث الملف الشخصي ببيانات حساب قوقل
          const uname = (u.displayName || "user").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_\u0600-\u06FF]/g, "");
          setProfile((p) => ({
            ...p,
            name: u.displayName || p.name,
            username: uname || p.username,
            avatar: u.photoURL || p.avatar,
          }));
        }
      });
      return () => unsub();
    } catch (e) { console.error(e); }
  }, []);

  // معرّف مالك الإعلان: حساب قوقل إن وُجد، وإلا معرّف الجهاز
  const ownerId = user ? user.uid : deviceId;

  // تسجيل الدخول بقوقل
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setPhase("app"); // دخول مباشر بعد نجاح تسجيل الدخول
    } catch (e) {
      console.error(e);
      const msg = (e && (e.code || e.message)) ? `${e.code || ""} ${e.message || ""}` : String(e);
      toast("تعذّر تسجيل الدخول: " + msg);
      alert("سبب فشل تسجيل الدخول بقوقل:\n\n" + msg);
    }
  };

  // تسجيل الخروج
  const handleSignOut = async () => {
    try { await signOut(auth); } catch (e) {}
    // مسح بيانات الملف المحلية بعد الخروج
    setProfile({ name: "زائر", username: "guest", bio: "", city: "نواكشوط", avatar: null });
    try { Store.set(PROFILE_KEY, { name: "زائر", username: "guest", bio: "", city: "نواكشوط", avatar: null }); } catch (e) {}
  };

  // مزامنة الإعلانات من Firestore لحظيًا (تظهر لكل المستخدمين)
  useEffect(() => {
    try {
      const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return { ...data, id: d.id, mine: data.ownerId === ownerId, time: timeAgo(data.createdAt, lang) };
        });
        setAds(list);
      }, (err) => { console.error("Firestore:", err); });
      return () => unsub();
    } catch (e) { console.error(e); }
  }, [ownerId, lang]);

  const myAdsCount = ads.filter((a) => a.mine).length;
  const totalViews = ads.filter((a) => a.mine).reduce((sum, a) => sum + (a.views || 0), 0);
  const unreadNotifs = NOTIFS.filter((n) => n.unread).length;
  const unreadMsgs = MOCK_CHATS.reduce((sum, c) => sum + (c.unread || 0), 0);

  const toggleFav = (id) => setFavorites((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const openAd = async (ad) => {
    setSelectedAd({ ...ad, views: (ad.views || 0) + 1 });
    try { await updateDoc(doc(db, "ads", ad.id), { views: increment(1) }); } catch (e) {}
  };
  const goSearch = (catId) => { setSearchCat(catId || "all"); setTab("search"); };
  const deleteAd = async (id) => {
    setSelectedAd((cur) => (cur && cur.id === id ? null : cur));
    setFavorites((prev) => { const n = new Set(prev); n.delete(id); return n; });
    try { await deleteDoc(doc(db, "ads", id)); toast(t("ad_deleted")); } catch (e) { toast("تعذّر الحذف"); }
  };
  const clearAllAds = async () => {
    const mine = ads.filter((a) => a.mine);
    for (const a of mine) { try { await deleteDoc(doc(db, "ads", a.id)); } catch (e) {} }
    toast(t("all_ads_cleared"));
  };
  const restoreSeed = () => { toast("العيّنات غير متاحة في النسخة السحابية"); };

  const handlePublish = async (form) => {
    const fieldDefs = CATEGORY_FIELDS[form.cat] || [];
    const specsArr = fieldDefs
      .filter((f) => form.specs[f.key])
      .map((f) => ({ label: fieldLabel(f.key, lang), value: form.specs[f.key], icon: f.key })); // objects (Firestore-safe)
    const newAd = {
      cat: form.cat, title: form.title, price: form.price, currency: t("currency"),
      city: form.city, area: form.area || "", views: 0, featured: true,
      condition: NO_CONDITION_CATS.includes(form.cat) ? t(form.adType) : t(form.condition),
      desc: form.desc, specs: specsArr, phone: form.phone,
      whatsapp: !!form.whatsapp,
      seller: profile.name || t("guest"),
      sellerUsername: profile.username || "",
      sellerAvatar: profile.avatar || null,
      rating: 0, reviews: 0, verified: false, images: form.images || [],
      lat: form.lat || null, lng: form.lng || null,
      ownerId: ownerId, createdAt: serverTimestamp(),
    };
    try {
      await addDoc(collection(db, "ads"), newAd);
      // لا نضيف محليًا — onSnapshot يجلبه تلقائيًا من السحابة
      return true;
    } catch (e) {
      console.error(e);
      const msg = (e && (e.code || e.message)) ? `${e.code || ""} ${e.message || ""}` : String(e);
      toast("خطأ: " + msg);
      alert("سبب فشل النشر:\n\n" + msg);
      return false;
    }
  };

  if (phase === "splash") return <div dir={dir} className="w-full flex justify-center" style={{ background: "#000", minHeight: "100vh" }}><div className="relative w-full mo-frame" style={{ minHeight: "100vh" }}><SplashScreen onDone={() => setPhase("onboarding")} /></div></div>;

  if (phase === "onboarding") return (
    <div dir={dir} className="w-full flex justify-center" style={{ background: "#000", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <div className="w-full overflow-hidden mo-frame" style={{ minHeight: "100vh", background: C.bg }}>
        <OnboardingScreen onStart={() => setPhase("app")} onLogin={() => setPhase("login")} />
      </div>
    </div>
  );

  if (phase === "login") return (
    <div dir={dir} className="w-full flex justify-center" style={{ background: "#000", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <div className="w-full mo-frame" style={{ minHeight: "100vh", background: C.bg }}>
        <ToastHost />
        <LoginScreen onLogin={() => setPhase("otp")} onGoSignup={() => setPhase("signup")} onBack={() => setPhase("onboarding")} onGoogle={handleGoogleSignIn} />
      </div>
    </div>
  );

  if (phase === "signup") return (
    <div dir={dir} className="w-full flex justify-center" style={{ background: "#000", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <div className="w-full mo-frame" style={{ minHeight: "100vh", background: C.bg }}>
        <ToastHost />
        <SignupScreen onSignup={() => setPhase("otp")} onGoLogin={() => setPhase("login")} onBack={() => setPhase("onboarding")} onGoogle={handleGoogleSignIn} />
      </div>
    </div>
  );

  if (phase === "otp") return (
    <div dir={dir} className="w-full flex justify-center" style={{ background: "#000", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <div className="w-full mo-frame" style={{ minHeight: "100vh", background: C.bg }}>
        <ToastHost />
        <OtpScreen onVerify={() => setPhase("app")} onBack={() => setPhase("login")} />
      </div>
    </div>
  );

  let body;
  if (showNotifs) {
    body = <NotificationsScreen onBack={() => setShowNotifs(false)} />;
  } else if (showStats) {
    body = <StatsScreen ads={ads} onBack={() => setShowStats(false)} onOpenAd={openAd} />;
  } else if (showPlans) {
    body = <PlansScreen onBack={() => setShowPlans(false)} />;
  } else if (showHelp) {
    body = <HelpScreen onBack={() => setShowHelp(false)} />;
  } else if (showReviews) {
    body = <ReviewsScreen onBack={() => setShowReviews(false)} />;
  } else if (showSettings) {
    body = <SettingsScreen onOpenHelp={() => { setShowSettings(false); setShowHelp(true); }} onBack={() => setShowSettings(false)} onLogout={() => { handleSignOut(); setShowSettings(false); setShowNotifs(false); setShowFavorites(false); setShowMyAds(false); setSelectedAd(null); setTab("home"); setPhase("onboarding"); }} />;
  } else if (showMyAds) {
    body = <MyAdsScreen ads={ads} favorites={favorites} onToggleFav={toggleFav} onOpenAd={openAd} onBack={() => setShowMyAds(false)} onDelete={deleteAd} onClearAll={clearAllAds} onRestore={restoreSeed} />;
  } else if (showFavorites) {
    body = <FavoritesScreen ads={ads} favorites={favorites} onToggleFav={toggleFav} onOpenAd={openAd} onBack={() => setShowFavorites(false)} />;
  } else if (selectedAd) {
    body = <AdDetailsScreen ad={selectedAd} isFav={favorites.has(selectedAd.id)} onToggleFav={toggleFav} onBack={() => setSelectedAd(null)} ads={ads} onOpenAd={openAd} onDelete={deleteAd} />;
  } else if (tab === "home") {
    body = <HomeScreen ads={ads} favorites={favorites} onToggleFav={toggleFav} onOpenAd={openAd} onSelectCategory={goSearch} onGoSearch={() => goSearch("all")} onGoAdd={() => setTab("add")} onOpenMenu={() => setTab("profile")} onOpenNotifs={() => setShowNotifs(true)} onOpenMessages={() => setTab("messages")} notifCount={unreadNotifs} msgCount={unreadMsgs} />;
  } else if (tab === "search") {
    body = <SearchScreen ads={ads} favorites={favorites} onToggleFav={toggleFav} onOpenAd={openAd} initialCat={searchCat} />;
  } else if (tab === "add") {
    body = <AddAdScreen onPublish={handlePublish} onExit={() => setTab("home")} />;
  } else if (tab === "messages") {
    body = <MessagesScreen onBack={() => setTab("home")} />;
  } else if (tab === "profile") {
    body = <ProfileScreen profile={profile} setProfile={setProfile} myAdsCount={myAdsCount} totalViews={totalViews} onOpenFavorites={() => setShowFavorites(true)} onOpenMyAds={() => setShowMyAds(true)} onOpenSettings={() => setShowSettings(true)} onOpenStats={() => setShowStats(true)} onOpenPlans={() => setShowPlans(true)} onOpenReviews={() => setShowReviews(true)} onOpenHelp={() => setShowHelp(true)} favCount={favorites.size} msgCount={unreadMsgs} notifCount={unreadNotifs} onLogout={() => { handleSignOut(); setShowNotifs(false); setShowFavorites(false); setShowMyAds(false); setSelectedAd(null); setTab("home"); setPhase("onboarding"); }} onOpenNotifs={() => setShowNotifs(true)} onOpenMessages={() => setTab("messages")} />;
  }

  const hideNav = !!selectedAd || showNotifs || showFavorites || showMyAds || showSettings || showStats || showPlans || showReviews || showHelp || tab === "add";

  return (
    <div dir={dir} className="w-full flex justify-center" style={{ background: "#000", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif" }}>
      <style>{`
        .mo-frame { max-width: 420px; }
        .mo-nav { max-width: 420px; }
        @media (min-width: 700px) {
          .mo-frame { max-width: 720px; }
          .mo-nav { max-width: 720px; }
          .mo-cat-grid { grid-template-columns: repeat(8, minmax(0, 1fr)) !important; }
          .mo-ad-rows { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
          .mo-fav-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .mo-search-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        }
        @media (min-width: 1000px) {
          .mo-frame { max-width: 960px; }
          .mo-nav { max-width: 960px; }
          .mo-ad-rows { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .mo-fav-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .mo-search-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
        }
      `}</style>
      <div className="relative w-full overflow-hidden mo-frame" style={{ minHeight: "100vh", background: C.bg }}>
        <ToastHost />
        <div style={{ paddingBottom: hideNav ? 0 : 78 }}>{body}</div>

        {!hideNav && (
          <div className="fixed w-full flex items-center justify-around py-2 z-30 mo-nav" style={{ background: C.bg, borderTop: `1px solid ${C.border}`, bottom: 0 }}>
            {NAV.map((n) => n.id === "add" ? (
              <button key={n.id} onClick={() => setTab("add")} className="w-14 h-14 rounded-full flex items-center justify-center -mt-6" style={{ background: `linear-gradient(145deg, #2AE6A0, ${C.green} 60%, ${C.greenDim})`, boxShadow: `0 6px 20px ${hexToRgba(C.green, 0.5)}, inset 0 1px 0 ${hexToRgba("#FFFFFF", 0.3)}` }}>
                <Plus size={24} color="#07130E" strokeWidth={2.6} />
              </button>
            ) : (
              <button key={n.id} onClick={() => setTab(n.id)} className="flex flex-col items-center gap-1 px-2 py-1">
                <n.icon size={20} color={tab === n.id ? C.green : C.grayDim} />
                <span className="text-[10px]" style={{ color: tab === n.id ? C.green : C.grayDim }}>{n.key ? t(n.key) : ""}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- language provider wrapper ----------
export default function MauriOneApp() {
  const [lang, setLang] = useState("ar");
  const [theme, setThemeState] = useState("dark");
  const dir = LANGS[lang].dir;
  const t = (key) => (T[key] && T[key][lang]) || key;
  // apply the live palette before first paint of each theme change
  applyTheme(theme);
  const setTheme = (mode) => { applyTheme(mode); setThemeState(mode); };
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", dir);
      document.documentElement.style.background = C.bg;
      if (document.body) document.body.style.background = C.bg;
    }
  }, [dir, theme]);
  return (
    <LangContext.Provider value={{ lang, dir, setLang, t, theme, setTheme, toggleTheme }}>
      <MauriOneInner key={theme + "-" + lang} />
    </LangContext.Provider>
  );
}
