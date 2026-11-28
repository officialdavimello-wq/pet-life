// Pet Life — pet que fala: balões automáticos, reações às ações e conversa por botões (sem microfone).
(function(){
"use strict";
const $=id=>document.getElementById(id),bub=$("petBubble"),opts=$("talkOpts"),btn=$("talkBtn");
if(!bub||!opts||!btn)return;
const pick=a=>a[Math.floor(Math.random()*a.length)];
let hideT=0;
function say(t,ms){bub.textContent=t;bub.hidden=false;clearTimeout(hideT);hideT=setTimeout(()=>{bub.hidden=true},ms||5000)}
function mood(){
 const d=data;
 if(d.hunger<30)return pick(["Estou com fome... 🍖","Minha barriguinha está roncando!"]);
 if(d.thirst<30)return pick(["Estou com sede... 💧","Uma aguinha, por favor?"]);
 if(d.energy<25)return pick(["Estou com sono... 😴","Será que posso tirar uma soneca?"]);
 if(d.happy<30)return pick(["Brinca comigo? 🎾","Estou tristinho... me dá carinho?"]);
 return pick(["Que dia bom! ☀️","Gosto muito de você! 💛","Vamos brincar mais tarde?","Quer conversar comigo? 💬"]);
}
const R=[[/foi dormir/i,"Zzz... boa noite! 💤"],[/acordou/i,"Que soneca boa! ☀️"],[/comeu/i,"Nham nham! Delícia! 😋"],[/Água fresquinha/i,"Glub glub! Refrescante! 💧"],[/brincou/i,"Que divertido! 🎉"],[/banho/i,"Estou cheirosinho! 🛁"],[/carinho/i,"Que gostoso! 💛"]];
const n=$("notice");
if(n)new MutationObserver(()=>{const t=n.textContent;if(/foi dormir/i.test(t))closeChat();for(const[r,s]of R)if(r.test(t)){say(s,4000);return}}).observe(n,{childList:true,characterData:true,subtree:true});
const JOKES=["O que o pato disse para a pata? Vem quá! 🦆","Por que o livro de matemática ficou triste? Porque tinha muitos problemas! 📚","O que o tomate foi fazer no banco? Tirar extrato! 🍅","Qual é o animal mais antigo? A zebra, porque é em preto e branco! 🦓","Qual é o fim da picada? Quando o mosquito vai embora! 🦟"];
const FOODS=["ração","biscoitinho","bolo","frutas","cenoura","sementes"];
const POOL=[
 ["Oi!",()=>pick(["Oi! Que bom te ver! 💛","Oiê! Estava com saudade!"])],
 ["Como você está?",()=>{const d=data,w=[["fome",d.hunger],["sede",d.thirst],["sono",d.energy],["vontade de brincar",d.happy]].sort((a,b)=>a[1]-b[1])[0];return w[1]<40?"Estou com "+w[0]+"... 😕":"Estou ótimo! Obrigado por cuidar de mim! 😊"}],
 ["Conta uma piada",()=>pick(JOKES)],
 ["Quer brincar?",()=>data.energy<30?"Estou cansado... preciso dormir primeiro. 😴":"Bora! Clica em Brincar! 🎾"],
 ["Qual sua comida favorita?",()=>"Eu amo "+FOODS[[...String(data.pet)].reduce((a,c)=>a+c.charCodeAt(0),0)%FOODS.length]+"! 😋"],
 ["Te amo!",()=>pick(["Eu também te amo! 💛","Você é o melhor dono do mundo! 🥰"])]
];
function closeChat(){opts.hidden=true;btn.textContent="💬 Conversar"}
function show(){
 opts.innerHTML="";
 POOL.slice().sort(()=>Math.random()-.5).slice(0,4).forEach(([q,a])=>{const b=document.createElement("button");b.type="button";b.textContent=q;b.onclick=()=>{if(data.sleep){closeChat();return}say(a(),7000);show()};opts.append(b)});
 opts.hidden=false;btn.textContent="Fechar conversa";
}
btn.onclick=()=>{
 if(!data)return;
 if(!opts.hidden){closeChat();return}
 if(data.sleep){say("Shhh... estou dormindo 💤",3000);return}
 show()
};
setInterval(()=>{if(!data||document.hidden)return;say(data.sleep?"Zzz... 💤":mood(),4500)},30000);
setTimeout(()=>{if(!data)return;const h=new Date().getHours();say((h<12?"Bom dia":h<18?"Boa tarde":"Boa noite")+"! Que bom que você voltou! 💛",5000)},2500);
})();
