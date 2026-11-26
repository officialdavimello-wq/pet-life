const $=id=>document.getElementById(id),KEY="petlife-family-2d-v1";
const pets={lora:{name:"Lora",mood:"CRA! Oi! Vamos brincar?",kind:"parrot"},luna:{name:"Luna",mood:"Prrr... tem cenourinha?",kind:"guinea"},pipoca:{name:"Pipoca",mood:"Piu! Cadê meu petisco?",kind:"hamster"},dog:{name:"Thor",mood:"Au au! Vamos passear?",kind:"dog"},cat:{name:"Mimi",mood:"Miau... quero um carinho.",kind:"cat"},rabbit:{name:"Nuvem",mood:"Nhac! Tem uma cenourinha?",kind:"rabbit"}};
let data=JSON.parse(localStorage.getItem(KEY)||"null");
const cooldown={feed:8000,water:6000,play:12000,bath:20000,cuddle:8000,sleep:25000,battle:20000};
const CARE={hunger:4*60*1000,thirst:3*60*1000,happy:8*60*1000,energy:10*60*1000},OFFLINE_CAP=2*60*60*1000;
let lastCareSave=Date.now();
function applyCareDecay(now=Date.now()){if(!data)return false;const fallback=Number(data.careUpdatedAt)||now;data.careTimes=data.careTimes&&typeof data.careTimes==="object"?data.careTimes:{hunger:fallback,thirst:fallback,happy:fallback,energy:fallback};let changed=false;for(const [key,period] of Object.entries(CARE)){let last=Number(data.careTimes[key])||fallback;if(now-last>OFFLINE_CAP)last=now-OFFLINE_CAP;const elapsed=Math.max(0,now-last),loss=Math.floor(elapsed/period);if(loss>0){const before=Number(data[key])||0;data[key]=Math.max(0,before-loss);data.careTimes[key]=last+loss*period;changed=changed||data[key]!==before;}else data.careTimes[key]=last;}data.careUpdatedAt=now;return changed;}
let animation={action:"",until:0},animationFrame=0,activeShopTab="comidas";
function save(){localStorage.setItem(KEY,JSON.stringify(data));render()}
function left(a){return Math.max(0,((data.cooldowns||{})[a]||0)-Date.now())}
function seconds(ms){return Math.ceil(ms/1000)+"s"}
function pixel(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function drawPet(ctx,type,x,y,s=1,worn=[],level=1){
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
 }else if(type==="dog"){
  const fur="#c98b52",cream="#fff0d5";
  rect(-32,-12,64,56,fur);rect(-25,-4,50,43,cream);
  rect(-34,-43,17,38,"#9b603d");rect(17,-43,17,38,"#9b603d");
  rect(-22,-34,44,38,fur);rect(-16,-27,32,29,cream);
  rect(-12,-20,8,9,"#fff");rect(8,-20,8,9,"#fff");rect(-9,-18,4,6,"#302a31");rect(11,-18,4,6,"#302a31");
  rect(-4,-5,9,7,"#49343a");rect(-2,2,5,4,"#e99891");
  rect(-21,38,15,13,fur);rect(8,38,15,13,fur);rect(27,10,12,8,"#9b603d");rect(34,4,8,8,"#9b603d");
 }else if(type==="cat"){
  const fur="#e49b62",cream="#fff0d5",pink="#e99891";
  rect(-31,-13,62,57,fur);rect(-24,-5,48,44,cream);
  rect(-29,-53,21,31,fur);rect(8,-53,21,31,fur);rect(-23,-44,10,17,pink);rect(13,-44,10,17,pink);
  rect(-21,-31,42,37,fur);rect(-15,-25,30,30,cream);
  rect(-13,-20,8,9,"#fff");rect(7,-20,8,9,"#fff");rect(-10,-18,4,6,"#302a31");rect(10,-18,4,6,"#302a31");
  rect(-4,-6,8,6,pink);rect(-18,-3,9,3,"#fff");rect(10,-3,9,3,"#fff");
  rect(-22,39,14,12,fur);rect(8,39,14,12,fur);rect(28,13,8,24,fur);rect(33,3,8,14,fur);
 }else if(type==="rabbit"){
  const fur="#eee0d0",cream="#fff8eb",pink="#e99b9b";
  rect(-31,-12,62,56,fur);rect(-24,-4,48,43,cream);
  rect(-25,-83,15,48,fur);rect(10,-83,15,48,fur);rect(-21,-77,7,35,pink);rect(14,-77,7,35,pink);
  rect(-22,-33,44,39,fur);rect(-16,-26,32,31,cream);
  rect(-13,-20,8,9,"#fff");rect(7,-20,8,9,"#fff");rect(-10,-18,4,6,"#302a31");rect(10,-18,4,6,"#302a31");
  rect(-4,-6,8,6,pink);rect(-18,-3,9,3,"#f3a4a0");rect(10,-3,9,3,"#f3a4a0");
  rect(-22,39,14,12,fur);rect(8,39,14,12,fur);rect(28,25,12,12,"#fff8eb");
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
 if(worn.includes("coroa")){rect(-17,ht-15,34,9,"#e8b943");rect(-17,ht-21,8,8,"#f5d56b");rect(-4,ht-25,8,12,"#f5d56b");rect(9,ht-21,8,8,"#f5d56b");rect(-3,ht-12,6,4,"#e87883")}
 if(worn.includes("asas")){rect(-49,3,17,30,"#9bc9e8");rect(-55,10,13,21,"#c3e3f4");rect(32,3,17,30,"#9bc9e8");rect(42,10,13,21,"#c3e3f4")}
 if(worn.includes("coleira")){rect(-19,30,38,7,"#d85b69");rect(-4,34,8,8,"#f3c85b")}
 // Evolução visual: detalhes internos ao sprite. A caixa e a escala do pet nunca mudam.
 const stage=level>=30?5:level>=20?4:level>=10?3:level>=5?2:1;
 if(stage>=2){rect(-4,19,8,8,stage>=4?"#f4d36b":"#e9c45b");rect(-2,21,4,4,stage>=4?"#fff0a3":"#fff0d0")}
 if(stage>=3){rect(-3,ht+10,6,4,"#f4d36b");rect(-1,ht+8,2,8,"#fff0a3")}
 if(stage>=4){rect(-29,8,4,4,"#fff0a3");rect(25,-2,4,4,"#fff0a3");rect(-22,-39,3,3,"#fff0a3");rect(20,-34,3,3,"#fff0a3")}
 if(stage>=5){rect(-11,ht+2,5,3,"#8dd8c0");rect(6,ht+2,5,3,"#8dd8c0");rect(-3,ht-1,6,3,"#f4d36b")}
 // tiny blush and sparkle
 rect(-25,-6,7,4,"#f4a3a0");rect(19,-6,7,4,"#f4a3a0");
 ctx.restore();
}
function drawPortraits(){document.querySelectorAll(".portrait").forEach(c=>{const x=c.getContext("2d");x.imageSmoothingEnabled=false;x.clearRect(0,0,96,96);drawPet(x,c.dataset.draw,48,57,.9)})}
function drawRoom(){
 const c=$("world"),ctx=c.getContext("2d");ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,640,400);
 pixel(ctx,0,0,640,275,"#c9dfd1");pixel(ctx,0,275,640,125,"#d9a879");
 for(let y=278;y<400;y+=22)pixel(ctx,0,y,640,2,"#c28d66");
 pixel(ctx,44,34,150,130,"#9b765e");pixel(ctx,52,42,134,114,"#83c5d4");pixel(ctx,117,42,5,114,"#9b765e");pixel(ctx,52,96,134,5,"#9b765e");
 pixel(ctx,63,60,42,20,"#a6d5a1");pixel(ctx,120,50,50,32,"#a6d5a1");
 pixel(ctx,425,65,150,13,"#9d7152");pixel(ctx,447,78,28,25,"#6eae83");pixel(ctx,452,61,18,19,"#77b77f");pixel(ctx,523,36,32,42,"#7c9bcb");
 pixel(ctx,18,200,78,10,"#a77b59");pixel(ctx,26,210,12,42,"#a77b59");pixel(ctx,77,210,12,42,"#a77b59");pixel(ctx,32,169,42,30,"#e5b46f");pixel(ctx,42,146,22,25,"#65a879");
 pixel(ctx,112,300,420,60,"#a98dbb");pixel(ctx,130,306,385,48,"#c2a9ce");
 pixel(ctx,52,323,38,23,"#e58c83");pixel(ctx,60,315,23,12,"#f4d27a");pixel(ctx,548,315,45,18,"#6fa5bc");pixel(ctx,554,310,32,9,"#a7d2dc");
 // Casinha escolhida pelo jogador
 if(data.house){const royal=data.house==="mansao";pixel(ctx,500,190,92,74,royal?"#e8d9b7":"#c98e68");pixel(ctx,490,185,112,14,royal?"#8069ad":"#a85f55");pixel(ctx,505,165,82,26,royal?"#8069ad":"#a85f55");pixel(ctx,537,224,22,40,"#75513f");pixel(ctx,512,202,17,17,"#9bd0dc");pixel(ctx,565,202,17,17,"#9bd0dc");if(royal){pixel(ctx,540,158,12,12,"#e9c85b");pixel(ctx,525,180,42,5,"#f5df9d")}}
 const now=performance.now(),active=now<animation.until,elapsed=active?(now-animation.start)/1000:0,phase=elapsed*Math.PI*2;
 let bob=Math.sin(now/430)*1.5,dx=0,dy=0,scaleX=1,scaleY=1,rot=0;
 if(active){
  if(animation.action==="play"){dy=-Math.abs(Math.sin(phase*1.4))*13;dx=Math.sin(phase)*13;scaleX=1+Math.sin(phase*1.4)*.035;scaleY=1-Math.sin(phase*1.4)*.035}
  if(animation.action==="feed"){rot=Math.sin(phase*2)*.055;dy=Math.sin(phase*2)*2}
  if(animation.action==="bath"){rot=Math.sin(phase*3)*.035;dy=Math.sin(phase*3)*2}
  if(animation.action==="cuddle"){dy=-Math.abs(Math.sin(phase))*5;scaleX=1+Math.sin(phase)*.025;scaleY=1-Math.sin(phase)*.025}
  if(animation.action==="sleep"){scaleY=1-Math.sin(phase)*.025;bob=0}
 }
 ctx.save();ctx.translate(320+dx,260+bob+dy);ctx.rotate(rot);ctx.scale(2.1*scaleX,2.1*scaleY);drawPet(ctx,data.pet,0,0,1,data.worn,data.level);ctx.restore();
 if(active){
  const fade=Math.min(1,(animation.until-now)/350);ctx.globalAlpha=Math.max(0,fade);
  if(animation.action==="feed"){pixel(ctx,383,280,15,11,"#e98b57");pixel(ctx,386,276,9,5,"#78ad6a")}
  if(animation.action==="play"){const bx=390+Math.sin(phase)*24,by=300-Math.abs(Math.sin(phase*1.4))*13;ctx.beginPath();ctx.arc(bx,by,9,0,Math.PI*2);ctx.fillStyle="#e98b57";ctx.fill();ctx.fillStyle="#fff0d5";ctx.fillRect(bx-3,by-3,6,6)}
  if(animation.action==="sleep"){ctx.fillStyle="#fffaf2";ctx.font="bold 22px Arial";ctx.fillText("Z z z",390,175-Math.sin(phase)*4)}
  if(animation.action==="cuddle"){ctx.fillStyle="#ef8e9d";ctx.font="bold 23px Arial";ctx.fillText("♥",270,170-Math.sin(phase)*8);ctx.fillText("♥",355,155+Math.sin(phase)*6)}
  if(animation.action==="bath"||animation.action==="water"){for(let i=0;i<5;i++){const x=270+i*23+Math.sin(phase+i)*4,y=185+((elapsed*55+i*19)%35);ctx.beginPath();ctx.arc(x,y,3+(i%2),0,Math.PI*2);ctx.fillStyle="#8dcbd8";ctx.fill()}}
  ctx.globalAlpha=1;
 }
}
function animateRoom(){drawRoom();if(performance.now()<animation.until)animationFrame=requestAnimationFrame(animateRoom);else animationFrame=0}
function startAnimation(action){if(animationFrame)cancelAnimationFrame(animationFrame);animation={action,start:performance.now(),until:performance.now()+2200};drawRoom();animationFrame=requestAnimationFrame(animateRoom)}


const DAILY_REWARD_INTERVAL=15*60*60*1000;
const DAILY_REWARD_POOL=[
 {id:"coins_100",type:"coins",amount:100,label:"100 moedas",rarity:"Comum"},
 {id:"coins_150",type:"coins",amount:150,label:"150 moedas",rarity:"Comum"},
 {id:"coins_250",type:"coins",amount:250,label:"250 moedas",rarity:"Incomum"},
 {id:"coins_350",type:"coins",amount:350,label:"350 moedas",rarity:"Rara"},
 {id:"coins_500",type:"coins",amount:500,label:"500 moedas",rarity:"Épica"},
 {id:"biscoito_5",type:"item",item:"biscoito",amount:5,label:"5 biscoitos",rarity:"Comum"},
 {id:"bolo_3",type:"item",item:"bolo",amount:3,label:"3 bolos",rarity:"Incomum"},
 {id:"banquete_2",type:"item",item:"banquete",amount:2,label:"2 banquetes",rarity:"Rara"},
 {id:"pocao_energia",type:"item",item:"energia",amount:1,label:"Poção de energia",rarity:"Rara"},
 {id:"pocao_experiencia",type:"item",item:"experiencia",amount:1,label:"Poção de experiência",rarity:"Rara"},
 {id:"pocao_sorte",type:"item",item:"sorte",amount:1,label:"Poção da sorte",rarity:"Épica"}
];
function dailyRewardState(){
 if(!data.dailyReward||typeof data.dailyReward!=="object")data.dailyReward={nextAt:0,lastId:"",lastLabel:""};
 data.dailyReward.nextAt=Math.max(0,Number(data.dailyReward.nextAt)||0);
 data.dailyReward.lastId=String(data.dailyReward.lastId||"");
 data.dailyReward.lastLabel=String(data.dailyReward.lastLabel||"");
 return data.dailyReward;
}
function dailyRewardRemaining(){return Math.max(0,dailyRewardState().nextAt-Date.now())}
function formatRewardTime(ms){
 const total=Math.ceil(ms/1000),h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=total%60;
 return h+"h "+String(m).padStart(2,"0")+"m "+String(s).padStart(2,"0")+"s";
}
function renderDailyReward(){
 const box=$("dailyRewardInfo"),btn=$("dailyRewardClaim"),last=$("dailyRewardLast");
 if(!box||!btn||!data)return;
 const state=dailyRewardState(),left=dailyRewardRemaining();
 btn.disabled=left>0;
 btn.textContent=left>0?"Disponível em "+formatRewardTime(left):"Resgatar recompensa";
 box.textContent=left>0?"Sua próxima recompensa estará disponível em "+formatRewardTime(left)+".":"Há uma recompensa esperando por você!";
 if(last)last.textContent=state.lastLabel?"Última recompensa: "+state.lastLabel:"Cada resgate traz um prêmio aleatório.";
}
function claimDailyReward(){
 if(!data)return;
 const state=dailyRewardState(),left=dailyRewardRemaining();
 if(left>0){notice("Aguarde "+formatRewardTime(left)+" para resgatar outra recompensa.");renderDailyReward();return}
 let choices=DAILY_REWARD_POOL.filter(r=>r.id!==state.lastId);
 if(!choices.length)choices=DAILY_REWARD_POOL;
 const reward=choices[Math.floor(Math.random()*choices.length)];
 if(reward.type==="coins")data.coins+=reward.amount;
 else data.inv[reward.item]=(Number(data.inv[reward.item])||0)+reward.amount;
 state.lastId=reward.id;
 state.lastLabel=reward.label;
 state.nextAt=Date.now()+DAILY_REWARD_INTERVAL;
 save();
 notice("Presente resgatado: "+reward.label+"!");
 $("dailyRewardResult").textContent="Você ganhou: "+reward.label+"!";
 $("dailyRewardResult").hidden=false;
 renderDailyReward();
}

const MISSION_INTERVAL=5*60*60*1000;
const missionPool=[
 {id:"feed_once",title:"Alimente seu pet",action:"feed",goal:1,reward:8},
 {id:"feed_twice",title:"Sirva duas refeições ao seu pet",action:"feed",goal:2,reward:14},
 {id:"feed_three",title:"Alimente seu pet 3 vezes",action:"feed",goal:3,reward:18},
 {id:"play_once",title:"Brinque com seu pet",action:"play",goal:1,reward:8},
 {id:"play_twice",title:"Brinque com seu pet 2 vezes",action:"play",goal:2,reward:13},
 {id:"play_three",title:"Faça 3 brincadeiras",action:"play",goal:3,reward:18},
 {id:"cuddle_once",title:"Dê carinho ao seu pet",action:"cuddle",goal:1,reward:7},
 {id:"cuddle_twice",title:"Dê carinho 2 vezes",action:"cuddle",goal:2,reward:12},
 {id:"water_once",title:"Ofereça água fresquinha",action:"water",goal:1,reward:6},
 {id:"water_twice",title:"Encha o potinho de água 2 vezes",action:"water",goal:2,reward:11},
 {id:"bath_once",title:"Dê um banho no seu pet",action:"bath",goal:1,reward:9},
 {id:"bath_twice",title:"Dê banho no seu pet em duas ocasiões",action:"bath",goal:2,reward:15},
 {id:"sleep_once",title:"Coloque seu pet para dormir",action:"sleep",goal:1,reward:8},
 {id:"sleep_twice",title:"Ajude seu pet a dormir 2 vezes",action:"sleep",goal:2,reward:13},
 {id:"train_once",title:"Treine contra um adversário",action:"train",goal:1,reward:12},
 {id:"train_twice",title:"Faça 2 treinos contra rivais",action:"train",goal:2,reward:20},
 {id:"train_three",title:"Participe de 3 treinos na arena",action:"train",goal:3,reward:26},
 {id:"train_win",title:"Vença um adversário no treino",action:"train_win",goal:1,reward:16},
 {id:"train_wins_two",title:"Consiga 2 vitórias na arena",action:"train_win",goal:2,reward:25}
];
function missionCycle(){return Math.floor(Date.now()/MISSION_INTERVAL)}
function missionHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function makeMissionTasks(cycle){const byAction=new Map();for(const m of missionPool){if(!byAction.has(m.action))byAction.set(m.action,[]);byAction.get(m.action).push(m)}const groups=[...byAction.entries()].sort((a,b)=>missionHash(cycle+"|"+a[0])-missionHash(cycle+"|"+b[0])).slice(0,4);return groups.map(([action,items])=>items[missionHash(cycle+"|"+action+"|pick")%items.length])}
function dailyTasks(){return data.missions.tasks||[]}
function missionState(){const cycle=missionCycle();if(!data.missions||data.missions.cycle!==cycle)data.missions={cycle,tasks:makeMissionTasks(cycle),counts:{},claimed:[]};data.missions.tasks=Array.isArray(data.missions.tasks)?data.missions.tasks:makeMissionTasks(cycle);data.missions.counts=data.missions.counts||{};data.missions.claimed=data.missions.claimed||[]}
function countMission(action){missionState();data.missions.counts[action]=(data.missions.counts[action]||0)+1}
function renderMissions(){const box=$("missions");if(!box||!data)return;missionState();box.innerHTML=dailyTasks().map(m=>{const n=Math.min(m.goal,data.missions.counts[m.action]||0),done=n>=m.goal,claimed=data.missions.claimed.includes(m.id);return `<div class="mission"><div><b>${m.title}</b><small>${n}/${m.goal} · +${m.reward} moedas</small></div><button data-claim="${m.id}" ${!done||claimed?"disabled":""}>${claimed?"Resgatada":"Resgatar"}</button></div>`}).join("")}
function render(){if(!data)return;norm();const p=pets[data.pet];$("petname").textContent=data.petName;$("profileName").value=data.petName;$("profileSpecies").textContent=({parrot:"Papagaio",guinea:"Porquinho-da-Índia",hamster:"Hamster",dog:"Cachorro",cat:"Gato",rabbit:"Coelho"})[p.kind]||"Pet";$("profileAge").textContent=data.petAge;$("profileGender").value=data.gender||"macho";$("profileLevel").textContent=data.level;$("profileEvolution").textContent=evolutionName(data.level);$("profileAbout").textContent=p.mood;const portrait=$("profilePortrait").getContext("2d");portrait.imageSmoothingEnabled=false;portrait.clearRect(0,0,96,96);drawPet(portrait,data.pet,48,57,.9,data.worn,data.level);$("mood").textContent=p.mood;$("level").textContent=data.level;$("bottomLevel").textContent=data.level;$("xp").textContent=`${data.xp} / 100 XP`;$("xpbar").style.width=data.xp+"%";$("coins").textContent=data.coins;
 for(const k of ["hunger","thirst","happy","energy"]){$(k).style.width=data[k]+"%";$(k+"N").textContent=data[k]+"%"}
 document.querySelectorAll("[data-action]").forEach(b=>{const a=b.dataset.action,ms=left(a);b.disabled=ms>0;b.querySelector("small").textContent=ms?"Aguarde "+seconds(ms):"Pronto"});renderShop();renderMissions();renderDailyReward();drawRoom()}
function choose(id){const cycle=missionCycle();data={pet:id,petName:pets[id].name,petAge:"6 meses",gender:"macho",careUpdatedAt:Date.now(),thirst:80,missions:{cycle,tasks:makeMissionTasks(cycle),counts:{},claimed:[]},level:1,xp:0,coins:30,hunger:80,happy:80,energy:80,cooldowns:{}};$("select").hidden=true;$("game").hidden=false;save();notice(pets[id].mood)}
function notice(t){$("notice").textContent=t}
function act(a){if(!data)return;const map={feed:{hunger:20,thirst:-5,energy:-20,xp:5,coins:1,msg:"Seu pet comeu: fome +20%, sede -5% e sono +20%."},water:{thirst:25,xp:3,coins:0,msg:"Água fresquinha! Sede +25%."},play:{happy:20,hunger:-15,thirst:-15,energy:-50,xp:7,coins:2,msg:"Seu pet brincou: felicidade +20%, mas ficou com fome, sede e muito sono (-50% energia)."},bath:{happy:14,xp:5,coins:1,msg:"Hora do banho!"},cuddle:{happy:20,xp:4,coins:1,msg:"Seu pet adorou o carinho."},sleep:{energy:25,xp:4,coins:1,msg:"Seu pet descansou: energia +25%."}};let c=map[a],ms=left(a);if(ms){notice("Seu pet precisa descansar. Tente novamente em "+seconds(ms)+".");return}if(a==="play"&&data.energy<30){notice("Seu pet está cansado. Deixe-o dormir primeiro.");return}if(a==="feed"&&data.hunger>=96){notice("Seu pet já está satisfeito!");return}if(a==="water"&&data.thirst>=96){notice("Seu pet já está bem hidratado!");return}if(a==="sleep"&&data.energy>=95){notice("Seu pet já está cheio de energia!");return}for(let k of ["hunger","thirst","happy","energy"])if(c[k]){let amount=c[k];if(k==="happy"&&amount>0)addHappy(amount);else data[k]=Math.max(0,Math.min(100,data[k]+amount))}addXP(c.xp);addCoins(c.coins);data.cooldowns[a]=Date.now()+cooldown[a];countMission(a);startAnimation(a);save();notice(c.msg)}
function tick(){if(!data)return;const careChanged=applyCareDecay();if(careChanged||Date.now()-lastCareSave>=30000){lastCareSave=Date.now();save()}if(!data.missions||data.missions.cycle!==missionCycle()){missionState();renderMissions();save()}document.querySelectorAll("[data-action]").forEach(b=>{const a=b.dataset.action,ms=left(a);b.disabled=ms>0;b.querySelector("small").textContent=ms?"Aguarde "+seconds(ms):"Pronto"});if(data.boosts&&data.boosts.luckUntil&&data.boosts.luckUntil<=Date.now()){data.boosts.luckUntil=0;save()}renderShop();renderDailyReward()}
let busy=0;
const foods={biscoito:{n:"Biscoito",p:4,h:14,hp:0},bolo:{n:"Bolo",p:9,h:26,hp:8},banquete:{n:"Banquete",p:16,h:45,hp:15}},clothes={laco:{n:"Laço",p:12},chapeu:{n:"Chapéu",p:20},oculos:{n:"Óculos",p:25},capa:{n:"Capa",p:35}};
const potions={energia:{n:"Poção de energia",p:35,desc:"Recupera 40 de energia"},experiencia:{n:"Poção de experiência",p:50,desc:"Concede 30 XP"},sorte:{n:"Poção da sorte",p:65,desc:"+50% moedas por 5 minutos"}};
const toys={bola:{n:"Bola",p:30,desc:"Felicidade +18 · XP +8 · energia -5"},ursinho:{n:"Ursinho",p:45,desc:"Energia +15 · felicidade +8"},patinho:{n:"Patinho de banho",p:25,desc:"Felicidade +12 · XP +5"},arranhador:{n:"Arranhador",p:55,desc:"Felicidade +14 · XP +7"}};
const accessories={coroa:{n:"Coroa real",p:120,desc:"+5% moedas recebidas"},asas:{n:"Asas mágicas",p:150,desc:"+10% XP recebido"},coleira:{n:"Coleira encantada",p:100,desc:"+10% felicidade nas atividades"}};
const houses={casinha:{n:"Casinha aconchegante",p:90,desc:"Uma casinha nova para o quarto"},mansao:{n:"Casinha real",p:180,desc:"Uma casa especial para seu pet"}};
const wearables={...clothes,...accessories};
function norm(){for(const k of ["hunger","thirst","happy","energy"])data[k]=Math.max(0,Math.min(100,Number.isFinite(Number(data[k]))?Number(data[k]):80));data.careUpdatedAt=Number(data.careUpdatedAt)||Date.now();data.careTimes=data.careTimes&&typeof data.careTimes==="object"?data.careTimes:{hunger:data.careUpdatedAt,thirst:data.careUpdatedAt,happy:data.careUpdatedAt,energy:data.careUpdatedAt};data.gender=["macho","femea"].includes(data.gender)?data.gender:"macho";data.missions=data.missions||{cycle:missionCycle(),tasks:makeMissionTasks(missionCycle()),counts:{},claimed:[]};data.petName=String(data.petName||pets[data.pet].name).trim().slice(0,18)||pets[data.pet].name;data.petAge=data.petAge||"6 meses";data.cooldowns=data.cooldowns||{};data.inv=data.inv&&typeof data.inv==="object"?data.inv:{};data.own=Array.isArray(data.own)?[...new Set(data.own)].filter(k=>Object.hasOwn(clothes,k)):[];data.worn=Array.isArray(data.worn)?[...new Set(data.worn)]:[];data.toys=Array.isArray(data.toys)?[...new Set(data.toys)].filter(k=>Object.hasOwn(toys,k)):[];data.accessories=Array.isArray(data.accessories)?[...new Set(data.accessories)].filter(k=>Object.hasOwn(accessories,k)):[];data.houses=Array.isArray(data.houses)?[...new Set(data.houses)].filter(k=>Object.hasOwn(houses,k)):[];data.toyCooldowns=data.toyCooldowns&&typeof data.toyCooldowns==="object"?data.toyCooldowns:{};data.boosts=data.boosts&&typeof data.boosts==="object"?data.boosts:{luckUntil:0};data.boosts.luckUntil=Number(data.boosts.luckUntil)||0;dailyRewardState();data.house=data.houses.includes(data.house)?data.house:"";data.worn=data.worn.filter(k=>Object.hasOwn(wearables,k)&&(data.own.includes(k)||data.accessories.includes(k)))}
function equipped(id){return data.worn.includes(id)}
function evolutionName(level){return level>=30?"Lendário":level>=20?"Radiante":level>=10?"Brilhante":level>=5?"Especial":"Inicial"}
function addXP(amount){const mult=equipped("asas")?1.1:1;data.xp+=Math.ceil(amount*mult);while(data.xp>=100){data.xp-=100;data.level++;addCoins(15)}}
function addHappy(amount){const mult=equipped("coleira")?1.1:1;data.happy=Math.min(100,data.happy+Math.ceil(amount*mult))}
function addCoins(amount){if(!amount)return;const luck=data.boosts.luckUntil>Date.now()?1.5:1;const crown=equipped("coroa")?1.05:1;data.coins+=Math.round(amount*luck*crown)}
function gain(x,c){addXP(x);addCoins(c)}
function shopSection(title,items,build){return `<div class="shop-group"><h3>${title}</h3>${Object.entries(items).map(([id,it])=>build(id,it)).join("")}</div>`}
 function renderShop(){const s=$("shop");if(!s)return;const row=(it,info,btn)=>`<div class="item"><span><b>${it.n}</b><small>${it.p} moedas · ${info}</small></span><div>${btn}</div></div>`;
  const groups={
   comidas:shopSection("Comidas",foods,(id,it)=>row(it,"fome +"+it.h+" · estoque "+(data.inv[id]||0),`<button data-buy="f:${id}">Comprar</button> <button data-use="${id}" ${(data.inv[id]||0)?"":"disabled"}>Dar</button>`)),
   consumiveis:shopSection("Poções",potions,(id,it)=>row(it,it.desc+" · estoque "+(data.inv[id]||0),`<button data-buy="p:${id}">Comprar</button> <button data-potion="${id}" ${(data.inv[id]||0)?"":"disabled"}>Usar</button>`)),
   brinquedos:shopSection("Brinquedos",toys,(id,it)=>{const own=data.toys.includes(id),wait=Math.max(0,(data.toyCooldowns[id]||0)-Date.now());return row(it,it.desc,own?`<button data-toy="${id}" ${wait?"disabled":""}>${wait?"Aguarde "+seconds(wait):"Usar"}</button>`:`<button data-buy="t:${id}">Comprar</button>`)}),
   roupas:shopSection("Roupas",clothes,(id,it)=>{const own=data.own.includes(id),w=equipped(id);return row(it,"Acessório visual",own?`<button data-wear="${id}">${w?"Retirar":"Equipar"}</button>`:`<button data-buy="c:${id}">Comprar</button>`)}),
   acessorios:shopSection("Acessórios",accessories,(id,it)=>{const own=data.accessories.includes(id),w=equipped(id);return row(it,it.desc,own?`<button data-wear="${id}">${w?"Retirar":"Equipar"}</button>`:`<button data-buy="a:${id}">Comprar</button>`)}),
   casas:shopSection("Casas",houses,(id,it)=>row(it,it.desc,data.houses.includes(id)?`<button data-house="${id}">${data.house===id?"Em uso":"Usar"}</button>`:`<button data-buy="h:${id}">Comprar</button>`))
  };
  const tabs=[["comidas","Comidas"],["consumiveis","Consumíveis"],["brinquedos","Brinquedos"],["roupas","Roupas"],["acessorios","Acessórios"],["casas","Casas"]];
  if(!tabs.some(([id])=>id===activeShopTab))activeShopTab="comidas";
  s.innerHTML=`<div class="shop-tabs" role="tablist" aria-label="Categorias da loja">${tabs.map(([id,label])=>`<button type="button" role="tab" data-shop-tab="${id}" aria-selected="${id===activeShopTab}">${label}</button>`).join("")}</div><div class="shop-content">${tabs.map(([id])=>`<div class="shop-category" data-shop-category="${id}" ${id===activeShopTab?"":"hidden"}>${groups[id]}</div>`).join("")}</div>`;
 }
function shopClick(e){const b=e.target.closest("button");if(!b)return;if(b.dataset.shopTab){activeShopTab=b.dataset.shopTab;renderShop();return}if(!data)return;const{buy,use,wear,potion,toy,house}=b.dataset;
 if(buy){const[t,id]=buy.split(":");const catalogs={f:foods,p:potions,c:clothes,a:accessories,t:toys,h:houses},it=catalogs[t]&&catalogs[t][id];if(!it)return;if(data.coins<it.p){notice("Moedas insuficientes. Cuide do pet para ganhar mais.");return}if(t==="c"&&data.own.includes(id)||t==="a"&&data.accessories.includes(id)||t==="t"&&data.toys.includes(id)||t==="h"&&data.houses.includes(id)){notice("Você já possui esse item.");return}data.coins-=it.p;if(t==="f"||t==="p")data.inv[id]=(data.inv[id]||0)+1;else if(t==="c"){data.own.push(id);data.worn.push(id)}else if(t==="a"){data.accessories.push(id);data.worn.push(id)}else if(t==="t")data.toys.push(id);else if(t==="h"){data.houses.push(id);data.house=id}notice("Comprado: "+it.n+".")}
 else if(use){if(data.hunger>=96){notice("Seu pet já está satisfeito.");return}const f=foods[use];if(!f||!data.inv[use])return;data.inv[use]--;data.hunger=Math.min(100,data.hunger+f.h);data.energy=Math.max(0,data.energy-Math.round(f.h/2));data.thirst=Math.max(0,data.thirst-5);addHappy(f.hp);addXP(3);countMission("feed");startAnimation("feed");notice(f.n+" servido.")}
 else if(potion){if(!data.inv[potion])return;const effects={energia:()=>{if(data.energy>=100){notice("A energia já está completa.");return false}data.energy=Math.min(100,data.energy+40);notice("Poção de energia usada: +40 de energia.")},experiencia:()=>{addXP(30);notice("Poção de experiência usada: +30 XP.")},sorte:()=>{data.boosts.luckUntil=Date.now()+300000;notice("Sorte ativada por 5 minutos: +50% moedas.")}};if(!effects[potion]||effects[potion]()===false)return;data.inv[potion]--;startAnimation("cuddle")}
 else if(toy){if(!data.toys.includes(toy))return;const wait=Math.max(0,(data.toyCooldowns[toy]||0)-Date.now());if(wait){notice("Esse brinquedo precisa descansar por "+seconds(wait)+".");return}const effects={bola:()=>{addHappy(18);data.energy=Math.max(0,data.energy-5);addXP(8);addCoins(2);startAnimation("play")},ursinho:()=>{data.energy=Math.min(100,data.energy+15);addHappy(8);addXP(6);startAnimation("cuddle")},patinho:()=>{addHappy(12);addXP(5);startAnimation("bath")},arranhador:()=>{addHappy(14);addXP(7);startAnimation("play")}};effects[toy]();data.toyCooldowns[toy]=Date.now()+30000;notice("Você brincou com "+toys[toy].n+".")}
 else if(wear){if(!Object.hasOwn(wearables,wear)||(!data.own.includes(wear)&&!data.accessories.includes(wear)))return;data.worn=equipped(wear)?data.worn.filter(x=>x!==wear):[...data.worn,wear];notice("Visual e bônus atualizados.")}
 else if(house){if(!data.houses.includes(house))return;data.house=house;notice("Seu quarto recebeu uma nova casinha.")}
 save()}
// A = quem desafiou (índice 0), B = quem aceitou (índice 1); flip = eu sou o B. Mesma semente => mesmo resultado nos dois aparelhos.
function sim(A,B,rnd,flip){const mx=[A,B].map(p=>60+p.level*8),hp=[...mx],pw=[A,B].map(p=>6+p.level*2+p.worn.filter(k=>Object.hasOwn(clothes,k)).length*2+(p.worn.includes("asas")?2:0)),R=[];let t=rnd()<.5?0:1;
 while(hp[0]>0&&hp[1]>0&&R.length<14){const d=Math.max(3,Math.round(pw[t]*(.7+rnd()*.6)));hp[1-t]=Math.max(0,hp[1-t]-d);R.push({t,d,hp:[...hp]});t=1-t}
 const o={R,mx,win:hp[0]>=hp[1]};return flip?{R:R.map(r=>({t:1-r.t,d:r.d,hp:[r.hp[1],r.hp[0]]})),mx:[mx[1],mx[0]],win:!o.win}:o}
function anim(L,Q,o,end){const g=$("battle").getContext("2d"),{R,mx,win}=o,T=900,t0=performance.now(),nm=p=>p.name||pets[p.pet].name;g.imageSmoothingEnabled=false;
 const frame=now=>{const k=(now-t0)/T,i=Math.min(Math.floor(k),R.length),ph=k-i,r=R[i],sh=R[r&&ph>.5?i:i-1]||{hp:mx},y=190+Math.sin(now/200)*2;
  g.globalAlpha=1;g.fillStyle="#bfe3f0";g.fillRect(0,0,640,260);g.fillStyle="#cfe8c6";g.fillRect(0,170,640,90);g.fillStyle="#9ccf8f";for(let x=0;x<640;x+=40)g.fillRect(x,215+(x/40%2)*10,20,6);
  const off=r?Math.sin(Math.min(ph,1)*Math.PI)*100*(r.t?-1:1):0,sk=r&&ph>.5&&ph<.85?Math.sin(ph*90)*6:0,px=150+(r&&r.t===0?off:0)+(r&&r.t===1?sk:0),ox=490+(r&&r.t===1?off:0)+(r&&r.t===0?sk:0);
  g.globalAlpha=!r&&!win?.45:1;drawPet(g,L.pet,px,y,1.5,L.worn,L.level);
  g.globalAlpha=!r&&win?.45:1;g.save();g.translate(ox,0);g.scale(-1,1);drawPet(g,Q.pet,0,y,1.5,Q.worn,Q.level);g.restore();g.globalAlpha=1;
  if(r&&ph>.5&&ph<.9){const tx=r.t?px:ox,u=(ph-.5)*70;g.fillStyle="#ffd34d";[[-34,-60],[28,-50],[0,-88],[-12,-38]].forEach(([a,b])=>g.fillRect(tx+a,y+b-u,10,10));g.fillStyle="#e0476b";g.font="bold 28px Arial";g.fillText("-"+r.d,tx-14,y-100-u)}
  [L,Q].forEach((p,j)=>{const x=j?380:20,v=sh.hp[j]/mx[j];g.fillStyle="#0003";g.fillRect(x,16,240,16);g.fillStyle=v>.35?"#52c27a":"#e0476b";g.fillRect(x,16,240*v,16);g.fillStyle="#2b2b3a";g.font="bold 14px Arial";g.fillText(nm(p)+" "+sh.hp[j]+"/"+mx[j],x,48)});
  if(k<R.length+.8)requestAnimationFrame(frame);else end()};
 requestAnimationFrame(frame)}
function battle(){
 if(!data||busy)return;const w=left("battle");if(w){notice("Seu pet precisa descansar. Tente em "+seconds(w)+".");return}
 busy=1;const L={pet:data.pet,level:data.level,worn:data.worn},k=Object.keys(pets).filter(x=>x!==data.pet)[Math.floor(Math.random()*(Object.keys(pets).length-1))],Q={pet:k,level:Math.max(1,data.level+Math.floor(Math.random()*5)-2),worn:[]};
 $("arena").hidden=false;$("duelActions").innerHTML="";$("fighters").innerHTML="<b>"+pets[L.pet].name+" · Nv "+L.level+"</b><span> VS </span><b>"+pets[Q.pet].name+" · Nv "+Q.level+"</b>";$("arenaResult").textContent="Treino com rival da casa.";
 const o=sim(L,Q,Math.random);
 anim(L,Q,o,()=>{countMission("train");if(o.win){countMission("train_win");gain(35,10)}else gain(8,2);data.cooldowns.battle=Date.now()+25000;busy=0;save();$("arenaResult").textContent=o.win?"🏆 Vitória! +35 XP e +10 moedas":"Seu pet perdeu, mas aprendeu! +8 XP e +2 moedas"})}

$("profileGender").addEventListener("change",()=>{if(!data)return;data.gender=$("profileGender").value;save();notice("Informação do pet atualizada.")});
$("dailyRewardClaim").addEventListener("click",claimDailyReward);$("openDailyReward").onclick=()=>{$("dailyRewardModal").hidden=false;renderDailyReward();$("dailyRewardResult").hidden=true};$("dailyRewardClose").onclick=()=>$("dailyRewardModal").hidden=true;$("dailyRewardModal").addEventListener("click",e=>{if(e.target===$("dailyRewardModal"))$("dailyRewardModal").hidden=true});
$("missions").addEventListener("click",e=>{const b=e.target.closest("[data-claim]");if(!b||!data)return;missionState();const m=dailyTasks().find(x=>x.id===b.dataset.claim);if(!m||data.missions.claimed.includes(m.id)||(data.missions.counts[m.action]||0)<m.goal)return;data.missions.claimed.push(m.id);addCoins(m.reward);save();notice("Missão concluída. +"+m.reward+" moedas.")});
$("saveProfileName").addEventListener("click",()=>{if(!data)return;const name=$("profileName").value.trim().slice(0,18);if(!name){notice("Digite um nome para o pet.");return}data.petName=name;save();notice("Nome do pet atualizado!")});
document.querySelectorAll("[data-pet]").forEach(b=>b.addEventListener("click",()=>choose(b.dataset.pet)));
document.querySelectorAll("[data-action]").forEach(b=>b.addEventListener("click",()=>act(b.dataset.action)));
$("account").onclick=()=>$("modal").hidden=false;$("close").onclick=$("ok").onclick=()=>$("modal").hidden=true;
$("share").onclick=async()=>{try{await navigator.clipboard.writeText(location.href);notice("Endereço copiado! Depois de publicar, envie o link para sua família.")}catch{notice("Copie o endereço do navegador para compartilhar depois da publicação.")}};
$("practice").onclick=()=>{$("battleMenuModal").hidden=true;battle()};$("openProfile").onclick=()=>{$("profileModal").hidden=false};$("profileClose").onclick=()=>$("profileModal").hidden=true;$("profileModal").addEventListener("click",e=>{if(e.target===$("profileModal"))$("profileModal").hidden=true});$("openMissions").onclick=()=>{$("missionsModal").hidden=false;renderMissions()};$("missionsClose").onclick=()=>$("missionsModal").hidden=true;$("missionsModal").addEventListener("click",e=>{if(e.target===$("missionsModal"))$("missionsModal").hidden=true});$("openBattleMenu").onclick=()=>$("battleMenuModal").hidden=false;$("battleMenuClose").onclick=()=>$("battleMenuModal").hidden=true;$("battleMenuModal").addEventListener("click",e=>{if(e.target===$("battleMenuModal"))$("battleMenuModal").hidden=true});$("shop").onclick=shopClick;$("openShop").onclick=()=>{$("shopModal").hidden=false;renderShop()};$("shopClose").onclick=()=>$("shopModal").hidden=true;$("shopModal").addEventListener("click",e=>{if(e.target===$("shopModal"))$("shopModal").hidden=true});$("findMatch").onclick=()=>{$("battleMenuModal").hidden=true;notice("O modo online ainda precisa de servidor e publicação. O treino local já pode ser testado.")};$("arenaClose").onclick=()=>$("arena").hidden=true;drawPortraits();if(data){if(!data.cooldowns)data.cooldowns={};applyCareDecay();$("select").hidden=true;$("game").hidden=false;render()}setInterval(tick,1000);window.addEventListener("pagehide",()=>{if(data){applyCareDecay();save()}});document.addEventListener("visibilitychange",()=>{if(document.hidden&&data){applyCareDecay();save()}});
