import * as fs from 'fs';
import * as path from 'path';

/**
 * Scrape https://maree.info/82/calendrier pour obtenir les coefficients SHOM
 * La page affiche 4 mois de coefficients sous forme de tableau HTML
 *
 * Format attendu: jour + saint + coeff_matin + coeff_après-midi
 * Exemple: "01 S Toussaint ... 44 52"
 */

interface MonthData {
  [day: string]: {
    morning: number;
    afternoon: number;
  };
}

/**
 * Parse le HTML de maree.info/82/calendrier
 * Extrait les coefficients pour ~4 mois visibles
 */
export async function scrapeMareeInfoCalendar(): Promise<{
  [monthKey: string]: MonthData; // Format: "2026-07" → { "01": {morning: 44, afternoon: 52}, ... }
}> {
  console.log('[SCRAPER] 🌐 Fetching https://maree.info/82/calendrier...');

  try {
    const response = await fetch('https://maree.info/82/calendrier');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log('[SCRAPER] ✅ HTML fetched successfully');

    return parseCalendarHTML(html);
  } catch (error: any) {
    console.error('[SCRAPER] ❌ Error fetching calendar:', error.message);
    throw error;
  }
}

/**
 * Parse le HTML et extrait les coefficients par mois
 */
function parseCalendarHTML(html: string): { [monthKey: string]: MonthData } {
  const result: { [monthKey: string]: MonthData } = {};

  // Regex pour capturer les lignes du calendrier
  // Format: "01 S Toussaint ... 44 52" ou "15 M Rosa ... 51 55"
  // On cherche: jour (2 digits) + texte + 2 nombres (coefficients)
  const lineRegex = /(\d{2})\s+[DLMJVS]\s+.*?(\d{2,3})\s+(\d{2,3})/g;

  // Regex pour détecter les titres de mois
  // Format: "Novembre 2025" ou "Février 2026"
  const monthRegex = /(Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+(\d{4})/gi;

  const monthNames: { [key: string]: string } = {
    janvier: '01',
    février: '02',
    mars: '03',
    avril: '04',
    mai: '05',
    juin: '06',
    juillet: '07',
    août: '08',
    septembre: '09',
    octobre: '10',
    novembre: '11',
    décembre: '12',
  };

  // Diviser le HTML par mois
  const sections = html.split(/<h[23]|<div class="calendrier"/i);
  let currentMonth: string | null = null;
  let currentYear: string | null = null;

  for (const section of sections) {
    // Détecter le mois/année
    const monthMatch = monthRegex.exec(section);
    if (monthMatch) {
      const monthName = monthMatch[1].toLowerCase();
      currentYear = monthMatch[2];
      currentMonth = monthNames[monthName];

      if (currentMonth && currentYear) {
        const monthKey = `${currentYear}-${currentMonth}`;
        if (!result[monthKey]) {
          result[monthKey] = {};
        }
      }
    }

    // Extraire les coefficients
    if (currentMonth && currentYear) {
      const monthKey = `${currentYear}-${currentMonth}`;

      let match;
      while ((match = lineRegex.exec(section)) !== null) {
        const day = match[1];
        const morning = parseInt(match[2], 10);
        const afternoon = parseInt(match[3], 10);

        result[monthKey][day] = { morning, afternoon };
      }
    }
  }

  console.log(`[SCRAPER] ✅ Extracted ${Object.keys(result).length} months:`, Object.keys(result));

  return result;
}

/**
 * Sauvegarde les données scrapées dans les fichiers JSON mensuels
 */
export async function saveScrapedData(data: { [monthKey: string]: MonthData }): Promise<void> {
  const baseDir = path.join(process.cwd(), 'data', 'coefficients');

  for (const [monthKey, monthData] of Object.entries(data)) {
    const [year, month] = monthKey.split('-');
    const yearDir = path.join(baseDir, year);
    const filePath = path.join(yearDir, `${month}.json`);

    // Créer le dossier année si nécessaire
    if (!fs.existsSync(yearDir)) {
      fs.mkdirSync(yearDir, { recursive: true });
      console.log(`[SCRAPER] 📁 Created directory: ${yearDir}`);
    }

    // Écrire le fichier JSON
    fs.writeFileSync(filePath, JSON.stringify(monthData, null, 2));
    console.log(`[SCRAPER] 💾 Saved ${Object.keys(monthData).length} days to ${filePath}`);
  }
}
