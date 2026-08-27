import { chromium } from 'playwright';
const OUT='/tmp/claude-0/-home-user-zachi/3b5e350f-0bdc-5d09-a5d3-c65736d6a12e/scratchpad';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function ctx(w,h,mobile=false,reduced=false){
  const c = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:mobile?2:1.4, isMobile:mobile, hasTouch:mobile, reducedMotion: reduced?'reduce':'no-preference' });
  await c.addInitScript(()=>{ try{ localStorage['cookie-consent']=JSON.stringify({necessary:true,analytics:true,marketing:true}); }catch(e){} });
  return c;
}
async function ready(p){ // ensure CSS applied + motion-js armed
  await p.waitForFunction(()=> document.documentElement.classList.contains('motion-js') && getComputedStyle(document.querySelector('.sig-hero')).backgroundColor !== 'rgba(0, 0, 0, 0)', {timeout:8000}).catch(()=>{});
}
const D='D';
// book flip — key off motion-js arm, riffle starts +2500ms
{
  const c = await ctx(1440,900); const p = await c.newPage();
  await p.goto('http://localhost:3200/', { waitUntil:'networkidle' }); await ready(p);
  const t0=Date.now();
  const at=async(ms,name)=>{ const w=ms-(Date.now()-t0); if(w>0) await p.waitForTimeout(w); await p.screenshot({path:`${OUT}/${D}-${name}.png`}); };
  await at(2300,'08-book-closed');
  await at(2950,'09-book-midflip');
  await at(3550,'10-book-endflip');
  await c.close();
}
// recog transition + mid
{
  const c = await ctx(1440,900); const p = await c.newPage();
  await p.goto('http://localhost:3200/', { waitUntil:'networkidle' }); await ready(p);
  await p.evaluate(()=>{ const el=document.querySelector("[aria-labelledby='recognition-heading']"); const y=el.getBoundingClientRect().top+window.scrollY-260; window.scrollTo(0,y); });
  await p.waitForTimeout(200); await p.screenshot({path:`${OUT}/${D}-01-hero-recog-transition.png`});
  await p.waitForTimeout(450); await p.screenshot({path:`${OUT}/${D}-02-recog-midmotion.png`});
  await c.close();
}
// path before + mid
{
  const c = await ctx(1440,900); const p = await c.newPage();
  await p.goto('http://localhost:3200/', { waitUntil:'networkidle' }); await ready(p);
  await p.evaluate(()=>{ const el=document.querySelector('#path'); const y=el.getBoundingClientRect().top+window.scrollY-140; window.scrollTo(0,y); });
  await p.waitForTimeout(60); await p.screenshot({path:`${OUT}/${D}-03-path-before.png`});
  await p.waitForTimeout(300); await p.screenshot({path:`${OUT}/${D}-04-path-midawaken.png`});
  await c.close();
}
// point->path mid + final
{
  const c = await ctx(1440,900); const p = await c.newPage();
  await p.goto('http://localhost:3200/', { waitUntil:'networkidle' }); await ready(p);
  await p.evaluate(()=>{ const el=document.querySelector("[aria-labelledby='why-book-heading']"); const y=el.getBoundingClientRect().top+window.scrollY-120; window.scrollTo(0,y); });
  await p.waitForTimeout(480); await p.screenshot({path:`${OUT}/${D}-07-point-to-path-mid.png`});
  await p.waitForTimeout(900); await p.screenshot({path:`${OUT}/${D}-06b-point-to-path-final.png`});
  await c.close();
}
// selection -> focus mode
{
  const c = await ctx(1440,900); const p = await c.newPage();
  await p.goto('http://localhost:3200/', { waitUntil:'networkidle' }); await ready(p);
  await p.evaluate(()=>{ const el=document.querySelector('#path'); const y=el.getBoundingClientRect().top+window.scrollY-100; window.scrollTo(0,y); });
  await p.waitForTimeout(500);
  await p.locator('#path a.situation-card[href="/building-relationship"]').click();
  await p.waitForTimeout(1500); await p.screenshot({path:`${OUT}/${D}-05-selection-focusmode.png`});
  await c.close();
}
// final CTA opening + final
{
  const c = await ctx(1440,900); const p = await c.newPage();
  await p.goto('http://localhost:3200/', { waitUntil:'networkidle' }); await ready(p);
  await p.evaluate(()=>{ const el=document.querySelector('#get-the-book'); const y=el.getBoundingClientRect().top+window.scrollY-40; window.scrollTo(0,y); });
  await p.waitForTimeout(120); await p.screenshot({path:`${OUT}/${D}-13-finalcta-opening.png`});
  await p.waitForTimeout(1600); await p.screenshot({path:`${OUT}/${D}-14-finalcta-final.png`});
  await c.close();
}
// preview
{
  const c = await ctx(1440,900); const p = await c.newPage();
  await p.goto('http://localhost:3200/preview', { waitUntil:'networkidle' });
  await p.waitForTimeout(600); await p.screenshot({path:`${OUT}/${D}-11-preview.png`});
  await c.close();
}
// mobile mid-flip
{
  const c = await ctx(390,844,true); const p = await c.newPage();
  await p.goto('http://localhost:3200/', { waitUntil:'networkidle' }); await ready(p);
  await p.waitForTimeout(2950); await p.screenshot({path:`${OUT}/${D}-12-mobile-midflip.png`});
  await c.close();
}
// reduced motion
{
  const c = await ctx(1440,900,false,true); const p = await c.newPage();
  await p.goto('http://localhost:3200/', { waitUntil:'networkidle' });
  await p.waitForTimeout(800); await p.screenshot({path:`${OUT}/${D}-15-reduced-motion.png`});
  await c.close();
}
console.log('recaptured');
await b.close();
