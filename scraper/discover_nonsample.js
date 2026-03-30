const puppeteer = require('puppeteer');
const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage();

  // Intercept responses to find video embed URLs
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('video') || url.includes('embed')) {
      console.log(`  [NETWORK] ${response.status()} ${url}`);
    }
  });

  console.log('Navigating...');
  await page.goto('https://www.medbridge.com/care/exercises', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Get all cards and check which are sample vs not
  const cardInfo = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card--sample'));
    return cards.map((card, i) => ({
      index: i,
      title: card.querySelector('.card__title')?.textContent?.trim(),
      category: card.querySelector('.card__categories')?.textContent?.trim(),
      // Check if it has any data attributes
      dataAttrs: Object.keys(card.dataset || {}),
      classes: card.className,
      outerHtml: card.outerHTML.substring(0, 300)
    }));
  });

  console.log(`\nFound ${cardInfo.length} cards on page`);
  for (const c of cardInfo) {
    console.log(`  [${c.index}] ${c.title} — ${c.category}`);
  }

  // The Algolia data shows first card "Seated Reaching for Cones" has a token (sample=true)
  // Let's check if there are cards WITHOUT tokens by scrolling or navigating to a page
  // where non-sample exercises appear

  // Navigate to a category like "Orthopedics" which has many non-sample exercises
  console.log('\n=== Clicking on Orthopedics category ===');
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const ortho = links.find(a => a.textContent.trim() === 'Orthopedics');
    if (ortho) ortho.click();
  });
  await delay(2000);

  // Get the cards on this filtered page
  const orthoCards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card--sample, .card--hoverable'));
    return cards.map((card, i) => ({
      index: i,
      title: card.querySelector('.card__title')?.textContent?.trim(),
      category: card.querySelector('.card__categories')?.textContent?.trim(),
      classes: card.className
    }));
  });

  console.log(`Found ${orthoCards.length} orthopedics cards`);
  for (const c of orthoCards.slice(0, 5)) {
    console.log(`  [${c.index}] ${c.title} — ${c.category}`);
  }

  // Click on a non-sample exercise (one that likely doesn't have a token)
  // Try clicking the second card which might be non-sample
  console.log('\n=== Clicking card to see modal ===');
  const cards = await page.$$('.card--hoverable');
  if (cards.length > 1) {
    await cards[1].click();
    await delay(3000);

    // Get modal/popup content
    const popupContent = await page.evaluate(() => {
      const popup = document.querySelector('.mb-popup');
      if (!popup) return 'No popup found';

      const iframes = Array.from(popup.querySelectorAll('iframe'));
      const videos = Array.from(popup.querySelectorAll('video, source'));
      const allText = popup.innerText?.substring(0, 500);

      return {
        html: popup.outerHTML.substring(0, 2000),
        iframes: iframes.map(f => ({ src: f.src, class: f.className })),
        videos: videos.map(v => ({ tag: v.tagName, src: v.src })),
        text: allText,
        display: popup.style.display,
        classes: popup.className
      };
    });
    console.log(JSON.stringify(popupContent, null, 2));
  }

  // Also try: navigate to page 5 (where non-sample exercises would be) and click
  console.log('\n=== Going to page 5 of exercises ===');
  await page.goto('https://www.medbridge.com/care/exercises', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Click page 5
  await page.evaluate(() => {
    const pageLink = Array.from(document.querySelectorAll('.ais-Pagination-link'));
    const page5 = pageLink.find(a => a.textContent.trim() === '5');
    if (page5) page5.click();
  });
  await delay(3000);

  const page5Cards = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.card--hoverable'));
    return cards.map((card, i) => ({
      index: i,
      title: card.querySelector('.card__title')?.textContent?.trim(),
      classes: card.className
    }));
  });
  console.log(`Page 5 cards: ${page5Cards.length}`);
  for (const c of page5Cards.slice(0, 3)) {
    console.log(`  [${c.index}] ${c.title} — ${c.classes}`);
  }

  // Click first card on page 5
  if (page5Cards.length > 0) {
    console.log('\n=== Clicking first card on page 5 ===');
    const p5cards = await page.$$('.card--hoverable');
    if (p5cards[0]) {
      await p5cards[0].click();
      await delay(3000);

      const popupContent = await page.evaluate(() => {
        const popups = Array.from(document.querySelectorAll('.mb-popup'));
        return popups.map(popup => ({
          display: popup.style.display,
          classes: popup.className,
          iframes: Array.from(popup.querySelectorAll('iframe')).map(f => f.src),
          innerHtml: popup.innerHTML.substring(0, 1000),
        }));
      });
      console.log(JSON.stringify(popupContent, null, 2));
    }
  }

  await browser.close();
})();
