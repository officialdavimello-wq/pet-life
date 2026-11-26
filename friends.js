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
function profile(x){
 const p=$("friendProfile");p.innerHTML="";
 [["Perfil",x.nickname],["Pet",species(x.pet)],["Nome do pet",x.pet_name||species(x.pet)],["Nível",x.level]].forEach(([k,v],i)=>{
  const d=document.createElement("div"),b=document.createElement("b");d.className="nickline";
  b.textContent=String(v);d.append(i?k+": ":"",b);if(!i){d.textContent="";d.append(b)}p.append(d);
 });
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
 st.textContent=by("friend").length?"Toque no nome de um amigo para ver o perfil.":rows.length?"":"Você ainda não tem amigos. Adicione pelo apelido!";
 section("Pedidos recebidos",by("incoming"),x=>[["Aceitar",()=>call("petlife_friend_respond",{p_id:x.id,p_accept:true})],["Recusar",()=>call("petlife_friend_respond",{p_id:x.id,p_accept:false})]]);
 section("Amigos",by("friend"),x=>[["Remover",()=>confirm("Remover "+x.nickname+" dos amigos?")&&call("petlife_friend_remove",{p_id:x.id})]]);
 section("Pedidos enviados",by("outgoing"),x=>[["Cancelar",()=>call("petlife_friend_remove",{p_id:x.id})]]);
}
$("openFriends").onclick=()=>{$("friendsModal").hidden=false;load()};
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
})();
