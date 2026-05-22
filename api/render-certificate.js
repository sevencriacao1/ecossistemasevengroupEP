import { readFile } from 'node:fs/promises';
import { dirname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const WIDTH = 1600;
const HEIGHT = 1100;
const BLACK = '#111111';
const GOLD = '#C8A46B';
const OFF_WHITE = '#F8F6F2';
const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const PUBLIC_DIR = join(ROOT_DIR, 'public');

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createValidationCode(userName, courseName, completedAt) {
  const source = `${userName}-${courseName}-${completedAt}`;
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }
  return `ARQO-${Math.abs(hash).toString(36).toUpperCase().padStart(8, '0').slice(0, 8)}`;
}

function fitText(value, maxChars) {
  const text = String(value || '').trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}...`;
}

function splitCourseText(courseName, workload, completionDate, city) {
  const course = fitText(courseName, 78);
  return [
    'por ter concluido com exito o curso',
    course,
    `com carga horaria total de ${workload}, realizado em ${completionDate},`,
    `na cidade de ${city}.`,
  ];
}

function safeLocalAssetPath(assetUrl) {
  if (!assetUrl || typeof assetUrl !== 'string') return null;

  let pathname = assetUrl;
  try {
    pathname = new URL(assetUrl, 'http://localhost').pathname;
  } catch {
    pathname = assetUrl;
  }

  if (!pathname.startsWith('/')) return null;
  const relativePath = decodeURIComponent(pathname).replace(/^\/+/, '');
  const candidate = normalize(join(PUBLIC_DIR, relativePath));
  const publicRoot = `${normalize(PUBLIC_DIR)}${sep}`;
  return candidate.startsWith(publicRoot) ? candidate : null;
}

async function loadImageBuffer(assetUrl) {
  const localPath = safeLocalAssetPath(assetUrl);
  if (localPath) {
    return readFile(localPath);
  }

  if (/^https?:\/\//i.test(assetUrl || '')) {
    const response = await fetch(assetUrl);
    if (!response.ok) throw new Error(`Failed to load image: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }

  return null;
}

async function imageToPngDataUri(assetUrl, options = {}) {
  try {
    const input = await loadImageBuffer(assetUrl);
    if (!input) return null;

    const image = sharp(input, { density: 220 });
    if (options.width || options.height) {
      image.resize({
        width: options.width,
        height: options.height,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const output = await image.png().toBuffer();
    return `data:image/png;base64,${output.toString('base64')}`;
  } catch (error) {
    console.warn('certificate image fallback:', error instanceof Error ? error.message : error);
    return null;
  }
}

async function buildCertificateSvg(values) {
  const userName = fitText(values.userName || 'Aluno', 40);
  const courseName = values.courseName || 'Curso';
  const workload = values.workload || '0 minutos';
  const city = values.city || 'Dourados - MS';
  const completionDate = values.completionDate || '';
  const validationCode = values.validationCode || createValidationCode(userName, courseName, values.completedAt);
  const courseLines = splitCourseText(courseName, workload, completionDate, city);
  const logoDataUri = await imageToPngDataUri(values.logoUrl, { width: 240, height: 120 });
  const signatureDataUri = await imageToPngDataUri(values.signatureUrl, { width: 320, height: 130 });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <pattern id="gold-grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M0 0 L44 44" stroke="${GOLD}" stroke-opacity="0.035" stroke-width="1"/>
      <path d="M44 0 L0 44" stroke="${BLACK}" stroke-opacity="0.02" stroke-width="1"/>
    </pattern>
    <linearGradient id="gold-line" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${GOLD}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${OFF_WHITE}"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#gold-grid)"/>
  <rect x="56" y="56" width="1488" height="988" fill="none" stroke="${GOLD}" stroke-width="1.5"/>
  <rect x="78" y="78" width="1444" height="944" fill="none" stroke="${GOLD}" stroke-opacity="0.28" stroke-width="1"/>

  <path d="M92 204 V92 H204" fill="none" stroke="${GOLD}" stroke-width="1"/>
  <path d="M1396 92 H1508 V204" fill="none" stroke="${GOLD}" stroke-width="1"/>
  <path d="M92 896 V1008 H204" fill="none" stroke="${GOLD}" stroke-width="1"/>
  <path d="M1396 1008 H1508 V896" fill="none" stroke="${GOLD}" stroke-width="1"/>
  <rect x="448" y="134" width="704" height="1" fill="url(#gold-line)"/>
  <rect x="494" y="922" width="612" height="1" fill="url(#gold-line)" opacity="0.72"/>

  ${
    logoDataUri
      ? `<image href="${logoDataUri}" x="680" y="146" width="240" height="120" preserveAspectRatio="xMidYMid meet"/>`
      : `<text x="800" y="224" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" font-weight="700" fill="${BLACK}">ARQO</text>`
  }

  <text x="800" y="365" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="108" font-weight="400" fill="${BLACK}">Certificado</text>

  <text x="800" y="458" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="${BLACK}" opacity="0.72">
    O Founder &amp; CEO da ARQO, Gilson Nogueira, no uso de suas atribuicoes, confere o presente certificado a
  </text>

  <text x="800" y="585" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="102" font-weight="500" fill="${BLACK}">
    ${escapeXml(userName)}
  </text>
  <rect x="420" y="630" width="760" height="1" fill="url(#gold-line)"/>

  <text x="800" y="705" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25" fill="${BLACK}" opacity="0.74">
    ${courseLines.map((line, index) => `<tspan x="800" dy="${index === 0 ? 0 : 39}">${escapeXml(line)}</tspan>`).join('')}
  </text>

  <g font-family="Arial, Helvetica, sans-serif" font-size="18" fill="${BLACK}">
    <line x1="230" y1="900" x2="546" y2="900" stroke="${GOLD}" stroke-width="1"/>
    <text x="388" y="928" text-anchor="middle" font-size="20">${escapeXml(completionDate)}</text>
    <text x="388" y="962" text-anchor="middle" opacity="0.72">Data</text>

    <line x1="642" y1="900" x2="958" y2="900" stroke="${BLACK}" stroke-width="1"/>
    <text x="800" y="944" text-anchor="middle" opacity="0.72">Assinatura do aluno</text>

    ${
      signatureDataUri
        ? `<image href="${signatureDataUri}" x="1050" y="760" width="320" height="130" preserveAspectRatio="xMidYMid meet" opacity="0.94"/>`
        : ''
    }
    <line x1="1054" y1="900" x2="1370" y2="900" stroke="${BLACK}" stroke-width="1"/>
    <text x="1212" y="944" text-anchor="middle" opacity="0.72">Gilson Nogueira - CEO &amp; Founder</text>
  </g>

  <text x="800" y="1047" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="${BLACK}" opacity="0.48">
    Codigo de validacao: ${escapeXml(validationCode)}
  </text>
</svg>`;
}

async function assertAuthenticated(request) {
  const headers = request.headers || {};
  const authorization = typeof headers.get === 'function'
    ? headers.get('authorization')
    : headers.authorization || headers.Authorization;

  if (!authorization) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw Object.assign(new Error('Supabase environment variables are missing.'), { statusCode: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    response.status(405).send('Method not allowed');
    return;
  }

  try {
    await assertAuthenticated(request);
    const values = request.body || {};
    const svg = await buildCertificateSvg(values);
    const png = await sharp(Buffer.from(svg)).png().toBuffer();

    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Cache-Control', 'no-store');
    response.status(200).send(png);
  } catch (error) {
    const statusCode = typeof error === 'object' && error && 'statusCode' in error
      ? Number(error.statusCode)
      : 500;
    response.status(Number.isFinite(statusCode) ? statusCode : 500).json({ error: error instanceof Error ? error.message : 'Erro ao renderizar certificado.' });
  }
}
