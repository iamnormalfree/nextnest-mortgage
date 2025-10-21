#!/usr/bin/env node

/**
 * ABOUTME: System monitoring script for AI Broker
 * ABOUTME: Checks health metrics and displays alert status
 *
 * USAGE:
 *   node scripts/monitor-system.mjs              # Check local dev
 *   node scripts/monitor-system.mjs --prod       # Check production
 *   node scripts/monitor-system.mjs --watch      # Continuous monitoring (every 30s)
 */

import fs from 'fs/promises';

const BASE_URL = process.argv.includes('--prod')
  ? 'https://nextnest.sg'
  : 'http://localhost:3001';

const WATCH_MODE = process.argv.includes('--watch');
const WATCH_INTERVAL = 30000; // 30 seconds

async function checkHealth() {
  console.log('\n🔍 Checking System Health...');
  console.log(`   URL: ${BASE_URL}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  try {
    // Check alerts
    const alertsResponse = await fetch(`${BASE_URL}/api/monitoring/alerts`);

    if (!alertsResponse.ok) {
      console.error(`❌ Failed to fetch alerts: ${alertsResponse.status}`);
      return;
    }

    const alertsData = await alertsResponse.json();

    // Display summary
    console.log('📊 Alert Summary:');
    console.log(`   Status: ${alertsData.status === 'healthy' ? '✅ Healthy' : '⚠️ Alerts Detected'}`);
    console.log(`   Total Alerts: ${alertsData.summary.total}`);
    console.log(`   Critical: ${alertsData.summary.critical}`);
    console.log(`   Warning: ${alertsData.summary.warning}\n`);

    // Display alerts if any
    if (alertsData.alerts && alertsData.alerts.length > 0) {
      console.log('🚨 Active Alerts:');
      alertsData.alerts.forEach((alert, index) => {
        const emoji = alert.severity === 'critical' ? '🚨' : '⚠️';
        console.log(`\n${index + 1}. ${emoji} [${alert.severity.toUpperCase()}] ${alert.category}`);
        console.log(`   Message: ${alert.message}`);
        console.log(`   Metric: ${alert.metric}`);
        console.log(`   Value: ${alert.value} (threshold: ${alert.threshold})`);
      });
      console.log('');
    }

    // Check queue metrics
    const migrationResponse = await fetch(`${BASE_URL}/api/admin/migration-status`);

    if (migrationResponse.ok) {
      const migrationData = await migrationResponse.json();

      console.log('📈 Queue Metrics:');
      console.log(`   Waiting: ${migrationData.queue.waiting}`);
      console.log(`   Active: ${migrationData.queue.active}`);
      console.log(`   Completed: ${migrationData.queue.completed}`);
      console.log(`   Failed: ${migrationData.queue.failed}\n`);

      console.log('⚙️ Worker Status:');
      console.log(`   Initialized: ${migrationData.worker.initialized ? '✅' : '❌'}`);
      console.log(`   Running: ${migrationData.worker.running ? '✅' : '❌'}\n`);

      console.log('🏥 Health Score:');
      console.log(`   Score: ${migrationData.health.score}/100`);
      console.log(`   Status: ${migrationData.health.status}`);
      console.log(`   Summary: ${migrationData.health.summary}\n`);

      if (migrationData.health.issues.length > 0) {
        console.log('⚠️ Health Issues:');
        migrationData.health.issues.forEach((issue) => {
          console.log(`   - ${issue}`);
        });
        console.log('');
      }
    }

    // Save report if requested
    if (process.argv.includes('--save')) {
      const reportPath = `monitoring-report-${Date.now()}.json`;
      await fs.writeFile(
        reportPath,
        JSON.stringify({ alerts: alertsData, timestamp: new Date().toISOString() }, null, 2)
      );
      console.log(`📄 Report saved to: ${reportPath}\n`);
    }
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
  }
}

// Main execution
async function main() {
  if (WATCH_MODE) {
    console.log('👁️ Watch mode enabled - checking every 30 seconds');
    console.log('   Press Ctrl+C to stop\n');

    // Initial check
    await checkHealth();

    // Continuous monitoring
    setInterval(checkHealth, WATCH_INTERVAL);
  } else {
    // Single check
    await checkHealth();
  }
}

main().catch(console.error);
