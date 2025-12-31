/**
 * Check Deal object configuration and attributes
 */

import 'dotenv/config';

async function checkDealAttributes() {
  console.log('🔍 Checking Deal Object Configuration...\n');

  if (!process.env.ATTIO_API_KEY) {
    console.error('❌ ATTIO_API_KEY not found');
    process.exit(1);
  }

  const baseUrl = 'https://api.attio.com/v2';
  const apiKey = process.env.ATTIO_API_KEY;

  try {
    // Get deal object configuration
    console.log('📡 Getting Deal object configuration...');
    const response = await fetch(`${baseUrl}/objects/deals`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed: ${response.status}`);
      console.error(error);

      if (response.status === 404) {
        console.log('\n⚠️  Deal object not found or disabled!');
        console.log('To fix: Go to Attio Settings → Objects → Enable "Deals"');
      }
      process.exit(1);
    }

    const dealObject = await response.json();
    console.log('✅ Deal object found!\n');
    console.log('Object Info:');
    console.log(`  API Slug: ${dealObject.api_slug}`);
    console.log(`  Singular: ${dealObject.singular_noun}`);
    console.log(`  Plural: ${dealObject.plural_noun}`);
    console.log(`  Created: ${dealObject.created_at}`);

    // Get attributes
    console.log('\n📡 Getting Deal attributes...');
    const attrsResponse = await fetch(`${baseUrl}/objects/deals/attributes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (attrsResponse.ok) {
      const attrsData = await attrsResponse.json();
      const attributes = attrsData.data || [];

      console.log(`✅ Found ${attributes.length} attributes:\n`);

      for (const attr of attributes) {
        console.log(`  • ${attr.title || attr.api_slug}`);
        console.log(`    Slug: ${attr.api_slug}`);
        console.log(`    Type: ${attr.type}`);

        // Show options for select/status attributes (like stage)
        if (attr.config?.options && Array.isArray(attr.config.options)) {
          console.log(`    Options: ${attr.config.options.map((o: any) => o.title || o.value).join(', ')}`);
        }
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDealAttributes();
