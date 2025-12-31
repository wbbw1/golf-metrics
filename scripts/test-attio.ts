/**
 * Test script for Attio Provider
 *
 * Tests the Attio CRM integration by fetching deals and displaying metrics.
 * Run with: npx tsx scripts/test-attio.ts
 */

import 'dotenv/config';
import { AttioProvider } from '../lib/providers/attio/attio-provider';

async function testAttio() {
  console.log('🔍 Testing Attio CRM Integration...\n');

  // Check for API key
  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found in .env.local');
    process.exit(1);
  }

  try {
    // Initialize provider
    const provider = new AttioProvider({
      apiKey: process.env.ATTIO_API_KEY,
      objectSlug: 'deals',
    });

    console.log('✓ Attio provider initialized\n');

    // Validate configuration
    console.log('📡 Validating Attio API connection...');
    const isValid = await provider.validateConfig();

    if (!isValid) {
      console.error('❌ Attio configuration is invalid');
      process.exit(1);
    }

    console.log('✓ Attio API connection successful\n');

    // Fetch data
    console.log('📥 Fetching deals from Attio...');
    const metrics = await provider.fetch();

    console.log('✓ Data fetched successfully\n');

    // Display metrics
    console.log('📊 METRICS SUMMARY:');
    console.log('─'.repeat(60));

    for (const [key, metric] of Object.entries(metrics.metrics)) {
      const label = metric.label.padEnd(30);
      const value = metric.type === 'currency'
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(metric.value as number)
        : metric.value;

      console.log(`${label} ${value}`);
    }

    console.log('─'.repeat(60));

    // Display deals by stage
    const deals = metrics.metadata?.deals as any[] || [];
    console.log(`\n📋 TOTAL DEALS: ${deals.length}\n`);

    // Group by stage
    const stages = new Map<string, any[]>();
    for (const deal of deals) {
      const stage = deal.stage;
      if (!stages.has(stage)) {
        stages.set(stage, []);
      }
      stages.get(stage)?.push(deal);
    }

    // Display by stage
    for (const [stage, stageDeals] of stages.entries()) {
      console.log(`\n${stage.toUpperCase()} (${stageDeals.length} deals):`);
      console.log('─'.repeat(60));

      for (const deal of stageDeals.slice(0, 5)) {
        const daysText = `${deal.daysInStage} days`;
        const valueText = deal.dealValue
          ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(deal.dealValue)
          : 'No value';

        console.log(`  • ${deal.companyName}`);
        console.log(`    ${daysText.padEnd(15)} ${valueText}`);
      }

      if (stageDeals.length > 5) {
        console.log(`  ... and ${stageDeals.length - 5} more`);
      }
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testAttio();
