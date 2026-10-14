"""Refresh rates.json for the financial calculator (runs on GitHub Actions; standard library only).

Sources (all public, no keys):
  - Bank of Israel representative rates and interest rate (www.boi.org.il/PublicApi)
  - European Central Bank reference rates via api.frankfurter.dev
  - Crypto prices via api.coinbase.com
  - Consumer price index via api.cbs.gov.il (kept unchanged if it cannot be read)
  - More official indices via api.cbs.gov.il: residential construction inputs and dwelling prices, with monthly history for linkage
  - Market indices (TA-35, TA-125, S&P 500, Nasdaq 100, Dow Jones, gold, Brent) via public delayed quotes
Every value is sanity-checked against the previous file; anything implausible is skipped.
"""
import json, time, datetime, urllib.request, os, csv, io, math

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
    plan = [("cpi", ["120010"], "01-2005"), ("build", ["200010", "200000", "200100"], "01-2005"), ("house", ["40010", "180010", "40000"], "01-2015")]
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
    for ch in ["c", "aa"]:
        try:
            diag("chapter_" + ch, get_raw("https://api.cbs.gov.il/index/catalog/chapter?id=%s&format=json&download=false&lang=en" % ch)[:2500])
        except Exception as e:
            diag("chapter_%s_err" % ch, str(e))
    return idx


# ---------- market indices (delayed public quotes) ----------
MARKETS = [("ta35", "TA-35", ["TA35.TA", "^TA35.TA"], ["^ta35"]), ("ta125", "TA-125", ["^TA125.TA", "TA125.TA"], ["^ta125"]),
           ("spx", "S&P 500", ["^GSPC"], ["^spx"]), ("ndx", "Nasdaq 100", ["^NDX"], ["^ndx"]), ("dji", "Dow Jones", ["^DJI"], ["^dji"]),
           ("gold", "Gold", ["GC=F"], ["xauusd"]), ("brent", "Brent", ["BZ=F"], ["cb.f"])]


def yahoo(sym, rng, interval):
    for host in ("query1", "query2"):
        try:
            u = "https://%s.finance.yahoo.com/v8/finance/chart/%s?range=%s&interval=%s&includePrePost=false" % (host, urllib.request.quote(sym), rng, interval)
            j = json.loads(get_raw(u, BROWSER, 20))
            r = j["chart"]["result"][0]
            return r
        except Exception as e:
            last = e
    raise last


def closes(r):
    ts = r.get("timestamp") or []
    cl = ((r.get("indicators") or {}).get("quote") or [{}])[0].get("close") or []
    return [(t, c) for t, c in zip(ts, cl) if c is not None]


def cagr(series, years):
    if not series:
        return None
    t_end, c_end = series[-1]
    target = t_end - years * 365.25 * 86400
    past = [x for x in series if x[0] <= target + 20 * 86400]
    if not past:
        return None
    t0, c0 = past[-1]
    yrs = (t_end - t0) / (365.25 * 86400)
    if c0 <= 0 or yrs < years * 0.9:
        return None
    return round(((c_end / c0) ** (1 / yrs) - 1) * 100, 2)


def market_one(syms):
    err = None
    for sym in syms:
        try:
            d = yahoo(sym, "5d", "1d")
            meta = d.get("meta") or {}
            cs = closes(d)
            p = num(meta.get("regularMarketPrice")) or (cs[-1][1] if cs else None)
            if not p:
                continue
            day = [c for c in cs if c[0] < (meta.get("regularMarketTime") or 0) - 3600]
            pc = num(meta.get("previousClose")) or (day[-1][1] if day else (cs[-2][1] if len(cs) > 1 else None))
            item = {"sym": sym, "p": round(p, 4), "pc": round(pc, 4) if pc else None, "t": int(meta.get("regularMarketTime") or 0), "cur": meta.get("currency") or ""}
            try:
                m = closes(yahoo(sym, "10y", "1mo"))
                if m:
                    m = m[:-1] + [(item["t"] or m[-1][0], p)]
                    item["y1"], item["r5"], item["r10"] = cagr(m, 1), cagr(m, 5), cagr(m, 10)
                    y0 = [c for c in m if datetime.datetime.utcfromtimestamp(c[0]).year < datetime.datetime.utcfromtimestamp(m[-1][0]).year]
                    if y0:
                        item["ytd"] = round((p / y0[-1][1] - 1) * 100, 2)
            except Exception as e:
                diag("mkt_hist_" + sym, str(e))
            return item
        except Exception as e:
            err = e
            diag("mkt_" + sym, str(e))
    if err:
        raise err
    return None


def markets(prev, log):
    mk = dict((prev.get("mkt") or {}).get("items", {}))
    n = 0
    for key, name, ysyms, ssyms in MARKETS:
        try:
            it = market_one(ysyms)
            if it and plausible(it["p"], (mk.get(key) or {}).get("p"), 0.6, 1.6):
                it["n"] = name
                old = mk.get(key) or {}
                for k in ("y1", "r5", "r10", "ytd"):          # keep long-run figures if this run could not read the history
                    if it.get(k) is None and old.get(k) is not None:
                        it[k] = old[k]
                mk[key] = it
                n += 1
        except Exception as e:
            log.append("%s failed" % key)
    log.append("markets %d" % n)
    ts = [v.get("t") or 0 for v in mk.values()]
    return {"asOf": max(ts) if ts else 0, "items": mk} if mk else prev.get("mkt")


def probe_sources():
    tests = {
        "stooq_q": "https://stooq.com/q/l/?s=%5Espx+%5Endx+%5Edji+%5Eta35+%5Eta125+xauusd+cb.f&f=sd2t2ohlcp&h&e=csv",
        "stooq_h": "https://stooq.com/q/d/l/?s=%5Espx&i=m",
        "cnbc": "https://quote.cnbc.com/quote-html-webservice/restQuote/symbolType/symbol?symbols=.SPX%7C.NDX%7C.DJI%7C.TA35%7C.TA125%7C%40GC.1%7C%40LCO.1&requestMethod=itv&noform=1&partnerId=2&fund=1&exthrs=1&output=json&events=1",
        "fred_spx": "https://fred.stlouisfed.org/graph/fredgraph.csv?id=SP500",
        "fred_ndx": "https://fred.stlouisfed.org/graph/fredgraph.csv?id=NASDAQ100",
        "yahoo_spark": "https://query1.finance.yahoo.com/v7/finance/spark?symbols=%5EGSPC,TA35.TA&range=5d&interval=1d",
        "tase_ta35": "https://api.tase.co.il/api/index/details?lang=1&oId=142",
        "globes": "https://www.globes.co.il/data/webservices/financial.asmx/getInstrument?exchange=tase&symbol=142",
    }
    for k, u in tests.items():
        try:
            diag("probe_" + k, get_raw(u, BROWSER, 20)[:1500])
        except Exception as e:
            diag("probe_%s_err" % k, str(e))


def main():
    prev = json.load(open(PATH, encoding="utf-8"))
    out = json.loads(json.dumps(prev))
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
    if os.environ.get("RATES_DIAG", "1") == "1":
        try:
            probe_sources()
        except Exception as e:
            diag("probe_err", str(e))
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
