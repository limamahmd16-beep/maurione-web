import c1 from './logo-chunks/chunk1.js';
import c2 from './logo-chunks/chunk2.js';
import c3 from './logo-chunks/chunk3.js';
import c4 from './logo-chunks/chunk4.js';
import c5 from './logo-chunks/chunk5.js';
import c6 from './logo-chunks/chunk6.js';
import c7 from './logo-chunks/chunk7.js';

export default function handler(req, res) {
  const png = Buffer.from(c1 + c2 + c3 + c4 + c5 + c6 + c7, 'base64');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).end(png);
}
