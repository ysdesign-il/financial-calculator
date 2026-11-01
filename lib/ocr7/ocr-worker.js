/* On-device text recognition worker for the financial calculator.
   Runs the Tesseract OCR engine (tesseract.js-core 7.0.0, Apache-2.0) with the tessdata_fast language data (Apache-2.0).
   Modelled on the tesseract.js worker script (Apache-2.0, https://github.com/naptha/tesseract.js) – see LICENSE.txt and NOTICE.txt.
   Nothing leaves the phone: the page sends the engine, the language data and the picture; this worker only answers with text.
   Messages in:  {id, cmd: 'init', core: <url of the engine script>, wasm: ArrayBuffer, langs: 'heb+eng', data: {heb: ArrayBuffer, ...}}
                 {id, cmd: 'rec', img: ArrayBuffer (PNG/JPEG), psm?: number}
   Messages out: {id, ok: true, ...} / {id, ok: false, err} / {id, progress: 0..1} */
'use strict';
let TM = null, api = null, langsNow = '', job = 0;
const post = (o, tr) => self.postMessage(o, tr || []);

function parseTsv(tsv){
  const lines = [], words = [], byLine = new Map();
  String(tsv || '').split('\n').forEach(row => {
    const c = row.split('\t'); if (c.length < 12) return;
    const lv = +c[0], key = c[2] + '.' + c[3] + '.' + c[4], x = +c[6], y = +c[7], w = +c[8], h = +c[9], conf = +c[10], txt = c.slice(11).join('\t');
    const bbox = {x0: x, y0: y, x1: x + w, y1: y + h};
    if (lv === 4){ const L = {text: '', bbox, words: []}; lines.push(L); byLine.set(key, L); }
    else if (lv === 5 && txt.trim()){ const W = {text: txt, bbox, conf}; words.push(W); const L = byLine.get(key); if (L) L.words.push(W); }
  });
  lines.forEach(L => { L.text = L.words.map(w => w.text).join(' '); L.conf = L.words.length ? L.words.reduce((s, w) => s + w.conf, 0) / L.words.length : 0; delete L.words; });
  return {lines: lines.filter(L => L.text.trim()), words};
}

self.onmessage = async e => {
  const m = e.data || {}, id = m.id;
  try {
    if (m.cmd === 'init'){
      if (!TM){
        importScripts(m.core);
        if (typeof self.TesseractCore !== 'function') throw new Error('core');
        TM = await self.TesseractCore({
          wasmBinary: m.wasm,
          TesseractProgress(p){ post({id: job, progress: Math.max(0, Math.min(1, (p - 30) / 70))}); },
          print(){}, printErr(){}
        });
      }
      if (langsNow !== m.langs){
        for (const k of Object.keys(m.data || {})) TM.FS.writeFile('/' + k + '.traineddata', new Uint8Array(m.data[k]));
        if (api){ try { api.End(); } catch (er) {} }
        TM.FS.writeFile('/config', 'debug_file /dev/null\n');
        api = new TM.TessBaseAPI();
        if (api.Init(null, m.langs, 1, '/config') === -1){ api = null; langsNow = ''; throw new Error('init'); }
        api.SetVariable('user_defined_dpi', '300');
        langsNow = m.langs;
        /* the language files are now inside the engine; free the copies */
        for (const k of Object.keys(m.data || {})) { try { TM.FS.unlink('/' + k + '.traineddata'); } catch (er) {} }
      }
      post({id, ok: true});
      return;
    }
    if (m.cmd === 'rec'){
      if (!api) throw new Error('noinit');
      job = id;
      TM.FS.writeFile('/input', new Uint8Array(m.img));
      api.SetVariable('tessedit_pageseg_mode', String(m.psm || 3));
      if (api.SetImageFile(1, 0) === 1) throw new Error('image');
      api.Recognize(null);
      const text = api.GetUTF8Text(), conf = api.MeanTextConf(), tsv = api.GetTSVText(0);
      try { TM.FS.unlink('/input'); } catch (er) {}
      try { api.Clear(); } catch (er) {}
      const R = parseTsv(tsv);
      post({id, ok: true, text, conf, lines: R.lines, words: R.words});
      return;
    }
    throw new Error('cmd');
  } catch (er){
    post({id, ok: false, err: String((er && er.message) || er)});
  }
};
