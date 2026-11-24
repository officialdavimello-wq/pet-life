// Pet Life — login (e-mail + senha) e salvamento na nuvem (Supabase Auth + tabela petlife_saves)
// Carregado depois de game.js e online.js. Precisa da tabela criada com database/petlife_schema.sql.
(function(){
"use strict";
const cfg=window.PETLIFE_CONFIG||{},OWN="petlife-owner-v1",TABLE="petlife_saves";
let sb=null,uid=null,email="",timer=null;
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
 const inv={};for(const k in foods)inv[k]=n(s.inv&&s.inv[k],0,999,0);const own=Array.isArray(s.own)?[...new Set(s.own)].filter(k=>has(clothes,k)):[],worn=Array.isArray(s.worn)?[...new Set(s.worn)].filter(k=>own.includes(k)):[];const cd={};for(const k in cooldown)cd[k]=n(s.cooldowns&&s.cooldowns[k],0,9e15,0);
 return{pet:s.pet,level:n(s.level,1,9999,1),xp:n(s.xp,0,99,0),coins:n(s.coins,0,1e9,0),hunger:n(s.hunger,0,100,80),happy:n(s.happy,0,100,80),energy:n(s.energy,0,100,80),cooldowns:cd,inv:inv,own:own,worn:worn};
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
function showOff(msg){uid=null;$("authForm").hidden=false;$("authOn").hidden=true;authSay(msg||"Entre para salvar seu progresso na nuvem e jogar em qualquer aparelho.")}
function fail(e){
 const m=String((e&&e.message)||""),code=e&&e.code;
 if(code==="PGRST205"||code==="42P01"||/schema cache|does not exist/i.test(m)){authSay("⚠️ Falta criar a tabela no Supabase: rode o arquivo database/petlife_schema.sql no SQL Editor.");return}
 if((e&&e.status===401)||/jwt/i.test(m)){showOff("Sua sessão expirou. Entre de novo.");return}
 authSay("⚠️ Não consegui falar com a nuvem agora. Tento de novo no próximo salvamento.");
}
function stamp(){const d=new Date();authSay("☁️ Conectado como "+email+" · salvo às "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"))}

async function push(){
 clearTimeout(timer);
 if(!uid||!data)return true;
 const r=await sb.from(TABLE).upsert({user_id:uid,nick:($("nick").value||"").trim().slice(0,14),save:data,updated_at:new Date().toISOString()},{onConflict:"user_id"});
 if(r.error){fail(r.error);return false}
 localStorage.setItem(OWN,uid);stamp();return true;
}
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
 if(cloud&&(!data||score(cloud)>=score(data))){adopt(cloud,r.data.nick);stamp();notice("☁️ Progresso carregado da nuvem.")}
 else if(data){
  if(await push())notice(cloud?"☁️ O progresso deste aparelho estava mais avançado e foi para a nuvem.":"☁️ Progresso enviado para a nuvem.");
 }else{localStorage.setItem(OWN,uid);authSay("☁️ Conectado como "+email+". Escolha seu pet para começar!")}
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
 if(data&&!(await push())){authSay("⚠️ Não consegui salvar na nuvem; não vou sair agora para você não perder progresso.");return}
 try{await sb.auth.signOut()}catch(e){}
 localStorage.removeItem(KEY);localStorage.removeItem(OWN);location.reload(); // limpa o aparelho para a próxima pessoa
}

const _save=save;save=function(){_save();schedule()};
document.addEventListener("visibilitychange",()=>{if(document.hidden&&uid)push()});
$("login").onclick=()=>enter("in");$("signup").onclick=()=>enter("up");$("logout").onclick=logout;
(async()=>{
 const c=client();if(!c)return;
 try{const r=await c.auth.getSession();if(r.data&&r.data.session)sync(r.data.session.user)}catch(e){}
})();
})();
