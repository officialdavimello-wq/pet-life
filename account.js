// Pet Life — login (e-mail + senha) e salvamento na nuvem (Supabase Auth + tabela petlife_saves)
// Carregado depois de game.js e online.js. Precisa da tabela criada com database/petlife_schema.sql.
(function(){
"use strict";
const cfg=window.PETLIFE_CONFIG||{},OWN="petlife-owner-v1",TABLE="petlife_saves";
let sb=null,uid=null,email="",timer=null,nickname=null,nextCost=0,nickBusy=false;
const authSay=t=>{$("authStatus").textContent=t};
const score=s=>s.level*100+s.xp;
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);

function client(){
 if(sb)return sb;
 if(!window.supabase||!cfg.SUPABASE_URL||!cfg.SUPABASE_KEY)return null;
 try{sb=window.__plsb||(window.__plsb=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_KEY))}catch(e){console.error(e)}
 return sb;
}
// valida/limpa um save vindo da nuvem antes de usar
function norm(s){
 if(!s||typeof s!=="object"||!has(pets,s.pet))return null;
 const n=(v,a,b,d)=>{v=Number(v);return Number.isFinite(v)?Math.max(a,Math.min(b,Math.round(v))):d};
 const inv={};for(const k in foods)inv[k]=n(s.inv&&s.inv[k],0,999,0);for(const k in potions)inv[k]=n(s.inv&&s.inv[k],0,999,0);
 const own=Array.isArray(s.own)?[...new Set(s.own)].filter(k=>has(clothes,k)):[];
 const accessoriesOwned=Array.isArray(s.accessories)?[...new Set(s.accessories)].filter(k=>has(accessories,k)):[];
 const toysOwned=Array.isArray(s.toys)?[...new Set(s.toys)].filter(k=>has(toys,k)):[];
 const housesOwned=Array.isArray(s.houses)?[...new Set(s.houses)].filter(k=>has(houses,k)):[];
 const worn=Array.isArray(s.worn)?[...new Set(s.worn)].filter(k=>own.includes(k)||accessoriesOwned.includes(k)):[];
 const toyCooldowns={};for(const k in toys)toyCooldowns[k]=n(s.toyCooldowns&&s.toyCooldowns[k],0,9e15,0);
 const cd={};for(const k in cooldown)cd[k]=n(s.cooldowns&&s.cooldowns[k],0,9e15,0);
 const boosts={luckUntil:n(s.boosts&&s.boosts.luckUntil,0,9e15,0)};
 const day=(()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")})();
 const ms=s.missions&&s.missions.day===day?s.missions:{day,counts:{},claimed:[]};const counts={};for(const k of ["feed","play","cuddle","water","bath","sleep"])counts[k]=n(ms.counts&&ms.counts[k],0,999,0);
 const missionIds=["feed_once","feed_twice","play_once","play_twice","cuddle_once","cuddle_twice","water_once","bath_once","sleep_once"];
 const dailyReward={nextAt:n(s.dailyReward&&s.dailyReward.nextAt,0,9e15,0),lastId:String(s.dailyReward&&s.dailyReward.lastId||"").slice(0,40),lastLabel:String(s.dailyReward&&s.dailyReward.lastLabel||"").slice(0,60)};
 const mgDay=day;const mg=s.minigames&&s.minigames.date===mgDay?s.minigames:{date:mgDay,played:0,coinsEarned:0};const minigames={date:mgDay,played:n(mg.played,0,5,0),coinsEarned:n(mg.coinsEarned,0,1e6,0)};
 return{dailyReward,minigames,pet:s.pet,gender:["macho","femea"].includes(s.gender)?s.gender:"macho",accessories:accessoriesOwned,toys:toysOwned,houses:housesOwned,house:housesOwned.includes(s.house)?s.house:"",toyCooldowns,boosts,missions:{day,counts,claimed:Array.isArray(ms.claimed)?ms.claimed.filter(k=>missionIds.includes(k)):[]},petName:String(s.petName||pets[s.pet].name).trim().slice(0,18)||pets[s.pet].name,petAge:String(s.petAge||"6 meses"),level:n(s.level,1,9999,1),xp:n(s.xp,0,99,0),coins:n(s.coins,0,1e9,0),hunger:n(s.hunger,0,100,80),happy:n(s.happy,0,100,80),energy:n(s.energy,0,100,80),thirst:n(s.thirst,0,100,80),careUpdatedAt:n(s.careUpdatedAt,0,9e15,Date.now()),careTimes:(()=>{const t=s.careTimes||{},d=s.careUpdatedAt||Date.now();return{hunger:n(t.hunger,0,9e15,d),thirst:n(t.thirst,0,9e15,d),happy:n(t.happy,0,9e15,d),energy:n(t.energy,0,9e15,d)}})(),cooldowns:cd,inv,own,worn};
}
function friendly(e){
 const m=String((e&&e.message)||e||"");
 if(/invalid login/i.test(m))return"E-mail ou senha incorretos.";
 if(/already registered/i.test(m))return"Esse e-mail já tem conta. Use Entrar.";
 if(/not confirmed/i.test(m))return"Confirme seu e-mail primeiro (veja sua caixa de entrada).";
 if(/password/i.test(m)&&/6/.test(m))return"A senha precisa ter pelo menos 6 caracteres.";
 if(/rate limit/i.test(m))return"Muitas tentativas. Espere um pouco e tente de novo.";
 return"Erro: "+m;
}
function showOn(){$("authForm").hidden=true;$("authOn").hidden=false}
function showOff(msg){uid=null;nickname=null;$("nick").readOnly=false;$("nickModal").hidden=true;$("authForm").hidden=false;$("authOn").hidden=true;authSay(msg||"Entre para salvar seu progresso na nuvem e jogar em qualquer aparelho.")}
function fail(e){
 const m=String((e&&e.message)||""),code=e&&e.code;
 if(code==="PGRST205"||code==="42P01"||/schema cache|does not exist/i.test(m)){authSay("Falta criar a tabela no Supabase: rode o arquivo database/petlife_schema.sql no SQL Editor.");return}
 if((e&&e.status===401)||/jwt/i.test(m)){showOff("Sua sessão expirou. Entre de novo.");return}
 authSay("Não consegui falar com a nuvem agora. Tento de novo no próximo salvamento.");
}
function stamp(){const d=new Date();authSay("Conectado como "+email+" · salvo às "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"))}

async function push(){
 clearTimeout(timer);
 if(!uid||!data)return true;
 const r=await sb.from(TABLE).upsert({user_id:uid,nick:($("nick").value||"").trim().slice(0,14),save:data,updated_at:new Date().toISOString()},{onConflict:"user_id"});
 if(r.error){fail(r.error);return false}
 localStorage.setItem(OWN,uid);stamp();return true;
}
// Sincronização usada por operações de moedas confirmadas no servidor.
window.__plFlushSave=()=>push();
window.__plSetServerCoins=async coins=>{
 if(!data)return false;
 data.coins=Math.max(0,Math.min(1e9,Math.round(Number(coins)||0)));
 localStorage.setItem(KEY,JSON.stringify(data));render();
 return await push();
};
function schedule(){if(!uid)return;clearTimeout(timer);timer=setTimeout(()=>{push()},2000)}
function adopt(c,nick){
 data=c;localStorage.setItem(KEY,JSON.stringify(c));localStorage.setItem(OWN,uid);
 if(nick&&!$("nick").value)$("nick").value=nick;
 $("select").hidden=true;$("game").hidden=false;render();
}
// depois do login: decide entre o save da nuvem e o deste aparelho
async function sync(user){
 uid=user.id;email=user.email||"";showOn();authSay("Sincronizando...");
 const owner=localStorage.getItem(OWN);
 if(owner&&owner!==uid){ // save local pertence a outra conta: não misturar
  localStorage.removeItem(KEY);localStorage.removeItem(OWN);data=null;
  $("game").hidden=true;$("select").hidden=false;
 }
 const r=await sb.from(TABLE).select("save,nick").eq("user_id",uid).maybeSingle();
 if(r.error){fail(r.error);return}
 const cloud=r.data?norm(r.data.save):null;
 if(cloud&&(!data||score(cloud)>=score(data))){adopt(cloud,r.data.nick);stamp();notice("Progresso carregado da nuvem.")}
 else if(data){
  if(await push())notice(cloud?"O progresso deste aparelho estava mais avançado e foi para a nuvem.":"Progresso enviado para a nuvem.");
 }else{localStorage.setItem(OWN,uid);authSay("Conectado como "+email+". Escolha seu pet para começar!")}
 await profile();
}
async function enter(kind){
 const c=client();
 if(!c){authSay("Não consegui carregar o Supabase. Confira o config.js e o supabase.js.");return}
 const mail=$("email").value.trim(),pw=$("pass").value;
 if(!mail||pw.length<6){authSay("Digite o e-mail e uma senha com pelo menos 6 caracteres.");return}
 authSay(kind==="up"?"Criando conta...":"Entrando...");
 let r;try{r=kind==="up"?await c.auth.signUp({email:mail,password:pw}):await c.auth.signInWithPassword({email:mail,password:pw})}catch(e){authSay(friendly(e));return}
 if(r.error){authSay(friendly(r.error));return}
 const u=r.data&&r.data.user;
 if(kind==="up"&&u&&u.identities&&u.identities.length===0){authSay("Esse e-mail já tem conta. Use Entrar.");return}
 if(!r.data.session){authSay("Conta criada! Confirme o e-mail que enviamos e depois clique em Entrar.");return}
 $("pass").value="";sync(r.data.session.user);
}
async function logout(){
 if(data&&!(await push())){authSay("Não consegui salvar na nuvem; não vou sair agora para você não perder progresso.");return}
 try{await sb.auth.signOut()}catch(e){}
 localStorage.removeItem(KEY);localStorage.removeItem(OWN);location.reload(); // limpa o aparelho para a próxima pessoa
}


// ---------- apelido público e placar global (RPC seguras no Supabase) ----------
const NICKERR={
 NICK_INVALID:"Apelido inválido. Use de 3 a 14 letras, números, espaço simples, _ . ou -.",
 NICK_TAKEN:"Esse apelido já está em uso. Escolha outro.",
 NICK_SAME:"Esse já é o seu apelido.",
 NICK_NO_COINS:"Você não tem moedas suficientes para trocar o apelido.",
 NO_AUTH:"Sua sessão expirou. Entre de novo."
};
function nickErr(e){
 const m=String((e&&e.message)||e||""),code=e&&e.code;
 for(const k in NICKERR)if(m.indexOf(k)!==-1)return NICKERR[k];
 if(code==="PGRST202"||code==="42883"||/could not find the function|schema cache/i.test(m))return"Falta rodar o arquivo database/petlife_leaderboard.sql no SQL Editor do Supabase.";
 return"Não consegui falar com o servidor agora. Tente de novo.";
}
const fmtCoins=n=>Number(n).toLocaleString("pt-BR");
function nickUi(){
 $("nickCurrent").textContent=nickname||"—";
 $("nickCost").textContent=nickname?("Próxima troca: "+fmtCoins(nextCost)+" moedas."):"";
 if(nickname){$("nick").value=nickname;$("nick").readOnly=true}
}
async function profile(){
 if(!uid)return;
 const r=await sb.rpc("petlife_get_my_profile");
 if(r.error){$("nickMsg").textContent=nickErr(r.error);authSay(nickErr(r.error));return}
 const p=r.data||{};
 if(p.has_nickname){nickname=String(p.nickname||"");nextCost=Number(p.next_cost)||1000;$("nickModal").hidden=true;nickUi()}
 else{nickname=null;nickUi();$("nickFirstMsg").textContent="";$("nickModal").hidden=false}
}
async function setNick(name,msgEl,btns){
 if(nickBusy||!uid)return;
 name=String(name||"").trim();
 if(name.length<3||name.length>14){msgEl.textContent=NICKERR.NICK_INVALID;return}
 if(nickname&&name===nickname){msgEl.textContent=NICKERR.NICK_SAME;return}
 if(nickname&&data&&data.coins<nextCost){msgEl.textContent="Trocar o apelido custa "+fmtCoins(nextCost)+" moedas e você tem "+fmtCoins(data.coins)+".";return}
 nickBusy=true;btns.forEach(b=>b.disabled=true);msgEl.textContent="Salvando...";
 try{
  if(nickname&&!(await push())){msgEl.textContent="Não consegui sincronizar seu progresso. Tente de novo.";return}
  const r=await sb.rpc("petlife_set_nickname",{p_nickname:name});
  if(r.error){msgEl.textContent=nickErr(r.error);return}
  const d=r.data||{};
  nickname=String(d.nickname||name);nextCost=Number(d.next_cost)||1000;
  if(d.coins!=null&&data){data.coins=Math.max(0,Math.round(Number(d.coins)||0));save()}
  nickUi();$("nickModal").hidden=true;$("nickNew").value="";$("nickFirst").value="";$("nickFirstMsg").textContent="";
  msgEl.textContent="Apelido salvo: "+nickname+(d.charged?" (−"+fmtCoins(d.charged)+" moedas).":".");
  notice("Apelido público salvo: "+nickname+".");
 }catch(e){msgEl.textContent=nickErr(e)}
 finally{nickBusy=false;btns.forEach(b=>b.disabled=false)}
}
const brDate=iso=>{const d=new Date(iso);return isNaN(d)?"—":String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear()};
const petLabel=k=>has(pets,k)?pets[k].name:"Pet";
function boardCard(cls,x){
 const el=document.createElement("div");el.className=cls+(x.is_me?" me":"");
 return el;
}
async function openBoard(){
 $("boardModal").hidden=false;
 const st=$("boardStatus"),pod=$("podium"),lst=$("boardList");pod.innerHTML="";lst.innerHTML="";
 if(!uid){st.textContent="Entre na sua conta (Conta / Online) para ver o placar.";return}
 st.textContent="Carregando...";
 const r=await sb.rpc("petlife_leaderboard",{p_limit:100});
 if(r.error){st.textContent=nickErr(r.error);return}
 const rows=Array.isArray(r.data)?r.data:[];
 if(!rows.length){st.textContent="Ainda não há jogadores no placar.";return}
 st.textContent="Ordem: nível do pet e depois experiência.";
 const order=[1,0,2];
 order.forEach(i=>{
  const x=rows[i];if(!x)return;
  const el=boardCard("step p"+(i+1),x),pos=document.createElement("em"),nm=document.createElement("b"),sm=document.createElement("small"),dt=document.createElement("small");
  pos.textContent=(i+1)+"º";nm.textContent=String(x.nickname);
  sm.textContent=petLabel(x.pet)+" · Nv "+x.level;dt.textContent="Conta: "+brDate(x.created_at);
  el.append(pos,nm,sm,dt);pod.append(el);
 });
 rows.slice(3).forEach(x=>{
  const el=boardCard("brow",x),a=document.createElement("span"),b=document.createElement("span"),c=document.createElement("span");
  a.textContent=x.rank+"º";
  b.textContent=String(x.nickname);const s1=document.createElement("small");s1.textContent=petLabel(x.pet)+" · Conta: "+brDate(x.created_at);b.append(s1);
  c.textContent="Nv "+x.level;
  el.append(a,b,c);lst.append(el);
 });
}
$("nickChange").onclick=()=>setNick($("nickNew").value,$("nickMsg"),[$("nickChange")]);
$("nickFirstSave").onclick=()=>setNick($("nickFirst").value,$("nickFirstMsg"),[$("nickFirstSave")]);
$("nickFirstLogout").onclick=logout;
$("openBoard").onclick=openBoard;
$("boardClose").onclick=()=>$("boardModal").hidden=true;
$("boardModal").addEventListener("click",e=>{if(e.target===$("boardModal"))$("boardModal").hidden=true});

const _save=save;save=function(){_save();schedule()};
document.addEventListener("visibilitychange",()=>{if(document.hidden&&uid)push()});
$("login").onclick=()=>enter("in");$("signup").onclick=()=>enter("up");$("logout").onclick=logout;
(async()=>{
 const c=client();if(!c)return;
 try{const r=await c.auth.getSession();if(r.data&&r.data.session)sync(r.data.session.user)}catch(e){}
})();
})();
