import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--use-gl=swiftshader"] });
const ROUTES = ["/","/book","/before-relationship","/building-relationship","/inside-relationship","/after-breakup","/starting-again"];
let fails = 0;
console.log("route                      w     rm   h1 ovf err stuck anims");
for (const route of ROUTES) for (const w of [1440,1024,768,390]) for (const rm of ["no-preference","reduce"]) {
  const c = await b.newContext({ viewport:{width:w,height:900}, reducedMotion:rm });
  const p = await c.newPage();
  const errs=[];
  p.on("console",m=>{if(m.type()==="error")errs.push(m.text().slice(0,70));});
  p.on("pageerror",e=>errs.push("PE "+String(e).slice(0,70)));
  await p.addInitScript(()=>{try{localStorage["cookie-consent"]=JSON.stringify({necessary:true,ts:Date.now()});}catch{}});
  const res = await p.goto("http://localhost:4400"+route,{waitUntil:"domcontentloaded"});
  await p.waitForTimeout(1400);
  const worst = await p.evaluate(async () => {
    const stuckNow=()=>{const vh=innerHeight,vw=innerWidth;
      return [...document.querySelectorAll(".reveal,.build-focus,.journey-page,.path-recognition,.close-resolve,.situation-card,.thesis-noise")]
      .filter(e=>{const r=e.getBoundingClientRect();
        return r.bottom>8&&r.top<vh-8&&r.right>0&&r.left<vw&&r.width>0&&r.height>0&&+getComputedStyle(e).opacity<0.05;}).length;};
    const H=document.body.scrollHeight,ys=[];
    for(let y=0;y<H;y+=700)ys.push(y);
    for(let i=ys.length-1;i>=0;i--)ys.push(ys[i]);
    let worst=0;
    for(const y of ys){scrollTo({top:y,behavior:"auto"});
      await new Promise(r=>setTimeout(r,620));
      const fin=document.getAnimations().filter(a=>a.playState==="running"&&a.effect?.getTiming?.().iterations!==Infinity).map(a=>a.finished.catch(()=>{}));
      await Promise.race([Promise.all(fin),new Promise(r=>setTimeout(r,1100))]);
      worst=Math.max(worst,stuckNow());}
    scrollTo({top:0,behavior:"auto"});return worst;});
  await p.waitForTimeout(600);
  const r = await p.evaluate(()=>({h1:document.querySelectorAll("h1").length,
    ovf:document.documentElement.scrollWidth>document.documentElement.clientWidth+1?document.documentElement.scrollWidth-document.documentElement.clientWidth:0,
    anims:document.getAnimations().filter(a=>a.playState==="running").length}));
  const bad = res.status()!==200||r.h1!==1||r.ovf>0||errs.length>0||worst>0||(rm==="reduce"&&r.anims>0);
  if(bad)fails++;
  console.log(`${route.padEnd(26)} ${String(w).padEnd(5)} ${rm==="reduce"?"red ":"norm"} ${String(r.h1).padEnd(2)} ${String(r.ovf).padEnd(3)} ${String(errs.length).padEnd(3)} ${String(worst).padEnd(5)} ${String(r.anims).padEnd(5)} ${bad?"<<<FAIL "+errs.slice(0,1):""}`);
  await c.close();
}
console.log("\nBATCH1 FAILING CELLS:",fails,"/",ROUTES.length*4*2);
await b.close();
