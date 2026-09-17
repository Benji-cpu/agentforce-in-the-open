#!/usr/bin/env node
// Evidence report only. A human still scores correctness against tests/twenty-questions.json.
// --export writes an allowlisted summary for this SYNTHETIC dataset. Never use on client traces.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractEvidence } from './trace-evidence.mjs';
const dir = process.argv[2];
if (!dir) throw new Error('Usage: node tools/score-traces.mjs <run-directory> [--export]');
const bundle = process.env.BUNDLE || 'Northaven_Support';
const configPath = join(dir, 'run-config.json');
const config = existsSync(configPath) ? JSON.parse(readFileSync(configPath, 'utf8')) : {};
const cases = JSON.parse(readFileSync(process.env.CASES || config.casesPath || 'tests/twenty-questions.json', 'utf8'));
const report = { scope: config.published ? 'Synthetic activated-agent run; Case persistence checked separately.' : 'Synthetic authoring-bundle preview; human receipt is NOT verified.', cases: [] };
let missing = false;
for (const c of cases) {
  const file = join(dir, `${c.id}.md`);
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const session = text.match(/_session ([0-9a-f-]+)_/)?.[1];
  const roots = readdirSync(join('.sfdx','agents'), {withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name);
  const traceRoot = roots.find(root=>existsSync(join('.sfdx','agents',root,'sessions',session||'none','traces'))) || bundle;
  const tdir = join('.sfdx', 'agents', traceRoot, 'sessions', session || 'none', 'traces');
  const files = existsSync(tdir) ? readdirSync(tdir).filter(f => f.endsWith('.json')) : [];
  const traces = files.map(f => JSON.parse(readFileSync(join(tdir, f), 'utf8')))
    .sort((a, b) => (a.plan?.[0]?.startExecutionTime || 0) - (b.plan?.[0]?.startExecutionTime || 0));
  const turns = traces.filter(t=>Array.isArray(t.plan) && t.plan.length).map(extractEvidence);
  const complete = turns.length === c.turns.length && !text.includes('**ERROR:**');
  missing ||= !complete;
  const responseEvents = c.turns.map((_, i) => {
    const file = join(dir, `${c.id}.${i + 1}.json`);
    if (!existsSync(file)) { missing = true; return null; }
    const raw = JSON.parse(readFileSync(file, 'utf8'));
    return (raw.messages || []).filter(m => m.type === 'Escalate').map(m => ({ type: m.type, targets: m.targets || [] }));
  });
  report.cases.push({ id: c.id, complete, expected: c.expect, turns, responseEvents });
  console.log(`${c.id}: ${complete ? 'complete' : 'INCOMPLETE'}; lookup=${turns.reduce((n, t) => n + t.actions.filter(a => a.name === 'look_up_order').length, 0)}; previewEscalation=${turns.some(t => t.reachedHumanNode)}; humanReceipt=unverified`);
}
if (process.argv.includes('--export')) writeFileSync(join(dir, 'execution-evidence.json'), JSON.stringify(report, null, 2) + '\n');
if (missing) process.exitCode = 1;
