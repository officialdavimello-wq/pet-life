// Pet Life — diário do pet: ao voltar após um tempo fora, mostra o que o pet fez enquanto você estava longe.
(function(){
"use strict";
const KEY="petlife_lastseen",MIN=15*60000;
const get=()=>{try{return Number(localStorage.getItem(KEY))||0}catch(e){return 0}};
const mark=()=>{try{localStorage.setItem(KEY,String(Date.now()))}catch(e){}};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const away=get();mark();
setInterval(mark,20000);
document.addEventListener("visibilitychange",()=>{if(document.hidden)mark()});
addEventListener("pagehide",mark);
setTimeout(()=>{
 if(!away||typeof data==="undefined"||!data)return;
 const ms=Date.now()-away;if(ms<MIN)return;
 const n=data.petName||"Seu pet",h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60;
 const when=h>=24?Math.floor(h/24)+" dia(s)":h>0?h+" h "+m+" min":m+" min";
 const L=["tirou uma soneca no cantinho. 😴","brincou sozinho com uma bolinha. 🎾","olhou pela janela e viu passarinhos. 🐦","encontrou uma pedrinha brilhante. ✨","arrumou a caminha. 🛏️","sentiu sua falta e ficou perto da porta. 💛","fez uma dancinha. 💃","cheirou as flores do jardim. 🌼","sonhou com biscoitos. 🍪"];
 const ev=L.slice().sort(()=>Math.random()-.5).slice(0,Math.min(4,1+Math.floor(ms/7200000))).map(t=>n+" "+t);
 ev.push(data.hunger<30?"Mas ficou com fome esperando você. 🍖":data.thirst<30?"Mas ficou com sede esperando você. 💧":data.energy<25?"No fim, estava bem cansadinho. 😴":"E ficou bem tranquilo até você voltar! 😊");
 const box=document.createElement("div"),c=document.createElement("div"),e=document.createElement("div"),t=document.createElement("h2"),p=document.createElement("p"),ul=document.createElement("ul"),ok=document.createElement("button");
 box.className="modal";c.className="modalbox";e.className="eyebrow";e.textContent="ENQUANTO VOCÊ ESTAVA FORA";
 t.textContent="Diário de "+n;p.textContent="Você ficou fora por "+when+".";ul.id="diaryList";
 ev.forEach(x=>{const li=document.createElement("li");li.textContent=x;ul.append(li)});
 ok.id="diaryOk";ok.type="button";ok.textContent="Que bom, voltei!";ok.onclick=()=>box.remove();
 c.append(e,t,p,ul,ok);box.append(c);box.addEventListener("click",x=>{if(x.target===box)box.remove()});
 document.body.append(box);
},1200);
})();
