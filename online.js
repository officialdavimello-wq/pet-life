// Pet Life — multiplayer online (Supabase Realtime: presença + duelos)
// Carregado depois de config.js, supabase.js e game.js.
(function(){
"use strict";
const cfg=window.PETLIFE_CONFIG||{},OKEY="petlife-online-v1";
const me={id:(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Math.random()).slice(2)+Date.now()};
let sb=null,ch=null,connected=false,peers={},out=null,incoming=null;
let saved={};try{saved=JSON.parse(localStorage.getItem(OKEY)||"{}")}catch(e){}
const say=t=>{$("onlineStatus").textContent=t};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const okPet=k=>Object.prototype.hasOwnProperty.call(pets,k);
// tudo que vem de outros jogadores é tratado como não confiável
const clean=p=>({id:String((p&&p.id)||"").slice(0,64),name:String((p&&p.name)||"Jogador").slice(0,14),pet:(p&&okPet(p.pet))?p.pet:"luna",level:Math.max(1,Math.min(999,parseInt(p&&p.level)||1)),worn:[...new Set(Array.isArray(p&&p.worn)?p.worn:[])].filter(k=>Object.prototype.hasOwnProperty.call(wearables,k)).slice(0,7)});
const mine=()=>({id:me.id,name:($("nick").value.trim().slice(0,14))||"Jogador",pet:data.pet,level:data.level,worn:data.worn||[]});
const rng=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};

function client(){
 if(sb)return sb;
 if(!window.supabase||!cfg.SUPABASE_URL||!cfg.SUPABASE_KEY)return null;
 try{sb=window.__plsb||(window.__plsb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_KEY))}catch(e){console.error(e)}
 return sb;
}
function track(){if(ch&&connected&&data)Promise.resolve(ch.track(mine())).catch(()=>{})}
function send(event,payload){if(ch)Promise.resolve(ch.send({type:"broadcast",event:event,payload:payload})).catch(()=>{})}
function ui(){const on=!!ch;$("connect").textContent=on?"Sair da sala":"Entrar online";$("nick").disabled=on;$("room").disabled=on}

function list(){
 const box=$("players");box.innerHTML="";
 if(!ch)return;
 const ids=Object.keys(peers);
 if(!ids.length){box.textContent="Ninguém mais na sala ainda. Mande o link e o código para a família!";return}
 ids.forEach(id=>{
  const p=peers[id],r=document.createElement("div"),s=document.createElement("span"),b=document.createElement("button");
  r.className="row";s.textContent=p.name+" · "+pets[p.pet].name+" · Nv "+p.level;
  b.textContent="Desafiar";b.onclick=()=>challenge(id);
  r.append(s,b);box.append(r);
 });
}

function join(){
 const c=client();
 if(!c){say("Não consegui carregar o Supabase. Confira o config.js e o supabase.js.");return}
 if(!data){say("Escolha seu pet primeiro, depois entre online.");return}
 const name=$("nick").value.trim().slice(0,14),r=$("room").value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,"").slice(0,20);
 if(!name||!r){say("Preencha o apelido e o código da sala (letras e números).");return}
 try{localStorage.setItem(OKEY,JSON.stringify({name:name,room:r}))}catch(e){}
 ch=c.channel("petlife:"+r,{config:{presence:{key:me.id},broadcast:{self:false}}});
 ch.on("presence",{event:"sync"},()=>{
  peers={};const state=ch.presenceState();
  Object.keys(state).forEach(k=>{if(k!==me.id&&state[k]&&state[k][0]){const p=clean(state[k][0]);p.id=k;peers[k]=p}});
  list();if(data)drawRoom();
 });
 ch.on("broadcast",{event:"challenge"},m=>onChallenge(m.payload));
 ch.on("broadcast",{event:"answer"},m=>onAnswer(m.payload));
 say("Conectando...");
 ch.subscribe(s=>{
  if(s==="SUBSCRIBED"){connected=true;track();say("Online na sala \""+r+"\". Desafie alguém para um duelo!");ui()}
  else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT"){say("Não consegui conectar. Verifique a internet e se o Realtime está ativo no Supabase.");leave(true)}
 });
 ui();
}
function leave(keep){
 if(ch&&sb){try{sb.removeChannel(ch)}catch(e){}}
 ch=null;connected=false;peers={};out=null;incoming=null;busy=false;
 if(!keep)say("Você saiu da sala.");
 list();ui();if(data)drawRoom();
}

// ---------- duelos ----------
function showDuel(a,b,txt){
 $("arena").hidden=false;
 $("fighters").innerHTML="<b>"+esc(a.name)+" ("+esc(pets[a.pet].name)+") · Nível "+a.level+"</b><span> VS </span><b>"+esc(b.name)+" ("+esc(pets[b.pet].name)+") · Nível "+b.level+"</b>";
 $("arenaResult").textContent=txt;$("duelActions").innerHTML="";
}
const earn=(x,c)=>{if(!data)return;gain(x,c);save()};
function run(A,B,seed,iAmA){ // os dois aparelhos simulam a mesma luta (mesma semente) e animam ao vivo
 A=clean(A);B=clean(B);const o=sim(A,B,rng(seed),!iAmA),opp=iAmA?B:A,m=iAmA?A:B;
 showDuel(m,opp,"Duelo em andamento...");
 anim(m,opp,o,()=>{busy=false;$("arenaResult").textContent=o.win?"Você venceu "+opp.name+"! +40 XP e +10 moedas":opp.name+" venceu desta vez. +12 XP e +2 moedas pela experiência.";earn(o.win?40:12,o.win?10:2)});
}
function challenge(id){
 const p=peers[id];
 if(!ch||!connected||!p||!data)return;
 if(busy){say("Você já está em um duelo. Aguarde.");return}
 busy=true;
 const m=mine(),seed=Math.floor(Math.random()*2147483647),mark={to:id,seed:seed,opp:p,me:m};
 out=mark;send("challenge",{from:me.id,to:id,seed:seed,p:m});
 $("modal").hidden=true;showDuel(m,p,"Aguardando "+p.name+" aceitar o duelo...");
 setTimeout(()=>{if(out===mark){out=null;busy=false;$("arenaResult").textContent=p.name+" não respondeu. Tente de novo!"}},20000);
}
function onChallenge(pl){
 if(!pl||pl.to!==me.id||!data||!connected)return;
 const a=clean(pl.p);a.id=String(pl.from||"").slice(0,64);
 if(busy){send("answer",{from:me.id,to:a.id,ok:false});return}
 busy=true;
 const mark={from:a.id,seed:parseInt(pl.seed)||1,opp:a};incoming=mark;
 showDuel(mine(),a,a.name+" te desafiou para um duelo!");
 const d=$("duelActions"),y=document.createElement("button"),n=document.createElement("button");
 y.textContent="Aceitar";n.textContent="Recusar";
 y.onclick=()=>{if(incoming!==mark)return;incoming=null;const mm=mine();send("answer",{from:me.id,to:mark.from,ok:true,p:mm});run(mark.opp,mm,mark.seed,false)};
 n.onclick=()=>{if(incoming!==mark)return;incoming=null;busy=false;send("answer",{from:me.id,to:mark.from,ok:false});d.innerHTML="";$("arena").hidden=true};
 d.append(y,n);
 setTimeout(()=>{if(incoming===mark){incoming=null;busy=false;d.innerHTML="";$("arenaResult").textContent="O desafio expirou."}},25000);
}
function onAnswer(pl){
 if(!pl||pl.to!==me.id||!out||pl.from!==out.to)return;
 const o=out;out=null;
 if(!pl.ok){busy=false;$("arenaResult").textContent=o.opp.name+" não pode duelar agora.";return}
 const b=clean(pl.p);b.id=o.to;
 run(clean(o.me),b,o.seed,true);
}

// ---------- pets dos outros jogadores aparecem no seu quarto ----------
const POS=[[135,305],[505,305],[70,300],[570,300]];
function drawPeers(){
 const c=$("world");if(!c||!data)return;
 const ctx=c.getContext("2d");
 Object.keys(peers).slice(0,POS.length).forEach((id,i)=>{
  const p=peers[id],x=POS[i][0],y=POS[i][1],t=p.name+" · Nv "+p.level;
  drawPet(ctx,p.pet,x,y,.8,p.worn);
  ctx.font="bold 13px Arial";ctx.textAlign="center";
  const w=ctx.measureText(t).width;
  pixel(ctx,x-w/2-6,y-72,w+12,20,"#45352fcc");ctx.fillStyle="#fff";ctx.fillText(t,x,y-57);ctx.textAlign="left";
 });
}
const _draw=drawRoom;drawRoom=function(){_draw();drawPeers()};
const _save=save;save=function(){_save();track()};

// ---------- botões ----------
$("nick").value=saved.name||"";$("room").value=saved.room||"";
$("connect").onclick=()=>ch?leave():join();
$("account").addEventListener("click",()=>{if(!data&&!ch)say("Escolha seu pet primeiro, depois entre online.");list();ui()});
$("findMatch").onclick=()=>{
 if(!ch||!connected){$("account").click();return}
 const ids=Object.keys(peers);
 if(!ids.length){notice("Ninguém mais está online na sala agora. Chame a família!");return}
 challenge(ids[Math.floor(Math.random()*ids.length)]);
};
$("share").onclick=async()=>{
 const url=location.href;
 if(location.protocol==="file:"){
  notice("Publique o jogo primeiro para compartilhar um link que outras pessoas possam abrir.");
  return;
 }
 if(navigator.share){
  try{
   await navigator.share({title:"Pet Life",text:"Venha jogar Pet Life comigo! Entre na mesma sala para jogarmos juntos.",url});
   return;
  }catch(e){
   if(e&&e.name==="AbortError")return;
  }
 }
 try{
  if(navigator.clipboard&&window.isSecureContext){
   await navigator.clipboard.writeText(url);
   notice("Link copiado! Agora você pode enviar pelo WhatsApp ou outro aplicativo.");
   return;
  }
  const field=document.createElement("textarea");
  field.value=url;field.setAttribute("readonly","");
  field.style.position="fixed";field.style.opacity="0";
  document.body.appendChild(field);field.select();
  const copied=document.execCommand("copy");field.remove();
  if(copied){notice("Link copiado! Agora você pode enviar pelo WhatsApp ou outro aplicativo.");return;}
 }catch(e){}
 window.prompt("Copie o link do Pet Life para compartilhar:",url);
};
})();
