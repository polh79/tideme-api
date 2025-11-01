import * as fs from 'fs';
import * as path from 'path';
import { scrapeMareeInfoCalendar, saveScrapedData } from './scrapeMareeInfo';

/**
 * Récupère le coefficient SHOM du jour depuis les JSON statiques
 * Si le fichier mensuel n'existe pas, déclenche le scraping automatique de maree.info
 */
export async function getTodayCoefficient(): Promise<{
  current: number;
  morning: number;
  afternoon: number;
  phase: 'rising' | 'falling';
  period: 'morning' | 'afternoon';
} | null> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const monthStr = month.toString().padStart(2, '0');
  const dayStr = day.toString().padStart(2, '0');

  // Charger les données du mois
  const monthData = await loadMonthData(year, month);

  if (!monthData) {
    console.warn(`[COEFF-READER] ⚠️ No data found for ${year}-${monthStr}`);
    return null;
  }

  const todayCoef = monthData[dayStr];

  if (!todayCoef) {
    console.warn(`[COEFF-READER] ⚠️ No coefficient for ${year}-${monthStr}-${dayStr}`);
    return null;
  }

  // Déterminer si on est matin ou après-midi (avant ou après 12h)
  const currentHour = now.getHours();
  const currentPeriod = currentHour < 12 ? 'morning' : 'afternoon';
  const currentCoefficient = currentPeriod === 'morning' ? todayCoef.morning : todayCoef.afternoon;

  // Calculer la phase en comparant matin vs après-midi
  const phase = todayCoef.afternoon > todayCoef.morning ? 'rising' : 'falling';

  return {
    current: currentCoefficient,
    morning: todayCoef.morning,
    afternoon: todayCoef.afternoon,
    phase,
    period: currentPeriod,
  };
}

/**
 * Charge les données d'un mois depuis le fichier JSON
 * Si le fichier n'existe pas, déclenche le scraping automatique
 */
async function loadMonthData(
  year: number,
  month: number
): Promise<Record<string, { morning: number; afternoon: number }> | null> {
  const monthStr = month.toString().padStart(2, '0');
  const filePath = path.join(process.cwd(), 'data', 'coefficients', year.toString(), `${monthStr}.json`);

  // Si le fichier existe, le lire
  if (fs.existsSync(filePath)) {
    console.log(`[COEFF-READER] ✅ Loading from ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  // Fichier manquant → déclencher scraping automatique
  console.log(`[COEFF-READER] ⚠️ File not found: ${filePath}`);
  console.log(`[COEFF-READER] 🌐 Triggering auto-scraping from maree.info...`);

  try {
    // Scraper maree.info (récupère ~4 mois)
    const scrapedData = await scrapeMareeInfoCalendar();

    if (Object.keys(scrapedData).length === 0) {
      console.error('[COEFF-READER] ❌ Scraping returned no data');
      return null;
    }

    // Sauvegarder tous les mois scrapés
    await saveScrapedData(scrapedData);

    // Retourner le mois demandé
    const monthKey = `${year}-${monthStr}`;
    const monthData = scrapedData[monthKey];

    if (!monthData) {
      console.error(`[COEFF-READER] ❌ Month ${monthKey} not found in scraped data`);
      return null;
    }

    console.log(`[COEFF-READER] ✅ Scraping successful! Loaded ${Object.keys(monthData).length} days for ${monthKey}`);
    return monthData;
  } catch (error: any) {
    console.error('[COEFF-READER] ❌ Scraping failed:', error.message);
    return null;
  }
}
