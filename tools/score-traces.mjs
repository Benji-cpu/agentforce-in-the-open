#!/usr/bin/env node
// For each transcript in a run directory, read the local traces the CLI wrote under
// .sfdx/agents/<bundle>/sessions/<session>/traces and print what actually happened:
// which subagent handled it, whether an action ran and what it returned, whether the
// turn escalated, and the org's own guardrail verdict on task resolution.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const BUNDLE = process.env.BUNDLE || 'Northaven_Support';
const dir = process.argv[2];
for (const md of readdirSync(dir).filter(f => f.endsWith('.md')).sort()) {
  const text = readFileSync(join(dir, md), 'utf8');
  const session = (text.match(/_session ([0-9a-f-]+)_/) || [])[1];
  console.log(`\n## ${md.replace('.md', '')}  session=${session}`);
  const tdir = join('.sfdx', 'agents', BUNDLE, 'sessions', session || 'none', 'traces');
  if (!session || !existsSync(tdir)) { console.log('  (no traces)'); continue; }
  const traces = readdirSync(tdir).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(tdir, f), 'utf8')));
  traces.sort((a, b) => (a.plan?.[0]?.startExecutionTime || 0) - (b.plan?.[0]?.startExecutionTime || 0));
  let n = 0;
  for (const t of traces) {
    n++;
    const agents = [], fns = [], types = new Set(); let verdict = '', esc = false, msg = '';
    for (const p of t.plan || []) {
      types.add(p.type);
      if (p.type === 'NodeEntryStateStep') agents.push(p.data?.agent_name);
      if (p.type === 'FunctionStep') fns.push(`${p.function?.name}(${JSON.stringify(p.function?.input)}) → ${JSON.stringify(p.function?.output || {}).slice(0, 220)}`);
      if (p.type === 'GuardrailsStep') verdict = (p.taskResolution || '').split('\n')[0];
      if (p.type === 'PlannerResponseStep') msg = p.message || '';
      if (/Escalat/i.test(p.type) || JSON.stringify(p).includes('"__escalat') || JSON.stringify(p.data || {}).includes('escalate')) esc = true;
    }
    console.log(`  turn ${n}: topic=${t.topic} path=${agents.join('>')}`);
    for (const f of fns) console.log(`    action: ${f}`);
    console.log(`    verdict=${verdict || '(none)'}${esc ? '  ESCALATION-STEP' : ''}  types=${[...types].filter(x => !/Step$/.test(x) || /Escalat|Function|Transition|Error/.test(x)).join(',')}`);
  }
}
