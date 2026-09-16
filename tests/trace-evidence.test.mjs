import test from 'node:test';
import assert from 'node:assert/strict';
import { extractEvidence } from '../tools/trace-evidence.mjs';
test('an offered escalation or promise is not execution', () => {
  const result = extractEvidence({plan: [
    {type:'EnabledToolsStep',data:{tools:['__escalate']}},
    {type:'NodeEntryStateStep',data:{agent_name:'escalation',instructions:'escalate now'}},
    {type:'PlannerResponseStep',message:'I have escalated this.'},
  ]});
  assert.equal(result.reachedHumanNode, false);
  assert.deepEqual(result.actions, []);
});
test('human-node entry is preview evidence; evaluator opinion stays separate', () => {
  const result = extractEvidence({plan: [
    {type:'NodeEntryStateStep',data:{agent_name:'__human__'}},
    {type:'GuardrailsStep',taskResolution:'FULLY_RESOLVED'},
  ]});
  assert.equal(result.reachedHumanNode, true);
  assert.equal(result.evaluatorVerdict, 'FULLY_RESOLVED');
});
