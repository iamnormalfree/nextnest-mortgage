import { DrElenaIntegrationService } from '@/lib/ai/dr-elena-integration-service';
import { calculationRepository } from '@/lib/db/repositories/calculation-repository';
import { testScenarios, generateTestConversationId } from './test-data/calculation-orchestrator-fixtures';

let pass = 0;
let fail = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log('PASS: ' + name);
    pass++;
  } catch (e: any) {
    console.log('FAIL: ' + name + ' - ' + e.message);
    fail++;
  }
}

async function main() {
  console.log('Dr Elena E2E Tests');
  const svc = new DrElenaIntegrationService();
  
  for (const sc of testScenarios) {
    await test(sc.name, async () => {
      const res = await svc.processCalculationRequest({
        conversationId: generateTestConversationId(sc.name),
        leadData: sc.leadData,
        brokerPersona: sc.brokerPersona,
        userMessage: sc.userMessage
      });
      if (!res.calculation) throw new Error('No calc');
      if (res.calculation.maxLoan < sc.expectedCalculation.maxLoanMin) throw new Error('Loan too low');
      if (res.calculation.maxLoan > sc.expectedCalculation.maxLoanMax) throw new Error('Loan too high');
    });
  }
  
  await svc.disconnect();
  console.log('Pass: ' + pass + ', Fail: ' + fail);
  process.exit(fail > 0 ? 1 : 0);
}

main();
