:root {
  --bg: #07111f;
  --panel: #101d2f;
  --panel-strong: #16253b;
  --line: rgba(255,255,255,0.08);
  --text: #edf3ff;
  --muted: #96a7c7;
  --accent: #f2c45a;
  --accent-strong: #d9a948;
  --success: #3ad68a;
  --danger: #ff6d6d;
  --shadow: rgba(0,0,0,0.28);
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  height: 100%;
  background: radial-gradient(circle at top, rgba(242,196,90,0.12), transparent 28%), var(--bg);
  color: var(--text);
  font-family: "Segoe UI", Tahoma, sans-serif;
}

body {
  min-height: 100vh;
}

button, input, textarea {
  font: inherit;
}

button {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--text);
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
}

button.primary {
  background: linear-gradient(180deg, #f9d684, var(--accent));
  color: #1c1b17;
  border-color: transparent;
  font-weight: 700;
}

button.secondary {
  background: rgba(255,255,255,0.03);
}

button.ghost {
  background: rgba(255,255,255,0.02);
}

button.small {
  padding: 6px 10px;
  font-size: 0.8rem;
}

input, textarea {
  width: 100%;
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--text);
  padding: 12px 14px;
}

textarea {
  resize: vertical;
  min-height: 220px;
}

.app-shell {
  display: grid;
  grid-template-columns: 340px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, rgba(19,29,46,0.96), rgba(10,17,28,0.94));
  border-inline-end: 1px solid var(--line);
  padding: 18px 16px;
}

.brand-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.brand-wrap strong {
  display: block;
}

.brand-wrap small {
  color: var(--muted);
}

.brand-mark {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: linear-gradient(180deg, #f9d684, var(--accent));
  color: #1b170d;
  font-weight: 800;
}

.auth-box, .files-box, .editor-panel {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 10px 24px var(--shadow);
}

.auth-box {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth-box h2, .files-header h3, .ai-box h3 {
  margin: 0 0 6px;
}

.hidden {
  display: none !important;
}

.files-box {
  margin-top: 18px;
  padding: 14px;
}

.files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.file-tree {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 60vh;
  overflow: auto;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  text-align: start;
  padding: 9px 10px;
  border-radius: 10px;
  background: rgba(255,255,255,0.01);
  border: 1px solid transparent;
}

.file-item:hover {
  border-color: var(--line);
}

.file-item.active {
  border-color: rgba(242,196,90,0.85);
  background: rgba(242,196,90,0.08);
}

.file-type {
  color: var(--muted);
  font-size: 0.72rem;
  min-width: 42px;
}

.editor-panel {
  margin: 20px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.editor-header small {
  color: var(--muted);
}

.editor-header h1 {
  font-size: 1.5rem;
  margin: 4px 0 0;
}

.editor-toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

#editorTextarea {
  min-height: 480px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9rem;
  line-height: 1.55;
}

.ai-box {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.02);
}

.ai-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.ai-output {
  margin-top: 14px;
  white-space: pre-wrap;
  background: rgba(0,0,0,0.18);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px;
  color: var(--text);
  min-height: 120px;
}

.status {
  color: var(--success);
  font-weight: 700;
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    border-inline-end: none;
    border-bottom: 1px solid var(--line);
  }

  .editor-panel {
    margin: 12px;
  }
}
