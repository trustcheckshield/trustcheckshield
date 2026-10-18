/* TrustCheck Shield - app logic. Translations live in index.html (window.TCS_ROWS). */
(function(){
"use strict";
/* If index.html does not match this file, missing elements are replaced by harmless stand-ins instead of crashing. */
const MISSING=[];
function ghost(){return new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive||k==="toString"||k==="valueOf"?()=>"":k==="then"?undefined:k==="length"?0:ghost(),set:()=>true,apply:()=>ghost()})}
const $=id=>document.getElementById(id)||(MISSING.indexOf(id)<0&&MISSING.push(id),ghost());
function reportMismatch(){
  const m=[];
  if(MISSING.length)m.push("index.html does not match script.js (missing: "+MISSING.slice(0,6).join(", ")+(MISSING.length>6?", ...":"")+"). Upload the matching index.html.");
  if(!ROWS.length)m.push("The translation data in index.html did not load, so only English works.");
  else if(!window.TCS_LANG2)m.push("lang.js did not load, so scan details stay in English.");
  if(!m.length)return;
  let d=document.getElementById("errbar");
  if(!d){d=document.createElement("div");d.id="errbar";d.style.cssText="position:fixed;left:8px;right:8px;top:8px;z-index:99;background:#b3261e;color:#fff;padding:10px 12px;border-radius:10px;font:13px/1.4 system-ui,sans-serif;word-break:break-word";d.onclick=function(){d.remove()};document.body.appendChild(d)}
  d.textContent="File check: "+m.join(" ")+" Tap to dismiss."}
const mk=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
const err=(id,m)=>{const e=$(id);e.textContent=m;e.hidden=false};
const toks=s=>s.split(/[^a-z0-9]+/).filter(Boolean);
const rate=(s,hi,med)=>s>=hi?"High":s>=med?"Medium":"Low";
let user=null,phone="",code="",lastFocus=null;
const store=(()=>{try{const t="__tcs";localStorage.setItem(t,"1");localStorage.removeItem(t);return localStorage}catch(e){const m={};return{getItem:k=>(k in m?m[k]:null),setItem:(k,v)=>{m[k]=String(v)},removeItem:k=>{delete m[k]}}}})();
const SK="tcs_session";
function hash(x){let h=5381;for(let i=0;i<x.length;i++)h=((h<<5)+h+x.charCodeAt(i))>>>0;return h.toString(36)}
function loadSession(){try{const u=JSON.parse(store.getItem(SK)||"null");return u&&u.id&&u.name&&Array.isArray(u.contact)?u:null}catch(e){return null}}
user=loadSession();

/* ===== history ===== */
const hkey=()=>user?"history_"+user.id:null;
function hist(){const k=hkey();if(!k)return[];try{const h=JSON.parse(store.getItem(k)||"[]");return Array.isArray(h)?h:[]}catch(e){return[]}}
function logScan(type,input,level){const k=hkey();if(!k)return;const h=hist();h.unshift({type:type,input:input.replace(/\s+/g," ").slice(0,60),level:level,t:Date.now()});try{store.setItem(k,JSON.stringify(h.slice(0,50)))}catch(e){}}

/* ===== auth ===== */
const panes=["p-opts","p-email","p-mob","p-otp"];
function pane(id,sub){panes.forEach(p=>$(p).hidden=p!==id);$("ms").textContent=sub||"Sign in to run checks and see your results.";
  ["emE","mbE","otE"].forEach(e=>$(e).hidden=true);
  const f={"p-email":"em","p-mob":"mb","p-otp":"ot"}[id];if(f){$(f).value="";setTimeout(()=>$(f).focus(),0)}}
function openModal(){lastFocus=document.activeElement;pane("p-opts");$("modal").hidden=false;setTimeout(()=>$("p-opts").querySelector("button").focus(),0)}
function closeModal(){$("modal").hidden=true;if(lastFocus&&lastFocus.focus)lastFocus.focus()}
function paint(){$("authBtn").textContent=user?"Logout":"Login";$("welcome").hidden=!user;if(user)$("welcome").textContent="Hi, "+user.name}
function login(u){user=u;try{store.setItem(SK,JSON.stringify(u))}catch(e){}paint();$("modal").hidden=true;if(!$("v-profile").hidden)drawProfile()}
function clearScreen(){["urlR","msgR","upiR","qrR"].forEach(i=>$(i).hidden=true);["url","msg","upi","qrTxt"].forEach(i=>$(i).value="");["urlE","msgE","upiE","qrE"].forEach(i=>$(i).hidden=true);steps(null);$("stepsSub").textContent="Check a link and these steps update to match it."}
function logout(){user=null;try{store.removeItem(SK)}catch(e){}paint();clearScreen();if(!$("v-history").hidden)view("profile");else if(!$("v-profile").hidden)drawProfile();openModal()}
function gate(){if(user)return true;openModal();return false}
document.querySelectorAll("[data-p]").forEach(b=>b.addEventListener("click",()=>{const p=b.dataset.p;pane.p=p;
  $("emL").textContent="Your "+p+" email ID";$("em").placeholder="name@"+p.toLowerCase()+".com";pane("p-email","Sign in with "+p)}));
$("mobBtn").addEventListener("click",()=>pane("p-mob","Mobile number sign-in"));
document.querySelectorAll("[data-back]").forEach(b=>b.addEventListener("click",()=>pane("p-opts")));
$("emGo").addEventListener("click",()=>{const v=$("em").value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))return err("emE","Enter a valid email ID, such as name@example.com.");
  const n=v.split("@")[0].replace(/[._\-+0-9]+/g," ").trim().split(" ")[0]||"User";
  login({id:v.toLowerCase(),name:n.charAt(0).toUpperCase()+n.slice(1),via:pane.p||"Email",contact:["Email ID",v]})});
$("mbGo").addEventListener("click",()=>{const v=$("mb").value.trim();
  if(!/^\d{10}$/.test(v))return err("mbE","Enter exactly 10 digits, with no spaces or country code.");
  phone=v;code=String(Math.floor(1000+Math.random()*9000));
  $("demo").textContent="Demo mode: no text message is sent. Your verification code is "+code+".";
  pane("p-otp","Code requested for the number ending in "+phone.slice(-4))});
$("otGo").addEventListener("click",()=>{const v=$("ot").value.trim();
  if(!/^\d{4}$/.test(v))return err("otE","Enter the 4-digit code.");
  if(v!==code)return err("otE","That code does not match. Check it and try again.");
  login({id:"mobile_"+hash(phone),name:"User",via:"Mobile number",contact:["Mobile number","Ending in "+phone.slice(-4)]})});
["em","mb","ot"].forEach(id=>$(id).addEventListener("keydown",e=>{if(e.key==="Enter")$({em:"emGo",mb:"mbGo",ot:"otGo"}[id]).click()}));
$("mx").addEventListener("click",closeModal);
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("modal").hidden)closeModal()});
$("authBtn").addEventListener("click",()=>user?logout():openModal());

/* ===== navigation ===== */
const VIEWS=["home","profile","history","privacy","language"];
function view(v){
  VIEWS.forEach(x=>{const e=$("v-"+x);if(e)e.hidden=x!==v});
  const tab=v==="home"?"home":"profile";
  ["home","profile"].forEach(x=>{const b=$("nav-"+x);if(!b)return;b.classList.toggle("on",x===tab);if(x===tab)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
  if(v==="profile")drawProfile();if(v==="history")drawHistView();
  window.scrollTo(0,0)}
$("nav-home").addEventListener("click",()=>view("home"));
$("nav-profile").addEventListener("click",()=>view("profile"));
function pick(t){document.querySelectorAll(".tool").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.t===t)));const same=!$("t-"+t).hidden;["url","msg","upi","qr"].forEach(x=>$("t-"+x).hidden=x!==t);if(!same)["urlR","msgR","upiR","qrR"].forEach(i=>$(i).hidden=true)}
document.querySelectorAll(".tool").forEach(b=>b.addEventListener("click",()=>pick(b.dataset.t)));

/* ===== RISK METER (flat, ultra-compact) ===== */
/* Exact bands: 5-30 Low (green), 31-70 Medium (orange), 71-98 High (red). The category is ALWAYS derived from the score. */
const RISK_MIN=5,RISK_MAX=98;
function levelFromPercent(p){return p<=30?"Low":p<=70?"Medium":"High"}
/* Converts the scanner's weighted indicator points into a realistic score.
   raw     = total weighted points from the scanner (more indicators = higher)
   medAt   = points where Medium starts, highAt = points where High starts (the thresholds the scanners already use)
   forceHigh = a critical indicator (executable file, lookalike brand, OTP request...) so the score is at least 71
   soft    = 0..0.99 from minor factors (no HTTPS, unusual ending, long or odd text...) that spreads scores inside a band */
function pointsToPercent(raw,medAt,highAt,forceHigh,soft){
  raw=Math.max(0,Number(raw)||0);soft=Math.min(0.99,Math.max(0,Number(soft)||0));let p;
  if(raw>=highAt)p=71+(raw-highAt)*5+soft*4;
  else if(raw>=medAt)p=31+Math.min(0.99,(raw-medAt)/(highAt-medAt)*0.85+soft*0.14)*39;
  else p=RISK_MIN+(medAt>0?raw/medAt*18:0)+soft*7;
  if(forceHigh&&p<71)p=71+soft*4;
  return Math.round(Math.min(RISK_MAX,Math.max(RISK_MIN,p)))}
const SAFE_TLDS=["com","in","org","net","gov","edu","co","io","app","dev","info"];
/* Minor link factors (not HTTPS, unusual ending, long or digit-heavy host, deep path or query). Returns 0..0.99 */
function urlSoft(u){
  const h=u.hostname,tld=h.split(".").pop().toLowerCase();let s=0;
  if(u.protocol==="http:")s+=0.3;
  if(SAFE_TLDS.indexOf(tld)<0)s+=0.15;
  s+=Math.min(0.15,Math.max(0,h.length-12)/100);
  s+=Math.min(0.1,(h.match(/\d/g)||[]).length*0.03);
  s+=Math.min(0.1,Math.max(0,h.split(".").length-2)*0.05);
  s+=Math.min(0.1,u.pathname.length/400);
  s+=Math.min(0.1,u.search.length/300);
  return Math.min(0.99,s)}
/* Minor text factors for numbers, UPI IDs and QR contents (digits, symbols, length). Returns 0..0.99 */
function textSoft(t){
  t=String(t||"");const d=(t.match(/\d/g)||[]).length,sp=(t.match(/[^a-z0-9@.\s]/gi)||[]).length;
  return Math.min(0.99,d*0.03+sp*0.04+Math.min(0.2,t.length/300))}
/* Reads the score a scanner attached to its result (r.pct). Falls back to r.score points if pct is missing. */
function riskPercentOf(r){
  if(typeof r.pct==="number"&&isFinite(r.pct))return Math.min(RISK_MAX,Math.max(RISK_MIN,Math.round(r.pct)));
  return pointsToPercent(r.score,2,4,r.level==="High",0)}
function renderRiskGauge(score,level,reasons){
  const RISK_METER_SCORE=Math.round(Math.min(RISK_MAX,Math.max(RISK_MIN,Number(score)||0)));
  const lv=levelFromPercent(RISK_METER_SCORE),label=LBL[lv];
  const box=mk("div","rbar "+lv.toLowerCase());
  box.setAttribute("role","img");box.setAttribute("aria-label","Risk score "+RISK_METER_SCORE+" out of 100, "+label);
  const num=mk("b","","0"),sc=mk("span","rb-score");sc.append(num," / 100");
  const row=mk("div","rb-row");row.append(sc,mk("span","rb-tag",label));
  const fill=mk("div","rb-fill"),track=mk("div","rb-track");track.append(fill);
  box.append(row,track);
  if(Array.isArray(reasons)&&reasons.length){const ul=mk("ul","sig");reasons.forEach(t=>ul.append(mk("li","",t)));box.append(ul)}
  return{node:box,fill:fill,num:num,score:RISK_METER_SCORE}}
/* Call from anywhere: updateRiskMeter(76,"High",["reason 1","reason 2"],hostElement). The score (5-98) decides the category and colour; level is kept only for compatibility. */
function updateRiskMeter(score,level,reasons,host){
  host=host||document.getElementById("riskMeter");if(!host)return null;
  const g=renderRiskGauge(score,level,reasons);host.textContent="";host.append(g.node);
  const still=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  const go=()=>{g.fill.style.width=g.score+"%"};
  if(still){go();g.num.textContent=String(g.score);return g}
  requestAnimationFrame(()=>requestAnimationFrame(go));
  const t0=performance.now(),dur=700;
  (function tick(t){const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);g.num.textContent=String(Math.round(g.score*e));if(k<1)requestAnimationFrame(tick)})(t0);
  return g}

/* ===== result renderer ===== */
function show(id,r,hl){
  const b=$(id);b.textContent="";["urlR","msgR","upiR","qrR"].forEach(x=>{if(x!==id)$(x).hidden=true});
  const gm=mk("div");b.append(gm,mk("p","verdict",r.desc));updateRiskMeter(riskPercentOf(r),r.level,[],gm);if(r.note)b.append(mk("p","note",r.note));
  if(hl)b.append(hl);
  if(r.signals&&r.signals.length){b.append(mk("div","lbl","What stood out"));const ul=mk("ul","sig");r.signals.forEach(s=>ul.append(mk("li","",s)));b.append(ul)}
  b.append(mk("div","lbl","What to do"),mk("p","txt",r.rec));
  const nb=mk("button","btn ghost",id==="qrR"?"Scan Another":"Check Another");nb.type="button";nb.style.marginTop="16px";nb.addEventListener("click",RESET[id]);b.append(nb);
  b.classList.remove("fade");b.hidden=false;
  try{b.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"})}catch(e){}}

/* ===== URL analysis ===== */
const LBL={High:"High Risk",Medium:"Medium Risk",Low:"Low Risk"};
/* Official verified domains. A link to one of these (or its subdomains) is shown as an official link and rated Low Risk. */
const TRUSTED={"airtel.in":"Airtel","airtel.com":"Airtel","jio.com":"Jio","jio.in":"Jio","bsnl.co.in":"BSNL","myvi.in":"Vi",
"sbi.co.in":"SBI","onlinesbi.sbi":"SBI","sbicard.com":"SBI Card","hdfcbank.com":"HDFC Bank","icicibank.com":"ICICI Bank","axisbank.com":"Axis Bank","kotak.com":"Kotak","pnbindia.in":"PNB","bankofbaroda.in":"Bank of Baroda","canarabank.com":"Canara Bank","unionbankofindia.co.in":"Union Bank","yesbank.in":"Yes Bank","indusind.com":"IndusInd Bank","idfcfirstbank.com":"IDFC FIRST Bank",
"paytm.com":"Paytm","phonepe.com":"PhonePe","npci.org.in":"NPCI","bhimupi.org.in":"BHIM UPI",
"uidai.gov.in":"UIDAI","incometax.gov.in":"Income Tax Department","irctc.co.in":"IRCTC","indiapost.gov.in":"India Post","parivahan.gov.in":"Parivahan","cybercrime.gov.in":"Cyber Crime Portal","sancharsaathi.gov.in":"Sanchar Saathi",
"amazon.in":"Amazon","flipkart.com":"Flipkart","google.com":"Google","microsoft.com":"Microsoft","apple.com":"Apple"};
function trustedOrg(h){for(const d in TRUSTED)if(h===d||h.endsWith("."+d))return[d,TRUSTED[d]];return null}
const USERCONTENT=["sites.google.com","drive.google.com","docs.google.com","forms.google.com","script.google.com","drive.usercontent.google.com"];
const REPOS=["apkpure.com","apkmirror.com","apkmody.io","happymod.com","uptodown.com","aptoide.com","apkcombo.com","mediafire.com","mega.nz","4shared.com","sendspace.com","gofile.io"];
const CORE=["login","signin","verify","free","mod"];
const MORE=["account","bank","otp","claim","kyc","prize","reward","password","wallet"];
const SUBWORDS=["secure","login","signin","verify","account","update","support","wallet","kyc","billing","recovery","confirm"];
const BRANDS=["paypal","google","microsoft","apple","amazon","facebook","instagram","whatsapp","netflix","paytm","phonepe","sbi","hdfc","icici","flipkart","irctc","telegram","binance","linkedin","airtel","jio","fedex","delhivery"];
const BRANDOK=["amazonaws.com","microsoftonline.com","googleapis.com","googleusercontent.com","gstatic.com","paypalobjects.com","fbcdn.net","facebook.net","windowsupdate.com"];
const BRANDDOM=["paypal.com","google.com","microsoft.com","apple.com","amazon.in","amazon.com","facebook.com","instagram.com","whatsapp.com","netflix.com","sbi.co.in","hdfcbank.com","icicibank.com","paytm.com","phonepe.com","flipkart.com"];
const SHORT=["bit.ly","tinyurl.com","t.co","goo.gl","is.gd","cutt.ly","rb.gy","ow.ly","shorturl.at","tiny.cc","t.ly","rebrand.ly","bl.ink","s.id","v.gd","lnkd.in","buff.ly","tr.ee"];
const BADTLD=["zip","mov","top","xyz","click","link","icu","cfd","sbs","rest","tk","ml","ga","cf","gq"];
const SLD=["co","com","org","net","gov","ac","edu","nic"];
const EXE=["apk","xapk","exe","scr","msi","bat","cmd","com","jar","vbs","ps1","dmg","pkg","lnk","iso","hta","pif","dll"];
const ARC=["zip","rar","7z","gz","tar","cab","tgz"];
const TRUSTDL=["github.com","githubusercontent.com","python.org","nodejs.org","mozilla.org","apache.org"];
const REDIR=["url","redirect","redirect_uri","next","goto","link","target","dest","destination","return","returnurl","continue"];
const SECRETP=["password","passwd","pass","pwd","otp","pin","cvv","token","card","cardnumber"];
const REC={file:"Do not download or open the file. Get apps and programs only from the official store or the company's own website.",
  eicar:"This is an antivirus test name. Download it only on purpose, and expect your antivirus to react.",
  short:"Do not open short links from people you do not know. Ask for the full address, or use the shortener's preview option.",
  ip:"Do not enter any details on a page reached through a number address.",
  phish:"Do not enter passwords, codes or payment details. Type the company's real address yourself."};
const isHost=(h,r)=>h===r||h.endsWith("."+r);
function parse(raw){
  let s=raw.trim();if(!s||/\s/.test(s))return null;
  if(/^[a-z][a-z0-9+.-]*:/i.test(s)&&!/^https?:\/\//i.test(s)&&!/^[^/]+:\d+/.test(s))return null;
  if(!/^https?:\/\//i.test(s))s="https://"+s;
  try{const u=new URL(s);if(!/^https?:$/.test(u.protocol))return null;
    const ip=/^\d{1,3}(\.\d{1,3}){3}$/.test(u.hostname);
    if(!ip&&(!u.hostname.includes(".")||u.hostname.split(".").pop().length<2))return null;return u}catch(e){return null}}
function extractUrl(raw){
  let s=String(raw||"").trim();if(!s)return null;
  s=s.replace(/\[\s*\.\s*\]|\(\s*\.\s*\)|\{\s*\.\s*\}/g,".").replace(/hxxp/gi,"http").replace(/\\+/g,"/");
  const md=s.match(/\]\(\s*([^)\s]+)\s*\)/);if(md)s=md[1];
  const tail=x=>x.replace(/[.,;:!?'"`]+$/,"");
  const m=s.match(/(?:^|[^a-z0-9])(h?t{1,3}ps?)\s*:?\s*\/{1,3}\s*([^\s<>"'`\]\)}]+)/i);
  if(m)return (/s$/i.test(m[1])?"https":"http")+"://"+tail(m[2]);
  const b=s.match(/(?:^|[^a-z0-9@.\-])((?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[\/?#][^\s<>"'`\]\)}]*)?|\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:[\/?#][^\s<>"'`\]\)}]*)?)/i);
  return b?"https://"+tail(b[1]):null}
function reg(l){const n=l.length;if(n<=2)return l.join(".");if(l[n-1].length===2&&SLD.includes(l[n-2]))return l.slice(-3).join(".");return l.slice(-2).join(".")}
function analyze(u){
  const host=u.hostname.toLowerCase(),labels=host.split("."),ip=/^\d{1,3}(\.\d{1,3}){3}$/.test(host)||host.startsWith("[");
  const main=ip?host:reg(labels),mainLabel=main.split(".")[0],subs=ip?[]:labels.slice(0,labels.length-main.split(".").length);
  const path=u.pathname,qs=u.search,pq=(path+qs).toLowerCase(),proto=u.protocol.replace(":","").toUpperCase();
  let seg=path.split("/").pop().toLowerCase();try{seg=decodeURIComponent(seg)}catch(e){}
  const ext=(seg.match(/\.([a-z0-9]{1,5})$/)||[])[1]||"";
  const qf=(qs.toLowerCase().match(/([^=&\/]+)\.(apk|xapk|exe|scr|msi|bat|cmd|jar|vbs|zip|rar|7z)(?:&|$)/)||[])[2]||"";
  const fext=(EXE.includes(ext)||ARC.includes(ext))&&seg.length>ext.length+1?ext:qf;
  const sig=[],flags=new Set();let score=0,hard=false;
  const add=(w,t,f,crit)=>{score+=w;sig.push({w:w,t:t});if(f)flags.add(f);if(crit)hard=true};
  const r={host:host,main:main,proto:proto,path:path,qs:qs,ext:fext||ext};
  const tr=ip?null:trustedOrg(host);
  if(!u.username&&!ip&&tr&&!USERCONTENT.some(o=>isHost(host,o))&&!EXE.includes(fext)&&!/[?&](url|q|redirect|continue|link)=https?/i.test(qs)){
    r.level="Low";r.pct=pointsToPercent(0,2,4,false,urlSoft(u)*0.5);r.official=true;r.org=tr[1];r.orgDomain=tr[0];r.flags=[];
    r.desc="The domain "+host+" is an official verified domain of "+tr[1]+" ("+main+"). Nothing in the address text looks unusual.";
    r.rec="This matches an official "+tr[1]+" address. Check that the page asks for what you expect, and sign in only on addresses that end in "+tr[0]+".";
    r.signals=["Main domain is "+main+", which is a verified official domain of "+tr[1]+".","The link uses "+proto+(proto==="HTTPS"?", which is encrypted.":".")];return r}
  const all=toks(host+" "+pq),repo=REPOS.find(d=>isHost(host,d));
  /* downloads and test files */
  if(/eicar/.test(pq)||/\.com\.txt$/.test(seg))add(5,"Antivirus test signature: the name \"EICAR\" or a .com.txt file is in the link. It is a harmless test file, but your antivirus will react to it and real malware sometimes copies the name.","eicar",true);
  else if(fext){
    if(fext==="apk"||fext==="xapk")add(5,"Direct Android installer (."+fext+"). Installing outside the Play Store skips its security checks.","file",true);
    else if(EXE.includes(fext))add(5,"Program file (."+fext+"). It can run on your device and install malware.","file",true);
    else{const t=TRUSTDL.some(d=>isHost(host,d));add(t?2:4,"Compressed archive (."+fext+"). Archives are often used to hide malware from scanners."+(t?" This host is well known, so check what is inside.":""),"file")}}
  if(/\.(pdf|docx?|xlsx?|jpe?g|png|txt|mp3|mp4)\.(exe|scr|zip|apk|bat|js|vbs|rar)$/.test(seg))add(3,"Disguised file name: a document name followed by a program or archive ending.","file");
  if(repo)add(4,"Third-party file host ("+main+"). Files here are not checked by an official store.","file");
  else if(!fext&&all.includes("apk"))add(3,"The word \"apk\" appears in the address, which points to an Android installer.","file");
  /* host structure */
  if(ip){const priv=/^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
    add(priv?2:4,priv?"The address is a private network number ("+host+"), not a public website.":"The link uses a number ("+host+") instead of a site name. Real services almost always use a name.","ip")}
  if(labels.some(l=>l.startsWith("xn--")))add(4,"The name contains lookalike characters (xn--).","phish");
  if(u.username||u.password)add(4,"Text before an @ sign is ignored by the browser. The real site is "+host+".","phish");
  if(u.protocol==="http:")add(1,"The link uses HTTP, so it is not encrypted.");
  if(u.port&&!["80","443"].includes(u.port))add(1,"The link uses the unusual port "+u.port+".");
  if(!ip){
    if(subs.length>=3)add(2,"The name has "+subs.length+" subdomain levels before "+main+", which can bury the real site name.","phish");
    const hy=(host.match(/-/g)||[]).length;if(hy>=3)add(2,"The name has "+hy+" hyphens.");else if(hy===2)add(1,"The name has 2 hyphens.");
    const sw=[...new Set(toks(subs.join(" ")).filter(x=>SUBWORDS.includes(x)))];
    if(sw.length)add(2,"Phishing-style subdomain word"+(sw.length>1?"s":"")+": "+sw.join(", ")+".","phish");
    const bd=BRANDDOM.find(d=>host.includes(d)&&!isHost(host,d));
    if(bd)add(5,"The text \""+bd+"\" appears inside the address, but the real site is "+main+".","phish",true);
    const b=!bd&&!BRANDOK.includes(main)&&BRANDS.find(x=>host.split(/[.\-]/).some(p=>p===x||p.startsWith(x))&&mainLabel!==x);
    if(b)add(4,"The brand name \""+b+"\" is used, but the main domain is "+main+", not "+b+".","phish",true);
    if(!bd&&!b){
      const norm=mainLabel.replace(/0/g,"o").replace(/1/g,"l").replace(/3/g,"e").replace(/5/g,"s").replace(/rn/g,"m").replace(/vv/g,"w"),col=x=>x.replace(/(.)\1+/g,"$1");
      const lk=BRANDS.find(x=>mainLabel!==x&&(norm===x||col(mainLabel)===col(x)));
      if(lk)add(5,"The name \""+mainLabel+"\" is a lookalike spelling of \""+lk+"\".","phish",true)}
    if(BADTLD.includes(labels[labels.length-1]))add(1,"The ending ."+labels[labels.length-1]+" is overused by short-lived sites.");
    if(SHORT.includes(main))add(2,"Short link ("+main+"): the real destination is hidden until you open it.","short")}
  /* query string and path */
  const qp=[...u.searchParams.entries()];
  const rd=qp.find(x=>REDIR.includes(x[0].toLowerCase())&&/^(https?:)?\/\//i.test(x[1]));
  if(rd)add(2,"The link forwards you to another site through the \""+rd[0]+"\" setting in its query string.","phish");
  const sp=qp.find(x=>SECRETP.includes(x[0].toLowerCase()));
  if(sp)add(3,"The query string carries a sensitive field (\""+sp[0]+"\"). Real sites never ask for secrets inside a link.","phish");
  if(/(https?:\/\/|https?%3a)/i.test(path))add(2,"A second web address is hidden inside the path.","phish");
  if((qs.match(/%[0-9a-f]{2}/gi)||[]).length>=10)add(1,"Heavily encoded text in the query string, which can hide its purpose.");
  if(qs.length>150)add(1,"The query string is very long.");
  if(u.href.length>120)add(1,"The link is very long, which can hide where it leads.");
  /* keywords */
  const hits=[...new Set(all.filter(w=>CORE.includes(w)))],more=[...new Set(all.filter(w=>MORE.includes(w)))];
  if(hits.length)add(4,"Flagged word"+(hits.length>1?"s":"")+" in the address: "+hits.join(", ")+". Pages like this are often used for phishing.","phish",true);
  if(more.length)add(1,"Account-related words found: "+more.join(", ")+".");
  const level=hard||score>=4?"High":score>=2?"Medium":"Low";
  sig.sort((a,b)=>b.w-a.w);r.signals=sig.map(x=>x.t);r.flags=[...flags];r.level=level;r.score=score;r.pct=pointsToPercent(score,2,4,hard,urlSoft(u));
  const top=r.signals[0]||"";
  r.desc=level==="High"?"This link is very likely dangerous. Main reason: "+top:level==="Medium"?"Parts of this link look unusual. Main reason: "+top:sig.length?"Only a minor pattern was found in "+host+".":"No suspicious patterns found in the address text for "+host+".";
  r.rec=({High:"Do not open this link. ",Medium:"Be careful before you open this link. ",Low:"Normal care applies. This result does not confirm that the site is safe. "})[level]+r.flags.map(f=>REC[f]).slice(0,2).join(" ")+(level==="Low"?"Never share passwords or one-time codes on a page you did not open yourself.":"");
  return r}

function stepCard(n,h,items){const d=mk("div","step");const ul=mk("ul");items.forEach(i=>ul.append(mk("li","",i)));d.append(mk("div","n",n),mk("h4","",h),ul);return d}
function steps(r){
  const box=$("steps");box.textContent="";
  if(!r){box.append(
    stepCard("01 / PASTE","Bring the link here",["Paste a complete website, download or APK link.","The text stays in your browser.","The check reads the protocol, host name, path and query string."]),
    stepCard("02 / NOTICE","Review the address patterns",["Looks for APK, EXE, SCR and ZIP downloads and antivirus test files.","Looks for number addresses, short links and fake subdomains.","Looks for words such as login, verify, free and mod, and for forwarding tricks."]),
    stepCard("03 / DECIDE","Choose your next step",["Use the result as one input, not the final word.","Never share passwords or one-time codes on a link you did not open yourself.","Check who runs a site before you download anything from it."]));return}
  const clip=(x,n)=>x.length>n?x.slice(0,n)+"…":x;
  const c1=["Protocol: "+r.proto+(r.proto==="HTTPS"?" (encrypted).":" (not encrypted)."),"Host name: "+r.host+".","Main domain: "+r.main+".","Path: "+(clip(r.path,34)||"/")+(r.ext?" (file type ."+r.ext+")":"")+".","Query string: "+(r.qs?clip(r.qs,34):"none")+"."];
  const c2=r.signals.length?r.signals:["No unusual patterns were found in the host name, path or query string.","No downloads, test files, number addresses or lookalike names were found.","This only covers the address text."];
  const d=r.official?["Verdict: Low Risk. The address matches an official "+r.org+" domain.","Check that the page asks only for what you expect.","Sign in only on addresses that end in "+r.orgDomain+"."]
    :["Verdict: "+LBL[r.level]+(r.level==="Low"?", based on the address text only.":".")].concat(r.flags.slice(0,2).map(f=>REC[f]));
  if(d.length<3)d.push(r.level==="Low"?"Check who runs the site before you download or pay.":"If it came in a message, do not reply to it.");
  box.append(stepCard("01 / PASTE","Analysis for "+r.host,c1),stepCard("02 / NOTICE","What stood out",c2),stepCard("03 / DECIDE","Your next step",d));
  $("stepsSub").textContent="These steps now match the link you checked."}
function scanUrl(){
  if(!gate())return;const raw=$("url").value,cl=extractUrl(raw),u=cl?parse(cl):null;
  if(!u){err("urlE","No web address was found in that text. Paste a link such as https://example.com/page or example.com/page.");$("urlR").hidden=true;return}
  $("urlE").hidden=true;const r=analyze(u);
  if(cl!==raw.trim())r.note="Cleaned up and checked as: "+u.href;
  show("urlR",r);steps(r);logScan("Link",u.href,r.level)}

/* ===== message analysis ===== */
const PLAT={"WhatsApp":"On WhatsApp, be wary of unknown numbers, job offers, gaming groups and \"wrong number\" chats. Block and report the sender inside the app.",
"Instagram DM":"Instagram messages from accounts you do not follow that offer prizes, jobs, brand deals or investments are a common scam. Report the account.",
"Telegram":"Telegram groups that promise daily income, trading tips or gaming rewards are a common fraud route. Leave the group and report it.",
"SMS":"Banks send SMS from sender names, not personal numbers, and never ask for your OTP or PIN. Do not reply with codes.",
"Email":"Check the sender's real address, not only the display name. Do not open attachments or links you did not expect."};
let plat="WhatsApp";
Object.keys(PLAT).forEach(k=>{const b=mk("button","chip",k);b.type="button";b.setAttribute("aria-pressed",String(k===plat));
  b.addEventListener("click",()=>{plat=k;document.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",String(c===b)))});$("plat").append(b)});
const RULES=[
{l:"Fake bank debit or panic alert",w:5,hard:1,tip:"Banks never ask you to reply NO, click a link or call a number to cancel a debit. Call your bank on the number printed on your card.",res:[/(?:\b(?:debited|deducted|withdrawn)\b[^\n]{0,50}(?:rs\.?|inr|₹)\s?\d[\d,]*|(?:rs\.?|inr|₹)\s?\d[\d,]*(?:\.\d+)?[^\n]{0,30}\b(?:debited|deducted|withdrawn)\b)/gi,/\b(?:reply\s+(?:no|n|stop|block|cancel|dispute|yes|y)\b|(?:click|tap)\s+(?:here|the link|below|now)|call\s+(?:us\s+|this number\s+)?(?:now|immediately|urgently)|dispute\s+(?:now|immediately|within))/gi]},
{l:"Fake electricity disconnection alert",w:5,tip:"Electricity boards do not cut supply through an SMS that asks you to call a number. Pay bills only in the official board app or website.",res:[/\b(?:electricity|electric|power|bijli|light)\b/gi,/\b(?:disconnect(?:ed|ion)?|cut(?:ting)? off|will be cut|supply (?:will be )?(?:stopped|cut|disconnected)|connection (?:will be )?(?:cut|stopped|terminated))\b/gi,/\b(?:tonight|today|at\s+\d{1,2}(?:[:.]\d{2})?\s*(?:pm|am)|within\s+\d+\s*(?:hours?|hrs?|minutes?|mins?)|immediately|last (?:chance|warning)|previous (?:month'?s? )?bill|bill (?:is )?not (?:updated|paid)|contact (?:the )?(?:officer|executive|office))/gi]},
{l:"Fake job or task earning scam",w:5,tip:"Real employers do not charge fees or pay for likes, reviews or tasks.",res:[/\b(?:earn(?:ing)?|income|salary|make|get paid)\b[^\n]{0,40}?(?:₹|rs\.?|inr)?\s?\d[\d,]*\s*(?:\/\s?|per\s+|a\s+|every\s+|each\s+)?(?:day|daily|hour|hr|week|weekly)\b/gi,/\b(?:like|liking|likes|subscribe|subscribing|youtube|videos?|reels?|tasks?|reviews?|ratings?|part[- ]time|work from home|wfh|data entry|typing job|telegram|whatsapp group|online job|hiring)\b/gi]},
{l:"Fake KYC or account-block threat",w:5,tip:"Banks do not ask you to update KYC through links or messages. Use the bank's official app or visit a branch.",res:[/\b(?:kyc|pan(?: card)?|aadhaar|a\/c|account|sim|debit card|credit card|net ?banking|upi|wallet)\b/gi,/\b(?:block(?:ed)?|suspend(?:ed)?|deactivat(?:ed|ion)|frozen|freeze|expire[sd]?|closed|terminated|disabled|not updated|update(?:d)? (?:now|immediately|today|within)|verify (?:now|immediately|today|within))\b/gi,/(?:\bclick\b|\btap\b|\blink\b|https?:|bit\.ly|\bcall\b|\bcontact\b|\bimmediately\b|\burgent(?:ly)?\b|within\s+\d+|\btoday\b|\bnow\b|\basap\b|\botherwise\b|\bor else\b|last (?:chance|warning))/gi]},
{l:"Fake e-challan or traffic fine notice",w:5,tip:"Check any challan only on the official Parivahan website or app.",res:[/\b(?:e-?challan|challan|traffic (?:fine|violation|police)|parivahan|rto)\b/gi,/\b(?:pending|unpaid|overdue|fine|penalty|pay|due|violation|notice)\b/gi,/(?:https?:|bit\.ly|\bclick\b|\blink\b|pay now|within\s+\d+|\bimmediately\b|\burgent(?:ly)?\b|\btoday\b|\bcall\b|\.apk)/gi]},
{l:"Color prediction or betting platform",w:5,tip:"Color prediction and betting apps are often rigged and can be illegal. Do not deposit, recharge or share bank details.",re:/\b(91 ?club|tiranga( games?)?|daman( games?)?|wingo|jalwa|ssj ?fin|ok ?win|bdg ?win|rajaluck|goa ?games?|(colou?r|number) prediction|prediction (group|hack|tips?|app)|satta|matka|betting (id|app|tips?)|sure ?shot)\b/gi},
{l:"Gaming, casino or betting offer",w:3,re:/\b(rummy|teen ?patti|aviator|casino|online betting|ludo (earn|cash|game)|dream ?11|fantasy (cricket|league))\b/gi},
{l:"Welcome gift, bonus or reward bait",w:3,re:/\b(welcome (gift|bonus|reward)s?|(free|gift|bonus|reward) (code|coupon|voucher|cash|money|recharge)|(claim|get|collect|win)[^.\n]{0,20}(gift|reward|bonus|cash)|(gift|reward|bonus)s?[^.\n]{0,15}(waiting|ready|credited|unlocked)|(first|1st) (deposit|recharge) bonus|sign ?up bonus|register (and|&) (get|win|earn))\b/gi},
{l:"Login or recharge to claim or withdraw",w:4,tip:"Real rewards never need you to log in, recharge or pay a fee to withdraw them.",re:/\b(log ?in (now |here |today )?to (claim|get|withdraw|receive|collect)|(recharge|deposit|pay)[^.\n]{0,20}(to )?(withdraw|unlock|claim)|withdraw(al)? (limit|failed|pending|blocked)|unlock (your )?withdraw(al)?)\b/gi},
{l:"Prize or lottery claim",w:3,re:/\b(lottery|lucky draw|jackpot|winner|you (have )?won|claim (your )?(prize|reward|gift)|congratulations?[^.\n]{0,40}(won|selected))\b/gi},
{l:"Urgent KYC or details update",w:3,tip:"Banks do not ask you to update KYC through links or messages. Use the bank's official app or visit a branch.",re:/\b(kyc|know your customer|pan (card )?(update|verification)|aadhaar (update|link)|update (your )?(details|account))\b/gi},
{l:"Account, card or SIM block threat",w:3,re:/\b(account|card|upi|wallet|sim)[^.\n]{0,30}(block(ed)?|suspend(ed)?|deactivat(ed|ion)|frozen|freeze|closed|expire[sd]?)\b/gi},
{l:"Utility or net banking cut-off threat",w:3,re:/\b(electricity|power|gas|net ?banking|pan card)[^.\n]{0,40}(disconnect(ed|ion)?|cut off|block(ed)?|deactivat(ed|ion)|terminated|suspend(ed)?)\b/gi},
{l:"Unauthorized UPI or refund request",hard:1,w:5,tip:"You never need your UPI PIN to receive money. Decline any collect request you did not start.",re:/\b(collect request|request money|approve (the |this )?(request|payment)|accept (the |this )?(collect )?request|(receive|get|claim)[^.\n]{0,25}(enter|using|with) (your )?(upi )?pin|scan (this )?qr[^.\n]{0,25}(receive|get|claim|refund)|(refund|cashback)[^.\n]{0,25}(upi pin|scan|accept)|(mistakenly|wrongly|by mistake)[^.\n]{0,25}(sent|transferred|credited)[^.\n]{0,25}(return|send back|refund))\b/gi},
{l:"Fake parcel or delivery notice",w:3,re:/\b(parcel|package|courier|delivery|shipment|customs)[^.\n]{0,50}(held|failed|pending|undelivered|fee|charge|reschedule|address|redeliver)/gi},
{l:"Crypto or investment bait",w:3,re:/\b(crypto|bitcoin|usdt|forex|trading (group|tips)|guaranteed (returns?|profit)|double your (money|investment)|daily (profit|income)|investment (plan|opportunity)|stock tips)\b/gi},
{l:"Request for OTP, PIN or password",hard:1,w:5,tip:"Never share an OTP, PIN or password with anyone, even if they say they work for your bank.",re:/\b(share|send|tell|enter|provide|confirm)[^.\n]{0,25}(otp|pin|cvv|password|passcode|card number)\b|\b(otp|cvv|upi pin)[^.\n]{0,20}(share|send)/gi},
{l:"Fee or advance payment request",hard:1,w:3,re:/\b(processing fee|registration fee|joining fee|training fee|activation fee|security deposit|refundable deposit|pay (a )?(small )?(fee|amount)|send (me )?money|gift cards?)\b/gi},
{l:"Fake job offer",w:3,tip:"Real employers do not charge fees or pay for likes, reviews or tasks.",re:/\b(hiring|vacanc(y|ies)|job offer|work from home|part[- ]time|data entry|typing job|earn (up to )?(₹|rs\.?|inr)? ?\d[\d,]*\s?(per|a|every|daily|weekly|monthly)|salary (₹|rs\.?|inr)? ?\d+|no (experience|investment) (needed|required)|joining fee|training fee|task (based|work)|(like|subscribe|review)[^.\n]{0,15}tasks?|prepaid tasks?|hr (manager|team))\b/gi},
{l:"Remote access app request",hard:1,w:4,re:/\b(anydesk|teamviewer|quicksupport|screen ?share|remote (access|support))\b/gi},
{l:"Fake arrest or legal threat",hard:1,w:4,re:/\b(digital arrest|arrest warrant|legal action against you|narcotics|cbi officer)\b/gi},
{l:"Emergency money request",hard:1,w:3,re:/\b(i am (in|stuck)[^.\n]{0,30}(hospital|airport|trouble)|your (son|daughter|relative)[^.\n]{0,20}(accident|arrest))\b/gi},
{l:"Asks you to contact an unknown number",hard:1,w:2,re:/\b(call|whatsapp|contact|message|text) (us |me )?(now |today )?(on|at)?:? ?(\+?91[\s-]?)?[6-9]\d{9}\b/gi},
{p:"Telegram",l:"Paid signals or VIP group pitch",w:3,re:/\b(vip (group|channel|signals?)|paid signals?|pump (group|signals?)|join (my|our|the) (group|channel))\b/gi},
{p:"Instagram DM",l:"Fake brand deal or account warning",w:2,re:/\b(brand (deal|collab)|paid (promotion|collab)|follow (and|&) (win|earn)|giveaway winner|copyright (violation|infringement)|account (will be )?(deleted|disabled))\b/gi},
{p:"Email",l:"Unexpected attachment or invoice",w:2,re:/\b(attached (invoice|file|document|statement)|payment (advice|receipt)|invoice (attached|no\.?)|open the attachment|\.(zip|exe|scr|html?))\b/gi},
{n:1,l:"Authority name used to scare you",w:2,re:/\b(police|customs|cyber ?crime|court|income tax (notice|department))\b/gi},
{n:1,l:"Pressure to act fast",w:2,re:/\b(urgent(ly)?|immediately|within \d+ ?(hours?|hrs?|minutes?|mins?)|last chance|act now|expires? (today|soon)|final (notice|warning)|today only)\b/gi},
{n:1,l:"Pushes you to click or install",w:2,re:/\b(click (here|the link|below)|tap (here|the link)|open (the )?link|download (the )?(app|apk)|install (the )?app)\b/gi},
{n:1,l:"Generic greeting or account warning",w:1,re:/\b(dear (customer|user|account holder|valued)|verify your (account|identity|email)|your (mailbox|storage) is full|password (will )?expire)/gi}];
const LINKRE=/\b(?:https?:\/\/|www\.)[^\s<>"')\]}]+|\b(?:[a-z0-9-]+\.)+(?:com|in|net|org|xyz|top|link|click|co|info|app|cc|ly|me|online|site|live|shop|vip|icu|apk|zip)(?:\/[^\s<>"')\]}]*)?/gi;
function evalMsg(txt,pl){
  let score=0,lure=false,short=false,hard=false,trusted=0,unknown=0;const sig=[],ranges=[],tips=[],ver=[];
  RULES.forEach(R=>{if(R.p&&R.p!==pl)return;
    const parts=R.res||[R.re];let first=null,rg=[],ok=true;
    parts.forEach((x,i)=>{if(!ok)return;const re=new RegExp(x.source,"gi");let m,f=null;
      while((m=re.exec(txt))){if(f===null)f=m[0];rg.push([m.index,m.index+m[0].length]);if(m[0].length===0)re.lastIndex++}
      if(f===null)ok=false;else if(i===0)first=f});
    if(ok){ranges.push.apply(ranges,rg);score+=R.w;if(!R.n)lure=true;if(R.hard)hard=true;if(R.tip&&tips.indexOf(R.tip)<0)tips.push(R.tip);sig.push(R.l+": \""+first.slice(0,50)+"\"")}});
  const lre=new RegExp(LINKRE.source,"gi");let m,n=0;
  while((m=lre.exec(txt))&&n<3){if(m.index>0&&txt[m.index-1]==="@")continue;
    const s=m[0].replace(/[.,;!?\]}]+$/,""),u=parse(s);if(!u)continue;n++;
    const a=analyze(u);
    if(a.official){trusted++;ver.push("Official verified domain link: "+a.host+" ("+a.org+").");continue}
    unknown++;ranges.push([m.index,m.index+s.length]);
    if(a.flags.indexOf("short")>=0)short=true;
    if(a.level==="High"||a.level==="Medium"){score+=a.level==="High"?4:2;sig.push("Link to "+a.host+" is "+LBL[a.level]+". "+a.signals[0])}
    else{score+=1;sig.push("The message contains a link ("+a.host+"). Do not tap links you did not expect.")}}
  const letters=txt.replace(/[^a-z]/gi,"");
  if(letters.length>30&&letters.replace(/[^A-Z]/g,"").length/letters.length>0.5){score+=1;sig.push("Most of the message is in capital letters.")}
  if(/[!?]{3,}/.test(txt)){score+=1;sig.push("Repeated exclamation or question marks.")}
  if(short&&lure){score=Math.max(score,5);sig.unshift("Short link combined with reward, bank, job or scam wording. Scammers use short links to hide the real address.")}
  if(unknown&&lure){score+=2;sig.push("A link from an unverified site appears together with scam wording.")}
  let level=rate(score,5,2),capped=false;
  const verified=trusted>0&&unknown===0;
  let pct=pointsToPercent(score,2,5,false,Math.min(0.99,sig.length*0.15+n*0.1));
  if(verified){if(hard)ver.push("The link is official, but the wording still asks for a risky action.");else if(level!=="Low"){level="Low";capped=true}}
  return{level:level,sig:ver.concat(sig),ranges:ranges,tips:tips,verified:verified,capped:capped,score:score,pct:capped?Math.min(pct,25):pct}}
const WORDS=new Set("a about above after again all also am an and any are as at be because been before being below between both but by can cannot could did do does doing down during each few for from further had has have having he her here hers him his how if in into is it its just me more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself hi hello hey dear sir madam mr mrs ms ok okay yes yeah thanks thank please pls plz sorry bye good morning evening night day today tomorrow tonight yesterday wish wishes happy birthday congrats congratulations welcome account bank card debit credit upi pin otp cvv password login log signin sign verify verification update details link click tap open download install app apk call message msg sms text send sent receive received refund money amount rs inr rupees rupee cash payment pay paid paying transfer transferred transaction txn balance blocked block suspended suspend expire expired expires expiring deactivated activate active urgent urgently immediately immediate soon last chance final notice warning alert limited offer free gift rewards reward bonus coupon voucher prize lottery winner won win claim collect selected lucky draw jackpot recharge deposit withdraw withdrawal withdrawn unlock fee fees charge charges registration processing joining training refundable security job jobs work home part time full earn earning income salary daily weekly monthly per hour hours week month year hiring vacancy vacancies data entry typing task tasks like subscribe review follow share join group channel telegram whatsapp instagram facebook messenger email mail gmail google microsoft apple amazon flipkart paytm phonepe gpay netflix sbi hdfc icici axis kotak pnb airtel jio bsnl irctc aadhaar aadhar pan kyc customer customers user users member name number mobile phone sim electricity bill power gas disconnect disconnected cut parcel package courier delivery delivered shipment customs address held failed pending reschedule track tracking order orders invoice attached attachment file document statement receipt advice police court arrest arrested warrant legal action case officer cbi tax department government govt official support help service services team care helpline contact reply respond confirm confirmed approve approval request requested accept declined reject cancelled cancel complete completed process processed success successful invalid error wrong mistake mistakenly accidentally return back investment invest trading trade crypto bitcoin usdt forex profit profits returns guaranteed double stock stocks market shares ipo plan opportunity club game games gaming play betting bet casino rummy teen patti aviator ludo prediction color colour satta matka dream fantasy cricket match level vip signal signals pump ssjfin daman tiranga wingo jalwa okwin get got give given take taken make made see seen know need needs want wants go going gone come came coming meet meeting met called calling talk speak tell told say said ask asked check checked find found look looking wait waiting stop start started try tried use used using keep kept let put set show shown buy bought sell sold opened close closed read write wrote visit visiting reach reached arrive arrived leave left bring brought feel think thought hope love liked party dinner lunch breakfast food office school college class exam result results ticket tickets flight train bus cab ride car bike house room hotel booking book booked people person friend friends family brother sister mother father mom dad son daughter wife husband boss one two three four five six seven eight nine ten hundred thousand lakh crore minutes minute min mins hrs seconds second new old big small bad best better high low long short fast quick easy hard real fake safe secure trusted genuine original important required mandatory compulsory valid verified unverified suspicious unknown private public personal dont cant wont didnt doesnt isnt arent wasnt werent hasnt havent couldnt wouldnt shouldnt im ive id ill youre youve youll hes shes thats whats theres lets aap aapka aapki aapke apna apni apne main mein mai hum hamara hamari tum tumhara tera tere mera meri mere hai hain ho hoga hogi honge hua hui hue tha thi raha rahi rahe kar karo karna kare karein karke kiya kiye kya kyun kyu kaise kab kahan kaun kitna kitne ka ki ke ko se par pe ne ya aur bhi nahi nahin na haan ji jee bhai behen dost abhi aaj kal ab jab tab agar toh lekin magar isse usse yeh ye woh wo yahan wahan jaldi turant fauran paisa paise khata khate band chalu jayega jayegi jaayega milega milegi milenge mil gaya gayi gaye lo lena liya dena diya dijiye bhejo bheje bhej bhejna bhejiye batao bataye bata dekho dekhe dekh suno sun padhe jeeto jeet inaam warna varna role id ssid type key url title org tel addr city country product item price ref seat event date start end location desc description version model serial batch sku code pa pn am cu tn tr mc".split(" "));
function known(w){
  if(WORDS.has(w))return true;
  for(const x of ["s","es","ed","d","ing","ly","er","ers"])if(w.length>x.length+2&&w.endsWith(x)&&WORDS.has(w.slice(0,-x.length)))return true;
  return w.endsWith("ing")&&WORDS.has(w.slice(0,-3)+"e")}
function nonLatin(t){const r=t.replace(/[A-Za-z\u00C0-\u024F]/g,"");try{return new RegExp("\\p{L}","u").test(r)}catch(e){return /[\u0370-\uFFFF]/.test(r)}}
function readable(t){
  if(nonLatin(t))return true;
  const w=t.toLowerCase().replace(/https?:\/\/\S+|www\.\S+|\S+@\S+/g," ").replace(/['\u2019]/g,"").match(/[a-z]{2,}/g)||[];
  if(!w.length)return false;
  return w.filter(known).length/w.length>=(w.length>8?0.4:0.5)}
function hasLink(t){
  const re=new RegExp(LINKRE.source,"gi");let m;
  while((m=re.exec(t))){if(m.index>0&&t[m.index-1]==="@")continue;if(parse(m[0].replace(/[.,;!?\]}]+$/,"")))return true}
  return false}
function validMsg(t){if(!t)return false;if(hasLink(t))return true;if(t.length<8)return false;return readable(t)}
function validQr(t){
  if(!t)return false;
  if(/^(?:upi|https?|ftp|tel|sms|smsto|mms|mailto|wifi|geo|bitcoin|ethereum|otpauth|mecard|matmsg|begin|market|intent|whatsapp|tg|paytmmp|phonepe|gpay|tez|bhim):\S/i.test(t))return true;
  if(parse(t))return true;
  if(/^\d{6,}$/.test(t.replace(/[\s-]/g,"")))return true;
  try{const j=JSON.parse(t);if(j&&typeof j==="object")return true}catch(e){}
  const kv=t.split(/[;&|\n]+/).map(x=>x.trim()).filter(Boolean);
  if(kv.length>=2){const ks=kv.map(x=>(x.match(/^([A-Za-z_ .-]{1,25})[=:]/)||[])[1]).filter(Boolean).map(x=>x.trim().toLowerCase().replace(/[\s_.-]+/g,""));
    if(ks.length>=2&&ks.filter(known).length>=ks.length/2)return true}
  return readable(t)}
function hlNode(txt,ranges){
  ranges.sort((a,b)=>a[0]-b[0]);const m=[];
  ranges.forEach(r=>{const l=m[m.length-1];if(l&&r[0]<=l[1])l[1]=Math.max(l[1],r[1]);else m.push([r[0],r[1]])});
  const w=mk("div"),d=mk("div","hl");let i=0;
  m.forEach(x=>{if(x[0]>i)d.append(document.createTextNode(txt.slice(i,x[0])));d.append(mk("mark","",txt.slice(x[0],x[1])));i=x[1]});
  if(i<txt.length)d.append(document.createTextNode(txt.slice(i)));
  w.append(mk("div","lbl","Your message, with warning signs marked"),d);return w}
function scanMsg(){
  if(!gate())return;const txt=$("msg").value.trim();
  if(!validMsg(txt)){err("msgE","Please enter a valid message or link to analyze.");$("msgR").hidden=true;return}
  $("msgE").hidden=true;
  const e=evalMsg(txt,plat),level=e.level,ok=e.verified&&level==="Low";
  const r={level:level,score:e.score,pct:e.pct,signals:e.sig,
    desc:ok?"The link in this message points to an official verified domain."+(e.capped?" Some wording looked like a scam pattern, but the only link is official, so the risk is reduced.":" No scam patterns were found in the text."):level==="High"?"This message matches several common fraud patterns. Treat it as a scam until proven otherwise.":level==="Medium"?"This message has patterns that scammers often use. Be careful.":"No common scam patterns were found in this message text. That does not prove it is genuine.",
    rec:ok?"Official domain verified. Still, open the link only if you expected this message, and never share OTPs, PINs or passwords. "+PLAT[plat]:(level==="High"?"Do not reply, click any link, install anything or share codes. Block and report the sender. If you already acted, call your bank and 1930 straight away. ":level==="Medium"?"Do not click links or share details. Confirm with the company using a phone number or website you already trust. ":"Stay careful with links and requests for money or codes. ")+e.tips.slice(0,2).join(" ")+" "+PLAT[plat]};
  show("msgR",r,e.ranges.length?hlNode(txt,e.ranges):null);logScan("Message ("+plat+")",txt,level)}

/* ===== number and UPI ===== */
const HANDLES=["okaxis","oksbi","okhdfcbank","okicici","ybl","ibl","axl","paytm","apl","upi","sbi","hdfcbank","icici","axisbank","pnb","boi","cnrb","kotak","yesbank","indus","fbl","aubank","freecharge","postbank","unionbank","airtel","jio","slice"];
const UPIWORDS=["refund","lottery","kyc","prize","reward","cashback","claim","support","care","helpdesk","customer","official","bank","rbi","govt","tax","loan","offer","winner","gift","verify"];
const UPIRE=/^[a-z0-9._-]{2,64}@[a-z][a-z0-9]{1,30}$/i;
function upiId(id){
  const p=id.toLowerCase().split("@"),name=p[0],h=p[1],sig=[];let s=0;
  if(!HANDLES.includes(h)){s+=2;sig.push("The handle @"+h+" is not one of the common UPI handles. Confirm it in your payment app.")}
  const w=toks(name).filter(x=>UPIWORDS.includes(x));
  if(w.length){s+=3;sig.push("The ID contains \""+w.join("\", \"")+"\". Scam IDs often use words that sound official.")}
  if((name.match(/\d/g)||[]).length>=8&&!/^\d{10}$/.test(name)){s+=1;sig.push("The ID has many digits and does not look like a phone number.")}
  return{s:s,sig:sig}}
function checkUpi(v){
  const s=v.trim();
  if(s.includes("@")){
    if(!UPIRE.test(s))return null;const x=upiId(s),level=rate(x.s,4,2);
    return{level:level,pct:pointsToPercent(x.s,2,4,false,textSoft(s)),signals:x.sig,
      desc:level==="High"?"This UPI ID has patterns often seen in fraud.":level==="Medium"?"Parts of this UPI ID deserve a closer look.":"Nothing unusual in the format of this UPI ID. This cannot show whether it has been reported.",
      rec:"Check the name your payment app shows before you pay. You never need a PIN to receive money, so refuse any request to enter your PIN for a refund or prize."}}
  const p=s.replace(/[\s-]/g,""),m=p.match(/^(?:\+?91|0)?([6-9]\d{9})$/),sig=[];let sc=0;
  if(m){if(/(\d)\1{6,}/.test(m[1])){sc+=1;sig.push("The number has a long run of the same digit.")}}
  else if(/^\+\d{8,15}$/.test(p)){sc+=2;sig.push("This is an international number ("+p.slice(0,4)+"…). Scam calls and messages often come from numbers you do not expect.")}
  else return null;
  const level=rate(sc,4,2);
  return{level:level,pct:pointsToPercent(sc,2,4,false,textSoft(s)),signals:sig,
    desc:level==="Low"?"The format looks like a normal "+(m?"Indian mobile":"international")+" number. This cannot show whether it has been reported.":"This number has a pattern worth a closer look. This cannot show whether it has been reported.",
    rec:"Do not share OTPs, PINs or card details with anyone who calls or messages you, even if they say they are from your bank. Hang up and call the number printed on your card."}}
function scanUpi(){
  if(!gate())return;const v=$("upi").value,r=checkUpi(v);
  if(!r){err("upiE","Enter a 10-digit mobile number, a number with a + country code, or a UPI ID such as name@bank.");$("upiR").hidden=true;return}
  $("upiE").hidden=true;show("upiR",r);logScan("Number / UPI",v.trim(),r.level)}

/* ===== QR ===== */
function qrAnalyze(t){
  const sig=[];let sc=0,desc,rec;
  if(/^upi:\/\//i.test(t)){
    let q;try{q=new URL(t).searchParams}catch(e){q=new URLSearchParams()}
    const pa=q.get("pa")||"",pn=q.get("pn"),am=q.get("am");sc=1;
    sig.push("This is a payment QR code. Scanning it leads to paying money, not receiving it.");
    if(pn)sig.push("Payee name in the code: "+pn+". Check it matches who you mean to pay.");
    if(am){sc+=1;sig.push("The code already sets an amount: "+am+".")}
    if(UPIRE.test(pa)){const x=upiId(pa);sc+=x.s;sig.push.apply(sig,x.sig)}else{sc+=2;sig.push("The payee ID is missing or malformed.")}
    const level=rate(sc,4,2);
    return{level:level,pct:pointsToPercent(sc,2,4,false,textSoft(t)),signals:sig,desc:level==="Low"?"A normal-looking payment QR code. This cannot show whether the payee is genuine.":"This payment QR code has details worth checking before you pay.",
      rec:"Scan payment QR codes only when you want to pay. If anyone says you will receive money by scanning, it is a scam. Check the payee name your app shows before you enter an amount."}}
  const u=parse(t);
  if(u){const a=analyze(u);a.signals=a.signals.concat(["A QR code hides the link until you scan it. Read the address your phone shows before you open it."]);
    a.rec+=" If the code is a sticker on a poster, parking meter or table, check that it has not been stuck over the original.";return a}
  const sch=t.match(/^([a-z][a-z0-9+.-]*):/i);
  if(sch){sc=2;sig.push("The code starts an action of type \""+sch[1].toLowerCase()+":\" such as a call, text, email or Wi-Fi join.");
    return{level:"Medium",pct:pointsToPercent(sc,2,4,false,textSoft(t)),signals:sig,desc:"This QR code does more than show text.",rec:"Read what your phone asks you to do before you allow it. Do not join networks or send messages you did not plan to."}}
  return{level:"Low",pct:pointsToPercent(0,2,4,false,textSoft(t)),signals:[],desc:"This QR code contains plain text and no link. Nothing suspicious was found.",rec:"Plain text is not harmful on its own. Be careful if it tells you to call a number or send money."}}
function qrRun(val){
  if(!gate())return;const t=val.trim();
  if(!t){err("qrE","Scan a QR code, upload an image, or paste its contents first.");$("qrR").hidden=true;return}
  $("qrE").hidden=true;const r=qrAnalyze(t);show("qrR",r);logScan("QR code",t,r.level)}
let decoder=null,bdBad=false;
const cv=document.createElement("canvas"),cx=cv.getContext("2d",{willReadFrequently:true});
function loadJsQR(){
  return new Promise(res=>{
    if(window.jsQR)return res(true);
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js";
    s.onload=()=>res(!!window.jsQR);s.onerror=()=>res(false);
    document.head.append(s);setTimeout(()=>res(!!window.jsQR),8000)})}
async function decodeSource(src,w,h){
  const k=Math.min(1,1600/Math.max(w,h));cv.width=Math.max(1,Math.round(w*k));cv.height=Math.max(1,Math.round(h*k));
  cx.drawImage(src,0,0,cv.width,cv.height);
  if("BarcodeDetector" in window&&!bdBad){
    try{if(!decoder)decoder=new BarcodeDetector({formats:["qr_code"]});const r=await decoder.detect(cv);if(r.length)return r[0].rawValue}
    catch(e){bdBad=true}}
  if(window.jsQR){const d=cx.getImageData(0,0,cv.width,cv.height),q=window.jsQR(d.data,d.width,d.height,{inversionAttempts:"attemptBoth"});if(q&&q.data)return q.data}
  return null}
function loadImg(f){return new Promise((ok,no)=>{const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{ok(i);URL.revokeObjectURL(u)};i.onerror=()=>{URL.revokeObjectURL(u);no()};i.src=u})}
async function onQrFile(e){
  const f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;
  if(!user){openModal();return}
  $("qrE").hidden=true;
  try{
    await loadJsQR();
    const i=await loadImg(f),val=await decodeSource(i,i.naturalWidth,i.naturalHeight);
    if(!val){err("qrE","No QR code was found in that picture. Try again with the whole code in view, steady and well lit, or paste the QR contents below.");return}
    $("qrTxt").value=val;qrRun(val)}
  catch(x){err("qrE","That picture could not be opened. Try another photo or a JPG or PNG screenshot, or paste the QR contents below.")}}
["qrCam","qrFile"].forEach(id=>$(id).addEventListener("change",onQrFile));
["camLbl","upLbl"].forEach(id=>$(id).addEventListener("click",e=>{if(!user){e.preventDefault();openModal()}}));
$("qrGo").addEventListener("click",()=>{if(!gate())return;const t=$("qrTxt").value.trim();if(!validQr(t)){err("qrE","Invalid QR content. Please paste a valid QR URL, UPI string, or readable text.");$("qrR").hidden=true;return}qrRun(t)});

/* ===== profile ===== */
function drawHistView(){
  const L=$("hist");L.textContent="";const h=hist();$("clr").hidden=!h.length;
  if(!h.length){L.append(mk("li","txt","No checks yet. Results from all four tools appear here."));return}
  h.forEach(x=>{const li=mk("li","hi"),top=mk("div","hrow");
    top.append(mk("span","badge sm "+x.level.toLowerCase(),LBL[x.level]||x.level),mk("span","ht",x.type),
      mk("span","hd",new Date(x.t).toLocaleString([],{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})));
    li.append(top,mk("div","hin",x.input));L.append(li)})}
let armed=false;
$("clr").addEventListener("click",()=>{
  if(!armed){armed=true;$("clr").textContent="Tap again to clear history";setTimeout(()=>{armed=false;$("clr").textContent="Clear history"},4000);return}
  armed=false;$("clr").textContent="Clear history";try{if(hkey())store.removeItem(hkey())}catch(e){}drawHistView()});
function drawProfile(){
  const a=$("acct");a.textContent="";const h=hist();
  $("histCnt").textContent=user?h.length+(h.length===1?" check":" checks"):"";
  if(!user){a.append(mk("p","txt","You are signed out. Sign in to run checks and see your account details."));
    const b=mk("button","btn","Login");b.type="button";b.style.marginTop="12px";b.addEventListener("click",openModal);a.append(b)}
  else{
    const top=mk("div","who"),d=mk("div");
    d.append(mk("div","nm",user.name),mk("span","badge sm low","Signed in"));
    top.append(mk("div","avatar",user.name.charAt(0).toUpperCase()),d);a.append(top);
    const kv=mk("div","kv");
    [["Status","Logged in"],["Sign-in method",user.via],[user.contact[0],user.contact[1]],["Checks saved here",String(h.length)]].forEach(p=>kv.append(mk("span","k",p[0]),mk("span","v",p[1])));
    a.append(kv);const b=mk("button","btn ghost","Logout");b.type="button";b.addEventListener("click",logout);a.append(b)}}
$("mHist").addEventListener("click",()=>{if(!user){openModal();return}view("history")});
$("mPriv").addEventListener("click",()=>view("privacy"));
$("hBack").addEventListener("click",()=>view("profile"));
$("pBack").addEventListener("click",()=>view("profile"));

/* ===== language engine ===== */
const LANGS=[["en","English"],["hi","Hindi (हिंदी)"],["hn","Hinglish"],["bn","Bengali (বাংলা)"]];
const LTAG={en:"en",hi:"hi",hn:"hi-Latn",bn:"bn"};
/* Translation table: [English, Hindi, Hinglish, Bengali]. {} = any text, {#} = digits. Add rows here to translate more text. */
const ROWS=window.TCS_ROWS||[];
const TR={},PAT=[];
function mkRe(en){return new RegExp("^"+en.split(/(\{#\}|\{\*\}|\{\})/).map(p=>p==="{#}"?"(\\d+)":p==="{*}"?"([\\s\\S]+?)":p==="{}"?"((?:(?!\\.\\s)[\\s\\S])+?)":p.replace(/[.*+?^$()|[\]\\]/g,"\\$&")).join("")+"$")}
ROWS.forEach(r=>{const v={hi:r[1],hn:r[2],bn:r[3]};
  if(/\{[#*]?\}/.test(r[0]))PAT.push({re:mkRe(r[0]),v:v});
  else TR[r[0]]=v});
function sents(k){const o=[];let c="";for(let i=0;i<k.length;i++){c+=k[i];if(/[.!?]/.test(k[i])&&/\s/.test(k[i+1]||"")){o.push(c);c="";while(/\s/.test(k[i+1]||""))i++}}if(c)o.push(c);return o}
function tk(k,l,deep){
  const e=TR[k];if(e&&e[l])return e[l];
  for(const p of PAT){const m=k.match(p.re);if(m&&p.v[l]){let i=0;return p.v[l].replace(/\{\}/g,()=>tk(m[++i]||"",l))}}
  const q=k.match(/^([^:"]{3,60}): "([\s\S]*)"$/);if(q&&TR[q[1]]&&TR[q[1]][l])return TR[q[1]][l]+': "'+q[2]+'"';
  if(!deep){const s=sents(k);if(s.length>1){let hit=false;const o=s.map(x=>{const t=tk(x.trim(),l,1);if(t!==x.trim())hit=true;return t});if(hit)return o.join(" ")}}
  return k}
function tl(s,l){if(l==="en")return s;const k=s.trim();if(!k)return s;const r=tk(k,l);if(r===k)return s;const i=s.indexOf(k);return s.slice(0,i)+r+s.slice(i+k.length)}
/* -- dom -- */
let lang="en";
const ORIG=new WeakMap(),AT=new WeakMap(),SKIP=/^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/;
function trNode(n){
  if(n.nodeType===3){const p=n.parentNode;if(!p||SKIP.test(p.nodeName))return;
    let o=ORIG.get(n);if(!o){o={en:n.data,cur:n.data};ORIG.set(n,o)}else if(n.data!==o.cur)o.en=n.data;
    const t=tl(o.en,lang);if(t!==n.data)n.data=t;o.cur=t}
  else if(n.nodeType===1&&!SKIP.test(n.nodeName)){
    ["placeholder","aria-label","title"].forEach(a=>{if(!n.hasAttribute(a))return;const v=n.getAttribute(a);let m=AT.get(n);if(!m){m={};AT.set(n,m)}
      let o=m[a];if(!o){o={en:v,cur:v};m[a]=o}else if(v!==o.cur)o.en=v;const t=tl(o.en,lang);if(t!==v)n.setAttribute(a,t);o.cur=t});
    n.childNodes.forEach(trNode)}}
const OBS_CFG={childList:true,subtree:true};
const obs=new MutationObserver(ms=>{if(lang==="en")return;obs.disconnect();try{ms.forEach(m=>m.addedNodes.forEach(trNode))}finally{obs.observe(document.body,OBS_CFG)}});
function setLang(l){
  if(!LANGS.some(x=>x[0]===l))l="en";lang=l;try{store.setItem("tcs_lang",l)}catch(e){}
  document.documentElement.lang=LTAG[l];
  obs.disconnect();trNode(document.documentElement);obs.observe(document.body,OBS_CFG);
  $("langCur").textContent=": "+(LANGS.find(x=>x[0]===l)||LANGS[0])[1];
  document.querySelectorAll("#langOpts .lopt").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.lang===l)))}
function initLang(){
  LANGS.forEach(x=>{const b=mk("button","lopt"),ck=mk("span","ck","✓");ck.setAttribute("aria-hidden","true");
    b.type="button";b.dataset.lang=x[0];b.setAttribute("role","radio");b.setAttribute("aria-checked","false");
    b.append(mk("span","",x[1]),ck);b.addEventListener("click",()=>setLang(x[0]));$("langOpts").append(b)});
  $("mLang").addEventListener("click",()=>view("language"));
  $("lBack").addEventListener("click",()=>view("profile"));
  let saved="en";try{saved=store.getItem("tcs_lang")||"en"}catch(e){}
  setLang(saved)}
/* ===== end language engine ===== */

/* ===== wire up ===== */
function hideRes(id){const b=$(id);if(b.hidden)return;b.classList.add("fade");setTimeout(()=>{b.hidden=true;b.classList.remove("fade")},200)}
const RESET={
  urlR(){$("url").value="";$("urlE").hidden=true;hideRes("urlR");steps(null);$("stepsSub").textContent="Check a link and these steps update to match it.";$("url").focus()},
  msgR(){$("msg").value="";$("msgE").hidden=true;hideRes("msgR");$("msg").focus()},
  upiR(){$("upi").value="";$("upiE").hidden=true;hideRes("upiR");$("upi").focus()},
  qrR(){$("qrTxt").value="";$("qrCam").value="";$("qrFile").value="";$("qrE").hidden=true;hideRes("qrR")}};
$("copy1930").addEventListener("click",()=>{
  const b=$("copy1930"),done=()=>{b.textContent="Copied: 1930";setTimeout(()=>{b.textContent="Copy number"},2500)};
  const fb=()=>{try{const t=document.createElement("textarea");t.value="1930";t.style.position="fixed";t.style.opacity="0";document.body.append(t);t.select();document.execCommand("copy");t.remove();done()}catch(e){b.textContent="Dial 1930"}};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText("1930").then(done,fb);else fb()});
$("urlGo").addEventListener("click",scanUrl);$("url").addEventListener("keydown",e=>{if(e.key==="Enter")scanUrl()});
$("msgGo").addEventListener("click",scanMsg);
$("upiGo").addEventListener("click",scanUpi);$("upi").addEventListener("keydown",e=>{if(e.key==="Enter")scanUpi()});
window.addEventListener("storage",e=>{if(e.key==="tcs_lang"){if(e.newValue&&e.newValue!==lang)setLang(e.newValue);return}if(e.key!==SK)return;const was=user;user=loadSession();paint();
  if(!user&&was){clearScreen();if(!$("v-history").hidden)view("profile");openModal()}else if(user&&!was)$("modal").hidden=true;
  if(!$("v-profile").hidden)drawProfile()});
paint();steps(null);if(!user)openModal();try{initLang()}catch(e){}reportMismatch();
})();
/* END OF script.js */
