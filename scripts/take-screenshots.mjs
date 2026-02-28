#!/usr/bin/env node

/**
 * Google Play Store Screenshot Generator
 *
 * Takes screenshots of all app pages at phone dimensions (1080x1920).
 * Injects realistic sample data so pages look vibrant (not empty).
 * Requires the dev server to be running on localhost:3000.
 *
 * Usage:
 *   1. Start the dev server: npm run dev
 *   2. In another terminal: node scripts/take-screenshots.mjs
 *
 * Also captures the feature graphic at 1024x500.
 */

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(__dirname, '..', 'public', 'store', 'screenshots');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Phone viewport (matches a modern phone like Pixel 7)
const PHONE_VIEWPORT = {
  width: 412,
  height: 915,
};
const DEVICE_SCALE_FACTOR = 2.625; // Results in ~1080x2402 screenshots

// -------------------------------------------------------------------
// Sample data to make screenshots look rich and vibrant
// -------------------------------------------------------------------

const SAMPLE_PRAYERS = [
  {
    id: 'ss01prayer',
    title: 'Healing for Mom',
    description: 'Praying for complete healing and recovery. Lord, restore her strength and health.',
    date: '2026-02-25T08:30:00.000Z',
    category: 'Healing',
    isAnswered: false,
    createdAt: '2026-02-25T08:30:00.000Z',
  },
  {
    id: 'ss02prayer',
    title: 'Guidance for New Job',
    description: 'Lord, open the right doors and give me wisdom to make the right decision about this career change.',
    date: '2026-02-24T07:15:00.000Z',
    category: 'Guidance',
    isAnswered: false,
    createdAt: '2026-02-24T07:15:00.000Z',
  },
  {
    id: 'ss03prayer',
    title: "Sarah's Family",
    description: 'Praying for peace and unity in their home. Let Your love bind them together.',
    date: '2026-02-23T19:00:00.000Z',
    category: 'Intercession',
    isAnswered: false,
    createdAt: '2026-02-23T19:00:00.000Z',
  },
  {
    id: 'ss04prayer',
    title: 'Thankful for His Provision',
    description: 'God has been so faithful in providing for every need. Thank you, Lord.',
    date: '2026-02-22T06:45:00.000Z',
    category: 'Gratitude',
    isAnswered: false,
    createdAt: '2026-02-22T06:45:00.000Z',
  },
  {
    id: 'ss05prayer',
    title: 'Strength to Forgive',
    description: 'Help me release this hurt and walk in forgiveness, as You have forgiven me.',
    date: '2026-02-21T20:30:00.000Z',
    category: 'Confession',
    isAnswered: false,
    createdAt: '2026-02-21T20:30:00.000Z',
  },
  {
    id: 'ss06prayer',
    title: 'Worship in Spirit and Truth',
    description: 'Lord, teach me to worship You with all my heart, in spirit and in truth.',
    date: '2026-02-20T09:00:00.000Z',
    category: 'Praise',
    isAnswered: true,
    answeredDate: '2026-02-27T11:00:00.000Z',
    testimonyNotes: 'God opened my eyes to worship Him in the everyday moments. What a beautiful revelation!',
    createdAt: '2026-02-20T09:00:00.000Z',
  },
  {
    id: 'ss07prayer',
    title: 'Provision for Rent',
    description: 'Trusting God for financial provision this month.',
    date: '2026-02-18T14:00:00.000Z',
    category: 'Petition',
    isAnswered: true,
    answeredDate: '2026-02-26T09:30:00.000Z',
    testimonyNotes: 'An unexpected gift came through! God is always on time.',
    createdAt: '2026-02-18T14:00:00.000Z',
  },
];

const SAMPLE_MEMORY_VERSES = [
  {
    id: 'ss01mem',
    reference: 'John 3:16',
    text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
    mastery: 'Memorized',
    lastReviewed: '2026-02-28T09:00:00.000Z',
    addedDate: '2026-01-15T10:30:00.000Z',
    practiceCount: 24,
    interval: 32,
    easeFactor: 2.8,
  },
  {
    id: 'ss02mem',
    reference: 'Philippians 4:13',
    text: 'I can do all this through him who gives me strength.',
    mastery: 'Memorized',
    lastReviewed: '2026-02-27T08:15:00.000Z',
    addedDate: '2026-01-20T14:00:00.000Z',
    practiceCount: 18,
    interval: 21,
    easeFactor: 2.7,
  },
  {
    id: 'ss03mem',
    reference: 'Psalm 23:1-3',
    text: 'The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul.',
    mastery: 'Familiar',
    lastReviewed: '2026-02-27T14:15:00.000Z',
    addedDate: '2026-02-05T08:45:00.000Z',
    practiceCount: 9,
    interval: 6,
    easeFactor: 2.5,
  },
  {
    id: 'ss04mem',
    reference: 'Romans 8:28',
    text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.',
    mastery: 'Familiar',
    lastReviewed: '2026-02-26T10:00:00.000Z',
    addedDate: '2026-02-10T11:30:00.000Z',
    practiceCount: 7,
    interval: 4,
    easeFactor: 2.4,
  },
  {
    id: 'ss05mem',
    reference: 'Jeremiah 29:11',
    text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.',
    mastery: 'Learning',
    lastReviewed: '2026-02-28T07:30:00.000Z',
    addedDate: '2026-02-22T09:00:00.000Z',
    practiceCount: 3,
    interval: 1,
    easeFactor: 2.5,
  },
  {
    id: 'ss06mem',
    reference: 'Isaiah 41:10',
    text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you.',
    mastery: 'Learning',
    lastReviewed: '2026-02-27T19:00:00.000Z',
    addedDate: '2026-02-25T16:00:00.000Z',
    practiceCount: 2,
    interval: 1,
    easeFactor: 2.5,
  },
];

const SAMPLE_GRATITUDE = [
  {
    id: 'ss01grat',
    text: 'Grateful for a beautiful sunrise this morning — a reminder of His new mercies every day.',
    scriptureReference: 'Lamentations 3:22-23',
    date: '2026-02-28T07:15:00.000Z',
    category: 'Gratitude',
  },
  {
    id: 'ss02grat',
    text: 'Praising God for the gift of friendship. True friends are a treasure.',
    date: '2026-02-27T18:30:00.000Z',
    category: 'Praise',
  },
  {
    id: 'ss03grat',
    text: 'In awe of God\'s creation during my evening walk. The stars declare His glory!',
    scriptureReference: 'Psalm 19:1',
    date: '2026-02-27T20:45:00.000Z',
    category: 'Worship',
  },
  {
    id: 'ss04grat',
    text: 'My daughter said "I love you" for the first time today. What a gift from God.',
    date: '2026-02-26T19:00:00.000Z',
    category: 'Gratitude',
  },
  {
    id: 'ss05grat',
    text: 'God opened a door I thought was closed forever. His timing is perfect!',
    scriptureReference: 'Revelation 3:8',
    date: '2026-02-26T10:30:00.000Z',
    category: 'Praise',
  },
  {
    id: 'ss06grat',
    text: 'Worshipping through tears today. Even in the valley, He is good.',
    scriptureReference: 'Psalm 34:18',
    date: '2026-02-25T21:00:00.000Z',
    category: 'Worship',
  },
  {
    id: 'ss07grat',
    text: 'So thankful for this quiet morning with coffee and His Word. Peace that passes understanding.',
    scriptureReference: 'Philippians 4:7',
    date: '2026-02-25T06:30:00.000Z',
    category: 'Gratitude',
  },
  {
    id: 'ss08grat',
    text: 'A stranger\'s kindness today reminded me of God\'s love through people.',
    date: '2026-02-24T14:00:00.000Z',
    category: 'Gratitude',
  },
  {
    id: 'ss09grat',
    text: 'Praise the Lord for answered prayer! He is faithful in all things.',
    scriptureReference: '1 Thessalonians 5:18',
    date: '2026-02-24T09:00:00.000Z',
    category: 'Praise',
  },
];

// Generate 12 weeks of growth check-ins for beautiful charts
const SAMPLE_CHECKINS = [];
for (let i = 11; i >= 0; i--) {
  const weekDate = new Date('2026-02-28T12:00:00.000Z');
  weekDate.setDate(weekDate.getDate() - i * 7);
  const weekNum = Math.ceil(
    (weekDate - new Date(weekDate.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)
  );

  // Create a gradual upward growth trend with realistic variation
  const base = 3 + (11 - i) * 0.2; // Slight upward trend
  const jitter = () => Math.round(Math.min(10, Math.max(1, base + (Math.random() - 0.4) * 3)));

  SAMPLE_CHECKINS.push({
    id: `ss${String(i).padStart(2, '0')}chk`,
    date: weekDate.toISOString(),
    weekNumber: weekNum,
    year: weekDate.getFullYear(),
    ratings: {
      prayerLife: jitter(),
      scriptureReading: jitter(),
      worship: jitter(),
      service: jitter(),
      fellowship: jitter(),
    },
  });
}

// Reading plan progress (start the "Gospels in 30 Days" plan with progress)
const SAMPLE_READING_PROGRESS = [
  {
    planId: 'gospels-30-days',
    startDate: '2026-02-10T08:00:00.000Z',
    completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    currentDay: 19,
  },
];

// Prayer & memory streak dates (last 12 days)
const STREAK_DATES = [];
for (let i = 11; i >= 0; i--) {
  const d = new Date('2026-02-28T08:00:00.000Z');
  d.setDate(d.getDate() - i);
  STREAK_DATES.push(d.toISOString());
}

// Reading streak dates (last 18 days)
const READING_DATES = [];
for (let i = 17; i >= 0; i--) {
  const d = new Date('2026-02-28T08:00:00.000Z');
  d.setDate(d.getDate() - i);
  READING_DATES.push(d.toISOString());
}

// -------------------------------------------------------------------
// Screenshot configuration
// -------------------------------------------------------------------

const screenshotPages = [
  {
    name: '01-devotional',
    path: '/devotional',
    title: 'Daily Devotional',
    waitFor: 2000,
  },
  {
    name: '02-prayer',
    path: '/prayer',
    title: 'Prayer Journal',
    waitFor: 2000,
  },
  {
    name: '03-reading',
    path: '/reading',
    title: 'Bible Reading Plans',
    waitFor: 2000,
  },
  {
    name: '04-memory',
    path: '/memory',
    title: 'Scripture Memory',
    waitFor: 2000,
  },
  {
    name: '05-gratitude',
    path: '/gratitude',
    title: 'Gratitude Wall',
    waitFor: 2000,
  },
  {
    name: '06-growth',
    path: '/growth',
    title: 'Growth Tracker',
    waitFor: 2500,
  },
];

async function seedData(page) {
  await page.evaluate(
    ({ prayers, verses, gratitude, checkins, readingProgress, streakDates, readingDates }) => {
      localStorage.setItem('dw-prayers', JSON.stringify(prayers));
      localStorage.setItem('dw-memory-verses', JSON.stringify(verses));
      localStorage.setItem('dw-gratitude', JSON.stringify(gratitude));
      localStorage.setItem('dw-weekly-checkins', JSON.stringify(checkins));
      localStorage.setItem('dw-reading-progress', JSON.stringify(readingProgress));
      localStorage.setItem('dw-prayer-dates', JSON.stringify(streakDates));
      localStorage.setItem('dw-memory-practice-dates', JSON.stringify(streakDates));
      localStorage.setItem('dw-reading-dates', JSON.stringify(readingDates));
      localStorage.setItem(
        'dw-settings',
        JSON.stringify({ darkMode: false, fontSize: 'medium', hasVisitedBefore: true })
      );
      // Dismiss install prompt so it doesn't appear in screenshots
      localStorage.setItem('install-prompt-dismissed', 'true');
    },
    {
      prayers: SAMPLE_PRAYERS,
      verses: SAMPLE_MEMORY_VERSES,
      gratitude: SAMPLE_GRATITUDE,
      checkins: SAMPLE_CHECKINS,
      readingProgress: SAMPLE_READING_PROGRESS,
      streakDates: STREAK_DATES,
      readingDates: READING_DATES,
    }
  );
}

async function main() {
  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log('📸 Daily Walk — Store Screenshot Generator\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output:   ${outputDir}\n`);

  // Check if dev server is running
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  } catch {
    console.error('❌ Dev server not running! Start it with: npm run dev');
    process.exit(1);
  }

  // Try to find chrome executable
  let executablePath;
  const chromePaths = [
    '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
    '/root/.cache/ms-playwright/chromium-1208/chrome-linux/chrome',
  ];
  for (const p of chromePaths) {
    if (existsSync(p)) {
      executablePath = p;
      break;
    }
  }

  const launchOptions = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  if (executablePath) launchOptions.executablePath = executablePath;

  const browser = await chromium.launch(launchOptions);

  // --- Phone Screenshots ---
  console.log('📱 Taking phone screenshots...\n');

  const phoneContext = await browser.newContext({
    viewport: PHONE_VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  });

  // Seed data on a static page (no React app = no beforeunload flush)
  console.log('  🌱 Seeding sample data...');
  const seedPage = await phoneContext.newPage();
  // Navigate to a static HTML page so the React app doesn't run
  // (avoids beforeunload flush overwriting our seed data with empty state)
  await seedPage.goto(`${BASE_URL}/store/feature-graphic.html`, { waitUntil: 'networkidle' });
  await seedData(seedPage);
  console.log('  ✅ Sample data seeded\n');
  // Keep seed page open to prevent any cleanup issues

  for (const pageInfo of screenshotPages) {
    const page = await phoneContext.newPage();
    const url = `${BASE_URL}${pageInfo.path}`;

    console.log(`  📄 ${pageInfo.title} (${pageInfo.path})`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(pageInfo.waitFor);

    // Hide any install prompts or modals
    await page.evaluate(() => {
      // Hide install prompts
      const prompts = document.querySelectorAll('[role="dialog"], [data-install-prompt]');
      prompts.forEach((el) => (el.style.display = 'none'));

      // Hide any fixed/sticky banners that might overlay content
      document.querySelectorAll('[class*="install"], [class*="Install"]').forEach((el) => {
        if (el.style) el.style.display = 'none';
      });
    });

    const filePath = resolve(outputDir, `${pageInfo.name}.png`);
    await page.screenshot({
      path: filePath,
      type: 'png',
      fullPage: false,
    });

    console.log(`     ✅ Saved: screenshots/${pageInfo.name}.png`);
    await page.close();
  }

  await seedPage.close();

  await phoneContext.close();

  // --- Feature Graphic ---
  console.log('\n🖼️  Taking feature graphic...\n');

  const fgContext = await browser.newContext({
    viewport: { width: 1024, height: 500 },
    deviceScaleFactor: 1,
  });

  const fgPage = await fgContext.newPage();
  await fgPage.goto(`${BASE_URL}/store/feature-graphic.html`, {
    waitUntil: 'networkidle',
  });
  await fgPage.waitForTimeout(1000);

  const fgPath = resolve(outputDir, 'feature-graphic.png');
  await fgPage.screenshot({
    path: fgPath,
    type: 'png',
  });
  console.log(`  ✅ Saved: screenshots/feature-graphic.png`);

  await fgContext.close();
  await browser.close();

  console.log('\n🎉 All screenshots saved to public/store/screenshots/');
  console.log('\nGoogle Play Store requirements:');
  console.log('  • Phone screenshots: Upload 01-06 PNG files');
  console.log('  • Feature graphic:   Upload feature-graphic.png (1024x500)');
  console.log('  • App icon:          Use the 512x512 icon from PWABuilder package\n');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
