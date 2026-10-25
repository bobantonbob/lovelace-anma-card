/* ANMA Energy Station: shared website / Home Assistant scene and configuration. */
(function(root){
  'use strict';
  const str=v=>typeof v==='string'?v.slice(0,180):typeof v==='number'&&Number.isFinite(v)?String(v):'';
  const choose=(v,values,fallback)=>values.includes(v)?v:fallback;
  const icons={
    solar:'M3 9h26l-4 16H0L3 9Zm7 0L7 25M19 9l-3 16M2 17h25M12 25v4m-7 0h14',
    sun:'M16 1v4m0 22v4M1 16h4m22 0h4M5 5l3 3m16 16 3 3M5 27l3-3M24 8l3-3M23 16a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
    grid:'M12 3h8l6 26H6L12 3Zm-4 9h16M5 19h22M12 12l10 14m-2-14L10 26M9 6h14',
    home:'M2 15 16 3l14 12M6 12v17h8V19h5v10h7V12M9 16h2m10 0h2',
    inverter:'M6 2h20v28H6V2Zm5 5h10v6H11V5Zm7 12-5 5h6l-5 5',
    battery:'M12 2h8v3H12V2ZM7 5h18v25H7V5Z',
    ev:'M4 15 8 6h16l4 9v12h-5v-5H9v5H4V15Zm0 0h24M7 18h5m8 0h5',
    boiler:'M9 2h14v25H9V2Zm3 6h8m-8 12h8M12 27v4m8-4v4',
    pump:'M5 5h22v22H5V5Zm17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0M16 10v6l5 3',
    light:'M10 24h12m-11 4h10M12 22c0-5-6-6-6-12a10 10 0 0 1 20 0c0 6-6 7-6 12',
    generator:'M3 9h26v17H3V9Zm4-4h18v4M7 26v4m18-4v4M8 14h7v7H8v-7m13 0h5m-5 5h5',
    micro:'M2 4h28l-4 15H0L2 4Zm8 0L7 19m13-15-3 15M1 11h27M12 23h12v7H12v-7',
    other:'M5 3h22v27H5V3Zm5 4h2m4 0h2m5 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0'
  };
  // Center each occupied row, including the final partial row. Keep load groups inside the canvas.
  function rowPosition(index,count,columns,center,spacing,width=null){
    const start=Math.floor(index/columns)*columns,n=Math.min(columns,count-start);
    const half=(n-1)*spacing/2;
    const anchor=width===null?center:Math.max(70+half,Math.min(width-70-half,center));
    return anchor+(index-start-(n-1)/2)*spacing;
  }
  const defaultColors={solar:'#e9a526',grid:'#55a8ef',backup:'#32b6ca',battery:'#36c989',charge:'#36c989',discharge:'#56b8ed',aux:'#b38ae8',inverter:'#f1873d'};
  const telemetryKinds={soc:'soc',voltage:'voltage',current:'current',capacity:'energy',chargeToday:'energy',dischargeToday:'energy',importToday:'energy',exportToday:'energy',homeToday:'energy',frequency:'frequency',acTemperature:'temperature',dcTemperature:'temperature',buyPrice:'price'};
  function runtimeHours(soc,capacity,power,reserve){
    if(![soc,capacity,power,reserve].every(Number.isFinite)||soc<0||soc>100||capacity<=0||power<10||reserve<0||reserve>100)return null;
    return Math.max(0,soc-reserve)/100*capacity*1000/power;
  }
  function normalize(raw={}){
    raw=raw&&typeof raw==='object'?raw:{};
    const device=(d={},i)=>({name:str(d.name),power:str(d.power),soc:str(d.soc),voltage:str(d.voltage),temperature:str(d.temperature),capacity:str(d.capacity),visible:d.visible!==false});
    const list=(v,n,max)=> (Array.isArray(v)?v:Array.from({length:n},()=>({}))).slice(0,max).map(device);
    return {
      phases:Number(raw.phases)===3?3:1,phaseReadings:Array.from({length:3},(_,i)=>({voltage:str(raw.phaseReadings?.[i]?.voltage),current:str(raw.phaseReadings?.[i]?.current)})),colors:Object.fromEntries(Object.entries(defaultColors).map(([k,v])=>[k,/^#[0-9a-f]{6}$/i.test(raw.colors?.[k])?raw.colors[k]:v])),
      fit:raw.fit!==false,master:Object.fromEntries(['power','soc','voltage','current','capacity','chargeToday','dischargeToday'].map(k=>[k,str(raw.master?.[k])])),reserveSoc:str(raw.reserveSoc)||'20',telemetry:Object.fromEntries(['importToday','exportToday','homeToday','voltage','current','frequency','acTemperature','dcTemperature','buyPrice'].map(k=>[k,str(raw.telemetry?.[k])])),currency:str(raw.currency)||'UAH',inverterStatus:str(raw.inverterStatus),inverterOn:str(raw.inverterOn)||'on,online,running,normal',inverterOff:str(raw.inverterOff)||'off,offline,standby',inverterFault:str(raw.inverterFault)||'fault,error,alarm',
      format:choose(raw.format,['auto','wide','square','phone'],'auto'),
      subtitle:str(raw.subtitle),backgroundOpacity:Number.isFinite(Number(raw.backgroundOpacity))?Math.max(0,Math.min(100,Number(raw.backgroundOpacity))):100,
      theme:choose(raw.theme,['auto','day','night'],'auto'),
      demoScene:choose(raw.demoScene,['sun','import','night','outage'],'sun'),
      motion:raw.motion!==false,showSolar:raw.showSolar!==false,showBatteries:raw.showBatteries!==false,
      showGrid:raw.showGrid!==false,showBackup:raw.showBackup!==false,showNonBackup:raw.showNonBackup!==false,
      hideOffline:raw.hideOffline===true,gridPower:str(raw.gridPower),gridStatus:str(raw.gridStatus),
      gridOn:str(raw.gridOn)||'on,online,connected,1',gridOff:str(raw.gridOff)||'off,offline,disconnected,0',
      gridPositive:choose(raw.gridPositive,['import','export'],'import'),batteryPositive:choose(raw.batteryPositive,['discharge','charge'],'discharge'),
      pvTotal:str(raw.pvTotal),solarToday:str(raw.solarToday),backupPower:str(raw.backupPower),nonBackupPower:str(raw.nonBackupPower),
      inverterName:str(raw.inverterName),inverterPower:str(raw.inverterPower),
      pv:list(raw.pv,10,10),batteries:list(raw.batteries,5,5),
      aux:{visible:raw.aux?.visible!==false,role:choose(raw.aux?.role,['micro','generator','load','disabled'],'micro'),
        connection:choose(raw.aux?.connection,['gen','backup','grid'],'gen'),name:str(raw.aux?.name),power:str(raw.aux?.power)},
      loads:(Array.isArray(raw.loads)?raw.loads:[{name:'',icon:'boiler',group:'backup'},{name:'',icon:'pump',group:'backup'},{name:'',icon:'other',group:'backup'},{name:'',icon:'ev',group:'grid'}]).slice(0,12).map(l=>({name:str(l.name),icon:choose(l.icon,['ev','boiler','pump','light','other'],'other'),group:choose(l.group,['backup','grid','aux'],'backup'),power:str(l.power),visible:l.visible!==false}))
    };
  }
  // Values are always normalized to W / kWh before aggregation. Missing is never zero.
  function reading(id,states,kind='power'){
    if(!id)return null;
    if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(id.trim()))return Number.isFinite(Number(id))?Number(id):null;
    const s=states?.[id];if(!s||s.state==null||String(s.state).trim()===''||!Number.isFinite(Number(s.state)))return null;
    const value=Number(s.state),u=s.attributes?.unit_of_measurement;
    const units=kind==='power'?{W:1,kW:1000,MW:1000000}:kind==='energy'?{Wh:.001,kWh:1,MWh:1000}:kind==='soc'?{'%':1}:kind==='voltage'?{V:1,mV:.001}:kind==='temperature'?{'°C':1}:kind==='current'?{A:1,mA:.001}:kind==='frequency'?{Hz:1,kHz:1000}:kind==='price'&&typeof u==='string'&&/\/kWh$/i.test(u)?{[u]:1}:{};
    return Object.hasOwn(units,u)?value*units[u]:null;
  }
  const sum=values=>values.length&&values.every(Number.isFinite)?values.reduce((a,b)=>a+b,0):null;
  function calculate(config,states={},demo=false){
    const c=normalize(config),night=demo&&c.demoScene==='night',outage=demo&&c.demoScene==='outage';
    const read=(id,fallback,kind='power')=>demo&&!id?fallback:reading(id,states,kind);
    const pv=c.pv.map(p=>read(p.power,night?0:outage?900:c.demoScene==='import'?800:1200));
    const solar=c.pvTotal?read(c.pvTotal,null):sum(pv);
    const batteries=c.batteries.map((b,i)=>({power:read(b.power,night?200:-600),soc:read(b.soc,[82,76,91,68,85][i],'soc'),voltage:read(b.voltage,52.4,'voltage'),temperature:read(b.temperature,26,'temperature'),capacity:read(b.capacity,null,'energy')}));
    const sign=c.batteryPositive==='charge'?-1:1;
    batteries.forEach(b=>{if(b.power!==null)b.power*=sign;});
    const rawState=String(states?.[c.gridStatus]?.state??'').trim().toLowerCase();
    const gridState=demo&&!c.gridStatus?(outage?'offline':'online'):c.gridOff.split(',').map(s=>s.trim().toLowerCase()).includes(rawState)?'offline':c.gridOn.split(',').map(s=>s.trim().toLowerCase()).includes(rawState)?'online':'unknown';
    let grid=read(c.gridPower,night?3000:c.demoScene==='import'?2000:-2000);
    if(grid!==null&&c.gridPositive==='export')grid=-grid;
    if(gridState==='offline')grid=0;
    const aux=c.aux.role==='disabled'?null:read(c.aux.power,night?0:2000);
    const loads=c.loads.map((l,i)=>read(l.power,night?1000:[2000,3000,3000,1000][i]??300));
    // Child appliances describe their parent total; never add both to the same total.
    const backup=c.backupPower?read(c.backupPower,null):sum(loads.filter((_,i)=>c.loads[i].group==='backup'));
    const nonBackup=gridState==='offline'?0:c.nonBackupPower?read(c.nonBackupPower,null):sum(loads.filter((_,i)=>c.loads[i].group==='grid'));
    const demoMaster={soc:80,voltage:53.24,current:night?18.8:-56.3,capacity:15,chargeToday:4.3,dischargeToday:6.1};
    const demoTelemetry={importToday:3.1,exportToday:4.8,homeToday:12.4,voltage:231.45,current:8.6,frequency:50.01,acTemperature:41.2,dcTemperature:38.4,buyPrice:4.32};
    const master=Object.fromEntries(Object.entries(c.master).map(([k,id])=>[k,read(id,demoMaster[k]??null,telemetryKinds[k]||'power')]));
    const batteryTotal=c.master.power?(master.power===null?null:master.power*sign):sum(batteries.map(b=>b.power));
    const telemetry=Object.fromEntries(Object.entries(c.telemetry).map(([k,id])=>[k,read(id,demoTelemetry[k]??null,telemetryKinds[k])]));
    const status=String(states?.[c.inverterStatus]?.state??'').toLowerCase().trim();
    const inList=list=>list.split(',').map(v=>v.trim().toLowerCase()).includes(status);
    const inverterState=demo&&!c.inverterStatus?'online':!status?'unknown':inList(c.inverterFault)?'fault':inList(c.inverterOff)?'offline':inList(c.inverterOn)?'online':'unknown';
    const runtime=runtimeHours(master.soc,master.capacity,batteryTotal,reading(c.reserveSoc,states,'soc'));
    const phaseReadings=c.phaseReadings.map((p,i)=>({voltage:read(p.voltage,231.45+i*.8,'voltage'),current:read(p.current,8.6+i*.3,'current')}));
    const reserve=reading(c.reserveSoc,states,'soc');
    const availableEnergy=runtimeHours(master.soc,master.capacity,1000,reserve);
    const loadRuntime=runtimeHours(master.soc,master.capacity,backup,reserve);
    return {availableEnergy,loadRuntime,phaseReadings,master,telemetry,runtime,inverterState,pv,solar,today:read(c.solarToday,48.6,'energy'),batteries,batteryTotal,grid,gridState,aux,loads,backup,nonBackup,inverter:read(c.inverterPower,night?3000:8000)};
  }
  const css=`
    .energy-station{--es-bg:#0b1721;--es-panel:#122230;--es-text:#eaf2f8;--es-muted:#91a6b6;--es-line:#304655;--es-off:#78828b;container-type:inline-size;container-name:station;position:relative;isolation:isolate;background:color-mix(in srgb,var(--es-bg) var(--es-background-opacity,100%),transparent)!important;color:var(--es-text);border:1px solid var(--es-line);border-radius:18px;padding:16px;min-width:0;overflow:hidden;width:100%;box-sizing:border-box}
    .energy-station[data-es-theme=day],:root[data-theme=light] .energy-station[data-es-theme=auto],.db-preview[data-theme-mode^=light_] .energy-station[data-es-theme=auto],.anma-container[data-theme^=light_] .energy-station[data-es-theme=auto]{--es-bg:#f5f8fb;--es-panel:#fff;--es-text:#152b3c;--es-muted:#526677;--es-line:#c8d6df;--es-off:#78838c}
    .energy-station .es-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.energy-station h2{font:700 20px system-ui;margin:0;color:#f1873d;display:flex;flex-wrap:wrap;gap:8px 14px}.energy-station .es-system-name{color:var(--es-text);overflow-wrap:anywhere}.energy-station .es-subtitle{font:11px system-ui;color:var(--es-muted);margin:5px 0}.energy-station .apf-tools{display:flex;gap:6px}.energy-station button{cursor:pointer;color:var(--es-text);background:var(--es-panel);border:1px solid var(--es-line);border-radius:8px;padding:8px;font:inherit}.energy-station .es-open{color:#f1873d}
    .es-svg .es-reading{font-size:20px;fill:var(--reading-color);font-weight:500}.es-svg .es-reading-value{font-size:20px;fill:var(--reading-color);font-weight:700}.es-svg .es-reading text{text-anchor:inherit;fill:var(--reading-color)}
    .energy-station.apf[data-fit=true]{display:flex;flex-direction:column;height:var(--es-available-height,calc(100dvh - 180px));min-height:300px;max-height:none;gap:12px}.energy-station[data-fit=true] .es-head,.energy-station[data-fit=true] .es-foot{flex:none}.energy-station[data-fit=true] .es-stage{flex:1;min-height:0;aspect-ratio:auto!important;position:relative}.energy-station[data-fit=true] .es-svg{position:absolute;inset:0;height:100%!important;width:100%;object-fit:contain}.energy-station.apf:fullscreen{display:flex;flex-direction:column;height:100dvh!important;max-height:none;min-height:0;border-radius:0;overflow:auto}.energy-station:fullscreen .es-stage{flex:1;min-height:0;position:relative;aspect-ratio:auto!important}.energy-station:fullscreen .es-svg{position:absolute;inset:0;width:100%;height:100%!important}.es-svg [data-state=fault]{--node-color:#ff6b64!important}
    .es-stage{width:100%;min-width:0}.es-svg{display:block;width:100%;height:auto;overflow:visible}.es-svg text{font-family:system-ui,sans-serif;text-anchor:middle;fill:var(--es-text);pointer-events:none}.es-svg .es-name{font-size:13px;font-weight:600;fill:var(--node-color)}.es-svg .es-value{font-size:20px;font-weight:750;fill:var(--node-color)}.es-svg .es-detail{font-size:11px;fill:var(--es-muted)}.es-svg .es-icon{color:var(--node-color)}.es-svg [data-state=idle],.es-svg [data-state=offline],.es-svg [data-state=unknown]{--node-color:var(--es-off)!important}.es-svg .es-wire{fill:none;stroke:var(--wire-color);stroke-width:1.8;stroke-dasharray:4 4;stroke-linecap:round}.es-svg .es-edge[data-active=true] .es-wire{animation:es-stream 1s linear infinite}.es-svg .es-edge[data-active=false]{opacity:.35}.es-svg .es-edge[data-reverse=true] .es-wire{animation-direction:reverse}.es-svg .es-dot{fill:var(--wire-color)}.es-svg .es-inverter-frame{fill:var(--es-panel);stroke:#f1873d;stroke-width:1.4}.es-svg .es-node{outline:none}.es-svg .es-node:focus{filter:drop-shadow(0 0 2px #ff8b32)}.es-svg .es-battery-fill{fill:var(--node-color);opacity:.55}.es-svg .es-edge[data-active=false] .es-dot{display:none}
    @keyframes es-stream{to{stroke-dashoffset:-16}}@media(prefers-reduced-motion:reduce){.energy-station .es-dot{display:none}.energy-station .es-wire{animation:none!important}}
    .energy-station .es-settings{position:absolute;z-index:20;top:65px;right:10px;bottom:10px;width:min(430px,calc(100% - 20px));overflow:auto;overscroll-behavior:contain;touch-action:pan-y;background:var(--es-panel);border:1px solid #b8753e;border-radius:12px;padding:12px;box-sizing:border-box;box-shadow:0 12px 32px #0005}.energy-station .es-settings[hidden]{display:none}
    .es-config{font:13px system-ui;color:inherit}.es-config summary{cursor:pointer;font-weight:700;padding:10px}.es-config .es-form{display:grid;gap:12px}.es-config fieldset{min-width:0;border:1px solid #b8753e;border-radius:8px;display:grid;gap:10px;padding:10px}.es-config legend{color:#f1873d;font-weight:700}.es-config label{display:grid;gap:4px}.es-config input,.es-config select{min-width:0;width:100%;box-sizing:border-box;padding:8px;color:inherit;background:var(--es-bg,var(--surface,#122230));border:1px solid #657789;border-radius:6px;font:inherit}.es-config input[type=checkbox]{width:18px;height:18px;accent-color:#f1873d}.es-config .es-check{display:flex;align-items:center;gap:8px}.es-config small{color:var(--es-muted,inherit);line-height:1.5}.es-config button{padding:7px;border:1px solid #657789;border-radius:6px;background:transparent;color:inherit;cursor:pointer}.es-config .es-device{border:1px solid #65778955;border-radius:7px}.es-config .es-device>div{padding:8px;display:grid;gap:8px}.es-config select option{background:var(--es-panel,#122230);color:var(--es-text,#eaf2f8)}
    .energy-station .es-foot{font:11px system-ui;color:var(--es-muted);border-top:1px solid var(--es-line);padding-top:10px}
    @container station (max-width:600px){.energy-station .es-subtitle{font-size:10px}.energy-station h2{font-size:16px}.energy-station .es-svg .es-name{font-size:20px}.energy-station .es-svg .es-value{font-size:28px}.energy-station .es-svg .es-detail{font-size:16px}.energy-station .es-head{gap:8px;flex-wrap:wrap}.energy-station .apf-tools{margin-left:auto}.energy-station .es-open{font-size:12px;padding:7px}.energy-station .es-settings{top:55px}}
  `;
  const svgNS='http://www.w3.org/2000/svg';let serial=0;
  function render(layout,{uk=false,demo=false,hass=null,change=null}={}){
    const tr=(en,ua)=>uk?ua:en,el=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;};
    const card=el('section','energy-station apf db-widget-box');card.setAttribute('aria-label','ANMA Energy Station');
    card.append(el('style','',css));
    const head=el('header','es-head'),brand=el('div'),tools=el('div','apf-tools');const title=el('h2','','Energy Station'),systemName=el('span','es-system-name');title.append(systemName);brand.append(title);head.append(brand,tools);card.append(head);
    const expand=el('button','', '⛶');expand.type='button';expand.setAttribute('aria-label',tr('Station fullscreen','Станція на весь екран'));expand.onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else card.requestFullscreen?.();};tools.append(expand);
    const stage=el('div','es-stage'),foot=el('div','es-foot');card.append(stage,foot);
    let cfg=normalize(layout.powerFlow?.station),data,live=hass,isDemo=demo,phone=false,nodes=new Map(),edges=[],svg,raf=0,observer,active=true,last=0;
    const svgEl=(tag,attrs={})=>{const e=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;};
    const power=v=>v===null?'—':Math.abs(v)>=1000?(Math.abs(v)/1000).toLocaleString(uk?'uk':'en',{minimumFractionDigits:3,maximumFractionDigits:3})+' '+tr('kW','кВт'):Math.round(Math.abs(v))+' '+tr('W','Вт');
    const labels={ev:tr('EV','Авто'),boiler:tr('Boiler','Бойлер'),pump:tr('Heat pump','Тепловий насос'),light:tr('Lighting','Освітлення'),other:tr('Other','Інше'),micro:tr('Microinverter','Мікроінвертор'),generator:tr('Generator','Генератор'),load:tr('Smart load','Кероване навантаження')};
    const color={...cfg.colors};
    function node(id,x,y,name,icon,tint,small=false){
      const g=svgEl('g',{'class':'es-node','transform':`translate(${x} ${y})`,'data-node':id,'tabindex':'0','role':'img'});g.style.setProperty('--node-color',tint);
      const title=svgEl('title');g.append(title);
      const ico=svgEl('svg',{x:-20,y:0,width:40,height:40,viewBox:'0 0 32 32','class':'es-icon',fill:'none',stroke:'currentColor','stroke-width':1.6});ico.append(svgEl('path',{d:icons[icon]||icons.other}));
      let fill;if(icon==='battery'){fill=svgEl('rect',{x:9,y:8,width:14,height:20,'class':'es-battery-fill',stroke:'none'});ico.prepend(fill);}
      const text=svgEl('text',{y:58,'class':'es-name'});text.textContent=name;
      const val=svgEl('text',{y:82,'class':'es-value'}),detail=svgEl('text',{y:101,'class':'es-detail'});
      if(id==='inverter')g.append(svgEl('rect',{x:-65,y:-10,width:130,height:125,rx:12,'class':'es-inverter-frame'}));
      g.append(ico,text,val,detail);svg.append(g);const n={g,x,y,title,val,detail,fill,name};nodes.set(id,n);return n;
    }
    function edge(from,to,tint,{out='bottom',into='top',key=from,reverse=false,route=null}={}){
      const a=nodes.get(from),b=nodes.get(to);if(!a||!b)return;
      const point=(n,side)=>side==='left'?[n.x-72,n.y+55]:side==='right'?[n.x+72,n.y+55]:side==='top'?[n.x,n.y-14]:[n.x,n.y+115];
      const [x1,y1]=point(a,out),[x2,y2]=point(b,into);
      const mid=(y1+y2)/2,d=route?route([x1,y1],[x2,y2]):out==='left'||out==='right'?`M${x1} ${y1} H${(x1+x2)/2} V${y2} H${x2}`:`M${x1} ${y1} V${mid} H${x2} V${y2}`;
      const g=svgEl('g',{'class':'es-edge','data-edge':key}),path=svgEl('path',{d,'class':'es-wire'});g.style.setProperty('--wire-color',tint);g.append(path);
      const markerId='es-arrow-'+(++serial),defs=svgEl('defs'),marker=svgEl('marker',{id:markerId,viewBox:'0 0 8 8',refX:7,refY:4,markerWidth:5,markerHeight:5,orient:'auto-start-reverse'});marker.append(svgEl('path',{d:'M0 0L8 4L0 8z',fill:tint}));defs.append(marker);g.append(defs);
      const dots=Array.from({length:4},(_,i)=>{const dot=svgEl('circle',{r:3.5-i*.65,opacity:1-i*.24,'class':'es-dot'});g.append(dot);return dot;});
      svg.prepend(g);edges.push({g,path,dots,key,markerId,phase:Math.random(),reverse,power:null});
    }
    function build(){
      Object.assign(color,cfg.colors);
      cancelAnimationFrame(raf);edges=[];nodes=new Map();
      const mobile=cfg.format==='phone'||(cfg.format!=='wide'&&stage.getBoundingClientRect().width<600);phone=mobile;
      const wide=!mobile&&(cfg.format==='wide'||cfg.format==='auto'&&stage.getBoundingClientRect().width>=950);
      card.dataset.fit=String(cfg.fit&&!mobile);
      const w=mobile?600:wide?1400:1100,cols=mobile?2:wide?10:5,visiblePV=cfg.showSolar?cfg.pv.map((p,i)=>p.visible?i:-1).filter(i=>i>=0):[];
      const rows=Math.ceil(visiblePV.length/cols),pvTop=110,rowHeight=mobile?145:125;
      const totalY=cfg.showSolar?pvTop+rows*rowHeight+35:0,coreY=totalY+140;
      const telemetryGap=mobile?210:0;
      let batteryStart=coreY+telemetryGap+(mobile?780:wide?510:650);const batCols=mobile?2:5;
      const loadRows=Math.max(...['backup','grid','aux'].map(group=>Math.ceil(cfg.loads.filter(l=>l.visible&&l.group===group).length/(wide?3:1))),1);
      batteryStart+=Math.max(0,loadRows-(wide?1:3))*145;
      const visibleB=cfg.showBatteries?cfg.batteries.map((b,i)=>b.visible?i:-1).filter(i=>i>=0):[];
      const maxLoads=Math.max(...['backup','grid','aux'].map(group=>cfg.loads.filter(l=>l.visible&&l.group===group).length),1);
      const h=batteryStart+Math.ceil(visibleB.length/batCols)*145+30+(maxLoads>3?(maxLoads-3)*55:0);
      svg=svgEl('svg',{viewBox:`0 0 ${w} ${h}`,'class':'es-svg',role:'group','aria-label':tr('Energy connections','З’єднання енергосистеми')});stage.replaceChildren(svg);stage.style.aspectRatio=cfg.format==='square'?'1':'';svg.style.height=cfg.format==='square'?'100%':'';
      if(cfg.showSolar){
        node('today',w/2,0,'','sun',color.solar);
        visiblePV.forEach((i,j)=>{const x=rowPosition(j,visiblePV.length,cols,w/2,w/cols),y=pvTop+Math.floor(j/cols)*rowHeight;node('pv'+i,x,y,cfg.pv[i].name||'PV '+String(i+1).padStart(2,'0'),'solar',color.solar);});
        node('solar',w/2,totalY,tr('Total PV','Сумарно PV'),'sun',color.solar);
        visiblePV.forEach((i,j)=>edge('pv'+i,'solar',color.solar,{key:'pv'+i,route:([x,y],[tx,ty])=>{if(Math.floor(j/cols)===rows-1)return `M${x} ${y} V${ty-22} H${tx} V${ty}`;const gutter=j%2? w-20:20;return `M${x} ${y} V${y+5} H${gutter} V${ty-22} H${tx} V${ty}`;}}));
      }
      node('inverter',w/2,coreY,cfg.inverterName||tr('Hybrid inverter','Гібридний інвертор'),'inverter',color.inverter);
      if(cfg.showSolar)edge('solar','inverter',color.solar,{key:'solar'});
      if(cfg.showGrid){node('grid',mobile?110:130,coreY,tr('Grid','Мережа'),'grid',color.grid);edge('grid','inverter',color.grid,{out:'right',into:'left',key:'grid'});}
      if(cfg.showBackup){node('backup',mobile?490:w-130,coreY,tr('Backup loads','Гарантоване'),'home',color.backup);edge('inverter','backup',color.backup,{out:'right',into:'left',key:'backup'});}
      if(cfg.showNonBackup&&!(cfg.hideOffline&&data.gridState==='offline')){
        node('nonbackup',mobile?110:130,coreY+telemetryGap+180,tr('Non-backup','Негарантоване'),'home',color.grid);
        if(cfg.showGrid)edge('grid','nonbackup',color.grid,{key:'nonbackup'});
      }
      if(cfg.aux.visible&&cfg.aux.role!=='disabled'){
        node('aux',mobile?300:w/2+150,coreY+telemetryGap+190,cfg.aux.name||labels[cfg.aux.role],cfg.aux.role==='load'?'boiler':cfg.aux.role,color.aux);
        const source=cfg.aux.role!=='load',target=cfg.aux.role==='micro'?({gen:'inverter',backup:'backup',grid:'grid'})[cfg.aux.connection]:'inverter';
        edge(source?'aux':target,source?target:'aux',color.aux,{out:source?'top':'bottom',into:source?'bottom':'top',key:'aux'});
      }
      for(const [group,parent,x] of [['backup','backup',mobile?490:w-130],['grid','nonbackup',mobile?110:130],['aux','aux',mobile?300:w/2+150]]){
        if(!nodes.has(parent)||group==='aux'&&cfg.aux.role!=='load')continue;
        const children=cfg.loads.map((l,i)=>({l,i})).filter(({l})=>l.visible&&l.group===group);
        children.forEach(({l,i},j)=>{
          const row=wide?Math.floor(j/3):j;
          const y=coreY+telemetryGap+(group==='backup'?190:350)+row*(mobile?140:125),lx=wide?rowPosition(j,children.length,3,x,140,w):x;
          node('load'+i,lx,y,l.name||labels[l.icon],l.icon,group==='backup'?color.backup:group==='grid'?color.grid:color.aux);
          edge(parent,'load'+i,group==='backup'?color.backup:group==='grid'?color.grid:color.aux,{key:'load'+i,out:wide?'bottom':'left',into:wide?'top':'left',route:([sx,sy],[tx,ty])=>wide?`M${sx} ${sy} V${ty-12} H${tx} V${ty}`:`M${sx} ${sy} H${Math.min(sx,tx)-12} V${ty} H${tx}`});
        });
      }
      if(cfg.showBatteries&&(visibleB.length||Object.values(cfg.master).some(Boolean))){
        node('battery',w/2,batteryStart-150,tr('Main battery','Головна батарея'),'battery',color.battery);edge('inverter','battery',color.battery,{key:'battery',route:([sx,sy],[tx,ty])=>phone?`M${sx} ${sy} H${sx-85} V${ty-15} H${tx} V${ty}`:`M${sx} ${sy} V${ty}`});
        visibleB.forEach((i,j)=>{node('bat'+i,rowPosition(j,visibleB.length,batCols,w/2,w/batCols),batteryStart+Math.floor(j/batCols)*145,cfg.batteries[i].name||tr('Battery ','Батарея ')+(i+1),'battery',color.battery);edge('battery','bat'+i,color.battery,{key:'bat'+i,route:([sx,sy],[tx,ty])=>{const gutter=j%2?w-20:20;return phone&&j>=2?`M${sx} ${sy} H${gutter} V${ty-10} H${tx} V${ty}`:`M${sx} ${sy} V${sy+10} H${tx} V${ty}`;}});});
      }
      updateValues();last=0;raf=requestAnimationFrame(animate);
    }
    function updateValues(){
      const set=(id,value,detail='',state='active',soc=null)=>{const n=nodes.get(id);if(!n)return;n.val.textContent=value;n.detail.textContent=detail;n.g.dataset.state=state;n.title.textContent=n.name+' · '+value+' · '+detail;n.g.setAttribute('aria-label',n.title.textContent);if(n.fill){const pct=soc===null?0:Math.max(0,Math.min(100,soc));n.fill.setAttribute('height',20*pct/100);n.fill.setAttribute('y',28-20*pct/100);}};
      const state=p=>p===null?'unknown':Math.abs(p)<10?'idle':'active';
      const batteryState=p=>p===null?tr('No data','Немає даних'):Math.abs(p)<10?tr('Idle','Очікування'):p>0?tr('Discharging ↑','Розряд ↑'):tr('Charging ↓','Заряд ↓');
      set('today',data.today===null?'—':data.today.toLocaleString(uk?'uk':'en',{maximumFractionDigits:1})+' '+tr('kWh','кВт·год'),'',state(data.solar));
      cfg.pv.forEach((p,i)=>set('pv'+i,power(data.pv[i]),'',state(data.pv[i])));
      set('solar',power(data.solar),data.solar===null?tr('No data','Немає даних'):'',state(data.solar));
      set('inverter',power(data.inverter),({online:tr('RUNNING','ПРАЦЮЄ'),offline:tr('OFF / STANDBY','ВИМК. / ОЧІКУЄ'),fault:tr('FAULT','ПОМИЛКА'),unknown:cfg.inverterStatus?tr('Status unavailable','Стан недоступний'):''})[data.inverterState],data.inverterState==='online'?'active':data.inverterState);
      const gridLabel=data.gridState==='offline'?tr('NO GRID','НЕМАЄ МЕРЕЖІ'):data.grid===null?tr('No data','Немає даних'):Math.abs(data.grid)<10?tr('Idle','Очікування'):data.grid>0?tr('IMPORT →','ІМПОРТ →'):tr('← EXPORT','← ЕКСПОРТ');
      set('grid',power(data.grid),gridLabel,data.gridState==='offline'?'offline':state(data.grid));
      const gridNode=nodes.get('grid');if(gridNode){let status=gridNode.g.querySelector('.es-grid-direction');if(!status){status=svgEl('path',{'class':'es-grid-direction',stroke:'currentColor','stroke-width':2,fill:'none'});gridNode.g.querySelector('.es-icon').append(status);}status.setAttribute('d',data.gridState==='offline'?'M4 4L28 28':data.grid>10?'M4 31h24m-5-4 5 4-5 4':data.grid< -10?'M28 31H4m5-4-5 4 5 4':'');gridNode.g.dataset.direction=data.gridState==='offline'?'offline':data.grid===null?'unknown':data.grid>10?'import':data.grid< -10?'export':'idle';}
      set('backup',power(data.backup),'',state(data.backup));set('nonbackup',power(data.nonBackup),data.gridState==='offline'?tr('Grid lost','Мережі немає'):'',data.gridState==='offline'?'offline':state(data.nonBackup));
      set('aux',power(data.aux),cfg.aux.role==='micro'?tr('Source → '+cfg.aux.connection,'Джерело → '+cfg.aux.connection):cfg.aux.role==='generator'?tr('GEN input','Вхід GEN'):tr('GEN output','Вихід GEN'),cfg.aux.role==='micro'&&cfg.aux.connection==='grid'&&data.gridState==='offline'?'offline':state(data.aux));
      cfg.loads.forEach((l,i)=>{const off=l.group==='grid'&&data.gridState==='offline';set('load'+i,off?'—':power(data.loads[i]),off?tr('Grid lost','Мережі немає'):'',off?'offline':state(data.loads[i]));});
      set('battery',data.master.soc===null?power(data.batteryTotal):data.master.soc.toFixed(1)+'%',power(data.batteryTotal)+' · '+batteryState(data.batteryTotal),state(data.batteryTotal),data.master.soc);
      cfg.batteries.forEach((b,i)=>{const v=data.batteries[i];set('bat'+i,v.soc===null?'—':Math.round(v.soc)+'%',v.voltage===null?(b.voltage?'— V':''):v.voltage.toLocaleString(uk?'uk':'en',{minimumFractionDigits:2,maximumFractionDigits:2})+' V',v.soc!==null?'active':state(v.power),v.soc);const n=nodes.get('bat'+i);if(n){n.title.textContent+=' · '+(v.voltage===null?'—':v.voltage+' V')+' · '+(v.temperature===null?'—':v.temperature+' °C');n.g.setAttribute('aria-label',n.title.textContent);}});
      for(const e of edges){
        let p=null,reverse=false;
        if(e.key==='grid'){p=data.grid;reverse=p<0;}
        else if(e.key==='battery'){p=data.batteryTotal;reverse=p>0;}
        else if(e.key.startsWith('bat')){p=data.batteries[Number(e.key.slice(3))]?.power;reverse=p>0;}
        else if(e.key.startsWith('pv'))p=data.pv[Number(e.key.slice(2))];
        else if(e.key.startsWith('load')){const i=Number(e.key.slice(4));p=cfg.loads[i].group==='grid'&&data.gridState==='offline'?0:data.loads[i];}
        else {p=({solar:data.solar,backup:data.backup,nonbackup:data.nonBackup,aux:data.aux})[e.key];if(e.key==='backup')reverse=p<0;}
        if(e.key==='battery'||/^bat\d+$/.test(e.key)){const tint=p>10?color.discharge:p< -10?color.charge:color.battery;e.g.style.setProperty('--wire-color',tint);e.g.querySelector('marker path')?.setAttribute('fill',tint);}
        if(e.key==='aux'&&cfg.aux.connection==='grid'&&cfg.aux.role==='micro'&&data.gridState==='offline')p=0;
        e.power=p;e.reverse=reverse;e.g.dataset.active=String(cfg.motion&&layout.motion!==false&&Number.isFinite(p)&&Math.abs(p)>=10);e.g.dataset.reverse=String(reverse);
        e.path.removeAttribute(reverse?'marker-end':'marker-start');e.path.setAttribute(reverse?'marker-start':'marker-end',`url(#${e.markerId})`);
      }
      for(const [id,n] of nodes){if(id==='battery'||/^bat\d+$/.test(id)){const p=id==='battery'?data.batteryTotal:data.batteries[Number(id.slice(3))]?.power;n.g.style.setProperty('--node-color',p>10?color.discharge:p< -10?color.charge:color.battery);}}
      svg.querySelectorAll('.es-reading').forEach(e=>e.remove());
      const number=(v,unit,digits=2)=>v===null?'—':v.toLocaleString(uk?'uk':'en',{minimumFractionDigits:digits,maximumFractionDigits:digits})+' '+unit;
      const beside=(id,rows,side='right',dy=0)=>{
        const n=nodes.get(id);if(!n||!rows.length)return;
        const x=side==='left'?-95:side==='right'?95:0;
        const g=svgEl('g',{'class':'es-reading','data-reading-for':id,transform:`translate(${n.x+x} ${n.y+dy})`});
        g.style.setProperty('--reading-color',id==='battery'?color.battery:id==='grid'?color.grid:id==='backup'?color.backup:color.inverter);
        g.style.textAnchor=side==='left'?'end':side==='right'?'start':'middle';
        let y=0;rows.forEach(([name,value])=>{const text=svgEl('text',{y});if(name){const caption=svgEl('tspan',{x:0,dy:0});caption.textContent=name;text.append(caption);}const val=svgEl('tspan',{x:0,dy:name?24:0,'class':'es-reading-value'});val.textContent=value;text.append(val);g.append(text);y+=name?54:27;});svg.append(g);
      };
      const label={soc:'SOC',voltage:'',current:'',capacity:'',chargeToday:tr('Charge','Заряд'),dischargeToday:tr('Discharge','Розряд'),importToday:tr('Import','Імпорт'),exportToday:tr('Export','Експорт'),homeToday:tr('Home','Будинок'),frequency:'',acTemperature:'AC',dcTemperature:'DC',buyPrice:tr('Purchase price','Ціна купівлі')};
      const unit={soc:'%',voltage:'V',current:'A',capacity:'kWh',chargeToday:'kWh',dischargeToday:'kWh',importToday:'kWh',exportToday:'kWh',homeToday:'kWh',frequency:'Hz',acTemperature:'°C',dcTemperature:'°C',buyPrice:cfg.currency+'/kWh'};
      beside('battery',['chargeToday','dischargeToday'].filter(k=>isDemo||cfg.master[k]).map(k=>[label[k],number(data.master[k],unit[k])]),'left',4);
      const mainRows=['voltage','current','capacity'].filter(k=>isDemo||cfg.master[k]).map(k=>[label[k],number(k==='capacity'?data.availableEnergy:data.master[k],unit[k])]);
      if(isDemo||(cfg.master.capacity&&cfg.master.soc))mainRows.push([tr('To reserve ','До резерву ')+number(reading(cfg.reserveSoc,live?.states||{},'soc'),'%',0),data.runtime===null?'—':Math.floor(Math.round(data.runtime*60)/60)+' '+tr('h','год')+' '+(Math.round(data.runtime*60)%60)+' '+tr('min','хв')]);
      beside('battery',mainRows,'right',0);
      beside('grid',['importToday','exportToday'].filter(k=>isDemo||cfg.telemetry[k]).map(k=>[label[k],number(data.telemetry[k],unit[k])]),'above',-115);
      beside('backup',(isDemo||cfg.telemetry.homeToday)?[[label.homeToday,number(data.telemetry.homeToday,'kWh')]]:[],'above',-55);
      beside('inverter',['acTemperature','dcTemperature'].filter(k=>isDemo||cfg.telemetry[k]).map(k=>[label[k],number(data.telemetry[k],unit[k])]),'left',phone?150:-70);
      const acRows=cfg.phases===3?cfg.phaseReadings.flatMap((p,i)=>phone?[[ '', 'L'+(i+1)+' · '+number(data.phaseReadings[i].voltage,'V')],['',number(data.phaseReadings[i].current,'A')]]:[['','L'+(i+1)+' · '+number(data.phaseReadings[i].voltage,'V')+' · '+number(data.phaseReadings[i].current,'A')]]):['voltage','current'].filter(k=>isDemo||cfg.telemetry[k]).map(k=>[label[k],number(data.telemetry[k],unit[k])]);
      if(isDemo||cfg.telemetry.frequency)acRows.push([label.frequency,number(data.telemetry.frequency,'Hz')]);
      beside('inverter',acRows,'right',phone?150:-35);

      foot.textContent=tr('Appliances detail their parent total. Visibility changes the diagram, not the electrical connection.','Прилади деталізують підсумок своєї групи. Видимість змінює схему, а не електричне підключення.');
      if(!isDemo&&data.gridState==='unknown')foot.textContent+=' '+tr('Grid status unknown: configure its status sensor.','Стан мережі невідомий: вкажіть датчик стану.');
    }
    function animate(now){
      if(!card.isConnected)return;
      const dt=last?Math.min(.1,(now-last)/1000):0;last=now;
      if(active&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
        for(const e of edges){if(e.g.dataset.active!=='true')continue;const length=e.length||(e.length=e.path.getTotalLength());if(!length)continue;e.phase=(e.phase+dt/(6-4.8*Math.min(1,Math.abs(e.power)/10000)))%1;
          e.dots.forEach((dot,i)=>{const phase=(e.phase-i*6/length+1)%1,p=e.path.getPointAtLength((e.reverse?1-phase:phase)*length);dot.setAttribute('cx',p.x);dot.setAttribute('cy',p.y);});}
      }
      raf=requestAnimationFrame(animate);
    }
    const syncTheme=()=>{systemName.textContent=cfg.subtitle;card.style.setProperty('--es-background-opacity',cfg.backgroundOpacity+'%');card.dataset.esTheme=cfg.theme==='auto'&&typeof live?.themes?.darkMode==='boolean'?(live.themes.darkMode?'night':'day'):cfg.theme;};
    card._stationRefresh=(options={})=>{live=options.hass??live;syncTheme();resize();isDemo=options.demo??isDemo;data=calculate(cfg,live?.states||{},isDemo);if(cfg.hideOffline&&Boolean(nodes.has('nonbackup'))!==(cfg.showNonBackup&&data.gridState!=='offline'))build();else updateValues();};
    const settings=el('div','es-settings');settings.hidden=true;
    if(change){const button=el('button','es-open',tr('⚙ Connections','⚙ З’єднання'));button.type='button';button.setAttribute('aria-expanded','false');button.onclick=()=>{settings.hidden=!settings.hidden;button.setAttribute('aria-expanded',String(!settings.hidden));};tools.append(button);
      const close=el('button','',tr('✕ Close','✕ Закрити'));close.type='button';close.onclick=()=>{settings.hidden=true;button.setAttribute('aria-expanded','false');button.focus();};settings.append(close);
      const edit=editor(cfg,uk,next=>{cfg=normalize(next);layout.powerFlow.station=cfg;change(false);syncTheme();data=calculate(cfg,live?.states||{},isDemo);build();},{getStates:()=>live?.states||{}});edit.open=true;settings.append(edit);card.append(settings);
      card.addEventListener('keydown',e=>{if(e.key==='Escape'&&!settings.hidden){settings.hidden=true;button.setAttribute('aria-expanded','false');button.focus();}});
    }
    syncTheme();data=calculate(cfg,live?.states||{},isDemo);build();
    const resize=()=>{if(!card.isConnected||stage.getBoundingClientRect().width<=0)return;const available=Math.max(300,window.innerHeight-Math.max(0,card.getBoundingClientRect().top)-16);card.style.setProperty('--es-available-height',available+'px');const next=cfg.format==='phone'||cfg.format!=='wide'&&stage.getBoundingClientRect().width<600;const nextWide=!next&&(cfg.format==='wide'||cfg.format==='auto'&&stage.getBoundingClientRect().width>=950);if(next!==phone||svg.getAttribute('viewBox').split(' ')[2]!==String(next?600:nextWide?1400:1100))build();};
    observer=new ResizeObserver(resize);observer.observe(stage);observer.observe(card);
    const viewportResize=()=>{if(!card.isConnected){window.removeEventListener('resize',viewportResize);return;}resize();};window.addEventListener('resize',viewportResize);
    card.addEventListener('fullscreenchange',resize);
    requestAnimationFrame(resize);
    card._stationKey=JSON.stringify([layout.powerFlow?.station,layout.theme,layout.motion,uk]);return card;
  }
  function update(host,layout,options){
    const current=host.firstElementChild,key=JSON.stringify([layout.powerFlow?.station,layout.theme,layout.motion,options?.uk||false]);
    if(current?._stationKey===key){current._stationRefresh(options);return current;}
    const card=render(layout,options);host.replaceChildren(card);return card;
  }
  function editor(raw,uk,onchange,{getStates=()=>({})}={}){
    const c=normalize(raw),tr=(en,ua)=>uk?ua:en,el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
    const box=el('details'),summary=el('summary',tr('Energy Station settings','Налаштування Energy Station')),form=el('div');box.className='es-config';form.className='es-form';box.append(el('style',css),summary,form);
    const commit=()=>onchange(normalize(c),false);
    function field(parent,title,obj,key,options){const label=el('label',title),input=el(options?'select':'input');input.setAttribute('aria-label',title);if(options)options.forEach(([value,name])=>{const o=el('option',name);o.value=value;input.append(o);});input.value=obj[key]??'';input.onchange=()=>{obj[key]=input.value;commit();};label.append(input);parent.append(label);return input;}
    function sensor(parent,title,obj,key,kind='power'){
      const input=field(parent,title,obj,key);input.placeholder=kind==='power'?tr('sensor.… or fixed W','sensor.… або фіксовані Вт'):'sensor.…';
      const list=el('datalist');list.id='es-sensors-'+(++serial);input.setAttribute('list',list.id);
      input.addEventListener('focus',()=>{list.replaceChildren();Object.entries(getStates()||{}).filter(([id,s])=>id.startsWith('sensor.')||id.startsWith('binary_sensor.')).filter(([id,s])=>kind==='status'||kind==='power'?kind==='status'||['W','kW','MW'].includes(s.attributes?.unit_of_measurement):kind==='energy'?['Wh','kWh','MWh'].includes(s.attributes?.unit_of_measurement):true).slice(0,500).forEach(([id,s])=>{const o=el('option',s.attributes?.friendly_name||id);o.value=id;list.append(o);});});parent.append(list);
    }
    function check(parent,title,obj,key){const label=el('label'),input=el('input');label.className='es-check';input.type='checkbox';input.checked=obj[key];input.setAttribute('aria-label',title);input.onchange=()=>{obj[key]=input.checked;commit();};label.append(input,el('span',title));parent.append(label);}
    function group(title){const f=el('fieldset');f.append(el('legend',title));form.append(f);return f;}
    function device(parent,title){const d=el('details');d.className='es-device';d.append(el('summary',title));const body=el('div');d.append(body);parent.append(d);return body;}
    function draw(){
      form.replaceChildren();const display=group(tr('Appearance & preview','Вигляд і перегляд'));check(display,tr('Fit diagram to screen (desktop/tablet)','Вписувати схему в екран (ПК/планшет)'),c,'fit');
      field(display,tr('Format','Формат'),c,'format',[['auto',tr('Adaptive','Адаптивний')],['wide',tr('Wide','Широкий')],['square',tr('Square','Квадратний')],['phone',tr('Phone','Телефон')]]);
      field(display,tr('System name beside Energy Station','Назва системи поруч з Energy Station'),c,'subtitle');
      const opacity=field(display,tr('Background opacity (%) · 0 = transparent','Непрозорість фону (%) · 0 = прозорий'),c,'backgroundOpacity');opacity.type='number';opacity.min='0';opacity.max='100';opacity.step='5';
      field(display,tr('Theme','Тема'),c,'theme',[['auto',tr('Site / dashboard','Сайт / дашборд')],['day',tr('Light','Світла')],['night',tr('Dark','Темна')]]);check(display,tr('Animated flows','Анімовані потоки'),c,'motion');
      field(display,tr('Demo scenario (preview only)','Демо-сценарій (лише перегляд)'),c,'demoScene',[['sun',tr('Solar / export','Сонце / експорт')],['import',tr('Import','Імпорт')],['night',tr('Night','Ніч')],['outage',tr('Grid outage','Немає мережі')]]);
      display.append(el('small',tr('Sensor IDs use live HA data; fixed numbers are manual values. Demo is never used in the installed HA card.','Сутності використовують живі дані HA; числа — ручні значення. У встановленій HA-картці демодані не використовуються.')));
      const palette=group(tr('Flow colors','Кольори потоків'));
      for(const [key,en,ua] of [['solar','Solar','Сонце'],['grid','Grid','Мережа'],['backup','Backup loads','Гарантоване навантаження'],['battery','Battery labels','Підписи батареї'],['charge','Battery charging','Заряд батареї'],['discharge','Battery discharging','Розряд батареї'],['aux','GEN / AUX','GEN / AUX'],['inverter','Inverter','Інвертор']]){const input=field(palette,tr(en,ua),c.colors,key);input.type='color';}
      const solar=group(tr('Solar · up to 10 fields','Сонце · до 10 полів'));check(solar,tr('Show solar','Показувати сонце'),c,'showSolar');sensor(solar,tr('Solar energy today (kWh)','Генерація сьогодні (кВт·год)'),c,'solarToday','energy');sensor(solar,tr('PV total (optional; otherwise sum fields)','Сумарна PV (або сума полів)'),c,'pvTotal');
      const count=(parent,key,max,title)=>{const input=field(parent,title,{count:String(c[key].length)},'count',Array.from({length:max+1},(_,i)=>[String(i),String(i)]));input.onchange=()=>{const n=Number(input.value);while(c[key].length<n)c[key].push({visible:true,name:'',power:'',soc:'',voltage:'',temperature:''});c[key]=c[key].slice(0,n);commit();draw();};};
      count(solar,'pv',10,tr('PV field count','Кількість PV-полів'));
      c.pv.forEach((p,i)=>{const f=device(solar,p.name||'PV '+(i+1));check(f,tr('Show PV ','Показувати PV ')+(i+1),p,'visible');field(f,tr('PV name ','Назва PV ')+(i+1),p,'name');sensor(f,tr('PV power ','Потужність PV ')+(i+1),p,'power');});
      const batteries=group(tr('Batteries · up to 5','Батареї · до 5'));check(batteries,tr('Show batteries','Показувати батареї'),c,'showBatteries');count(batteries,'batteries',5,tr('Battery count','Кількість батарей'));field(batteries,tr('Positive battery power means','Плюс потужності батареї означає'),c,'batteryPositive',[['discharge',tr('Discharge','Розряд')],['charge',tr('Charge','Заряд')]]);
      c.batteries.forEach((b,i)=>{const f=device(batteries,b.name||tr('Battery ','Батарея ')+(i+1));check(f,tr('Show battery ','Показувати батарею ')+(i+1),b,'visible');field(f,tr('Battery name ','Назва батареї ')+(i+1),b,'name');sensor(f,tr('Battery power ','Потужність батареї ')+(i+1),b,'power');sensor(f,'SOC % · '+(i+1),b,'soc','soc');sensor(f,tr('Voltage ','Напруга ')+(i+1),b,'voltage','voltage');sensor(f,tr('Temperature ','Температура ')+(i+1),b,'temperature','temperature');sensor(f,tr('Capacity kWh ','Ємність кВт·год ')+(i+1),b,'capacity','energy');});
      const grid=group(tr('Grid & inverter','Мережа та інвертор'));check(grid,tr('Show grid','Показувати мережу'),c,'showGrid');sensor(grid,tr('Signed grid power','Знакова потужність мережі'),c,'gridPower');field(grid,tr('Positive grid power means','Плюс потужності мережі означає'),c,'gridPositive',[['import',tr('Import','Імпорт')],['export',tr('Export','Експорт')]]);sensor(grid,tr('Grid status entity','Сутність стану мережі'),c,'gridStatus','status');field(grid,tr('Connected states, comma separated','Стани підключення через кому'),c,'gridOn');field(grid,tr('Disconnected states','Стани відключення'),c,'gridOff');field(grid,tr('Inverter name','Назва інвертора'),c,'inverterName');sensor(grid,tr('Inverter power','Потужність інвертора'),c,'inverterPower');
      const master=group(tr('Main battery · inverter totals','Головна батарея · дані інвертора'));
      for(const [key,en,ua] of [['power','Signed total power','Загальна знакова потужність'],['soc','Main SOC','Головний SOC'],['voltage','Main voltage','Загальна напруга'],['current','Main current','Загальний струм'],['capacity','Total capacity (kWh)','Загальна ємність (кВт·год)'],['chargeToday','Charged today','Заряд'],['dischargeToday','Discharged today','Розряд']])sensor(master,tr(en,ua),c.master,key,telemetryKinds[key]||'power');
      sensor(master,tr('Reserve SOC (% or entity)','Резервний SOC (% або сутність)'),c,'reserveSoc','soc');master.append(el('small',tr('Runtime estimate uses energy above reserve divided by actual battery discharge power. Unavailable while charging, idle or when required inputs are missing. Capacity is kWh, not Ah; daily counters must come from daily energy sensors.','Оцінка часу: енергія вище резерву / фактична потужність розряду батареї. Під час заряду, простою або без необхідних даних оцінка недоступна. Ємність — кВт·год, не А·год; добові лічильники — з відповідних датчиків енергії.')));
      const phases=group(tr('Inverter phases','Фази інвертора'));const phaseSelect=field(phases,tr('Phase configuration','Кількість фаз'),c,'phases',[['1',tr('Single phase','Однофазний')],['3',tr('Three phase','Трифазний')]]);phaseSelect.onchange=()=>{c.phases=Number(phaseSelect.value);commit();draw();};
      if(c.phases===3)c.phaseReadings.forEach((p,i)=>{sensor(phases,'L'+(i+1)+' · '+tr('Voltage','Напруга'),p,'voltage','voltage');sensor(phases,'L'+(i+1)+' · '+tr('Current','Струм'),p,'current','current');});
      const telemetry=group(tr('Daily counters & inverter telemetry','Добові лічильники та телеметрія інвертора'));
      for(const [key,en,ua] of [['importToday','Grid import today','Імпорт мережі за добу'],['exportToday','Grid export today','Експорт мережі за добу'],['homeToday','Home energy today','Споживання будинку за добу'],['voltage','Inverter AC voltage','Напруга AC інвертора'],['current','Inverter AC current','Струм AC інвертора'],['frequency','AC frequency','Частота AC'],['acTemperature','AC temperature','Температура AC'],['dcTemperature','DC temperature','Температура DC'],['buyPrice','Purchase price per kWh','Ціна купівлі за кВт·год']])sensor(telemetry,tr(en,ua),c.telemetry,key,telemetryKinds[key]);
      field(telemetry,tr('Currency label','Позначення валюти'),c,'currency');sensor(telemetry,tr('Inverter status','Стан інвертора'),c,'inverterStatus','status');field(telemetry,tr('Running states','Стани роботи'),c,'inverterOn');field(telemetry,tr('Off / standby states','Стани вимкнення / очікування'),c,'inverterOff');field(telemetry,tr('Fault states','Стани помилки'),c,'inverterFault');
      const aux=group('GEN / AUX');check(aux,tr('Show GEN / AUX','Показувати GEN / AUX'),c.aux,'visible');field(aux,tr('Port role','Роль порту'),c.aux,'role',[['micro',tr('Microinverter → input','Мікроінвертор → вхід')],['generator',tr('Generator → input','Генератор → вхід')],['load',tr('Smart load ← output','Кероване навантаження ← вихід')],['disabled',tr('Disabled','Вимкнено')]]);field(aux,tr('Microinverter connection','Підключення мікроінвертора'),c.aux,'connection',[['gen','GEN / AUX'],['backup',tr('Backup bus','Гарантована група')],['grid',tr('Grid-side bus','Сторона мережі')]]);field(aux,tr('GEN / AUX name','Назва GEN / AUX'),c.aux,'name');sensor(aux,tr('GEN / AUX power','Потужність GEN / AUX'),c.aux,'power');aux.append(el('small',tr('A source always feeds the selected connection. This setting only describes existing wiring; it does not configure the inverter port.','Джерело завжди подає енергію у вибране підключення. Це опис існуючої схеми, а не перемикання порту інвертора.')));
      const loads=group(tr('Load groups & appliances','Групи та споживачі'));check(loads,tr('Show backup group','Показувати гарантовану групу'),c,'showBackup');check(loads,tr('Show non-backup group','Показувати негарантовану групу'),c,'showNonBackup');check(loads,tr('Hide non-backup during outage (otherwise grey)','Ховати негарантовану без мережі (інакше сіра)'),c,'hideOffline');sensor(loads,tr('Backup total (or sum appliances)','Гарантоване разом (або сума приладів)'),c,'backupPower');sensor(loads,tr('Non-backup total (or sum appliances)','Негарантоване разом (або сума приладів)'),c,'nonBackupPower');
      c.loads.forEach((l,i)=>{const f=device(loads,l.name||tr('Appliance ','Прилад ')+(i+1));check(f,tr('Show appliance ','Показувати прилад ')+(i+1),l,'visible');field(f,tr('Appliance name ','Назва приладу ')+(i+1),l,'name');field(f,tr('Icon ','Піктограма ')+(i+1),l,'icon',[['ev',tr('EV','Авто')],['boiler',tr('Boiler','Бойлер')],['pump',tr('Heat pump','Тепловий насос')],['light',tr('Lighting','Освітлення')],['other',tr('Other','Інше')]]);field(f,tr('Group ','Група ')+(i+1),l,'group',[['backup',tr('Backup','Гарантована')],['grid',tr('Non-backup','Негарантована')],['aux','GEN / AUX']]);sensor(f,tr('Appliance power ','Потужність приладу ')+(i+1),l,'power');const del=el('button',tr('Remove appliance','Прибрати прилад'));del.type='button';del.onclick=()=>{c.loads.splice(i,1);commit();draw();};f.append(del);});
      const add=el('button',tr('+ Add appliance','+ Додати прилад'));add.type='button';add.disabled=c.loads.length>=12;add.onclick=()=>{c.loads.push({name:'',icon:'ev',group:'backup',power:'',visible:true});commit();draw();};loads.append(add);
    }
    draw();return box;
  }
  const api={runtimeHours,rowPosition,normalize,reading,calculate,render,update,editor};root.AnmaEnergyStation=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

