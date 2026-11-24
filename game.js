const $=id=>document.getElementById(id),KEY="petlife-family-2d-v1";
const pets={lora:{name:"Lora",mood:"CRA! Oi! Vamos brincar?",kind:"parrot"},luna:{name:"Luna",mood:"Prrr... tem cenourinha?",kind:"guinea"},pipoca:{name:"Pipoca",mood:"Piu! Cadê meu petisco?",kind:"hamster"}};
let data=JSON.parse(localStorage.getItem(KEY)||"null");
const cooldown={feed:18000,water:12000,play:30000,bath:45000,cuddle:20000,sleep:60000,battle:25000};
let animation={action:"",until:0};
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function left(a){return Math.max(0,((data.cooldowns||{})[a]||0)-Date.now())}
function seconds(ms){return Math.ceil(ms/1000)+"s"}
function pixel(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function drawPet(ctx,type,x,y,s=1,worn=[]){
 ctx.save();ctx.translate(x,y);ctx.scale(s,s);
 const rect=(a,b,w,h,c)=>pixel(ctx,a,b,w,h,c);
 // soft pixel shadow
 rect(-34,48,68,8,"#77988a");if(worn.includes("capa"))rect(-38,-10,76,56,"#d94a6e");
 if(type==="lora"){
  rect(-24,-16,48,62,"#39aa72");rect(-17,-8,34,47,"#f0d45c");rect(-21,-48,42,39,"#43bd78");
  rect(-30,-52,15,18,"#43bd78");rect(15,-52,15,18,"#43bd78");
  rect(-13,-36,8,9,"#fff");rect(8,-36,8,9,"#fff");rect(-10,-34,4,6,"#3b3440");rect(11,-34,4,6,"#3b3440");
  rect(-5,-22,17,13,"#ef9b3e");rect(0,-10,9,5,"#bd6d31");
  rect(-31,-5,12,32,"#258c68");rect(19,-5,12,32,"#258c68");rect(-16,42,10,10,"#e7a83c");rect(7,42,10,10,"#e7a83c");
  rect(-16,-48,10,5,"#ffcf4d");rect(-7,-55,9,8,"#ffcf4d");
 }else{
  const fur=type==="luna"?"#b77b4d":"#d79a4e",cream="#fff0d5",pink="#e99891";
  rect(-34,-13,68,57,fur);rect(-25,-5,50,44,cream);
  rect(-33,-47,22,29,fur);rect(11,-47,22,29,fur);rect(-27,-41,11,17,pink);rect(16,-41,11,17,pink);
  rect(-20,-29,40,34,fur);rect(-15,-25,30,29,cream);
  rect(-13,-20,8,9,"#fff");rect(7,-20,8,9,"#fff");rect(-10,-18,4,6,"#302a31");rect(10,-18,4,6,"#302a31");
  rect(-4,-5,9,6,pink);rect(-21,-5,10,6,"#f3a4a0");rect(12,-5,10,6,"#f3a4a0");
  rect(-22,39,15,12,fur);rect(8,39,15,12,fur);
  if(type==="pipoca"){rect(-12,-54,24,12,"#f5c45f");rect(-5,-52,5,5,"#fff0d5");}
 }
 const ey=type==="lora"?-36:-20,ht=type==="lora"?-63:-57;
 if(worn.includes("oculos")){ctx.strokeStyle="#2b2b3a";ctx.lineWidth=3;ctx.strokeRect(-17,ey-4,16,14);ctx.strokeRect(3,ey-4,16,14);rect(-1,ey+1,4,3,"#2b2b3a")}
 if(worn.includes("laco")){rect(-15,8,11,10,"#ff6f91");rect(5,8,11,10,"#ff6f91");rect(-4,10,9,7,"#d94a6e")}
 if(worn.includes("chapeu")){rect(-19,ht,38,8,"#6b5bd1");rect(-12,ht-11,24,12,"#8a79e8")}
 // tiny blush and sparkle
 rect(-25,-6,7,4,"#f4a3a0");rect(19,-6,7,4,"#f4a3a0");
 ctx.restore();
}
function drawPortraits(){document.querySelectorAll(".portrait").forEach(c=>{const x=c.getContext("2d");x.imageSmoothingEnabled=false;x.clearRect(0,0,96,96);drawPet(x,c.dataset.draw,48,57,.9)})}
function drawRoom(){
 const c=$("world"),ctx=c.getContext("2d");ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,640,400);
 // wall, floor, window, shelves
 pixel(ctx,0,0,640,275,"#c9dfd1");pixel(ctx,0,275,640,125,"#d9a879");
 for(let y=278;y<400;y+=22)pixel(ctx,0,y,640,2,"#c28d66");
 pixel(ctx,44,34,150,130,"#9b765e");pixel(ctx,52,42,134,114,"#83c5d4");pixel(ctx,117,42,5,114,"#9b765e");pixel(ctx,52,96,134,5,"#9b765e");
 pixel(ctx,63,60,42,20,"#a6d5a1");pixel(ctx,120,50,50,32,"#a6d5a1");
 pixel(ctx,425,65,150,13,"#9d7152");pixel(ctx,447,78,28,25,"#6eae83");pixel(ctx,452,61,18,19,"#77b77f");pixel(ctx,523,36,32,42,"#7c9bcb");
 pixel(ctx,18,200,78,10,"#a77b59");pixel(ctx,26,210,12,42,"#a77b59");pixel(ctx,77,210,12,42,"#a77b59");
 pixel(ctx,32,169,42,30,"#e5b46f");pixel(ctx,42,146,22,25,"#65a879");
 // rug
 pixel(ctx,112,300,420,60,"#a98dbb");pixel(ctx,130,306,385,48,"#c2a9ce");
 // toys and food bowl
 pixel(ctx,52,323,38,23,"#e58c83");pixel(ctx,60,315,23,12,"#f4d27a");
 pixel(ctx,548,315,45,18,"#6fa5bc");pixel(ctx,554,310,32,9,"#a7d2dc");
 const active=Date.now()<animation.until, t=Date.now()/150;
 ctx.save();if(active&&animation.action==="play")ctx.translate(Math.sin(t)*15,0);
 drawPet(ctx,data.pet,320,260+(active&&animation.action!=="sleep"?Math.sin(t)*5:Math.sin(Date.now()/600)*1.5),2.1,data.worn);ctx.restore();
 if(active&&animation.action==="feed"){pixel(ctx,380,280,15,11,"#e98b57");pixel(ctx,383,276,9,5,"#78ad6a")}
 if(active&&animation.action==="play"){pixel(ctx,390+Math.sin(t)*18,300,14,14,"#e98b57")}
 if(active&&animation.action==="sleep"){ctx.fillStyle="#fffaf2";ctx.font="bold 22px Arial";ctx.fillText("Z z z",390,175)}
 if(active&&animation.action==="cuddle"){pixel(ctx,269,157,8,8,"#ef8e9d");pixel(ctx,277,149,8,8,"#ef8e9d");pixel(ctx,285,157,8,8,"#ef8e9d")}
 if(active&&animation.action==="bath"){pixel(ctx,267,174,8,8,"#8dcbd8");pixel(ctx,366,190,7,7,"#8dcbd8")}
 if(active&&animation.action==="water"){pixel(ctx,386,260,8,13,"#77c5dc")}
 // floating hearts
 pixel(ctx,269,157,8,8,"#ef8e9d");pixel(ctx,277,149,8,8,"#ef8e9d");pixel(ctx,285,157,8,8,"#ef8e9d");pixel(ctx,277,165,8,8,"#ef8e9d");
}
function render(){if(!data)return;norm();const p=pets[data.pet];$("petname").textContent=p.name;$("mood").textContent=p.mood;$("level").textContent=data.level;$("bottomLevel").textContent=data.level;$("xp").textContent=`${data.xp} / 100 XP`;$("xpbar").style.width=data.xp+"%";$("coins").textContent=data.coins;
 for(const k of ["hunger","happy","energy"]){$(k).style.width=data[k]+"%";$(k+"N").textContent=data[k]+"%"}
 document.querySelectorAll("[data-action]").forEach(b=>{const a=b.dataset.action,ms=left(a);b.disabled=ms>0;b.querySelector("small").textContent=ms?"Aguarde "+seconds(ms):"Pronto"});renderShop();drawRoom()}
function choose(id){data={pet:id,level:1,xp:0,coins:30,hunger:80,happy:80,energy:80,cooldowns:{}};$("select").hidden=true;$("game").hidden=false;save();notice(pets[id].mood)}
function notice(t){$("notice").textContent=t}
function act(a){if(!data)return;const map={feed:{hunger:22,xp:5,coins:1,msg:"NHAM! Seu pet está comendo!"},water:{hunger:7,xp:3,coins:0,msg:"Glup, glup! Água fresquinha!"},play:{happy:22,energy:-14,xp:7,coins:2,msg:"Seu pet está brincando com você!"},bath:{happy:10,xp:5,coins:1,msg:"Splish splash! Hora do banho!"},cuddle:{happy:16,xp:4,coins:1,msg:"Seu pet adorou o carinho!"},sleep:{energy:35,xp:4,coins:1,msg:"Zzz... bons sonhos!"}};let c=map[a],ms=left(a);if(ms){notice("Seu pet precisa descansar. Tente novamente em "+seconds(ms)+".");return}if(a==="play"&&data.energy<14){notice("Seu pet está cansado. Deixe-o dormir primeiro.");return}if(a==="feed"&&data.hunger>=96){notice("Seu pet já está satisfeito!");return}if(a==="sleep"&&data.energy>=95){notice("Seu pet já está cheio de energia!");return}for(let k of ["hunger","happy","energy"])if(c[k])data[k]=Math.max(0,Math.min(100,data[k]+c[k]));data.xp+=c.xp;data.coins+=c.coins;data.cooldowns[a]=Date.now()+cooldown[a];animation={action:a,until:Date.now()+2800};if(data.xp>=100){data.xp-=100;data.level++;data.coins+=15;c.msg+=" Subiu de nível! +15 moedas."}save();notice(c.msg);drawRoom()}
function tick(){if(!data)return;document.querySelectorAll("[data-action]").forEach(b=>{const a=b.dataset.action,ms=left(a);b.disabled=ms>0;b.querySelector("small").textContent=ms?"Aguarde "+seconds(ms):"Pronto"});if(Date.now()<animation.until)drawRoom()}
let busy=0;
const foods={biscoito:{n:"Biscoito",e:"🍪",p:4,h:14,hp:0},bolo:{n:"Bolo",e:"🍰",p:9,h:26,hp:8},banquete:{n:"Banquete",e:"🍱",p:16,h:45,hp:15}},clothes={laco:{n:"Laço",e:"🎀",p:12},chapeu:{n:"Chapéu",e:"🎩",p:20},oculos:{n:"Óculos",e:"🕶️",p:25},capa:{n:"Capa",e:"🦸",p:35}};
function norm(){data.cooldowns=data.cooldowns||{};data.inv=data.inv||{};data.own=data.own||[];data.worn=data.worn||[]}
function gain(x,c){data.xp+=x;data.coins+=c;while(data.xp>=100){data.xp-=100;data.level++;data.coins+=15}}
function renderShop(){const s=$("shop");if(!s)return;const row=(it,info,btn)=>`<div class="item"><span>${it.e} <b>${it.n}</b><small>${it.p} 🪙${info}</small></span><div>${btn}</div></div>`;
 s.innerHTML=Object.entries(foods).map(([k,f])=>{const n=data.inv[k]||0;return row(f," · fome +"+f.h+" · tenho "+n,`<button data-buy="f:${k}">Comprar</button> <button data-use="${k}"${n?"":" disabled"}>Dar</button>`)}).join("")+Object.entries(clothes).map(([k,c])=>{const own=data.own.includes(k),w=data.worn.includes(k);return row(c," · +2 poder na batalha",own?`<button data-wear="${k}">${w?"Tirar":"Vestir"}</button>`:`<button data-buy="c:${k}">Comprar</button>`)}).join("")}
function shopClick(e){const b=e.target.closest("button");if(!b||!data)return;const{buy,use,wear}=b.dataset;
 if(buy){const[t,id]=buy.split(":"),it=(t==="f"?foods:clothes)[id];if(data.coins<it.p){notice("Moedas insuficientes! Cuide do pet para ganhar mais.");return}data.coins-=it.p;if(t==="f")data.inv[id]=(data.inv[id]||0)+1;else{data.own.push(id);data.worn.push(id)}notice("Você comprou: "+it.n+"!")}
 else if(use){if(data.hunger>=96){notice("Seu pet já está satisfeito!");return}const f=foods[use];data.inv[use]--;data.hunger=Math.min(100,data.hunger+f.h);data.happy=Math.min(100,data.happy+f.hp);gain(3,0);animation={action:"feed",until:Date.now()+2800};notice("NHAM! "+f.n+" delicioso!")}
 else if(wear){data.worn=data.worn.includes(wear)?data.worn.filter(x=>x!==wear):[...data.worn,wear];notice("Visual atualizado!")}
 save()}
// A = quem desafiou (índice 0), B = quem aceitou (índice 1); flip = eu sou o B. Mesma semente => mesmo resultado nos dois aparelhos.
function sim(A,B,rnd,flip){const mx=[A,B].map(p=>60+p.level*8),hp=[...mx],pw=[A,B].map(p=>6+p.level*2+p.worn.length*2),R=[];let t=rnd()<.5?0:1;
 while(hp[0]>0&&hp[1]>0&&R.length<14){const d=Math.max(3,Math.round(pw[t]*(.7+rnd()*.6)));hp[1-t]=Math.max(0,hp[1-t]-d);R.push({t,d,hp:[...hp]});t=1-t}
 const o={R,mx,win:hp[0]>=hp[1]};return flip?{R:R.map(r=>({t:1-r.t,d:r.d,hp:[r.hp[1],r.hp[0]]})),mx:[mx[1],mx[0]],win:!o.win}:o}
function anim(L,Q,o,end){const g=$("battle").getContext("2d"),{R,mx,win}=o,T=900,t0=performance.now(),nm=p=>p.name||pets[p.pet].name;g.imageSmoothingEnabled=false;
 const frame=now=>{const k=(now-t0)/T,i=Math.min(Math.floor(k),R.length),ph=k-i,r=R[i],sh=R[r&&ph>.5?i:i-1]||{hp:mx},y=190+Math.sin(now/200)*2;
  g.globalAlpha=1;g.fillStyle="#bfe3f0";g.fillRect(0,0,640,260);g.fillStyle="#cfe8c6";g.fillRect(0,170,640,90);g.fillStyle="#9ccf8f";for(let x=0;x<640;x+=40)g.fillRect(x,215+(x/40%2)*10,20,6);
  const off=r?Math.sin(Math.min(ph,1)*Math.PI)*100*(r.t?-1:1):0,sk=r&&ph>.5&&ph<.85?Math.sin(ph*90)*6:0,px=150+(r&&r.t===0?off:0)+(r&&r.t===1?sk:0),ox=490+(r&&r.t===1?off:0)+(r&&r.t===0?sk:0);
  g.globalAlpha=!r&&!win?.45:1;drawPet(g,L.pet,px,y,1.5,L.worn);
  g.globalAlpha=!r&&win?.45:1;g.save();g.translate(ox,0);g.scale(-1,1);drawPet(g,Q.pet,0,y,1.5,Q.worn);g.restore();g.globalAlpha=1;
  if(r&&ph>.5&&ph<.9){const tx=r.t?px:ox,u=(ph-.5)*70;g.fillStyle="#ffd34d";[[-34,-60],[28,-50],[0,-88],[-12,-38]].forEach(([a,b])=>g.fillRect(tx+a,y+b-u,10,10));g.fillStyle="#e0476b";g.font="bold 28px Arial";g.fillText("-"+r.d,tx-14,y-100-u)}
  [L,Q].forEach((p,j)=>{const x=j?380:20,v=sh.hp[j]/mx[j];g.fillStyle="#0003";g.fillRect(x,16,240,16);g.fillStyle=v>.35?"#52c27a":"#e0476b";g.fillRect(x,16,240*v,16);g.fillStyle="#2b2b3a";g.font="bold 14px Arial";g.fillText(nm(p)+" "+sh.hp[j]+"/"+mx[j],x,48)});
  if(k<R.length+.8)requestAnimationFrame(frame);else end()};
 requestAnimationFrame(frame)}
function battle(){
 if(!data||busy)return;const w=left("battle");if(w){notice("Seu pet precisa descansar. Tente em "+seconds(w)+".");return}
 busy=1;const L={pet:data.pet,level:data.level,worn:data.worn},k=Object.keys(pets).filter(x=>x!==data.pet)[Math.floor(Math.random()*2)],Q={pet:k,level:Math.max(1,data.level+Math.floor(Math.random()*5)-2),worn:[]};
 $("arena").hidden=false;$("duelActions").innerHTML="";$("fighters").innerHTML="<b>"+pets[L.pet].name+" · Nv "+L.level+"</b><span> VS </span><b>"+pets[Q.pet].name+" · Nv "+Q.level+"</b>";$("arenaResult").textContent="Treino com rival da casa.";
 const o=sim(L,Q,Math.random);
 anim(L,Q,o,()=>{if(o.win)gain(35,10);else gain(8,2);data.cooldowns.battle=Date.now()+25000;busy=0;save();$("arenaResult").textContent=o.win?"🏆 Vitória! +35 XP e +10 moedas":"Seu pet perdeu, mas aprendeu! +8 XP e +2 moedas"})}

document.querySelectorAll("[data-pet]").forEach(b=>b.addEventListener("click",()=>choose(b.dataset.pet)));
document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>act(b.dataset.action)));
$("account").onclick=()=>$("modal").hidden=false;$("close").onclick=$("ok").onclick=()=>$("modal").hidden=true;
$("share").onclick=async()=>{try{await navigator.clipboard.writeText(location.href);notice("Endereço copiado! Depois de publicar, envie o link para sua família.")}catch{notice("Copie o endereço do navegador para compartilhar depois da publicação.")}};
$("practice").onclick=()=>battle();$("shop").onclick=shopClick;$("findMatch").onclick=()=>notice("Multiplayer online ainda precisa de servidor e publicação. O treino local já pode ser testado.");$("arenaClose").onclick=()=>$("arena").hidden=true;drawPortraits();if(data){if(!data.cooldowns)data.cooldowns={};$("select").hidden=true;$("game").hidden=false;render()}setInterval(tick,1000);
