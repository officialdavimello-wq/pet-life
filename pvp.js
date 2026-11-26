// Pet Life — PvP simplificado: ataque básico, defesa, golpe próprio de cada espécie
// e habilidades de alguns equipamentos. Sem efeitos de status ou descrições na arena.
(function(){
"use strict";
const cfg=window.PETLIFE_CONFIG||{},has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),MAXR=10;
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const ANIMAL={
 parrot:{n:"Bicada",m:1.6,cd:2},
 guinea:{n:"Mordida",m:1.5,cd:2},
 hamster:{n:"Investida",m:1.5,cd:2},
 dog:{n:"Mordida forte",m:1.7,cd:2},
 cat:{n:"Arranhão",m:1.55,cd:2},
 rabbit:{n:"Coice",m:1.6,cd:2}
};
const GEAR={
 chapeu:{n:"Impacto real",m:1.8,cd:3},
 capa:{n:"Investida sombria",m:1.75,cd:3},
 asas:{n:"Rajada alada",m:1.7,cd:3}
};
const BASIC={atk:"Atacar",def:"Defender"};
const kindOf=p=>(pets[p.pet]&&pets[p.pet].kind)||"hamster";
const animalOf=p=>ANIMAL[kindOf(p)]||ANIMAL.hamster;
const gearOf=p=>Object.keys(GEAR).filter(k=>Array.isArray(p.worn)&&p.worn.includes(k));
const lab=k=>BASIC[k]||(k==="animal"?"Golpe do pet":k.startsWith("gear:")&&GEAR[k.slice(5)]?GEAR[k.slice(5)].n:"Atacar");
const power=p=>Math.max(4,6+p.level*2+(Array.isArray(p.worn)?p.worn.filter(k=>["laco","chapeu","oculos","capa","coroa","asas","coleira"].includes(k)).length:0));
const valid=(S,P,i,k)=>{
 if(k==="atk"||k==="def")return true;
 if(k==="animal")return !S.cd[i].animal;
 if(k.startsWith("gear:")){const id=k.slice(5);return !!GEAR[id]&&P[i].worn.includes(id)&&!S.cd[i][k]}
 return false;
};
function resolve(S,P,acts,rnd){
 const roll=[rnd(),rnd()],a=[0,1].map(i=>valid(S,P,i,acts[i])?acts[i]:"atk");
 const out=[0,0],guard=[1,1],hp0=[...S.hp];
 [0,1].forEach(i=>{
  const k=a[i],b=Math.max(4,Math.round(S.pw[i]*(.9+roll[i]*.2)));
  if(k==="atk")out[i]=b;
  else if(k==="def")guard[i]=.5;
  else if(k==="animal")out[i]=Math.round(b*animalOf(P[i]).m);
  else if(k.startsWith("gear:"))out[i]=Math.round(b*GEAR[k.slice(5)].m);
 });
 const dmg=[0,0];
 [0,1].forEach(i=>{const o=1-i;dmg[i]=Math.round(out[o]*guard[i])});
 [0,1].forEach(i=>{
  S.hp[i]=Math.max(0,S.hp[i]-dmg[i]);
  for(const k in S.cd[i])S.cd[i][k]=Math.max(0,S.cd[i][k]-1);
  if(a[i]==="animal")S.cd[i].animal=animalOf(P[i]).cd;
  else if(a[i].startsWith("gear:"))S.cd[i][a[i]]=GEAR[a[i].slice(5)].cd;
 });
 return{a,dmg,hp0,out};
}
let duel=null;
const say=t=>{$("arenaResult").textContent=t};
const earn=(x,c)=>{if(!data)return;gain(x,c);save()};
function cleanup(){
 if(!duel)return;
 clearInterval(duel.hiT);clearInterval(duel.roundT);clearTimeout(duel.waitT);clearTimeout(duel.connT);
 const c=window.__plsb;if(duel.ch&&c){try{c.removeChannel(duel.ch)}catch(e){}}
}
function send(ev,pl){if(duel&&duel.ch)Promise.resolve(duel.ch.send({type:"broadcast",event:ev,payload:pl})).catch(()=>{})}
function finish(code,msg){
 if(!duel||duel.over)return;
 const d=duel;d.over=true;cleanup();busy=0;
 let txt=msg;
 if(code===1){txt+=" Você venceu! +40 XP e +10 moedas";earn(40,10)}
 else if(code===0){txt+=" Empate! +25 XP e +5 moedas";earn(25,5)}
 else if(code===-1){txt+=" Você perdeu desta vez. +12 XP e +2 moedas pela experiência";earn(12,2)}
 say(txt);
 const box=$("duelActions");box.innerHTML="";
 const b=document.createElement("button");b.textContent="Fechar";b.onclick=()=>{$("arena").hidden=true;box.innerHTML=""};box.append(b);
 draw(1,null);
}
function draw(t,res){
 if(!duel)return;
 const g=$("battle").getContext("2d"),{P,S,my}=duel,y=190+Math.sin(performance.now()/200)*2;
 g.imageSmoothingEnabled=false;g.globalAlpha=1;
 g.fillStyle="#bfe3f0";g.fillRect(0,0,640,260);g.fillStyle="#cfe8c6";g.fillRect(0,170,640,90);g.fillStyle="#9ccf8f";for(let x=0;x<640;x+=40)g.fillRect(x,215+(x/40%2)*10,20,6);
 [my,1-my].forEach((i,s)=>{
  const p=P[i],dir=s?-1:1;let x=s?490:150;
  if(res&&t>.1&&t<.5&&res.out[i]>0)x+=Math.sin((t-.1)/.4*Math.PI)*90*dir;
  if(res&&res.dmg[i]>0&&t>.4&&t<.75)x+=Math.sin(t*90)*6;
  if(!s)drawPet(g,p.pet,x,y,1.5,p.worn,p.level);else{g.save();g.translate(x,0);g.scale(-1,1);drawPet(g,p.pet,0,y,1.5,p.worn,p.level);g.restore()}
  g.textAlign="center";
  if(res){
   if(t<.6){g.font="bold 14px Arial";g.lineWidth=3;g.strokeStyle="#fff";g.fillStyle="#2b2b3a";g.strokeText(lab(res.a[i]),x,y-125);g.fillText(lab(res.a[i]),x,y-125)}
   g.font="bold 28px Arial";
   if(res.dmg[i]>0&&t>.4){g.fillStyle="#e0476b";g.fillText("-"+res.dmg[i],x,y-100-(t-.4)*60)}
  }
  g.textAlign="left";
  const bx=s?380:20,hp=res?res.hp0[i]+(S.hp[i]-res.hp0[i])*Math.max(0,Math.min(1,(t-.4)/.35)):S.hp[i],v=hp/S.mx[i];
  g.fillStyle="#0003";g.fillRect(bx,16,240,16);g.fillStyle=v>.35?"#52c27a":"#e0476b";g.fillRect(bx,16,240*Math.max(0,v),16);
  g.fillStyle="#2b2b3a";g.font="bold 14px Arial";g.fillText(p.name+" "+Math.round(hp)+"/"+S.mx[i],bx,48);
 });
 g.textAlign="center";g.fillStyle="#2b2b3a";g.font="bold 13px Arial";g.fillText("Rodada "+Math.min(duel.round,MAXR)+"/"+MAXR,320,24);g.textAlign="left";
}
function play(res,done){
 const t0=performance.now(),f=now=>{if(!duel||duel.over)return;const t=Math.min((now-t0)/1100,1);draw(t,res);if(t<1)requestAnimationFrame(f);else done()};
 requestAnimationFrame(f);
}
function buttons(){
 const box=$("duelActions");box.innerHTML="";
 const {S,P,my}=duel,p=P[my],animal=animalOf(p);
 const list=[["atk","Atacar"],["def","Defender"],["animal",animal.n]];
 gearOf(p).forEach(k=>list.push(["gear:"+k,GEAR[k].n]));
 list.forEach(([k,n])=>{
  const b=document.createElement("button"),w=S.cd[my][k]||0,s=document.createElement("small");
  b.type="button";b.className="duel-action";b.textContent=n+(w?" · "+w:"");b.disabled=!!w;
  if(k==="animal"&&w)b.title="Disponível em "+w+" rodada(s)";
  if(k.startsWith("gear:")&&w)b.title="Disponível em "+w+" rodada(s)";
  b.onclick=()=>choose(k);box.append(b);
 });
}
function beginRound(){
 const d=duel;if(!d||d.over)return;
 d.round++;d.mine=null;d.left=20;buttons();say("Escolha sua ação · "+d.left+"s");
 clearInterval(d.roundT);
 d.roundT=setInterval(()=>{if(d.mine||d.over)return;d.left--;if(d.left<=0)choose("atk");else say("Escolha sua ação · "+d.left+"s")},1000);
}
function choose(k){
 const d=duel;if(!d||d.over||d.mine||d.busyAnim)return;
 if(!valid(d.S,d.P,d.my,k))k="atk";
 d.mine=k;clearInterval(d.roundT);
 [...$("duelActions").querySelectorAll("button")].forEach(b=>b.disabled=true);
 send("act",{r:d.round,a:k});say("Aguardando o rival...");
 clearTimeout(d.waitT);const r=d.round;
 d.waitT=setTimeout(()=>{if(duel===d&&!d.over&&d.round===r&&!d.their[r])finish(1,"O rival desconectou.")},30000);
 tryResolve();
}
function tryResolve(){
 const d=duel;if(!d||d.over||d.busyAnim||!d.mine||!d.their[d.round])return;
 clearTimeout(d.waitT);d.busyAnim=true;
 const acts=[0,0];acts[d.my]=d.mine;acts[1-d.my]=d.their[d.round];
 const res=resolve(d.S,d.P,acts,rng((d.seed+d.round*7919)|0));
 $("duelActions").innerHTML="";
 say(d.P[d.my].name+": "+lab(res.a[d.my])+" · "+d.P[1-d.my].name+": "+lab(res.a[1-d.my]));
 play(res,()=>{
  d.busyAnim=false;if(d.over)return;
  draw(1,null);
  const h=d.S.hp,me=h[d.my],op=h[1-d.my];
  if(me<=0||op<=0||d.round>=MAXR)finish(me>op?1:me<op?-1:0,"Fim do duelo!");
  else beginRound();
 });
}
function onHi(){
 const d=duel;if(!d||d.over)return;
 if(!d.gotHi){d.gotHi=true;clearInterval(d.hiT);clearTimeout(d.connT);send("hi",{});beginRound()}
}
function start(A,B,seed,iAmA){
 const c=window.__plsb||(window.supabase&&cfg.SUPABASE_URL&&cfg.SUPABASE_KEY?(window.__plsb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_KEY)):null);
 if(!c||duel&&!duel.over)return false;
 const P=[A,B],my=iAmA?0:1,mx=P.map(p=>60+p.level*8);
 duel={P,my,seed:parseInt(seed)||1,round:0,mine:null,their:{},over:false,gotHi:false,busyAnim:false,
  S:{hp:[...mx],mx,pw:P.map(power),cd:[{},{}]}};
 const d=duel;
 window.__plDuel.showDuel(P[my],P[1-my],"Conectando com "+P[1-my].name+"...");
 draw(0,null);
 try{
  d.ch=c.channel("petlife:duel:"+d.seed,{config:{broadcast:{self:false}}});
  d.ch.on("broadcast",{event:"hi"},onHi)
   .on("broadcast",{event:"act"},m=>{const p=m.payload;if(!duel||duel!==d||!p||!(p.r>=1&&p.r<=MAXR))return;d.their[p.r]=String(p.a||"atk").slice(0,24);tryResolve()})
   .on("broadcast",{event:"bye"},()=>{if(duel===d)finish(1,"O rival saiu do duelo.")})
   .subscribe(s=>{
    if(s==="SUBSCRIBED"){send("hi",{});d.hiT=setInterval(()=>send("hi",{}),800)}
    else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT")finish(9,"Não consegui conectar o duelo. Verifique a internet e o Realtime do Supabase.");
   });
 }catch(e){finish(9,"Não consegui conectar o duelo.");return true}
 d.connT=setTimeout(()=>{if(duel===d&&!d.gotHi)finish(9,"O rival não conectou ao duelo.")},15000);
 return true;
}
$("arenaClose").addEventListener("click",()=>{if(duel&&!duel.over){send("bye",{});finish(-1,"Você saiu do duelo.")}});
start.resolve=resolve;start.rng=rng;
window.__plPvp=start;
})();