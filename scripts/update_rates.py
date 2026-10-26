"""Refresh rates.json for the financial calculator (runs on GitHub Actions; standard library only).

Sources (all public, no keys):
  - Bank of Israel representative rates and interest rate (www.boi.org.il/PublicApi)
  - European Central Bank reference rates via api.frankfurter.dev
  - Crypto prices via api.coinbase.com
  - Consumer price index via api.cbs.gov.il (kept unchanged if it cannot be read)
  - More official indices via api.cbs.gov.il: residential construction inputs and dwelling prices, with monthly history for linkage
  - Metals (gold, silver, platinum, palladium, copper) via api.gold-api.com (commercial use permitted), with 1/5/10-year anchors from the app's own daily history
  - Live market exchange rates via the European Central Bank (api.frankfurter.dev; free reuse with the ECB cited as the source)
  Stock indices, energy and farm commodities have no free source licensed for this use, so they are no longer updated (13.52).
Every value is sanity-checked against the previous file; anything implausible is skipped.
"""
import json, time, datetime, urllib.request, os, csv, io, math, base64, hashlib, hmac

PATH = "rates.json"
UA = {"User-Agent": "financial-calculator-rates/1.0 (+https://github.com)", "Accept": "application/json"}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def iso_unix(s):
    s = s.replace("Z", "+00:00")
    if "." in s:
        head, tail = s.split(".", 1)
        frac = "".join(ch for ch in tail if ch.isdigit())[:6]
        tz = tail[len("".join(ch for ch in tail if ch.isdigit())):]
        s = head + "." + frac + tz
    return int(datetime.datetime.fromisoformat(s).timestamp())


def il_date(s):
    t = iso_unix(s) + 3 * 3600  # Israel is UTC+2/+3; decisions are published mid-day, so +3h never crosses a date wrongly
    return datetime.datetime.utcfromtimestamp(t).strftime("%Y-%m-%d")


def plausible(new, old, lo, hi):
    return old is None or (old > 0 and lo <= new / old <= hi)


BROWSER = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
           "Accept": "application/json,text/csv,*/*"}


def get_raw(url, headers=None, timeout=30):
    req = urllib.request.Request(url, headers=headers or UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


DIAG = {}


def diag(k, v):
    DIAG[k] = v if not isinstance(v, str) else v[:2500]


# ---------- official indices (Central Bureau of Statistics) ----------
def cbs_records(code, start="01-2005"):
    url = "https://api.cbs.gov.il/index/data/price?id=%s&format=json&download=false&startPeriod=%s&pagesize=1000&lang=en" % (code, start)
    raw = get_raw(url)
    data = json.loads(raw)
    recs, name = [], ""

    def walk(o):
        nonlocal name
        if isinstance(o, dict):
            if not name and isinstance(o.get("name"), str) and ("code" in o or "date" in o):
                name = o["name"]
            if "year" in o and "month" in o and ("currBase" in o or "percent" in o):
                recs.append(o)
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for v in o:
                walk(v)
    walk(data)
    return recs, name, raw


def num(x):
    try:
        return float(x)
    except Exception:
        return None


def cbs_series(code, start="01-2005"):
    recs, name, raw = cbs_records(code, start)
    rows = {}
    for r in recs:
        y, m = int(r["year"]), int(r["month"])
        cb = r.get("currBase") or {}
        pb = r.get("prevBase") or {}
        rows["%04d-%02d" % (y, m)] = {"v": num(cb.get("value")), "b": cb.get("baseDesc") or "", "pv": num(pb.get("value")), "pb": pb.get("baseDesc") or "",
                                      "pct": num(r.get("percent")), "yoy": num(r.get("percentYear"))}
    keys = sorted(rows)
    if not keys:
        return None, name, raw
    # chain every month onto the latest base: same base -> ratio of levels; base change -> the published monthly change
    lv = {keys[-1]: rows[keys[-1]]["v"]}
    for i in range(len(keys) - 1, 0, -1):
        a, b = rows[keys[i - 1]], rows[keys[i]]
        cur = lv[keys[i]]
        if cur is None:
            break
        if a["v"] and b["v"] and a["b"] == b["b"]:
            lv[keys[i - 1]] = cur * a["v"] / b["v"]
        elif a["v"] and b["pv"] and b["pb"] == a["b"]:
            lv[keys[i - 1]] = cur * a["v"] / b["pv"]
        elif b["pct"] is not None:
            lv[keys[i - 1]] = cur / (1 + b["pct"] / 100)
        else:
            break
    last = rows[keys[-1]]
    y = keys[-1][:4]
    jan_prev = "%d-12" % (int(y) - 1)
    ytd = (lv[keys[-1]] / lv[jan_prev] - 1) * 100 if jan_prev in lv and lv[jan_prev] else None
    hist = [[k, round(lv[k], 4)] for k in keys if k in lv and lv[k]]
    out = {"code": code, "name": name, "m": keys[-1], "v": last["v"], "base": last["b"], "mom": last["pct"], "yoy": last["yoy"],
           "ytd": round(ytd, 2) if ytd is not None else None, "hist": hist}
    return out, name, raw


def official_indices(prev, log):
    idx = dict(prev.get("idx", {}))
    plan = [("cpi", ["120010"], "01-2005"), ("build", ["200010"], "01-2005"), ("house", ["40010"], "01-2015")]
    for key, codes, start in plan:
        done = False
        for code in codes:
            try:
                ser, name, raw = cbs_series(code, start)
                diag("cbs_%s_%s" % (key, code), {"name": name, "sample": raw[:900], "n": len(ser["hist"]) if ser else 0})
                if not ser or not ser["v"]:
                    continue
                old = idx.get(key) or {}
                if old.get("v") and old.get("m") == ser["m"] and not plausible(ser["v"], old["v"], 0.9, 1.1):
                    continue
                idx[key] = ser
                log.append("%s %s %s" % (key, code, ser["m"]))
                done = True
                break
            except Exception as e:
                diag("cbs_%s_%s_err" % (key, code), str(e))
        if not done:
            log.append("%s kept" % key)
    return idx


# ---------- metals: gold-api.com (commercial use permitted by its terms) ----------
# Stock indices, energy and farm commodities used to come from a market quote feed that is not licensed for this use (13.52).
METALS = [("gold", "XAU", "Gold"), ("silver", "XAG", "Silver"), ("platinum", "XPT", "Platinum"), ("palladium", "XPD", "Palladium"), ("copper", "HG", "Copper")]
GOLD_API = "https://api.gold-api.com/price/%s"


def fnum(x):
    try:
        return float(str(x).replace(",", "").replace("%", "").replace("+", "").strip())
    except Exception:
        return None


def iso_ts(s):
    try:
        s = str(s)
        if len(s) > 5 and (s[-5] in "+-") and s[-3] != ":":
            s = s[:-2] + ":" + s[-2:]
        return int(datetime.datetime.fromisoformat(s).timestamp())
    except Exception:
        return 0


INBOX_TOPIC = "fc-in-318ca4899cb6f959f4e4de51"   # the relay topic the website sends locked (encrypted) feedback to
INBOX_PATH = "inbox.json"


# the inbox public key (also in the app): the developer signs family sign-in changes with its private half, so no GitHub token is needed
INBOX_PUB_N = "wxtR5meXd5lblZDdURSscmj48iXULVTtEJtrqAj6Lsm6GnSd18JVzEuhQfgRZJZ-3BXPJNaUWFEwRh2YAYsNpeceOWkrKeq3R4vigswqUDVSphAe-v_UUQoCpRXT3vypPYbBps_6ndsVcn96UjdW1Azz12ZrIn0JJprYVhZEh7UDpVoXM0WUHOxItdNHWfeOJ_D9dZXrYPlup9GANJsPMygFPbIv2bdIwHjoPxhir3ZmmGilH5yqTvOJw1Rc504ofLc9JY3oM1cR0pedexJbU8vZwrU2i5atTNvFRNvlh31HH7HrR5FZ1NZxHnRlyMit-lqGIlxA2THDeLLkqr_INQ"
FAMILY_PATH = "family.json"


def _b64u(s):
    s = s.replace("-", "+").replace("_", "/")
    return base64.b64decode(s + "=" * (-len(s) % 4))


def rsa_verify(n_b64u, msg, sig, e=65537):
    """RSASSA-PKCS1-v1_5 with SHA-256, using only the standard library"""
    n = int.from_bytes(_b64u(n_b64u), "big"); k = (n.bit_length() + 7) // 8
    if len(sig) != k:
        return False
    m = pow(int.from_bytes(sig, "big"), e, n).to_bytes(k, "big")
    di = bytes.fromhex("3031300d060960864801650304020105000420") + hashlib.sha256(msg).digest()
    want = b"\x00\x01" + b"\xff" * (k - 3 - len(di)) + b"\x00" + di
    return hmac.compare_digest(m, want)


def family_cmd(msg, log, n_b64u=None, now=None):
    """fcs1.<payload>.<signature>: a signed family sign-in change from developer mode. Returns True if family.json changed."""
    try:
        _, pb, sb = msg.split(".")
        raw = base64.b64decode(pb); sig = base64.b64decode(sb)
        if not rsa_verify(n_b64u or INBOX_PUB_N, raw, sig):
            log.append("family: bad signature"); return False
        c = json.loads(raw.decode("utf-8"))
        h, at = str(c.get("h") or ""), int(c.get("at") or 0)
        now = now or time.time() * 1000
        if abs(now - at) > 3 * 86400 * 1000:
            log.append("family: too old"); return False
        try:
            fam = json.load(open(FAMILY_PATH, encoding="utf-8"))
        except Exception:
            fam = {"v": 1, "m": []}
        if c.get("k") == "famrevoke":                   # drop personal codes made before the command (a replay never touches newer ones)
            keep = [x for x in fam.get("m", []) if x.get("p") or int(x.get("at") or 0) > at]
            if len(keep) == len(fam.get("m", [])):
                return False
            fam["m"] = keep
            with open(FAMILY_PATH, "w", encoding="utf-8") as f:
                f.write(json.dumps(fam, indent=1) + "\n")
            log.append("family codes revoked"); return True
        if c.get("k") != "famset" or len(h) != 64 or any(ch not in "0123456789abcdef" for ch in h):
            return False
        cur = next((x for x in fam.get("m", []) if x.get("p")), None)
        if cur and int(cur.get("at") or 0) >= at:   # replays and older changes never win
            return False
        fam["m"] = [x for x in fam.get("m", []) if not x.get("p")] + [{"id": "p", "p": 1, "h": h, "at": at}]
        with open(FAMILY_PATH, "w", encoding="utf-8") as f:
            f.write(json.dumps(fam, indent=1) + "\n")
        log.append("family sign-in updated"); return True
    except Exception as ex:
        log.append("family: %s" % type(ex).__name__); return False


def inbox_pull(log):
    """collect locked feedback from the relay (it keeps messages ~12 hours; we run twice an hour). Only the app can unlock them."""
    try:
        box = json.load(open(INBOX_PATH, encoding="utf-8"))
    except Exception:
        box = {"v": 1, "m": []}
    try:
        reps = json.load(open("replies.json", encoding="utf-8"))
    except Exception:
        reps = {"v": 1, "r": []}
    have = {m.get("id") for m in box.get("m", [])} | {x.get("e") for x in reps.get("r", [])}
    nr = 0
    raw = get_raw("https://ntfy.sh/%s/json?poll=1&since=all" % INBOX_TOPIC, {"User-Agent": "financial-calculator-inbox/1.0"}, 25)
    n = 0
    for line in raw.splitlines():
        try:
            e = json.loads(line)
        except Exception:
            continue
        msg = str(e.get("message") or "")
        if e.get("event") != "message" or e.get("id") in have or len(msg) > 6000:
            continue
        if n >= 40 and nr >= 40:                       # a flood of messages: take at most 40 of each kind per run
            break
        if msg.startswith("fr1."):                     # a developer reply, locked for one sender
            if nr >= 40:
                continue
            p = msg.split(".")
            if len(p) == 4:
                reps.setdefault("r", []).append({"id": p[1][:24], "c": p[2] + "." + p[3], "t": int(e.get("time") or 0), "e": e["id"]})
                have.add(e["id"]); nr += 1
            continue
        if msg.startswith("fcs1."):                    # a signed family sign-in change
            family_cmd(msg, log)
            continue
        if not msg.startswith("fc1.") or n >= 40:
            continue
        box["m"].append({"id": e["id"], "t": int(e.get("time") or 0), "c": msg})
        have.add(e["id"]); n += 1
    if n:
        box["m"] = box["m"][-1000:]
        with open(INBOX_PATH, "w", encoding="utf-8") as f:
            json.dump(box, f, separators=(",", ":"))
    if nr:
        reps["r"] = reps["r"][-1000:]
        with open("replies.json", "w", encoding="utf-8") as f:
            json.dump(reps, f, separators=(",", ":"))
    log.append("inbox +%d, replies +%d" % (n, nr))


HIST_PATH = "history.json"
HIST = {"v": 1, "s": {}}
HIST_DIRTY = [False]


def hist_add(key, bars):
    """daily closes for the charts in the app: [day number since 1970, close], the last 5 years"""
    old = {d: c for d, c in HIST["s"].get(key, [])}
    for t, c in bars:
        old[int(t // 86400)] = float("%.6g" % c)
    cut = int(time.time() // 86400) - 5 * 366
    HIST["s"][key] = sorted([[d, c] for d, c in old.items() if d >= cut])
    HIST_DIRTY[0] = True


def hist_anchors(key, t):
    """1, 5 and ~10-year-ago closes and the last close of last year, from the app's own daily history"""
    bars = [(d * 86400, c) for d, c in HIST["s"].get(key) or []]
    if len(bars) < 30:
        return None

    def before(sec):
        c = [b for b in bars if b[0] <= t - sec]
        return list(c[-1]) if c else None
    year = datetime.datetime.utcfromtimestamp(t).year
    ye = [b for b in bars if datetime.datetime.utcfromtimestamp(b[0]).year < year]
    yr = 365.25 * 86400
    return {"y1": before(yr), "y5": before(5 * yr), "y10": before(9.9 * yr), "ye": list(ye[-1]) if ye else None}


def returns(p, t, a):
    out = {}
    for k, yrs in (("y1", 1), ("r5", 5), ("r10", 10)):
        x = (a or {}).get("y1" if k == "y1" else "y5" if k == "r5" else "y10")
        if x and x[1] > 0 and p:
            n = max(0.5, ((t or x[0]) - x[0]) / (365.25 * 86400))
            out[k] = round(((p / x[1]) ** (1 / n) - 1) * 100, 2) if k != "y1" else round((p / x[1] - 1) * 100, 2)
    ye = (a or {}).get("ye")
    if ye and ye[1] > 0 and p:
        out["ytd"] = round((p / ye[1] - 1) * 100, 2)
    return out


def markets(prev, log):
    old_all = dict((prev.get("mkt") or {}).get("items", {}))
    metal_keys = [m[0] for m in METALS]
    mk = {}
    # no licensed source any more: keep only the long-run returns (used as presets in the calculators), never a price
    for k, o in old_all.items():
        if k not in metal_keys:
            mk[k] = dict({x: o[x] for x in ("n", "y1", "r5", "r10", "ytd") if x in o}, off=1)
    n = 0
    for key, sym, name in METALS:
        old = old_all.get(key) or {}
        try:
            j = get(GOLD_API % sym)
            p = float(j.get("price") or 0)
        except Exception as e:
            log.append("%s failed: %s" % (key, str(e)[:60]))
            p = 0
        if not p or not plausible(p, old.get("p"), 0.6, 1.6):
            if old.get("p"):
                mk[key] = old
            continue
        t = iso_ts(j.get("updatedAt")) or int(time.time())
        day = int(t // 86400)
        prevc = next((c for d, c in reversed(HIST["s"].get(key) or []) if d < day), None)
        hist_add(key, [(t, p)])
        a = hist_anchors(key, t) or old.get("a")
        if a and not a.get("y10") and (old.get("a") or {}).get("y10"):
            a["y10"] = old["a"]["y10"]          # the 10-year anchor is older than the 5 years of kept history
        it = {"n": name, "sym": sym, "p": p, "pc": prevc, "chp": round((p / prevc - 1) * 100, 2) if prevc else None, "t": t, "cur": "USD",
              "rt": True, "a": a, "hAt": int(time.time())}
        it.update(returns(p, t, a))
        mk[key] = it
        n += 1
    log.append("metals %d" % n)
    ts = [v.get("t") or 0 for v in mk.values()]
    return {"asOf": max(ts) if ts else 0, "src": "gold-api", "items": mk} if mk else prev.get("mkt")


# ---------- market exchange rates: European Central Bank reference rates (free reuse, ECB cited as the source) ----------
# The Gulf and Jordanian currencies are pegged to the dollar. The official shekel rate stays in "usd".
FX_KEEP = ["ILS", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "TRY", "CNY", "INR"]
FX_PEG = {"JOD": 0.709, "AED": 3.6725, "SAR": 3.75}


def live_fx(prev, log):
    j = get("https://api.frankfurter.dev/v1/latest?base=USD")
    R = j.get("rates") or {}
    base = prev.get("usd") or {}
    usd = {}
    for k in FX_KEEP:
        v = float(R.get(k) or 0)
        if v > 0 and (not base.get(k) or plausible(v, base[k], 0.8, 1.25)):
            usd[k] = round(v, 6)
    usd.update(FX_PEG)
    try:
        ts = int(datetime.datetime.strptime(j.get("date"), "%Y-%m-%d").replace(hour=14, minute=15, tzinfo=datetime.timezone.utc).timestamp())
    except Exception:
        ts = int(time.time())
    log.append("live fx (ecb) %d" % len(usd))
    return {"asOf": ts, "src": "ecb", "usd": usd, "close": dict(usd)} if len(usd) >= 6 else prev.get("live")



FUEL_MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
def fuel_price(prev_val, log):
    """The maximum self-service price of petrol 95 for this month, from the Ministry of Energy's monthly notice (a PDF on gov.il).
    Returns (price, 'YYYY-MM') or None. Any doubt -> None, and the previous value stays."""
    try:
        from pypdf import PdfReader
    except Exception:
        log.append("fuel: pypdf missing"); return None
    import io, re, datetime as dt
    now = dt.datetime.utcnow() + dt.timedelta(hours=3)
    for back in (0, 1):
        y, m = now.year, now.month - back
        if m < 1: y, m = y - 1, 12
        mn = FUEL_MONTHS[m - 1]
        urls = ["https://www.gov.il/BlobFolder/news/fuel-%s-%d/he/fuel-%s-%d.pdf" % (mn, y, mn, y),
                "https://www.gov.il/BlobFolder/news/fuel-%s-%d/he/fuel_%s%d.pdf" % (mn, y, mn, y),
                "https://www.gov.il/BlobFolder/news/fuel-%s%d/he/fuel_%s%d.pdf" % (mn, y, mn, y)]
        for u in urls:
            try:
                with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30) as r: raw = r.read()
                if not raw or not raw[:5] == b"%PDF-": continue
                txt = " ".join((pg.extract_text() or "") for pg in PdfReader(io.BytesIO(raw)).pages)
                txt = re.sub(r"\s+", " ", txt)
                cand = []
                for mm in re.finditer(r"יעלה על\D{0,12}(\d{1,2}\.\d{2})", txt): cand.append(mm.group(1))
                for mm in re.finditer(r"(\d{1,2}\.\d{2})\D{0,12}לע הלעי", txt): cand.append(mm.group(1))
                for c in cand:
                    v = float(c)
                    if 5 <= v <= 13 and (not prev_val or abs(v - prev_val) <= 1.6):
                        log.append("fuel %s %.2f" % (mn, v)); return v, "%04d-%02d" % (y, m)
                log.append("fuel: no price in " + u)
            except Exception as e:
                log.append("fuel %s: %s" % (mn, str(e)[:80]))
    return None

def main():
    prev = json.load(open(PATH, encoding="utf-8"))
    out = json.loads(json.dumps(prev))
    try:
        h = json.load(open(HIST_PATH, encoding="utf-8"))
        if isinstance(h.get("s"), dict):
            HIST["s"] = h["s"]
    except Exception:
        pass
    log = []

    # --- exchange rates: ECB first, then the Bank of Israel shekel rate on top ---
    usd = dict(prev.get("usd", {}))
    as_of = prev.get("asOf", 0)
    try:
        ecb = get("https://api.frankfurter.dev/v1/latest?from=USD")
        for k, v in ecb.get("rates", {}).items():
            v = float(v)
            if v > 0 and plausible(v, usd.get(k), 0.8, 1.25):
                usd[k] = v
        log.append("ecb " + str(ecb.get("date")))
    except Exception as e:  # keep previous values
        log.append("ecb failed: %s" % e)
    try:
        boi = get("https://www.boi.org.il/PublicApi/GetExchangeRates")
        rows = boi if isinstance(boi, list) else boi.get("exchangeRates", [])
        by = {r["key"]: float(r["currentExchangeRate"]) / float(r.get("unit") or 1) for r in rows if r.get("key")}
        ils = by.get("USD")
        if ils and 2.5 < ils < 4.5 and plausible(ils, usd.get("ILS"), 0.8, 1.25):
            usd["ILS"] = ils
            if by.get("JOD"):
                usd["JOD"] = round(ils / by["JOD"], 6)
            usd_row = next(r for r in rows if r.get("key") == "USD")
            as_of = max(as_of, iso_unix(usd_row["lastUpdate"]))
            log.append("boi fx %.4f" % ils)
    except Exception as e:
        log.append("boi fx failed: %s" % e)
    if len(usd) >= 25:
        out["usd"], out["asOf"], out["src"] = usd, as_of, "boi+ecb"

    # --- crypto (units per 1 USD) ---
    try:
        cb = get("https://api.coinbase.com/v2/exchange-rates?currency=USD")["data"]["rates"]
        crypto = dict(prev.get("crypto", {}))
        n = 0
        for k in list(crypto):
            if k in cb:
                v = float(cb[k])
                if v > 0 and plausible(v, crypto[k], 0.5, 2):
                    crypto[k] = v
                    n += 1
        if n:
            out["crypto"], out["cryptoAsOf"] = crypto, int(time.time())
        log.append("crypto %d" % n)
    except Exception as e:
        log.append("crypto failed: %s" % e)

    macro = dict(prev.get("macro", {}))
    # --- Bank of Israel interest rate ---
    try:
        i = get("https://www.boi.org.il/PublicApi/GetInterest")
        r = float(i["currentInterest"])
        if 0 <= r <= 15 and abs(r - float(macro.get("boi", r))) <= 1:
            macro["boi"] = r
            if i.get("lastPublishedDate"):
                macro["boiDate"] = il_date(i["lastPublishedDate"])
            if i.get("nextInterestDate"):
                macro["boiNext"] = il_date(i["nextInterestDate"])
            log.append("boi rate %s" % r)
    except Exception as e:
        log.append("boi rate failed: %s" % e)

    # --- CPI (general index, code 120010): 12-month change and change since January ---
    try:
        c = get("https://api.cbs.gov.il/index/data/price?id=120010&format=json&download=false&last=13&lang=en")
        pts = []

        def walk(o):
            if isinstance(o, dict):
                if "year" in o and "month" in o and ("percentYear" in o or "percent" in o):
                    pts.append(o)
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
        walk(c)
        pts.sort(key=lambda p: (int(p["year"]), int(p["month"])))
        if pts:
            last = pts[-1]
            y, m = int(last["year"]), int(last["month"])
            p12 = float(last["percentYear"])
            ytd = 1.0
            for p in pts:
                if int(p["year"]) == y and p.get("percent") is not None:
                    ytd *= 1 + float(p["percent"]) / 100
            months_this_year = [p for p in pts if int(p["year"]) == y]
            new_month = "%04d-%02d" % (y, m)
            if abs(p12) < 15 and len(months_this_year) == m and new_month >= macro.get("cpiMonth", ""):
                macro["cpi12"], macro["cpiMonth"], macro["cpiYtd"] = round(p12, 2), new_month, round((ytd - 1) * 100, 2)
                log.append("cpi " + new_month)
    except Exception as e:
        log.append("cpi failed: %s" % e)
    try:
        fp = fuel_price(float(macro.get("fuel95") or 0), log)
        if fp and fp[1] >= macro.get("fuelMonth", ""):
            macro["fuel95"], macro["fuelMonth"] = round(fp[0], 2), fp[1]
    except Exception as e:
        log.append("fuel failed: %s" % e)
    out["macro"] = macro

    try:
        out["idx"] = official_indices(prev, log)
    except Exception as e:
        log.append("indices failed: %s" % e)
    try:
        m = markets(prev, log)
        if m:
            out["mkt"] = m
    except Exception as e:
        log.append("markets failed: %s" % e)
    try:
        lv = live_fx(out, log)
        if lv:
            out["live"] = lv
    except Exception as e:
        log.append("live fx failed: %s" % e)
    try:
        inbox_pull(log)
    except Exception as e:
        log.append("inbox failed: %s" % e)
    if HIST_DIRTY[0]:
        HIST["at"] = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(HIST_PATH, "w", encoding="utf-8") as f:
            json.dump(HIST, f, separators=(",", ":"))
    if os.environ.get("RATES_DIAG", "0") == "1":
        DIAG["log"] = log
        with open("diag.json", "w", encoding="utf-8") as f:
            json.dump(DIAG, f, indent=1, ensure_ascii=False)

    if json.dumps({k: v for k, v in out.items() if k != "updated"}, sort_keys=True) != json.dumps({k: v for k, v in prev.items() if k != "updated"}, sort_keys=True):
        out["updated"] = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(PATH, "w", encoding="utf-8") as f:
            json.dump(out, f, indent=1, ensure_ascii=False)
    print("; ".join(log))


if __name__ == "__main__":
    main()
