// Pet Life — lanche marcado: 1 prêmio por janela de horário (manhã 6h–12h, noite 18h–24h).
(function(){
"use strict";
const box=document.getElementById("talkBox");if(!box)return;
const b=document.createElement("button");b.id="snackBtn";b.type="button";box.prepend(b);
function slot(){
 const d=new Date(),h=d.getHours(),day=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
 if(h>=6&&h<12)return{key:day+"m",name:"manhã"};
 if(h>=18)return{key:day+"n",name:"noite"};
 return null;
}
function upd(){
 if(typeof data==="undefined"||!data){b.hidden=true;return}
 b.hidden=false;const s=slot();
 if(!s){b.disabled=true;b.textContent="🍪 Próximo lanche às "+(new Date().getHours()<6?"6h":"18h");return}
 const got=data.snack===s.key;
 b.disabled=got;b.textContent=got?"🍪 Lanche da "+s.name+" pego! Volte mais tarde":"🍪 Lanche da "+s.name+": pegar!";
}
b.onclick=()=>{
 const s=slot();if(!data||!s||data.snack===s.key)return;
 if(data.sleep){notice("Seu pet está dormindo. Clique em Acordar primeiro.");return}
 data.snack=s.key;addXP(8);addCoins(3);save();startAnimation("feed");
 notice("Lanche da "+s.name+"! +8 XP e +3 moedas 🍪");upd();
};
upd();setInterval(upd,30000);
})();
