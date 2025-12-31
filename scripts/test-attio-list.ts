/**
 * Test querying the YCX25 list
 */

import 'dotenv/config';

async function testAttioList() {
  console.log('🔍 Testing YCX25 List...\n');

  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found');
    process.exit(1);
  }

  const baseUrl = 'https://api.attio.com/v2';
  const apiKey = process.env.ATTIO_API_KEY;
  const listId = 'b12ebb7e-c765-498c-ae14-167c2da9461a'; // YCX25 list ID

  try {
    // Get list entries
    const response = await fetch(`${baseUrl}/lists/${listId}/entries/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {},
        limit: 100,
        offset: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed to fetch list: ${response.status}`);
      console.error(error);
      process.exit(1);
    }

    const data = await response.json();
    const entries = data.data || [];

    console.log(`📋 Found ${entries.length} entries in YCX25 list\n`);

    // Display first few entries
    for (const entry of entries.slice(0, 10)) {
      console.log(`Entry ID: ${entry.id?.entry_id || 'N/A'}`);

      if (entry.parent_record) {
        console.log(`  Parent Record ID: ${entry.parent_record.id?.record_id || 'N/A'}`);

        // Show attributes
        if (entry.parent_record.values) {
          const values = entry.parent_record.values;
          console.log(`  Attributes:`, Object.keys(values).join(', '));

          // Try to extract company name and stage
          for (const [key, attrValues] of Object.entries(values)) {
            if (Array.isArray(attrValues) && attrValues.length > 0) {
              const val = attrValues[0];
              if (val && typeof val === 'object' && 'value' in val) {
                console.log(`    ${key}: ${JSON.stringify(val.value).slice(0, 50)}`);
              }
            }
          }
        }
      }

      console.log('');
    }

    if (entries.length > 10) {
      console.log(`... and ${entries.length - 10} more entries\n`);
    }

    console.log('✅ Test completed!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAttioList();
