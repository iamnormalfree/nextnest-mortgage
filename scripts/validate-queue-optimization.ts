
import { getQueueMetrics } from "../lib/queue/broker-queue";
import { validateQueueOptimizationSettings } from "../lib/queue/worker-manager";

async function main() {
  console.log("Queue Optimization Validation");
  
  const envValidation = validateQueueOptimizationSettings();
  console.log("Environment:", envValidation.isValid ? "PASS" : "WARNING");
  
  try {
    const metrics = await getQueueMetrics();
    console.log("Queue Connection: PASS");
  } catch (error) {
    console.log("Queue Connection: FAIL");
  }
  
  const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "10");
  const rateLimit = parseInt(process.env.QUEUE_RATE_LIMIT || "30");
  
  console.log("Concurrency:", concurrency, concurrency >= 10 ? "(PASS)" : "(FAIL)");
  console.log("Rate Limit:", rateLimit + "/sec", rateLimit >= 30 ? "(PASS)" : "(FAIL)");
  
  console.log("Validation complete\!");
}

if (require.main === module) {
  main().catch(console.error);
}
