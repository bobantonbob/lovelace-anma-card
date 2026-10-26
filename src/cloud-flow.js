/* ANMA Cloud Flow: responsive architectural scene; shared studio / HA runtime. */
(function(root){
  'use strict';
  const str=v=>typeof v==='string'?v.slice(0,200):'';
  const num=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
  const clamp=(v,min,max,fallback)=>num(v)===null?fallback:Math.max(min,Math.min(max,Number(v)));
  const atlas='__ANMA_CLOUD_ATLAS__',sky='__ANMA_CLOUD_SKY__',evAsset='__ANMA_CLOUD_EV__';
  const asset=name=>typeof document!=='undefined'&&document.currentScript?.src?new URL('assets/'+name,document.currentScript.src).href:'/static/dashboards/assets/'+name;
  const assets={atlas:atlas.startsWith('__')?asset('cloud-flow-atlas.webp'):atlas,sky:sky.startsWith('__')?asset('cloud-flow-sky.webp'):sky,ev:evAsset.startsWith('__')?asset('cloud-flow-ev.webp'):evAsset};
  function normalize(raw={}){
    raw=raw&&typeof raw==='object'?raw:{};
    return {solarPower:str(raw.solarPower),batteryPower:str(raw.batteryPower),batterySoc:str(raw.batterySoc),showNonBackup:raw.showNonBackup!==false,showEv:raw.showEv===true,evGroup:raw.evGroup==='grid'?'grid':'backup',evName:str(raw.evName)||'Tesla · EV',weatherEntity:/^weather\.[\w]+$/.test(raw.weatherEntity)?raw.weatherEntity:'',forecastEntity:/^weather\.[\w]+$/.test(raw.forecastEntity)?raw.forecastEntity:'',forecastType:['auto','hourly','daily','twice_daily'].includes(raw.forecastType)?raw.forecastType:'auto',effects:raw.effects!==false,effectOpacity:clamp(raw.effectOpacity,0,100,35),showForecast:raw.showForecast!==false,solarToday:str(raw.solarToday),solarForecast:str(raw.solarForecast),demoWeather:['sunny','partlycloudy','rainy','snowy','cloudy','clear-night'].includes(raw.demoWeather)?raw.demoWeather:'partlycloudy'};
  }
  function read(id,states,kind='power'){
    if(!id)return null;
    if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(String(id).trim()))return num(id);
    const entity=states?.[id],v=num(entity?.state);if(v===null)return null;
    const u=entity.attributes?.unit_of_measurement;
    const units=kind==='power'?{W:1,kW:1000,MW:1e6}:kind==='energy'?{Wh:.001,kWh:1,MWh:1000}:kind==='soc'?{'%':1}:{};
    return Object.hasOwn(units,u)?v*units[u]:null;
  }
  const sum=values=>values.length&&values.every(v=>v!==null)?values.reduce((a,b)=>a+b,0):null;
  function batteryState(power){return !Number.isFinite(power)?'unknown':Math.abs(power)<10?'idle':power<0?'charging':'discharging';}
  function calculate(c,layout,states={},demo=false){
    const value=(id,fallback,kind='power')=>demo&&!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(String(id).trim())?fallback:read(id,states,kind);
    const solar=c.cloud.solarPower?value(c.cloud.solarPower,3800):sum(c.strings.map((s,i)=>s.mppts.length?sum(s.mppts.map((m,j)=>value(m.power,900+i*100+j*200))):value(s.power,1800+i*200)));
    const powers=c.batteries.map(b=>{const v=value(b.power,-800);return v===null?null:v*(c.invertBattery?-1:1);});
    const state=(id,on,off,fault)=>{if(demo)return 'online';const v=String(states[id]?.state??'').toLowerCase();if(!v||['unknown','unavailable'].includes(v))return 'unknown';return fault?.split(',').map(s=>s.trim()).includes(v)?'fault':off.split(',').map(s=>s.trim()).includes(v)?'offline':on.split(',').map(s=>s.trim()).includes(v)?'online':'unknown';};
    const gridState=state(c.gridStatus,c.gridOn,c.gridOff),rawGrid=value(c.grid||layout.bindings?.grid_power,650);
    const aggregateBattery=c.cloud.batteryPower?value(c.cloud.batteryPower,-1600):null,battery=c.cloud.batteryPower?(aggregateBattery===null?null:aggregateBattery*(c.invertBattery?-1:1)):sum(powers),evOffline=c.cloud.evGroup==='grid'&&gridState==='offline';
    return {solar,battery,batteryState:batteryState(battery),soc:c.cloud.batterySoc?value(c.cloud.batterySoc,76,'soc'):c.batteries.length?value(c.batteries[0].soc,76,'soc'):null,inverter:value(c.inverter.power,solar),inverterState:state(c.inverterStatus,c.inverterOn,c.inverterOff,c.inverterFault),grid:gridState==='offline'?0:rawGrid===null?null:rawGrid*(c.invertGrid?-1:1),gridState,home:value(c.load||layout.bindings?.load_power,2450),nonBackup:gridState==='offline'?0:value(c.nonBackup,350),ev:evOffline?0:value(c.ev||layout.bindings?.ev_power,1000),evOffline,today:value(c.cloud.solarToday,18.6,'energy'),solarForecast:value(c.cloud.solarForecast,24,'energy')};
  }
  const conditions={sunny:['☀','Sunny','Сонячно'],partlycloudy:['⛅','Partly cloudy','Мінлива хмарність'],cloudy:['☁','Cloudy','Хмарно'],'clear-night':['☾','Clear night','Ясна ніч'],rainy:['☂','Rain','Дощ'],pouring:['☂','Heavy rain','Злива'],snowy:['❄','Snow','Сніг'],'snowy-rainy':['❄','Sleet','Мокрий сніг'],fog:['≋','Fog','Туман'],lightning:['ϟ','Thunderstorm','Гроза'],'lightning-rainy':['ϟ','Thunderstorm','Гроза'],windy:['≋','Windy','Вітряно'],'windy-variant':['≋','Windy','Вітряно'],hail:['❄','Hail','Град'],exceptional:['!','Exceptional','Особливі умови']};
  function forecastType(entity,requested='auto'){
    const bits=Number(entity?.attributes?.supported_features)||0;
    const supported={hourly:!!(bits&2),daily:!!(bits&1),twice_daily:!!(bits&4)};
    return requested==='auto'?['hourly','daily','twice_daily'].find(k=>supported[k])||null:supported[requested]?requested:null;
  }
  function weather(c,states={},demo=false,forecast=[]){
    const config=normalize(c),entity=states[config.weatherEntity],known=entity&&conditions[entity.state];
    const forecastEntity=config.forecastEntity||config.weatherEntity,forecastSource=states[forecastEntity];
    const condition=known?entity.state:demo&&!config.weatherEntity?config.demoWeather:'unknown';
    const temperature=known?num(entity.attributes?.temperature):demo&&!config.weatherEntity?18:null;
    const data=forecast.length?forecast:Array.isArray(forecastSource?.attributes?.forecast)?forecastSource.attributes.forecast:[];
    const now=Date.now();
    const items=data.filter(v=>v&&typeof v==='object'&&Number.isFinite(Date.parse(v.datetime))&&Date.parse(v.datetime)>=now-3600000).slice(0,3).map(v=>({datetime:v.datetime,condition:conditions[v.condition]?v.condition:'unknown',temperature:num(v.temperature)}));
    if(demo&&!config.weatherEntity&&!config.forecastEntity&&!items.length)for(let i=0;i<3;i++)items.push({datetime:new Date(now+(i+1)*3600000).toISOString(),condition:['partlycloudy','sunny','cloudy'][i],temperature:[19,21,17][i]});
    return {condition,temperature,unit:entity?.attributes?.temperature_unit||'°C',items,forecastEntity,forecastUnit:forecastSource?.attributes?.temperature_unit||'°C',forecastType:forecastType(forecastSource,config.forecastType)};
  }
  const layouts={
    desktop:{width:1200,height:680,solar:[140,195,270,245],grid:[1040,190,220,280],house:[600,365,300,270],battery:[165,530,245,225],nonBackup:[1035,535,240,225],solarLabel:[325,100],gridLabel:[875,100],inverterLabel:[600,205],homeLabel:[600,555],batteryLabel:[155,390],nonBackupLabel:[1030,390]},
    phone:{width:375,height:480,solar:[76,95,135,110],grid:[300,100,100,130],house:[188,245,140,135],battery:[75,365,125,115],nonBackup:[300,365,125,115],solarLabel:[76,25],gridLabel:[300,25],inverterLabel:[78,220],homeLabel:[188,325],batteryLabel:[75,440],nonBackupLabel:[300,440]}
  };
  function sceneLayout(phone,cloud){const base=layouts[phone?'phone':'desktop'];return {...base,height:base.height+(cloud.showEv?140:0),ev:phone?[188,510,150,112]:[600,cloud.showEv?655:560,210,140],evLabel:phone?[188,580]:[600,cloud.showEv?762:620]};}
  const css=`
    .cf-scene{--cf-bg:#0b1721;--cf-text:#f1f6fb;--cf-muted:#a9bbcd;--cf-border:#304658;--cf-panel:#102130;position:relative;isolation:isolate;grid-column:1/-1;width:100%;min-width:0;box-sizing:border-box;border:1px solid var(--cf-border);border-radius:18px;overflow:hidden;background:var(--cf-bg);color:var(--cf-text);font:14px system-ui,sans-serif;container-type:inline-size;container-name:cloudscene}
    .cf-scene[data-theme=day]{--cf-bg:#e9f0f6;--cf-text:#172d40;--cf-muted:#465d70;--cf-border:#b7c9d8;--cf-panel:#f5f8fc}.cf-scene[data-theme=day] .cf-landscape{opacity:.18}.cf-scene[data-theme=day] .cf-number{text-shadow:0 1px 1px #fff}.cf-scene[data-theme=day] .cf-node-label{--cf-label-shadow:#fff9}.cf-scene[data-theme=day] .cf-node-label[data-state=offline],.cf-scene[data-theme=day] .cf-node-label[data-state=unknown]{color:#566573}
    .cf-landscape{position:absolute;inset:0;background-image:var(--cf-sky);background-size:cover;background-position:center top;opacity:.45;pointer-events:none;z-index:-3}.cf-scene::before{content:'';position:absolute;inset:0;z-index:-2;pointer-events:none;background:linear-gradient(180deg,transparent 0%,var(--cf-bg) 90%)}
    .cf-scene.cf-scene>.cf-landscape{position:absolute;z-index:-3}.cf-scene.cf-scene>.cf-atmosphere{position:absolute;z-index:-1}
    .cf-head{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:18px 20px 10px}.cf-head h2{margin:0;color:#f1873d;font-size:22px}.cf-head .cf-name{color:var(--cf-text);font-size:14px;margin-left:12px}.cf-tools{display:flex;gap:6px}.cf-scene button{font:inherit;cursor:pointer;color:inherit;border:1px solid var(--cf-border);border-radius:10px;background:var(--cf-panel);padding:9px 11px}.cf-scene .cf-connections{color:#f1873d}
    .cf-weather{display:flex;align-items:center;justify-content:flex-end;gap:16px;flex-wrap:wrap;padding:0 20px 12px;min-height:40px;font-size:13px}.cf-weather-main{display:flex;align-items:center;gap:9px}.cf-weather-main b{font-size:24px}.cf-weather-icon{font-size:28px;color:#f6b94b}.cf-weather-forecast{display:flex;gap:14px;list-style:none;margin:0;padding:0}.cf-weather-forecast li{display:grid;grid-template-columns:auto auto;gap:2px 5px}.cf-weather-forecast time{grid-column:1/-1;color:var(--cf-muted);font-size:11px}.cf-weather-note{font-size:12px;color:var(--cf-muted)}
    .cf-viewport{position:relative;width:100%;min-width:0;overflow:hidden}.cf-stage{position:absolute;left:50%;top:0;transform-origin:top center}.cf-svg{display:block;width:100%;height:100%;overflow:visible}.cf-object{position:absolute;transform:translate(-50%,-50%);pointer-events:none;background-image:var(--cf-atlas);background-repeat:no-repeat;filter:drop-shadow(0 8px 8px #0004)}.cf-object[data-state=idle],.cf-object[data-state=offline],.cf-object[data-state=unknown]{filter:grayscale(.8) brightness(.65) drop-shadow(0 6px 7px #0003)}
    .cf-node-label{--cf-label-shadow:#08121de6;position:absolute;transform:translate(-50%,-50%);text-align:center;white-space:nowrap;color:var(--cf-color);text-shadow:0 2px 5px var(--cf-label-shadow);line-height:1.35;z-index:3}.cf-node-label span{display:block;font-size:clamp(12px,1.1cqw,16px);color:var(--cf-text)}.cf-node-label b{display:block;font-size:clamp(24px,2.7cqw,38px);font-weight:750;font-variant-numeric:tabular-nums}.cf-node-label small{font-size:clamp(11px,1cqw,14px);color:var(--cf-muted);display:block}.cf-node-label[data-state=unknown],.cf-node-label[data-state=offline],.cf-node-label[data-state=idle]{color:#8998a7}.cf-node-label[data-kind=inverter] b{font-size:clamp(20px,2cqw,29px)}
    .cf-track{fill:none;stroke:var(--cf-wire);stroke-width:1.5;opacity:.2}.cf-flow{fill:none;stroke:var(--cf-wire);stroke-width:2.6;stroke-dasharray:5 13;stroke-linecap:round;animation:cf-flow 1s linear infinite;filter:drop-shadow(0 0 3px var(--cf-wire))}.cf-flow[data-active=false]{display:none}.cf-flow[data-reverse=true]{animation-direction:reverse}.cf-particle{fill:var(--cf-wire);filter:drop-shadow(0 0 4px var(--cf-wire))}.cf-edge[data-active=false] .cf-particle{display:none}.cf-arrow{fill:var(--cf-wire)}@keyframes cf-flow{to{stroke-dashoffset:-18}}
    .cf-atmosphere{position:absolute;inset:0;opacity:var(--cf-effects,.35);pointer-events:none;z-index:-1;overflow:hidden}.cf-scene[data-effects=false] .cf-atmosphere{display:none}.cf-atmosphere::after{content:'';position:absolute;inset:-30%;background:radial-gradient(ellipse at 15% 10%,#ffc76177,transparent 48%)}.cf-scene[data-weather=cloudy] .cf-atmosphere::after,.cf-scene[data-weather=fog] .cf-atmosphere::after{background:radial-gradient(ellipse at 60% 0,#c8d7e855,transparent 65%)}.cf-scene[data-weather=clear-night] .cf-atmosphere::after{background:radial-gradient(ellipse at 80% 0,#87aaff33,transparent 60%)}
    .cf-scene[data-weather=rainy] .cf-atmosphere::after,.cf-scene[data-weather=pouring] .cf-atmosphere::after,.cf-scene[data-weather=lightning-rainy] .cf-atmosphere::after{background:repeating-linear-gradient(110deg,transparent 0 47px,#c4dcf866 48px 49px,transparent 50px 90px);animation:cf-rain 5s ease-in-out infinite alternate}.cf-scene[data-weather=snowy] .cf-atmosphere::after,.cf-scene[data-weather=snowy-rainy] .cf-atmosphere::after{background-image:radial-gradient(circle,#fff8 1px,transparent 2px);background-size:52px 65px;animation:cf-snow 8s ease-in-out infinite alternate}@keyframes cf-rain{from{transform:translateX(-18px)}to{transform:translateX(18px)}}@keyframes cf-snow{from{transform:translate(-14px,-4px)}to{transform:translate(14px,4px)}}
    .cf-foot{display:flex;justify-content:center;gap:20px;padding:12px 18px 18px;font-size:12px;color:var(--cf-muted)}.cf-foot span::before{content:'●';color:var(--cf-color);margin-right:6px}.cf-settings{position:absolute;z-index:10;inset:65px 10px 10px auto;width:min(450px,calc(100% - 20px));background:var(--cf-panel);border:1px solid #b8753e;border-radius:12px;padding:12px;overflow:auto;box-sizing:border-box;overscroll-behavior:contain}.cf-settings[hidden]{display:none}.cf-settings .apf-config{position:static;inset:auto;display:block;background:transparent;overflow:visible;border:0;padding:0}.cf-settings .apf-settings{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}.cf-settings fieldset{min-width:0;border:1px solid #6d7c89;border-radius:8px;padding:10px;display:grid;gap:8px}.cf-settings legend{color:#f1873d}.cf-settings label{display:grid;gap:5px}.cf-settings input,.cf-settings select{width:100%;box-sizing:border-box;min-width:0;padding:8px;border:1px solid #526677;border-radius:6px;color:var(--cf-text);background:var(--cf-bg);font:inherit}.cf-settings input[type=checkbox]{width:auto;justify-self:start}.cf-settings .apf-entity-menu{display:grid;gap:4px}.cf-settings .apf-entity-menu[hidden]{display:none}.cf-settings small{color:var(--cf-muted)}
    .cf-scene[data-fit=true]{min-height:0}.cf-scene:fullscreen{height:100dvh;border-radius:0;display:flex;flex-direction:column}.cf-scene:fullscreen .cf-viewport{flex:none;min-height:0}.cf-scene:fullscreen .cf-svg{position:absolute;inset:0}.cf-scene[data-phone=true] .cf-head{padding:14px 12px 8px;align-items:flex-start}.cf-scene[data-phone=true] .cf-head h2{font-size:18px}.cf-scene[data-phone=true] .cf-name{display:block;font-size:12px;margin:4px 0 0}.cf-scene[data-phone=true] .cf-connections{font-size:0}.cf-scene[data-phone=true] .cf-connections::before{content:'⚙';font-size:18px}.cf-scene[data-phone=true] .cf-weather{padding:4px 12px 12px;gap:8px;justify-content:space-between}.cf-scene[data-phone=true] .cf-weather-main b{font-size:21px}.cf-scene[data-phone=true] .cf-weather-forecast{width:100%;justify-content:space-between;gap:8px}.cf-scene[data-phone=true] .cf-weather-forecast li{display:flex;align-items:center;gap:5px}.cf-scene[data-phone=true] .cf-foot{gap:12px;flex-wrap:wrap;font-size:11px}.cf-scene[data-phone=true] .cf-node-label span{font-size:14px}.cf-scene[data-phone=true] .cf-node-label b{font-size:22px}.cf-scene[data-phone=true] .cf-node-label small{font-size:12px}.cf-scene[data-phone=true] .cf-node-label[data-kind=inverter] b{font-size:20px}.cf-scene[data-phone=true] .cf-node-label[data-kind=inverter] span{font-size:11px}.cf-scene[data-phone=true] .cf-settings{top:58px}
    @media(prefers-reduced-motion:reduce){.cf-scene *{animation:none!important}.cf-scene .cf-particle{display:none}}
  `;
  // Source atlas crops are isolated alpha images; CSS crops keep one downloadable asset.
  const crops={solar:[0,100,600,440],grid:[620,0,300,550],house:[955,90,581,460],battery:[0,570,540,450],nonBackup:[540,590,540,400]};
  const colors={solar:'#f4b744',grid:'#58b7ff',inverter:'#f1873d',home:'#46d3e5',battery:'#65d69a',nonBackup:'#67baff',ev:'#46d3e5'};
  function render(layout,{uk=false,demo=false,hass=null,change=null,normalizePower}={}){
    const c=normalizePower(layout.powerFlow),tr=(en,ua)=>uk?ua:en;
    const n=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
    const s=(tag,attrs={})=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
    const card=n('section','cf-scene apf-cloud db-widget-box');card.setAttribute('aria-label','ANMA Cloud Flow');card.dataset.fit=String(c.fit);card.style.setProperty('--cf-atlas',`url("${assets.atlas}")`);card.style.setProperty('--cf-sky',`url("${assets.sky}")`);const landscape=n('div','cf-landscape');card.append(n('style','',css),landscape,n('div','cf-atmosphere'));
    const background=c.background||layout.background;
    if(background?.image){landscape.style.backgroundImage='url('+JSON.stringify(background.image)+')';landscape.style.backgroundSize=background.fit||'cover';landscape.style.backgroundPosition=background.position||'center';landscape.style.opacity=(background.opacity??25)/100;}
    const head=n('header','cf-head'),brand=n('h2','','Cloud Flow'),name=n('span','cf-name',layout.name||'');brand.append(name);const tools=n('div','cf-tools');head.append(brand,tools);card.append(head);
    const expand=n('button','cf-expand','⛶');expand.type='button';expand.setAttribute('aria-label',tr('Cloud Flow fullscreen','Cloud Flow на весь екран'));expand.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await card.requestFullscreen();}catch(_){expand.title=tr('Fullscreen unavailable in this browser','Повноекранний режим недоступний у браузері');}};tools.append(expand);
    const weatherBox=n('div','cf-weather'),weatherMain=n('div','cf-weather-main'),weatherIcon=n('span','cf-weather-icon'),temperature=n('b'),condition=n('span'),forecastList=n('ol','cf-weather-forecast'),weatherNote=n('span','cf-weather-note');weatherMain.append(weatherIcon,temperature,condition);weatherBox.append(weatherMain,forecastList,weatherNote);card.append(weatherBox);
    const viewport=n('div','cf-viewport'),stage=n('div','cf-stage'),svg=s('svg',{'class':'cf-svg','aria-hidden':'true',preserveAspectRatio:'none'});stage.append(svg);viewport.append(stage);card.append(viewport);
    const objects={},labels={};
    for(const kind of [...Object.keys(crops),'ev']){const obj=n('div','cf-object');obj.dataset.kind=kind;obj.setAttribute('aria-hidden','true');objects[kind]=obj;stage.append(obj);if(kind==='ev'){obj.style.backgroundImage=`url("${assets.ev}")`;obj.style.backgroundSize='contain';obj.style.backgroundPosition='center';}}
    const names={solar:tr('SOLAR','СОНЦЕ'),grid:tr('GRID','МЕРЕЖА'),inverter:c.inverter.name||tr('INVERTER','ІНВЕРТОР'),home:c.backupName==='EPS / Backup'?tr('HOME','БУДИНОК'):c.backupName,battery:tr('BATTERY','БАТАРЕЯ'),nonBackup:c.nonBackupName==='Grid / Non-backup'?tr('NON-BACKUP','НЕГАРАНТОВАНЕ'):c.nonBackupName};
    names.ev=c.cloud.evName;
    for(const kind of Object.keys(names)){const el=n('div','cf-node-label'),title=n('span','',names[kind]),value=n('b','','—'),detail=n('small');el.dataset.kind=kind;el.style.setProperty('--cf-color',colors[kind]);el.append(title,value,detail);stage.append(el);labels[kind]={el,value,detail};}
    const foot=n('div','cf-foot');for(const kind of ['solar','grid','battery','home']){const el=n('span','',names[kind]);el.style.setProperty('--cf-color',colors[kind]);foot.append(el);}if(demo)foot.append(n('small','',tr('DEMO · simulated values','ДЕМО · змодельовані значення')));card.append(foot);
    let live=hass,data,phone=false,forecast=[],subscription=null,connection=null,subscriptionKey='',dead=false,token=null,resizeObserver;
    const edges={};for(const key of ['solar','grid','battery','home','nonBackup','ev']){const g=s('g',{'class':'cf-edge','data-branch':key}),track=s('path',{'class':'cf-track'}),flow=s('path',{'class':'cf-flow'});g.style.setProperty('--cf-wire',colors[key]);g.append(track,flow);const dots=[];for(let i=0;i<3;i++){const dot=s('circle',{'class':'cf-particle',r:3-i*.6,opacity:1-i*.28}),motion=s('animateMotion',{dur:'4s',repeatCount:'indefinite',begin:(-i*.11)+'s'});dot.append(motion);g.append(dot);dots.push(motion);}svg.append(g);edges[key]={g,track,flow,dots};}
    function place(){
      const width=viewport.clientWidth;if(!width)return;phone=c.profile==='mobile'||c.profile!=='desktop'&&width<600;card.dataset.phone=String(phone);
      const l=sceneLayout(phone,c.cloud),bounds=card.getBoundingClientRect(),style=getComputedStyle(card);
      const chrome=head.offsetHeight+weatherBox.offsetHeight+foot.offsetHeight+['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth'].reduce((v,k)=>v+(parseFloat(style[k])||0),0);
      const screenBottom=window.visualViewport?window.visualViewport.offsetTop+window.visualViewport.height:window.innerHeight;
      const available=Math.max(120,screenBottom-Math.max(0,bounds.top)-chrome-24);
      const fit=c.fit!==false||card.matches(':fullscreen'),scale=Math.min(width/l.width,fit?available/l.height:Infinity);
      viewport.style.height=l.height*scale+'px';stage.style.width=l.width+'px';stage.style.height=l.height+'px';stage.style.transform=`translateX(-50%) scale(${scale})`;svg.setAttribute('viewBox',`0 0 ${l.width} ${l.height}`);
      for(const [kind,el] of Object.entries(objects)){const [x,y,w,h]=l[kind];el.style.left=x/l.width*100+'%';el.style.top=y/l.height*100+'%';el.style.width=w/l.width*100+'%';el.style.height=h/l.height*100+'%';if(crops[kind]){const [sx,sy,cw,ch]=crops[kind];el.style.backgroundSize=`${1536/cw*100}% ${1024/ch*100}%`;el.style.backgroundPosition=`${sx/(1536-cw)*100}% ${sy/(1024-ch)*100}%`;}}
      for(const [kind,{el}] of Object.entries(labels)){const [x,y]=l[kind+'Label'];el.style.left=x/l.width*100+'%';el.style.top=y/l.height*100+'%';}
      const paths=phone?{solar:'M100 140L137 170Q145 175 145 187V210L174 225',grid:'M290 165L246 195Q238 200 238 210V225L210 235',battery:'M173 285L125 310Q114 317 110 330L94 340',home:'M188 285V307',nonBackup:'M262 165V270Q262 285 277 294L307 315V330'}:{solar:'M240 260L400 314L535 366',grid:'M978 270L800 320L680 360',battery:'M545 450L402 490L260 550',home:'M602 460V515',nonBackup:'M950 286L895 330L955 380Q975 393 975 420V470'};
      paths.ev=phone?(c.cloud.evGroup==='grid'?'M302 165H366V465H235V470':'M188 342V465'):(c.cloud.evGroup==='grid'?'M978 270H1160V730H760L705 675':'M602 460L730 520V620Q730 640 710 640H705');
      for(const [key,e] of Object.entries(edges)){e.track.setAttribute('d',paths[key]);e.flow.setAttribute('d',paths[key]);for(const m of e.dots)m.setAttribute('path',paths[key]);}
    }
    const power=v=>v===null?'—':Math.abs(v)>=1000?(Math.abs(v)/1000).toLocaleString(uk?'uk':'en',{maximumFractionDigits:2})+' '+tr('kW','кВт'):Math.round(Math.abs(v))+' '+tr('W','Вт');
    function setLabel(kind,value,detail,state){const label=labels[kind];label.value.textContent=value;label.detail.textContent=detail||'';label.el.dataset.state=state;objects[kind==='home'?'house':kind]?.setAttribute('data-state',state);}
    const knownState=v=>v===null?'unknown':Math.abs(v)<10?'idle':'online';
    function updateWeather(){
      const w=weather(c.cloud,live?.states||{},demo,forecast),entry=conditions[w.condition];card.dataset.weather=w.condition;card.dataset.effects=String(c.cloud.effects&&w.condition!=='unknown');card.style.setProperty('--cf-effects',c.cloud.effectOpacity/100);
      weatherIcon.textContent=entry?.[0]||'◌';temperature.textContent=w.temperature===null?'—':w.temperature.toLocaleString(uk?'uk':'en',{maximumFractionDigits:1})+w.unit;condition.textContent=entry?.[uk?2:1]||tr('Choose a weather entity in Connections','Оберіть погодну сутність у З’єднаннях');forecastList.replaceChildren();
      if(c.cloud.showForecast)for(const item of w.items){const li=n('li'),date=new Date(item.datetime),time=n('time','',date.toLocaleString(uk?'uk':'en',w.forecastType==='daily'?{weekday:'short'}:{hour:'2-digit',minute:'2-digit',hour12:false}));li.style.whiteSpace='nowrap';time.dateTime=item.datetime;li.append(time,n('span','',conditions[item.condition]?.[0]||'◌'),n('b','',item.temperature===null?'—':Math.round(item.temperature)+w.forecastUnit));forecastList.append(li);}
      weatherNote.textContent=c.cloud.showForecast&&w.forecastEntity&&!w.items.length?tr('Forecast unavailable','Прогноз недоступний'):'';
      const conn=live?.connection,key=w.forecastEntity+':'+w.forecastType+':'+c.cloud.showForecast;
      if(key===subscriptionKey&&conn===connection)return;
      subscription?.();subscription=null;token={};const current=token;connection=conn;subscriptionKey=key;forecast=[];
      if(!card.isConnected||!conn?.subscribeMessage||!w.forecastType||demo||!c.cloud.showForecast)return;
      conn.subscribeMessage(event=>{if(dead||token!==current)return;forecast=Array.isArray(event.forecast)?event.forecast:[];updateWeather();},{type:'weather/subscribe_forecast',entity_id:w.forecastEntity,forecast_type:w.forecastType}).then(unsub=>{if(dead||token!==current)unsub();else subscription=unsub;}).catch(()=>{if(token===current)weatherNote.textContent=tr('Forecast unavailable','Прогноз недоступний');});
    }
    function refresh(options={}){
      if(dead)return;live=options.hass??live;data=calculate(c,layout,live?.states||{},demo);
      const theme=c.mode==='auto'?(typeof live?.themes?.darkMode==='boolean'?(live.themes.darkMode?'night':'day'):String(layout.theme?.mode).startsWith('light')?'day':'night'):c.mode;card.dataset.theme=theme;
      setLabel('solar',power(data.solar),(data.today!==null||c.cloud.solarForecast)?tr('Today ','Сьогодні ')+(data.today===null?'—':data.today.toLocaleString(uk?'uk':'en',{maximumFractionDigits:1}))+(c.cloud.solarForecast?' / '+(data.solarForecast===null?'—':data.solarForecast.toLocaleString(uk?'uk':'en',{maximumFractionDigits:1})):'')+' '+tr('kWh','кВт·год'):'',knownState(data.solar));
      setLabel('grid',power(data.grid),data.gridState==='offline'?tr('NO GRID','НЕМАЄ МЕРЕЖІ'):data.grid===null?tr('No data','Немає даних'):data.grid>0?tr('IMPORT','ІМПОРТ'):data.grid<0?tr('EXPORT','ЕКСПОРТ'):tr('IDLE','ОЧІКУВАННЯ'),data.gridState==='offline'?'offline':knownState(data.grid));
      setLabel('inverter',power(data.inverter),({online:tr('Running','Працює'),offline:tr('Standby','Очікування'),fault:tr('Fault','Помилка'),unknown:tr('Status unknown','Стан невідомий')})[data.inverterState],data.inverterState);
      setLabel('home',power(data.home),'',knownState(data.home));setLabel('nonBackup',data.gridState==='offline'?'—':power(data.nonBackup),data.gridState==='offline'?tr('No supply','Без живлення'):'',data.gridState==='offline'?'offline':knownState(data.nonBackup));
      setLabel('battery',data.soc===null?'—':Math.round(data.soc)+'%',data.battery===null?tr('No power data','Немає потужності'):({charging:tr('Charging · ','Заряд · '),discharging:tr('Discharging · ','Розряд · '),idle:tr('Standby · ','Очікування · ')})[data.batteryState]+power(data.battery),data.batteryState);
      labels.battery.el.style.setProperty('--cf-color',data.batteryState==='discharging'?'#58b7ff':colors.battery);edges.battery.g.style.setProperty('--cf-wire',data.batteryState==='discharging'?'#58b7ff':colors.battery);
      setLabel('ev',power(data.ev),data.evOffline?tr('No supply','Без живлення'):data.ev===null?tr('No data','Немає даних'):Math.abs(data.ev)<10?tr('Standby','Очікування'):data.ev<0?tr('Export','Віддає енергію'):tr('Charging','Заряд'),data.evOffline?'offline':knownState(data.ev));
      for(const [kind,visible] of [['nonBackup',c.cloud.showNonBackup],['ev',c.cloud.showEv]]){objects[kind].style.display=labels[kind].el.style.display=visible?'':'none';edges[kind].g.style.display=visible?'':'none';}
      for(const [key,e] of Object.entries(edges)){const value=data[key],active=value!==null&&Math.abs(value)>=10&&layout.motion!==false&&(key==='grid'||key==='nonBackup'||key==='ev'&&c.cloud.evGroup==='grid'?data.gridState!=='offline':true);const reverse=key==='grid'?value<0:key==='battery'?value>0:key==='home'||key==='ev'?value<0:false;e.g.dataset.active=e.flow.dataset.active=String(active);e.flow.dataset.reverse=String(reverse);const duration=6-4.5*Math.min(1,Math.abs(value||0)/10000);for(const m of e.dots){m.setAttribute('dur',duration+'s');m.setAttribute('keyPoints',reverse?'1;0':'0;1');m.setAttribute('keyTimes','0;1');m.setAttribute('calcMode','linear');}}
      updateWeather();
    }
    if(change){
      const settings=n('div','cf-settings');settings.hidden=true;
      const toggle=n('button','cf-connections',tr('⚙ Connections','⚙ З’єднання'));toggle.type='button';toggle.setAttribute('aria-label',tr('Connections','З’єднання'));toggle.setAttribute('aria-expanded','false');
      const close=n('button','',tr('✕ Close','✕ Закрити'));close.type='button';close.onclick=()=>{settings.hidden=true;toggle.setAttribute('aria-expanded','false');};settings.append(close);
      card.dataset.cloudId=layout.id||'';
      const editor=root.AnmaPowerFlow.editor(c,uk,(next,redraw)=>{
        const scope=card.getRootNode();layout.powerFlow=next;change(redraw);
        for(const scene of scope.querySelectorAll('.cf-scene'))if(scene.dataset.cloudId===card.dataset.cloudId){const panel=scene.querySelector('.cf-settings');if(panel)panel.hidden=false;scene.querySelector('.cf-connections')?.setAttribute('aria-expanded','true');}
      },{template:'cloud_flow',demoPreview:demo,getStates:()=>live?.states||{},legacyBackground:layout.background});
      editor.open=true;settings.append(editor);card.append(settings);toggle.onclick=()=>{settings.hidden=!settings.hidden;toggle.setAttribute('aria-expanded',String(!settings.hidden));};tools.append(toggle);card.addEventListener('keydown',e=>{if(e.key==='Escape')close.click();});
    }
    let removalObserver;
    card._cloudRefresh=refresh;card._cloudDispose=()=>{dead=true;card._cloudDisposed=true;token=null;subscription?.();subscription=null;resizeObserver?.disconnect();window.removeEventListener('resize',place);window.visualViewport?.removeEventListener('resize',place);card.removeEventListener('fullscreenchange',place);removalObserver?.disconnect();};card._cloudKey=JSON.stringify([layout.powerFlow,layout.theme,layout.name,layout.motion,uk,demo]);
    refresh();requestAnimationFrame(()=>{if(!card.isConnected)return;subscriptionKey='';refresh();place();resizeObserver=new ResizeObserver(place);resizeObserver.observe(viewport);resizeObserver.observe(weatherBox);window.addEventListener('resize',place);window.visualViewport?.addEventListener('resize',place);card.addEventListener('fullscreenchange',place);removalObserver=new MutationObserver(()=>{if(!card.isConnected)card._cloudDispose();});removalObserver.observe(card.getRootNode(),{childList:true,subtree:true});});
    return card;
  }
  function update(host,layout,options={}){
    const key=JSON.stringify([layout.powerFlow,layout.theme,layout.name,layout.motion,options.uk||false,options.demo||false]),current=host.firstElementChild;
    if(current?._cloudKey===key&&!current._cloudDisposed){current._cloudRefresh(options);return current;}
    const settingsOpen=current?.querySelector('.cf-settings')?.hidden===false;
    current?._cloudDispose?.();const card=render(layout,options);
    if(settingsOpen){const panel=card.querySelector('.cf-settings');if(panel)panel.hidden=false;card.querySelector('.cf-connections')?.setAttribute('aria-expanded','true');}
    host.replaceChildren(card);return card;
  }
  const api={normalize,calculate,batteryState,read,weather,forecastType,layouts,sceneLayout,render,update};root.AnmaCloudFlow=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
