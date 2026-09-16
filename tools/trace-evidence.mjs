// Extract observable execution, never infer execution from instructions or prose.
export function extractEvidence(trace) {
  const steps = trace.plan || [];
  const path = steps.filter(s => s.type === 'NodeEntryStateStep').map(s => s.data?.agent_name).filter(Boolean);
  return {
    path,
    reachedHumanNode: path.includes('__human__'),
    actions: steps.filter(s => s.type === 'FunctionStep').map(s => ({
      name: s.function?.name,
      input: s.function?.input,
      output: Object.fromEntries(Object.entries(s.function?.output || {}).filter(([k]) => !k.startsWith('__'))),
    })),
    evaluatorVerdict: steps.find(s => s.type === 'GuardrailsStep')?.taskResolution || null,
  };
}
