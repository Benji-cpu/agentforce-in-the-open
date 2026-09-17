#!/usr/bin/env node
// Drive `sf agent preview` without the interactive TUI, so a conversation can be scripted,
// repeated and saved. Runs the CLI through ./sf (node@22). Every reply is written to a
// transcript file as it arrives — the capture is the point.
//
//   node tools/preview.mjs start [--simulate]            → prints a session id
//   node tools/preview.mjs send <session> "<utterance>"  → prints the agent's reply
//   node tools/preview.mjs end <session>                 → ends it, prints the traces path
//   node tools/preview.mjs run <cases.json> <out-dir>    → one fresh session per case, all
//                                                          turns sent, transcript per case
//
// cases.json: [{ "id": "q01", "turns": ["...", "..."] }, ...]

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BUNDLE = process.env.BUNDLE || 'Northaven_Support';
const ORG = process.env.ORG || 'agentforce-de';
const PUBLISHED = process.env.PUBLISHED === '1';
const selector = [PUBLISHED ? '--api-name' : '--authoring-bundle', BUNDLE];

function sf(args) {
  const r = spawnSync('./sf', [...args, '--json', '--target-org', ORG], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const raw = (r.stdout || '') + (r.stderr || '');
  const clean = raw.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
  const i = clean.indexOf('{');
  if (i < 0) throw new Error(`no JSON from sf ${args.join(' ')}:\n${clean.slice(0, 800)}`);
  let j;
  try { j = JSON.parse(clean.slice(i)); } catch (e) {
    // the CLI sometimes prints spinner lines after the JSON; take the outermost object
    const last = clean.lastIndexOf('}');
    j = JSON.parse(clean.slice(i, last + 1));
  }
  return j;
}

function start(simulate = false) {
  const j = sf(['agent', 'preview', 'start', ...selector, ...(PUBLISHED ? [] : [simulate ? '--simulate-actions' : '--use-live-actions'])]);
  if (!j.result?.sessionId) throw new Error('start failed: ' + JSON.stringify(j).slice(0, 1200));
  return j.result;
}

function send(session, utterance) {
  const j = sf(['agent', 'preview', 'send', '--session-id', session, ...selector, '--utterance', utterance]);
  if (j.status !== 0) throw new Error('send failed: ' + JSON.stringify(j).slice(0, 1200));
  const msgs = j.result?.messages || [];
  const text = msgs.map(m => m.message).filter(Boolean).join('\n');
  return { text, raw: j.result };
}

function end(session) {
  const j = sf(['agent', 'preview', 'end', '--session-id', session, ...selector]);
  return j.result || j;
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'start') {
  const r = start(rest.includes('--simulate'));
  console.log(r.sessionId);
} else if (cmd === 'send') {
  const [session, utterance] = rest;
  const { text, raw } = send(session, utterance);
  console.log(text);
  if (process.env.RAW) console.error(JSON.stringify(raw, null, 1));
} else if (cmd === 'end') {
  console.log(JSON.stringify(end(rest[0]), null, 1));
} else if (cmd === 'run') {
  const [casesPath, outDir] = rest;
  const cases = JSON.parse(await import('node:fs').then(m => m.readFileSync(casesPath, 'utf8')));
  if (existsSync(outDir)) throw new Error('Refusing to overwrite a capture directory: ' + outDir);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'run-config.json'), JSON.stringify({bundle:BUNDLE,org:ORG,published:PUBLISHED,simulate:process.env.SIMULATE === '1',casesPath,startedAt:new Date().toISOString()},null,2));
  let failures=0;
  for (const c of cases) {
    const file = join(outDir, `${c.id}.md`);
    writeFileSync(file, `# ${c.id}\n\n${c.note ? c.note + '\n\n' : ''}`);
    let session;
    try {
      const s = start(process.env.SIMULATE === '1');
      session = s.sessionId;
      appendFileSync(file, `_session ${session}_\n\n`);
      for (const [turnIndex, turn] of c.turns.entries()) {
        appendFileSync(file, `**Customer:** ${turn}\n\n`);
        const t0 = Date.now();
        const { text, raw } = send(session, turn);
        const ms = Date.now() - t0;
        appendFileSync(file, `**Agent (${(ms / 1000).toFixed(1)}s):** ${text || '(no message)'}\n\n`);
        writeFileSync(join(outDir, `${c.id}.${turnIndex + 1}.json`), JSON.stringify(raw, null, 1));
        process.stdout.write(`${c.id} turn ${turnIndex + 1}: ${(text || '').replace(/\s+/g, ' ').slice(0, 140)}\n`);
      }
    } catch (e) {
      failures++;
      appendFileSync(file, `**ERROR:** ${e.message}\n\n`);
      process.stdout.write(`${c.id} ERROR ${e.message.slice(0, 300)}\n`);
    } finally {
      if (session) { try { end(session); } catch {} }
    }
  }
  if(failures) process.exitCode=1;
} else {
  console.error('usage: preview.mjs start|send|end|run');
  process.exit(2);
}
