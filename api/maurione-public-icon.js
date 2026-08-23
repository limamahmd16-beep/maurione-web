export default async function handler(req, res) {
  try {
    const source = 'https://raw.githubusercontent.com/limamahmd16-beep/maurione-web/cars-admin-only/api/maurione-touch.png.js';
    const r = await fetch(source, { cache: 'no-store' });
    if (!r.ok) throw new Error(`source ${r.status}`);
    const text = await r.text();
    const match = text.match(/Buffer\.from\(\"([^\"]+)\",\s*\"base64\"\)/s);
    if (!match) throw new Error('icon data not found');
    const png = Buffer.from(match[1], 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).end(png);
  } catch (error) {
    res.status(500).json({ error: 'icon unavailable' });
  }
}
