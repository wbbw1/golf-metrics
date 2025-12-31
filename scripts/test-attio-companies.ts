/**
 * Test querying companies object
 */

import 'dotenv/config';

async function testCompanies() {
  console.log('🔍 Testing Companies Object...\n');

  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found');
    process.exit(1);
  }

  const baseUrl = 'https://api.attio.com/v2';
  const apiKey = process.env.ATTIO_API_KEY;

  try {
    // Query companies
    const response = await fetch(`${baseUrl}/objects/companies/records/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {},
        limit: 20,
        offset: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed: ${response.status}`);
      console.error(error);
      process.exit(1);
    }

    const data = await response.json();
    const companies = data.data || [];

    console.log(`📋 Found ${companies.length} companies\n`);

    // Display first few companies
    for (const company of companies.slice(0, 10)) {
      const values = company.values || {};
      const name = values.name?.[0]?.value || 'Unknown';
      const attributes = Object.keys(values);

      console.log(`Company: ${name}`);
      console.log(`  Attributes (${attributes.length}):`, attributes.slice(0, 15).join(', '));

      // Look for stage-related attributes
      const stageAttrs = attributes.filter(attr =>
        attr.toLowerCase().includes('stage') ||
        attr.toLowerCase().includes('pipeline') ||
        attr.toLowerCase().includes('status')
      );

      if (stageAttrs.length > 0) {
        console.log(`  Stage attributes:`, stageAttrs.join(', '));
        for (const attr of stageAttrs) {
          const val = values[attr]?.[0]?.value;
          if (val) {
            console.log(`    ${attr}: ${JSON.stringify(val).slice(0, 50)}`);
          }
        }
      }

      console.log('');
    }

    console.log('✅ Test completed!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testCompanies();
