'use strict';

const express = require('express');
const router = express.Router();

/**
 * GET /api/placeholder/:w/:h?text=...
 * Generate SVG placeholder image secara dinamis — tidak butuh file eksternal
 */
router.get('/:w/:h', (req, res) => {
  const w    = Math.min(parseInt(req.params.w) || 300, 800);
  const h    = Math.min(parseInt(req.params.h) || 200, 600);
  const text = String(req.query.text || 'No Image').substring(0, 30);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="#e9ecef"/>
  <rect width="100%" height="100%" fill="none" stroke="#dee2e6" stroke-width="2"/>
  <text x="50%" y="45%" font-family="Arial,sans-serif" font-size="18" fill="#adb5bd" text-anchor="middle" dy=".3em">🍽</text>
  <text x="50%" y="62%" font-family="Arial,sans-serif" font-size="13" fill="#adb5bd" text-anchor="middle">${text}</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(svg);
});

module.exports = router;
