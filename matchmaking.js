// Pet Life — "Buscar partida online" sem sala: quem está procurando batalha aparece num lobby global e é pareado.
// Carregado depois de friends.js. Não precisa de SQL novo (usa Supabase Realtime).
(function(){
"use strict";
const cfg=window.PETLIFE_CONFIG||{},CH="petlife:matchmaking",D=()=>window.__plDuel;
const id=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Math.random()).slice(2)+Date.now();
let ch=null,searching=false,pending=null,timer=null,myName="";
const say=t=>{$("arenaResult").textContent=t};
function sbc(){
 if(window.__plsb)return window.__plsb;
 if(!window.supabase||!cfg.SUPABASE_URL||!cfg.SUPABASE_KEY)return null;
 try{return window.__plsb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_KEY)}catch(e){return null}
}
function me(){const m=D().mine();if(myName)m.name=myName.slice(0,14);m.id=id;return m}
function stop(msg){
 const c=window.__plsb;
 if(ch&&c){try{c.removeChannel(ch)}catch(e){}}
 ch=null;pending=null;clearTimeout(timer);
 if(searching){searching=false;busy=0}
 if(msg)say(msg);
 $("duelActions").innerHTML="";
}
function matched(){const c=window.__plsb;if(ch&&c){try{c.removeChannel(ch)}catch(e){}}ch=null;pending=null;clearTimeout(timer);searching=false;$("duelActions").innerHTML=""}
function look(){
 if(!ch||!searching||pending)return;
 const st=ch.presenceState(),ids=Object.keys(st).filter(k=>k!==id&&k>id&&st[k]&&st[k][0]).sort();
 if(!ids.length)return; // só o de id menor desafia, para os dois não se desafiarem juntos
 const to=ids[0],d=D(),m=me(),seed=Math.floor(Math.random()*2147483647),mark={to,seed,m};
 pending=mark;
 ch.send({type:"broadcast",event:"mmch",payload:{from:id,to,seed,p:m}});
 setTimeout(()=>{if(pending===mark){pending=null;look()}},4000);
}
async function onCh(pl){
 const d=D();
 if(!pl||!searching||!ch||pl.to!==id)return;
 const source=ch;
 if(pending){
  try{await source.send({type:"broadcast",event:"mmans",payload:{from:id,to:pl.from,ok:false}})}catch(e){}
  return;
 }
 const a=d.clean(pl.p),m=me(),mark={incoming:true,from:pl.from};
 pending=mark; // evita aceitar duas solicitações ao mesmo tempo
 let status="error";
 try{status=await source.send({type:"broadcast",event:"mmans",payload:{from:id,to:pl.from,ok:true,p:m}})}catch(e){}
 // Só inicia a batalha se a confirmação realmente saiu pelo Realtime.
 if(ch!==source||!searching||pending!==mark)return;
 if(status!=="ok") {stop("Não consegui confirmar a partida. Tente buscar novamente.");return}
 matched();d.run(a,d.clean(m),parseInt(pl.seed)||1,false);
}
function onAns(pl){
 const d=D();
 if(!pl||!searching||!pending||pl.to!==id||pl.from!==pending.to)return;
 const o=pending;pending=null;
 if(!pl.ok){setTimeout(look,1500);return}
 const b=d.clean(pl.p);
 matched();d.run(d.clean(o.m),b,o.seed,true);
}
async function nick(){
 try{
  const c=window.__plsb;if(!c)return"";
  const r=await c.rpc("petlife_get_my_profile");
  return(!r.error&&r.data&&r.data.has_nickname)?String(r.data.nickname):"";
 }catch(e){return""}
}
async function search(){
 $("battleMenuModal").hidden=true;
 const d=D(),c=sbc();
 if(!c||!d){notice("Não consegui conectar ao servidor. Confira o config.js e o supabase.js.");return}
 if(!data){notice("Escolha seu pet primeiro.");return}
 if(busy||searching){notice("Você já está em uma batalha. Aguarde.");return}
 busy=1;searching=true;
 $("arena").hidden=false;$("fighters").innerHTML="";$("duelActions").innerHTML="";say("Procurando um oponente online...");
 const b=document.createElement("button");b.textContent="Cancelar busca";b.onclick=()=>{stop();$("arena").hidden=true};$("duelActions").append(b);
 myName=await nick();
 if(!searching)return;
 ch=c.channel(CH,{config:{presence:{key:id},broadcast:{self:false}}});
 ch.on("presence",{event:"sync"},look).on("broadcast",{event:"mmch"},m=>onCh(m.payload)).on("broadcast",{event:"mmans"},m=>onAns(m.payload));
 ch.subscribe(s=>{
  if(s==="SUBSCRIBED"){Promise.resolve(ch&&ch.track(me())).catch(()=>{})}
  else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT"){stop("Não consegui conectar. Verifique a internet e se o Realtime está ativo no Supabase.")}
 });
 timer=setTimeout(()=>{if(searching)stop("Ninguém está procurando batalha agora. Tente de novo em instantes!")},60000);
}
$("findMatch").onclick=search;
$("arenaClose").addEventListener("click",()=>{if(searching)stop()});
})();
