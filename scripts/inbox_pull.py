"""Collect locked (encrypted) feedback the website sent to the relay into inbox.json. Only the app can unlock it."""
import importlib.util, os
spec = importlib.util.spec_from_file_location("ur", os.path.join(os.path.dirname(__file__), "update_rates.py"))
ur = importlib.util.module_from_spec(spec); spec.loader.exec_module(ur)
log = []
ur.inbox_pull(log)
print("; ".join(log))
