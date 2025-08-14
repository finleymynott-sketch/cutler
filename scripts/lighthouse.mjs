import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const url = process.env.LH_URL || 'http://127.0.0.1:5173/index.html';
const desktopBudgets = { FCP: 1500, LCP: 2500, CLS: 0.08, TBT: 200 };
const mobileBudgets = { FCP: 2500, LCP: 3500, CLS: 0.1, TBT: 300 };

async function run(mode) {
  const chrome = await launch({ chromeFlags: ['--headless=new'] });
  const opts = { logLevel: 'error', output: 'json', onlyCategories: ['performance'], port: chrome.port }; 
  const config = mode === 'mobile' ? { extends: 'lighthouse:default', settings: { formFactor: 'mobile', screenEmulation: { mobile: true } } } : undefined;
  const runnerResult = await lighthouse(url, opts, config);
  const lhr = runnerResult.lhr;
  const budgets = mode === 'mobile' ? mobileBudgets : desktopBudgets;
  const audits = lhr.audits;
  const FCP = audits['first-contentful-paint'].numericValue;
  const LCP = audits['largest-contentful-paint'].numericValue;
  const CLS = audits['cumulative-layout-shift'].numericValue;
  const TBT = audits['total-blocking-time'].numericValue;

  const fails = [];
  if (FCP > budgets.FCP) fails.push(`FCP ${FCP} > ${budgets.FCP}`);
  if (LCP > budgets.LCP) fails.push(`LCP ${LCP} > ${budgets.LCP}`);
  if (CLS > budgets.CLS) fails.push(`CLS ${CLS} > ${budgets.CLS}`);
  if (TBT > budgets.TBT) fails.push(`TBT ${TBT} > ${budgets.TBT}`);

  console.log(JSON.stringify({ mode, FCP, LCP, CLS, TBT }, null, 2));
  await chrome.kill();
  if (fails.length) {
    console.error('Performance budget failed:', fails.join('; '));
    process.exit(1);
  }
}

await run('desktop');
await run('mobile');


