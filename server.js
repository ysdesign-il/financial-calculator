const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');

const app = express();
const PORT = Number(process.env.PORT || 3000);

const repoOwner = process.env.GITHUB_OWNER || 'ysdesign-il';
const repoName = process.env.GITHUB_REPO || 'financial-calculator';
const repoBranch = process.env.GITHUB_BRANCH || 'main';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const sessionSecret = process.env.SESSION_SECRET || 'dev-session-secret';

const gh = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
  }
});

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 1000 * 60 * 60 * 8
  }
}));

function ensureAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}

function normalizePath(value) {
  if (!value || typeof value !== 'string') return '';
  const cleaned = value.replace(/^\/+/, '').replace(/\.\./g, '');
  return cleaned.split('/').filter(Boolean).join('/');
}

function toBase64(data) {
  return Buffer.from(data, 'utf8').toString('base64');
}

async function githubGetContents(pathName = '') {
  const url = `/repos/${repoOwner}/${repoName}/contents/${pathName ? encodeURIComponent(pathName) : ''}`;
  const response = await gh.get(url.replace(/%2F/g, '/').replace(/%2C/g, ','));
  return response.data;
}

async function listRepoFiles(directory = '') {
  const cleaned = normalizePath(directory);
  const items = await githubGetContents(cleaned || '');
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item.type === 'file' || item.type === 'dir')
    .map((item) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      download_url: item.download_url || null
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

async function getFileContent(filePath) {
  const normalized = normalizePath(filePath);
  if (!normalized) throw new Error('Missing file path');

  const response = await gh.get(`/repos/${repoOwner}/${repoName}/contents/${normalized}`);
  const data = response.data;

  if (data.type === 'file') {
    if (typeof data.content === 'string') {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }

    if (data.download_url) {
      const fileResponse = await axios.get(data.download_url, { responseType: 'text' });
      return fileResponse.data;
    }
  }

  throw new Error('Could not read file');
}

async function saveFileToGithub(filePath, content, commitMessage) {
  const normalized = normalizePath(filePath);
  if (!normalized) throw new Error('Invalid file path');

  const existing = await gh.get(`/repos/${repoOwner}/${repoName}/contents/${normalized}`)
    .catch(() => null);

  const payload = {
    message: commitMessage || `Update ${normalized}`,
    content: toBase64(content),
    branch: repoBranch
  };

  if (existing && existing.data && existing.data.sha) {
    payload.sha = existing.data.sha;
  }

  await gh.put(`/repos/${repoOwner}/${repoName}/contents/${normalized}`, payload);
  return { ok: true };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Admin API is running' });
});

app.post('/api/login', (req, res) => {
  const { password } = req.body || {};

  if (!password || password !== adminPassword) {
    return res.status(401).json({ ok: false, error: 'Invalid password' });
  }

  req.session.authenticated = true;
  req.session.loggedInAt = new Date().toISOString();
  return res.json({ ok: true, message: 'Authenticated' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true, message: 'Logged out' });
  });
});

app.get('/api/session', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated) });
});

app.get('/api/files', ensureAuth, async (req, res) => {
  try {
    const { path: dir = '' } = req.query;
    const files = await listRepoFiles(dir || '');
    res.json({ ok: true, files });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Failed to load file list' });
  }
});

app.get('/api/file', ensureAuth, async (req, res) => {
  try {
    const { path: filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({ ok: false, error: 'Missing file path' });
    }

    const content = await getFileContent(filePath);
    res.json({ ok: true, path: normalizePath(filePath), content });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message || 'Failed to load file' });
  }
});

app.post('/api/save-file', ensureAuth, async (req, res) => {
  try {
    const { path: filePath, content, message } = req.body || {};

    if (!filePath || typeof content !== 'string') {
      return res.status(400).json({ ok: false, error: 'Missing file path or content' });
    }

    await saveFileToGithub(filePath, content, message || `Update ${filePath}`);
    res.json({ ok: true, message: 'File saved successfully' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || 'Could not save file' });
  }
});

app.post('/api/chat', ensureAuth, async (req, res) => {
  try {
    const { prompt, filePath, fileContent } = req.body || {};

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ ok: false, error: 'Prompt is required' });
    }

    if (!openai) {
      return res.json({
        ok: true,
        answer: 'AI is not configured. Add OPENAI_API_KEY to the server environment to enable prompt-based code generation.'
      });
    }

    const system = [
      'You are a senior full-stack code assistant working inside a financial calculator website.',
      'Return only clean, production-ready code when the user asks for code.',
      'If you suggest changes, explain them briefly in Hebrew when possible.',
      'Keep the code concise, correct, and suitable for this static HTML/JS project.'
    ].join(' ');

    const finalPrompt = [
      filePath ? `Current file: ${filePath}` : '',
      fileContent ? `Current file content:\n\n${fileContent.slice(0, 12000)}` : '',
      `User request:\n${prompt}`
    ].filter(Boolean).join('\n\n');

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: finalPrompt }
      ],
      temperature: 0.4
    });

    const answer = completion.choices?.[0]?.message?.content || 'No response returned';
    res.json({ ok: true, answer });
  } catch (error) {
    console.error('Chat request error:', error.response?.data || error.message);
    res.status(500).json({ ok: false, error: error.message || 'AI request failed' });
  }
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'Not found' });
  }

  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log(`Developer admin is running on http://localhost:${PORT}`);
  console.log(`Admin login is protected by ADMIN_PASSWORD`);
});
