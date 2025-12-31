/**
 * Test Script for Notion Provider
 *
 * Tests the complete flow: API → Database → Query
 * Run with: npx tsx scripts/test-notion.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { NotionProvider } from '../lib/providers/notion/notion-provider';
import { FetchOrchestrator } from '../lib/orchestration/fetch-orchestrator';
import { getLatestMetrics, getDashboardStats } from '../lib/db/metrics-queries';

const prisma = new PrismaClient();

async function testNotion() {
  console.log('🧪 Testing Notion Provider End-to-End\n');

  // Step 1: Check environment variables
  console.log('📋 Step 1: Checking environment variables...');
  if (!process.env.NOTION_API_KEY) {
    console.error('❌ NOTION_API_KEY not found in environment');
    console.log('   Please add it to your .env file');
    return false;
  }
  if (!process.env.NOTION_DATABASE_ID) {
    console.error('❌ NOTION_DATABASE_ID not found in environment');
    console.log('   Please add it to your .env file');
    return false;
  }
  console.log('✅ Environment variables configured\n');

  // Step 2: Initialize provider
  console.log('📋 Step 2: Initializing Notion provider...');
  try {
    const notionProvider = new NotionProvider({
      apiKey: process.env.NOTION_API_KEY,
      databaseId: process.env.NOTION_DATABASE_ID,
    });
    console.log(`✅ Provider initialized: ${notionProvider.name}\n`);

    // Step 3: Validate configuration
    console.log('📋 Step 3: Validating Notion configuration...');
    const isValid = await notionProvider.validateConfig();
    if (!isValid) {
      console.error('❌ Notion configuration is invalid');
      console.log('   Check your API key and database ID');
      return false;
    }
    console.log('✅ Configuration is valid\n');

    // Step 4: Fetch data from Notion
    console.log('📋 Step 4: Fetching data from Notion API...');
    const orchestrator = new FetchOrchestrator(prisma);
    const metrics = await orchestrator.fetchProvider(notionProvider);
    console.log(`✅ Fetched ${Object.keys(metrics.metrics).length} metrics`);
    console.log('   Metrics:', Object.keys(metrics.metrics).join(', '));
    console.log('');

    // Step 5: Query from database
    console.log('📋 Step 5: Querying data from database...');
    const dashboardMetrics = await getLatestMetrics();
    const notionData = dashboardMetrics.providers.find((p) => p.providerId === 'notion');

    if (!notionData) {
      console.error('❌ No Notion data found in database');
      return false;
    }

    console.log(`✅ Found ${notionData.metrics.length} metrics in database`);
    console.log(`   Last fetched: ${notionData.lastFetched}`);
    console.log(`   Is stale: ${notionData.isStale ? 'Yes' : 'No'}`);
    console.log('');

    // Step 6: Display dashboard stats
    console.log('📋 Step 6: Dashboard statistics...');
    const stats = await getDashboardStats();
    console.log(`✅ Total snapshots: ${stats.totalSnapshots}`);
    console.log(`   Total fetch logs: ${stats.totalLogs}`);
    console.log(`   Active providers: ${stats.activeProviders}`);
    console.log(`   Last fetch: ${stats.lastFetch || 'Never'}`);
    console.log('');

    // Success!
    console.log('🎉 All tests passed! Notion provider is working correctly.\n');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error:', error.message);
    }
    return false;
  }
}

// Run the test
testNotion()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
