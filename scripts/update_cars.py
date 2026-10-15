"""Build cars.json: new-car list prices (Ministry of Transport price list on data.gov.il) for the company-car benefit.

The file is grouped by make -> model -> versions [trim, year, list price, fuel kind] so the app can offer a picker.
Column names are found by pattern, because the government file has changed names before. A probe of the schema is
written to cars_probe.json so the developer can see what the source looked like on the last run.
"""
import json, re, time, urllib.request, urllib.parse

API = "https://data.gov.il/api/3/action/"
KNOWN = ["39f455bf-6db0-4926-859d-017f34eacbcb"]          # new-car list prices (מחירון רכב חדש)
WLTP = "142afde2-6228-49f9-8a29-9b6c3a0cbe40"             # WLTP models: engine technology (petrol, hybrid, plug-in, electric)
UA = {"User-Agent": "Mozilla/5.0 (fincalc price-list updater)", "Accept": "application/json"}


def call(action, **q):
    url = API + action + "?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))["result"]


def find_resource(probe):
    for rid in KNOWN:
        try:
            r = call("datastore_search", resource_id=rid, limit=1)
            probe["tried"].append({"id": rid, "fields": [f["id"] for f in r.get("fields", [])], "total": r.get("total")})
            if any(re.search(r"mehir|price|מחיר", f["id"], re.I) for f in r.get("fields", [])):
                return rid, r
        except Exception as e:
            probe["tried"].append({"id": rid, "err": str(e)[:200]})
    for q in ["מחירון רכב", "מחיר רכב חדש", "car price list"]:
        try:
            res = call("package_search", q=q, rows=10)
            for p in res.get("results", []):
                for rs in p.get("resources", []):
                    if not rs.get("datastore_active"):
                        continue
                    try:
                        r = call("datastore_search", resource_id=rs["id"], limit=1)
                        fields = [f["id"] for f in r.get("fields", [])]
                        probe["tried"].append({"id": rs["id"], "pkg": p.get("title"), "fields": fields, "total": r.get("total")})
                        if any(re.search(r"mehir|price|מחיר", f, re.I) for f in fields) and any(re.search(r"tozeret|יצרן|manufact", f, re.I) for f in fields):
                            return rs["id"], r
                    except Exception as e:
                        probe["tried"].append({"id": rs.get("id"), "err": str(e)[:200]})
        except Exception as e:
            probe["tried"].append({"search": q, "err": str(e)[:200]})
    return None, None


def pick(fields, *pats, avoid=None):
    for p in pats:
        for f in fields:
            if re.search(p, f, re.I) and not (avoid and re.search(avoid, f, re.I)):
                return f
    return None


def fuel_kind(s):
    s = str(s or "").lower()
    if re.search(r"phev|plug|פלאג|נטען", s):
        return "plugin"
    if re.search(r"(^|[^a-z])(bev|ev)([^a-z]|$)|חשמלי טהור|^חשמל$|electric", s) and not re.search(r"היבריד|hybrid|hev", s):
        return "ev"
    if re.search(r"hybrid|היבריד|(^|[^a-z])(hev|mhev)([^a-z]|$)", s):
        return "hybrid"
    return "fuel"


def wltp_kinds(probe):
    """engine technology by (make code, model code, year) from the WLTP list, when it can be read"""
    out = {}
    try:
        r = call("datastore_search", resource_id=WLTP, limit=1)
        fields = [f["id"] for f in r.get("fields", [])]
        probe["wltp_fields"] = fields
        probe["wltp_sample"] = r.get("records", [])[:1]
        tc, dc, yr = pick(fields, r"^tozeret_cd$"), pick(fields, r"^degem_cd$"), pick(fields, r"shnat")
        fl = pick(fields, r"technologi", r"hanaa", r"delek", avoid=r"tzrich|cd$")
        if not (tc and dc and fl):
            return out
        off = 0
        while True:
            r = call("datastore_search", resource_id=WLTP, limit=32000, offset=off, fields=",".join(x for x in [tc, dc, yr, fl] if x))
            recs = r.get("records", [])
            for x in recs:
                out[(str(x.get(tc)), str(x.get(dc)), str(x.get(yr) or ""))] = fuel_kind(x.get(fl))
                out.setdefault((str(x.get(tc)), str(x.get(dc)), ""), fuel_kind(x.get(fl)))
            off += len(recs)
            if not recs or off >= r.get("total", 0):
                break
        probe["wltp_rows"] = off
    except Exception as e:
        probe["wltp_err"] = str(e)[:200]
    return out


def _unused(s):
    s = str(s or "").lower()
    if re.search(r"חשמל(?!.*בנזין)|electric|^ev$", s) and not re.search(r"היבריד|hybrid|plug", s):
        return "ev"
    if re.search(r"פלאג|plug|נטען", s):
        return "plugin"
    if re.search(r"היבריד|hybrid", s):
        return "hybrid"
    return "fuel"


def main():
    probe = {"at": int(time.time()), "tried": []}
    rid, first = find_resource(probe)
    if not rid:
        json.dump(probe, open("cars_probe.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print("no price resource found")
        return
    fields = [f["id"] for f in first["fields"]]
    F = {
        "make": pick(fields, r"^tozeret_nm$", r"tozar|tozeret.*(nm|name)", r"יצרן", r"manufact"),
        "model": pick(fields, r"kinuy_mishari", r"degem_nm", r"שם.?דגם|כינוי", r"model"),
        "trim": pick(fields, r"ramat_gimur", r"גימור", r"trim"),
        "year": pick(fields, r"shnat", r"שנ", r"year"),
        "price": pick(fields, r"mehir", r"מחיר", r"price"),
        "fuel": pick(fields, r"delek|fuel|הנעה|דלק|hanaa|technologi", avoid=r"tzrich"),
        "code": pick(fields, r"degem_cd|model_cd|קוד.?דגם"),
    }
    probe.update({"resource": rid, "fields": fields, "map": F, "sample": first.get("records", [])[:1]})
    rows, off = [], 0
    while True:
        r = call("datastore_search", resource_id=rid, limit=32000, offset=off)
        recs = r.get("records", [])
        rows += recs
        off += len(recs)
        if not recs or off >= r.get("total", 0):
            break
    makes = {}
    this_year = time.gmtime().tm_year
    kinds = wltp_kinds(probe)
    for x in rows:
        try:
            price = float(str(x.get(F["price"]) or "").replace(",", ""))
        except ValueError:
            continue
        if not (20000 <= price <= 5000000):
            continue
        make = str(x.get(F["make"]) or "").strip()
        model = str(x.get(F["model"]) or "").strip()
        if not make or not model:
            continue
        try:
            year = int(float(x.get(F["year"]) or 0)) if F["year"] else 0
        except ValueError:
            year = 0
        if year and year < this_year - 7:            # the benefit uses the price when new; keep the last eight model years
            continue
        trim = str(x.get("degem_nm") or (x.get(F["trim"]) if F["trim"] else "") or "").strip()
        tc, dc = str(x.get("tozeret_cd")), str(x.get("degem_cd"))
        kind = kinds.get((tc, dc, str(year))) or kinds.get((tc, dc, "")) or fuel_kind(model + " " + trim)
        makes.setdefault(make, {}).setdefault(model, []).append([trim, year, int(round(price)), kind])
    out = {"asOf": int(time.time()), "src": "data.gov.il", "rid": rid, "n": 0, "makes": {}}
    for mk in sorted(makes):
        out["makes"][mk] = {}
        for md in sorted(makes[mk]):
            seen, vs = set(), []
            for v in sorted(makes[mk][md], key=lambda v: (-v[1], v[0], v[2])):
                key = (v[0], v[1], v[2])
                if key in seen:
                    continue
                seen.add(key)
                vs.append(v)
            out["makes"][mk][md] = vs[:60]
            out["n"] += len(vs[:60])
    probe["rows"] = len(rows)
    probe["kept"] = out["n"]
    json.dump(probe, open("cars_probe.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if out["n"] >= 50:
        json.dump(out, open("cars.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("cars: %d versions from %d rows" % (out["n"], len(rows)))


if __name__ == "__main__":
    main()
