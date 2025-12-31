/**
 * Check available objects in Attio workspace
 */

import 'dotenv/config';

async function checkAttioObjects() {
  console.log('🔍 Checking Attio Objects...\n');

  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found');
    process.exit(1);
  }

  const baseUrl = 'https://api.attio.com/v2';
  const apiKey = process.env.ATTIO_API_KEY;

  // Try common object names
  const objectsToTry = ['deals', 'opportunities', 'pipeline', 'sales'];

  console.log('Testing common object names:\n');

  for (const objectSlug of objectsToTry) {
    try {
      const response = await fetch(`${baseUrl}/objects/${objectSlug}/records/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: {},
          limit: 5,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ "${objectSlug}": Found ${data.data?.length || 0} records`);

        if (data.data && data.data.length > 0) {
          const sample = data.data[0];
          console.log(`   Sample attributes:`, Object.keys(sample.values || {}).slice(0, 10).join(', '));
        }
      } else {
        const error = await response.text();
        console.log(`❌ "${objectSlug}": ${response.status} - Not found or no access`);
      }
    } catch (error) {
      console.log(`❌ "${objectSlug}": Error -`, error instanceof Error ? error.message : error);
    }
    console.log('');
  }

  console.log('\nTip: Use the object name that has records for your ATTIO_OBJECT_SLUG');
}

checkAttioObjects();
