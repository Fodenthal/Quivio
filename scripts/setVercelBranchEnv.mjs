#!/usr/bin/env node

// Minimal Node script to set or update a Vercel environment variable
// scoped to a specific Git branch using Vercel's API.
//
// Requirements:
// - Node 18+ (global fetch available)
// - VERCEL_TOKEN with permissions for the project
//
// Usage:
//   node scripts/setVercelBranchEnv.mjs \
//     --project <VERCEL_PROJECT_ID> \
//     --token <VERCEL_TOKEN> \
//     --branch <git-branch-name> \
//     --key NEXT_PUBLIC_BACKEND_URL \
//     --value https://your-backend.example.com \
//     [--target preview]
//
// Notes:
// - target should typically be "preview" for branch-specific values.
// - If an env var with the same key and branch exists, this updates its value.
// - Otherwise, it creates a new branch-scoped env var.

const args = process.argv.slice(2);

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index === -1 || index + 1 >= args.length) return undefined;
  return args[index + 1];
}

const token = getArgValue('--token') || process.env.VERCEL_TOKEN;
const projectId = getArgValue('--project') || process.env.VERCEL_PROJECT_ID;
const branch = getArgValue('--branch');
const key = getArgValue('--key');
const value = getArgValue('--value');
const target = getArgValue('--target') || 'preview';

function fail(msg) {
  console.error(`Error: ${msg}`);
  process.exit(1);
}

if (!token) fail('Missing VERCEL_TOKEN (pass with --token or set env var).');
if (!projectId) fail('Missing VERCEL_PROJECT_ID (pass with --project or set env var).');
if (!branch) fail('Missing --branch');
if (!key) fail('Missing --key');
if (!value) fail('Missing --value');

async function vercelRequest(method, path, body) {
  const res = await fetch(`https://api.vercel.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    json = { raw: text };
  }

  if (!res.ok) {
    const message = json?.error?.message || json?.message || res.statusText;
    throw new Error(`Vercel API ${method} ${path} failed: ${res.status} ${message}`);
  }
  return json;
}

async function main() {
  // List existing env vars
  const list = await vercelRequest('GET', `/v10/projects/${projectId}/env`);
  const existing = (list?.envs || []).find((e) => {
    const targets = Array.isArray(e.target) ? e.target : [];
    return e.key === key && targets.includes(target) && e.gitBranch === branch;
  });

  if (existing) {
    // Update existing
    await vercelRequest(
      'PATCH',
      `/v10/projects/${projectId}/env/${existing.id}`,
      {
        value,
        // Keep type the same; default to plain if not present
        type: existing.type || 'plain',
      }
    );
    console.log(
      `Updated Vercel env: key=${key}, branch=${branch}, target=${target} (id=${existing.id})`
    );
    return;
  }

  // Create new branch-scoped env var
  const created = await vercelRequest('POST', `/v9/projects/${projectId}/env`, {
    key,
    value,
    target: [target],
    type: 'plain',
    gitBranch: branch,
  });

  console.log(
    `Created Vercel env: key=${key}, branch=${branch}, target=${target} (id=${created?.id || created?.env?.id || 'unknown'})`
  );
}

main().catch((err) => fail(err.message || String(err)));


