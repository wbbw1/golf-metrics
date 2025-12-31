/**
 * Get full deal details using record IDs from search
 */

import 'dotenv/config';

async function getDealDetails() {
  console.log('🔍 Getting Full Deal Details...\n');

  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found');
    process.exit(1);
  }

  const baseUrl = 'https://api.attio.com/v2';
  const apiKey = process.env.ATTIO_API_KEY;

  try {
    // First, search for all deals
    console.log('📡 Searching for all deals...');
    const searchResponse = await fetch(`${baseUrl}/objects/records/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: "",
        objects: ["deals"],
        request_as: { type: "workspace" },
        limit: 25,
      }),
    });

    const searchData = await searchResponse.json();
    const dealIds = searchData.data || [];

    console.log(`✅ Found ${dealIds.length} deals\n`);

    // Now fetch full details for first 10 deals
    console.log('📡 Fetching full details for first 10 deals...\n');

    for (const deal of dealIds.slice(0, 10)) {
      const recordId = deal.id.record_id;

      const detailResponse = await fetch(`${baseUrl}/objects/deals/records/${recordId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (detailResponse.ok) {
        const detailData = await detailResponse.json();
        const values = detailData.data.values || {};

        // Extract key fields
        const name = values.name?.[0]?.value || 'Unknown';
        const stage = values.stage?.[0]?.value || 'Unknown';
        const owner = values.owner?.[0]?.value?.referenced_actor_id || 'Unknown';
        const dealValue = values.value?.[0]?.value || null;
        const createdAt = detailData.data.created_at;

        console.log(`📋 ${name}`);
        console.log(`   Stage: ${stage}`);
        console.log(`   Owner: ${owner}`);
        console.log(`   Value: ${dealValue ? `$${dealValue}` : 'Not set'}`);
        console.log(`   Created: ${createdAt}`);
        console.log('');
      }
    }

    console.log('\n✅ Successfully retrieved deal details!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

getDealDetails();
