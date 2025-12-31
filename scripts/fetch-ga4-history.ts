/**
 * Fetch and store 90 days of GA4 historical data
 */

import 'dotenv/config';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

import { prisma } from '@/lib/prisma';
import { GA4Provider } from '@/lib/providers/ga4/ga4-provider';

async function fetchHistory() {
  console.log('📊 Fetching GA4 historical data (90 days)...\n');

  const propertyId = process.env.GA4_PROPERTY_ID;
  const serviceAccountKey = process.env.GA4_SERVICE_ACCOUNT_KEY;

  if (!propertyId || !serviceAccountKey) {
    console.error('❌ Missing GA4 environment variables');
    process.exit(1);
  }

  try {
    const provider = new GA4Provider({ propertyId, serviceAccountKey });

    console.log('Fetching data from GA4...');
    const snapshots = await provider.fetchMultiple();

    console.log(`✓ Fetched ${snapshots.length} daily snapshots\n`);

    console.log('Saving to database...');
    let saved = 0;

    for (const snapshot of snapshots) {
      const date = snapshot.metadata?.date as string;
      if (!date) continue;

      await prisma.metricsSnapshot.upsert({
        where: {
          unique_snapshot: {
            providerId: 'ga4',
            snapshotTime: snapshot.timestamp,
          },
        },
        update: {
          metrics: snapshot.metrics as any,
          snapshotDate: new Date(date),
        },
        create: {
          providerId: 'ga4',
          snapshotDate: new Date(date),
          snapshotTime: snapshot.timestamp,
          metrics: snapshot.metrics as any,
        },
      });

      saved++;
      if (saved % 10 === 0) {
        process.stdout.write(`  Saved ${saved}/${snapshots.length}...\r`);
      }
    }

    console.log(`\n✅ Saved ${saved} snapshots to database!`);

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

fetchHistory();
