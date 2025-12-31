/**
 * Enable GA4 provider in the database
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { prisma } from '@/lib/prisma';

async function enableGA4() {
  console.log('🔧 Enabling GA4 provider...\n');

  try {
    const provider = await prisma.providersConfig.upsert({
      where: { providerId: 'ga4' },
      update: { isEnabled: true },
      create: {
        providerId: 'ga4',
        name: 'Google Analytics 4',
        isEnabled: true,
        fetchIntervalMinutes: 240,
      },
    });

    console.log('✅ GA4 provider enabled!');
    console.log('  Provider ID:', provider.providerId);
    console.log('  Name:', provider.name);
    console.log('  Enabled:', provider.isEnabled);
    console.log('  Fetch interval:', provider.fetchIntervalMinutes, 'minutes');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableGA4();
