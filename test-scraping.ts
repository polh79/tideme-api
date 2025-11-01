/**
 * Script de test pour vérifier le système de scraping automatique
 * Usage: npx tsx test-scraping.ts
 */

import { scrapeMareeInfoCalendar, saveScrapedData } from './lib/scrapeMareeInfo';

async function testScraping() {
  console.log('='.repeat(60));
  console.log('🧪 TEST: Scraping maree.info/82/calendrier');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. Scraper la page
    console.log('📥 Step 1: Fetching and parsing HTML...');
    const scrapedData = await scrapeMareeInfoCalendar();

    if (Object.keys(scrapedData).length === 0) {
      console.error('❌ FAIL: No data scraped!');
      process.exit(1);
    }

    console.log(`✅ SUCCESS: Scraped ${Object.keys(scrapedData).length} months`);
    console.log('');

    // 2. Afficher un aperçu
    console.log('📊 Data Preview:');
    for (const [monthKey, monthData] of Object.entries(scrapedData)) {
      const daysCount = Object.keys(monthData).length;
      const firstDay = monthData['01'];
      console.log(`  ${monthKey}: ${daysCount} days (example: day 01 = ${firstDay?.morning}/${firstDay?.afternoon})`);
    }
    console.log('');

    // 3. Sauvegarder
    console.log('💾 Step 2: Saving to JSON files...');
    await saveScrapedData(scrapedData);

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ TEST FAILED:', error.message);
    console.error('='.repeat(60));
    console.error(error.stack);
    process.exit(1);
  }
}

testScraping();
