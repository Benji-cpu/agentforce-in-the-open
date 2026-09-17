// Build the public view from captured replies and separately checked records. Never retype evidence.
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2];if(!dir)throw Error('run directory required');
const cfg=JSON.parse(readFileSync(join(dir,'run-config.json'),'utf8'));if(cfg.simulate)throw Error('Public examples must use live actions');
const tests=JSON.parse(readFileSync(cfg.casesPath,'utf8'));
const execution=JSON.parse(readFileSync(join(dir,'execution-evidence.json'),'utf8'));
const receipts=JSON.parse(readFileSync('docs/support-records.json','utf8'));
const report=JSON.parse(readFileSync('docs/acceptance-results.json','utf8'));
const apex=JSON.parse(readFileSync('docs/apex-test-results.json','utf8'));
const base='https://github.com/Benji-cpu/agentforce-in-the-open/blob/main/';
const out={metrics:{cases:report.totalCases,tests:apex.namedTestMethods,requests:receipts.length,note:report.publicSummary},report:base+'docs/ACCEPTANCE.md',examples:{}};
for(const [key,id] of Object.entries({order:'q01-status-both-given',policy:'q12-returns-unopened',support:'q18-recalibration-quote'})){
 const test=tests.find(c=>c.id===id);const evidence=execution.cases.find(c=>c.id===id);if(!evidence?.complete)throw Error('Incomplete '+id);
 const messages=[];for(const [i,turn]of test.turns.entries()){
  messages.push({role:'customer',text:turn});const raw=JSON.parse(readFileSync(join(dir,`${id}.${i+1}.json`),'utf8'));
  const text=(raw.messages||[]).map(m=>m.message).filter(Boolean).join('\n\n');messages.push({role:'agent',text});
 }
 const actions=evidence.turns.flatMap(t=>t.actions);const rows=[];
 if(key==='order'){
  const action=actions.find(a=>a.name==='look_up_order'&&a.output?.found);if(!action)throw Error('No successful lookup');
  rows.push({label:'Action executed',value:'NorthavenOrderLookup'},{label:'Matched record',value:action.output.orderReference},{label:'Status returned',value:action.output.fulfilmentStatus},{label:'Tracking returned',value:action.output.carrier+' · '+action.output.trackingNumber},{label:'Access boundary',value:'Details returned after reference and email matched. This is a demo check, not authentication.'});
 }else if(key==='policy'){
  const action=actions.find(a=>a.name==='read_policy'&&a.output?.found);if(!action)throw Error('No retrieved article');
  rows.push({label:'Action executed',value:'NorthavenPolicyLookup'},{label:'Source retrieved',value:action.output.title},{label:'Publication state',value:'Online · Salesforce Knowledge'},{label:'Rule in the source',value:action.output.policyText},{label:'Retrieval method',value:'Exact topic lookup. The reply is based on a published article.'});
 }else{
  const action=actions.find(a=>a.name==='create_request'&&a.output?.created);if(!action)throw Error('No successful case creation');
  const receipt=receipts.find(r=>r.caseNumber===action.output.caseNumber);if(!receipt)throw Error('No separate Case readback');
  rows.push({label:'Action executed',value:'NorthavenSupportRequest'},{label:'Case read back from Salesforce',value:receipt.caseNumber},{label:'Owner verified',value:receipt.queue},{label:'Context saved',value:receipt.description},{label:'What this means',value:'A request is saved for later review. No live chat transfer or email-sent claim.'});
 }
 out.examples[key]={messages,evidence:rows,source:base+dir+'/'+id+'.md'};
}
writeFileSync('docs/demo-evidence.json',JSON.stringify(out,null,2)+'\n');
