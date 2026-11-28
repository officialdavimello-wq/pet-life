// Pet Life — sequência diária com congelamento (❄️ salva a sequência se você faltar). Guardada no aparelho.
(function(){
"use strict";
const box=document.getElementById("talkBox");if(!box)return;
const KEY="petlife_streak",chip=document.createElement("div");chip.id="streakChip";box.prepend(chip);
const dn=d=>Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/864e5;
const load=()=>{try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Number.isFinite(s.n)&&Number.isFinite(s.last)&&Number.isFinite(s.fz))return s}catch(e){}return{n:0,last:0,fz:0}};
const store=s=>{try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}};
function draw(s){chip.hidden=false;chip.textContent="🔥 Sequência: "+s.n+" dia"+(s.n===1?"":"s")+" · ❄️ "+s.fz}
function check(){
 if(typeof data==="undefined"||!data){chip.hidden=true;return}
 const t=dn(new Date()),s=load();
 if(s.last>=t){if(s.n)draw(s);return}
 const gap=t-s.last-1;let msg="";
 if(!s.last)s.n=1;
 else if(gap<=0)s.n++;
 else if(gap<=s.fz){s.fz-=gap;s.n++;msg=" ❄️ Congelamento usado!"}
 else{s.n=1;msg=" Sua sequência recomeçou."}
 s.last=t;
 if(s.n%7===0&&s.fz<3){s.fz++;msg+=" +1 ❄️ congelar!"}
 const c=Math.min(s.n,7),x=Math.min(s.n*2,20);
 store(s);addXP(x);addCoins(c);save();draw(s);
 notice("🔥 Sequência de "+s.n+" dia"+(s.n===1?"":"s")+"! +"+x+" XP e +"+c+" moedas."+msg);
}
chip.hidden=true;setTimeout(check,2000);setInterval(check,15000);
})();
