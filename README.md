const state = {
  authenticated: false,
  files: [],
  selectedPath: '',
  latestContent: '',
  aiDraft: ''
};

const els = {
  loginBox: document.getElementById('loginBox'),
  loggedInBox: document.getElementById('loggedInBox'),
  filesBox: document.getElementById('filesBox'),
  editorPanel: document.getElementById('editorPanel'),
  passwordInput: document.getElementById('passwordInput'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  fileTree: document.getElementById('fileTree'),
  editorTextarea: document.getElementById('editorTextarea'),
  selectedFileName: document.getElementById('selectedFileName'),
  saveFileBtn: document.getElementById('saveFileBtn'),
  loadFileBtn: document.getElementById('loadFileBtn'),
  previewSiteBtn: document.getElementById('previewSiteBtn'),
  aiPrompt: document.getElementById('aiPrompt'),
  aiGenerateBtn: document.getElementById('aiGenerateBtn'),
  aiApplyBtn: document.getElementById('aiApplyBtn'),
  aiOutput: document.getElementById('aiOutput'),
  refreshFilesBtn: document.getElementById('refreshFilesBtn')
};

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload;
}

function setAuthUi(authenticated) {
  state.authenticated = authenticated;
  els.loginBox.classList.toggle('hidden', authenticated);
  els.loggedInBox.classList.toggle('hidden', !authenticated);
  els.filesBox.classList.toggle('hidden', !authenticated);
  els.editorPanel.classList.toggle('hidden', !authenticated);

  if (authenticated) {
    loadFiles();
  }
}

async function checkSession() {
  try {
    const result = await fetchJson('/api/session');
    setAuthUi(Boolean(result.authenticated));
  } catch {
    setAuthUi(false);
  }
}

async function login() {
  const password = els.passwordInput.value.trim();
  if (!password) {
    alert('יש להזין סיסמה');
    return;
  }

  try {
    await fetchJson('/api/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    els.passwordInput.value = '';
    setAuthUi(true);
  } catch (error) {
    alert(error.message || 'התחברות נכשלה');
  }
}

async function logout() {
  try {
    await fetchJson('/api/logout', { method: 'POST' });
    state.selectedPath = '';
    state.latestContent = '';
    els.editorTextarea.value = '';
    els.selectedFileName.textContent = 'לא נבחר';
    els.aiOutput.textContent = '';
    setAuthUi(false);
  } catch (error) {
    alert(error.message || 'התנתקות נכשלה');
  }
}

async function loadFiles() {
  try {
    const result = await fetchJson('/api/files');
    state.files = result.files || [];
    renderFiles();

    if (!state.selectedPath && state.files.length) {
      const firstFile = state.files.find((item) => item.type === 'file');
      if (firstFile) selectFile(firstFile.path);
    }
  } catch (error) {
    console.error(error);
  }
}

function renderFiles() {
  els.fileTree.innerHTML = '';

  state.files.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `file-item ${state.selectedPath === item.path ? 'active' : ''}`;
    button.innerHTML = `
      <span>${item.name}</span>
      <span class="file-type">${item.type === 'dir' ? 'DIR' : 'FILE'}</span>
    `;

    button.addEventListener('click', () => {
      if (item.type === 'file') {
        selectFile(item.path);
      }
    });

    els.fileTree.appendChild(button);
  });
}

async function selectFile(path) {
  state.selectedPath = path;
  renderFiles();
  els.selectedFileName.textContent = path;

  try {
    const result = await fetchJson(`/api/file?path=${encodeURIComponent(path)}`);
    state.latestContent = result.content || '';
    els.editorTextarea.value = state.latestContent;
  } catch (error) {
    alert(error.message || 'לא ניתן לטעון קובץ');
  }
}

async function saveCurrentFile() {
  if (!state.selectedPath) {
    alert('יש לבחור קובץ תחילה');
    return;
  }

  try {
    const content = els.editorTextarea.value;
    const payload = {
      path: state.selectedPath,
      content,
      message: `Update ${state.selectedPath}`
    };

    await fetchJson('/api/save-file', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    state.latestContent = content;
    alert('הקובץ נשמר ב-GitHub');
  } catch (error) {
    alert(error.message || 'שמירה נכשלה');
  }
}

async function askAI() {
  const prompt = els.aiPrompt.value.trim();
  if (!prompt) {
    alert('יש להזין בקשה לעוזר קוד');
    return;
  }

  try {
    els.aiOutput.textContent = 'שולח בקשה...';
    const result = await fetchJson('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        filePath: state.selectedPath,
        fileContent: state.latestContent || els.editorTextarea.value
      })
    });

    els.aiOutput.textContent = result.answer || 'אין תשובה';
    state.aiDraft = result.answer || '';
  } catch (error) {
    els.aiOutput.textContent = error.message || 'בקשת AI נכשלה';
  }
}

function applyAIDraft() {
  if (!state.aiDraft) {
    alert('אין תוכן AI להחלה לעורך');
    return;
  }

  els.editorTextarea.value = state.aiDraft;
  state.latestContent = state.aiDraft;
  els.aiOutput.textContent = 'התוכן הוחל בעורך';
}

function previewSite() {
  if (window.location.hostname === 'localhost') {
    window.open('http://localhost:3000', '_blank');
    return;
  }

  window.open('https://ysdesign-il.github.io/financial-calculator/', '_blank');
}

els.loginBtn.addEventListener('click', login);
els.passwordInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') login();
});

els.logoutBtn.addEventListener('click', logout);
els.saveFileBtn.addEventListener('click', saveCurrentFile);
els.loadFileBtn.addEventListener('click', () => {
  if (state.selectedPath) selectFile(state.selectedPath);
});
els.previewSiteBtn.addEventListener('click', previewSite);
els.refreshFilesBtn.addEventListener('click', loadFiles);
els.aiGenerateBtn.addEventListener('click', askAI);
els.aiApplyBtn.addEventListener('click', applyAIDraft);

checkSession();
