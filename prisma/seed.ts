/**
 * Database Seed Script
 *
 * Populates the database with initial provider configurations.
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Notion provider
  const notion = await prisma.providersConfig.upsert({
    where: { providerId: 'notion' },
    update: {
      isEnabled: !!process.env.NOTION_API_KEY,
    },
    create: {
      providerId: 'notion',
      name: 'Notion',
      isEnabled: !!process.env.NOTION_API_KEY,
      status: 'ACTIVE',
      fetchIntervalMinutes: 1440, // 24 hours (daily)
      config: {
        description: 'Manual metrics tracking via Notion database',
        dataTypes: ['manual_entries', 'custom_metrics'],
      },
    },
  });
  console.log('✓ Notion provider:', notion.name);

  // Seed Attio provider
  const attio = await prisma.providersConfig.upsert({
    where: { providerId: 'attio' },
    update: {
      isEnabled: !!process.env.ATTIO_API_KEY,
    },
    create: {
      providerId: 'attio',
      name: 'Attio CRM',
      isEnabled: !!process.env.ATTIO_API_KEY,
      status: 'INACTIVE', // Will be activated when implemented
      fetchIntervalMinutes: 240, // 4 hours
      config: {
        description: 'CRM deals and pipeline metrics',
        dataTypes: ['deals', 'pipeline_value', 'contacts'],
      },
    },
  });
  console.log('✓ Attio provider:', attio.name);

  // Seed GA4 provider
  const ga4 = await prisma.providersConfig.upsert({
    where: { providerId: 'ga4' },
    update: {
      isEnabled: !!process.env.GA4_PROPERTY_ID,
    },
    create: {
      providerId: 'ga4',
      name: 'Google Analytics 4',
      isEnabled: !!process.env.GA4_PROPERTY_ID,
      status: 'INACTIVE', // Will be activated when implemented
      fetchIntervalMinutes: 60, // 1 hour
      config: {
        description: 'Website traffic and engagement metrics',
        dataTypes: ['users', 'sessions', 'pageviews', 'events'],
      },
    },
  });
  console.log('✓ GA4 provider:', ga4.name);

  // Seed Phantombuster provider (disabled for now)
  const phantombuster = await prisma.providersConfig.upsert({
    where: { providerId: 'phantombuster' },
    update: {},
    create: {
      providerId: 'phantombuster',
      name: 'Phantombuster',
      isEnabled: false,
      status: 'INACTIVE',
      fetchIntervalMinutes: 360, // 6 hours
      config: {
        description: 'Social media automation and outreach metrics',
        dataTypes: ['linkedin', 'campaign_results'],
      },
    },
  });
  console.log('✓ Phantombuster provider:', phantombuster.name);

  // Seed Finta provider (disabled, no API access yet)
  const finta = await prisma.providersConfig.upsert({
    where: { providerId: 'finta' },
    update: {},
    create: {
      providerId: 'finta',
      name: 'Finta',
      isEnabled: false,
      status: 'MAINTENANCE',
      fetchIntervalMinutes: 1440, // Daily
      config: {
        description: 'Financial data and transactions',
        dataTypes: ['transactions', 'accounts', 'balance'],
      },
    },
  });
  console.log('✓ Finta provider:', finta.name);

  console.log('');
  console.log('✅ Seeding complete!');
  console.log('');
  console.log('Provider status:');
  console.log(`  - Notion: ${notion.isEnabled ? '🟢 Enabled' : '🔴 Disabled'}`);
  console.log(`  - Attio: ${attio.isEnabled ? '🟢 Enabled' : '🔴 Disabled'}`);
  console.log(`  - GA4: ${ga4.isEnabled ? '🟢 Enabled' : '🔴 Disabled'}`);
  console.log(`  - Phantombuster: 🔴 Disabled`);
  console.log(`  - Finta: 🔴 Disabled`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
