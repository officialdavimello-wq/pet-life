// Pet Life — PVP por turnos: cada rodada os dois escolhem uma ação ao mesmo tempo (atacar, defender, golpe forte ou habilidade
// do acessório/roupa equipado). Os dois aparelhos calculam o mesmo resultado (regras fixas + semente). Sem SQL novo.
(function(){
"use strict";
const cfg=window.PETLIFE_CONFIG||{},has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k),MAXR=12;
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const SK={
 laco:{n:"Laço de Seda",cd:3,d:"Prende o rival: ele perde o ataque do turno. Dano leve."},
 chapeu:{n:"Truque do Chapéu",cd:2,d:"Defende um pouco e devolve ao rival o dano que receber."},
 oculos:{n:"Mira Perfeita",cd:2,d:"Ataque crítico garantido (dano x1,7)."},
 capa:{n:"Esquiva Sombria",cd:3,d:"Desvia de todo dano e contra-ataca se o rival atacar."},
 coroa:{n:"Cura Real",cd:3,d:"Recupera 25% da vida máxima."},
 asas:{n:"Rajada Alada",cd:2,d:"Dano x1,3 que atravessa metade da defesa."},
 coleira:{n:"Fúria Encantada",cd:3,d:"Ataque leve e +50% de dano nos próximos 2 turnos."}
};
const FORTE={n:"Golpe Forte",cd:2,d:"Dano x1,5, mas você recebe +25% de dano no turno."};
const BASIC={atk:"Atacar",def:"Defender"};
const lab=k=>BASIC[k]||(k==="forte"?FORTE.n:has(SK,k)?SK[k].n:"Atacar");
const pwOf=p=>6+p.level*2+p.worn.filter(k=>has(clothes,k)).length*2+(p.worn.includes("asas")?2:0);
const valid=(S,P,i,k)=>k==="atk"||k==="def"||((k==="forte"||(has(SK,k)&&P[i].worn.includes(k)))&&!S.cd[i][k]);

function resolve(S,P,acts,rnd){
 const r=[rnd(),rnd()],a=[0,1].map(i=>valid(S,P,i,acts[i])?acts[i]:"atk");
 const base=[0,1].map(i=>Math.max(3,Math.round(S.pw[i]*(.8+r[i]*.4)*(S.fury[i]>0?1.5:1))));
 const out=[0,0],guard=[1,1],vuln=[1,1],pierce=[0,0],dodge=[0,0],refl=[0,0],heal=[0,0],stun=[0,0];
 [0,1].forEach(i=>{const k=a[i],b=base[i];
  if(k==="atk")out[i]=b;else if(k==="def")guard[i]=.4;else if(k==="forte"){out[i]=Math.round(b*1.5);vuln[i]=1.25}
  else if(k==="laco"){out[i]=Math.round(b*.6);stun[i]=1}else if(k==="chapeu"){refl[i]=1;guard[i]=.5}
  else if(k==="oculos")out[i]=Math.round(b*1.7);else if(k==="capa")dodge[i]=1;
  else if(k==="coroa")heal[i]=Math.round(S.mx[i]*.25);else if(k==="asas"){out[i]=Math.round(b*1.3);pierce[i]=1}
  else if(k==="coleira")out[i]=Math.round(b*.5)});
 const o2=[stun[1]?0:out[0],stun[0]?0:out[1]],dmg=[0,0];
 [0,1].forEach(i=>{const o=1-i;let g=guard[i];if(pierce[o])g=1-(1-g)*.5;dmg[i]=dodge[i]?0:Math.round(o2[o]*g*vuln[i])});
 const d0=[...dmg],hp0=[...S.hp];
 [0,1].forEach(i=>{const o=1-i;if(refl[i])dmg[o]+=d0[i];if(dodge[i]&&o2[o]>0)dmg[o]+=Math.round(base[i]*.5)});
 [0,1].forEach(i=>{
  S.hp[i]=Math.max(0,Math.min(S.mx[i],S.hp[i]-dmg[i]+heal[i]));
  for(const k in S.cd[i])S.cd[i][k]=Math.max(0,S.cd[i][k]-1);
  const k=a[i];if(k==="forte")S.cd[i].forte=FORTE.cd;else if(has(SK,k))S.cd[i][k]=SK[k].cd;
  S.fury[i]=k==="coleira"?2:Math.max(0,S.fury[i]-1)});
 return{a,dmg,heal,hp0,out:o2};
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
function finish(code,msg){ // code: 1 vitória, 0 empate, -1 derrota, 9 sem resultado
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
   if(res.heal[i]>0&&t>.3){g.fillStyle="#2f9e5b";g.fillText("+"+res.heal[i],x,y-100-(t-.3)*60)}
  }
  g.textAlign="left";
  const bx=s?380:20,hp=res?res.hp0[i]+(S.hp[i]-res.hp0[i])*Math.max(0,Math.min(1,(t-.4)/.35)):S.hp[i],v=hp/S.mx[i];
  g.fillStyle="#0003";g.fillRect(bx,16,240,16);g.fillStyle=v>.35?"#52c27a":"#e0476b";g.fillRect(bx,16,240*Math.max(0,v),16);
  g.fillStyle="#2b2b3a";g.font="bold 14px Arial";g.fillText(p.name+" "+Math.round(hp)+"/"+S.mx[i],bx,48);
  if(S.fury[i]>0){g.fillStyle="#e8841a";g.fillText("FÚRIA "+S.fury[i],bx,64)}
 });
 g.textAlign="center";g.fillStyle="#2b2b3a";g.font="bold 13px Arial";g.fillText("Rodada "+Math.min(duel.round,MAXR)+"/"+MAXR,320,24);g.textAlign="left";
}
function play(res,done){
 const t0=performance.now(),f=now=>{if(!duel||duel.over)return;const t=Math.min((now-t0)/1500,1);draw(t,res);if(t<1)requestAnimationFrame(f);else done()};
 requestAnimationFrame(f);
}
function buttons(){
 const box=$("duelActions");box.innerHTML="";
 const {S,P,my}=duel,list=[["atk","Atacar","Dano normal."],["def","Defender","Reduz o dano recebido em 60%."],["forte",FORTE.n,FORTE.d]];
 P[my].worn.forEach(k=>{if(has(SK,k))list.push([k,SK[k].n,SK[k].d])});
 list.forEach(([k,n,d])=>{
  const b=document.createElement("button"),w=S.cd[my][k]||0,s=document.createElement("small");
  b.type="button";b.textContent=n+(w?" ("+w+")":"");b.disabled=!!w;b.title=d;s.textContent=d;s.style.display="block";s.style.fontWeight="normal";
  b.append(s);b.onclick=()=>choose(k);box.append(b);
 });
}
function beginRound(){
 const d=duel;if(!d||d.over)return;
 d.round++;d.mine=null;d.left=20;buttons();say("Escolha sua ação ("+d.left+"s)");
 clearInterval(d.roundT);
 d.roundT=setInterval(()=>{if(d.mine||d.over)return;d.left--;if(d.left<=0)choose("atk");else say("Escolha sua ação ("+d.left+"s)")},1000);
}
function choose(k){
 const d=duel;if(!d||d.over||d.mine||d.busyAnim)return;
 if(!valid(d.S,d.P,d.my,k))k="atk";
 d.mine=k;clearInterval(d.roundT);
 [...$("duelActions").querySelectorAll("button")].forEach(b=>b.disabled=true);
 send("act",{r:d.round,a:k});say("Aguardando o rival escolher...");
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
  if(me<=0||op<=0||d.round>=MAXR){
   finish(me>op?1:me<op?-1:0,me>op?"Fim do duelo!":me<op?"Fim do duelo!":"Fim do duelo!");
  }else beginRound();
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
  S:{hp:[...mx],mx,pw:P.map(pwOf),cd:[{},{}],fury:[0,0]}};
 const d=duel;
 window.__plDuel.showDuel(P[my],P[1-my],"Conectando com "+P[1-my].name+"...");
 draw(0,null);
 try{
  d.ch=c.channel("petlife:duel:"+d.seed,{config:{broadcast:{self:false}}});
  d.ch.on("broadcast",{event:"hi"},onHi)
   .on("broadcast",{event:"act"},m=>{const p=m.payload;if(!duel||duel!==d||!p||!(p.r>=1&&p.r<=MAXR))return;d.their[p.r]=String(p.a||"atk").slice(0,12);tryResolve()})
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
