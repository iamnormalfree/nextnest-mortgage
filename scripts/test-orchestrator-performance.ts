import { DrElenaIntegrationService } from '@/lib/ai/dr-elena-integration-service';
import { testScenarios, generateTestConversationId } from './test-data/calculation-orchestrator-fixtures';

async function main() {
  console.log('Performance Test: Dr Elena Orchestrator');
  console.log('Target: P95 < 500ms, 20 iterations per scenario\n');
  
  const svc = new DrElenaIntegrationService();
  const times: number[] = [];
  
  for (const sc of testScenarios) {
    console.log('Testing: ' + sc.name);
    
    for (let i = 0; i < 20; i++) {
      const start = Date.now();
      
      await svc.processCalculationRequest({
        conversationId: generateTestConversationId(sc.name + i),
        leadData: sc.leadData,
        brokerPersona: sc.brokerPersona,
        userMessage: sc.userMessage
      });
      
      const elapsed = Date.now() - start;
      times.push(elapsed);
      process.stdout.write('.');
    }
    console.log(' done\n');
  }
  
  await svc.disconnect();
  
  times.sort((a, b) => a - b);
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  const min = times[0];
  const max = times[times.length - 1];
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  
  console.log('\n=== Results ===');
  console.log('Total: ' + times.length + ' requests');
  console.log('Min: ' + min + 'ms');
  console.log('Avg: ' + avg.toFixed(0) + 'ms');
  console.log('P50: ' + p50 + 'ms');
  console.log('P95: ' + p95 + 'ms ' + (p95 < 500 ? 'PASS' : 'FAIL'));
  console.log('P99: ' + p99 + 'ms');
  console.log('Max: ' + max + 'ms');
  
  if (p95 < 500) {
    console.log('\nPASS: P95 within SLA');
    process.exit(0);
  } else {
    console.log('\nFAIL: P95 exceeds 500ms SLA');
    process.exit(1);
  }
}

main();
