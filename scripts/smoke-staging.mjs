// Smoke tests de staging/prod para a API NextCommerce.
// Uso: node scripts/smoke-staging.mjs
// Env: STAGING_API_URL (default http://localhost:3001), STAGING_WEB_URL
const API = process.env.STAGING_API_URL || 'http://localhost:3001';
const WEB = process.env.STAGING_WEB_URL || 'http://localhost:3000';

let failures = 0;

function log(ok, msg) {
  console.log(`${ok ? '✅' : '❌'} ${msg}`);
  if (!ok) failures += 1;
}

async function check(name, fn) {
  try {
    const res = await fn();
    log(res.ok, `${name} (HTTP ${res.status})`);
    return res;
  } catch (err) {
    log(false, `${name} — ${err.message}`);
    return { ok: false, status: 0 };
  }
}

async function main() {
  await check('API /health', async () => {
    const r = await fetch(`${API}/health`);
    const j = await r.json();
    if (j.status !== 'ok') throw new Error('status != ok');
    return { ok: r.ok, status: r.status };
  });

  await check('API /ready', async () => {
    const r = await fetch(`${API}/ready`);
    if (!r.ok) throw new Error('nao pronto');
    return { ok: r.ok, status: r.status };
  });

  const email = `smoke_${Date.now()}@test.com`;
  const password = 'Smoke@123';

  await check('Auth registro', async () => {
    const r = await fetch(`${API}/api/v1/auth/registro`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, nome_completo: 'Smoke User' }),
    });
    return { ok: r.ok, status: r.status };
  });

  let token = null;
  await check('Auth login', async () => {
    const r = await fetch(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    token = j.access_token;
    if (!token) throw new Error('sem access_token');
    return { ok: r.ok, status: r.status };
  });

  await check('Produtos (autenticado)', async () => {
    const r = await fetch(`${API}/api/v1/products`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    return { ok: r.ok, status: r.status };
  });

  await check('Web home carrega', async () => {
    const r = await fetch(WEB);
    if (!r.ok) throw new Error('home nao respondeu');
    return { ok: r.ok, status: r.status };
  });

  console.log(`\n${failures === 0 ? '🎉 Smoke OK' : `⚠️  ${failures} falha(s)`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main();
