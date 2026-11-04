/* design images, cropped from the owner-supplied ORBIT and AURUM mockups.
   13.62: they are plain image files (img/dz/), loaded only when a design is shown – no longer inside the app's script, so the app opens faster.
   On the site they come from the same folder as the app's script (so also inside /admin/); in a single-file copy (no app.js file) from the site's address. */
const DZ_BASE = (s => s ? s.src.replace(/app\.js[^/]*$/, '') : SITE_BASE)(document.querySelector('script[src*="app.js"]'));
const DZ_IMG = {
  orbitHero: DZ_BASE + 'img/dz/orbitHero.jpg',
  orbitHead: DZ_BASE + 'img/dz/orbitHead.jpg',
  aurumHero: DZ_BASE + 'img/dz/aurumHero.jpg',
  aurumHead: DZ_BASE + 'img/dz/aurumHead.jpg'
};
