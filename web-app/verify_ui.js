const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://stoned-rabbits-game.web.app/');
  
  // Wait for page load
  await page.waitForTimeout(5000); // 5 seconds

  // Screenshot the whole page
  await page.screenshot({ path: 'local_verify_ui.png' });
  console.log('Screenshot saved to local_verify_ui.png');

  await browser.close();
})();
