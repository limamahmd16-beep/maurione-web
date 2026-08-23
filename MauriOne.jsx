import React, { useEffect, useMemo, useState } from "react";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  Car, Search, MapPin, Gauge, CalendarDays, Fuel, Settings2, MessageCircle,
  ChevronLeft, X, Plus, LogIn, LogOut, Pencil, Trash2, ShieldCheck, Star,
  CheckCircle2, Languages,
} from "lucide-react";
import { auth, db } from "./firebase.js";

const BRAND = "#0f8a5f";
const CURRENCY = "MRU";

const LANGUAGES = [
  ["ar", "العربية"], ["fr", "Français"], ["en", "English"], ["pt", "Português"],
  ["es", "Español"], ["de", "Deutsch"], ["it", "Italiano"], ["tr", "Türkçe"],
  ["ru", "Русский"], ["zh", "中文"], ["ja", "日本語"], ["ko", "한국어"],
];

const T = {
  ar: {
    cars:"السيارات", how:"كيف نعمل", contact:"تواصل معنا", language:"اللغة",
    pill:"إعلانات مختارة من MauriOne", hero1:"سيارتك القادمة", hero2:"تبدأ من هنا.",
    intro:"سوق سيارات موريتاني بسيط وواضح. اختر السيارة، تواصل معنا، ونحن ننسّق لك مع البائع.",
    searchPlaceholder:"ابحث عن Toyota، Corolla، رقم الإعلان...", allBrands:"كل الماركات", maxPrice:"أعلى سعر", search:"بحث",
    clearListings:"إعلانات واضحة", clearListingsSub:"معلومات السيارة في مكان واحد", direct:"تواصل مباشر معنا", directSub:"عبر WhatsApp",
    organized:"وساطة منظمة", organizedSub:"مرجع مستقل لكل سيارة", latest:"أحدث السيارات",
    demoBanner:"هذه السيارات للمعاينة فقط. ستختفي تلقائيًا عند نشر أول إعلان حقيقي من لوحة الإدارة.",
    featured:"مميزة", demo:"نموذج", details:"عرض التفاصيل", noMatch:"لا توجد سيارة مطابقة للبحث.",
    howTitle:"نختصر المسافة بينك وبين السيارة.", howText:"كل سيارة تحمل رقمًا مرجعيًا واضحًا. عندما تعجبك سيارة، تواصل معنا بالمرجع وسننسّق لك الخطوة التالية.",
    choose:"اختر السيارة", chooseSub:"ابحث وقارن الإعلانات.", sendRef:"أرسل المرجع", sendRefSub:"تواصل معنا عبر WhatsApp.", arrange:"ننسّق المعاينة", arrangeSub:"نربطك بصاحب السيارة.",
    footer:"سوق السيارات في موريتانيا.", admin:"الإدارة", year:"السنة", mileage:"الكيلومترات", fuel:"الوقود", transmission:"ناقل الحركة", color:"اللون", city:"المدينة", reference:"المرجع",
    whatsapp:"تواصل مع MauriOne عبر WhatsApp", whatsappIntro:"السلام عليكم، أريد الاستفسار عن", petrol:"بنزين", diesel:"ديزل", hybrid:"هجين", electric:"كهرباء", automatic:"أوتوماتيك", manual:"عادي",
  },
  fr: {
    cars:"Voitures", how:"Comment ça marche", contact:"Contact", language:"Langue", pill:"Annonces sélectionnées par MauriOne", hero1:"Votre prochaine voiture", hero2:"commence ici.",
    intro:"Un marché automobile mauritanien simple et clair. Choisissez une voiture, contactez-nous et nous coordonnons avec le vendeur.",
    searchPlaceholder:"Rechercher Toyota, Corolla, référence...", allBrands:"Toutes les marques", maxPrice:"Prix maximum", search:"Rechercher",
    clearListings:"Annonces claires", clearListingsSub:"Toutes les informations au même endroit", direct:"Contact direct", directSub:"via WhatsApp", organized:"Médiation organisée", organizedSub:"Une référence unique par voiture", latest:"Dernières voitures",
    demoBanner:"Ces voitures sont uniquement des exemples. Elles disparaîtront après la publication de la première vraie annonce.", featured:"À la une", demo:"Exemple", details:"Voir les détails", noMatch:"Aucune voiture ne correspond à votre recherche.",
    howTitle:"Nous raccourcissons la distance entre vous et la voiture.", howText:"Chaque voiture possède une référence claire. Envoyez-nous cette référence et nous coordonnerons la prochaine étape.",
    choose:"Choisissez la voiture", chooseSub:"Recherchez et comparez.", sendRef:"Envoyez la référence", sendRefSub:"Contactez-nous sur WhatsApp.", arrange:"Nous organisons la visite", arrangeSub:"Nous vous mettons en relation avec le vendeur.",
    footer:"Marché automobile en Mauritanie.", admin:"Administration", year:"Année", mileage:"Kilométrage", fuel:"Carburant", transmission:"Transmission", color:"Couleur", city:"Ville", reference:"Référence",
    whatsapp:"Contacter MauriOne sur WhatsApp", whatsappIntro:"Bonjour, je souhaite des informations sur", petrol:"Essence", diesel:"Diesel", hybrid:"Hybride", electric:"Électrique", automatic:"Automatique", manual:"Manuelle",
  },
  en: {
    cars:"Cars", how:"How it works", contact:"Contact", language:"Language", pill:"Listings selected by MauriOne", hero1:"Your next car", hero2:"starts here.",
    intro:"A simple and clear Mauritanian car marketplace. Choose a car, contact us, and we coordinate with the seller.",
    searchPlaceholder:"Search Toyota, Corolla, listing reference...", allBrands:"All brands", maxPrice:"Maximum price", search:"Search",
    clearListings:"Clear listings", clearListingsSub:"Vehicle information in one place", direct:"Contact us directly", directSub:"via WhatsApp", organized:"Organized brokerage", organizedSub:"A unique reference for every car", latest:"Latest cars",
    demoBanner:"These cars are for preview only. They disappear automatically after the first real listing is published.", featured:"Featured", demo:"Demo", details:"View details", noMatch:"No car matches your search.",
    howTitle:"We shorten the distance between you and the car.", howText:"Every car has a clear reference number. Send us the reference and we will coordinate the next step.",
    choose:"Choose a car", chooseSub:"Search and compare listings.", sendRef:"Send the reference", sendRefSub:"Contact us on WhatsApp.", arrange:"We arrange the viewing", arrangeSub:"We connect you with the seller.",
    footer:"Car marketplace in Mauritania.", admin:"Admin", year:"Year", mileage:"Mileage", fuel:"Fuel", transmission:"Transmission", color:"Color", city:"City", reference:"Reference",
    whatsapp:"Contact MauriOne on WhatsApp", whatsappIntro:"Hello, I would like information about", petrol:"Petrol", diesel:"Diesel", hybrid:"Hybrid", electric:"Electric", automatic:"Automatic", manual:"Manual",
  },
  pt: {
    cars:"Carros", how:"Como funciona", contact:"Contacto", language:"Idioma", pill:"Anúncios selecionados pela MauriOne", hero1:"O seu próximo carro", hero2:"começa aqui.",
    intro:"Um mercado automóvel mauritano simples e claro. Escolha o carro, fale connosco e coordenamos com o vendedor.",
    searchPlaceholder:"Pesquisar Toyota, Corolla, referência...", allBrands:"Todas as marcas", maxPrice:"Preço máximo", search:"Pesquisar",
    clearListings:"Anúncios claros", clearListingsSub:"Informação do carro num só lugar", direct:"Contacto direto", directSub:"via WhatsApp", organized:"Mediação organizada", organizedSub:"Uma referência única por carro", latest:"Carros mais recentes",
    demoBanner:"Estes carros são apenas para pré-visualização. Desaparecem após a publicação do primeiro anúncio real.", featured:"Destaque", demo:"Exemplo", details:"Ver detalhes", noMatch:"Nenhum carro corresponde à pesquisa.",
    howTitle:"Encurtamos a distância entre si e o carro.", howText:"Cada carro tem uma referência clara. Envie-nos essa referência e coordenamos o próximo passo.",
    choose:"Escolha o carro", chooseSub:"Pesquise e compare anúncios.", sendRef:"Envie a referência", sendRefSub:"Fale connosco no WhatsApp.", arrange:"Organizamos a visita", arrangeSub:"Ligamos-lhe ao vendedor.",
    footer:"Mercado automóvel na Mauritânia.", admin:"Administração", year:"Ano", mileage:"Quilometragem", fuel:"Combustível", transmission:"Transmissão", color:"Cor", city:"Cidade", reference:"Referência",
    whatsapp:"Contactar MauriOne no WhatsApp", whatsappIntro:"Olá, gostaria de informações sobre", petrol:"Gasolina", diesel:"Diesel", hybrid:"Híbrido", electric:"Elétrico", automatic:"Automático", manual:"Manual",
  },
  es: {
    cars:"Coches", how:"Cómo funciona", contact:"Contacto", language:"Idioma", pill:"Anuncios seleccionados por MauriOne", hero1:"Tu próximo coche", hero2:"empieza aquí.",
    intro:"Un mercado de coches mauritano simple y claro. Elige el coche, contáctanos y coordinamos con el vendedor.", searchPlaceholder:"Buscar Toyota, Corolla, referencia...", allBrands:"Todas las marcas", maxPrice:"Precio máximo", search:"Buscar",
    clearListings:"Anuncios claros", clearListingsSub:"Información del vehículo en un solo lugar", direct:"Contacto directo", directSub:"por WhatsApp", organized:"Intermediación organizada", organizedSub:"Una referencia única por coche", latest:"Últimos coches",
    demoBanner:"Estos coches son solo de muestra. Desaparecerán tras publicar el primer anuncio real.", featured:"Destacado", demo:"Ejemplo", details:"Ver detalles", noMatch:"No hay coches que coincidan con tu búsqueda.",
    howTitle:"Acortamos la distancia entre tú y el coche.", howText:"Cada coche tiene una referencia clara. Envíanosla y coordinaremos el siguiente paso.", choose:"Elige el coche", chooseSub:"Busca y compara anuncios.", sendRef:"Envía la referencia", sendRefSub:"Contáctanos por WhatsApp.", arrange:"Organizamos la visita", arrangeSub:"Te conectamos con el vendedor.",
    footer:"Mercado de coches en Mauritania.", admin:"Administración", year:"Año", mileage:"Kilometraje", fuel:"Combustible", transmission:"Transmisión", color:"Color", city:"Ciudad", reference:"Referencia",
    whatsapp:"Contactar a MauriOne por WhatsApp", whatsappIntro:"Hola, quisiera información sobre", petrol:"Gasolina", diesel:"Diésel", hybrid:"Híbrido", electric:"Eléctrico", automatic:"Automático", manual:"Manual",
  },
  de: {
    cars:"Autos", how:"So funktioniert es", contact:"Kontakt", language:"Sprache", pill:"Von MauriOne ausgewählte Anzeigen", hero1:"Ihr nächstes Auto", hero2:"beginnt hier.", intro:"Ein einfacher und übersichtlicher mauretanischer Automarkt. Wählen Sie ein Auto, kontaktieren Sie uns und wir koordinieren mit dem Verkäufer.", searchPlaceholder:"Toyota, Corolla oder Referenz suchen...", allBrands:"Alle Marken", maxPrice:"Höchstpreis", search:"Suchen", clearListings:"Klare Anzeigen", clearListingsSub:"Fahrzeuginfos an einem Ort", direct:"Direkter Kontakt", directSub:"über WhatsApp", organized:"Organisierte Vermittlung", organizedSub:"Eine eindeutige Referenz pro Auto", latest:"Neueste Autos", demoBanner:"Diese Autos dienen nur zur Vorschau und verschwinden nach der ersten echten Anzeige.", featured:"Top", demo:"Demo", details:"Details ansehen", noMatch:"Kein Auto entspricht Ihrer Suche.", howTitle:"Wir verkürzen den Weg zwischen Ihnen und dem Auto.", howText:"Jedes Auto hat eine eindeutige Referenz. Senden Sie sie uns, und wir koordinieren den nächsten Schritt.", choose:"Auto wählen", chooseSub:"Anzeigen suchen und vergleichen.", sendRef:"Referenz senden", sendRefSub:"Kontakt über WhatsApp.", arrange:"Besichtigung organisieren", arrangeSub:"Wir verbinden Sie mit dem Verkäufer.", footer:"Automarkt in Mauretanien.", admin:"Admin", year:"Jahr", mileage:"Kilometerstand", fuel:"Kraftstoff", transmission:"Getriebe", color:"Farbe", city:"Stadt", reference:"Referenz", whatsapp:"MauriOne über WhatsApp kontaktieren", whatsappIntro:"Hallo, ich möchte Informationen zu", petrol:"Benzin", diesel:"Diesel", hybrid:"Hybrid", electric:"Elektrisch", automatic:"Automatik", manual:"Manuell",
  },
  it: {
    cars:"Auto", how:"Come funziona", contact:"Contatti", language:"Lingua", pill:"Annunci selezionati da MauriOne", hero1:"La tua prossima auto", hero2:"inizia da qui.", intro:"Un mercato auto mauritano semplice e chiaro. Scegli l'auto, contattaci e coordiniamo con il venditore.", searchPlaceholder:"Cerca Toyota, Corolla, riferimento...", allBrands:"Tutte le marche", maxPrice:"Prezzo massimo", search:"Cerca", clearListings:"Annunci chiari", clearListingsSub:"Tutte le informazioni in un unico posto", direct:"Contatto diretto", directSub:"via WhatsApp", organized:"Mediazione organizzata", organizedSub:"Un riferimento unico per ogni auto", latest:"Ultime auto", demoBanner:"Queste auto sono solo dimostrative e spariranno dopo il primo annuncio reale.", featured:"In evidenza", demo:"Demo", details:"Vedi dettagli", noMatch:"Nessuna auto corrisponde alla ricerca.", howTitle:"Riduciamo la distanza tra te e l'auto.", howText:"Ogni auto ha un riferimento chiaro. Inviacelo e coordineremo il passo successivo.", choose:"Scegli l'auto", chooseSub:"Cerca e confronta gli annunci.", sendRef:"Invia il riferimento", sendRefSub:"Contattaci su WhatsApp.", arrange:"Organizziamo la visita", arrangeSub:"Ti mettiamo in contatto con il venditore.", footer:"Mercato auto in Mauritania.", admin:"Amministrazione", year:"Anno", mileage:"Chilometraggio", fuel:"Carburante", transmission:"Trasmissione", color:"Colore", city:"Città", reference:"Riferimento", whatsapp:"Contatta MauriOne su WhatsApp", whatsappIntro:"Salve, vorrei informazioni su", petrol:"Benzina", diesel:"Diesel", hybrid:"Ibrido", electric:"Elettrico", automatic:"Automatico", manual:"Manuale",
  },
  tr: {
    cars:"Arabalar", how:"Nasıl çalışır", contact:"İletişim", language:"Dil", pill:"MauriOne tarafından seçilen ilanlar", hero1:"Sıradaki arabanız", hero2:"burada başlar.", intro:"Basit ve anlaşılır bir Moritanya otomobil pazarı. Aracı seçin, bize ulaşın, satıcıyla koordinasyonu biz yapalım.", searchPlaceholder:"Toyota, Corolla veya ilan no ara...", allBrands:"Tüm markalar", maxPrice:"Maksimum fiyat", search:"Ara", clearListings:"Net ilanlar", clearListingsSub:"Araç bilgileri tek yerde", direct:"Doğrudan iletişim", directSub:"WhatsApp üzerinden", organized:"Düzenli aracılık", organizedSub:"Her araç için benzersiz referans", latest:"En yeni araçlar", demoBanner:"Bu araçlar yalnızca önizleme içindir; ilk gerçek ilan yayınlandığında kaybolur.", featured:"Öne çıkan", demo:"Demo", details:"Detayları gör", noMatch:"Aramanızla eşleşen araç yok.", howTitle:"Sizinle araç arasındaki mesafeyi kısaltıyoruz.", howText:"Her aracın net bir referans numarası vardır. Bize gönderin, sonraki adımı koordine edelim.", choose:"Aracı seç", chooseSub:"İlanları ara ve karşılaştır.", sendRef:"Referansı gönder", sendRefSub:"WhatsApp'tan bize ulaş.", arrange:"Görüşmeyi ayarlıyoruz", arrangeSub:"Sizi satıcıyla buluşturuyoruz.", footer:"Moritanya otomobil pazarı.", admin:"Yönetim", year:"Yıl", mileage:"Kilometre", fuel:"Yakıt", transmission:"Şanzıman", color:"Renk", city:"Şehir", reference:"Referans", whatsapp:"MauriOne ile WhatsApp'ta iletişim", whatsappIntro:"Merhaba, şu araç hakkında bilgi almak istiyorum:", petrol:"Benzin", diesel:"Dizel", hybrid:"Hibrit", electric:"Elektrik", automatic:"Otomatik", manual:"Manuel",
  },
  ru: {
    cars:"Автомобили", how:"Как это работает", contact:"Контакты", language:"Язык", pill:"Объявления от MauriOne", hero1:"Ваш следующий автомобиль", hero2:"начинается здесь.", intro:"Простой и понятный автомобильный рынок Мавритании. Выберите автомобиль, свяжитесь с нами, и мы договоримся с продавцом.", searchPlaceholder:"Поиск Toyota, Corolla, номера объявления...", allBrands:"Все марки", maxPrice:"Максимальная цена", search:"Поиск", clearListings:"Понятные объявления", clearListingsSub:"Вся информация об авто в одном месте", direct:"Прямая связь", directSub:"через WhatsApp", organized:"Организованное посредничество", organizedSub:"Уникальный номер для каждого авто", latest:"Новые автомобили", demoBanner:"Эти автомобили показаны только для примера и исчезнут после первого реального объявления.", featured:"Рекомендуем", demo:"Демо", details:"Подробнее", noMatch:"Автомобили не найдены.", howTitle:"Мы сокращаем путь между вами и автомобилем.", howText:"У каждого автомобиля есть уникальный номер. Отправьте его нам, и мы организуем следующий шаг.", choose:"Выберите авто", chooseSub:"Ищите и сравнивайте объявления.", sendRef:"Отправьте номер", sendRefSub:"Свяжитесь с нами в WhatsApp.", arrange:"Организуем осмотр", arrangeSub:"Свяжем вас с продавцом.", footer:"Авторынок в Мавритании.", admin:"Админ", year:"Год", mileage:"Пробег", fuel:"Топливо", transmission:"Коробка", color:"Цвет", city:"Город", reference:"Номер", whatsapp:"Связаться с MauriOne в WhatsApp", whatsappIntro:"Здравствуйте, я хочу узнать об автомобиле", petrol:"Бензин", diesel:"Дизель", hybrid:"Гибрид", electric:"Электро", automatic:"Автомат", manual:"Механика",
  },
  zh: {
    cars:"汽车", how:"如何运作", contact:"联系我们", language:"语言", pill:"MauriOne 精选车源", hero1:"您的下一辆车", hero2:"从这里开始。", intro:"简单清晰的毛里塔尼亚汽车市场。选择车辆、联系我们，我们负责与卖家协调。", searchPlaceholder:"搜索 Toyota、Corolla 或车辆编号...", allBrands:"所有品牌", maxPrice:"最高价格", search:"搜索", clearListings:"清晰车源", clearListingsSub:"车辆信息集中展示", direct:"直接联系", directSub:"通过 WhatsApp", organized:"规范中介", organizedSub:"每辆车都有唯一编号", latest:"最新车辆", demoBanner:"这些车辆仅用于预览，发布第一条真实车源后会自动消失。", featured:"精选", demo:"示例", details:"查看详情", noMatch:"没有符合搜索条件的车辆。", howTitle:"让您更快找到合适的车。", howText:"每辆车都有清晰的参考编号。把编号发给我们，我们会协调下一步。", choose:"选择车辆", chooseSub:"搜索并比较车源。", sendRef:"发送编号", sendRefSub:"通过 WhatsApp 联系我们。", arrange:"安排看车", arrangeSub:"我们帮您联系卖家。", footer:"毛里塔尼亚汽车市场。", admin:"管理", year:"年份", mileage:"里程", fuel:"燃料", transmission:"变速箱", color:"颜色", city:"城市", reference:"编号", whatsapp:"通过 WhatsApp 联系 MauriOne", whatsappIntro:"您好，我想了解这辆车：", petrol:"汽油", diesel:"柴油", hybrid:"混合动力", electric:"电动", automatic:"自动", manual:"手动",
  },
  ja: {
    cars:"車", how:"仕組み", contact:"お問い合わせ", language:"言語", pill:"MauriOne 厳選掲載", hero1:"次の一台は", hero2:"ここから始まります。", intro:"シンプルで分かりやすいモーリタニアの自動車マーケット。車を選び、ご連絡いただければ販売者との調整を行います。", searchPlaceholder:"Toyota、Corolla、掲載番号を検索...", allBrands:"すべてのブランド", maxPrice:"上限価格", search:"検索", clearListings:"分かりやすい掲載", clearListingsSub:"車両情報を一か所に", direct:"直接連絡", directSub:"WhatsAppで", organized:"安心の仲介", organizedSub:"各車両に固有番号", latest:"新着車両", demoBanner:"これらはプレビュー用です。最初の実車掲載後に自動で消えます。", featured:"おすすめ", demo:"デモ", details:"詳細を見る", noMatch:"条件に一致する車がありません。", howTitle:"あなたと車との距離を縮めます。", howText:"各車には明確な参照番号があります。その番号を送れば次の手続きを調整します。", choose:"車を選ぶ", chooseSub:"検索して比較します。", sendRef:"番号を送る", sendRefSub:"WhatsAppでご連絡ください。", arrange:"現車確認を調整", arrangeSub:"販売者へおつなぎします。", footer:"モーリタニアの自動車マーケット。", admin:"管理", year:"年式", mileage:"走行距離", fuel:"燃料", transmission:"トランスミッション", color:"色", city:"都市", reference:"参照番号", whatsapp:"WhatsAppでMauriOneに連絡", whatsappIntro:"こんにちは、この車について知りたいです：", petrol:"ガソリン", diesel:"ディーゼル", hybrid:"ハイブリッド", electric:"電気", automatic:"オートマ", manual:"マニュアル",
  },
  ko: {
    cars:"자동차", how:"이용 방법", contact:"문의", language:"언어", pill:"MauriOne 엄선 매물", hero1:"다음 자동차는", hero2:"여기서 시작됩니다.", intro:"간단하고 명확한 모리타니 자동차 마켓입니다. 차량을 고르고 연락하면 판매자와의 연결을 조율해드립니다.", searchPlaceholder:"Toyota, Corolla, 매물 번호 검색...", allBrands:"모든 브랜드", maxPrice:"최대 가격", search:"검색", clearListings:"명확한 매물", clearListingsSub:"차량 정보를 한곳에서", direct:"직접 문의", directSub:"WhatsApp", organized:"체계적인 중개", organizedSub:"차량별 고유 번호", latest:"최신 차량", demoBanner:"이 차량들은 미리보기용이며 첫 실제 매물이 등록되면 자동으로 사라집니다.", featured:"추천", demo:"데모", details:"상세 보기", noMatch:"검색 조건에 맞는 차량이 없습니다.", howTitle:"차량을 더 빠르게 찾을 수 있게 합니다.", howText:"각 차량에는 고유한 참조 번호가 있습니다. 번호를 보내주시면 다음 단계를 조율합니다.", choose:"차량 선택", chooseSub:"매물을 검색하고 비교하세요.", sendRef:"번호 보내기", sendRefSub:"WhatsApp으로 문의하세요.", arrange:"방문 조율", arrangeSub:"판매자와 연결해드립니다.", footer:"모리타니 자동차 마켓.", admin:"관리", year:"연식", mileage:"주행거리", fuel:"연료", transmission:"변속기", color:"색상", city:"도시", reference:"참조 번호", whatsapp:"WhatsApp으로 MauriOne 문의", whatsappIntro:"안녕하세요, 이 차량에 대해 문의드립니다:", petrol:"가솔린", diesel:"디젤", hybrid:"하이브리드", electric:"전기", automatic:"자동", manual:"수동",
  },
};

const demoCars = [
  { id:"demo-1", title:"Toyota Corolla 2020", brand:"Toyota", model:"Corolla", year:2020, price:420000, mileage:85000, fuel:"بنزين", transmission:"أوتوماتيك", city:"نواكشوط", color:"أبيض", featured:true, reference:"MO-0125", description:"سيارة نظيفة، جاهزة للمعاينة. هذا إعلان تجريبي لتوضيح شكل الموقع.", images:["https://images.unsplash.com/photo-1623869675781-80aa31012a5a?auto=format&fit=crop&w=1400&q=85"], demo:true },
  { id:"demo-2", title:"Toyota RAV4 2018", brand:"Toyota", model:"RAV4", year:2018, price:590000, mileage:102000, fuel:"بنزين", transmission:"أوتوماتيك", city:"نواكشوط", color:"رمادي", featured:false, reference:"MO-0126", description:"إعلان تجريبي. سيتم استبداله بسيارات حقيقية من لوحة الإدارة.", images:["https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1400&q=85"], demo:true },
  { id:"demo-3", title:"Toyota Hilux 2019", brand:"Toyota", model:"Hilux", year:2019, price:980000, mileage:118000, fuel:"ديزل", transmission:"عادي", city:"نواكشوط", color:"أبيض", featured:false, reference:"MO-0127", description:"إعلان تجريبي لعرض تصميم بطاقة السيارة.", images:["https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=1400&q=85"], demo:true },
];

const emptyForm = { title:"", brand:"", model:"", year:"", price:"", mileage:"", fuel:"بنزين", transmission:"أوتوماتيك", city:"نواكشوط", color:"", reference:"", description:"", imageUrls:"", featured:false };

const specKey = (value) => ({
  "بنزين":"petrol", "Gasoline":"petrol", "Petrol":"petrol", "Essence":"petrol", "Gasolina":"petrol",
  "ديزل":"diesel", "Diesel":"diesel", "هجين":"hybrid", "Hybrid":"hybrid", "Hybride":"hybrid",
  "كهرباء":"electric", "Electric":"electric", "Électrique":"electric", "أوتوماتيك":"automatic", "Automatic":"automatic", "Automatique":"automatic",
  "عادي":"manual", "Manual":"manual", "Manuelle":"manual",
}[value] || null);

function App() {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem("maurione_lang");
    if (saved && T[saved]) return saved;
    const browser = (navigator.language || "ar").split("-")[0].toLowerCase();
    return T[browser] ? browser : "en";
  });
  const t = (key) => T[lang]?.[key] || T.en[key] || key;
  const rtl = lang === "ar";
  const formatNumber = (value) => new Intl.NumberFormat(lang, { maximumFractionDigits:0 }).format(Number(value || 0));
  const trSpec = (value) => { const k = specKey(value); return k ? t(k) : value; };

  const [cars, setCars] = useState([]);
  const [dbReady, setDbReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [adminMode, setAdminMode] = useState(() => window.location.hash === "#admin");
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({ email:"", password:"" });
  const [loginError, setLoginError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    localStorage.setItem("maurione_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.title = `MauriOne — ${t("footer")}`;
  }, [lang]);

  useEffect(() => {
    const handleHash = () => setAdminMode(window.location.hash === "#admin");
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  useEffect(() => {
    const q = query(collection(db, "cars"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => { setCars(snap.docs.map((d) => ({ id:d.id, ...d.data() }))); setDbReady(true); }, () => setDbReady(true));
  }, []);

  const visibleCars = dbReady && cars.length ? cars : demoCars;
  const brands = useMemo(() => [...new Set(visibleCars.map((c) => c.brand).filter(Boolean))].sort(), [visibleCars]);
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return visibleCars.filter((c) => {
      const hay = `${c.title || ""} ${c.brand || ""} ${c.model || ""} ${c.reference || ""}`.toLowerCase();
      return (!term || hay.includes(term)) && (!brand || c.brand === brand) && (!maxPrice || Number(c.price || 0) <= Number(maxPrice));
    });
  }, [visibleCars, search, brand, maxPrice]);

  const contactWhatsApp = (car) => {
    const text = encodeURIComponent(`${t("whatsappIntro")} ${car.title || ""} — ${t("reference")}: ${car.reference || car.id}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const submitLogin = async (e) => {
    e.preventDefault(); setLoginError("");
    try { await signInWithEmailAndPassword(auth, login.email.trim(), login.password); }
    catch { setLoginError("بيانات الدخول غير صحيحة."); }
  };
  const resetForm = () => { setForm(emptyForm); setEditingId(null); };
  const editCar = (car) => {
    if (car.demo) { setNotice("هذا إعلان تجريبي وليس محفوظًا في قاعدة البيانات."); return; }
    setEditingId(car.id);
    setForm({ title:car.title||"", brand:car.brand||"", model:car.model||"", year:car.year||"", price:car.price||"", mileage:car.mileage||"", fuel:car.fuel||"بنزين", transmission:car.transmission||"أوتوماتيك", city:car.city||"نواكشوط", color:car.color||"", reference:car.reference||"", description:car.description||"", imageUrls:Array.isArray(car.images)?car.images.join("\n"):"", featured:Boolean(car.featured) });
    window.scrollTo({ top:0, behavior:"smooth" });
  };
  const saveCar = async (e) => {
    e.preventDefault(); setSaving(true); setNotice("");
    const payload = { title:form.title.trim(), brand:form.brand.trim(), model:form.model.trim(), year:Number(form.year), price:Number(form.price), mileage:Number(form.mileage||0), fuel:form.fuel, transmission:form.transmission, city:form.city.trim(), color:form.color.trim(), reference:form.reference.trim(), description:form.description.trim(), featured:Boolean(form.featured), images:form.imageUrls.split("\n").map((x)=>x.trim()).filter(Boolean), updatedAt:serverTimestamp() };
    try {
      if (editingId) { await updateDoc(doc(db,"cars",editingId), payload); setNotice("تم تحديث الإعلان."); }
      else { await addDoc(collection(db,"cars"), { ...payload, createdAt:serverTimestamp() }); setNotice("تم نشر السيارة على الموقع."); }
      resetForm();
    } catch { setNotice("تعذر الحفظ. تحقق من صلاحيات Firebase."); }
    finally { setSaving(false); }
  };
  const removeCar = async (car) => {
    if (car.demo || !window.confirm(`حذف إعلان ${car.title}؟`)) return;
    try { await deleteDoc(doc(db,"cars",car.id)); setNotice("تم حذف الإعلان."); }
    catch { setNotice("تعذر حذف الإعلان."); }
  };

  if (adminMode) {
    return (
      <div className="app" dir="rtl"><GlobalStyles />
        <header className="topbar"><a className="brand" href="#"><Brand subtitle="سوق السيارات في موريتانيا" /></a><a className="secondary-btn" href="#"><ChevronLeft size={18}/> عرض الموقع</a></header>
        <main className="admin-shell">
          {!user ? (
            <section className="login-card"><div className="admin-icon"><ShieldCheck size={28}/></div><h1>دخول إدارة MauriOne</h1><p>هذه الصفحة خاصة بإدارة إعلانات السيارات.</p>
              <form onSubmit={submitLogin} className="stack"><label>البريد الإلكتروني</label><input type="email" required value={login.email} onChange={(e)=>setLogin({...login,email:e.target.value})} placeholder="admin@example.com"/><label>كلمة المرور</label><input type="password" required value={login.password} onChange={(e)=>setLogin({...login,password:e.target.value})}/>{loginError&&<div className="error">{loginError}</div>}<button className="primary-btn wide" type="submit"><LogIn size={18}/> دخول</button></form>
            </section>
          ) : (<>
            <section className="admin-head"><div><span className="eyebrow">لوحة الإدارة</span><h1>{editingId?"تعديل السيارة":"نشر سيارة جديدة"}</h1><p>أنت فقط من يستطيع إضافة الإعلانات من هذه الصفحة.</p></div><button className="secondary-btn" onClick={()=>signOut(auth)}><LogOut size={17}/> تسجيل الخروج</button></section>
            {notice&&<div className="notice">{notice}</div>}
            <form className="admin-form" onSubmit={saveCar}><div className="form-grid">
              <Field label="عنوان الإعلان"><input required value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} placeholder="Toyota Corolla 2020"/></Field>
              <Field label="المرجع"><input required value={form.reference} onChange={(e)=>setForm({...form,reference:e.target.value})} placeholder="MO-0128"/></Field>
              <Field label="الماركة"><input required value={form.brand} onChange={(e)=>setForm({...form,brand:e.target.value})} placeholder="Toyota"/></Field>
              <Field label="الموديل"><input required value={form.model} onChange={(e)=>setForm({...form,model:e.target.value})} placeholder="Corolla"/></Field>
              <Field label="السنة"><input required inputMode="numeric" value={form.year} onChange={(e)=>setForm({...form,year:e.target.value})} placeholder="2020"/></Field>
              <Field label={`السعر (${CURRENCY})`}><input required inputMode="numeric" value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} placeholder="420000"/></Field>
              <Field label="الكيلومترات"><input inputMode="numeric" value={form.mileage} onChange={(e)=>setForm({...form,mileage:e.target.value})} placeholder="85000"/></Field>
              <Field label="المدينة"><input required value={form.city} onChange={(e)=>setForm({...form,city:e.target.value})}/></Field>
              <Field label="الوقود"><select value={form.fuel} onChange={(e)=>setForm({...form,fuel:e.target.value})}><option>بنزين</option><option>ديزل</option><option>هجين</option><option>كهرباء</option></select></Field>
              <Field label="ناقل الحركة"><select value={form.transmission} onChange={(e)=>setForm({...form,transmission:e.target.value})}><option>أوتوماتيك</option><option>عادي</option></select></Field>
              <Field label="اللون"><input value={form.color} onChange={(e)=>setForm({...form,color:e.target.value})} placeholder="أبيض"/></Field>
              <Field label="الإعلان المميز"><label className="check"><input type="checkbox" checked={form.featured} onChange={(e)=>setForm({...form,featured:e.target.checked})}/> تثبيت كسيارة مميزة</label></Field>
            </div>
            <Field label="روابط الصور — رابط في كل سطر"><textarea rows="5" value={form.imageUrls} onChange={(e)=>setForm({...form,imageUrls:e.target.value})} placeholder="https://..."/></Field>
            <Field label="وصف السيارة"><textarea rows="4" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} placeholder="الحالة، التجهيزات، الملاحظات..."/></Field>
            <div className="actions-row"><button className="primary-btn" disabled={saving}>{editingId?<Pencil size={18}/>:<Plus size={18}/>} {saving?"جارٍ الحفظ...":editingId?"حفظ التعديلات":"نشر الإعلان"}</button>{editingId&&<button type="button" className="secondary-btn" onClick={resetForm}>إلغاء</button>}</div></form>
            <section className="admin-list"><div className="section-title"><div><span className="eyebrow">الإعلانات</span><h2>السيارات المنشورة</h2></div><span className="count">{cars.length}</span></div>{cars.length===0?<div className="empty">لا توجد سيارات حقيقية بعد. أضف أول سيارة من النموذج أعلاه.</div>:<div className="admin-cars">{cars.map((car)=><div className="admin-car" key={car.id}><img src={car.images?.[0]||"https://placehold.co/240x160?text=MauriOne"} alt=""/><div className="admin-car-main"><strong>{car.title}</strong><span>{formatNumber(car.price)} {CURRENCY} · {car.reference}</span></div><button onClick={()=>editCar(car)} title="تعديل"><Pencil size={18}/></button><button className="danger" onClick={()=>removeCar(car)} title="حذف"><Trash2 size={18}/></button></div>)}</div>}</section>
          </>)}
        </main>
      </div>
    );
  }

  return (
    <div className="app" dir={rtl?"rtl":"ltr"}><GlobalStyles />
      <header className="topbar">
        <a className="brand" href="#"><Brand subtitle={t("footer")}/></a>
        <nav><a href="#cars">{t("cars")}</a><a href="#how">{t("how")}</a><a href="#contact">{t("contact")}</a></nav>
        <label className="language-switch"><Languages size={17}/><select aria-label={t("language")} value={lang} onChange={(e)=>setLang(e.target.value)}>{LANGUAGES.map(([code,label])=><option key={code} value={code}>{label}</option>)}</select></label>
      </header>
      <main>
        <section className="hero"><div className="hero-bg"/><div className="hero-content"><span className="hero-pill"><ShieldCheck size={16}/> {t("pill")}</span><h1>{t("hero1")}<br/><em>{t("hero2")}</em></h1><p>{t("intro")}</p>
          <div className="search-panel"><div className="search-input"><Search size={20}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder={t("searchPlaceholder")}/></div><select value={brand} onChange={(e)=>setBrand(e.target.value)}><option value="">{t("allBrands")}</option>{brands.map((b)=><option key={b}>{b}</option>)}</select><input className="price-filter" inputMode="numeric" value={maxPrice} onChange={(e)=>setMaxPrice(e.target.value)} placeholder={t("maxPrice")}/><a href="#cars" className="primary-btn"><Search size={18}/> {t("search")}</a></div>
        </div></section>
        <section className="trust-strip"><div><CheckCircle2 size={20}/><span><strong>{t("clearListings")}</strong><small>{t("clearListingsSub")}</small></span></div><div><MessageCircle size={20}/><span><strong>{t("direct")}</strong><small>{t("directSub")}</small></span></div><div><ShieldCheck size={20}/><span><strong>{t("organized")}</strong><small>{t("organizedSub")}</small></span></div></section>
        <section id="cars" className="section"><div className="section-title"><div><span className="eyebrow">MauriOne Cars</span><h2>{t("latest")}</h2></div><span className="count">{filtered.length}</span></div>{dbReady&&cars.length===0&&<div className="demo-banner">{t("demoBanner")}</div>}
          <div className="car-grid">{filtered.map((car)=><article className="car-card" key={car.id} onClick={()=>setSelected(car)}><div className="car-image"><img src={car.images?.[0]||"https://placehold.co/900x600?text=MauriOne"} alt={car.title}/>{car.featured&&<span className="featured"><Star size={14} fill="currentColor"/> {t("featured")}</span>}{car.demo&&<span className="demo">{t("demo")}</span>}</div><div className="car-body"><div className="card-topline"><span className="ref">{car.reference}</span><span className="location"><MapPin size={14}/>{car.city}</span></div><h3>{car.title}</h3><div className="price">{formatNumber(car.price)} <small>{CURRENCY}</small></div><div className="spec-row"><Info icon={CalendarDays}>{car.year}</Info><Info icon={Gauge}>{formatNumber(car.mileage)} km</Info><Info icon={Settings2}>{trSpec(car.transmission)}</Info></div><button className="card-action">{t("details")} <ChevronLeft className="direction-icon" size={18}/></button></div></article>)}</div>{filtered.length===0&&<div className="empty">{t("noMatch")}</div>}
        </section>
        <section id="how" className="how"><div className="how-copy"><span className="eyebrow">MauriOne</span><h2>{t("howTitle")}</h2><p>{t("howText")}</p></div><div className="steps"><div><b>01</b><span><strong>{t("choose")}</strong><small>{t("chooseSub")}</small></span></div><div><b>02</b><span><strong>{t("sendRef")}</strong><small>{t("sendRefSub")}</small></span></div><div><b>03</b><span><strong>{t("arrange")}</strong><small>{t("arrangeSub")}</small></span></div></div></section>
      </main>
      <footer id="contact"><Brand light subtitle={t("footer")}/><p>{t("footer")}</p><div className="footer-row"><span>© {new Date().getFullYear()} MauriOne</span><a href="#admin" className="admin-link">{t("admin")}</a></div></footer>
      {selected&&<div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="modal" onClick={(e)=>e.stopPropagation()}><button className="close" onClick={()=>setSelected(null)}><X size={22}/></button><div className="modal-image"><img src={selected.images?.[0]||"https://placehold.co/1200x800?text=MauriOne"} alt={selected.title}/>{selected.featured&&<span className="featured"><Star size={14} fill="currentColor"/> {t("featured")}</span>}</div><div className="modal-body"><div className="card-topline"><span className="ref">{selected.reference}</span><span className="location"><MapPin size={14}/>{selected.city}</span></div><h2>{selected.title}</h2><div className="modal-price">{formatNumber(selected.price)} <small>{CURRENCY}</small></div><div className="details-grid"><Detail label={t("year")} value={selected.year} icon={CalendarDays}/><Detail label={t("mileage")} value={`${formatNumber(selected.mileage)} km`} icon={Gauge}/><Detail label={t("fuel")} value={trSpec(selected.fuel)} icon={Fuel}/><Detail label={t("transmission")} value={trSpec(selected.transmission)} icon={Settings2}/><Detail label={t("color")} value={selected.color||"—"} icon={Car}/><Detail label={t("city")} value={selected.city} icon={MapPin}/></div>{selected.description&&<p className="description">{selected.description}</p>}<button className="whatsapp" onClick={()=>contactWhatsApp(selected)}><MessageCircle size={20}/> {t("whatsapp")}</button></div></div></div>}
    </div>
  );
}

function Brand({ light=false, subtitle="" }) { return <span className={`brand-lockup ${light?"light":""}`}><span className="brand-mark"><Car size={24} strokeWidth={2.2}/></span><span><strong>MauriOne</strong><small>{subtitle}</small></span></span>; }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Detail({ icon:Icon, label, value }) { return <div className="detail"><Icon size={18}/><span><small>{label}</small><strong>{value}</strong></span></div>; }
function Info({ icon:Icon, children }) { return <span className="info-chip"><Icon size={16} strokeWidth={1.9}/>{children}</span>; }

function GlobalStyles() { return <style>{`
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#f6f7f8;color:#111827;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Tahoma,Arial,sans-serif}button,input,select,textarea{font:inherit}button,a{-webkit-tap-highlight-color:transparent}.app{min-height:100vh}.topbar{height:78px;padding:0 clamp(18px,5vw,72px);display:flex;align-items:center;justify-content:space-between;gap:22px;background:#fff;border-bottom:1px solid #e5e7eb;position:sticky;top:0;z-index:40}.brand{text-decoration:none;color:inherit}.brand-lockup{display:flex;align-items:center;gap:11px}.brand-mark{width:42px;height:42px;border-radius:14px;background:${BRAND};display:grid;place-items:center;color:#fff}.brand-lockup>span:last-child{display:flex;flex-direction:column}.brand-lockup strong{font-size:20px;letter-spacing:-.5px}.brand-lockup small{font-size:10px;color:#6b7280;margin-top:1px}.brand-lockup.light strong,.brand-lockup.light small{color:#fff}.topbar nav{display:flex;gap:24px;margin-inline:auto}.topbar nav a{text-decoration:none;color:#374151;font-weight:700;font-size:14px}.language-switch{display:flex;align-items:center;gap:7px;border:1px solid #e5e7eb;border-radius:12px;padding:7px 10px;background:#fff;color:#374151}.language-switch select{border:0;background:transparent;outline:0;font-size:13px;font-weight:800;color:#111827;max-width:115px}.hero{min-height:540px;position:relative;display:flex;align-items:center;overflow:hidden;background:#101827}.hero-bg{position:absolute;inset:0;background:linear-gradient(90deg,rgba(9,16,25,.94) 0%,rgba(9,16,25,.82) 48%,rgba(9,16,25,.3) 100%),url("https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1800&q=85") center/cover}.app[dir="rtl"] .hero-bg{background:linear-gradient(270deg,rgba(9,16,25,.94) 0%,rgba(9,16,25,.82) 48%,rgba(9,16,25,.3) 100%),url("https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1800&q=85") center/cover}.hero-content{position:relative;width:min(1180px,calc(100% - 36px));margin:auto;color:#fff;padding:70px 0}.hero-pill{display:inline-flex;gap:8px;align-items:center;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);padding:9px 13px;border-radius:999px;font-size:12px;font-weight:700}.hero h1{font-size:clamp(42px,6vw,74px);line-height:1.03;margin:20px 0 18px;letter-spacing:-2.6px;max-width:760px}.hero h1 em{font-style:normal;color:#34d399}.hero p{max-width:650px;line-height:1.9;color:#d1d5db;font-size:17px;margin:0 0 30px}.search-panel{background:#fff;padding:10px;border-radius:18px;display:grid;grid-template-columns:1.7fr .8fr .7fr auto;gap:9px;width:min(900px,100%);box-shadow:0 20px 50px rgba(0,0,0,.25)}.search-input{display:flex;align-items:center;gap:9px;padding:0 13px;color:#6b7280}.search-panel input,.search-panel select{border:0;outline:0;background:#f5f6f7;border-radius:11px;padding:13px 14px;color:#111827;width:100%}.search-input input{background:transparent;padding:13px 0}.primary-btn,.secondary-btn,.whatsapp,.card-action{border:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;font-weight:800;border-radius:11px;transition:.2s}.primary-btn{background:${BRAND};color:#fff;padding:13px 18px}.primary-btn:hover{filter:brightness(.94);transform:translateY(-1px)}.secondary-btn{background:#fff;color:#111827;border:1px solid #d1d5db;padding:11px 14px}.wide{width:100%}.trust-strip{width:min(1180px,calc(100% - 36px));margin:-34px auto 0;position:relative;background:#fff;border-radius:18px;box-shadow:0 15px 45px rgba(17,24,39,.09);display:grid;grid-template-columns:repeat(3,1fr);padding:24px}.trust-strip>div{display:flex;align-items:center;gap:13px;padding:0 22px;border-inline-end:1px solid #e5e7eb;color:${BRAND}}.trust-strip>div:last-child{border-inline-end:0}.trust-strip span{display:flex;flex-direction:column;color:#111827}.trust-strip strong{font-size:14px}.trust-strip small{font-size:12px;color:#6b7280;margin-top:4px}.section{width:min(1180px,calc(100% - 36px));margin:80px auto}.section-title{display:flex;align-items:end;justify-content:space-between;margin-bottom:24px}.eyebrow{color:${BRAND};font-weight:900;font-size:12px;letter-spacing:.6px}.section-title h2,.admin-head h1,.how h2{font-size:clamp(28px,3.3vw,42px);margin:7px 0 0;letter-spacing:-1px}.count{min-width:38px;height:38px;padding:0 12px;border-radius:12px;background:#fff;border:1px solid #e5e7eb;display:grid;place-items:center;font-weight:800}.demo-banner,.notice,.error{padding:13px 15px;border-radius:12px;margin:0 0 18px;font-size:13px}.demo-banner{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412}.notice{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}.error{background:#fef2f2;border:1px solid #fecaca;color:#991b1b}.car-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.car-card{background:#fff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;cursor:pointer;transition:.25s}.car-card:hover{transform:translateY(-4px);box-shadow:0 18px 45px rgba(17,24,39,.1);border-color:#d1d5db}.car-image{aspect-ratio:16/10;position:relative;background:#e5e7eb;overflow:hidden}.car-image img,.modal-image img{width:100%;height:100%;object-fit:cover;display:block}.featured,.demo{position:absolute;top:13px;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:900;display:flex;align-items:center;gap:5px}.featured{inset-inline-start:13px;background:#111827;color:#fff}.demo{inset-inline-end:13px;background:#fff;color:#111827}.car-body{padding:18px}.card-topline{display:flex;align-items:center;justify-content:space-between;color:#6b7280;font-size:12px}.ref{font-weight:900;color:${BRAND};background:#ecfdf5;padding:5px 8px;border-radius:8px}.location{display:flex;align-items:center;gap:4px}.car-body h3{font-size:20px;margin:15px 0 8px}.price,.modal-price{font-weight:900;color:#111827;font-size:25px}.price small,.modal-price small{font-size:12px;color:#6b7280}.spec-row{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0}.info-chip{display:flex;align-items:center;gap:5px;background:#f3f4f6;padding:7px 8px;border-radius:9px;font-size:11px;color:#4b5563}.card-action{width:100%;padding:11px;background:#f9fafb;color:#111827;border:1px solid #e5e7eb}.app[dir="ltr"] .direction-icon{transform:rotate(180deg)}.how{width:min(1180px,calc(100% - 36px));margin:90px auto;background:#111827;color:#fff;padding:55px;border-radius:24px;display:grid;grid-template-columns:1fr 1fr;gap:60px}.how-copy p{color:#9ca3af;line-height:1.9;max-width:520px}.steps{display:grid;gap:12px}.steps>div{display:flex;align-items:center;gap:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);padding:16px;border-radius:14px}.steps b{font-size:12px;color:#34d399}.steps span{display:flex;flex-direction:column}.steps small{color:#9ca3af;margin-top:4px}.empty{padding:40px;text-align:center;background:#fff;border:1px dashed #d1d5db;border-radius:16px;color:#6b7280}footer{background:#0b111b;color:#fff;padding:45px clamp(18px,5vw,72px)}footer>p{color:#9ca3af}.footer-row{margin-top:30px;padding-top:22px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;color:#6b7280;font-size:12px}.admin-link{color:#6b7280;text-decoration:none}.modal-backdrop{position:fixed;inset:0;background:rgba(3,7,18,.7);display:grid;place-items:center;padding:20px;z-index:100;backdrop-filter:blur(6px)}.modal{width:min(900px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;position:relative}.close{position:absolute;top:14px;inset-inline-end:14px;width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.92);display:grid;place-items:center;cursor:pointer;z-index:2}.modal-image{height:380px;position:relative}.modal-body{padding:26px}.modal-body h2{font-size:32px;margin:16px 0 7px}.modal-price{font-size:30px;color:${BRAND}}.details-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px 0}.detail{display:flex;align-items:center;gap:10px;background:#f9fafb;border:1px solid #eef0f2;padding:12px;border-radius:12px;color:${BRAND}}.detail span{display:flex;flex-direction:column}.detail small{color:#6b7280;font-size:10px}.detail strong{color:#111827;font-size:13px;margin-top:3px}.description{line-height:1.9;color:#4b5563}.whatsapp{width:100%;padding:15px;background:#16a34a;color:#fff;margin-top:15px}.admin-shell{width:min(1000px,calc(100% - 36px));margin:45px auto 80px}.login-card{width:min(430px,100%);margin:70px auto;background:#fff;border:1px solid #e5e7eb;border-radius:20px;padding:28px;box-shadow:0 18px 45px rgba(17,24,39,.06)}.login-card h1{margin:15px 0 8px}.login-card p,.admin-head p{color:#6b7280}.admin-icon{width:55px;height:55px;border-radius:16px;background:#ecfdf5;color:${BRAND};display:grid;place-items:center}.stack{display:grid;gap:9px;margin-top:24px}.stack label,.field>span{font-size:12px;font-weight:800;color:#374151}.stack input,.field input,.field select,.field textarea{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:12px 13px;outline:0;background:#fff}.stack input:focus,.field input:focus,.field select:focus,.field textarea:focus{border-color:${BRAND};box-shadow:0 0 0 3px rgba(15,138,95,.09)}.admin-head{display:flex;justify-content:space-between;align-items:start;margin-bottom:25px}.admin-form,.admin-list{background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:24px;margin-bottom:24px}.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.field{display:grid;gap:7px;margin-bottom:16px}.check{display:flex!important;align-items:center;gap:9px;padding-top:10px}.check input{width:auto}.actions-row{display:flex;gap:10px}.admin-cars{display:grid;gap:10px}.admin-car{display:grid;grid-template-columns:95px 1fr auto auto;gap:12px;align-items:center;border:1px solid #e5e7eb;border-radius:12px;padding:8px}.admin-car img{width:95px;height:65px;object-fit:cover;border-radius:9px}.admin-car-main{display:flex;flex-direction:column;gap:5px}.admin-car-main span{font-size:12px;color:#6b7280}.admin-car button{width:38px;height:38px;border:1px solid #e5e7eb;background:#fff;border-radius:9px;display:grid;place-items:center;cursor:pointer}.admin-car button.danger{color:#dc2626}.price-filter{text-align:start}
@media(max-width:900px){.topbar nav{display:none}.hero{min-height:620px}.search-panel{grid-template-columns:1fr 1fr}.search-input{grid-column:1/-1}.trust-strip{grid-template-columns:1fr;margin-top:-28px;padding:8px}.trust-strip>div{border-inline-end:0;border-bottom:1px solid #e5e7eb;padding:16px}.trust-strip>div:last-child{border-bottom:0}.car-grid{grid-template-columns:repeat(2,1fr)}.how{grid-template-columns:1fr;padding:34px;gap:30px}.details-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:580px){.topbar{height:68px;padding:0 14px}.brand-lockup small{display:none}.language-switch{padding:6px 8px}.language-switch select{max-width:92px;font-size:12px}.hero{min-height:650px}.hero-bg,.app[dir="rtl"] .hero-bg{background:linear-gradient(180deg,rgba(9,16,25,.85),rgba(9,16,25,.96)),url("https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1000&q=80") center/cover}.hero h1{font-size:42px;letter-spacing:-1.4px}.hero p{font-size:14px}.search-panel{grid-template-columns:1fr}.search-input{grid-column:auto}.car-grid{grid-template-columns:1fr}.section{margin:58px auto}.modal-backdrop{padding:0}.modal{height:100%;max-height:none;border-radius:0}.modal-image{height:270px}.details-grid{grid-template-columns:1fr 1fr}.how{border-radius:18px;padding:27px}.form-grid{grid-template-columns:1fr}.admin-head{flex-direction:column;gap:15px}.admin-form,.admin-list{padding:16px}.admin-car{grid-template-columns:72px 1fr auto}.admin-car img{width:72px;height:58px}.footer-row{gap:20px}}
`}</style>; }

export default App;
