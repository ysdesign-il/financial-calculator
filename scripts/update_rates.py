"""Refresh rates.json for the financial calculator (runs on GitHub Actions; standard library only).

Sources (all public, no keys):
  - Bank of Israel representative rates and interest rate (www.boi.org.il/PublicApi)
  - European Central Bank reference rates via api.frankfurter.dev
  - Crypto prices via api.coinbase.com
  - Consumer price index via api.cbs.gov.il (kept unchanged if it cannot be read)
Every value is sanity-checked against the previous file; anything implausible is skipped.
"""
import json, time, datetime, urllib.request

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

    if json.dumps({k: v for k, v in out.items() if k != "updated"}, sort_keys=True) != json.dumps({k: v for k, v in prev.items() if k != "updated"}, sort_keys=True):
        out["updated"] = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(PATH, "w", encoding="utf-8") as f:
            json.dump(out, f, indent=1, ensure_ascii=False)
    print("; ".join(log))


if __name__ == "__main__":
    main()
