import { NextRequest, NextResponse } from 'next/server';
import { scrapeMareeInfoCalendar, saveScrapedData } from '@/lib/scrapeMareeInfo';

/**
 * GET /api/cron/scrape-coefficients
 * CRON Vercel trimestriel : scrape proactif des coefficients SHOM
 *
 * Schedule: 1er de chaque trimestre à 03h00 UTC (jan, avril, juillet, octobre)
 * Fréquence: 4 fois/an
 *
 * Scrape https://maree.info/82/calendrier (~4 mois visibles)
 * Sauvegarde les JSON mensuels dans data/coefficients/YYYY/MM.json
 *
 * Avantages:
 * - Zéro gap: toujours 4 mois d'avance
 * - Redondance: 1 mois de chevauchement entre scrapes
 * - Respectueux: 4 scrapes/an = ultra léger
 */
export async function GET(request: NextRequest) {
  // Vérifier l'authentification (Vercel Cron Secret)
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedAuth) {
    console.warn('[CRON-SCRAPE] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON-SCRAPE] 🚀 Starting quarterly coefficient scraping...');
  const startTime = Date.now();

  try {
    // Scraper maree.info calendrier (~4 mois visibles)
    const scrapedData = await scrapeMareeInfoCalendar();

    if (Object.keys(scrapedData).length === 0) {
      console.error('[CRON-SCRAPE] ❌ No data scraped');
      return NextResponse.json({
        success: false,
        error: 'Scraping returned no data',
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }

    // Sauvegarder les JSON mensuels
    await saveScrapedData(scrapedData);

    const duration = Date.now() - startTime;
    const monthsScraped = Object.keys(scrapedData);
    const totalDays = Object.values(scrapedData).reduce((sum, month) => sum + Object.keys(month).length, 0);

    console.log(`[CRON-SCRAPE] ✅ Success! Scraped ${monthsScraped.length} months (${totalDays} days) in ${duration}ms`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      stats: {
        monthsScraped,
        totalDays,
        monthsDetail: Object.entries(scrapedData).map(([month, data]) => ({
          month,
          days: Object.keys(data).length,
        })),
      },
    });

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[CRON-SCRAPE] ❌ Error:', error.message);
    console.error(error.stack);

    return NextResponse.json({
      success: false,
      error: 'Scraping failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      duration,
    }, { status: 500 });
  }
}
