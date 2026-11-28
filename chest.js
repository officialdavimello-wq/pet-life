// Pet Life — baú surpresa: aparece de tempos em tempos no quarto; toque para ganhar um prêmio aleatório.
(function(){
"use strict";
const wrap=document.querySelector(".stagewrap");if(!wrap)return;
const el=document.createElement("button");el.id="chest";el.type="button";el.hidden=true;el.setAttribute("aria-label","Baú surpresa");wrap.append(el);
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),pick=a=>a[rnd(0,a.length-1)];
let t=0,hide=0;
const schedule=s=>{clearTimeout(t);t=setTimeout(spawn,s*1000)};
function spawn(){
 if(typeof data==="undefined"||!data||data.sleep||document.hidden){schedule(60);return}
 el.textContent=pick(["🎁","🥚","🧰"]);el.style.left=rnd(10,80)+"%";el.style.top=rnd(45,80)+"%";el.hidden=false;
 hide=setTimeout(()=>{el.hidden=true;schedule(rnd(180,360))},20000);
}
el.onclick=()=>{
 clearTimeout(hide);el.hidden=true;
 const big=Math.random()<.1,c=big?rnd(20,30):rnd(2,8),x=big?rnd(20,30):rnd(5,15);
 addXP(x);addCoins(c);save();
 notice((big?"✨ Prêmio raro! ":"")+"Você achou um baú! +"+x+" XP e +"+c+" moedas.");
 schedule(rnd(180,360));
};
schedule(rnd(60,120));
})();
