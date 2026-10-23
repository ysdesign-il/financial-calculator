// Settings of the panel's public part (parts that can be switched off, colour, privacy switch). Read by worker.js and by src/build.py,
// which writes the static /__pub.js – keep the object below plain JSON.
export const PUBCFG = {"parts": [["assist", "לשונית העוזר", ".nav [data-tab=\"assist\"]"], ["clients", "לשונית הלקוחות", ".nav [data-tab=\"clients\"]"], ["expenses", "לשונית ההוצאות", ".nav [data-tab=\"expenses\"]"]], "accent": "#8CC8FF", "priv": "fin-priv"};
