// Pet Life — amizades (usa as RPC de database/petlife_friends.sql). Carregado depois de account.js.
(function(){
"use strict";
const sb=window.__plsb,pets_=typeof pets!=="undefined"?pets:{};
const ERR={
 NO_AUTH:"Entre na sua conta (Conta / Online) para usar amigos.",
 NO_NICK:"Escolha seu apelido público antes de adicionar amigos.",
 FRIEND_NOT_FOUND:"Não achei ninguém com esse apelido.",
 FRIEND_SELF:"Você não pode adicionar a si mesmo.",
 FRIEND_ALREADY:"Vocês já são amigos.",
 FRIEND_SENT:"Você já enviou um pedido para essa pessoa."
};
function err(e){
 const m=String((e&&e.message)||e||""),c=e&&e.code;
 for(const k in ERR)if(m.indexOf(k)!==-1)return ERR[k];
 if(c==="PGRST202"||c==="42883"||/could not find the function|schema cache/i.test(m))return"Falta rodar o arquivo database/petlife_friends.sql no SQL Editor do Supabase.";
 return"Não consegui falar com o servidor agora. Tente de novo.";
}
const st=$("friendStatus"),box=$("friendList");
async function call(fn,args){
 const c=window.__plsb;if(!c){st.textContent=ERR.NO_AUTH;return null}
 const r=await c.rpc(fn,args);
 if(r.error){st.textContent=err(r.error);return null}
 return r;
}
const species=k=>Object.prototype.hasOwnProperty.call(pets_,k)?pets_[k].name:"Pet";
const brDate=iso=>{const d=new Date(iso);return isNaN(d)?"—":String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear()};
function profile(x){
 const p=$("friendProfile");p.innerHTML="";
 const h=document.createElement("b");h.textContent=String(x.nickname);p.append(h);
 [["No jogo desde",brDate(x.created_at)],["Pet",species(x.pet)],["Nome do pet",x.pet_name||species(x.pet)],["Nível do pet",x.level]].forEach(([k,v])=>{
  const d=document.createElement("div"),b=document.createElement("b");d.className="nickline";b.textContent=String(v);d.append(k+": ",b);p.append(d);
 });
 const bt=document.createElement("button");bt.type="button";bt.textContent="Desafiar para batalha";bt.onclick=()=>challengeFriend(x);p.append(bt);
 p.hidden=false;
}
function row(x,btns){
 const el=document.createElement("div"),n=document.createElement("span"),a=document.createElement("span"),s=document.createElement("small");
 el.className="brow frow";
 n.textContent=String(x.nickname);s.textContent=species(x.pet)+" · Nv "+x.level;n.append(s);
 if(x.kind==="friend"){n.style.cursor="pointer";n.onclick=()=>profile(x)}
 btns.forEach(([t,f])=>{const b=document.createElement("button");b.type="button";b.textContent=t;b.onclick=async()=>{b.disabled=true;await f();await load()};a.append(b)});
 el.append(n,a);return el;
}
function section(title,list,btns){
 if(!list.length)return;
 const h=document.createElement("b");h.textContent=title+" ("+list.length+")";box.append(h);
 list.forEach(x=>box.append(row(x,btns(x))));
}
async function load(){
 box.innerHTML="";$("friendProfile").hidden=true;st.textContent="Carregando...";
 const r=await call("petlife_friend_list");if(!r)return;
 const rows=Array.isArray(r.data)?r.data:[],by=k=>rows.filter(x=>x.kind===k);
 friendNicks=new Set(by("friend").map(x=>String(x.nickname).toLowerCase()));
 st.textContent=by("friend").length?"Toque no nome de um amigo para ver o perfil.":rows.length?"":"Você ainda não tem amigos. Adicione pelo apelido!";
 section("Pedidos recebidos",by("incoming"),x=>[["Aceitar",()=>call("petlife_friend_respond",{p_id:x.id,p_accept:true})],["Recusar",()=>call("petlife_friend_respond",{p_id:x.id,p_accept:false})]]);
 section("Amigos",by("friend"),x=>[["Remover",()=>confirm("Remover "+x.nickname+" dos amigos?")&&call("petlife_friend_remove",{p_id:x.id})]]);
 section("Pedidos enviados",by("outgoing"),x=>[["Cancelar",()=>call("petlife_friend_remove",{p_id:x.id})]]);
}
$("openFriends").onclick=()=>{$("friendsModal").hidden=false;start();load()};
$("friendAddToggle").onclick=()=>{const b=$("friendAddBox");b.hidden=!b.hidden;if(!b.hidden)$("friendNick").focus()};
$("friendsClose").onclick=()=>$("friendsModal").hidden=true;
$("friendsModal").addEventListener("click",e=>{if(e.target===$("friendsModal"))$("friendsModal").hidden=true});
$("friendAdd").onclick=async()=>{
 const v=$("friendNick").value.trim();if(!v)return;
 const b=$("friendAdd");b.disabled=true;
 const r=await call("petlife_friend_request",{p_nickname:v});
 b.disabled=false;if(!r)return;
 $("friendNick").value="";await load();
 st.textContent=(r.data&&r.data.status==="accepted"?"Vocês agora são amigos!":"Pedido enviado!");
};

// ---------- desafiar amigo para batalha (sem precisar de sala) ----------
// Cada jogador logado escuta uma "caixa de entrada" própria (canal do apelido). Só amigos são aceitos.
let myNick="",inbox=null,friendNicks=new Set(),out=null,inc=null;
const D=()=>window.__plDuel,low=v=>String(v||"").trim().toLowerCase(),chName=n=>"petlife:u:"+encodeURIComponent(low(n));
async function start(){
 const c=window.__plsb;if(!c||inbox)return;
 const r=await c.rpc("petlife_get_my_profile");
 if(inbox||r.error||!r.data||!r.data.has_nickname)return;
 myNick=String(r.data.nickname);
 const f=await c.rpc("petlife_friend_list");
 if(!f.error&&Array.isArray(f.data))friendNicks=new Set(f.data.filter(x=>x.kind==="friend").map(x=>low(x.nickname)));
 inbox=c.channel(chName(myNick),{config:{broadcast:{self:false}}});
 inbox.on("broadcast",{event:"fch"},m=>onCh(m.payload)).on("broadcast",{event:"fans"},m=>onAns(m.payload)).subscribe();
}
function stop(){if(inbox&&window.__plsb){try{window.__plsb.removeChannel(inbox)}catch(e){}}inbox=null;myNick="";friendNicks=new Set()}
function post(to,event,payload){
 const c=window.__plsb;if(!c)return;
 try{
  const t=c.channel(chName(to),{config:{broadcast:{self:false}}});
  t.subscribe(s=>{if(s==="SUBSCRIBED"){Promise.resolve(t.send({type:"broadcast",event,payload})).catch(()=>{});setTimeout(()=>{try{c.removeChannel(t)}catch(e){}},3000)}});
 }catch(e){}
}
function challengeFriend(x){
 const d=D();if(!d||!data)return;
 if(!inbox){st.textContent="Duelos indisponíveis agora. Confira se você está logado e tem apelido.";return}
 if(busy){st.textContent="Você já está em um duelo. Aguarde.";return}
 busy=true;
 const m=d.mine(),seed=Math.floor(Math.random()*2147483647),opp=d.clean({name:x.nickname,pet:x.pet,level:x.level}),mark={to:low(x.nickname),seed,opp,me:m};
 out=mark;post(x.nickname,"fch",{from:myNick,to:x.nickname,seed,p:m});
 $("friendsModal").hidden=true;d.showDuel(m,opp,"Aguardando "+opp.name+" aceitar o duelo...");
 setTimeout(()=>{if(out===mark){out=null;busy=false;$("arenaResult").textContent=opp.name+" não respondeu. Talvez esteja offline. Tente de novo!"}},20000);
}
function onCh(pl){
 const d=D();if(!pl||!d||!data||!myNick)return;
 const from=low(pl.from);
 if(low(pl.to)!==low(myNick)||!friendNicks.has(from))return;
 const reply=ok=>post(from,"fans",{from:myNick,to:from,ok,p:ok?d.mine():undefined});
 if(busy){reply(false);return}
 busy=true;
 const a=d.clean(pl.p);a.name=String(pl.from).trim().slice(0,14);
 const mark={seed:parseInt(pl.seed)||1,opp:a};inc=mark;
 d.showDuel(d.mine(),a,a.name+" te desafiou para um duelo!");
 const box=$("duelActions"),y=document.createElement("button"),n=document.createElement("button");
 y.textContent="Aceitar";n.textContent="Recusar";
 y.onclick=()=>{if(inc!==mark)return;inc=null;reply(true);d.run(mark.opp,d.mine(),mark.seed,false)};
 n.onclick=()=>{if(inc!==mark)return;inc=null;busy=false;reply(false);box.innerHTML="";$("arena").hidden=true};
 box.append(y,n);
 setTimeout(()=>{if(inc===mark){inc=null;busy=false;box.innerHTML="";$("arenaResult").textContent="O desafio expirou."}},25000);
}
function onAns(pl){
 const d=D();if(!pl||!d||!out||!myNick)return;
 if(low(pl.to)!==low(myNick)||low(pl.from)!==out.to)return;
 const o=out;out=null;
 if(!pl.ok){busy=false;$("arenaResult").textContent=o.opp.name+" não pode duelar agora.";return}
 const b=d.clean(pl.p);b.name=o.opp.name;
 d.run(d.clean(o.me),b,o.seed,true);
}
if(window.__plsb)window.__plsb.auth.onAuthStateChange((ev,ses)=>{if(ses&&ses.user)setTimeout(start,0);else stop()});
})();
