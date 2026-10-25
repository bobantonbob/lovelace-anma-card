// ============================================================================
// /* Bundled ANMA Platform Model Engine */
// Self-contained runtime for Home Assistant Lovelace execution
// ============================================================================
// Refresh the bundled runtime even when an older resource initialized the globals.
if (typeof window !== 'undefined') {
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
        edge(source?'aux':target,source?target:'aux',color.aux,{out:source?'top':'bottom',into:source?'bottom':'top',key:'aux',route:mobile?([sx,sy],[tx,ty])=>`M${sx} ${sy} V${sy-10} H440 V${ty+10} H${tx} V${ty}`:null});
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
        node('battery',w/2,batteryStart-150,tr('Main battery','Головна батарея'),'battery',color.battery);edge('inverter','battery',color.battery,{key:'battery',route:([sx,sy],[tx,ty])=>phone?`M${sx} ${sy} H160 V${ty-15} H${tx} V${ty}`:`M${sx} ${sy} V${ty}`});
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
      const temperatureRows=['acTemperature','dcTemperature'].filter(k=>isDemo||cfg.telemetry[k]).map(k=>['',label[k]+' — '+number(data.telemetry[k],unit[k])]);
      if(!phone)beside('inverter',temperatureRows,'left',-55);
      const acRows=cfg.phases===3?cfg.phaseReadings.flatMap((p,i)=>phone?[[ '', 'L'+(i+1)+' · '+number(data.phaseReadings[i].voltage,'V')],['',number(data.phaseReadings[i].current,'A')]]:[['','L'+(i+1)+' · '+number(data.phaseReadings[i].voltage,'V')+' · '+number(data.phaseReadings[i].current,'A')]]):['voltage','current'].filter(k=>isDemo||cfg.telemetry[k]).map(k=>[label[k],number(data.telemetry[k],unit[k])]);
      if(isDemo||cfg.telemetry.frequency)acRows.push([label.frequency,number(data.telemetry.frequency,'Hz')]);
      beside('inverter',phone?[...temperatureRows,...acRows]:acRows,phone?'above':'right',phone?150:-35);

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
      const opacity=field(display,tr('Background opacity (%) · 0 = transparent','Непрозорість фону (%) · 0 = прозорий'),c,'backgroundOpacity');opacity.type='range';opacity.min='0';opacity.max='100';opacity.step='1';const opacityValue=el('output',c.backgroundOpacity+'%');opacity.after(opacityValue);opacity.oninput=()=>{c.backgroundOpacity=Number(opacity.value);opacityValue.textContent=opacity.value+'%';};
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


/* ANMA Power Flow: shared studio and Home Assistant renderer. */
(function(root){
  'use strict';
  const Station=root.AnmaEnergyStation||(typeof require==='function'?require('./energy-station.js'):null);
  const text=v=>typeof v==='string'?v.slice(0,200):'';
  const image=v=>typeof v==='string' && v.length<750000 && /^(https?:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp);base64,)/.test(v)?v:'';
  const isManual=v=>typeof v==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v.trim())&&Number.isFinite(Number(v));
  const powerValue=v=>typeof v==='number'&&Number.isFinite(v)?String(v):text(v);
  const rating=v=>Number.isFinite(Number(v))&&Number(v)>0&&Number(v)<=1000000?Number(v):null;
  function utilization(power,capacityKw){
    const capacity=rating(capacityKw);
    if(power===null||power===undefined||!Number.isFinite(power)||!capacity)return null;
    return Math.abs(power)/(capacity*1000);
  }
  function flowDuration(power,capacityKw){const fraction=utilization(power,capacityKw);return fraction===null?2:6-5.4*Math.min(1,fraction);}
  let importedStates={};
  const opacity=(v,fallback=40)=>v!=null&&Number.isFinite(Number(v))?Math.max(0,Math.min(100,Number(v))):fallback;
  const appearance=(v={})=>({image:image(v?.image),imageOpacity:opacity(v?.imageOpacity,25),backgroundOpacity:opacity(v?.backgroundOpacity)});
  function background(raw={}) {
    return {image:image(raw?.image),opacity:raw?.opacity!=null&&Number.isFinite(Number(raw.opacity))?Math.max(0,Math.min(100,Number(raw.opacity))):25,fit:['cover','contain'].includes(raw?.fit)?raw.fit:'cover',position:['center','top','bottom','left','right','left top','right top','left bottom','right bottom'].includes(raw?.position)?raw.position:'center'};
  }
  function normalize(raw={}) {
    raw=raw&&typeof raw==='object'?raw:{};
    const unit=(v,i,prefix)=>({chargeSource:['solar','grid','mixed','sensor'].includes(v?.chargeSource)?v.chargeSource:'sensor',chargeSourceEntity:text(v?.chargeSourceEntity),backgroundOpacity:opacity(v?.backgroundOpacity),capacityKw:rating(v?.capacityKw),name:text(v?.name)||`${prefix} ${i+1}`,image:image(v?.image),imageOpacity:v?.imageOpacity!=null&&Number.isFinite(Number(v.imageOpacity))?Math.max(0,Math.min(100,Number(v.imageOpacity))):25,power:powerValue(v?.power),soc:text(v?.soc),voltage:text(v?.voltage),temperature:text(v?.temperature),mppts:Array.isArray(v?.mppts)?v.mppts.slice(0,2).map(x=>({name:text(x?.name),power:powerValue(x?.power)})):[]});
    return {station:Station.normalize(raw.station),nodeAppearance:Object.fromEntries(['grid','load','nonBackup','ev','solar','battery'].map(k=>[k,appearance(raw.nodeAppearance?.[k])])),background:raw.background&&typeof raw.background==='object'?background(raw.background):null,gridCapacityKw:rating(raw.gridCapacityKw),fit:raw.fit!==false,gridStatus:text(raw.gridStatus),gridOn:text(raw.gridOn)||'on,connected,online,1',gridOff:text(raw.gridOff)||'off,disconnected,offline,0',inverterStatus:text(raw.inverterStatus),inverterOn:text(raw.inverterOn)||'on,running,normal,online',inverterOff:text(raw.inverterOff)||'off,standby,offline',inverterFault:text(raw.inverterFault)||'error,fault,alarm',nonBackup:powerValue(raw.nonBackup),backupName:text(raw.backupName)||'EPS / Backup',nonBackupName:text(raw.nonBackupName)||'Grid / Non-backup',mode:['auto','day','night'].includes(raw.mode)?raw.mode:'auto',profile:['auto','desktop','tablet','mobile'].includes(raw.profile)?raw.profile:'auto',hideDetails:raw.hideDetails!==false,showEv:raw.showEv!==false,invertGrid:raw.invertGrid===true,invertBattery:raw.invertBattery===true,inverter:unit(raw.inverter,0,'Inverter'),batteries:(Array.isArray(raw.batteries)?raw.batteries:[{},{}]).slice(0,5).map((v,i)=>unit(v,i,'Battery')),strings:(Array.isArray(raw.strings)?raw.strings:[{},{}]).slice(0,10).map((v,i)=>unit(v,i,'PV')),grid:powerValue(raw.grid),load:powerValue(raw.load),ev:powerValue(raw.ev)};
  }
  const css=`
  .apf{--pf-bg:#101b25;--pf-panel:#15232f;--pf-ink:#eef5fa;--pf-muted:#9eb1c0;container-type:inline-size;container-name:powerflow;position:relative;isolation:isolate;box-sizing:border-box;width:100%;min-width:0;border:1px solid #334655;border-radius:18px;background:var(--pf-bg);color:var(--pf-ink);padding:16px;overflow:hidden;font:14px system-ui,sans-serif;grid-column:1/-1;display:flex;flex-direction:column;gap:10px}
  .apf[data-fit=true]{height:var(--apf-height,calc(100svh - 72px));min-height:300px;max-height:900px}.apf:fullscreen{height:100dvh;max-height:none;min-height:0;width:100%;border-radius:0;--apf-height:100dvh}
  :host(:fullscreen) .apf{height:100dvh;max-height:none;border-radius:0;--apf-height:100dvh}.anma-container[data-power-flow-only=true]{padding:0!important}.anma-container[data-power-flow-only=true]>.db-preview-head{display:none}.anma-container[data-power-flow-only=true]>.db-canvas{display:block}.anma-container[data-power-flow-only=true]>.db-canvas>div:empty{display:none}
  :root[data-theme=light] .apf[data-auto-theme=true],.db-preview[data-theme-mode^="light_"] .apf[data-auto-theme=true]{--pf-bg:#f4f7fa;--pf-panel:#fff;--pf-ink:#152735;--pf-muted:#526677}
  .apf .apf-name,.apf h2{color:var(--pf-ink)}
  .apf[data-mode=day]{--pf-bg:#f4f7fa;--pf-panel:#fff;--pf-ink:#152735;--pf-muted:#526677}.apf *{box-sizing:border-box}.apf-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1}
  .apf-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex:none}.apf-head h2{font-size:20px;margin:2px 0}.apf-kicker{color:#f1873d;font-size:9px;letter-spacing:1.5px;font-weight:800}.apf-tools{display:flex;gap:6px;align-items:center}.apf-badge{font-size:10px;color:var(--pf-muted)}.apf button{cursor:pointer;font:inherit}.apf-expand,.apf-config-button{border:1px solid #526677;background:var(--pf-panel);color:var(--pf-ink);border-radius:8px;padding:6px 9px}
  .apf-body{display:flex;flex-direction:column;gap:10px;min-height:0;flex:1}.apf-solar,.apf-batteries{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:8px;min-height:0}.apf-solar{flex:1.2;display:flex;flex-direction:column}.apf-solar-row{display:grid;grid-template-columns:repeat(var(--row-cols),minmax(0,1fr));gap:inherit;flex:1;min-height:0}.apf-batteries{flex:1.3}.apf-node{position:relative;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:5px;background:var(--pf-panel);border:1px solid color-mix(in srgb,var(--node) 45%,transparent);border-radius:12px;padding:10px;min-width:0;min-height:0;text-align:center;overflow:hidden}
  .apf-node b{flex:none;display:block;font-size:clamp(15px,2.5cqw,27px);color:var(--node);line-height:1.4;white-space:nowrap}.apf-node small{display:block;color:var(--pf-muted);font-size:11px;line-height:1.3}.apf-short-name{display:none}.apf-name{flex:none;font-size:12px;font-weight:600;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.apf-node img{width:55px;height:55px;object-fit:contain}.apf-icon{display:block;color:var(--node)}.apf-icon svg{width:30px;height:30px;display:block}.apf-state{flex:none;font-size:10px!important;font-weight:700;letter-spacing:.3px}.apf-node[data-state=fault]{--node:#ff827d!important}.apf-node[data-state=offline],.apf-node[data-state=idle]{--node:#81909c!important}.apf-node[data-state=offline] img,.apf-node[data-state=idle] img{filter:grayscale(1)}.apf-node[data-state=unknown]{border-style:dashed}.apf-node[data-state=idle]{opacity:1}.apf-node[data-state=fault] .apf-state{color:#ff827d}.apf-node[data-state=offline] .apf-state{color:#81909c}.apf-marker{position:absolute;right:7px;top:5px;font-weight:800;color:var(--node);font-size:14px}
  .apf-core{position:relative;flex:2;min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:1.2fr 1fr;column-gap:32px;row-gap:20px}.apf-core>.apf-node{z-index:1}.apf-grid{grid-area:1/1}.apf-inverter{grid-area:1/2}.apf-backup{grid-area:1/3}.apf-nonbackup{grid-area:2/1}.apf-ev{grid-area:2/3}.apf-system-note{grid-area:2/2;z-index:1;background:var(--pf-bg);align-self:center;justify-self:center;padding:4px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:11px;color:var(--pf-muted)}
  .apf-wires{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}.apf-wire{fill:none;stroke:var(--wire);stroke-width:2;vector-effect:non-scaling-stroke;opacity:.3}.apf-wire[data-active=true]{opacity:1;stroke-dasharray:5 8;animation:apf-current var(--flow-duration,2s) linear infinite}.apf-wire[data-reverse=true]{animation-direction:reverse}.apf-stream{position:absolute;bottom:6px;left:9px;width:calc(100% - 18px);height:5px;border-radius:3px;pointer-events:none;z-index:1;background:var(--node);opacity:.2}.apf-stream[data-active=true]{opacity:1;background:repeating-linear-gradient(90deg,var(--node) 0 8px,transparent 8px 18px);background-size:36px 5px;animation:apf-strip var(--flow-duration,2s) linear infinite}.apf-stream[data-reverse=true]{animation-direction:reverse}.apf-caption{display:flex;justify-content:space-between;font-size:10px;color:var(--pf-muted);flex:none;gap:8px}.apf-charge{width:90%;height:4px;background:#334655;border-radius:4px;overflow:hidden}.apf-charge i{display:block;height:100%;background:#51d7a0}.apf-energy{font-size:10px!important}
  .apf[data-fit=true] .apf-detail,.apf[data-fit=true] .apf-charge{display:none}.apf[data-fit=true] .apf-solar[data-dense=true] .apf-icon{display:none}.apf[data-fit=true] .apf-node img{width:32px;height:32px}.apf[data-fit=true] .apf-icon svg{width:24px;height:24px}.apf[data-fit=true] .apf-node{gap:3px;padding:6px}
  .apf-perimeter{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}.apf-perimeter rect{width:calc(100% - 5px);height:calc(100% - 5px);fill:none;stroke:var(--node);stroke-width:2.5;stroke-linecap:butt}.apf-perimeter-track{opacity:.12}.apf-perimeter-value{opacity:1}.apf-node[data-overload=true] .apf-perimeter-value{stroke:#ff827d}.apf-overload{position:absolute;right:5px;top:3px;font-size:11px;color:#ff827d;font-weight:800}
  .apf>.db-sector-tag{display:none}
  .apf-entity-menu{display:grid;gap:4px;max-height:220px;overflow:auto}.apf-entity-menu[hidden]{display:none}.apf-settings .apf-entity-menu button{background:var(--pf-panel,#15232f);color:var(--pf-ink,#eef5fa);border:1px solid #b8753e;text-align:left;font-size:11px;overflow-wrap:anywhere}
  .apf .apf-config-button{color:#f1873d;border:1px solid #304655;border-radius:8px;padding:8px;background:var(--pf-panel)}
  .apf .apf-connections{inset:65px 10px 10px auto;z-index:20;width:min(430px,calc(100% - 20px));padding:12px;box-sizing:border-box;background:var(--pf-panel);border:1px solid #b8753e;box-shadow:0 12px 32px #0005;overscroll-behavior:contain;touch-action:pan-y}
  .apf .apf-connections>summary{position:static;background:transparent;border:1px solid #526677;border-radius:8px;color:var(--pf-ink);width:fit-content;list-style:none}
  .apf .apf-connections>summary::-webkit-details-marker{display:none}
  .apf .apf-connections .apf-settings{grid-template-columns:minmax(0,1fr);font-size:13px}
  .apf .apf-connections fieldset{border-radius:8px;padding:10px;background:transparent}
  .apf .apf-connections input,.apf .apf-connections select{box-sizing:border-box;background:var(--pf-bg);border-radius:6px;font:inherit}
  @container powerflow (max-width:600px){.apf-head{flex-wrap:wrap}.apf-head .apf-tools{margin-left:auto}.apf .apf-config-button{font-size:12px;padding:7px}}
  .apf-config{position:absolute;z-index:10;inset:8px;overflow:auto;padding:16px;background:var(--pf-bg);border:1px solid #526677;border-radius:12px}.apf-config:not([open]){display:none}.apf-config summary{cursor:pointer;color:#f1873d;position:sticky;top:0;background:var(--pf-bg);padding:8px;z-index:1}.apf-settings{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:12px;margin-top:12px}.apf-settings label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--pf-muted)}.apf-settings input,.apf-settings select{width:100%;min-width:0;background:var(--pf-panel);color:var(--pf-ink);padding:8px;border:1px solid #526677;border-radius:7px}.apf-settings input[type=checkbox]{width:auto;align-self:start}.apf-settings{align-items:start}.apf-settings fieldset{min-width:0;border:1px solid #b8753e;border-radius:10px;display:grid;align-content:start;gap:10px;padding:12px;background:color-mix(in srgb,var(--pf-panel,#15232f) 94%,white)}.apf-settings fieldset legend{color:#f1873d;font-weight:700;padding:0 5px}.apf-settings fieldset:focus-within{border-color:#ff9b4b;box-shadow:0 0 0 1px #f1873d55}.apf-settings fieldset fieldset{background:transparent;border-color:#815638}.apf-capacity{border-left:3px solid #f1873d;padding:9px;background:#f1873d12;border-radius:6px}.apf-capacity small{line-height:1.5;color:var(--pf-muted)}.apf-settings button{background:#f1873d;color:#101b25;border:0;border-radius:7px;padding:8px}
  .apf-node{isolation:isolate;background:transparent!important}.apf-node::before{content:"";position:absolute;inset:0;z-index:-2;pointer-events:none;background:var(--pf-panel);opacity:var(--node-background-opacity,.4);border-radius:inherit}.apf-node-photo{position:absolute;inset:0;z-index:-1;pointer-events:none;background-size:cover;background-position:center;background-repeat:no-repeat;border-radius:inherit}
  @keyframes apf-current{to{stroke-dashoffset:-26}}@keyframes apf-strip{to{background-position:36px 0}}@media(prefers-reduced-motion:reduce){.apf *{animation:none!important}}
  @container powerflow (max-width:600px){.apf-core .apf-name,.apf-core .apf-state,.apf-core .apf-detail,.apf-core .apf-system-note{display:none}.apf-core .apf-icon{display:block!important}.apf-solar .apf-name,.apf-batteries .apf-name{display:none}.apf-solar .apf-short-name,.apf-batteries .apf-short-name{display:block;font-size:10px;flex:none}.apf-head h2{font-size:16px}.apf-kicker{font-size:8px;letter-spacing:.5px}.apf-badge{display:none}.apf-body{gap:7px}.apf-solar,.apf-batteries{gap:4px}.apf-node{padding:6px 3px;gap:4px;border-radius:8px}.apf-node b{font-size:clamp(11px,3.6cqw,19px)}.apf-name{flex:none;font-size:10px}.apf-node small{font-size:9px}.apf-core{gap:16px 12px;flex:2}.apf-core .apf-name{white-space:normal;font-size:10px}.apf-icon svg{width:22px;height:22px}.apf-node img{width:30px;height:30px}.apf-solar .apf-icon,.apf-solar .apf-detail,.apf-batteries .apf-icon,.apf-batteries img,.apf-batteries .apf-detail,.apf-batteries .apf-energy,.apf-batteries .apf-charge{display:none}.apf-batteries .apf-state{flex:none;font-size:8px!important;letter-spacing:0}.apf-body .apf-detail{display:none}.apf-system-note{font-size:9px}.apf-marker{font-size:11px;right:3px;top:2px}.apf-solar{flex:1.2}.apf-batteries{flex:1.3}.apf-caption{font-size:9px}.apf-tools button{padding:4px 6px}}
  .apf[data-profile=mobile] .apf-core .apf-name,.apf[data-profile=mobile] .apf-core .apf-state,.apf[data-profile=mobile] .apf-core .apf-system-note{display:none}
  .apf[data-profile=mobile] .apf-detail,.apf[data-profile=mobile] .apf-batteries img,.apf[data-profile=mobile] .apf-batteries .apf-icon{display:none}
  @media(max-height:500px){.apf-body .apf-core{flex:2.8}.apf-body .apf-solar,.apf-body .apf-batteries{flex:1}.apf-solar{grid-template-columns:repeat(var(--total),minmax(0,1fr))}.apf{padding:8px;gap:5px}.apf-head h2{font-size:14px}.apf-kicker,.apf-icon,.apf-node img,.apf-detail,.apf-energy,.apf-charge{display:none!important}.apf-body{gap:4px}.apf-core{row-gap:8px}.apf-node{gap:1px!important;padding:3px!important}.apf-node b{font-size:16px}.apf-node .apf-name{font-size:9px;line-height:12px}.apf-node .apf-state{font-size:8px!important;line-height:10px}.apf-caption{font-size:8px}}
  `;
  function render(layout,{uk=false,demo=false,hass=null,change=null}={}){
    if(layout.template==='energy_station')return Station.render(layout,{uk,demo,hass,change});
    const c=normalize(layout.powerFlow),n=(tag,cls,txt)=>{const e=document.createElement(tag);e.className=cls||'';if(txt!==undefined)e.textContent=txt;return e;},tr=(en,ua)=>uk?ua:en;
    const card=n('section','apf db-widget-box');card.dataset.mode=c.mode==='auto'?(String(layout.theme?.mode).startsWith('light')||layout.theme?.mode==='nordic'?'day':'night'):c.mode;card.dataset.autoTheme=String(c.mode==='auto');card.dataset.profile=c.profile;card.setAttribute('aria-label','ANMA Power Flow');
    card.append(n('style','',css));const sceneBackground=background(c.background||layout.background);if(sceneBackground.image){const bg=n('img','apf-bg');bg.src=sceneBackground.image;bg.alt='';bg.style.cssText='position:absolute;inset:0;width:100%;height:100%;max-width:none;max-height:none;z-index:-1;pointer-events:none';bg.style.opacity=sceneBackground.opacity/100;bg.style.objectFit=sceneBackground.fit;bg.style.objectPosition=sceneBackground.position;card.append(bg);}
    const head=n('header','apf-head'),brand=n('div');brand.append(n('span','apf-kicker','ANMA ELECTRIC / ENERGY SYSTEM'),n('h2','','Power Flow'));head.append(brand,n('span','apf-badge',demo?tr('DEMO · PREVIEW','ДЕМО · ПЕРЕГЛЯД'):tr('HOME ASSISTANT','HOME ASSISTANT')));card.append(head);
    const manualValues=[c.grid,c.load,c.ev,c.nonBackup,c.inverter.power,...c.batteries.map(b=>b.power),...c.strings.flatMap(s=>s.mppts.length?s.mppts.map(m=>m.power):[s.power])].some(isManual);
    if(manualValues){head.querySelector('.apf-badge').textContent=tr('MANUAL VALUES INCLUDED','Є РУЧНІ ЗНАЧЕННЯ');head.querySelector('h2').title=tr('Some power values are manually configured, not live telemetry.','Частину потужностей задано вручну — це не живі показники сенсорів.');}
    const read=(id,fallback,kind='power')=>{if(kind==='power'&&isManual(id))return Number(id);if(demo)return fallback;const s=hass?.states?.[id];if(!s||['','unknown','unavailable'].includes(s.state)||!Number.isFinite(Number(s.state)))return null;let v=Number(s.state);if(kind==='power'){const u=s.attributes?.unit_of_measurement;if(u==='kW')v*=1000;else if(u==='MW')v*=1000000;else if(u!=='W')return null;}return v;};
    const fmt=v=>v===null?'—':Math.abs(v)>=1000?(v/1000).toLocaleString(uk?'uk':'en',{maximumFractionDigits:2})+' kW':Math.round(v)+' W';
    const node=(name,icon,color,value,img,imageOpacity=25)=>{const e=n('div','apf-node');e.style.setProperty('--node',color);if(img){const pic=n('div','apf-node-photo');pic.style.backgroundImage='url('+JSON.stringify(img)+')';pic.style.opacity=imageOpacity/100;pic.setAttribute('aria-hidden','true');e.append(pic);} {const holder=n('span','apf-icon');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 32 32');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.7');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',({'☀':'M16 1v4m0 22v4M1 16h4m22 0h4M5 5l3 3m16 16 3 3M5 27l3-3M24 8l3-3M23 16a7 7 0 1 1-14 0 7 7 0 0 1 14 0','♜':'M12 3h8l6 26H6L12 3Zm-4 9h16M5 19h22M12 12l10 14m-2-14L10 26M9 6h14','ϟ':'M8 3h16v26H8V3Zm4 5h8v5h-8V8Zm6 9-5 5h6l-5 5','⌂':'M3 15 16 4l13 11M7 12v16h7v-9h5v9h6V12','▤':'M12 3h8v3H12V3ZM7 6h18v23H7V6Zm4 5h10m-10 5h10m-10 5h10','🚘':'M5 15 9 6h14l4 9v11h-4v-4H9v4H5V15Zm0 0h22M8 18h4m8 0h4'})[icon]||'M16 3v26M3 16h26');svg.append(path);holder.append(svg);e.append(holder);}e.append(n('span','apf-name',name),n('b','',value));e.setAttribute('aria-label',name+' · '+value);e.title=name+' · '+value;return e;};
    function perimeter(element,power,capacityKw){
      const ratio=utilization(power,capacityKw);if(ratio===null)return;
      element.dataset.utilization=String(Math.round(ratio*1000)/10);element.dataset.overload=String(ratio>1);
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('apf-perimeter');svg.setAttribute('role','img');
      const description=tr('Power utilization','Навантаження')+': '+Math.round(ratio*100)+'% · '+capacityKw+' kW'+(ratio>1?' · '+tr('Over nominal power','Перевищення номіналу'):'');svg.setAttribute('aria-label',description);
      const title=document.createElementNS(svg.namespaceURI,'title');title.textContent=description;svg.append(title);
      for(const cls of ['apf-perimeter-track','apf-perimeter-value']){const rect=document.createElementNS(svg.namespaceURI,'rect');rect.setAttribute('x','2.5');rect.setAttribute('y','2.5');rect.setAttribute('rx','8');rect.setAttribute('pathLength','100');rect.classList.add(cls);if(cls==='apf-perimeter-value'){rect.setAttribute('stroke-dasharray',`${Math.min(1,ratio)*100} 100`);}svg.append(rect);}
      element.append(svg);if(ratio>1){const badge=n('span','apf-overload','!');badge.title=description;element.append(badge);}
    }
    card.dataset.fit=String(c.fit);
    const tools=n('div','apf-tools');tools.append(head.lastChild);head.append(tools);
    const expand=n('button','apf-expand','⛶');expand.type='button';expand.title=tr('Fit full screen','На весь екран');expand.setAttribute('aria-label',expand.title);
    expand.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await (card.getRootNode().host||card).requestFullscreen();}catch(_){expand.title=tr('Use dashboard kiosk mode','Скористайтесь режимом Kiosk дашборду');}};tools.append(expand);
    const state=(id,groups,fallback)=>{if(demo)return fallback;const v=hass?.states?.[id]?.state;if(v===undefined||['unknown','unavailable',''].includes(String(v)))return 'unknown';return Object.keys(groups).find(k=>groups[k].split(',').map(x=>x.trim().toLowerCase()).includes(String(v).trim().toLowerCase()))||'unknown';};
    const gridState=state(c.gridStatus,{online:c.gridOn,offline:c.gridOff},'online');
    const invState=state(c.inverterStatus,{online:c.inverterOn,offline:c.inverterOff,fault:c.inverterFault},'online');
    const body=n('div','apf-body');body.dataset.hide=c.hideDetails;
    const stream=(e,p,reverse=false,capacityKw=null)=>{const bar=n('div','apf-stream');bar.dataset.active=String(p!==null&&p!==0&&layout.motion!==false);bar.dataset.reverse=String(reverse);bar.style.setProperty('--flow-duration',flowDuration(p,capacityKw)+'s');e.append(bar);};
    const mark=(e,value,label)=>{e.dataset.state=value;e.append(n('small','apf-state',label));e.title=e.querySelector('.apf-name').textContent+' · '+label;};
    const solar=n('div','apf-solar');solar.dataset.dense=String(c.strings.length>5);solar.style.setProperty('--cols',Math.max(1,Math.min(5,c.strings.length)));solar.style.setProperty('--total',Math.max(1,c.strings.length));const topCount=Math.ceil(c.strings.length/2),rows=[];for(const count of c.strings.length===1?[1]:[topCount,c.strings.length-topCount]){if(!count)continue;const row=n('div','apf-solar-row');row.style.setProperty('--row-cols',count);solar.append(row);rows.push(row);}let total=0,known=true;
    c.strings.forEach((s,i)=>{
      const readings=s.mppts.length?s.mppts.map((m,j)=>read(m.power,900+i*100+j*200)):[read(s.power,1800+i*200)];
      const p=readings.every(v=>v!==null)?readings.reduce((a,b)=>a+b,0):null;if(p===null)known=false;else total+=p;
      const e=node(s.name,'☀','#f6ae49',fmt(p));e.querySelector('b').before(n('span','apf-short-name','PV '+(i+1)));e.dataset.state=p===null?'unknown':p>0?'online':'idle';e.title=s.name+' · '+(p===null?tr('No data','Немає даних'):p>0?tr('Generating','Генерує'):tr('No generation','Без генерації'));
      s.mppts.forEach((m,j)=>e.append(n('small','apf-detail',(m.name||'MPPT '+(j+1))+' · '+fmt(readings[j]))));stream(e,p,false,s.capacityKw);perimeter(e,p,s.capacityKw);rows[i<topCount?0:1].append(e);
    });
    if(c.strings.length){body.append(n('div','apf-caption',tr('SOLAR · ','СОНЦЕ · ')+fmt(known?total:null)),solar);}
    const core=n('div','apf-core');
    const gridRaw=read(c.grid||layout.bindings?.grid_power,650),grid=gridRaw===null?null:gridRaw*(c.invertGrid?-1:1);
    const gridNode=node(tr('Grid','Мережа'),'♜','#83b4ff',gridState==='offline'?'—':fmt(grid===null?null:Math.abs(grid)));gridNode.classList.add('apf-grid');
    const gridLabel=gridState==='offline'?tr('GRID LOST','НЕМАЄ МЕРЕЖІ'):grid===null?tr('NO DATA','НЕМАЄ ДАНИХ'):grid>0?tr('IMPORT →','ІМПОРТ →'):grid<0?tr('← EXPORT','← ЕКСПОРТ'):tr('NO EXCHANGE','БЕЗ ОБМІНУ');
    mark(gridNode,gridState,gridLabel);perimeter(gridNode,gridState==='offline'?null:grid,c.gridCapacityKw);gridNode.append(n('span','apf-marker',gridState==='offline'?'×':grid>0?'↘':grid<0?'↗':'·'));
    if(gridState==='unknown'&&grid!==null)gridNode.append(n('small','apf-detail',tr('Connection state unknown','Стан підключення невідомий')));
    const inv=node(c.inverter.name,'ϟ','#f1873d',fmt(read(c.inverter.power,known?total:0)),c.inverter.image,c.inverter.imageOpacity);inv.classList.add('apf-inverter');
    const invLabel={online:tr('RUNNING','ПРАЦЮЄ'),offline:tr('OFF / STANDBY','ВИМК. / ОЧІКУЄ'),fault:tr('⚠ FAULT','⚠ ПОМИЛКА'),unknown:tr('STATUS UNKNOWN','СТАН НЕВІДОМИЙ')}[invState];mark(inv,invState,invLabel);perimeter(inv,read(c.inverter.power,known?total:0),c.inverter.capacityKw);
    const load=read(c.load||layout.bindings?.load_power,2450),nonBackup=read(c.nonBackup,350),ev=read(c.ev||layout.bindings?.ev_power,0);
    const backed=node(c.backupName==='EPS / Backup'?tr('Guaranteed load','Гарантоване'):c.backupName,'⌂','#58c7db',fmt(load));backed.classList.add('apf-backup');backed.append(n('small','apf-state',tr('FROM INVERTER','ВІД ІНВЕРТОРА')));
    const non=node(c.nonBackupName==='Grid / Non-backup'?tr('Non-guaranteed','Негарантоване'):c.nonBackupName,'⌂','#83b4ff',gridState==='offline'?'—':fmt(nonBackup));non.classList.add('apf-nonbackup');mark(non,gridState,gridState==='offline'?tr('NO SUPPLY','БЕЗ ЖИВЛЕННЯ'):gridState==='online'?tr('FROM GRID','ВІД МЕРЕЖІ'):tr('GRID STATUS ?','СТАН МЕРЕЖІ ?'));
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('apf-wires');svg.setAttribute('viewBox','0 0 300 200');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');
    const wire=(id,d,p,reverse,color,enabled=true,capacityKw=null)=>{const line=document.createElementNS(svg.namespaceURI,'path');line.classList.add('apf-wire');line.dataset.branch=id;line.setAttribute('d',d);line.style.setProperty('--wire',!enabled||p===0?'#81909c':color);line.dataset.active=String(enabled&&p!==null&&p!==0&&layout.motion!==false);line.dataset.reverse=String(reverse);line.style.setProperty('--flow-duration',flowDuration(p,capacityKw)+'s');svg.append(line);};
    wire('solar-inverter','M150 -8V52',known?total:null,false,'#f6ae49',true,c.strings.every(s=>s.capacityKw)?c.strings.reduce((sum,s)=>sum+s.capacityKw,0):null);
    wire('grid-inverter','M50 52H150',grid,grid<0,'#83b4ff',gridState!=='offline',c.gridCapacityKw);
    wire('inverter-backup','M150 52H250',load,load<0,'#58c7db',true,c.inverter.capacityKw);
    wire('grid-nonbackup','M50 52V158',nonBackup,nonBackup<0,'#83b4ff',gridState!=='offline',c.gridCapacityKw);
    if(c.showEv){wire('backup-ev','M250 52V158',ev,ev<0,'#58c7db',true,c.inverter.capacityKw);const car=node(tr('EV charger','Зарядка авто'),'🚘','#58c7db',fmt(ev));car.classList.add('apf-ev');core.append(car);}
    core.append(svg,gridNode,inv,backed,non,n('div','apf-system-note',gridState==='offline'?tr('Backup circuit · inverter / battery','Резервна група · інвертор / АКБ'):tr('ANMA ENERGY SYSTEM','ЕНЕРГОСИСТЕМА ANMA')));body.append(core);
    const chargingSources=new Set();const sourceColors={solar:'#f6ae49',grid:'#83b4ff',mixed:'#b4a3db',unknown:'#81909c'};const batteries=n('div','apf-batteries');batteries.style.setProperty('--cols',Math.max(1,c.batteries.length));let batteryTotal=0,batteryKnown=true;
    c.batteries.forEach((b,i)=>{
      const soc=read(b.soc,76-i*3,'soc'),p=read(b.power,-800),signed=p===null?null:p*(c.invertBattery?-1:1);if(signed===null)batteryKnown=false;else batteryTotal+=signed;
      const source=b.chargeSource==='sensor'?(demo?'solar':String(hass?.states?.[b.chargeSourceEntity]?.state||'').toLowerCase()):b.chargeSource;const chargeSource=['solar','grid','mixed'].includes(source)?source:'unknown';if(signed<0)chargingSources.add(chargeSource);
      const batteryColor=signed>0?'#51d7a0':signed<0?sourceColors[chargeSource]:'#81909c';
      const e=node(b.name,'▤',batteryColor,soc===null?'—':Math.round(Math.min(100,Math.max(0,soc)))+'%',b.image,b.imageOpacity);e.querySelector('b').before(n('span','apf-short-name',tr('BAT ','АКБ ')+(i+1)));
      e.append(n('small','apf-energy',fmt(signed)));mark(e,signed===null?'unknown':signed===0?'idle':signed<0?'charging':'discharging',signed===null?tr('NO DATA','НЕМАЄ ДАНИХ'):signed<0?({solar:tr('↓ Solar','↓ Сонце'),grid:tr('↓ Grid','↓ Мережа'),mixed:tr('↓ Mixed','↓ Зміш.'),unknown:tr('↓ Charge ?','↓ Заряд ?')})[chargeSource]:signed>0?tr('↑ Discharge','↑ Розряд'):tr('Idle','Спокій'));
      const bar=n('div','apf-charge'),fill=n('i');fill.style.width=(soc===null?0:Math.min(100,Math.max(0,soc)))+'%';bar.append(fill);e.append(bar);
      const v=read(b.voltage,53.2,'voltage'),t=read(b.temperature,24,'temperature');e.append(n('small','apf-detail',(v===null?'—':v+' V')+' · '+(t===null?'—':t+' °C')));stream(e,signed,signed>0,b.capacityKw);perimeter(e,signed,b.capacityKw);batteries.append(e);
    });
    if(c.batteries.length)wire('inverter-battery','M150 52V200',batteryKnown?batteryTotal:null,batteryTotal>0,batteryTotal>0?'#51d7a0':sourceColors[chargingSources.size===1?[...chargingSources][0]:chargingSources.has('unknown')?'unknown':'mixed'],true,c.batteries.every(b=>b.capacityKw)?c.batteries.reduce((sum,b)=>sum+b.capacityKw,0):null);
    if(c.batteries.length)body.append(n('div','apf-caption',tr('BATTERIES · ','АКУМУЛЯТОРИ · ')+fmt(batteryKnown?batteryTotal:null)),batteries);
    if(layout.template!=='cloud_flow'){
      const refresh=()=>{
        const bounds=svg.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
        const box=element=>{const r=element.getBoundingClientRect();return {l:(r.left-bounds.left)*300/bounds.width,r:(r.right-bounds.left)*300/bounds.width,t:(r.top-bounds.top)*200/bounds.height,b:(r.bottom-bounds.top)*200/bounds.height,x:(r.left+r.width/2-bounds.left)*300/bounds.width,y:(r.top+r.height/2-bounds.top)*200/bounds.height};};
        const g=box(gridNode),i=box(inv),b=box(backed),n=box(non),car=core.querySelector('.apf-ev');
        const routes={
          'grid-inverter':`M${g.r} ${g.y}L${i.l} ${i.y}`,
          'inverter-backup':`M${i.r} ${i.y}L${b.l} ${b.y}`,
          'grid-nonbackup':`M${g.x} ${g.b}L${n.x} ${n.t}`,
          'solar-inverter':`M${i.x} -8V${i.t}`,
          'inverter-battery':`M${i.x} ${i.b}V200`
        };
        if(car){const e=box(car);routes['backup-ev']=`M${b.x} ${b.b}L${e.x} ${e.t}`;}
        svg.querySelectorAll('.apf-wire').forEach(path=>{if(routes[path.dataset.branch])path.setAttribute('d',routes[path.dataset.branch]);});
      };
      card._refreshPowerPaths=refresh;
      requestAnimationFrame(()=>{if(!card.isConnected)return;refresh();const observer=new ResizeObserver(()=>{if(!card.isConnected){observer.disconnect();return;}refresh();});observer.observe(core);[gridNode,inv,backed,non].forEach(e=>observer.observe(e));});
    }
    if(layout.template==='cloud_flow'){
      card.classList.add('apf-cloud');card.setAttribute('aria-label','ANMA Cloud Flow');head.querySelector('h2').textContent='Cloud Flow';
      const sun=node(tr('Solar','Сонце'),'☀','#f6ae49',fmt(known?total:null));sun.classList.add('cloud-solar');
      const bat=node(tr('Battery · total','АКБ · разом'),'▤','#51d7a0',fmt(batteryKnown?batteryTotal:null));bat.classList.add('cloud-battery');
      const master=c.batteries[0],soc=master?read(master.soc,76,'soc'):null;
      if(soc!==null)bat.append(n('small','',tr('Master SOC · ','SOC головної · ')+Math.round(soc)+'%'));
      bat.append(n('small','',batteryKnown?(batteryTotal>0?tr('Discharging','Розряд'):batteryTotal<0?tr('Charging','Заряд'):tr('Idle','Спокій')):'—'));
      const paths={
        'solar-inverter':'M30 30H70Q80 30 80 40V82Q80 94 92 94H150',
        'grid-inverter':'M270 30H230Q220 30 220 40V82Q220 94 208 94H150',
        'inverter-backup':'M150 94V170',
        'grid-nonbackup':'M270 30V170',
        'inverter-battery':'M150 94H92Q80 94 80 106V158Q80 170 68 170H30'
      };
      svg.querySelectorAll('path').forEach(path=>{const d=paths[path.dataset.branch];if(d)path.setAttribute('d',d);else path.remove();});
      const defs=document.createElementNS(svg.namespaceURI,'defs');const marker=document.createElementNS(svg.namespaceURI,'marker');
      const markerId='cloud-arrow-'+Math.random().toString(36).slice(2);marker.id=markerId;marker.setAttribute('viewBox','0 0 10 10');marker.setAttribute('refX','10');marker.setAttribute('refY','5');marker.setAttribute('markerWidth','5');marker.setAttribute('markerHeight','5');marker.setAttribute('orient','auto-start-reverse');
      const arrow=document.createElementNS(svg.namespaceURI,'path');arrow.setAttribute('d','M0 0L10 5L0 10Z');arrow.setAttribute('fill','#83b4ff');marker.append(arrow);defs.append(marker);svg.prepend(defs);
      svg.querySelectorAll('.apf-wire').forEach(path=>{if(path.dataset.active==='true')path.setAttribute(path.dataset.reverse==='true'?'marker-start':'marker-end','url(#'+markerId+')');});
      const particles=[];
      svg.querySelectorAll('.apf-wire[data-active=true]').forEach(path=>{
        for(let tail=4;tail>=0;tail--){
          const dot=document.createElementNS(svg.namespaceURI,'circle');
          dot.classList.add('cloud-flow-dot');
          dot.setAttribute('r',tail?String(1.8-tail*.32):'1.8');
          dot.setAttribute('fill','#54a9ff');
          dot.setAttribute('opacity',tail?String([1,.65,.4,.22,.1][tail]):'1');
          if(!tail){dot.setAttribute('stroke','#d7edff');dot.setAttribute('stroke-width','.7');}
          const motion=document.createElementNS(svg.namespaceURI,'animateMotion');
          motion.setAttribute('dur',path.style.getPropertyValue('--flow-duration')||'2s');
          motion.setAttribute('repeatCount','indefinite');motion.setAttribute('calcMode','linear');
          motion.setAttribute('keyPoints',path.dataset.reverse==='true'?'1;0':'0;1');motion.setAttribute('keyTimes','0;1');
          svg.append(dot);particles.push({path,dot,motion,tail});
        }
      });
      const updateCloudPaths=()=>{
        const bounds=body.getBoundingClientRect();if(!bounds.width||!bounds.height)return;
        const box=el=>{const r=el.getBoundingClientRect();return {l:(r.left-bounds.left)*300/bounds.width,r:(r.right-bounds.left)*300/bounds.width,t:(r.top-bounds.top)*200/bounds.height,b:(r.bottom-bounds.top)*200/bounds.height,x:(r.left+r.width/2-bounds.left)*300/bounds.width,y:(r.top+r.height/2-bounds.top)*200/bounds.height};};
        const a=box(sun),g=box(gridNode),i=box(inv),b=box(bat),l=box(backed),n=box(non);
        const elbow=(x1,y1,x2,y2)=>{const mid=(x1+x2)/2,sx=Math.sign(x2-x1),sy=Math.sign(y2-y1),r=Math.min(8,Math.abs(x2-x1)/4,Math.abs(y2-y1)/4);return `M${x1} ${y1}H${mid-sx*r}Q${mid} ${y1} ${mid} ${y1+sy*r}V${y2-sy*r}Q${mid} ${y2} ${mid+sx*r} ${y2}H${x2}`;};
        const routes={
          'solar-inverter':elbow(a.r,a.y,i.l,i.y),
          'grid-inverter':elbow(g.l,g.y,i.r,i.y),
          'inverter-backup':`M${i.x} ${i.b}L${l.x} ${l.t}`,
          'grid-nonbackup':`M${g.x} ${g.b}L${n.x} ${n.t}`,
          'inverter-battery':elbow(i.l,i.y,b.r,b.y)
        };
        svg.querySelectorAll('.apf-wire').forEach(path=>path.setAttribute('d',routes[path.dataset.branch]));
        particles.forEach(({path,motion,tail})=>{
          motion.setAttribute('path',path.getAttribute('d'));
          // Separate the fading samples so the trail remains visible behind the head.
          const length=path.getTotalLength()*bounds.width/300;
          const seconds=parseFloat(motion.getAttribute('dur'))||2;
          if(!motion.dataset.started){
            // The shared frame loop below positions the head and its trail.
            motion.dataset.started='true';
          }
        });
      };
      card._refreshCloudPaths=updateCloudPaths;
      requestAnimationFrame(()=>{
        if(!card.isConnected)return;
        updateCloudPaths();
        let last=performance.now();const phases=new Map();
        const animate=now=>{
          if(!card.isConnected)return;
          const elapsed=(now-last)/1000;last=now;
          const width=body.getBoundingClientRect().width;
          svg.querySelectorAll('.apf-wire[data-active=true]').forEach(path=>{
            const duration=parseFloat(path.style.getPropertyValue('--flow-duration'))||2;
            phases.set(path,((phases.get(path)||0)+elapsed/duration)%1);
          });
          particles.forEach(({path,dot,tail})=>{
            const length=path.getTotalLength();if(!length||!width)return;
            const phase=((phases.get(path)||0)-tail*7*300/width/length+1)%1;
            const point=path.getPointAtLength((path.dataset.reverse==='true'?1-phase:phase)*length);
            dot.setAttribute('cx',point.x);dot.setAttribute('cy',point.y);
          });
          requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        const resize=new ResizeObserver(()=>{if(!card.isConnected){resize.disconnect();return;}updateCloudPaths();});
        resize.observe(body);[sun,gridNode,inv,bat,backed,non].forEach(el=>resize.observe(el));
      });
      body.replaceChildren(svg,sun,gridNode,inv,bat,backed,non);
      card.append(n('style','',`
        .apf-cloud .apf-body{position:relative;display:block;min-height:220px}
        .apf-cloud .apf-body>.apf-node{position:absolute;transform:translate(-50%,-50%);width:clamp(66px,19%,150px);min-height:64px;padding:8px 4px;gap:4px;background:var(--pf-panel);border-color:color-mix(in srgb,var(--node) 30%,transparent);box-shadow:0 3px 12px #0002;z-index:1}
        .apf-cloud .cloud-solar{left:12%;top:15%}.apf-cloud .apf-grid{left:88%;top:15%}.apf-cloud .apf-inverter{left:50%;top:47%}.apf-cloud .cloud-battery{left:12%;top:85%}.apf-cloud .apf-backup{left:50%;top:85%}.apf-cloud .apf-nonbackup{left:88%;top:85%}
        .apf-cloud .apf-wires{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
        .apf-cloud .apf-wire{stroke-width:2;stroke-dasharray:4 6;stroke-linecap:round;animation-name:cloud-current;animation-duration:1s}
        @keyframes cloud-current{to{stroke-dashoffset:-20}}

        .apf-cloud .apf-name,.apf-cloud h2{color:var(--pf-ink)}
        .apf-cloud .apf-perimeter,.apf-cloud .apf-marker{display:none}
        @media(prefers-reduced-motion:reduce){.cloud-flow-dot{display:none}}
        .apf-cloud .apf-node b{font-size:clamp(12px,2.7cqw,24px)}
        @container powerflow (max-width:600px){.apf-cloud .apf-name,.apf-cloud .apf-state{display:none}.apf-cloud .apf-body .apf-icon{display:block!important}.apf-cloud .apf-node small{font-size:9px}.apf-cloud .apf-body>.apf-node{min-height:66px}.apf-cloud .apf-kicker{display:none}}
      `));
    }
    card.append(body);
    const decorate=(element,config)=>{
      if(!element)return;
      const a=appearance(config);
      element.style.setProperty('--node-background-opacity',a.backgroundOpacity/100);
      element.querySelector('.apf-node-photo')?.remove();
      if(a.image){const photo=n('span','apf-node-photo');photo.style.backgroundImage='url('+JSON.stringify(a.image)+')';photo.style.opacity=a.imageOpacity/100;photo.setAttribute('aria-hidden','true');element.prepend(photo);}
    };
    decorate(inv,c.inverter);
    [...solar.querySelectorAll('.apf-node')].forEach((el,i)=>decorate(el,c.strings[i]));
    [...batteries.querySelectorAll('.apf-node')].forEach((el,i)=>decorate(el,c.batteries[i]));
    for(const [selector,key] of [['.apf-grid','grid'],['.apf-backup','load'],['.apf-nonbackup','nonBackup'],['.apf-ev','ev'],['.cloud-solar','solar'],['.cloud-battery','battery']])decorate(body.querySelector(selector),c.nodeAppearance[key]);
    if(change){
      const settings=editor(c,uk,(next,redraw=true)=>{layout.powerFlow=normalize(next);change(redraw);},{legacyBackground:layout.background,getStates:()=>hass?.states||null});
      settings.classList.add('apf-connections');settings.querySelector('summary').textContent=tr('✕ Close','✕ Закрити');
      const toggle=n('button','apf-config-button',tr('⚙ Connections','⚙ З’єднання'));toggle.type='button';toggle.setAttribute('aria-expanded','false');
      toggle.onclick=()=>{settings.open=!settings.open;toggle.setAttribute('aria-expanded',String(settings.open));};
      settings.addEventListener('toggle',()=>toggle.setAttribute('aria-expanded',String(settings.open)));
      card.addEventListener('keydown',e=>{if(e.key==='Escape'&&settings.open){settings.open=false;toggle.focus();}});
      tools.append(toggle);card.append(settings);
    }
    return card;
  }
  // Keep live nodes (and their animation timelines) across HA state updates.
  function update(host,layout,options={}){
    if(layout.template==='energy_station')return Station.update(host,layout,options);
    const next=render(layout,options),current=host.firstElementChild;
    if(!current||current.className!==next.className){host.replaceChildren(next);return next;}
    function sync(target,source){
      if(target.nodeType!==source.nodeType||target.nodeName!==source.nodeName){target.replaceWith(source);return;}
      if(target.nodeType===3){if(target.data!==source.data)target.data=source.data;return;}
      if(target.nodeType!==1)return;
      const animations=target.getAnimations?.().map(a=>({animation:a,time:a.currentTime,duration:a.effect?.getTiming().duration}))||[];
      const keep=new Set(target.closest?.('.apf-cloud')?(target.tagName==='animateMotion'?['path','begin','data-started']:target.classList?.contains('apf-wire')?['d']:[]):[]);
      for(const attr of [...target.attributes])if(!keep.has(attr.name)&&!source.hasAttribute(attr.name))target.removeAttribute(attr.name);
      for(const attr of source.attributes)if(!keep.has(attr.name)&&target.getAttribute(attr.name)!==attr.value)target.setAttribute(attr.name,attr.value);
      for(const saved of animations){
        const duration=saved.animation.effect?.getTiming().duration;
        if(typeof saved.time==='number'&&typeof duration==='number'&&typeof saved.duration==='number'&&saved.duration>0&&duration!==saved.duration)saved.animation.currentTime=saved.time/saved.duration*duration;
      }
      const children=[...source.childNodes];
      children.forEach((child,i)=>{if(target.childNodes[i])sync(target.childNodes[i],child);else target.append(child);});
      while(target.childNodes.length>children.length)target.lastChild.remove();
    }
    sync(current,next);current._refreshCloudPaths?.();current._refreshPowerPaths?.();return current;
  }
  function editor(raw,uk,onchange,{getStates=()=>null,legacyBackground=null,template=null}={}){
    if(template==='energy_station')return Station.editor(raw?.station,uk,(station,redraw)=>onchange({...normalize(raw),station},redraw),{getStates});
    const c=normalize(raw),n=(tag,txt)=>{const e=document.createElement(tag);if(txt)e.textContent=txt;return e;},tr=(en,ua)=>uk?ua:en;
    const box=n('details'),summary=n('summary',tr('Configure Power Flow','Налаштувати Power Flow')),form=n('div');form.className='apf-settings';box.className='apf-config';box.append(summary,form);const commit=(redraw=true)=>{const host=box.getRootNode();onchange(c,redraw);host.querySelectorAll('.apf-config').forEach(e=>e.open=true);};box.addEventListener('click',e=>e.stopPropagation());
    function suggest(input,kind){
      const menu=n('div');menu.className='apf-entity-menu';menu.setAttribute('role','group');menu.setAttribute('aria-label',tr('Matching entities','Знайдені сутності'));menu.hidden=true;input.after(menu);input.autocomplete='off';
      const search=()=>{const live=getStates(),states=live||importedStates;menu.replaceChildren();menu.hidden=false;
        const query=input.value.trim().toLowerCase();let results=Object.entries(states).filter(([id,v])=>v&&typeof v==='object'&&id.startsWith('sensor.')||v&&typeof v==='object'&&id.startsWith('binary_sensor.'));
        results=results.filter(([id,v])=>{const unit=v.attributes?.unit_of_measurement||'';if(kind==='power'&&!['W','kW','MW'].includes(unit)&&v.attributes?.device_class!=='power')return false;if(kind==='soc'&&unit!=='%')return false;if(kind==='voltage'&&!['V','mV'].includes(unit))return false;if(kind==='temperature'&&!['°C','°F','K'].includes(unit))return false;return (id+' '+(v.attributes?.friendly_name||'')).toLowerCase().includes(query);}).slice(0,30);
        menu.append(n('small',live?tr('Live Home Assistant values','Живі значення Home Assistant'):tr('Imported snapshot · not live','Імпортований знімок · не живі дані')));
        if(!results.length)menu.append(n('small',Object.keys(states).length?tr('No matching entities. You can enter an ID manually.','Збігів немає. Можна ввести сутність вручну.'):tr('Open in HA or import entity JSON below.','Відкрийте в HA або імпортуйте JSON сутностей нижче.')));
        for(const [id,v] of results){const button=n('button',id+' · '+(v.attributes?.friendly_name||'')+' · '+v.state+' '+(v.attributes?.unit_of_measurement||''));button.type='button';button.onmousedown=e=>e.preventDefault();button.onclick=()=>{input.value=id;menu.hidden=true;input.dispatchEvent(new Event('change',{bubbles:true}));};menu.append(button);}
      };input.addEventListener('focus',search);input.addEventListener('input',search);input.addEventListener('keydown',e=>{if(e.key==='Escape')menu.hidden=true;if(e.key==='ArrowDown'){e.preventDefault();menu.querySelector('button')?.focus();}});input.addEventListener('blur',()=>setTimeout(()=>{if(!menu.contains(menu.getRootNode().activeElement))menu.hidden=true;},150));
    }
    const importLabel=n('label',tr('Entity list JSON (snapshot for website search)','JSON списку сутностей (знімок для пошуку на сайті)')),uploadStates=n('input');uploadStates.type='file';uploadStates.accept='.json,application/json';uploadStates.onchange=async()=>{try{const file=uploadStates.files[0];if(!file)return;if(file.size>2000000)throw Error();const data=JSON.parse(await file.text());const entries=Array.isArray(data)?data.map(v=>[v.entity_id,v]):Object.entries(data.states||data);importedStates=Object.fromEntries(entries.filter(([id,v])=>typeof id==='string'&&/^(sensor|binary_sensor)\.[\w]+$/.test(id)&&v&&typeof v==='object').slice(0,10000));uploadStates.setCustomValidity('');}catch(_){uploadStates.setCustomValidity(tr('Choose a valid entity JSON under 2 MB','Оберіть JSON сутностей до 2 МБ'));uploadStates.reportValidity();}};importLabel.append(uploadStates);form.append(importLabel);
    function field(parent,title,obj,key,options){const label=n('label',title),input=n(options?'select':'input');input.setAttribute('aria-label',title);if(options)options.forEach(([v,t])=>{const o=n('option',t);o.value=v;input.append(o);});input.value=obj[key]||'';input.onchange=()=>{obj[key]=input.value;commit();};if(!options)input.oninput=()=>{obj[key]=input.value;commit(false);};label.append(input);parent.append(label);if(!options&&['soc','voltage','temperature','gridStatus','inverterStatus','chargeSourceEntity'].includes(key))suggest(input,key);}
    function capacity(parent,title,obj,key='capacityKw'){
      const label=n('label',title),input=n('input');label.className='apf-capacity';label.append(n('strong',tr('100% BORDER','100% РАМКИ')));input.type='number';input.min='0.001';input.max='1000000';input.step='any';input.placeholder=tr('Not set','Не задано');input.value=obj[key]??'';input.setAttribute('aria-label',title);
      input.oninput=()=>{if(input.checkValidity()){obj[key]=rating(input.value);commit(false);}};input.onchange=()=>{if(!input.checkValidity()){input.reportValidity();return;}obj[key]=rating(input.value);commit();};label.append(input,n('small',tr('Maximum 9 kW + current 4500 W = 50% border. This is not current power.','Максимум 9 кВт + поточні 4500 Вт = 50% рамки. Це не поточна потужність.')));parent.append(label);
    }
    function powerInput(parent,title,obj,key='power'){
      const group=n('fieldset');group.append(n('legend',title));
      const label=n('label',tr('Value source','Джерело значення')),select=n('select');select.setAttribute('aria-label',title+' · '+tr('source','джерело'));
      for(const [value,caption] of [['sensor',tr('Home Assistant sensor','Сенсор Home Assistant')],['manual',tr('Manual power (W)','Вручну: потужність (Вт)')]]){const option=n('option',caption);option.value=value;select.append(option);}
      select.value=isManual(obj[key])?'manual':'sensor';label.append(select);group.append(label);
      const valueLabel=n('label');group.append(valueLabel);parent.append(group);
      function renderValue(){
        const manual=select.value==='manual';
        valueLabel.replaceChildren(document.createTextNode(manual?tr('Current power (W), e.g. 9000 = 9 kW','Поточна потужність (Вт): 9000 = 9 кВт'):tr('Entity ID, e.g. sensor.pv_power','Сутність, наприклад sensor.pv_power')));
        const input=n('input');input.type=manual?'number':'text';if(manual)input.step='any';
        input.value=obj[key]||'';input.placeholder=manual?'9000':'sensor.pv_power';input.setAttribute('aria-label',title+' · '+tr('value','значення'));
        const status=n('small');status.setAttribute('aria-live','polite');
        const showStatus=()=>{const id=input.value.trim(),state=getStates()?.[id];status.textContent=manual?tr('Fixed value in watts','Фіксоване значення у ватах'):!id?tr('Enter an entity ID or choose a suggestion','Введіть ID сутності або оберіть підказку'):state?`${id} · ${state.state} ${state.attributes?.unit_of_measurement||''}`:tr('Entity not found in Home Assistant','Сутність не знайдена в Home Assistant');};
        const update=()=>{if(!input.checkValidity())return;obj[key]=input.value.trim();showStatus();commit(false);};
        input.oninput=update;input.onchange=update;input.addEventListener('focus',showStatus);input._refreshEntityStatus=showStatus;valueLabel.append(input);if(!manual)suggest(input,'power');valueLabel.append(status);showStatus();
      }
      select.onchange=()=>{obj[key]=select.value==='manual'?'0':'';renderValue();commit(false);};renderValue();
    }
    const photoGroup=n('fieldset');photoGroup.append(n('legend',tr('Card background','Фон картки')));form.append(photoGroup);
    const scene=background(c.background||legacyBackground),saveBackground=()=>{c.background={...scene};commit(false);};
    const photoUrlLabel=n('label',tr('Background image URL','URL фонового фото')),photoUrl=n('input');photoUrl.type='text';photoUrl.value=scene.image;photoUrl.placeholder='/local/background.jpg';photoUrl.setAttribute('aria-label',tr('Background image URL','URL фонового фото'));photoUrl.onchange=()=>{scene.image=image(photoUrl.value);saveBackground();};photoUrlLabel.append(photoUrl);photoGroup.append(photoUrlLabel);
    const uploadBackground=n('input');uploadBackground.type='file';uploadBackground.accept='image/png,image/jpeg,image/webp';uploadBackground.setAttribute('aria-label',tr('Upload card background','Завантажити фон картки'));
    uploadBackground.onchange=async()=>{const file=uploadBackground.files[0];if(!file)return;try{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10000000)throw Error();const prepared=root.AnmaDashboard?.prepareBackground?await root.AnmaDashboard.prepareBackground(file):await new Promise((resolve,reject)=>{if(file.size>500000)return reject(Error());const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});scene.image=image(prepared);photoUrl.value=scene.image;saveBackground();uploadBackground.setCustomValidity('');}catch(_){uploadBackground.setCustomValidity(tr('Choose a PNG/JPEG/WebP image up to 10 MB','Оберіть PNG/JPEG/WebP до 10 МБ'));uploadBackground.reportValidity();}};photoGroup.append(uploadBackground);
    for(const [key,title,options] of [['fit',tr('Photo fit','Заповнення фото'),[['cover',tr('Fill and crop','Заповнити з обрізанням')],['contain',tr('Show entire photo','Показати фото повністю')]]],['position',tr('Photo position','Позиція фото'),[['center',tr('Center','Центр')],['top',tr('Top','Вгорі')],['bottom',tr('Bottom','Внизу')],['left',tr('Left','Ліворуч')],['right',tr('Right','Праворуч')],['left top',tr('Top left','Вгорі ліворуч')],['right top',tr('Top right','Вгорі праворуч')],['left bottom',tr('Bottom left','Внизу ліворуч')],['right bottom',tr('Bottom right','Внизу праворуч')]]]]){const label=n('label',title),select=n('select');select.setAttribute('aria-label',title);for(const [value,caption] of options){const option=n('option',caption);option.value=value;select.append(option);}select.value=scene[key];select.onchange=()=>{scene[key]=select.value;saveBackground();};label.append(select);photoGroup.append(label);}
    const visibilityLabel=n('label',tr('Background visibility (%)','Видимість фону (%)')),visibility=n('input'),visibilityValue=n('output');visibility.type='range';visibility.min=0;visibility.max=100;visibility.value=scene.opacity;visibility.setAttribute('aria-label',tr('Background visibility (%)','Видимість фону (%)'));visibilityValue.textContent=scene.opacity+'%';visibility.oninput=()=>{scene.opacity=Number(visibility.value);visibilityValue.textContent=scene.opacity+'%';saveBackground();};visibilityLabel.append(visibility,visibilityValue);photoGroup.append(visibilityLabel,n('small',tr('0% = transparent, 100% = opaque. Photo proportions are preserved.','0% = прозоре, 100% = непрозоре. Пропорції фото зберігаються.')));
    const clearBackground=n('button',tr('Remove card background','Прибрати фон картки'));clearBackground.type='button';clearBackground.onclick=()=>{scene.image='';photoUrl.value='';saveBackground();};photoGroup.append(clearBackground);
    capacity(form,tr('Grid maximum power for border (kW)','Максимальна потужність мережі для рамки (кВт)'),c,'gridCapacityKw');
    function check(title,key){const label=n('label',title),input=n('input');input.type='checkbox';input.checked=c[key];input.onchange=()=>{c[key]=input.checked;commit();};label.append(input);form.append(label);}
    field(form,tr('Theme','Тема'),c,'mode',[['auto','Auto'],['day',tr('Day','День')],['night',tr('Night','Ніч')]]);field(form,tr('Display','Екран'),c,'profile',[['auto','Auto'],['desktop','Desktop'],['tablet','Tablet'],['mobile','Phone']]);check(tr('Fit screen','Вписувати в екран'),'fit');check(tr('Hide secondary details on phone','Приховувати дрібні показники на телефоні'),'hideDetails');check(tr('Show EV load','Показувати зарядку авто'),'showEv');check(tr('Reverse grid sign (default: positive import)','Інвертувати знак мережі (типово: плюс = імпорт)'),'invertGrid');check(tr('Reverse battery sign (default: positive discharge)','Інвертувати знак батарей (типово: плюс = розряд)'),'invertBattery');
    [['gridStatus','Grid status entity','Сенсор стану мережі'],['gridOn','Grid connected values (comma separated)','Значення: мережа є (через кому)'],['gridOff','Grid lost values','Значення: мережі немає'],['inverterStatus','Inverter status entity','Сенсор стану інвертора'],['inverterOn','Inverter running values','Значення: інвертор працює'],['inverterOff','Inverter off values','Значення: інвертор вимкнений'],['inverterFault','Inverter fault values','Значення: помилка інвертора'],['backupName','Guaranteed group name','Назва гарантованої групи'],['nonBackupName','Non-guaranteed group name','Назва негарантованої групи']].forEach(([key,en,ua])=>field(form,tr(en,ua),c,key));
    ['grid','load','ev','nonBackup'].forEach(k=>powerInput(form,tr(k+' power',({grid:'Мережа',load:'Гарантоване',ev:'Авто',nonBackup:'Негарантоване'})[k]+' · потужність'),c,k));
    function photoOpacity(parent,obj){
      const label=n('label',tr('Photo visibility (%) · 0 = transparent, 100 = opaque','Видимість фото (%) · 0 = прозоре, 100 = непрозоре')),input=n('input'),value=n('output');
      input.type='range';input.min='0';input.max='100';input.step='1';input.value=String(obj.imageOpacity??25);input.setAttribute('aria-label',tr('Photo visibility (%)','Видимість фото (%)'));value.textContent=input.value+'%';
      input.oninput=()=>{obj.imageOpacity=Number(input.value);value.textContent=input.value+'%';commit(false);};input.onchange=input.oninput;
      label.append(input,value);parent.append(label,n('small',tr('The photo fills the block without stretching. Excess edges are cropped; the icon stays visible.','Фото заповнює блок без деформації. Зайві краї обрізаються; піктограмка залишається.')));
    }
    function nodeStyle(group,obj){
field(group,tr('Image URL (/local/… in HA)','URL зображення (/local/… у HA)'),obj,'image');const upload=n('input');upload.type='file';upload.accept='image/png,image/jpeg,image/webp';upload.setAttribute('aria-label',tr('Upload image','Завантажити зображення'));upload.onchange=async()=>{const f=upload.files[0];if(!f)return;if(f.size>500000||!['image/png','image/jpeg','image/webp'].includes(f.type)){upload.setCustomValidity(tr('PNG/JPEG/WebP, maximum 500 KB','PNG/JPEG/WebP, максимум 500 КБ'));upload.reportValidity();return;}const r=new FileReader();r.onload=()=>{obj.image=r.result;commit();};r.readAsDataURL(f);};group.append(upload);photoOpacity(group,obj);
      const label=n('label',tr('Panel opacity (%)','Непрозорість фону (%)')),range=n('input'),out=n('output');
      range.type='range';range.min=0;range.max=100;range.value=opacity(obj.backgroundOpacity);range.setAttribute('aria-label',tr('Panel opacity (%)','Непрозорість фону (%)'));out.textContent=range.value+'%';
      range.oninput=()=>{obj.backgroundOpacity=Number(range.value);out.textContent=range.value+'%';commit(false);};label.append(range,out);group.append(label);
      const remove=n('button',tr('Remove node photo','Прибрати фото вузла'));remove.type='button';remove.onclick=()=>{obj.image='';commit();};group.append(remove,n('small',tr('Panel default: 40%. Set panel and photo opacity to 0% for no background; values and icons stay visible.','Фон типово: 40%. Встановіть фон і фото на 0%, щоб прибрати тло; значення й піктограми залишаться видимими.')));
    }
    for(const [key,en,ua] of [['grid','Grid','Мережа'],['load','Guaranteed load','Гарантоване'],['nonBackup','Non-guaranteed load','Негарантоване'],['ev','EV','Авто'],['solar','Cloud Flow: solar total','Cloud Flow: сонце разом'],['battery','Cloud Flow: battery total','Cloud Flow: АКБ разом']]){
      const group=n('fieldset');group.append(n('legend',tr(en,ua)));nodeStyle(group,c.nodeAppearance[key]);form.append(group);
    }
    function device(obj,title,battery){const group=n('fieldset');group.append(n('legend',title));capacity(group,tr('Maximum power for border (kW)','Максимальна потужність для рамки (кВт)'),obj);field(group,tr('Name','Назва'),obj,'name');nodeStyle(group,obj);powerInput(group,tr('Power','Потужність'),obj);if(battery){field(group,tr('Charging source','Джерело заряду'),obj,'chargeSource',[['sensor',tr('From source sensor','За сенсором джерела')],['solar',tr('Solar (fixed)','Сонце (задано вручну)')],['grid',tr('Grid (fixed)','Мережа (задано вручну)')],['mixed',tr('Mixed (fixed)','Змішане (задано вручну)')]]);if(obj.chargeSource==='sensor'){field(group,tr('Source entity: solar / grid / mixed','Сенсор джерела: solar / grid / mixed'),obj,'chargeSourceEntity');group.append(n('small',tr('Unknown source stays grey; sunlight alone does not prove solar charging.','Невідоме джерело — сіре. Наявність сонця сама по собі не визначає джерело заряду.')));}}if(battery)['soc','voltage','temperature'].forEach(k=>field(group,k+' entity',obj,k));form.append(group);return group;}
    device(c.inverter,tr('Inverter','Інвертор'));c.batteries.forEach((b,i)=>{const group=device(b,tr('Battery ','Акумулятор ')+(i+1),true);const del=n('button',tr('Remove','Видалити'));del.type='button';del.onclick=()=>{c.batteries.splice(i,1);commit();};group.append(del);});
    c.strings.forEach((s,i)=>{const group=n('fieldset');group.append(n('legend','PV '+(i+1)));nodeStyle(group,s);capacity(group,tr('PV maximum power for border (kW)','Максимальна потужність PV для рамки (кВт)'),s);field(group,tr('String / group name','Назва стрінга / групи'),s,'name');powerInput(group,tr('PV power (without MPPT grouping)','Потужність PV (без групування MPPT)'),s);s.mppts.forEach((m,j)=>{field(group,'MPPT '+(j+1)+' '+tr('name','назва'),m,'name');powerInput(group,'MPPT '+(j+1),m);});const add=n('button',s.mppts.length?tr('Use single sensor','Один сенсор'):tr('Group two MPPT channels','Групувати два канали MPPT'));add.type='button';add.onclick=()=>{s.mppts=s.mppts.length?[]:[{name:'MPPT 1',power:''},{name:'MPPT 2',power:''}];commit();};const del=n('button',tr('Remove string','Видалити стрінг'));del.type='button';del.onclick=()=>{c.strings.splice(i,1);commit();};group.append(add,del);form.append(group);});
    [['batteries',5,tr('+ Battery','+ Акумулятор')],['strings',10,tr('+ PV string','+ PV стрінг')]].forEach(([key,max,title])=>{const b=n('button',title+' · '+c[key].length+'/'+max);b.type='button';b.disabled=c[key].length>=max;b.onclick=()=>{c[key].push({});commit();};form.append(b);});box.append(n('p',tr('Manual values are fixed watts, not live telemetry. Nominal power is kW. MPPT grouping sums two measurement channels for display. It does not change wiring. Unavailable sensors show —.','Ручні значення — фіксована потужність у Вт, не живі дані. Номінал — у кВт. Групування MPPT підсумовує два канали вимірювання лише для відображення. Електрична схема не змінюється. Недоступні сенсори показують —.')));return box;
  }
  const api={normalize,render,update,editor,utilization,flowDuration};root.AnmaPowerFlow=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

/* Pure layout model. Catalog ratings are never treated as live measurements. */
(function (root) {
  'use strict';

  const roles = {
    inverters: 'inverter',
    pv_modules: 'solar',
    batteries: 'battery',
    smart_meters: 'grid',
    current_transformers: 'grid',
    ev_chargers: 'ev',
    microinverters: 'solar',
    external_mppt_controllers: 'solar',
    system_grid: 'grid',
    system_generator: 'generator',
    system_load: 'load',
    system_transfer_switch: 'transfer'
  };

  const PowerFlow = root.AnmaPowerFlow || (typeof require === 'function' ? require('./power-flow.js') : null);
  const widgets = [
    'power_flow',
    'flow', 'solar', 'battery', 'load', 'grid', 'generator', 'ev',
    'equipment_status', 'pv_fields', 'weather', 'chart', 'inverter_health',
    'server_health', 'battery_stack', 'solar_forecast', 'microinverter'
  ];
  const metrics = ['solar', 'battery', 'load', 'grid', 'generator', 'ev'];

  const templates = {
    power_flow: ['power_flow'],
    cloud_flow: ['power_flow'],
    energy_station: ['power_flow'],
    overview: ['flow', 'solar', 'battery', 'load', 'grid', 'weather', 'chart'],
    compact: ['solar', 'battery', 'load', 'grid'],
    full: ['flow', 'solar', 'battery', 'load', 'grid', 'weather', 'solar_forecast', 'chart']
  };

  const shapes = ['rounded', 'pill', 'square', 'flat'];
  const sizes = ['1x1', '2x1', '2x2', 'full'];
  const themes = ['anma_dark', 'oled', 'cyberpunk', 'nordic', 'light_emerald', 'light_rose', 'light_clean'];
  const fonts = [
    'system', 'inter', 'roboto', 'open_sans', 'montserrat', 'poppins',
    'ubuntu', 'nunito', 'oswald', 'raleway', 'fira_sans', 'plus_jakarta_sans',
    'lexend', 'exo_2', 'orbitron', 'rajdhani', 'jetbrains_mono', 'fira_code',
    'space_grotesk', 'playfair'
  ];
  const viewModes = ['desktop', 'tablet', 'mobile'];
  const devicePresets = [
    'responsive', 'iphone_17', 'iphone_15', 'iphone_13', 'iphone_10', 'iphone_se',
    'galaxy_s24', 'galaxy_s20', 'pixel_8',
    'wall_10', 'ipad_air', 'ipad_mini', 'ipad_pro', 'galaxy_tab',
    'hd_720', 'fhd_1080', 'laptop_1366', 'laptop_1440'
  ];
  const flowStyles = ['traffic', 'particles', 'arrows', 'solid'];

  const defaultFlowColors = {
    solar: '#f59e0b',
    battery: '#37c98b',
    grid: '#a855f7',
    load: '#38bdf8',
    ev: '#10b981',
    generator: '#f97316',
    inverter: '#f1873d'
  };

  const providerDefaults = {
    home_assistant: {
      solar_power: 'sensor.solar_power',
      solar_daily_energy: 'sensor.solar_energy_daily',
      battery_soc: 'sensor.battery_state_of_charge',
      battery_power: 'sensor.battery_power',
      battery_voltage: 'sensor.battery_voltage',
      battery_current: 'sensor.battery_current',
      battery_temp: 'sensor.battery_temperature',
      grid_power: 'sensor.grid_active_power',
      grid_voltage: 'sensor.grid_voltage',
      grid_frequency: 'sensor.grid_frequency',
      grid_daily_import: 'sensor.grid_import_daily',
      grid_daily_export: 'sensor.grid_export_daily',
      load_power: 'sensor.home_consumption_power',
      load_daily_energy: 'sensor.home_consumption_daily',
      inverter_power: 'sensor.inverter_active_power',
      inverter_temp: 'sensor.inverter_temperature',
      inverter_mode: 'sensor.inverter_status',
      weather_condition: 'weather.forecast_home',
      rain_rate: 'sensor.weather_rain_rate',
      sun_elevation: 'sensor.sun_solar_elevation',
      daylight_hours: 'sensor.daylight',
      server_cpu: 'sensor.processor_use',
      server_ram: 'sensor.memory_use_percent',
      server_disk: 'sensor.disk_use_percent',
      ev_power: 'sensor.ev_charger_power',
      generator_power: 'sensor.generator_power',
      pv1_power: 'sensor.pv_string_1_power',
      pv1_voltage: 'sensor.pv_string_1_voltage',
      pv1_current: 'sensor.pv_string_1_current',
      pv2_power: 'sensor.pv_string_2_power',
      pv2_voltage: 'sensor.pv_string_2_voltage',
      pv2_current: 'sensor.pv_string_2_current'
    },
    solar_assistant: {
      solar_power: 'sensor.solar_assistant_solar_power',
      solar_daily_energy: 'sensor.solar_assistant_solar_energy_today',
      battery_soc: 'sensor.solar_assistant_battery_state_of_charge',
      battery_power: 'sensor.solar_assistant_battery_power',
      battery_voltage: 'sensor.solar_assistant_battery_voltage',
      battery_current: 'sensor.solar_assistant_battery_current',
      battery_temp: 'sensor.solar_assistant_battery_temperature',
      grid_power: 'sensor.solar_assistant_grid_power',
      grid_voltage: 'sensor.solar_assistant_grid_voltage',
      grid_frequency: 'sensor.solar_assistant_grid_frequency',
      grid_daily_import: 'sensor.solar_assistant_grid_energy_in_today',
      grid_daily_export: 'sensor.solar_assistant_grid_energy_out_today',
      load_power: 'sensor.solar_assistant_load_power',
      load_daily_energy: 'sensor.solar_assistant_load_energy_today',
      inverter_power: 'sensor.solar_assistant_inverter_power',
      inverter_temp: 'sensor.solar_assistant_inverter_temperature',
      inverter_mode: 'sensor.solar_assistant_inverter_mode',
      weather_condition: 'weather.home',
      rain_rate: 'sensor.rain_rate',
      server_cpu: 'sensor.solar_assistant_cpu_temperature',
      server_ram: 'sensor.solar_assistant_memory_usage',
      server_disk: 'sensor.solar_assistant_disk_usage',
      ev_power: 'sensor.ev_power',
      generator_power: 'sensor.generator_power',
      pv1_power: 'sensor.solar_assistant_pv1_power',
      pv1_voltage: 'sensor.solar_assistant_pv1_voltage',
      pv1_current: 'sensor.solar_assistant_pv1_current',
      pv2_power: 'sensor.solar_assistant_pv2_power',
      pv2_voltage: 'sensor.solar_assistant_pv2_voltage',
      pv2_current: 'sensor.solar_assistant_pv2_current'
    },
    mqtt: {
      solar_power: 'solar_assistant/total/solar_power/state',
      solar_daily_energy: 'solar_assistant/total/solar_energy_today/state',
      battery_soc: 'solar_assistant/total/battery_state_of_charge/state',
      battery_power: 'solar_assistant/total/battery_power/state',
      battery_voltage: 'solar_assistant/total/battery_voltage/state',
      battery_current: 'solar_assistant/total/battery_current/state',
      battery_temp: 'solar_assistant/total/battery_temperature/state',
      grid_power: 'solar_assistant/total/grid_power/state',
      grid_voltage: 'solar_assistant/total/grid_voltage/state',
      grid_frequency: 'solar_assistant/total/grid_frequency/state',
      grid_daily_import: 'solar_assistant/total/grid_energy_in_today/state',
      grid_daily_export: 'solar_assistant/total/grid_energy_out_today/state',
      load_power: 'solar_assistant/total/load_power/state',
      load_daily_energy: 'solar_assistant/total/load_energy_today/state',
      inverter_power: 'solar_assistant/inverter_1/inverter_power/state',
      inverter_temp: 'solar_assistant/inverter_1/temperature/state',
      inverter_mode: 'solar_assistant/inverter_1/device_mode/state',
      weather_condition: 'anma/weather/condition',
      rain_rate: 'anma/weather/rain_rate',
      server_cpu: 'anma/server/cpu_usage',
      server_ram: 'anma/server/ram_usage',
      server_disk: 'anma/server/disk_usage',
      ev_power: 'anma/ev/power',
      generator_power: 'anma/generator/power',
      pv1_power: 'solar_assistant/inverter_1/pv1_power/state',
      pv1_voltage: 'solar_assistant/inverter_1/pv1_voltage/state',
      pv1_current: 'solar_assistant/inverter_1/pv1_current/state',
      pv2_power: 'solar_assistant/inverter_1/pv2_power/state',
      pv2_voltage: 'solar_assistant/inverter_1/pv2_voltage/state',
      pv2_current: 'solar_assistant/inverter_1/pv2_current/state'
    },
    other: {
      solar_power: 'api/telemetry/solar_power',
      solar_daily_energy: 'api/telemetry/solar_daily',
      battery_soc: 'api/telemetry/battery_soc',
      battery_power: 'api/telemetry/battery_power',
      battery_voltage: 'api/telemetry/battery_voltage',
      battery_current: 'api/telemetry/battery_current',
      battery_temp: 'api/telemetry/battery_temp',
      grid_power: 'api/telemetry/grid_power',
      grid_voltage: 'api/telemetry/grid_voltage',
      grid_frequency: 'api/telemetry/grid_frequency',
      grid_daily_import: 'api/telemetry/grid_import_daily',
      grid_daily_export: 'api/telemetry/grid_export_daily',
      load_power: 'api/telemetry/load_power',
      load_daily_energy: 'api/telemetry/load_daily',
      inverter_power: 'api/telemetry/inverter_power',
      inverter_temp: 'api/telemetry/inverter_temp',
      inverter_mode: 'api/telemetry/inverter_mode',
      weather_condition: 'api/telemetry/weather',
      rain_rate: 'api/telemetry/rain_rate',
      server_cpu: 'api/telemetry/server_cpu',
      server_ram: 'api/telemetry/server_ram',
      server_disk: 'api/telemetry/server_disk',
      ev_power: 'api/telemetry/ev_power',
      generator_power: 'api/telemetry/generator_power',
      pv1_power: 'api/telemetry/pv1_power',
      pv1_voltage: 'api/telemetry/pv1_voltage',
      pv1_current: 'api/telemetry/pv1_current',
      pv2_power: 'api/telemetry/pv2_power',
      pv2_voltage: 'api/telemetry/pv2_voltage',
      pv2_current: 'api/telemetry/pv2_current'
    }
  };

  const defaultFlowNodes = {
    solar: { x: 50, y: 14, label: 'Solar' },
    inverter: { x: 50, y: 50, label: 'Inverter' },
    battery: { x: 84, y: 50, label: 'Battery' },
    grid: { x: 16, y: 50, label: 'Grid' },
    load: { x: 50, y: 86, label: 'Home' },
    generator: { x: 16, y: 16, label: 'Generator' },
    ev: { x: 84, y: 86, label: 'EV Charger' }
  };

  const defaultFlowConnections = [
    { id: 'c-solar', from: 'solar', to: 'inverter', style: 'curved', line: 'traffic', direction: 'forward', color: '#f59e0b' },
    { id: 'c-battery', from: 'battery', to: 'inverter', style: 'curved', line: 'traffic', direction: 'auto', color: '#37c98b' },
    { id: 'c-grid', from: 'grid', to: 'inverter', style: 'curved', line: 'traffic', direction: 'auto', color: '#a855f7' },
    { id: 'c-load', from: 'inverter', to: 'load', style: 'curved', line: 'traffic', direction: 'forward', color: '#38bdf8' },
    { id: 'c-ev', from: 'inverter', to: 'ev', style: 'curved', line: 'traffic', direction: 'forward', color: '#10b981' },
    { id: 'c-gen', from: 'generator', to: 'inverter', style: 'curved', line: 'traffic', direction: 'forward', color: '#f97316' }
  ];

  const defaultBatteryStack = [
    { id: 'bat-1', name: 'Deye Pro 5.12kWh #1 (Master)', soc: 88, voltage: '53.2', current: '1.06', temp: 24, status: 'Master · OK' },

  ];

  const defaultInverterStack = [
    { id: 'inv-1', name: 'Гібридний інвертор Deye', type: 'hybrid', phase: 'Фаза A (Master)', power: 3200, status: 'В СИСТЕМІ', ip: '192.168.10.85' }
  ];

  const isReceiver = device => device && ['inverters', 'microinverters', 'external_mppt_controllers'].includes(device.category);
  const clean = value => String(value ?? '').slice(0, 100);
  const quantity = value => Math.min(10000, Math.max(1, Math.floor(Number(value) || 1)));

  function defaultMpptChannels(ratedPower = 1600, mpptCount = 4, maxPerMppt = null) {
    const count = Math.min(8, Math.max(1, Number(mpptCount) || 4));
    const perChannel = Math.max(100, Math.min(2000, Number(maxPerMppt) || Math.round((Number(ratedPower) || 1600) / count) || 500));
    const channels = [];
    for (let i = 1; i <= count; i++) {
      channels.push({
        id: `mppt-${i}`,
        name: `MPPT ${i}`,
        maxPower: perChannel,
        panelPower: Math.min(perChannel, 400),
        panelModel: '400W Mono PV',
        sensor: `sensor.microinverter_pv${i}_power`
      });
    }
    return channels;
  }

  function calculateMicroinverterPower(device, demo = true) {
    if (!device) return { totalPower: 0, ratedPower: 1600, channels: [] };
    const rated = Math.max(100, Number(device.ratedPower) || 1600);
    const channels = (Array.isArray(device.mpptChannels) && device.mpptChannels.length)
      ? device.mpptChannels
      : defaultMpptChannels(rated, device.mpptCount || 4);

    let totalEffective = 0;
    const evaluatedChannels = channels.map((ch, idx) => {
      const maxPower = Math.max(50, Math.min(2000, Number(ch.maxPower) || 500));
      const panelPower = Math.max(0, Math.min(2000, Number(ch.panelPower) || 0));
      // Strict rule: output cannot exceed panel rating (e.g. 300W panel never produces 500W)
      // and cannot exceed MPPT channel limit (e.g. 550W panel capped at 500W limit).
      const effectivePower = Math.min(panelPower, maxPower);
      const isClipped = panelPower > maxPower;
      const isPanelLimited = panelPower < maxPower;
      totalEffective += effectivePower;

      return {
        id: ch.id || `mppt-${idx + 1}`,
        name: ch.name || `MPPT ${idx + 1}`,
        maxPower,
        panelPower,
        panelModel: ch.panelModel || '',
        sensor: ch.sensor || '',
        effectivePower,
        isClipped,
        isPanelLimited,
        utilizationPct: maxPower > 0 ? Math.min(100, Math.round((effectivePower / maxPower) * 100)) : 0
      };
    });

    const totalCapped = Math.min(rated, totalEffective);
    return {
      totalPower: totalCapped,
      rawSum: totalEffective,
      ratedPower: rated,
      isTotalCapped: totalEffective > rated,
      channels: evaluatedChannels
    };
  }

  function empty() {
    return {
      version: 1,
      id: 'db-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      name: 'PIVDENNE ENERGY · DA6K',
      brandTitle: 'ANMA ELECTRIC',
      origin: 'standalone', // 'standalone' or 'builder'
      template: 'overview',
      powerFlow: PowerFlow.normalize(),
      accent: '#f1873d',
      font: 'system',
      logo: '',
      language: 'auto',
      background: {image: '', opacity: 15},
      glow: true,
      motion: true,
      flowStyle: 'traffic', // 'traffic', 'particles', 'arrows', 'solid'
      flowColors: { ...defaultFlowColors },
      gridColumns: 2, // 1, 2, 3, 4, 5
      ratedPower: 6000, // Inverter rated power in W (e.g. 6000W)
      flowSpeedMultiplier: 100, // 50, 75, 100, 150, 200 (%)
      flowInverted: {
        grid: false,
        battery: false,
        solar: false,
        load: false
      },
      canBridgeEnabled: false,
      haFullscreen: true, // Kiosk / Panel mode in Home Assistant
      photoOpacity: 20, // 5..60 (%) watermark opacity behind text
      groupMetrics: true, // Group compact metric cards into a unified block
      widgets: ['flow', 'solar', 'battery', 'load', 'grid'],
      devices: [],
      connections: [],
      pvFields: [],
      batteryStack: [...defaultBatteryStack],
      inverterStack: [...defaultInverterStack],
      deviceImages: {}, // deviceId -> image URL / base64
      provider: 'home_assistant',
      bindings: { ...providerDefaults.home_assistant },
      theme: {
        mode: 'anma_dark',
        shape: 'rounded',
        accent: '#f1873d'
      },
      viewMode: 'desktop',
      devicePreset: 'responsive',
      deviceOrientation: 'portrait',
      widgetConfigs: {
        power_flow: { size: 'full', shape: 'rounded', title: 'ANMA Power Flow' },
        flow: { size: 'full', shape: 'rounded', accent: '#f1873d', title: '' },
        solar: { size: '1x1', shape: 'rounded', accent: '#f59e0b', title: '' },
        battery: { size: '1x1', shape: 'rounded', accent: '#37c98b', title: '' },
        load: { size: '1x1', shape: 'rounded', accent: '#38bdf8', title: '' },
        grid: { size: '1x1', shape: 'rounded', accent: '#a855f7', title: '' },
        weather: { size: '2x1', shape: 'rounded', accent: '#38bdf8', title: '', forecastDays: 7 },
        solar_forecast: { size: '2x1', shape: 'rounded', accent: '#f59e0b', title: '', forecastDays: 7 },
        chart: { size: '2x1', shape: 'rounded', accent: '#f1873d', title: '', range: '24h' },
        inverter_health: { size: '1x1', shape: 'rounded', accent: '#f1873d', title: '' },
        server_health: { size: '2x1', shape: 'rounded', accent: '#38bdf8', title: '' },
        battery_stack: { size: 'full', shape: 'rounded', accent: '#37c98b', title: '' },
        equipment_status: { size: 'full', shape: 'rounded', accent: '#f1873d', title: '' },
        pv_fields: { size: 'full', shape: 'rounded', accent: '#f59e0b', title: '' },
        microinverter: { size: 'full', shape: 'rounded', accent: '#f59e0b', title: '' },
        ev: { size: '1x1', shape: 'rounded', accent: '#10b981', title: '' },
        generator: { size: '1x1', shape: 'rounded', accent: '#f97316', title: '' }
      },
      flowNodes: { ...defaultFlowNodes },
      flowConnections: [...defaultFlowConnections]
    };
  }

  function fromBuilder(snapshot) {
    if (!snapshot || !Array.isArray(snapshot.nodes) || snapshot.nodes.length > 500) throw new Error('invalid');
    const layout = empty();
    layout.origin = 'builder';
    layout.name = clean(snapshot.projectName) || 'My Home Energy System';

    layout.devices = snapshot.nodes.map((node, index) => {
      const p = node.detail || node.product || {};
      const category = p.category || node.product?.category || '';
      const deviceId = clean(node.uid) || 'device-' + index;
      if (p.image || p.image_url) {
        layout.deviceImages[deviceId] = p.image || p.image_url;
      }
      const isMicro = category === 'microinverters' || p.topology === 'micro';
      const mpptCount = Math.min(8, Math.max(1, Number(p.mppt_count || p.pv_input_count) || (isMicro ? ((Number(p.rated_power_w) || 1600) <= 800 ? 2 : 4) : 4)));
      const ratedPower = Number(p.rated_power_w || p.max_ac_power_w) || (isMicro ? 1600 : null);
      const maxPerMppt = Number(p.max_power_per_mppt_w) || (isMicro && ratedPower ? Math.round(ratedPower / mpptCount) : 500);
      const mpptChannels = isMicro ? defaultMpptChannels(ratedPower, mpptCount, maxPerMppt) : undefined;

      return {
        id: deviceId,
        productId: Number(p.id) || null,
        category: clean(category),
        role: roles[category] || 'other',
        name: clean([p.manufacturer, p.model].filter(Boolean).join(' ')) || 'Device',
        customName: '',
        ratedPower,
        mpptCount: isMicro ? mpptCount : null,
        mpptChannels,
        qty: quantity(node.qty)
      };
    });

    const ids = new Set(layout.devices.map(d => d.id));
    layout.connections = (Array.isArray(snapshot.edges) ? snapshot.edges : [])
      .filter(e => ids.has(e.a) && ids.has(e.b))
      .slice(0, 2000)
      .map(e => ({ a: clean(e.a), b: clean(e.b), type: clean(e.type) }));

    for (const edge of (Array.isArray(snapshot.edges) ? snapshot.edges : [])) {
      if (edge.type !== 'pv_dc') continue;
      const a = layout.devices.find(d => d.id === edge.a), b = layout.devices.find(d => d.id === edge.b);
      const pv = a?.category === 'pv_modules' ? a : b?.category === 'pv_modules' ? b : null;
      const receiver = pv === a ? b : a;
      if (pv && receiver && isReceiver(receiver)) {
        layout.pvFields.push({
          id: 'pv-' + layout.pvFields.length,
          deviceId: receiver.id,
          name: pv.name,
          mppt: clean(pv === a ? edge.bp : edge.ap),
          orientation: '',
          sensors: { power: '', voltage: '', current: '' }
        });
      }
    }

    const inverters = layout.devices.filter(d => ['inverter', 'solar'].includes(d.role) && d.category.includes('inverter'));
    if (inverters.length) {
      layout.inverterStack = inverters.map((inv, idx) => ({
        id: inv.id,
        name: inv.name,
        type: inv.category === 'microinverters' ? 'micro' : 'hybrid',
        phase: idx === 0 ? 'Фаза A (Master)' : idx === 1 ? 'Фаза B' : 'Фаза C',
        power: idx === 0 ? 3200 : 1600,
        status: 'В СИСТЕМІ',
        ip: `192.168.10.${85 + idx}`
      }));
    }

    const batteries = layout.devices.filter(d => d.role === 'battery');
    if (batteries.length) {
      layout.batteryStack = [];
      let batCount = 0;
      for (const bat of batteries) {
        for (let q = 0; q < Math.min(16, bat.qty); q++) {
          batCount++;
          layout.batteryStack.push({
            id: `bat-${bat.id}-${q}`,
            name: `${bat.name} #${batCount} ${q === 0 && batCount === 1 ? '(Master)' : '(Slave)'}`,
            soc: 85 + (q % 3),
            voltage: (53.1 + q * 0.05).toFixed(2),
            current: (1.05 + q * 0.02).toFixed(2),
            temp: 23 + q,
            status: q === 0 && batCount === 1 ? 'Master · OK' : 'Slave · OK'
          });
        }
      }
    }
    if (!layout.batteryStack.length) {
      layout.batteryStack = [...defaultBatteryStack];
    }

    const present = new Set(layout.devices.map(d => d.role));
    layout.widgets = widgets.filter(w => w === 'flow' || present.has(w));
    if (layout.devices.some(d => d.category === 'microinverters') && !layout.widgets.includes('microinverter')) {
      layout.widgets.push('microinverter');
    }
    if (layout.pvFields.length > 0 && !layout.widgets.includes('pv_fields')) {
      layout.widgets.push('pv_fields');
    }
    return layout;
  }

  function validate(raw) {
    if (!raw || raw.version !== 1 || !Array.isArray(raw.devices) || raw.devices.length > 500 || !Array.isArray(raw.widgets)) {
      throw new Error('invalid');
    }
    const result = empty();
    result.id = /^db-[\w-]{1,80}$/.test(raw.id) ? raw.id : result.id;
    result.powerFlow = PowerFlow.normalize(raw.powerFlow);
    result.origin = ['builder', 'standalone'].includes(raw.origin) ? raw.origin : 'standalone';
    result.name = clean(raw.name) || result.name;
    result.brandTitle = clean(raw.brandTitle) || 'ANMA ELECTRIC';
    result.template = Object.hasOwn(templates, raw.template) ? raw.template : 'overview';
    result.accent = /^#[0-9a-f]{6}$/i.test(raw.accent) ? raw.accent : result.accent;
    result.font = fonts.includes(raw.font) ? raw.font : 'system';
    result.glow = raw.glow !== false;
    result.motion = raw.motion !== false;
    result.logo = typeof raw.logo === 'string' && raw.logo.length < 750000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(raw.logo) ? raw.logo : '';
    result.language = ['auto', 'en', 'uk'].includes(raw.language) ? raw.language : 'auto';
    result.background = {
      image: typeof raw.background?.image === 'string' && (raw.background.image.startsWith('/') || raw.background.image.startsWith('http') || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(raw.background.image)) ? raw.background.image : '',
      opacity: raw.background?.opacity !== undefined && Number.isFinite(Number(raw.background.opacity)) ? Math.min(100, Math.max(0, Number(raw.background.opacity))) : 50
    };
    result.flowStyle = flowStyles.includes(raw.flowStyle) ? raw.flowStyle : 'traffic';

    const cols = Number(raw.gridColumns);
    result.gridColumns = [1, 2, 3, 4, 5].includes(cols) ? cols : 2;
    result.ratedPower = Math.min(100000, Math.max(500, Number(raw.ratedPower) || 6000));
    result.flowSpeedMultiplier = Math.min(500, Math.max(25, Number(raw.flowSpeedMultiplier) || 100));

    result.flowInverted = {
      grid: !!raw.flowInverted?.grid,
      battery: !!raw.flowInverted?.battery,
      solar: !!raw.flowInverted?.solar,
      inverter: !!raw.flowInverted?.inverter,
      generator: !!raw.flowInverted?.generator,
      ev: !!raw.flowInverted?.ev,
      load: !!raw.flowInverted?.load
    };
    result.canBridgeEnabled = raw.canBridgeEnabled === true;
    result.haFullscreen = raw.haFullscreen !== false;
    result.groupMetrics = raw.groupMetrics !== false;

    if (raw.flowColors && typeof raw.flowColors === 'object') {
      for (const [k, c] of Object.entries(raw.flowColors)) {
        if (/^#[0-9a-f]{6}$/i.test(c)) result.flowColors[k] = c;
      }
    }

    function isValidWidget(w) {
      if (typeof w !== 'string') return false;
      const base = w.replace(/_\d+$/, '');
      return widgets.includes(w) || widgets.includes(base) || base === 'metric' || base === 'custom';
    }
    result.widgets = Array.from(new Set((Array.isArray(raw.widgets) ? raw.widgets : []).filter(isValidWidget))).slice(0, 50);

    result.devices = raw.devices.map((d, i) => {
      const isMicro = clean(d.category) === 'microinverters';
      const mpptCount = Math.min(8, Math.max(1, Number(d.mpptCount) || 4));
      const ratedPower = Number(d.ratedPower) > 0 ? Number(d.ratedPower) : (isMicro ? 1600 : null);
      let mpptChannels = undefined;
      if (Array.isArray(d.mpptChannels) && d.mpptChannels.length > 0) {
        mpptChannels = d.mpptChannels.slice(0, 16).map((ch, idx) => ({
          id: clean(ch.id) || `mppt-${idx + 1}`,
          name: clean(ch.name) || `MPPT ${idx + 1}`,
          maxPower: Math.min(2000, Math.max(50, Number(ch.maxPower) || 500)),
          panelPower: Math.min(2000, Math.max(0, Number(ch.panelPower) || 0)),
          panelModel: clean(ch.panelModel || ''),
          sensor: clean(ch.sensor || '')
        }));
      } else if (isMicro) {
        mpptChannels = defaultMpptChannels(ratedPower || 1600, mpptCount);
      }

      return {
        id: 'device-' + i,
        productId: Number(d.productId) || null,
        category: clean(d.category),
        role: Object.values(roles).includes(d.role) ? d.role : 'other',
        name: clean(d.name) || 'Device',
        customName: clean(d.customName || ''),
        ratedPower,
        mpptCount: isMicro ? mpptCount : null,
        mpptChannels,
        qty: quantity(d.qty)
      };
    });

    const idMap = new Map(raw.devices.map((d, i) => [d.id, 'device-' + i]));
    if (raw.pvFields !== undefined && (!Array.isArray(raw.pvFields) || raw.pvFields.length > 1000)) {
      throw new Error('invalid');
    }
    const pvIdMap = new Map();
    const hasDeviceReceivers = result.devices.some(isReceiver);
    result.pvFields = (raw.pvFields || [])
      .filter(f => {
        if (!f) return false;
        if (hasDeviceReceivers) {
          return idMap.has(f.deviceId) && isReceiver(result.devices.find(d => d.id === idMap.get(f.deviceId)));
        }
        return true;
      })
      .map((f, i) => ({
        id: (pvIdMap.set(f.id, 'pv-' + i), 'pv-' + i),
        deviceId: hasDeviceReceivers ? idMap.get(f.deviceId) : (clean(f.deviceId) || 'inverter'),
        name: clean(f.name) || ('PV ' + (i + 1)),
        position: validPosition(f.position),
        mppt: clean(f.mppt),
        orientation: clean(f.orientation),
        sensors: {
          power: clean(f.sensors?.power),
          voltage: clean(f.sensors?.voltage),
          current: clean(f.sensors?.current)
        }
      }));

    result.connections = (Array.isArray(raw.connections) ? raw.connections : [])
      .filter(e => idMap.has(e.a) && idMap.has(e.b))
      .slice(0, 2000)
      .map(e => ({ a: idMap.get(e.a), b: idMap.get(e.b), type: clean(e.type) }));

    result.provider = ['none', 'home_assistant', 'solar_assistant', 'mqtt', 'other'].includes(raw.provider) ? raw.provider : 'home_assistant';

    // Provider defaults
    const provDefaults = providerDefaults[result.provider] || providerDefaults.home_assistant;
    result.bindings = { ...provDefaults };
    if (raw.bindings && typeof raw.bindings === 'object') {
      for (const [k, v] of Object.entries(raw.bindings)) {
        if (v !== undefined && v !== null) {
          result.bindings[clean(k)] = clean(v);
        }
      }
    }

    result.deviceImages = {};
    if (raw.deviceImages && typeof raw.deviceImages === 'object') {
      for (const [k, img] of Object.entries(raw.deviceImages)) {
        if (typeof img === 'string' && img.length < 750000) {
          result.deviceImages[clean(k)] = img;
        }
      }
    }

    if (Array.isArray(raw.batteryStack)) {
      result.batteryStack = raw.batteryStack.slice(0, 32).map((b, idx) => ({
        id: clean(b.id) || `bat-${idx}`,
        name: clean(b.name) || `Battery ${idx + 1}`,
        position: validPosition(b.position),
        soc: Math.min(100, Math.max(0, Number(b.soc) || 85)),
        voltage: clean(b.voltage) || '53.2',
        current: clean(b.current) || '1.0',
        temp: Math.min(100, Math.max(-20, Number(b.temp) || 24)),
        status: clean(b.status) || (idx === 0 ? 'Master · OK' : 'Slave · OK'),
        sensors: b.sensors && typeof b.sensors === 'object' ? {
          soc: clean(b.sensors.soc),
          voltage: clean(b.sensors.voltage),
          current: clean(b.sensors.current),
          temp: clean(b.sensors.temp)
        } : undefined
      }));
    }

    if (Array.isArray(raw.inverterStack)) {
      result.inverterStack = raw.inverterStack.slice(0, 32).map((inv, idx) => ({
        id: clean(inv.id) || `inv-${idx}`,
        name: clean(inv.name) || `Inverter ${idx + 1}`,
        type: ['hybrid', 'grid', 'micro'].includes(inv.type) ? inv.type : 'hybrid',
        phase: clean(inv.phase) || (idx === 0 ? 'Фаза A (Master)' : `Фаза ${String.fromCharCode(65 + idx)}`),
        power: Math.min(1000000, Math.max(0, Number(inv.power) || 0)),
        status: clean(inv.status) || 'В СИСТЕМІ',
        ip: clean(inv.ip) || `192.168.10.${85 + idx}`,
        powerSensor: clean(inv.powerSensor || inv.sensor) || '',
        statusSensor: clean(inv.statusSensor || inv.stateSensor) || '',
        sensor: clean(inv.sensor || inv.powerSensor) || ''
      }));
    }

    result.viewMode = viewModes.includes(raw.viewMode) ? raw.viewMode : 'desktop';
    result.devicePreset = devicePresets.includes(raw.devicePreset) ? raw.devicePreset : 'responsive';
    result.deviceOrientation = ['portrait', 'landscape'].includes(raw.deviceOrientation) ? raw.deviceOrientation : 'portrait';
    result.theme = {
      mode: themes.includes(raw.theme?.mode) ? raw.theme.mode : 'anma_dark',
      shape: shapes.includes(raw.theme?.shape) ? raw.theme.shape : 'rounded',
      accent: /^#[0-9a-f]{6}$/i.test(raw.theme?.accent) ? raw.theme.accent : result.accent
    };

    result.photoOpacity = Math.min(100, Math.max(5, Number(raw.photoOpacity) || 50));

    if (raw.widgetConfigs && typeof raw.widgetConfigs === 'object') {
      const allCfgKeys = new Set([...widgets, ...result.widgets, ...Object.keys(raw.widgetConfigs)]);
      for (const w of allCfgKeys) {
        const cfg = raw.widgetConfigs[w];
        if (cfg && typeof cfg === 'object') {
          let items = undefined;
          if (Array.isArray(cfg.items)) {
            items = cfg.items.slice(0, 8).map(it => ({
              label: clean(it.label || ''),
              val: clean(it.val || ''),
              unit: clean(it.unit || ''),
              sensor: clean(it.sensor || ''),
              pct: clean(it.pct || '')
            }));
          }
          result.widgetConfigs[w] = {
            size: sizes.includes(cfg.size) ? cfg.size : (w === 'flow' ? 'full' : '1x1'),
            shape: shapes.includes(cfg.shape) ? cfg.shape : result.theme.shape,
            accent: /^#[0-9a-f]{6}$/i.test(cfg.accent) ? cfg.accent : '',
            title: clean(cfg.title),
            range: ['24h', '7d', '14d', '30d', 'year', 'years'].includes(cfg.range) ? cfg.range : '24h',
            forecastDays: Math.min(7, Math.max(1, Number(cfg.forecastDays) || 7)),
            showBatteries: cfg.showBatteries !== false,
            showPv: cfg.showPv !== false,
            subFields: Math.min(6, Math.max(1, Number(cfg.subFields) || 1)),
            subLayout: ['auto', 'row', 'col', 'grid'].includes(cfg.subLayout) ? cfg.subLayout : 'auto',
            gridColumns: Number(cfg.gridColumns) >= 1 && Number(cfg.gridColumns) <= 7 ? Number(cfg.gridColumns) : undefined,
            autoFit: !!cfg.autoFit,
            customWidth: Number(cfg.customWidth) >= 200 && Number(cfg.customWidth) <= 1800 ? Number(cfg.customWidth) : null,
            customHeight: Number(cfg.customHeight) >= 100 && Number(cfg.customHeight) <= 1200 ? Number(cfg.customHeight) : null,
            scale: Number(cfg.scale) >= 0.8 && Number(cfg.scale) <= 1.4 ? Number(cfg.scale) : 1,
            items,
            activeSeries: (cfg.activeSeries && typeof cfg.activeSeries === 'object') ? {
              solar: cfg.activeSeries.solar !== false,
              battery: cfg.activeSeries.battery !== false,
              load: cfg.activeSeries.load !== false,
              self: cfg.activeSeries.self !== false
            } : { solar: true, battery: true, load: true, self: true }
          };
        }
      }
    }

    if (raw.flowNodes && typeof raw.flowNodes === 'object') {
      for (const [k, node] of Object.entries(raw.flowNodes)) {
        if (node && typeof node === 'object') {
          const x = Math.min(100, Math.max(0, Number(node.x) || defaultFlowNodes[k]?.x || 50));
          const y = Math.min(100, Math.max(0, Number(node.y) || defaultFlowNodes[k]?.y || 50));
          result.flowNodes[clean(k)] = { x, y, label: clean(node.label || defaultFlowNodes[k]?.label || k) };
        }
      }
    }

    result.flowVariants = {};
    for(const profile of ['desktop','tablet','mobile']){
      result.flowVariants[profile]={};
      for(const [key,value] of Object.entries(raw.flowVariants?.[profile]||{}).slice(0,1100)){
        if(!/^[\w:-]{1,120}$/.test(key)||!value)continue;
        const position=validPosition(value);
        const mappedKey=key.startsWith('pv:')?'pv:'+pvIdMap.get(key.slice(3)):key;
        if(key.startsWith('pv:')&&!pvIdMap.has(key.slice(3)))continue;
        result.flowVariants[profile][mappedKey]={...(position||{}),scale:Math.min(4,Math.max(.6,Number(value.scale)||1))};
      }
    }
    result.flowMeters = {};
    for(const role of ['inverter','solar','grid','battery','load','generator','ev']) {
      const meter=raw.flowMeters?.[role]||{};
      result.flowMeters[role]={mode:meter.mode==='split'?'split':'single',ratedPower:Math.max(1,Math.min(1e9,Number(meter.ratedPower)||Number(raw.ratedPower)||6000))};
    }
    result.elements = normalizeElements(raw.elements);
    return result;
  }

  function applyTemplate(layout, key) {
    if (!Object.hasOwn(templates, key)) throw new Error('invalid_template');
    const next = validate(layout);
    next.template = key;
    next.widgets = [...templates[key]];
    return next;
  }

  function sampleEquipment(uk = false) {
    const layout = empty();
    layout.name = uk ? 'PIVDENNE ENERGY · DA6K' : 'DA6K Energy Flow System';
    layout.brandTitle = 'ANMA ELECTRIC';

    // 6 Inverters sample
    layout.inverterStack = [
      { id: 'inv-1', name: uk ? 'Гібридний інвертор Deye' : 'Deye Hybrid Inverter', type: 'hybrid', phase: 'Фаза A (Master)', power: 3200, status: 'В СИСТЕМІ', ip: '192.168.10.85' },
      { id: 'inv-2', name: uk ? 'Мережевий інвертор Deye' : 'Deye Grid Inverter', type: 'grid', phase: 'Фаза B', power: 1600, status: 'В СИСТЕМІ', ip: '192.168.10.86' },
      { id: 'inv-3', name: uk ? 'Мікроінвертор 3 (4 PV)' : 'Microinverter 3 (4 PV)', type: 'micro', phase: 'Фаза C', power: 1200, status: 'В СИСТЕМІ', ip: '192.168.10.89' },
      { id: 'inv-4', name: uk ? 'Мікроінвертор 4 (4 PV)' : 'Microinverter 4 (4 PV)', type: 'micro', phase: 'Фаза C', power: 1200, status: 'В СИСТЕМІ', ip: '192.168.10.88' },
      { id: 'inv-5', name: uk ? 'Мікроінвертор 5 (4 PV)' : 'Microinverter 5 (4 PV)', type: 'micro', phase: 'Фаза B', power: 1200, status: 'В СИСТЕМІ', ip: '192.168.10.77' },
      { id: 'inv-6', name: uk ? 'Мікроінвертор 6 (4 PV)' : 'Microinverter 6 (4 PV)', type: 'micro', phase: 'Фаза A', power: 1200, status: 'В СИСТЕМІ', ip: '192.168.10.37' }
    ];

    for (let i = 0; i < 6; i++) {
      const inv = layout.inverterStack[i];
      const device = {
        id: 'demo-' + i,
        productId: null,
        category: inv.type === 'micro' ? 'microinverters' : 'inverters',
        role: inv.type === 'micro' ? 'solar' : 'inverter',
        name: inv.name,
        qty: 1
      };
      layout.devices.push(device);
      const pvCount = inv.type === 'micro' ? 4 : 2;
      for (let p = 0; p < pvCount; p++) {
        layout.pvFields.push({
          id: `pv-${i}-${p}`,
          deviceId: device.id,
          name: 'PV' + (p + 1),
          mppt: 'MPPT' + (p + 1),
          orientation: p === 0 ? (uk ? 'Захід' : 'West') : p === 1 ? (uk ? 'Схід' : 'East') : (uk ? 'Південь' : 'South'),
          sensors: { power: '', voltage: '', current: '' }
        });
      }
    }
    return applyTemplate(layout, 'full');
  }

  function exportHomeAssistantYaml(layout, options = {}) {
    const l = validate(layout);
    const b = l.bindings;
    const target = options.target === 'legacy_stack' ? 'legacy_stack' : (options.target === 'dashboard' ? 'dashboard' : 'custom_card');
    const mode = options.mode || 'sections';

    function generateFlowCard(indent) {
      const pad = ' '.repeat(indent);
      const lines = [];
      lines.push(`${pad}- type: custom:power-flow-card-plus`);
      lines.push(`${pad}  title: "${l.brandTitle}"`);
      lines.push(`${pad}  watt_threshold: 999`);
      lines.push(`${pad}  w_decimals: 0`);
      lines.push(`${pad}  entities:`);
      lines.push(`${pad}    solar:`);
      lines.push(`${pad}      entity: "${b.solar_power || 'sensor.solar_power'}"`);
      lines.push(`${pad}      display_zero: true`);
      if (l.flowInverted.solar) lines.push(`${pad}      invert_state: true`);

      lines.push(`${pad}    battery:`);
      lines.push(`${pad}      entity: "${b.battery_power || 'sensor.battery_power'}"`);
      lines.push(`${pad}      state_of_charge: "${b.battery_soc || 'sensor.battery_soc'}"`);
      if (l.flowInverted.battery) lines.push(`${pad}      invert_state: true`);

      lines.push(`${pad}    grid:`);
      lines.push(`${pad}      entity: "${b.grid_power || 'sensor.grid_power'}"`);
      if (l.flowInverted.grid) lines.push(`${pad}      invert_state: true`);

      lines.push(`${pad}    home:`);
      lines.push(`${pad}      entity: "${b.load_power || 'sensor.home_consumption'}"`);
      if (l.flowInverted.load) lines.push(`${pad}      invert_state: true`);

      if (l.widgets.includes('ev') || b.ev_power) {
        lines.push(`${pad}    individual:`);
        lines.push(`${pad}      - entity: "${b.ev_power || 'sensor.ev_charger_power'}"`);
        lines.push(`${pad}        name: "EV Charger"`);
        lines.push(`${pad}        icon: "mdi:car-electric"`);
      }
      return lines;
    }

    function generateGaugeCard(indent) {
      const pad = ' '.repeat(indent);
      const lines = [];
      lines.push(`${pad}- type: gauge`);
      lines.push(`${pad}  name: "Battery SoC (Total Pack)"`);
      lines.push(`${pad}  entity: "${b.battery_soc || 'sensor.battery_soc'}"`);
      lines.push(`${pad}  unit: "%"`);
      lines.push(`${pad}  min: 0`);
      lines.push(`${pad}  max: 100`);
      lines.push(`${pad}  needle: true`);
      lines.push(`${pad}  severity:`);
      lines.push(`${pad}    red: 15`);
      lines.push(`${pad}    yellow: 30`);
      lines.push(`${pad}    green: 60`);
      return lines;
    }

    function generateCanBmsCard(indent) {
      if (!l.canBridgeEnabled || !l.batteryStack?.length) return [];
      const pad = ' '.repeat(indent);
      const lines = [];
      lines.push(`${pad}- type: entities`);
      lines.push(`${pad}  title: "Individual Battery Modules (CAN BMS Bridge)"`);
      lines.push(`${pad}  entities:`);
      l.batteryStack.forEach((bat, idx) => {
        lines.push(`${pad}    - entity: "sensor.battery_${idx + 1}_soc"`);
        lines.push(`${pad}      name: "${bat.name} (SoC)"`);
        lines.push(`${pad}    - entity: "sensor.battery_${idx + 1}_voltage"`);
        lines.push(`${pad}      name: "${bat.name} (Voltage)"`);
      });
      return lines;
    }

    const defaultMetricItemsMap = {
      solar: [
        { label: 'Power', sensor: b.solar_power || 'sensor.solar_power', unit: 'kW' },
        { label: 'Solar today', sensor: b.solar_daily_energy || 'sensor.solar_energy_daily', unit: 'kWh' },
        { label: 'PV Voltage', sensor: b.pv1_voltage || 'sensor.pv_string_1_voltage', unit: 'V' },
        { label: 'MPPT Current', sensor: b.pv1_current || 'sensor.pv_string_1_current', unit: 'A' }
      ],
      battery: [
        { label: 'Battery SoC', sensor: b.battery_soc || 'sensor.battery_state_of_charge', unit: '%' },
        { label: 'Power', sensor: b.battery_power || 'sensor.battery_power', unit: 'kW' },
        { label: 'Voltage', sensor: b.battery_voltage || 'sensor.battery_voltage', unit: 'V' },
        { label: 'Temp', sensor: b.battery_temp || 'sensor.battery_temperature', unit: '°C' }
      ],
      load: [
        { label: 'Load', sensor: b.load_power || 'sensor.home_consumption_power', unit: 'kW' },
        { label: 'Load today', sensor: b.load_daily_energy || 'sensor.home_consumption_daily', unit: 'kWh' },
        { label: 'Frequency', sensor: b.grid_frequency || 'sensor.grid_frequency', unit: 'Hz' },
        { label: 'Voltage', sensor: b.grid_voltage || 'sensor.grid_voltage', unit: 'V' }
      ],
      grid: [
        { label: 'Grid Power', sensor: b.grid_power || 'sensor.grid_active_power', unit: 'W' },
        { label: 'Import today', sensor: b.grid_daily_import || 'sensor.grid_import_daily', unit: 'kWh' },
        { label: 'Export today', sensor: b.grid_daily_export || 'sensor.grid_export_daily', unit: 'kWh' },
        { label: 'Grid Voltage', sensor: b.grid_voltage || 'sensor.grid_voltage', unit: 'V' }
      ],
      ev: [
        { label: 'EV Power', sensor: b.ev_power || 'sensor.ev_charger_power', unit: 'kW' }
      ],
      generator: [
        { label: 'Generator Power', sensor: b.generator_power || 'sensor.generator_power', unit: 'kW' }
      ],
      metric: [
        { label: 'Metric', sensor: 'sensor.custom_metric', unit: '' }
      ]
    };

    function generateMetricsCard(indent) {
      const pad = ' '.repeat(indent);
      const lines = [];
      const metricWidgets = l.widgets.filter(w => {
        const bRole = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
        return ['solar', 'battery', 'load', 'grid', 'generator', 'ev', 'metric'].includes(bRole);
      });

      const titleMap = {
        solar: 'Solar Panels', battery: 'Battery', load: 'Consumption',
        grid: 'Grid', ev: 'EV Charger', generator: 'Generator', metric: 'Custom Metric'
      };

      if (!metricWidgets.length) {
        lines.push(`${pad}- type: entities`);
        lines.push(`${pad}  title: "Electrical Metrics"`);
        lines.push(`${pad}  entities:`);
        lines.push(`${pad}    - entity: "${b.battery_voltage || 'sensor.battery_voltage'}"`);
        lines.push(`${pad}      name: "Battery Voltage"`);
        lines.push(`${pad}    - entity: "${b.battery_temp || 'sensor.battery_temperature'}"`);
        lines.push(`${pad}      name: "Battery Temp"`);
        lines.push(`${pad}    - entity: "${b.grid_voltage || 'sensor.grid_voltage'}"`);
        lines.push(`${pad}      name: "Grid Voltage"`);
        lines.push(`${pad}    - entity: "${b.grid_frequency || 'sensor.grid_frequency'}"`);
        lines.push(`${pad}      name: "Grid Frequency"`);
        return lines;
      }

      metricWidgets.forEach(w => {
        const bRole = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
        const cfg = l.widgetConfigs?.[w] || {};
        const subCount = Number(cfg.subFields) || 1;
        const m = typeof w === 'string' ? w.match(/_(\d+)$/) : null;
        const cardTitle = cfg.title || (m ? `${titleMap[bRole] || bRole} #${m[1]}` : (titleMap[bRole] || bRole));
        const items = (Array.isArray(cfg.items) && cfg.items.length)
          ? cfg.items.slice(0, subCount)
          : (defaultMetricItemsMap[bRole] || []).slice(0, subCount);

        lines.push(`${pad}- type: entities`);
        lines.push(`${pad}  title: "${cardTitle.replace(/"/g, '\\"')}"`);
        lines.push(`${pad}  entities:`);
        if (items.length) {
          items.forEach(it => {
            const entityId = it.sensor || (defaultMetricItemsMap[bRole]?.[0]?.sensor || 'sensor.energy_metric');
            lines.push(`${pad}    - entity: "${entityId}"`);
            lines.push(`${pad}      name: "${(it.label || 'Metric').replace(/"/g, '\\"')}"`);
          });
        } else {
          lines.push(`${pad}    - entity: "${b.battery_voltage || 'sensor.battery_voltage'}"`);
          lines.push(`${pad}      name: "Voltage"`);
        }
      });

      return lines;
    }

    function generateWeatherCard(indent) {
      const pad = ' '.repeat(indent);
      const lines = [];
      lines.push(`${pad}- type: weather-forecast`);
      lines.push(`${pad}  entity: "${b.weather_condition || 'weather.forecast_home'}"`);
      lines.push(`${pad}  forecast_type: daily`);
      lines.push(`${pad}  show_forecast: true`);
      return lines;
    }

    function generateGraphCard(indent) {
      const pad = ' '.repeat(indent);
      const lines = [];
      lines.push(`${pad}- type: custom:mini-graph-card`);
      lines.push(`${pad}  name: "Solar vs Consumption"`);
      lines.push(`${pad}  hours_to_show: 24`);
      lines.push(`${pad}  points_per_hour: 4`);
      lines.push(`${pad}  entities:`);
      lines.push(`${pad}    - entity: "${b.solar_power || 'sensor.solar_power'}"`);
      lines.push(`${pad}      name: "Solar"`);
      lines.push(`${pad}      color: "${l.accent}"`);
      lines.push(`${pad}    - entity: "${b.load_power || 'sensor.home_consumption'}"`);
      lines.push(`${pad}      name: "Load"`);
      lines.push(`${pad}      color: "#38bdf8"`);
      return lines;
    }

    function generateMicroinverterCards(indent) {
      const microDevs = l.devices.filter(d => d.category === 'microinverters');
      if (!l.widgets.includes('microinverter') && microDevs.length === 0) return [];
      const pad = ' '.repeat(indent);
      const lines = [];
      (microDevs.length ? microDevs : [{ name: 'Microinverter 1', mpptChannels: defaultMpptChannels(1600, 4) }]).forEach((mdev, mIdx) => {
        lines.push(`${pad}- type: entities`);
        lines.push(`${pad}  title: "${mdev.customName || mdev.name}"`);
        lines.push(`${pad}  entities:`);
        const chs = (mdev.mpptChannels && mdev.mpptChannels.length) ? mdev.mpptChannels : defaultMpptChannels(mdev.ratedPower || 1600, 4);
        chs.forEach((ch, chIdx) => {
          lines.push(`${pad}    - entity: "${ch.sensor || `sensor.microinverter_${mIdx + 1}_mppt_${chIdx + 1}_power`}"`);
          lines.push(`${pad}      name: "${ch.name} (${ch.panelModel || ch.panelPower + 'W Panel'})"`);
        });
      });
      return lines;
    }

    const lines = [];

    const exportLayout = JSON.parse(JSON.stringify(l));
    const cardType='custom:anma-card';
    const metricWidgets = (exportLayout.widgets || []).filter(w => {
      const bRole = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
      return ['solar', 'battery', 'load', 'grid', 'generator', 'ev', 'metric'].includes(bRole);
    });
    metricWidgets.forEach(w => {
      const bRole = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
      if (!exportLayout.widgetConfigs) exportLayout.widgetConfigs = {};
      if (!exportLayout.widgetConfigs[w]) exportLayout.widgetConfigs[w] = {};
      const cfg = exportLayout.widgetConfigs[w];
      const subCount = Number(cfg.subFields) || 1;
      const defs = defaultMetricItemsMap[bRole] || [];
      if (!Array.isArray(cfg.items) || !cfg.items.length) {
        cfg.items = defs.slice(0, subCount).map(d => ({
          label: d.label,
          val: '—',
          unit: d.unit || '',
          sensor: d.sensor || '',
          pct: '50%'
        }));
      } else {
        cfg.items.forEach((it, idx) => {
          if (!it.sensor && defs[idx]?.sensor) {
            it.sensor = defs[idx].sensor;
          }
        });
      }
    });

    if (target === 'custom_card' || target === 'card') {
      return 'type: '+cardType+'\nlayout: ' + JSON.stringify(exportLayout);
    }

    if (target === 'dashboard') {
      lines.push('# ============================================================');
      lines.push(`# ANMA ELECTRIC -> Home Assistant Lovelace Configuration`);
      lines.push(`# System: ${l.brandTitle} - ${l.name}`);
      lines.push(`# Provider mapping: ${l.provider}`);
      lines.push(`# Origin: ${l.origin === 'builder' ? 'System Builder' : 'Standalone Dashboard'}`);
      lines.push(`# Rated Inverter Power: ${l.ratedPower}W | Grid Columns: ${l.gridColumns}`);
      lines.push('# ------------------------------------------------------------');
      lines.push('# Як додати в Home Assistant:');
      lines.push('# 1. Відкрийте панель приладів у Home Assistant');
      lines.push('# 2. Натисніть три крапки ⋮ (вгорі праворуч) -> «Редагувати панель»');
      lines.push('# 3. Знову три крапки ⋮ -> «Редактор вихідного коду» (Raw configuration editor)');
      lines.push('# 4. Вставте цей код і натисніть «Зберегти»');
      lines.push('# ============================================================');
      lines.push('');

      // Kiosk / Fullscreen mode definition for Home Assistant wall tablets
      if (l.haFullscreen) {
        lines.push('# Kiosk Mode for Wall Panels / Tablets (removes left sidebar and header clutter)');
        lines.push('kiosk_mode:');
        lines.push('  hide_sidebar: true');
        lines.push('  hide_header: false');
        lines.push('  hide_menubutton: false');
        lines.push('');
      }

      lines.push(`title: "${l.brandTitle} - ${l.name.replace(/"/g, '\\"')}"`);
      lines.push('views:');
      lines.push('  - title: "Energy"');
      lines.push('    path: "energy"');
      lines.push('    icon: "mdi:solar-power-variant"');
      lines.push('    panel: true # Full-width viewport without horizontal padding limits');
      lines.push('    cards:');
      lines.push('      - type: '+cardType);
      lines.push('        layout: ' + JSON.stringify(exportLayout));
      return lines.join('\n');
    }

    if (target === 'legacy_stack') {
      lines.push('# ============================================================');
      lines.push(`# ANMA ELECTRIC -> Home Assistant Single Card (Vertical Stack)`);
      lines.push(`# System: ${l.brandTitle} - ${l.name}`);
      lines.push(`# Provider mapping: ${l.provider}`);
      lines.push(`# Rated Inverter Power: ${l.ratedPower}W`);
      lines.push('# ------------------------------------------------------------');
      lines.push('# Як додати в Home Assistant:');
      lines.push('# 1. На потрібній панелі приладів натисніть «+ ДОДАТИ КАРТКУ»');
      lines.push('# 2. Прокрутіть список униз і оберіть «Вручну» (Manual Card)');
      lines.push('# 3. Вставте цей код у поле "Конфігурація картки" та натисніть «Зберегти»');
      lines.push('# ============================================================');
      lines.push('');
      lines.push('type: vertical-stack');
      lines.push(`title: "${l.brandTitle} - ${l.name.replace(/"/g, '\\"')}"`);
      lines.push('cards:');
      lines.push(...generateFlowCard(2));
      lines.push(...generateGaugeCard(2));
      lines.push(...generateCanBmsCard(2));
      lines.push(...generateMetricsCard(2));
      lines.push(...generateWeatherCard(2));
      lines.push(...generateGraphCard(2));
      lines.push(...generateMicroinverterCards(2));
      return lines.join('\n');
    }

    return 'type: '+cardType+'\nlayout: ' + JSON.stringify(exportLayout);
  }

  async function prepareBackground(file) {
    if (!file || !['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 10000000) throw new Error('image_file');
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1,1600/Math.max(bitmap.width,bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1,Math.round(bitmap.width*scale));
      canvas.height = Math.max(1,Math.round(bitmap.height*scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#111827'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      for (const quality of [.82,.65,.45,.25]) {
        const image = canvas.toDataURL('image/jpeg',quality);
        if (image.length < 750000) return image;
      }
      throw new Error('image_file');
    } finally { bitmap.close(); }
  }

  // One description of branch measurements shared by Studio and Home Assistant.
  function flowDetails(layout) {
    const cfg=layout.widgetConfigs?.flow||{}, rows=[];
    if(cfg.showBatteries!==false)(layout.batteryStack||[]).forEach((b,i)=>rows.push({
      kind:'battery', key:'battery_'+i, position:b.position, name:b.name, subtitle:'',
      measurements:['soc','voltage','current','temp'].map((key,j)=>({
        kind:['soc','voltage','current','temperature'][j], unit:['%','V','A','°C'][j],
        sensor:layout.bindings?.['battery_'+i+'_'+key]||''
      }))
    }));
    if(cfg.showPv!==false)(layout.pvFields||[]).forEach((f,i)=>{
      const device=(layout.devices||[]).find(d=>d.id===f.deviceId) || (layout.inverterStack||[]).find(inv=>inv.id===f.deviceId);
      rows.push({kind:'pv',key:'pv_'+i,position:f.position,name:f.name,subtitle:[device?.name,f.mppt,f.orientation].filter(Boolean).join(' · '),
        measurements:['power','voltage','current'].map((key,j)=>({kind:key,unit:['W','V','A'][j],sensor:f.sensors?.[key]||''}))});
    });
    return rows;
  }

  function validPosition(p) {
    return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? {x:Math.min(100,Math.max(0,p.x)),y:Math.min(100,Math.max(0,p.y))} : null;
  }

  function flowGraph(layout) {
    const rows=flowDetails(layout), pv=rows.filter(r=>r.kind==='pv'), batteries=rows.filter(r=>r.kind==='battery');
    const top=Math.ceil(pv.length/5)*130, bottom=Math.ceil(batteries.length/5)*150, height=440+top+bottom;
    const core=['solar','grid','load','battery','inverter',...['generator','ev'].filter(key=>(layout.widgets||[]).includes(key)||(layout.devices||[]).some(d=>d.role===key))].map(key=>{
      const saved=layout.flowNodes?.[key]||defaultFlowNodes[key]||{x:50,y:50};
      const standard=defaultFlowNodes[key];
      const untouched=standard && saved.x===standard.x && saved.y===standard.y;
      return {key,kind:key,name:saved.label||key, x:saved.x,y:untouched?(top+saved.y*4.4)/height*100:saved.y};
    });
    rows.forEach((row,i)=>{
      const list=row.kind==='pv'?pv:batteries, n=list.indexOf(row), rowCount=Math.min(5,list.length-Math.floor(n/5)*5);
      const position=validPosition(row.position)||{x:(n%5+.5)*100/rowCount,y:(row.kind==='pv'?65+Math.floor(n/5)*130:top+440+75+Math.floor(n/5)*150)/height*100};
      core.push({...row,index:i,...position});
    });
    return {height,nodes:core,edges:core.filter(n=>n.key!=='inverter').map(n=>({from:n.key,to:n.kind==='pv'?'solar':n.key.startsWith('battery_')?'battery':'inverter'}))};
  }

  // Used by both the editor and the exported HA bundle: same nodes, edges and coordinates.
  // A bounded presentation viewport; every existing widget remains reachable.
  function prepareFlowViewport(canvas,layout,{uk=false}={}){
    const mobileStyle=document.createElement('style');mobileStyle.textContent=`
      .db-compact-group{container-type:inline-size;container-name:metrics}
      .anma-shared-weather{container-type:inline-size;container-name:forecast}
      .anma-energy-chart{container-type:inline-size;container-name:energychart}
      @container metrics (max-width:600px){
        .db-compact-group-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
        .db-compact-group-grid>.db-compact-card:nth-child(odd):is(:last-child,:has(+ .db-compact-add-tile)){grid-column:1/-1}
        .db-compact-group-grid>.db-compact-add-tile{grid-column:1/-1;min-height:40px;padding:6px}
        .db-compact-group-head{flex-wrap:wrap;gap:8px}
        .db-compact-group-head small,.db-compact-group-head .db-eyebrow{display:none}
        .db-compact-group-head b{font-size:13px!important}
        .db-compact-group-head button{white-space:nowrap;font-size:11px;padding:7px}
        .db-compact-card{min-width:0!important;width:100%!important}
      }
      @container forecast (max-width:600px){
        .anma-shared-weather .db-forecast-section .db-forecast-grid,.anma-shared-weather .db-forecast-grid.db-forecast-grid{display:grid!important;grid-auto-flow:row!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;overflow:visible!important;gap:8px!important}
        .db-forecast-grid>.db-forecast-day-card{min-width:0!important;width:auto!important}
        .db-forecast-grid>.db-forecast-day-card:last-child:nth-child(odd){grid-column:1/-1}
        .db-fday-bar-track,.db-fday-footer,.db-fday-cond,.db-fday-date{display:none!important}
        .db-forecast-day-card{padding:10px!important}
      }
      @container energychart (max-width:600px){
        .anma-energy-chart .anma-chart-legend{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px}
        .anma-energy-chart .anma-chart-legend button{min-width:0;padding:6px 2px;flex-direction:column;gap:3px;font-size:10px;border-radius:8px}
        .anma-chart-series-name{display:none}
        .anma-chart-series-value{white-space:normal;text-align:center}
        .anma-chart-legend i{flex-shrink:0}
      }
    `;canvas.prepend(mobileStyle);
    let frame=canvas.parentElement?.classList.contains('anma-full-preview')?canvas.parentElement:null;
    if(layout.template!=='full'&&frame){frame.replaceWith(canvas);frame=null;}
    canvas.classList.toggle('anma-full-canvas',layout.template==='full');
    if(layout.template==='full'){
      if(!frame){
        frame=document.createElement('section');frame.className='anma-full-preview';
        frame.setAttribute('aria-label',uk?'Загальний перегляд дашборда':'Complete dashboard preview');
        // HA assembles the canvas before mounting it; the caller mounts this wrapper.
        if(canvas.parentNode)canvas.replaceWith(frame);
        frame.append(canvas);
        const toolbar=document.createElement('div');toolbar.className='anma-full-toolbar';
        const title=document.createElement('span');title.textContent=uk?'Повний дашборд':'Full dashboard';toolbar.append(title);
        const expand=document.createElement('button');expand.type='button';expand.textContent='⛶';
        expand.title=uk?'Весь дашборд на повний екран':'Entire dashboard fullscreen';expand.setAttribute('aria-label',expand.title);
        expand.onclick=async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await frame.requestFullscreen();};
        toolbar.append(expand);frame.prepend(toolbar);
      }
      const first=[...canvas.children].find(e=>e.classList.contains('db-widget-box'));
      if(first)first.classList.add('anma-full-first');
      const frameStyle=document.createElement('style');frameStyle.textContent=`
        .anma-full-preview{--full-height:var(--apf-height,calc(100svh - 120px));height:var(--full-height);min-height:320px;border:1px solid #526579;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;background:#0b1721;box-sizing:border-box;min-width:0;width:100%}
        .anma-full-toolbar{display:flex;align-items:center;justify-content:space-between;padding:5px 10px;flex:0 0 42px;box-sizing:border-box;color:#b8cddd;font:12px system-ui}
        .anma-full-toolbar button{width:32px;height:32px;border:1px solid #526579;border-radius:8px;background:#152532;color:#fff;cursor:pointer}
        .anma-full-preview:fullscreen{--full-height:100dvh;height:100dvh;max-height:none;border-radius:0}
        .anma-full-preview>.anma-full-canvas{display:flex!important;flex-direction:column!important;flex-wrap:nowrap!important;align-items:stretch!important;gap:12px!important;overflow-y:auto!important;overflow-x:hidden!important;flex:1;min-height:0;padding:8px!important;box-sizing:border-box;scrollbar-gutter:stable}
        .anma-full-preview>.anma-full-canvas>.db-widget-box{position:relative!important;inset:auto!important;transform:none!important;width:100%!important;flex:0 0 auto!important;max-width:100%;box-sizing:border-box}
        .anma-full-preview>.anma-full-canvas>.anma-full-first:fullscreen{height:100dvh!important}
        .anma-full-preview>.anma-full-canvas>.anma-full-first{height:calc(var(--full-height) - 60px)!important;min-height:260px!important}
      `;canvas.prepend(frameStyle);
    }
    const enabled=layout.template==='overview'&&(layout.widgets||[]).includes('flow');
    canvas.classList.toggle('anma-overview-fit',enabled);
    const items=[...canvas.children].filter(e=>e.tagName!=='STYLE'&&(e.classList.contains('db-widget-box')||e.children.length||e.textContent.trim()));
    if(!items.length)return;
    const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;};
    const style=node('style','');style.textContent=`
      .anma-overview-fit{height:var(--energy-height,calc(var(--apf-height,100svh) - 150px));min-height:320px;max-height:1000px;display:flex!important;flex-direction:column;gap:8px!important;container-type:inline-size;container-name:energyview;position:relative;overflow:hidden;padding:0!important}
      .anma-overview-fit:fullscreen{height:100dvh;min-height:0;max-height:none;background:#0c121a;padding:10px!important;box-sizing:border-box}
      .anma-overview-nav{display:flex;gap:5px;align-items:center;flex:none;overflow-x:auto;min-width:0;max-width:100%;min-height:34px}
      .anma-overview-nav button{flex-shrink:0;font:600 11px system-ui;white-space:nowrap;border:1px solid #40546b;border-radius:7px;padding:7px 9px;background:#132330;color:#e5eff6;cursor:pointer}
      .anma-overview-nav button[aria-pressed=true]{border-color:#f1873d;color:#ffad70}.anma-overview-expand{margin-left:auto}
      .anma-overview-fit.anma-overview-fit.anma-overview-fit>.anma-overview-panel{position:relative!important;inset:auto!important;transform:none!important;width:100%!important;flex:1 1 0!important;height:calc(100% - 42px)!important;min-width:0!important;min-height:0!important;max-height:100%;margin:0!important;box-sizing:border-box;overflow:auto}
      .anma-overview-fit>.anma-overview-panel[hidden]{display:none!important}.anma-overview-fit>.db-flow-widget{display:flex!important;flex-direction:column;gap:6px;padding:10px!important;overflow:hidden!important}
      .anma-overview-fit .db-flow-container-wrap{display:grid!important;grid-template-columns:minmax(0,1fr) 180px!important;gap:8px;flex:1;min-height:0}
      .anma-overview-fit .db-flow-container-wrap .anma-scene-scroll{display:flex;flex-direction:column;height:100%;min-height:0}
      .anma-overview-fit .anma-scene{flex:1;min-height:0;aspect-ratio:auto!important;height:auto!important}
      .anma-overview-fit .anma-scene-reset{align-self:start;font-size:10px;padding:3px 6px;margin:0}
      .anma-overview-fit .anma-scene-node{width:clamp(48px,14cqw,112px);min-height:44px;padding:4px;border-width:1px;border-radius:8px}
      .anma-overview-fit .anma-scene-node strong{font:600 10px/1.2 system-ui;max-height:24px;overflow:hidden}
      .anma-overview-fit .anma-scene-node b{font:700 13px/1.3 system-ui}.anma-overview-fit .anma-scene-node small{font:10px/1.2 system-ui}
      .anma-overview-fit .anma-scene-node[data-key=inverter]{min-width:48px;min-height:48px}
      .anma-overview-fit .db-widget-head{margin:0!important;padding:0!important;flex:none}.anma-overview-fit .db-widget-head>div>b{font-size:14px!important}
      .anma-overview-fit .db-flow-widget .db-flow-summary-bar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:5px;padding-top:5px;margin:0;flex:none}
      .anma-overview-fit .db-summary-item{padding:6px;min-width:0}.anma-overview-fit .db-summary-item span{font-size:9px;line-height:1.2}.anma-overview-fit .db-summary-item b{font-size:12px}
      .anma-overview-fit .db-flow-configure{padding:5px;font-size:11px;align-self:start;flex:none}
      .anma-overview-fit .db-flow-side-column{gap:8px;min-height:0}.anma-overview-fit .db-flow-side-card{padding:8px;min-height:0}.anma-overview-fit .db-big-soc{font-size:22px}
      @container energyview (max-width:650px){
        .anma-overview-fit .db-widget-head small,.anma-overview-fit .db-widget-head .db-eyebrow{display:none!important}
        .anma-overview-fit .db-flow-container-wrap{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important}
        .anma-overview-fit .db-flow-side-column{display:none!important}
        .anma-overview-fit .db-flow-side-spec-row,.anma-overview-fit .db-progress-track{display:none}
        .anma-overview-fit .db-flow-side-card{padding:5px}.anma-overview-fit .db-flow-side-card h4{font-size:8px;margin:0}.anma-overview-fit .db-big-soc{font-size:16px;margin:0}
        .anma-overview-fit .anma-scene-node small{display:none}.anma-overview-fit .anma-scene-node strong{font-size:9px;max-height:22px}.anma-overview-fit .anma-scene-node b{font-size:11px}
        .anma-overview-fit .db-card-controls{position:static;opacity:1;display:flex;align-self:flex-end}.anma-overview-fit .db-sector-tag{display:none}
      }
      @media(max-height:500px){.anma-overview-fit{--energy-height:calc(100svh - 80px);min-height:260px}.anma-overview-fit .db-flow-side-spec-row,.anma-overview-fit .db-widget-head small{display:none}.anma-overview-fit .db-summary-item{padding:3px}}
    `;
    // Reuse the exact same scene sizing in every template, including fullscreen.
    const flowStyle=node('style','');
    const start=style.textContent.indexOf('      .anma-overview-fit .db-flow-container-wrap');
    const end=style.textContent.indexOf('      @media(max-height:500px)');
    flowStyle.textContent=style.textContent.slice(start,end)
      .replaceAll('.anma-overview-fit .db-flow-widget','.anma-flow-layout')
      .replaceAll('.anma-overview-fit','.anma-flow-layout')
      .replaceAll('@container energyview','@container flowcard')+`
      .db-flow-widget.anma-flow-layout{display:flex!important;flex-direction:column;gap:6px;padding:10px!important;box-sizing:border-box;container-type:inline-size;container-name:flowcard;height:clamp(520px,calc(100svh - 150px),900px);min-height:0!important;overflow:hidden!important}
      .db-flow-widget.anma-flow-layout:fullscreen{height:100dvh!important;max-height:none!important;width:100vw!important;background:#0c1822}
      .anma-flow-layout .db-flow-side-column{display:flex;flex-direction:column;justify-content:flex-start;align-self:start}
      .anma-flow-layout .db-flow-side-card{flex:0 0 auto}
      .anma-flow-layout .anma-scene-reset{align-self:start}
    `;
    canvas.querySelectorAll(':scope > .db-flow-widget').forEach(card=>card.classList.add('anma-flow-layout'));
    canvas.prepend(flowStyle);
    if(!enabled)return;
    const nav=node('nav','anma-overview-nav');nav.setAttribute('aria-label',uk?'Розділи Energy flows':'Energy flows sections');
    const names=uk?['Схема','Показники','Погода','Графік']:['Flow','Metrics','Weather','Chart'];
    const selected=Number(canvas.dataset.overviewPage)||0;
    const activate=index=>{canvas.dataset.overviewPage=String(index);items.forEach((item,i)=>{item.hidden=i!==index;buttons[i].setAttribute('aria-pressed',String(i===index));});};
    const buttons=items.map((item,i)=>{item.classList.add('anma-overview-panel');const name=item.classList.contains('db-flow-widget')?names[0]:item.classList.contains('db-compact-group')||item.classList.contains('db-compact-metrics')?names[1]:item.className.includes('weather')||item.querySelector('.anma-shared-weather')?names[2]:item.className.includes('chart')?names[3]:item.querySelector('.db-widget-head b')?.textContent||names[i]||String(i+1);const b=node('button','',name);b.type='button';b.onclick=()=>activate(i);nav.append(b);return b;});
    const full=node('button','anma-overview-expand','⛶');full.type='button';full.setAttribute('aria-label',uk?'Energy flows на весь екран':'Energy flows fullscreen');full.onclick=async()=>{if(document.fullscreenElement)await document.exitFullscreen();else await canvas.requestFullscreen();};nav.append(full);
    canvas.prepend(style,nav);activate(Math.min(selected,items.length-1));
  }

  function renderFlowScene(layout,{language='en',demo=false,onMove,onResize,onReset}={}) {
    const graph=flowGraph(layout), uk=language==='uk';
    const el=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
    if(!customElements.get('anma-flow-surface'))customElements.define('anma-flow-surface',class extends HTMLElement{
      connectedCallback(){this._observer=new ResizeObserver(()=>this.fit?.());this._observer.observe(this);}
      disconnectedCallback(){this._observer?.disconnect();}
    });
    const shell=el('anma-flow-surface','anma-scene-scroll'),stage=el('div','anma-scene');
    let profile='desktop';const boxes=[];
    const profileFor=w=>w<600?'mobile':w<1000?'tablet':'desktop';
    const keyFor=node=>node.key.startsWith('battery_')?(layout.batteryStack?.[Number(node.key.slice(8))]?.id ? 'battery:'+layout.batteryStack[Number(node.key.slice(8))].id : node.key):node.key.startsWith('pv_')?(layout.pvFields?.[Number(node.key.slice(3))]?.id ? 'pv:'+layout.pvFields[Number(node.key.slice(3))].id : node.key):node.key;
    const base= new Map(graph.nodes.map(n=>[n.key,{x:n.x,y:n.y}]));
    let reset;
    if(onReset){reset=el('button','anma-scene-reset');reset.type='button';reset.onclick=()=>onReset(profile);shell.append(reset);}

    stage.style.aspectRatio='1000 / '+graph.height;
    const style=el('style');style.textContent=`
      .anma-scene-scroll{display:block;width:100%;min-width:0;container-type:inline-size}
      .anma-scene{position:relative;width:100%;min-width:0;isolation:isolate}
      .anma-scene>svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
      .anma-scene-node{position:absolute;transform:translate(-50%,-50%) scale(var(--node-scale,1));width:min(112px,11.2cqw);min-height:min(86px,8.6cqw);padding:min(9px,.9cqw);border:min(1px,.1cqw) solid var(--node-color,#38bdf8);border-radius:min(12px,1.2cqw);background:#111c29;color:#f1f5f9;text-align:center;box-sizing:border-box;touch-action:none}
      .anma-scene-node strong{display:block;font:600 min(11px,1.1cqw)/1.3 system-ui;overflow-wrap:anywhere}
      .anma-scene-node b{display:block;font:700 min(17px,1.7cqw)/1.4 system-ui}
      .anma-scene-node small{display:block;font:min(10px,1cqw)/1.3 system-ui;color:#a8b9cc;overflow-wrap:anywhere}
      .anma-scene-node[data-key=inverter]{border-radius:50%!important;aspect-ratio:1!important;min-height:min(100px,10cqw);min-width:min(100px,10cqw);background:radial-gradient(circle,#1a2332 0%,#101622 100%)!important;display:flex;flex-direction:column;justify-content:center}
      .anma-scene-path{fill:none;stroke-width:min(3px,.3cqw);vector-effect:non-scaling-stroke;stroke-dasharray:7 12;animation:anma-scene-dash 2s linear infinite}
      .anma-scene-node[data-selected=true]{outline:1px solid #f1873d;z-index:2}
      .anma-node-resize{display:none;position:absolute;right:-6px;bottom:-6px;width:20px;height:20px;padding:0;border:1px solid #111;background:#f1873d;color:#111;border-radius:4px;cursor:nwse-resize;touch-action:none}
      .anma-scene-node[data-selected=true] .anma-node-resize{display:block}
      .anma-scene-reset{background:#172331;color:#eee;border:1px solid #526579;border-radius:6px;padding:7px;margin-bottom:8px;font:12px system-ui;cursor:pointer}
      @container (max-width:600px){.anma-scene-node{display:flex;flex-direction:column;justify-content:center}.anma-scene-node strong,.anma-scene-node small{display:none!important}.anma-scene-node b{color:#fff;white-space:nowrap}}
      @keyframes anma-scene-dash{to{stroke-dashoffset:-38}}
      @media(prefers-reduced-motion:reduce){.anma-scene-path{animation:none}}
    `;
    shell.append(style,stage);
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');stage.append(svg);
    const names=uk?{solar:'Сонце · разом',grid:'Мережа',load:'Будинок',battery:'АКБ · разом',inverter:'Інвертор',generator:'Генератор',ev:'Електромобіль'}:{solar:'Solar · total',grid:'Grid',load:'Home',battery:'Battery · total',inverter:'Inverter',generator:'Generator',ev:'EV charger'};
    const paths=[];
    graph.edges.forEach(edge=>{
      const path=document.createElementNS(svg.namespaceURI,'path');path.classList.add('anma-scene-path');path.dataset.from=edge.from;path.dataset.to=edge.to;
      path.id='anma-flow-'+edge.from;path.setAttribute('stroke',layout.flowColors?.[edge.from]|| (edge.from.startsWith('pv_')?'#f59e0b':'#37c98b'));
      path.style.strokeDasharray=layout.flowStyle==='solid'?'none':layout.flowStyle==='particles'?'1 9':'7 12';
      path.style.strokeLinecap=layout.flowStyle==='particles'?'round':'butt';
      path.style.animationDuration=(2/(Math.max(10,layout.flowSpeedMultiplier||100)/100))+'s';
      const demoPower=({solar:4800,grid:994,load:1060,battery:-55})[edge.from];
      if(demo&&demoPower!==undefined){
        const signed=demoPower*(layout.flowInverted?.[edge.from]?-1:1);
        path.style.animationDuration=api.flowDuration(layout,edge.from,signed)+'s';
        path.style.animationDirection=(edge.from==='load'?signed>=0:signed<0)?'reverse':'normal';
      }else path.style.animationDirection=layout.flowInverted?.[edge.from]?'reverse':'normal';
      path.style.animationPlayState=demo&&layout.motion!==false&&layout.flowStyle!=='solid'?'running':'paused';svg.append(path);paths.push({edge,path});
    });
    const updatePaths=()=>paths.forEach(({edge,path})=>{const a=graph.nodes.find(n=>n.key===edge.from),b=graph.nodes.find(n=>n.key===edge.to);if(a&&b)path.setAttribute('d',`M ${a.x} ${a.y} L ${b.x} ${b.y}`);});
    const getVariant=k=>layout.flowVariants?.[profile]?.[k]
      || layout.flowVariants?.desktop?.[k]
      || layout.flowVariants?.tablet?.[k]
      || layout.flowVariants?.mobile?.[k]
      || {};
    graph.nodes.forEach(node=>{
      const variant=getVariant(keyFor(node));
      if(variant.x!==undefined&&variant.x!==null)node.x=variant.x;
      if(variant.y!==undefined&&variant.y!==null)node.y=variant.y;
      if(variant.scale!==undefined&&variant.scale!==null)node.scale=variant.scale;
      const box=el('div','anma-scene-node');box.dataset.key=node.key;box.style.left=node.x+'%';box.style.top=node.y+'%';box.style.setProperty('--node-scale',node.scale||1);box.style.setProperty('--node-color',layout.flowColors?.[node.kind]||(node.kind==='pv'?'#f59e0b':'#37c98b'));
      const device=node.kind==='inverter'?(layout.devices||[]).find(isReceiver):(layout.devices||[]).find(d=>d.role===node.kind);
      const photo=(device&&layout.deviceImages?.[device.id])||layout.deviceImages?.[node.kind]||layout.deviceImages?.[node.key];
      if(photo){const image=el('img');image.src=photo;image.alt='';image.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;z-index:-1;pointer-events:none';image.style.opacity=(layout.photoOpacity||50)/100;box.append(image);}
      box.append(el('strong','',node.measurements?node.name:device?.customName||device?.name||(node.name!==defaultFlowNodes[node.key]?.label?node.name:names[node.key])));
      if(node.measurements){
        node.measurements.forEach((m,j)=>{const val=el(j===0?'b':'small','','—');val.id='anma-detail-'+node.index+'-'+j;val.title=m.sensor||m.unit;box.append(val);});
        box.title=node.subtitle||node.name;
      }else{
        const val=el('b','',demo?({solar:'4.8 kW',grid:'994 W',load:'1.06 kW',battery:'88%',inverter:'70 W'})[node.key]||'—':'—');val.id='anma-val-'+node.key;box.append(val);
        const sub=el('small','','—');sub.id=node.key==='load'?'anma-frequency':node.key==='inverter'?'anma-inverter-state':'anma-sub-'+node.key;box.append(sub);
      }
      box.title=box.title||box.querySelector('strong')?.textContent||node.key;
      box.setAttribute('aria-label',box.title);
      const clamp=()=>{
        box.style.left=node.x+'%';box.style.top=node.y+'%';box.style.setProperty('--node-scale',node.scale||1);
        const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
        node.scale=Math.min(node.scale||1,w/Math.max(1,box.offsetWidth),h/Math.max(1,box.offsetHeight));
        const mx=box.offsetWidth*node.scale/2/w*100,my=box.offsetHeight*node.scale/2/h*100;
        node.x=Math.max(mx,Math.min(100-mx,node.x));node.y=Math.max(my,Math.min(100-my,node.y));
        box.style.left=node.x+'%';box.style.top=node.y+'%';box.style.setProperty('--node-scale',node.scale);
      };
      boxes.push({node,box,clamp});
      if(onMove){
        const select=()=>{boxes.forEach(b=>b.box.dataset.selected=String(b.box===box));};
        box.style.cursor='grab';box.tabIndex=0;box.addEventListener('click',select);
        const drag=(e,resizing)=>{
          if(e.button!==0)return;e.preventDefault();e.stopPropagation();select();
          const target=e.currentTarget;target.setPointerCapture(e.pointerId);
          const rect=stage.getBoundingClientRect(),start={x:e.clientX,y:e.clientY,nx:node.x,ny:node.y,scale:node.scale||1};let moved=false;
          const move=event=>{
            const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.hypot(dx,dy)<3&&!moved)return;moved=true;
            if(resizing)node.scale=Math.max(.6,Math.min(4,start.scale+2*Math.max(dx,dy)/Math.max(1,box.offsetWidth)));
            else{node.x=start.nx+dx/rect.width*100;node.y=start.ny+dy/rect.height*100;}
            clamp();updatePaths();
          };
          const end=()=>{target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',end);target.removeEventListener('pointercancel',end);if(moved)(resizing?onResize:onMove)?.(keyFor(node),{x:node.x,y:node.y,scale:node.scale||1},profile);};
          target.addEventListener('pointermove',move);target.addEventListener('pointerup',end);target.addEventListener('pointercancel',end);
        };
        box.onpointerdown=e=>drag(e,false);
        if(onResize){const handle=el('button','anma-node-resize','↘');handle.type='button';handle.setAttribute('aria-label',uk?'Змінити розмір вузла':'Resize node');handle.onpointerdown=e=>drag(e,true);handle.onclick=e=>e.stopPropagation();handle.ondblclick=e=>e.stopPropagation();box.append(handle);}
      }
      stage.append(box);
    });
    shell.fit=()=>{
      const w=shell.clientWidth;
      profile=w?profileFor(w):(layout.viewMode||'desktop');shell.dataset.profile=profile;
      if(reset)reset.textContent=(uk?'Скинути зміни: ':'Reset changes: ')+({mobile:uk?'телефон':'phone',tablet:uk?'планшет':'tablet',desktop:uk?'комп’ютер':'desktop'})[profile];
      boxes.forEach(({node,box,clamp})=>{
        const variant=layout.flowVariants?.[profile]?.[keyFor(node)]
          || layout.flowVariants?.desktop?.[keyFor(node)]
          || layout.flowVariants?.tablet?.[keyFor(node)]
          || layout.flowVariants?.mobile?.[keyFor(node)]
          || {};
        const original=base.get(node.key);node.x=variant.x??original.x;node.y=variant.y??original.y;node.scale=variant.scale||1;clamp();
      });updatePaths();
    };
    updatePaths();return shell;
  }


  // Independent gallery instances. Depth is bounded to one group level.
  const elementTypes = ['circle','tile','gauge','text','group'];
  function normalizeElements(raw, child=false, seen=new Set()) {
    const text=v=>String(v??'').slice(0,160);
    const color=(v,f)=>/^#[0-9a-f]{6}$/i.test(v)?v:f;
    const num=(v,f,min,max)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):f;
    return (Array.isArray(raw)?raw:[]).slice(0,child?10:100).filter(e=>e&&elementTypes.includes(e.type)&&(!child||e.type!=='group')).map(e=>{
      let id=/^el-[\w-]{1,90}$/.test(e.id)?e.id:'el-'+Math.random().toString(36).slice(2);
      while(seen.has(id))id='el-'+Math.random().toString(36).slice(2);
      seen.add(id);
      return {id,type:e.type,title:text(e.title),icon:text(e.icon),entity:/^[a-z_]+\.[a-zA-Z0-9_]+$/.test(e.entity)?e.entity:'',unit:text(e.unit),
        color:color(e.color,'#f59e0b'),background:color(e.background,'#141e29'),opacity:num(e.opacity,100,0,100),
        image:typeof e.image==='string'&&e.image.length<750000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(e.image)?e.image:'',
        imageOpacity:num(e.imageOpacity,20,0,100),showTitle:e.showTitle!==false,min:num(e.min,0,-1e9,1e9),max:num(e.max,100,-1e9,1e9),
        columns:Math.round(num(e.columns,4,1,10)),children:e.type==='group'?normalizeElements(e.children,true,seen):[]};
    });
  }
  function newElement(type) {return normalizeElements([{type,title:type,icon:'',children:[]}])[0];}
  function renderElements(elements,{states={},onSelect}={}) {
    const root=document.createElement('div');root.className='anma-elements';root.style.gridColumn='1 / -1';
    const style=document.createElement('style');style.textContent=`
      .anma-elements{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(160px,100%),1fr));gap:14px;min-width:0;width:100%;box-sizing:border-box}
      .anma-element{position:relative;isolation:isolate;box-sizing:border-box;min-width:0;padding:18px;border:1px solid var(--element-color);border-radius:18px;color:#f1f5f9;text-align:center;font:14px system-ui;overflow:hidden;display:flex;flex-direction:column;justify-content:center;gap:9px}
      .anma-element[data-type=circle]{border-radius:50%;aspect-ratio:1;min-height:150px;width:100%;max-width:220px;justify-self:center}
      .anma-element[data-type=group]{grid-column:1/-1;text-align:left;border-top-width:3px}
      .anma-element-bg,.anma-element-photo{position:absolute;inset:0;z-index:-1;pointer-events:none;background-position:center;background-size:cover}
      .anma-element strong{font-size:24px;overflow-wrap:anywhere}.anma-element-title{overflow-wrap:anywhere;font-weight:650}.anma-element-icon{font-size:26px;color:var(--element-color)}
      .anma-element-children{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(140px,100%),1fr));gap:12px;width:100%;min-width:0}
      .anma-element meter{width:100%;accent-color:var(--element-color)}
      .anma-element[role=button]{cursor:pointer}.anma-element:focus-visible{outline:3px solid #38bdf8;outline-offset:2px}
    `;root.append(style);
    const build=e=>{
      const box=document.createElement('section');box.className='anma-element';box.dataset.elementId=e.id;box.dataset.type=e.type;box.style.setProperty('--element-color',e.color);
      const bg=document.createElement('div');bg.className='anma-element-bg';bg.style.background=e.background;bg.style.opacity=e.opacity/100;box.append(bg);
      if(e.image){const photo=document.createElement('div');photo.className='anma-element-photo';photo.style.backgroundImage=`url("${e.image}")`;photo.style.opacity=e.imageOpacity/100;box.append(photo);}
      if(e.icon){const icon=document.createElement('span');icon.className='anma-element-icon';icon.textContent=e.icon;box.append(icon);}
      if(e.showTitle){const title=document.createElement('div');title.className='anma-element-title';title.textContent=e.title;box.append(title);}
      const state=states[e.entity];const available=state&&!['unknown','unavailable'].includes(state.state);
      if(!['text','group'].includes(e.type)||e.entity){const value=document.createElement('strong');value.textContent=available?String(state.state)+' '+(e.unit||state.attributes?.unit_of_measurement||''):'—';box.append(value);}
      if(e.type==='gauge'){const meter=document.createElement('meter');meter.min=e.min;meter.max=Math.max(e.min+1,e.max);meter.value=available?Number(state.state)||0:e.min;box.append(meter);}
      if(e.type==='group'){const children=document.createElement('div');children.className='anma-element-children';children.style.gridTemplateColumns=`repeat(auto-fit,minmax(min(100%,max(140px,calc((100% - ${(e.columns-1)*12}px) / ${e.columns}))),1fr))`;e.children.forEach(c=>children.append(build(c)));box.append(children);}
      if(onSelect){box.tabIndex=0;box.setAttribute('role','button');box.setAttribute('aria-label',e.title||e.type);box.onclick=event=>{event.stopPropagation();onSelect(e.id);};box.onkeydown=event=>{if(event.target===box&&['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();onSelect(e.id);}};}
      return box;
    };
    normalizeElements(elements).forEach(e=>root.append(build(e)));return root;
  }


  // One chart renderer for Studio and HA. Values are kW; null means a real gap.
  function renderEnergyChart({config={},uk=false,demo=false,onRange=()=>{},onSeries=()=>{}}={}) {
    const node=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;};
    const card=node('section','db-card-chart db-widget-box anma-energy-chart');card.dataset.shape=config.shape||'rounded';
    const accent=/^#[0-9a-f]{3,8}$/i.test(config.accent||'')?config.accent:'#ff8730';
    const style=node('style');style.textContent=`.anma-energy-chart{min-width:0;padding:16px;border:1px solid #263747;border-radius:16px;background:var(--card-bg,#0e1822);color:var(--text-main,#eef3f8);font-family:inherit}.anma-energy-chart *{box-sizing:border-box}.anma-energy-chart .anma-chart-tabs{display:flex;flex-wrap:wrap;gap:4px;background:#151f2b;border:1px solid #263747;border-radius:8px;padding:3px;margin:10px 0}.anma-energy-chart button{font:inherit;cursor:pointer;color:inherit}.anma-energy-chart .anma-chart-tabs button{border:0;background:transparent;padding:6px 12px;border-radius:5px;font-size:11px;color:#91a1b5}.anma-energy-chart .anma-chart-tabs button.active{background:${accent};color:#09131c;font-weight:700}.anma-chart-plot{position:relative;width:100%;height:150px;touch-action:pan-y}.anma-chart-plot svg{display:block;width:100%;height:100%;overflow:visible}.anma-chart-tooltip{position:absolute;pointer-events:none;z-index:5;max-width:230px;background:#101923f5;border:1px solid #435365;border-radius:9px;padding:10px;font-size:11px;line-height:1.8;box-shadow:0 4px 15px #0006;white-space:pre-line}.anma-chart-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.anma-chart-legend button{display:flex;align-items:center;gap:6px;border:1px solid #44505b;background:#ffffff09;border-radius:20px;padding:6px 10px;font-size:11px}.anma-chart-legend button[aria-pressed=false]{opacity:.4;text-decoration:line-through;border-style:dashed}.anma-chart-legend i{width:9px;height:9px;border-radius:3px}.anma-chart-message{font-size:11px;color:#9aaabd;min-height:16px}.anma-energy-chart[data-shape=square]{border-radius:0}`;card.append(style);
    const title=node('b','',config.title||(uk?'Графік потужності':'Power analytics'));title.style.color='#ff8730';card.append(title);
    const tabs=node('div','anma-chart-tabs');card.append(tabs);
    let range=config.range||'24h', data={},active={solar:true,battery:true,load:true,self:true,...config.activeSeries};
    const series=[['solar',uk?'Сонце':'Solar',accent],['battery',uk?'Акумулятор':'Battery','#37c98b'],['load',uk?'Споживання':'Consumption','#38bdf8'],['self',uk?'Самоспоживання':'Self-use','#a78bfa']];
    const plot=node('div','anma-chart-plot'),message=node('div','anma-chart-message'),legend=node('div','anma-chart-legend');card.append(plot,message,legend);
    const ns='http://www.w3.org/2000/svg';const svgNode=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
    const fmt=v=>v===null||v===undefined?'—':v.toLocaleString(uk?'uk-UA':'en-US',{maximumFractionDigits:2})+' kW';
    const buttons={};
    function draw(){
      plot.replaceChildren();legend.replaceChildren();
      const svg=svgNode('svg',{viewBox:'0 0 1000 150',preserveAspectRatio:'none',role:'img','aria-label':uk?'Графік потужності ANMA':'ANMA power chart'});plot.append(svg);
      const points=series.filter(([k])=>active[k]).flatMap(([k])=>data[k]||[]).filter(p=>Number.isFinite(p.v));
      const all=Object.values(data).flat();const start=Math.min(...all.map(p=>p.t)),end=Math.max(...all.map(p=>p.t));
      const lo=Math.min(0,...points.map(p=>p.v)),hi=Math.max(1,...points.map(p=>p.v));
      const x=t=>10+980*(t-start)/(end-start||1),y=v=>132-120*(v-lo)/(hi-lo||1);
      [0,.5,1].forEach(f=>svg.append(svgNode('line',{x1:10,x2:990,y1:12+120*f,y2:12+120*f,stroke:'#344352','stroke-opacity':'.4','stroke-dasharray':'4 7'})));
      const defs=svgNode('defs',{}),grad=svgNode('linearGradient',{id:'anma-solar-fill-'+(++renderEnergyChart.uid),x1:0,y1:0,x2:0,y2:1});grad.append(svgNode('stop',{offset:'0%','stop-color':accent,'stop-opacity':'.28'}),svgNode('stop',{offset:'100%','stop-color':accent,'stop-opacity':'0'}));defs.append(grad);svg.append(defs);
      for(const [key,label,color] of series){
        const values=data[key]||[];let segment=[];const flush=()=>{if(!segment.length)return;const d=segment.map((p,i)=>(i?'L':'M')+x(p.t)+','+y(p.v)).join(' ');if(key==='solar'&&segment.length>1)svg.append(svgNode('path',{d:d+' L'+x(segment.at(-1).t)+','+y(0)+' L'+x(segment[0].t)+','+y(0)+' Z',fill:'url(#'+grad.id+')'}));svg.append(svgNode('path',{d,fill:'none',stroke:color,'stroke-width':key==='solar'?2.8:1.8,'vector-effect':'non-scaling-stroke','stroke-dasharray':['battery','load'].includes(key)?'5 5':'none','data-series':key}));segment=[];};
        if(active[key]){for(const p of values){if(Number.isFinite(p.v))segment.push(p);else flush();}flush();}
        const b=node('button','');b.type='button';b.dataset.series=key;b.setAttribute('aria-pressed',String(active[key]));const dot=node('i');dot.style.background=color;b.title=label;b.setAttribute('aria-label',label+': '+fmt(values.at(-1)?.v));b.append(dot,node('span','anma-chart-series-name',label+':'),node('span','anma-chart-series-value',fmt(values.at(-1)?.v)));b.onclick=()=>{active[key]=!active[key];onSeries({...active});draw();};legend.append(b);
      }
      const tip=node('div','anma-chart-tooltip');tip.hidden=true;plot.append(tip);const line=svgNode('line',{x1:0,x2:0,y1:0,y2:140,stroke:'#aabbcc','stroke-dasharray':'3 4',visibility:'hidden'});svg.append(line);
      plot.onpointermove=e=>{if(!all.length)return;const rect=plot.getBoundingClientRect(),fraction=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)),time=start+fraction*(end-start);tip.replaceChildren(node('b','',new Date(time).toLocaleString(uk?'uk-UA':'en-US')));for(const [key,label,color] of series){if(!active[key]||!data[key]?.length)continue;const nearest=data[key].reduce((a,b)=>Math.abs(a.t-time)<Math.abs(b.t-time)?a:b),row=node('div'),dot=node('i'),value=node('b','',fmt(nearest.v));row.style.cssText='display:flex;align-items:center;gap:6px;justify-content:space-between';dot.style.cssText='width:7px;height:7px;border-radius:50%;flex:none;background:'+color;row.append(dot,node('span','',label),value);tip.append(row);}tip.hidden=false;tip.style.left=Math.max(0,Math.min(rect.width-230,fraction*rect.width+12))+'px';tip.style.top='0';line.setAttribute('x1',fraction*1000);line.setAttribute('x2',fraction*1000);line.setAttribute('visibility','visible');};plot.onpointerleave=()=>{tip.hidden=true;line.setAttribute('visibility','hidden');};
    }
    const updateTabs=()=>{if(!config.title)title.textContent=(uk?{'24h':'Добовий графік потужності (24 год)','7d':'Графік за 7 днів','14d':'Графік за 14 днів','30d':'Місячний графік (30 днів)',year:'Річний графік потужності',years:'Потужність за роками'}:{'24h':'24h Power Analytics','7d':'7-Day Power History','14d':'14-Day Power History','30d':'Monthly Power History',year:'Annual Power History',years:'Multi-Year Power History'})[range];Object.entries(buttons).forEach(([k,b])=>{b.classList.toggle('active',k===range);b.setAttribute('aria-pressed',String(k===range));});};
    for(const [key,label] of [['24h',uk?'24 год':'24h'],['7d',uk?'7 днів':'7d'],['14d',uk?'14 днів':'14d'],['30d',uk?'30 днів':'30d'],['year',uk?'Рік':'Year'],['years',uk?'По роках':'Years']]){const b=node('button','',label);b.type='button';b.dataset.range=key;b.onclick=()=>{range=key;updateTabs();if(demo)sample();onRange(key);};buttons[key]=b;tabs.append(b);}
    card.setChartData=(next={},status='')=>{data=next;message.textContent=status;draw();};
    function sample(){const n=range==='24h'?25:range==='year'?12:range==='years'?5:parseInt(range),end=Date.now(),step=range==='24h'?3600000:range==='year'?30*86400000:range==='years'?365*86400000:86400000;const result={solar:[],battery:[],load:[],self:[]};for(let i=0;i<n;i++){const t=end-(n-1-i)*step,s=Math.max(0,Math.sin((i/(n-1)*1.6-.3)*Math.PI))*4.8;result.solar.push({t,v:s});result.load.push({t,v:1.6+Math.sin(i)*.5});result.battery.push({t,v:1+Math.sin(i/3)*.8});result.self.push({t,v:Math.min(s,2.4)});}card.setChartData(result,uk?'Демонстраційні дані':'Demonstration data');}
    updateTabs();if(demo)sample();else draw();return card;
  }
  renderEnergyChart.uid=0;
  const solarDays = [
    { dayUk: 'Сьогодні', dayEn: 'Today', date: '05.10', icon: '☀️', condUk: 'Ясно', condEn: 'Clear', kwh: 28.4, peakKw: 5.4, hours: 8.5 },
    { dayUk: 'Завтра', dayEn: 'Tomorrow', date: '06.10', icon: '🌤', condUk: 'Малохмарно', condEn: 'Few clouds', kwh: 27.8, peakKw: 5.2, hours: 8.2 },
    { dayUk: 'Середа', dayEn: 'Wed', date: '07.10', icon: '⛅', condUk: 'Мінлива хмарність', condEn: 'Partly cloudy', kwh: 18.2, peakKw: 3.8, hours: 5.4 },
    { dayUk: 'Четвер', dayEn: 'Thu', date: '08.10', icon: '☀️', condUk: 'Сонячно / Пік', condEn: 'Sunny / Peak', kwh: 31.5, peakKw: 5.8, hours: 9.1 },
    { dayUk: "П'ятниця", dayEn: 'Fri', date: '09.10', icon: '🌦', condUk: 'Короткочасний дощ', condEn: 'Showers', kwh: 14.6, peakKw: 3.1, hours: 4.2 },
    { dayUk: 'Субота', dayEn: 'Sat', date: '10.10', icon: '⛅', condUk: 'Хмарно з проясн.', condEn: 'Scattered clouds', kwh: 24.0, peakKw: 4.8, hours: 7.3 },
    { dayUk: 'Неділя', dayEn: 'Sun', date: '11.10', icon: '☀️', condUk: 'Ясно / Висока', condEn: 'High radiation', kwh: 29.2, peakKw: 5.5, hours: 8.8 }
  ];

  function renderSolarForecastSection({ kind, layout, uk, demo, accent, el, change }) {
    const section = el('div', 'db-solar-forecast-section');
    const cfg = layout.widgetConfigs?.[kind] || {};
    const forecastDays = Math.min(7, Math.max(1, Number(cfg.gridColumns || cfg.forecastDays) || 7));

    // Top control bar: Title & Days Selector Pills (1..7)
    const topBar = el('div', 'db-forecast-top-bar');
    const titleBox = el('div', 'db-forecast-title-box');
    titleBox.innerHTML = `<span class="db-forecast-sun-icon">☀️</span><b>${uk ? 'Прогноз сонячної генерації (до 7 днів)' : 'Solar Generation Forecast (up to 7 days)'}</b>`;

    const pillsWrap = el('div', 'db-forecast-pills');
    const dayCounts = [1, 2, 3, 4, 5, 6, 7];

    dayCounts.forEach(count => {
      const pill = el('button', 'db-forecast-pill' + (count === forecastDays ? ' active' : ''));
      pill.type = 'button';
      pill.textContent = count + (uk ? 'д' : 'd');
      pill.title = (uk ? `Показати прогноз на ${count} дн.` : `Show ${count}-day forecast`);
      if (count === forecastDays) {
        pill.style.background = accent;
        pill.style.borderColor = accent;
      }
      pill.onclick = (e) => {
        e.stopPropagation();
        if (!layout.widgetConfigs[kind]) layout.widgetConfigs[kind] = {};
        layout.widgetConfigs[kind].forecastDays = count;
        layout.widgetConfigs[kind].gridColumns = count;
        if (change) change();
      };
      pillsWrap.append(pill);
    });

    topBar.append(titleBox, pillsWrap);

    // KPI Summary Bar
    const activeDays = solarDays.slice(0, forecastDays);
    const totalKwh = activeDays.reduce((acc, d) => acc + (demo ? d.kwh : 0), 0).toFixed(1);
    const avgKwh = forecastDays > 0 ? (totalKwh / forecastDays).toFixed(1) : '0.0';
    const bestDay = [...activeDays].sort((a, b) => b.kwh - a.kwh)[0] || activeDays[0];

    const kpiBar = el('div', 'db-forecast-kpi-bar');
    kpiBar.innerHTML = `
      <div class="db-forecast-kpi-item">
        <span>${uk ? 'Прогноз на ' + forecastDays + ' дн.' : forecastDays + '-day forecast'}</span>
        <b>${demo ? totalKwh + ' kWh' : '—'}</b>
      </div>
      <div class="db-forecast-kpi-item">
        <span>${uk ? 'Середньодобово' : 'Daily avg'}</span>
        <b>${demo ? avgKwh + ' kWh/д' : '—'}</b>
      </div>
      <div class="db-forecast-kpi-item">
        <span>${uk ? 'Найкращий день' : 'Best day'}</span>
        <b style="color:${accent}">${demo ? (uk ? bestDay.dayUk : bestDay.dayEn) + ' (' + bestDay.kwh + ' kWh)' : '—'}</b>
      </div>
    `;

    // Cards grid
    const grid = el('div', 'db-forecast-grid');
    grid.style.setProperty('--forecast-cols', forecastDays);

    activeDays.forEach((d, idx) => {
      const dayCard = el('div', 'db-forecast-day-card' + (idx === 0 ? ' is-today' : ''));
      const barHeightPct = demo ? Math.min(100, Math.max(14, Math.round((d.kwh / 35) * 100))) : 0;

      dayCard.innerHTML = `
        <div class="db-fday-header">
          <span class="db-fday-title">${uk ? d.dayUk : d.dayEn}</span>
          <span class="db-fday-date">${d.date}</span>
        </div>
        <div class="db-fday-icon-row">
          <span class="db-fday-icon">${d.icon}</span>
          <span class="db-fday-cond">${uk ? d.condUk : d.condEn}</span>
        </div>
        <div class="db-fday-kwh">
          <b>${demo ? d.kwh : '—'}</b>
          <small>kWh</small>
        </div>
        <div class="db-fday-bar-track">
          <div class="db-fday-bar-fill" style="height:${barHeightPct}%; background: linear-gradient(to top, #f59e0b, ${accent});"></div>
        </div>
        <div class="db-fday-footer">
          <span>⚡ ${demo ? d.peakKw + ' kW' : '—'}</span>
          <span>⏱ ${demo ? d.hours + 'h' : '—'}</span>
        </div>
      `;
      grid.append(dayCard);
    });

    section.append(topBar, kpiBar, grid);
    return section;
  }


  // NOAA solar declination/hour-angle approximation; full daylight, not sunshine or time remaining.
  function daylightHours(latitude, date=new Date(), timeZone='UTC') {
    if(latitude===undefined||latitude===null||latitude===''||!Number.isFinite(Number(latitude))||Math.abs(Number(latitude))>90)return null;
    let parts;try{parts=new Intl.DateTimeFormat('en-US',{timeZone:timeZone||'UTC',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(date);}catch(_){return null;}
    const v=Object.fromEntries(parts.map(p=>[p.type,p.value]));const year=Number(v.year),start=Date.UTC(year,0,1),days=(Date.UTC(year+1,0,1)-start)/86400000;
    const day=(Date.UTC(year,Number(v.month)-1,Number(v.day))-start)/86400000;
    const g=2*Math.PI*day/days,d=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
    const lat=Number(latitude)*Math.PI/180,c=(Math.cos(90.833*Math.PI/180)-Math.sin(lat)*Math.sin(d))/(Math.cos(lat)*Math.cos(d));
    return c<=-1?24:c>=1?0:Number((24*Math.acos(c)/Math.PI).toFixed(2));
  }
  const weatherStyles="/* Weather Card */\n.db-card-weather {\n  grid-column: 1 / -1;\n  background: #0f1722;\n}\n.db-weather-body {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));\n  gap: 16px;\n  align-items: center;\n  margin-top: 10px;\n}\n.db-weather-sun-box {\n  display: flex;\n  align-items: center;\n  gap: 14px;\n  min-width: 0;\n}\n.db-sun-arc {\n  width: 120px;\n  height: 64px;\n  flex-shrink: 0;\n}\n.db-sun-metrics {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  min-width: 0;\n}\n.db-sun-stat span {\n  font-size: 10px;\n  color: #64748b;\n  display: block;\n  white-space: nowrap;\n}\n.db-sun-stat b {\n  font-size: 13px;\n  color: #fff;\n  font-weight: 750;\n  white-space: nowrap;\n}\n.db-weather-rain-box {\n  border-left: 1px solid #1e293b;\n  padding-left: 16px;\n  min-width: 0;\n}\n.db-rain-header {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  margin-bottom: 12px;\n  min-width: 0;\n}\n.db-rain-icon { font-size: 26px; flex-shrink: 0; }\n.db-rain-header b { display: block; font-size: 13px; color: #fff; }\n.db-rain-header small { display: block; font-size: 10px; color: #64748b; margin-top: 2px; }\n.db-solar-estimate-bar .db-estimate-label {\n  display: flex;\n  justify-content: space-between;\n  gap: 8px;\n  font-size: 11px;\n  margin-bottom: 5px;\n}\n.db-solar-estimate-bar .db-estimate-label span { color: #64748b; }\n.db-solar-estimate-bar .db-estimate-label b { color: var(--accent, var(--brand)); white-space: nowrap; }\n.db-progress-track {\n  height: 6px;\n  background: #1c2736;\n  border-radius: 4px;\n  overflow: hidden;\n}\n.db-progress-track span {\n  display: block;\n  height: 100%;\n  background: linear-gradient(90deg, #f59e0b, #e11d48);\n  border-radius: 4px;\n}\n\n/* Container Queries for Weather Card Adaptation */\n@container card (max-width: 540px) {\n  .db-weather-body {\n    grid-template-columns: 1fr;\n    gap: 12px;\n  }\n  .db-weather-rain-box {\n    border-left: none;\n    border-top: 1px solid #1e293b;\n    padding-left: 0;\n    padding-top: 12px;\n  }\n  .db-weather-sun-box {\n    gap: 10px;\n  }\n  .db-sun-arc {\n    width: 100px;\n    height: 54px;\n  }\n}\n\n@container card (max-width: 380px) {\n  .db-weather-sun-box {\n    flex-direction: column;\n    align-items: flex-start;\n    gap: 8px;\n  }\n  .db-sun-arc {\n    width: 90px;\n    height: 48px;\n    margin: 0 auto;\n  }\n  .db-sun-metrics {\n    width: 100%;\n    flex-direction: row;\n    justify-content: space-between;\n    flex-wrap: wrap;\n    gap: 4px 10px;\n  }\n}\n\n/* Solar Generation Forecast (\u0434\u043e 7 \u0434\u043d\u0456\u0432) */\n.db-solar-forecast-section {\n  margin-top: 14px;\n  padding-top: 12px;\n  border-top: 1px solid rgba(255, 255, 255, 0.08);\n}\n.db-forecast-top-bar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  flex-wrap: wrap;\n  gap: 10px;\n  margin-bottom: 10px;\n}\n.db-forecast-title-box {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 11px;\n}\n.db-forecast-title-box b {\n  color: #fff;\n  font-weight: 700;\n}\n.db-forecast-pills {\n  display: flex;\n  gap: 4px;\n  background: rgba(0, 0, 0, 0.3);\n  padding: 3px 4px;\n  border-radius: 8px;\n  border: 1px solid rgba(255, 255, 255, 0.08);\n}\n.db-forecast-pill {\n  padding: 2px 7px;\n  font-size: 10px;\n  border: 1px solid transparent;\n  background: transparent;\n  color: #94a3b8;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.15s ease;\n  font-weight: 600;\n}\n.db-forecast-pill:hover {\n  color: #fff;\n  background: rgba(255, 255, 255, 0.08);\n}\n.db-forecast-pill.active {\n  color: #fff !important;\n  font-weight: 800;\n  box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);\n}\n.db-forecast-kpi-bar {\n  display: flex;\n  gap: 12px;\n  background: rgba(245, 158, 11, 0.06);\n  border: 1px solid rgba(245, 158, 11, 0.2);\n  border-radius: 8px;\n  padding: 7px 12px;\n  margin-bottom: 12px;\n  flex-wrap: wrap;\n}\n.db-forecast-kpi-item {\n  font-size: 10px;\n  display: flex;\n  align-items: center;\n  gap: 6px;\n}\n.db-forecast-kpi-item span {\n  color: #94a3b8;\n}\n.db-forecast-kpi-item b {\n  color: #fff;\n  font-size: 11px;\n}\n\n.db-forecast-grid {\n  display: grid;\n  grid-template-columns: repeat(var(--forecast-cols, 7), minmax(0, 1fr));\n  gap: 8px;\n  width: 100%;\n}\n\n@container card (max-width: 620px) {\n  .db-forecast-top-bar {\n    flex-direction: column;\n    align-items: flex-start;\n    gap: 6px;\n  }\n  .db-forecast-grid {\n    grid-template-columns: repeat(auto-fit, minmax(70px, 1fr)) !important;\n    gap: 6px;\n  }\n}\n\n@container card (max-width: 440px) {\n  .db-forecast-grid {\n    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)) !important;\n    gap: 4px;\n  }\n  .db-forecast-day-card {\n    padding: 6px 3px;\n  }\n  .db-fday-cond {\n    display: none;\n  }\n  .db-fday-footer {\n    display: none;\n  }\n  .db-fday-bar-track {\n    height: 28px;\n  }\n}\n.db-forecast-day-card {\n  background: #111925;\n  border: 1px solid #1e2a3a;\n  border-radius: 10px;\n  padding: 8px 6px;\n  text-align: center;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  position: relative;\n  transition: transform 0.15s ease, border-color 0.15s ease;\n}\n.db-forecast-day-card:hover {\n  border-color: rgba(245, 158, 11, 0.5);\n  transform: translateY(-2px);\n}\n.db-forecast-day-card.is-today {\n  border-color: rgba(245, 158, 11, 0.4);\n  background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, #111925 100%);\n}\n.db-fday-header {\n  display: flex;\n  flex-direction: column;\n  margin-bottom: 4px;\n}\n.db-fday-title {\n  font-size: 10px;\n  font-weight: 750;\n  color: #fff;\n}\n.db-fday-date {\n  font-size: 8.5px;\n  color: #64748b;\n}\n.db-fday-icon-row {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 2px;\n  margin: 4px 0;\n}\n.db-fday-icon {\n  font-size: 20px;\n  line-height: 1;\n}\n.db-fday-cond {\n  font-size: 8px;\n  color: #94a3b8;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  max-width: 70px;\n}\n.db-fday-kwh {\n  margin: 4px 0;\n}\n.db-fday-kwh b {\n  font-size: 13px;\n  color: #f59e0b;\n  font-weight: 800;\n}\n.db-fday-kwh small {\n  font-size: 8px;\n  color: #94a3b8;\n  margin-left: 2px;\n}\n.db-fday-bar-track {\n  width: 100%;\n  max-width: 32px;\n  height: 40px;\n  background: rgba(255, 255, 255, 0.06);\n  border-radius: 4px;\n  display: flex;\n  align-items: flex-end;\n  padding: 2px;\n  margin: 4px 0;\n}\n.db-fday-bar-fill {\n  width: 100%;\n  border-radius: 3px;\n  min-height: 4px;\n  box-shadow: 0 0 6px rgba(245, 158, 11, 0.3);\n  transition: height 0.3s ease;\n}\n.db-fday-footer {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  font-size: 8px;\n  color: #64748b;\n  margin-top: 4px;\n}\n\n\n.anma-shared-weather{min-width:0;padding:16px;border:1px solid var(--border,#263747);border-radius:16px;background:var(--card-bg,#0e1822)}.anma-shared-weather .db-widget-head{display:flex;justify-content:space-between;gap:8px}.anma-shared-weather .db-widget-head b,.anma-shared-weather .db-forecast-title-box b{color:#ff8730}.anma-shared-weather .db-forecast-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,90px),1fr))!important}.anma-shared-weather button{font:inherit;cursor:pointer}.anma-shared-weather .db-forecast-top-bar{flex-wrap:wrap}.anma-shared-weather .db-forecast-pills{flex-wrap:wrap}.anma-shared-weather .db-sun-stat b{overflow-wrap:anywhere}";
  function renderWeather(kind,layout,{uk=false,demo=false,read=()=>null,change=()=>{}}={}) {
    const el=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls||'';if(text!==undefined)e.textContent=text;return e;};
    const shape=layout.widgetConfigs?.[kind]?.shape||'rounded',accent=layout.widgetConfigs?.[kind]?.accent||'#38bdf8';
      const card = el('section', 'db-card-weather db-widget-box');
      card.dataset.shape = shape;
      card.style.setProperty('--card-accent', accent);
      const weatherCfg=layout.widgetConfigs?.[kind]||{};
      card.dataset.size = weatherCfg.size || 'full';
      if (weatherCfg.autoFit) {
        card.style.gridColumn = 'auto / -1';
      } else if (weatherCfg.size === '2x1') {
        card.style.gridColumn = 'span 2';
      } else if (weatherCfg.size === '1x1') {
        card.style.gridColumn = 'span 1';
      } else if (weatherCfg.size === '2x2') {
        card.style.gridColumn = 'span 2';
        card.style.gridRow = 'span 2';
      } else {
        card.style.gridColumn = '1 / -1';
      }
      if(weatherCfg.backgroundImage && /^data:image\/(png|jpeg|webp);base64,/.test(weatherCfg.backgroundImage)) {
        card.style.backgroundImage=`linear-gradient(rgba(7,17,28,${1-(Number(weatherCfg.backgroundOpacity??18)/100)}),rgba(7,17,28,${1-(Number(weatherCfg.backgroundOpacity??18)/100)})),url("${weatherCfg.backgroundImage}")`;
        card.style.backgroundSize='cover';card.style.backgroundPosition='center';
      }

      const head = el('div', 'db-widget-head');
      const cardTitle = kind === 'solar_forecast'
        ? (uk ? '☀️ Прогноз сонячної генерації (до 7 днів)' : '☀️ Solar Yield Forecast (up to 7 Days)')
        : (uk ? '🌤 Погода та сонячний прогноз' : '🌤 Solar & Weather Forecast');

      head.append(
        el('b', '', layout.widgetConfigs?.[kind]?.title||cardTitle),
        el('small', '', weatherCfg.subtitle || (demo ? (uk ? 'ДЕМО-МОДЕЛЮВАННЯ' : 'DEMO FORECAST') : (uk ? 'Очікує сенсор' : 'Awaiting sensor')))
      );

      const body = el('div', 'db-weather-body');
      if (kind === 'weather') {
        const sunBox = el('div', 'db-weather-sun-box');
        const sunSvg = `<svg class="db-sun-arc" viewBox="0 0 160 85" aria-hidden="true">
          <path d="M 15 75 A 65 65 0 0 1 145 75" fill="none" stroke="rgba(241,135,61,0.25)" stroke-width="4" stroke-dasharray="3 3"/>
          <path d="M 15 75 A 65 65 0 0 1 100 24" fill="none" stroke="${accent}" stroke-width="4"/>
          <circle cx="100" cy="24" r="8" fill="#f59e0b" filter="drop-shadow(0 0 6px #f59e0b)"/>
        </svg>`;
        const sunMetrics = el('div', 'db-sun-metrics');
        sunMetrics.innerHTML = `
          <div class="db-sun-stat"><span>${uk ? 'Висота сонця' : 'Sun Elevation'}</span><b>${demo ? '48.2°' : '—'}</b></div>
          <div class="db-sun-stat"><span>${uk ? 'Радіація' : 'Solar Irradiance'}</span><b>${demo ? '820 W/m²' : '—'}</b></div>
          <div class="db-sun-stat"><span>${uk ? 'Світловий день' : 'Daylight'}</span><b>${demo ? '5 год 20 хв' : '—'}</b></div>
        `;
        sunBox.innerHTML = sunSvg;
        sunBox.append(sunMetrics);

        const rainBox = el('div', 'db-weather-rain-box');
        rainBox.innerHTML = `
          <div class="db-rain-header">
            <span class="db-rain-icon">${demo ? '🌧' : '☁'}</span>
            <div>
              <b>${demo ? (uk ? 'Ймовірність дощу 15%' : '15% Rain probability') : (uk ? 'Без опадів' : 'No rain')}</b>
              <small>${demo ? (uk ? 'Опади: 0.0 мм/год · Хмарність: 25%' : 'Precip: 0.0 mm/h · Clouds: 25%') : '—'}</small>
            </div>
          </div>
          <div class="db-solar-estimate-bar">
            <div class="db-estimate-label"><span>${uk ? 'Очікувана генерація сьогодні' : 'Est. daily yield'}</span><b>${demo ? '28.4 kWh' : '—'}</b></div>
            <div class="db-progress-track"><span style="width: ${demo ? '68%' : '0%'}"></span></div>
          </div>
        `;

        body.append(sunBox, rainBox);
      }

      // Add the Multi-Day Solar Generation Forecast section
      const forecastSec = renderSolarForecastSection({ kind, layout, uk, demo, accent, el, change });

      if (kind === 'weather') {
        card.append(head, body, forecastSec);
      } else {
        card.append(head, forecastSec);
      }

      card.classList.add('anma-shared-weather');
      const style=el('style');style.textContent=weatherStyles;card.prepend(style);
      head.querySelector('b').style.color='#ff8730';card.querySelector('.db-forecast-title-box b').style.color='#ff8730';
      if(demo){
        // Keep the builder preview identical to the Home Assistant card: HA has no
        // irradiance or per-day sunshine-hours data by default, and uses real dates.
        const stats=card.querySelectorAll('.db-sun-stat');
        if(stats[1])stats[1].hidden=true;
        if(stats[2]){
          stats[2].hidden=false;
          const todayH=daylightHours(50.45,new Date(),'Europe/Kyiv')||11.27;
          const h=Math.floor(todayH),m=Math.round((todayH-h)*60);
          stats[2].querySelector('b').textContent=uk?`${h} год ${m} хв`:`${h}h ${m}m`;
        }
        card.querySelectorAll('.db-forecast-day-card').forEach((c,i)=>{
          const date=new Date();date.setDate(date.getDate()+i);
          c.querySelector('.db-fday-title').textContent=i===0?(uk?'Сьогодні':'Today'):i===1?(uk?'Завтра':'Tomorrow'):date.toLocaleDateString(uk?'uk-UA':'en-US',{weekday:'short'});
          c.querySelector('.db-fday-date').textContent=date.toLocaleDateString(uk?'uk-UA':'en-GB',{day:'2-digit',month:'2-digit'});
          const footer=c.querySelectorAll('.db-fday-footer span');if(footer[1])footer[1].hidden=true;
        });
        const bestCard=[...card.querySelectorAll('.db-forecast-day-card')].reduce((a,c)=>!a||parseFloat(c.querySelector('.db-fday-kwh b').textContent)>parseFloat(a.querySelector('.db-fday-kwh b').textContent)?c:a,null);
        const kpis=card.querySelectorAll('.db-forecast-kpi-item b');
        if(bestCard&&kpis[2])kpis[2].textContent=bestCard.querySelector('.db-fday-title').textContent+' ('+bestCard.querySelector('.db-fday-kwh b').textContent+' kWh)';
      }
      if(!demo){
        const val=(key,unit='')=>{const v=read(key);return v===null||v===undefined||v===''?'—':(typeof v==='number'?Number(v.toFixed(2)):String(v))+unit;};
        const numeric=key=>{const v=read(key);return v===null||v===undefined||v===''||!Number.isFinite(Number(v))?null:Number(v);};
        let daylightText='—';
        const dVal=read('daylight_hours');
        if(dVal!==null&&dVal!==undefined&&dVal!==''){
          if(typeof dVal==='number'||(!isNaN(Number(dVal))&&!String(dVal).includes(':'))){
            const numH=Number(dVal),h=Math.floor(numH),m=Math.round((numH-h)*60);
            daylightText=uk?`${h} год ${m} хв`:`${h}h ${m}m`;
          }else{
            daylightText=String(dVal);
          }
        }else{
          const autoH=daylightHours(50.45,new Date(),'Europe/Kyiv');
          if(autoH){
            const h=Math.floor(autoH),m=Math.round((autoH-h)*60);
            daylightText=uk?`${h} год ${m} хв`:`${h}h ${m}m`;
          }
        }
        const weatherValues=[val('sun_elevation','°'),val('solar_irradiance',' W/m²'),daylightText];
        card.querySelectorAll('.db-sun-stat b').forEach((e,i)=>{e.textContent=weatherValues[i];if(i===1)e.parentElement.hidden=numeric('solar_irradiance')===null;if(i===2)e.parentElement.hidden=(daylightText==='—');});
        const rain=card.querySelector('.db-rain-header b');if(rain)rain.textContent=(uk?'Ймовірність дощу: ':'Rain probability: ')+val('rain_probability','%');
        const rainDetail=card.querySelector('.db-rain-header small');if(rainDetail)rainDetail.textContent=(uk?'Опади: ':'Rain: ')+val('rain_rate',' mm/h')+' · '+(uk?'Хмарність: ':'Cloud cover: ')+val('cloud_cover','%');
        const elev=numeric('sun_elevation'),circle=card.querySelector('.db-sun-arc circle');if(circle){circle.style.display=elev===null?'none':'';const angle=Math.max(0,Math.min(90,elev||0))*Math.PI/180;circle.setAttribute('cx',80-65*Math.cos(angle));circle.setAttribute('cy',75-65*Math.sin(angle));}
        const estimate=card.querySelector('.db-estimate-label b');if(estimate)estimate.textContent=val('forecast_day_0',' kWh');
        const estimateBar=card.querySelector('.db-solar-estimate-bar .db-progress-track span');if(estimateBar)estimateBar.style.width='0%';
        const cards=[...card.querySelectorAll('.db-forecast-day-card')],numbers=cards.map((_,i)=>numeric('forecast_day_'+i));
        const max=Math.max(1,...numbers.filter(v=>v!==null));
        cards.forEach((c,i)=>{
          const date=new Date();date.setDate(date.getDate()+i);
          c.querySelector('.db-fday-title').textContent=i===0?(uk?'Сьогодні':'Today'):i===1?(uk?'Завтра':'Tomorrow'):date.toLocaleDateString(uk?'uk-UA':'en-US',{weekday:'short'});
          c.querySelector('.db-fday-date').textContent=date.toLocaleDateString(uk?'uk-UA':'en-GB',{day:'2-digit',month:'2-digit'});
          c.querySelector('.db-fday-kwh b').id='anma-forecast-'+i;c.querySelector('.db-fday-kwh b').textContent=val('forecast_day_'+i);
          const condition=read('forecast_condition_'+i);c.querySelector('.db-fday-cond').textContent=(uk?{sunny:'Ясно',cloudy:'Хмарно',partlycloudy:'Мінлива хмарність',rainy:'Дощ',pouring:'Злива','clear-night':'Ясна ніч',snowy:'Сніг'}[condition]:null)||condition||'—';
          c.querySelector('.db-fday-icon').textContent=({'sunny':'☀️','clear-night':'🌙','partlycloudy':'⛅','cloudy':'☁️','rainy':'🌧','pouring':'🌧','snowy':'❄️'})[condition]||'—';
          c.querySelector('.db-fday-bar-fill').style.height=numbers[i]===null?'0%':Math.max(0,numbers[i]/max*100)+'%';
          const footer=c.querySelectorAll('.db-fday-footer span');footer[0].textContent='⚡ '+val('forecast_peak_'+i,' kW');footer[1].textContent='⏱ '+val('forecast_hours_'+i,' h');footer[1].hidden=read('forecast_hours_'+i)==null;footer[1].title=uk?'Тривалість сонячного сяйва':'Sunshine duration';
        });
        const complete=numbers.every(v=>v!==null),total=complete?numbers.reduce((a,b)=>a+b,0):null,kpis=card.querySelectorAll('.db-forecast-kpi-item b');
        kpis[0].textContent=total===null?'—':total.toFixed(1)+' kWh';kpis[1].textContent=total===null?'—':(total/numbers.length).toFixed(1)+' kWh/'+(uk?'д':'day');
        const best=complete?numbers.indexOf(Math.max(...numbers)):-1;kpis[2].textContent=best<0?'—':cards[best].querySelector('.db-fday-title').textContent+' ('+Number(numbers[best].toFixed(2))+' kWh)';
        head.querySelector('small').textContent=complete?'':(uk?'Призначте датчики у налаштуваннях':'Assign sensors in settings');
      }
      return card;

  }

  function solcastBindings(states,bindings={}) {
    const ids=Object.keys(states||{}),result={};
    const today=bindings.forecast_day_0||(()=>{const matches=ids.filter(id=>/solcast.*forecast_today$/.test(id)&&['Wh','kWh','MWh'].includes(states[id]?.attributes?.unit_of_measurement));return matches.length===1?matches[0]:'';})();
    const prefix=today.replace(/today$/,'');
    for(let i=0;i<7;i++){
      const key='forecast_day_'+i,candidates=i===0?[today]:i===1?[prefix+'tomorrow']:[prefix+'day_'+(i+1),prefix+'d'+(i+1)];
      const found=candidates.filter(id=>states[id]);result[key]=bindings[key]||(found.length===1?found[0]:'');
    }return result;
  }
  const api = {
    flowPower(layout,role,read){
      const meter=layout.flowMeters?.[role];
      let value;
      if(meter?.mode==='split'){
        const positive=read(role+'_positive_power'),negative=read(role+'_negative_power');
        value=positive===null||negative===null?null:Math.max(0,positive)-Math.max(0,negative);
      }else value=read(role+'_power');
      return value===null?null:value*(layout.flowInverted?.[role]?-1:1);
    },
    flowDuration(layout,role,value){
      const rated=layout.flowMeters?.[role]?.ratedPower||layout.ratedPower||6000;
      const fraction=Math.min(1,Math.abs(value||0)/Math.max(1,rated));
      return (8-7*fraction)/(Math.max(25,layout.flowSpeedMultiplier||100)/100);
    },
    solcastBindings,
    renderWeather,
    renderEnergyChart,
    normalizeElements, newElement, renderElements, elementTypes,
    prepareBackground,
    flowDetails,
    flowGraph,
    renderFlowScene,
    prepareFlowViewport,
    roles,
    widgets,
    metrics,
    templates,
    shapes,
    sizes,
    themes,
    fonts,
    viewModes,
    devicePresets,
    flowStyles,
    defaultFlowColors,
    providerDefaults,
    defaultFlowNodes,
    defaultFlowConnections,
    defaultBatteryStack,
    defaultInverterStack,
    defaultMpptChannels,
    calculateMicroinverterPower,
    isReceiver,
    empty,
    fromBuilder,
    validate,
    applyTemplate,
    sampleEquipment,
    daylightHours,
    exportHomeAssistantYaml
  };

  if (root) root.AnmaDashboard = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);


}

/**
 * ANMA Energy Platform — Custom Lovelace Card for Home Assistant
 * File: anma-card.js
 * Version: 2026.10.05-pro
 * 
 * Legacy renderer: not yet visually equivalent to Dashboard Studio.
 * Charts and forecasts below include demonstration data.
 * Current components:
 * - Deye Cloud thin animated energy flow curves (particles, traffic, arrows, solid)
 * - 24-hour Energy Analytics interactive chart with tabs (24h, 7d, 30d, 1y, years), series toggles and hover crosshair
 * - 7-day Solar Yield Forecast with daily bars and weather conditions
 * - Master/Slave Battery Rack with individual module voltages, currents, and temperatures
 * - Microinverter MPPT Matrix with clipping/limited indicators
 * - Inverter Status Rings & Server Health
 * - Watermark background photos with customizable opacity
 * - Live Home Assistant sensor telemetry binding & reactive animations
 */

(() => {
  'use strict';

  const CARD_VERSION = '0.6.8';
  const EN = {
    'Стан системи':'System status', 'Помилки':'Errors', 'Стан АКБ':'Battery status', 'Електромобіль — потужність':'EV — power', 'Генератор — потужність':'Generator — power', 'Мова картки': 'Card language', 'Сонце': 'Solar', 'Дім': 'Home', 'Самоспоживання': 'Self-consumption', 'АКБ': 'Battery', 'Прогноз на 7 днів': '7-day forecast', 'Середньодобово': 'Daily average', 'Найкращий день': 'Best day', 'Мікроінвертор': 'Microinverter', 'MPPT МАТРИЦЯ': 'MPPT MATRIX', '✓ Оптимально': '✓ Optimal', 'Автоматично (Home Assistant)': 'Automatic (Home Assistant)',
    'Імпортувати макет ANMA / Import ANMA layout (.json)': 'Import ANMA layout (.json)',
    'Макет імпортовано. Оберіть сутності та збережіть картку.': 'Layout imported. Choose entities and save the card.',
    'Сутності читаються з вашого Home Assistant. ANMA не отримує токен або доступ до пристроїв. W/kW/MW перераховуються автоматично. Налаштуйте сутності кожного показника нижче.': 'Entities come from your Home Assistant session. No token or device access is sent to ANMA. W/kW/MW are converted automatically. Configure the entity for each indicator below.',
    'Пошук сутностей': 'Search entities', 'Назва або sensor.entity_id': 'Name or paste sensor.entity_id',
    'Пристрій Home Assistant': 'Home Assistant device', 'Усі пристрої': 'All devices',
    'Запропонувати відповідності': 'Suggest matches', 'Експорт JSON з прив’язками': 'Export JSON with bindings',
    'Імпортуйте JSON у ANMA та натисніть «Зберегти в акаунт», щоб зберегти прив’язки там.': 'Import this JSON in ANMA and choose Save to account to keep the bindings there.',
    'Перелік пристроїв недоступний. Пошук серед доступних сутностей працює.': 'Device registry unavailable. Search among available entities still works.',
    'Сонце — потужність': 'Solar — power', 'Мережа — потужність (+ імпорт)': 'Grid — power (+ import)',
    'Дім — споживання': 'Home — consumption', 'АКБ — потужність (+ розряд)': 'Battery — power (+ discharge)',
    'Інвертор — потужність': 'Inverter — power', 'АКБ — заряд': 'Battery — state of charge',
    'АКБ — напруга': 'Battery — voltage', 'АКБ — температура': 'Battery — temperature',
    'Частота мережі': 'Grid frequency', 'Стан інвертора': 'Inverter state',
    'Генерація сьогодні': 'Generation today', 'Споживання сьогодні': 'Consumption today',
    'Імпорт сьогодні': 'Import today', 'Експорт сьогодні': 'Export today',
    'Інвертувати знак потужності': 'Invert power sign', 'Не підключено': 'Not connected',
    'поточна прив’язка': 'current binding', 'Оберіть сутність': 'Choose an entity',
    'Сутність не знайдено': 'Entity not found', 'Несумісні одиниці': 'Incompatible units',
    'відсутні': 'missing', 'Немає коректних даних': 'No valid data',
    'Застосувати ID': 'Apply ID', 'Некоректний entity_id': 'Invalid entity_id',
    'Виберіть зі списку або вставте повний entity_id. Enter застосовує ID.': 'Choose from the list or paste a full entity_id. Press Enter to apply.',
    'Фото станції (PNG/JPG/WebP, до 10 МБ)': 'Station photo (PNG/JPG/WebP, up to 10 MB)',
    'Видимість фото': 'Photo visibility', 'Прибрати фото': 'Remove photo',
    '0% — приховано, 100% — непрозоре. Фото входить у JSON макета.': '0% hidden, 100% opaque. The image is embedded in the layout JSON.',
    'Не вдалося прочитати фото. Оберіть PNG/JPG/WebP до 10 МБ.': 'Could not read image. Choose PNG/JPG/WebP up to 10 MB.',
    'Перевірте запропоновані відповідності та збережіть картку.': 'Review suggested matches and save the card.',
    'HA · графік і прогноз: DEMO': 'HA · chart and forecast: DEMO',
    'Живий баланс сонця, батареї, будинку та мережі': 'Live solar, battery, home and grid power',
    'Гібридний інвертор Deye': 'Deye hybrid inverter', 'ГІБРИДНИЙ ІНВЕРТОР': 'HYBRID INVERTER',
    'СОНЦЕ': 'SOLAR', 'МЕРЕЖА': 'GRID', 'ДІМ': 'HOME', 'АКУМУЛЯТОР': 'BATTERY', 'PV генерація': 'PV generation',
    'Імпорт': 'Import', 'Експорт': 'Export', 'Немає потоку': 'No flow', 'Розряд': 'Discharging', 'Заряд': 'Charging', 'Очікування': 'Idle',
    'Стан АКБ': 'Battery state', 'СТАН СИСТЕМИ': 'SYSTEM STATE', 'Напруга АКБ': 'Battery voltage', 'Температура': 'Temperature', 'Помилки': 'Errors',
    'Імпорт із мережі': 'Grid import', 'Експорт у мережу': 'Grid export',
    'АНАЛІТИКА ЕНЕРГІЇ': 'ENERGY ANALYTICS', 'Графік потужності та генерації · DEMO': 'Power and generation chart · DEMO',
    '24 год': '24 hours', '7 днів': '7 days', '30 днів': '30 days', 'Рік': 'Year',
    'ПРОГНОЗ ГЕНЕРАЦІЇ': 'GENERATION FORECAST', 'Сонячна генерація на 7 днів · DEMO': '7-day solar forecast · DEMO',
    'Сьогодні': 'Today', 'Завтра': 'Tomorrow', 'Середа': 'Wednesday', 'Четвер': 'Thursday', "П’ятниця": 'Friday', "П'ятниця": 'Friday', 'Субота': 'Saturday', 'Неділя': 'Sunday',
    'ПОТРІБНІ ОКРЕМІ СЕНСОРИ BMS': 'SEPARATE BMS SENSORS REQUIRED', '▰ Стек акумуляторів (Master / Slave модулі)': '▰ Battery rack (Master / Slave modules)',
    'Напруга': 'Voltage', 'Струм': 'Current', 'заряд': 'state of charge', 'напруга': 'voltage', 'струм': 'current', 'температура': 'temperature', 'КОМПАКТНІ ПОКАЗНИКИ': 'COMPACT METRICS', 'Ключові показники енергосистеми': 'Core Energy System Metrics', 'Живі вимірювання ліній живлення та накопичувачів': 'Real-time readings for solar, storage and consumption', 'Сонячні панелі': 'Solar Panels', 'Акумулятор': 'Battery', 'Споживання': 'Consumption', 'Мережа': 'Grid'
  };
  const languageOf = (layout, hass) => ['en','uk'].includes(layout?.language) ? layout.language : (hass?.language || 'en').startsWith('uk') ? 'uk' : 'en';
  const translate = (lang, text) => lang === 'uk' ? text : (EN[text] || text);
  const UNITS = {
    power: {W:1,kW:1000,MW:1000000,w:1,kw:1000,mw:1000000,'Вт':1,'кВт':1000,'МВт':1000000},
    energy: {Wh:.001,kWh:1,MWh:1000,wh:.001,kwh:1,mwh:1000,'кВт·год':1,'кВт*год':1,'кВтг':1},
    soc: {'%':1},
    percent: {'%':1},
    voltage: {V:1,mV:.001,v:1,mv:.001,'В':1,'мВ':.001},
    current: {A:1,mA:.001,a:1,ma:.001,'А':1,'мА':.001},
    temperature: {'°C':1,'°F':1,K:1,'°c':1,'c':1,'C':1},
    frequency: {Hz:1,hz:1,'Гц':1}
  };
  function getDefaultMetricItems(role, uk) {
    const map = {
      solar: [
        { label: uk ? 'Потужність' : 'Power', val: '—', unit: 'kW', pct: '60%' },
        { label: uk ? 'Генерація сьогодні' : 'Solar today', val: '—', unit: 'kWh', pct: '70%' },
        { label: uk ? 'Напруга PV' : 'PV Voltage', val: '—', unit: 'V', pct: '80%' },
        { label: uk ? 'Струм MPPT' : 'MPPT Current', val: '—', unit: 'A', pct: '55%' }
      ],
      battery: [
        { label: uk ? 'Заряд SoC' : 'Battery SoC', val: '—', unit: '%', pct: '88%' },
        { label: uk ? 'Потужність' : 'Power', val: '—', unit: 'kW', pct: '40%' },
        { label: uk ? 'Напруга АКБ' : 'Voltage', val: '—', unit: 'V', pct: '85%' },
        { label: uk ? 'Температура' : 'Temp', val: '—', unit: '°C', pct: '24%' }
      ],
      load: [
        { label: uk ? 'Споживання' : 'Load', val: '—', unit: 'kW', pct: '34%' },
        { label: uk ? 'Спожито сьогодні' : 'Load today', val: '—', unit: 'kWh', pct: '45%' },
        { label: uk ? 'Частота' : 'Frequency', val: '—', unit: 'Hz', pct: '99%' },
        { label: uk ? 'Напруга' : 'Voltage', val: '—', unit: 'V', pct: '95%' }
      ],
      grid: [
        { label: uk ? 'Мережа' : 'Grid Power', val: '—', unit: 'W', pct: '20%' },
        { label: uk ? 'Імпорт' : 'Import today', val: '—', unit: 'kWh', pct: '30%' },
        { label: uk ? 'Експорт' : 'Export today', val: '—', unit: 'kWh', pct: '48%' },
        { label: uk ? 'Напруга L1' : 'Grid Voltage', val: '—', unit: 'V', pct: '96%' }
      ],
      ev: [
        { label: uk ? 'Потужність EV' : 'EV Power', val: '—', unit: 'kW', pct: '25%' },
        { label: uk ? 'Заряджено' : 'Energy', val: '—', unit: 'kWh', pct: '50%' },
        { label: uk ? 'Струм' : 'Current', val: '—', unit: 'A', pct: '50%' },
        { label: uk ? 'Стан' : 'Status', val: '—', unit: '', pct: '100%' }
      ],
      generator: [
        { label: uk ? 'Потужність ген.' : 'Gen Power', val: '—', unit: 'kW', pct: '30%' },
        { label: uk ? 'Енергія ген.' : 'Energy', val: '—', unit: 'kWh', pct: '35%' },
        { label: uk ? 'Частота' : 'Frequency', val: '—', unit: 'Hz', pct: '99%' },
        { label: uk ? 'Рівень палива' : 'Fuel', val: '—', unit: '%', pct: '78%' }
      ]
    };
    return map[role] || [
      { label: uk ? 'Метрика 1' : 'Metric 1', val: '—', unit: '', pct: '50%' },
      { label: uk ? 'Метрика 2' : 'Metric 2', val: '—', unit: '', pct: '50%' },
      { label: uk ? 'Метрика 3' : 'Metric 3', val: '—', unit: '', pct: '50%' },
      { label: uk ? 'Метрика 4' : 'Metric 4', val: '—', unit: '', pct: '100%' }
    ];
  }
  const FIELDS = [
    ['solar_power','Сонце — потужність','power'], ['grid_power','Мережа — потужність (+ імпорт)','power'],
    ['load_power','Дім — споживання','power'], ['battery_power','АКБ — потужність (+ розряд)','power'],
    ['inverter_power','Інвертор — потужність','power'], ['battery_soc','АКБ — заряд','soc'],
    ['battery_voltage','АКБ — напруга','voltage'], ['battery_temp','АКБ — температура','temperature'],
    ['grid_frequency','Частота мережі','frequency'], ['inverter_mode','Стан інвертора','text'],
    ['solar_daily_energy','Генерація сьогодні','energy'], ['load_daily_energy','Споживання сьогодні','energy'],
    ['grid_daily_import','Імпорт сьогодні','energy'], ['grid_daily_export','Експорт сьогодні','energy'],
    ['battery_status','Стан АКБ','text'], ['system_status','Стан системи','text'], ['system_error','Помилки','text'],
    ['ev_power','Електромобіль — потужність','power'], ['generator_power','Генератор — потужність','power']
  ];
  function compatible(state, kind) {
    if (!state) return false;
    if (kind === 'any' || kind === 'text') return true;
    const u = state.attributes?.unit_of_measurement;
    if (u && UNITS[kind] && Object.hasOwn(UNITS[kind], u)) return true;
    if (!u && Number.isFinite(Number(state.state))) return true;
    return false;
  }
  function reading(hass, entity, kind) {
    const state = hass?.states?.[entity];
    if (!state || ['unknown','unavailable',''].includes(state.state) || !compatible(state,kind)) return null;
    if (kind === 'text' || kind === 'any') return state.state;
    const value = Number(state.state), unit = state.attributes?.unit_of_measurement;
    if (!Number.isFinite(value)) return null;
    if (kind === 'soc' && (value < 0 || value > 100)) return null;
    if (kind === 'temperature') return unit === '°F' ? (value-32)*5/9 : unit === 'K' ? value-273.15 : value;
    const mult = (UNITS[kind] && unit && Object.hasOwn(UNITS[kind], unit)) ? UNITS[kind][unit] : 1;
    return value * mult;
  }
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  // Embed full ANMA Design Studio CSS directly for complete Shadow DOM isolation
  const STYLES = `
    .db-widget-head b,.db-forecast-title-box b{color:#ff8730}
    .db-flow-container-wrap{grid-template-columns:minmax(0,1fr)!important}
    .db-flow-side-column{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:12px}
    .anma-flow-details{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:12px;margin-top:16px}
    .anma-flow-detail{min-width:0;padding:12px;border:1px solid #334155;border-radius:10px}
    .anma-flow-detail strong,.anma-flow-detail small{display:block;overflow-wrap:anywhere;margin-bottom:8px}
    .anma-flow-detail div{display:flex;justify-content:space-between;gap:12px;font-size:13px}
    .anma-container[data-station-photo=true] .db-widget-box {background:color-mix(in srgb,var(--surface,#111827) 68%,transparent)}
    :host {
      container-type: inline-size;
      container-name: anma;
      min-width: 0;
      display: block;
      width: 100%;
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --brand: #f1873d;
      --accent: #f1873d;
      --bg: #090e15;
      --surface: #0f1722;
      --surface-2: #141f2e;
      --surface-3: #1a283b;
      --border: #1e2c3d;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --text-faint: #64748b;
      --flow-speed: 2s;
    }

    * { box-sizing: border-box; }

    .anma-container {
      width: 100%;
      background: var(--bg);
      color: var(--text);
      border-radius: 16px;
      border: 1px solid var(--border);
      padding: 18px;
      overflow: hidden;
      position: relative;
    }

    /* Themes */
    .anma-container[data-theme="oled"] { --bg: #000000; --surface: #09090b; --surface-2: #121215; --border: #1c1c1f; }
    .anma-container[data-theme="cyberpunk"] { --bg: #0c0817; --surface: #140d28; --surface-2: #1f143d; --border: #3b1d6e; }
    .anma-container[data-theme="light_emerald"] { --bg: #f0fdf4; --surface: #ffffff; --surface-2: #f8fafc; --border: #bbf7d0; --text: #0f172a; --text-muted: #475569; --text-faint: #64748b; }
    .anma-container[data-theme="light_clean"] { --bg: #f8fafc; --surface: #ffffff; --surface-2: #f1f5f9; --border: #e2e8f0; --text: #0f172a; --text-muted: #475569; --text-faint: #64748b; }

    .anma-container[data-theme="light_rose"] { --bg:#fff1f2; --surface:#fff; --surface-2:#fff7f8; --border:#fecdd3; --text:#0f172a; --text-muted:#475569; --text-faint:#64748b; }
    .anma-container[data-theme^="light_"] .apf[data-auto-theme=true] { --pf-bg:#f4f7fa; --pf-panel:#fff; --pf-ink:#152735; --pf-muted:#526677; }
/* BEGIN SHARED LIGHT PALETTE */
.anma-container[data-theme^="light_"] :is(.anma-full-preview,.anma-chart-tabs,.anma-scene-reset,.db-progress-track,.db-meter,.db-photo-btn) {
  background:#e2e8f0;color:#334155;
}
.anma-container[data-theme^="light_"] .anma-scene-node {
  background:#f8fafc;color:#0f172a;
}
.anma-container[data-theme^="light_"] .anma-scene-node[data-key=inverter] {
  background:radial-gradient(circle,#fff,#e2e8f0)!important;
}
.anma-container[data-theme^="light_"] :is(.anma-scene-node b,.anma-scene-node strong,.anma-energy-chart,.db-flow-side-card b) {
  color:#0f172a!important;
}
.anma-container[data-theme^="light_"] :is(.anma-scene-node small,.db-flow-side-card span,.db-flow-side-card h4,.anma-full-preview-head,.anma-chart-tabs button,.anma-chart-legend button) {
  color:#475569;
}
/* END SHARED LIGHT PALETTE */
    /* Top Brand Header */
    .db-preview-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding-bottom: 14px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .db-site-name {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .db-anma-brand-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff;
      display: grid;
      place-items: center;
      font-size: 20px;
      box-shadow: 0 4px 14px rgba(245,158,11,0.35);
    }
    .db-brand-main {
      font-size: 17px;
      font-weight: 800;
      letter-spacing: 0.05em;
      margin: 0;
      line-height: 1.1;
    }
    .db-object-subtitle {
      font-size: 11px;
      color: var(--text-muted);
      letter-spacing: 0.04em;
    }
    .db-preview-status-pills {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .db-target-pill {
      font-size: 11px;
      font-weight: 700;
      color: #38bdf8;
      background: rgba(56,189,248,0.1);
      border: 1px solid rgba(56,189,248,0.3);
      padding: 4px 10px;
      border-radius: 999px;
    }
    .db-demo-pill {
      font-size: 10.5px;
      font-weight: 750;
      color: #37c98b;
      background: rgba(55,201,139,0.12);
      border: 1px solid rgba(55,201,139,0.3);
      padding: 4px 10px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .db-demo-pill::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #37c98b;
      animation: anma-pulse 2s infinite;
    }

    /* Canvas Grid */
    .db-canvas {
      display: grid;
      grid-template-columns: repeat(var(--db-cols, 2), minmax(0, 1fr));
      gap: 14px;
    }
    @media (max-width: 768px) {
      .db-canvas { grid-template-columns: 1fr !important; }
    }

    /* Base Card Container */
    .db-widget-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      position: relative;
      overflow: hidden;
      min-width: 0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    /* Compact Metrics Group */
    .db-compact-group {
      grid-column: 1 / -1;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .db-compact-group-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .db-compact-group-grid {
      display: grid;
      grid-template-columns: repeat(var(--compact-cols, 4), minmax(0, 1fr));
      gap: 12px;
    }
    @media (max-width: 900px) {
      .db-compact-group-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    }
    @media (max-width: 540px) {
      .db-compact-group-grid { grid-template-columns: 1fr !important; }
    }
    .db-compact-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }
    .db-compact-card:hover {
      border-color: rgba(241,135,61,0.3);
      background: rgba(255,255,255,0.035);
    }
    .db-subfields-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }
    .db-subfields-container[data-layout="row"] {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
      gap: 8px;
    }
    .db-subfields-container[data-layout="grid"] {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .db-subfield-item {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 8px;
      padding: 6px 8px;
    }
    .db-subfield-label {
      font-size: 10px;
      color: var(--text-faint);
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .db-subfield-val {
      font-size: 14px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: baseline;
      gap: 3px;
    }
    .db-subfield-val small {
      font-size: 10.5px;
      color: var(--text-muted);
      font-weight: 600;
    }
    .db-subfield-progress {
      height: 4px;
      background: rgba(255,255,255,0.08);
      border-radius: 999px;
      overflow: hidden;
      margin-top: 5px;
    }
    .db-subfield-progress span {
      display: block;
      height: 100%;
      border-radius: 999px;
      transition: width 0.3s ease;
    }
    .db-metric-value {
      font-size: 24px;
      font-weight: 850;
      color: #fff;
      margin: 8px 0 4px;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .db-metric-value small {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
    }
    .db-meter {
      height: 6px;
      background: rgba(255,255,255,0.08);
      border-radius: 999px;
      overflow: hidden;
      margin-top: 8px;
    }
    .db-meter span {
      display: block;
      height: 100%;
      border-radius: 999px;
      transition: width 0.3s ease;
    }
    .db-widget-box.has-photo,
    .db-compact-card.has-photo {
      background: linear-gradient(180deg, rgba(15,23,34,0.85) 0%, rgba(15,23,34,0.96) 100%);
    }
    .db-watermark-bg {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      pointer-events: none;
      z-index: 0;
      filter: saturate(1.2);
    }
    .db-widget-box > *:not(.db-watermark-bg):not(.apf-bg),
    .db-compact-card > *:not(.db-watermark-bg) {
      position: relative;
      z-index: 1;
    }

    .db-widget-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 12px;
    }
    .db-eyebrow {
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: block;
    }

    /* 1. DEYE Thin-Line Animated Flow Widget */
    .db-flow-widget {
      grid-column: 1 / -1;
    }
    .db-flow-container-wrap {
      display: grid;
      grid-template-columns: minmax(0, 1fr) !important;
      gap: 14px;
    }
    @media (max-width: 820px) {
      .db-flow-container-wrap { grid-template-columns: 1fr !important; }
    }
    .db-flow {
      position: relative;
      width: 100%;
      height: 330px;
      background: radial-gradient(circle at center, rgba(255,255,255,0.025) 0%, transparent 70%);
      border-radius: 12px;
      overflow: hidden;
    }
    .db-flow svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .flow-base {
      fill: none;
      stroke: rgba(255,255,255,0.06);
      stroke-width: 1.5;
    }
    .flow-traffic {
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-dasharray: 6 14;
      animation: anma-dash var(--flow-speed) linear infinite;
    }
    .flow-particles {
      fill: none;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-dasharray: 3 18;
      animation: anma-dash calc(var(--flow-speed) * 0.7) linear infinite;
    }
    .flow-arrows {
      fill: none;
      stroke-width: 2.5;
      stroke-dasharray: 8 10;
      animation: anma-dash var(--flow-speed) linear infinite;
    }
    .flow-solid {
      fill: none;
      stroke-width: 1.8;
      opacity: 0.85;
    }

    /* Flow Nodes */
    .db-flow-node {
      position: absolute;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 86px;
      height: 86px;
      border-radius: 14px;
      background: #0d1520;
      border: 2px solid var(--node-color, #f1873d);
      box-shadow: 0 0 20px var(--node-glow, rgba(241,135,61,0.25));
      text-align: center;
      padding: 6px 4px;
      z-index: 2;
    }
    .db-flow-node[data-role="inverter"] {
      width: 96px;
      height: 96px;
      border-radius: 20px;
    }
    .db-flow-node i {
      font-size: 18px;
      line-height: 1;
      margin-bottom: 2px;
      font-style: normal;
    }
    .db-flow-node b {
      font-size: 13.5px;
      font-weight: 800;
      color: #fff;
      margin: 2px 0 1px;
    }
    .db-flow-node span {
      font-size: 9px;
      color: #cbd5e1;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .db-flow-node small {
      font-size: 8px;
      color: var(--text-faint);
    }

    /* Flow Side Column */
    .db-flow-side-column {
      display: grid !important;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr)) !important;
      gap: 12px;
      margin-top: 14px;
    }
    .db-flow-side-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 12px 14px;
    }
    .db-flow-side-card h4 {
      margin: 0 0 6px;
      font-size: 11px;
      font-weight: 800;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }
    .db-big-soc {
      font-size: 32px;
      font-weight: 850;
      color: #fff;
      line-height: 1;
      margin-bottom: 6px;
    }
    .db-progress-track {
      height: 7px;
      background: rgba(255,255,255,0.08);
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .db-progress-track span {
      display: block;
      height: 100%;
      border-radius: 999px;
      background: #37c98b;
      transition: width 0.4s ease;
    }
    .db-flow-side-spec-row {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      color: var(--text-faint);
      margin-top: 4px;
    }
    .db-flow-side-spec-row b { color: var(--text); }

    /* Flow Today Summary Bar */
    .db-flow-summary-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      border-top: 1px solid var(--border);
      padding-top: 12px;
      margin-top: 12px;
    }
    @media (max-width: 600px) {
      .db-flow-summary-bar { grid-template-columns: repeat(2, 1fr); }
    }
    .db-summary-item {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .db-summary-item span {
      display: block;
      font-size: 10px;
      color: var(--text-faint);
      margin-bottom: 2px;
    }
    .db-summary-item b {
      font-size: 14px;
      font-weight: 800;
      color: #fff;
    }

    /* 2. Interactive Energy Analytics Chart */
    .db-card-chart .db-chart-head-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .db-chart-tabs {
      display: inline-flex;
      background: rgba(0,0,0,0.3);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 2px;
      gap: 2px;
    }
    .db-chart-tab {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 700;
      padding: 4px 9px;
      border-radius: 6px;
      cursor: pointer;
    }
    .db-chart-tab.active {
      background: var(--surface-3);
      color: #fff;
    }
    .db-chart-svg {
      width: 100%;
      height: 140px;
      overflow: visible;
    }
    .db-chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 10px;
      font-size: 11px;
    }
    .db-chart-series-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 10.5px;
      color: var(--text);
    }
    .db-chart-series-pill i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    /* 3. Solar Yield Forecast */
    .db-solar-forecast-section .db-forecast-grid {
      display: grid;
      grid-template-columns: repeat(var(--forecast-cols, 7), minmax(0, 1fr));
      gap: 8px;
      margin-top: 10px;
    }
    @media (max-width: 700px) {
      .db-solar-forecast-section .db-forecast-grid { grid-template-columns: repeat(auto-fit, minmax(65px, 1fr)) !important; }
    }
    .db-forecast-day-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 8px 6px;
      text-align: center;
    }
    .db-fday-title { font-size: 10px; font-weight: 750; color: #fff; display: block; }
    .db-fday-date { font-size: 8.5px; color: var(--text-faint); margin-bottom: 4px; display: block; }
    .db-fday-icon { font-size: 18px; margin: 4px 0; display: block; }
    .db-fday-kwh { font-size: 12px; font-weight: 800; color: #f59e0b; }
    .db-forecast-kpi-bar {
      display: flex;
      justify-content: space-between;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 11px;
      margin-top: 8px;
    }

    /* 4. Battery Stack */
    .db-battery-stack-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 8px;
    }
    .db-battery-unit {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 10px 12px;
    }
    .db-battery-unit-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .db-role-pill {
      font-size: 8px;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 4px;
      background: rgba(241,135,61,0.2);
      color: #f1873d;
    }
    .db-battery-soc-num { font-size: 13px; font-weight: 800; color: #fff; }
    .db-battery-specs {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: var(--text-faint);
      margin-top: 6px;
    }
    .db-battery-specs b { color: var(--text); }

    /* 5. Microinverter MPPT Matrix */
    .db-mppt-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 8px;
      margin-top: 10px;
    }
    .db-mppt-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 10px;
    }
    .db-mppt-card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }
    .db-mppt-badge { font-size: 10px; font-weight: 750; color: var(--text-muted); }
    .db-mppt-tag {
      font-size: 8px;
      font-weight: 800;
      padding: 2px 5px;
      border-radius: 4px;
    }
    .db-mppt-tag.ok { background: rgba(55,201,139,0.15); color: #37c98b; }
    .db-mppt-tag.clipped { background: rgba(244,63,94,0.15); color: #f43f5e; }
    .db-mppt-tag.limited { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .db-mppt-watts { font-size: 17px; font-weight: 850; color: #fff; margin: 4px 0 2px; }
    .db-mppt-electrical {
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: var(--text-faint);
      margin-top: 6px;
      border-top: 1px solid rgba(255,255,255,0.05);
      padding-top: 4px;
    }

    /* 6. Telemetry & Inverter Health */
    .db-card-telemetry {
      grid-column: 1 / -1;
    }
    .db-telemetry-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .db-telemetry-item {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .db-telemetry-item span { font-size: 11px; color: var(--text-faint); }
    .db-telemetry-item b { font-size: 18px; font-weight: 800; color: #fff; }
    .db-status-badge {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .06em;
      padding: 3px 8px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .db-status-badge.ok { background: rgba(55,201,139,0.15); color: #37c98b; border: 1px solid rgba(55,201,139,0.3); }

    /* 7. Server Health Grid (HA Host Telemetry) */
    .db-card-server {
      grid-column: 1 / -1;
    }
    .db-server-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .db-server-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 14px;
      transition: border-color .2s;
    }
    .db-server-card:hover { border-color: rgba(56,189,248,0.4); }
    .db-server-card-top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .db-server-badge {
      font-size: 8.5px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255,255,255,0.08);
      color: #94a3b8;
    }
    .db-server-name { font-size: 11px; color: #94a3b8; }
    .db-server-val { font-size: 20px; font-weight: 800; color: #fff; margin-bottom: 2px; }
    .db-server-sub { font-size: 9.5px; color: var(--text-faint); }

    /* 8. Inverter Rings Overview */
    .db-equipment-section {
      grid-column: 1 / -1;
    }
    .db-inverter-rings-strip {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .db-inverter-ring-card {
      display: flex;
      justify-content: center;
    }
    .db-ring-circle {
      width: 130px;
      height: 130px;
      border-radius: 50%;
      background: radial-gradient(circle, #101923 0%, #0a0f16 100%);
      border: 2px solid #22303f;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 10px;
      transition: all .2s ease;
    }
    .db-inverter-ring-card[data-example=true] .db-ring-circle {
      border-color: #20bda0;
      box-shadow: 0 0 24px rgba(32,189,160,0.22);
    }
    .db-ring-icon-symbol { font-size: 14px; color: var(--text-faint); line-height: 1; }
    .db-ring-name { font-size: 12px; color: var(--text); margin-top: 4px; }
    .db-ring-power { font-size: 17px; font-weight: 750; color: #fff; margin: 3px 0; }
    .db-ring-brand { font-size: 9px; color: var(--text-faint); }
    .db-ring-status-dot { font-size: 8px; font-weight: 750; letter-spacing: .05em; margin-top: 5px; }
    .db-ring-status-dot.green { color: #20bda0; }
    .db-ring-status-dot.gray { color: #64748b; }

    /* 9. PV Fields Array */
    .db-pv-field-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      margin-top: 10px;
    }
    .db-pv-field {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
    }
    .db-pv-field-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .db-pv-subicon { font-size: 14px; color: #f59e0b; }
    .db-pv-tag {
      font-size: 7.5px;
      font-weight: 800;
      letter-spacing: .05em;
      padding: 2px 5px;
      border-radius: 4px;
    }
    .db-pv-tag.green { background: rgba(32,189,160,0.14); color: #20bda0; border: 1px solid rgba(32,189,160,0.3); }
    .db-pv-field h5 { font-size: 12px; font-weight: 750; margin: 0 0 2px; color: #fff; }
    .db-pv-field p { font-size: 9px; color: #64748b; margin: 0 0 8px; }
    .db-pv-watts { font-size: 16px; font-weight: 800; color: #fff; margin-top: auto; margin-bottom: 6px; }
    .db-pv-electrical {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.05);
      padding-top: 6px;
      font-size: 9.5px;
      color: #94a3b8;
    }

    [data-sensor-id] { cursor: pointer; transition: background .15s, border-color .15s, color .15s, box-shadow .15s; }
    [data-sensor-id]:hover { border-color: #ff8730 !important; box-shadow: 0 0 12px rgba(255,135,48,0.3) !important; }
    [data-sensor-id]:hover * { color: #ffa54c !important; }

    .db-site-name, .db-site-name > div, .db-widget-box { min-width: 0; overflow-wrap: anywhere; }
    .db-preview-head, .db-preview-status-pills { flex-wrap: wrap; }
    @container anma (max-width: 760px) {
      .db-canvas { grid-template-columns: minmax(0, 1fr) !important; }
      .db-canvas > * { grid-column: 1 / -1 !important; }
      .db-flow-container-wrap { grid-template-columns: minmax(0, 1fr); }
    }
    @keyframes anma-dash { to { stroke-dashoffset: -40; } }
    @keyframes anma-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
  `;

  class AnmaCard extends HTMLElement {
    _t(text) { return translate(languageOf(this._layout,this._hass),text); }
    static getConfigElement() { return document.createElement('anma-card-editor-'+CARD_VERSION.replaceAll('.','-')); }
    static getStubConfig() {
      return {
        type: 'custom:anma-card',
        layout: {
          version: 1,
          id: 'db-' + Date.now(),
          name: 'ANMA Energy',
          brandTitle: 'ANMA ELECTRIC',
          origin: 'standalone',
          template: 'compact',
          accent: '#f1873d',
          font: 'system',
          glow: true,
          motion: true,
          flowStyle: 'traffic',
          flowColors: { solar: '#f59e0b', battery: '#37c98b', grid: '#a855f7', load: '#38bdf8', ev: '#10b981', generator: '#f97316', inverter: '#f1873d' },
          gridColumns: 4,
          ratedPower: 6000,
          widgets: ['solar', 'battery', 'load', 'grid'],
          bindings: {}
        }
      };
    }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._config = null;
      this._layout = null;
      this._hass = null;
      this._rendered = false;
      this._activeChartRange = '24h';
    }

    setConfig(config) {
      if (!config) throw new Error('Invalid ANMA card configuration');
      this._config = config;
      let rawLayout = config.layout || config;
      if (typeof rawLayout === 'string') {
        try {
          rawLayout = JSON.parse(rawLayout);
        } catch (_) {}
      }
      this._layout = (typeof rawLayout === 'object' && rawLayout !== null)
        ? JSON.parse(JSON.stringify(rawLayout))
        : {};
      if (window.AnmaDashboard?.validate) {
        try {
          this._layout = window.AnmaDashboard.validate(this._layout);
        } catch (_) {}
      }
      this._renderFullDashboard();
    }

    set hass(hass) {
      const oldLanguage = languageOf(this._layout,this._hass);
      this._hass = hass;
      if (!this._rendered || oldLanguage !== languageOf(this._layout,hass)) {
        this._renderFullDashboard();
      }
      this._updateLiveSensors();
    }

    connectedCallback(){this._updateLiveSensors();}
    disconnectedCallback(){this._weatherToken=null;this._weatherUnsub?.();this._weatherUnsub=null;this._weatherSource=null;}
    _weatherConnection(){
      const states=this._hass?.states||{},configured=this._layout?.bindings?.weather_condition;
      const available=Object.keys(states).filter(id=>id.startsWith('weather.'));
      const source=states[configured]?configured:available.length===1?available[0]:null;
      const conn=this._hass?.connection;
      if(!this.isConnected)return source;
      if(source===this._weatherSource&&conn===this._weatherConn)return source;
      this._weatherUnsub?.();this._weatherUnsub=null;this._weatherForecast=[];this._weatherSource=source;this._weatherConn=conn;const token={};this._weatherToken=token;
      if(source&&conn?.subscribeMessage&&this.isConnected&&(states[source].attributes?.supported_features&1)){
        conn.subscribeMessage(data=>{if(this._weatherToken!==token)return;this._weatherForecast=data.forecast||[];this._updateLiveSensors();},{type:'weather/subscribe_forecast',entity_id:source,forecast_type:'daily'}).then(unsub=>{if(this._weatherToken!==token)unsub();else this._weatherUnsub=unsub;}).catch(()=>{});
      }return source;
    }
    getCardSize() {
      return 10;
    }

    _getState(entityId, defaultVal = '0') {
      if (!this._hass || !entityId) return defaultVal;
      const s = this._hass.states[entityId];
      if (!s || s.state === undefined || s.state === 'unavailable' || s.state === 'unknown') {
        return defaultVal;
      }
      return s.state;
    }

    _formatWatts(val) {
      const num = Number(val) || 0;
      if (Math.abs(num) >= 1000) {
        return (num / 1000).toFixed(2) + ' kW';
      }
      return Math.round(num) + ' W';
    }

    _applyWidgetLayout(el, w, cfg = {}) {
      if (!el) return;
      const size = cfg.size || (['flow', 'compact_group', 'battery_stack'].includes(w) ? 'full' : '1x1');
      el.dataset.size = size;
      if (cfg.autoFit) {
        el.style.gridColumn = 'auto / -1';
      } else if (size === 'full') {
        el.style.gridColumn = '1 / -1';
      } else if (size === '2x1') {
        el.style.gridColumn = 'span 2';
      } else if (size === '2x2') {
        el.style.gridColumn = 'span 2';
        el.style.gridRow = 'span 2';
      } else if (size === '1x1') {
        el.style.gridColumn = 'span 1';
      }
      if (cfg.accent) {
        el.style.setProperty('--card-accent', cfg.accent);
      }
    }

    _renderFullDashboard() {
      this._chartArea=null;this._historyCard=null;
      const l = this._layout || {};
      const shadow = this.shadowRoot;
      shadow.innerHTML = '';

      const style = document.createElement('style');
      style.textContent = STYLES;
      shadow.appendChild(style);

      const root = document.createElement('div');
      root.className = 'anma-container';
      root.dataset.powerFlowOnly=String(l.widgets?.length===1&&l.widgets[0]==='power_flow');
      root.dataset.theme = l.theme?.mode || 'anma_dark';
      root.style.setProperty('--accent', l.accent || '#f1873d');
      root.style.setProperty('--db-cols', l.gridColumns || 2);
      root.style.position='relative';root.style.isolation='isolate';
      const background=document.createElement('div');
      background.className='anma-station-background';
      background.style.cssText='position:absolute;inset:0;z-index:-1;pointer-events:none;background-size:cover;background-position:center;border-radius:inherit';
      const image=l.background?.image;
      if(typeof image==='string' && (image.startsWith('/') || image.startsWith('http') || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(image))) {
        background.style.backgroundImage=`url("${image}")`;
      }
      background.style.opacity=String(Math.min(100,Math.max(0,l.background?.opacity??50))/100);
      root.append(background);root.dataset.stationPhoto=background.style.backgroundImage?'true':'false';

      // 1. Top Brand Header
      const head = document.createElement('header');
      head.className = 'db-preview-head';
      head.innerHTML = `
        <div class="db-site-name">
          <div class="db-anma-brand-box"><svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><path fill="#fff" d="M18 2 7 18h8l-1 12 12-18h-9z"/></svg></div>
          <div>
            <h2 class="db-brand-main">ANMA ELECTRIC</h2>
            <span class="db-object-subtitle">${escapeHtml(l.name || 'PIVDENNE ENERGY · DA6K')}</span>
          </div>
        </div>

      `;
      root.appendChild(head);

      // 2. Canvas Grid
      const canvas = document.createElement('div');
      canvas.className = 'db-canvas';

      this._elementsHost = document.createElement('div');
      this._elementsHost.style.gridColumn='1 / -1';
      canvas.append(this._elementsHost);

      const metricWidgets = (l.widgets || []).filter(w => {
        const b = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
        return ['solar', 'battery', 'load', 'grid', 'generator', 'ev', 'metric'].includes(b);
      });
      const microDevs = (l.devices || []).filter(d => d.category === 'microinverters');

      let renderedCompactGroup = false;
      this._weatherHosts = [];

      (l.widgets || []).forEach(w => {
        const b = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
        const cfg = l.widgetConfigs?.[w] || {};
        try {
          if (['solar', 'battery', 'load', 'grid', 'generator', 'ev', 'metric'].includes(b)) {
            if (l.groupMetrics !== false) {
              if (!renderedCompactGroup && metricWidgets.length > 0) {
                const compactWidget = this._buildCompactMetricsWidget(l, metricWidgets);
                this._applyWidgetLayout(compactWidget, 'compact_group', l.widgetConfigs?.compact_group);
                canvas.appendChild(compactWidget);
                renderedCompactGroup = true;
              }
            } else {
              const singleCard = this._buildSingleMetricCard(l, w);
              this._applyWidgetLayout(singleCard, w, cfg);
              canvas.appendChild(singleCard);
            }
            return;
          }
          let widgetEl = null;
          if (w === 'power_flow') {
            widgetEl = document.createElement('div');
            widgetEl.dataset.powerFlowHost = 'true';
          } else if (w === 'flow') {
            widgetEl = this._buildFlowWidget(l);
          } else if (w === 'chart') {
            widgetEl = this._buildChartWidget(l);
          } else if (w === 'battery_stack') {
            widgetEl = this._buildBatteryStackWidget(l);
          } else if (w === 'microinverter') {
            widgetEl = this._buildMicroinverterWidget(l, microDevs);
          } else if (w === 'weather' || w === 'solar_forecast') {
            const host = document.createElement('div');
            host.className = 'db-widget-box anma-weather-host';
            this._weatherHosts.push({ host, kind: w });
            widgetEl = host;
          } else if (w === 'inverter_health') {
            widgetEl = this._buildInverterHealthWidget(l);
          } else if (w === 'server_health') {
            widgetEl = this._buildServerHealthWidget(l);
          } else if (w === 'equipment_status') {
            widgetEl = this._buildEquipmentStatusWidget(l);
          } else if (w === 'pv_fields') {
            widgetEl = this._buildPvFieldsWidget(l);
          }
          if (widgetEl) {
            this._applyWidgetLayout(widgetEl, w, cfg);
            canvas.appendChild(widgetEl);
          }
        } catch (widgetErr) {
          console.error('[ANMA] Error rendering widget:', w, widgetErr);
        }
      });

      window.AnmaDashboard.prepareFlowViewport(canvas,l,{uk:languageOf(l,this._hass)==='uk'});
      root.appendChild(canvas.parentElement?.classList.contains('anma-full-preview')?canvas.parentElement:canvas);
      if (typeof root.addEventListener === 'function') {
        root.addEventListener('click', (e) => {
          const target = e.target?.closest?.('[data-sensor-id]');
          if (target && target.dataset.sensorId) {
            this.dispatchEvent(new CustomEvent('hass-more-info', {
              detail: { entityId: target.dataset.sensorId },
              bubbles: true,
              composed: true
            }));
          }
        });
      }
      shadow.appendChild(root);
      this._rendered = true;
      this._updateLiveSensors();
    }

    _buildFlowWidget(l) {
      const card = document.createElement('section');
      card.className = 'db-widget-box db-flow-widget';

      const invDev = (l.devices || []).find(d => d.role === 'inverter');
      const photo = (invDev && l.deviceImages?.[invDev.id]) || l.deviceImages?.['inv-1'] || l.deviceImages?.['inverter'] || l.deviceImages?.['flow'];
      if (photo) {
        card.classList.add('has-photo');
        const wm = document.createElement('div');
        wm.className = 'db-watermark-bg';
        wm.style.backgroundImage = `url('${photo}')`;
        wm.style.opacity = ((l.photoOpacity || 50) / 100).toFixed(2);
        card.appendChild(wm);
      }

      const invDisplayName = invDev?.customName || invDev?.name || this._t('Гібридний інвертор Deye');
      const head = document.createElement('div');
      head.className = 'db-widget-head';
      head.innerHTML = `
        <div>
          <span class="db-eyebrow" style="color:#f59e0b">${escapeHtml(this._t('ГІБРИДНИЙ ІНВЕРТОР'))} · ${l.ratedPower || 6000} W</span>
          <b style="font-size:17px;display:block;margin-top:2px">${escapeHtml(l.widgetConfigs?.flow?.title || invDisplayName)}</b>
          <small style="color:var(--text-faint)">${escapeHtml(this._t('Живий баланс сонця, батареї, будинку та мережі'))}</small>
        </div>
      `;
      card.appendChild(head);

      const wrap = document.createElement('div');
      wrap.className = 'db-flow-container-wrap';

      const hasLiveSensors = this._hass && Object.values(l.bindings || {}).some(id => id && this._hass.states?.[id]);
      const flow = window.AnmaDashboard.renderFlowScene(l, {
        language: languageOf(l, this._hass),
        demo: !hasLiveSensors || this._config?.demo === true
      });

      const sideCol = document.createElement('div');
      sideCol.className = 'db-flow-side-column';
      sideCol.innerHTML = `
        <div class="db-flow-side-card">
          <h4>${escapeHtml(this._t('АКУМУЛЯТОР'))}</h4>
          <div class="db-big-soc" id="anma-side-soc">85%</div>
          <div class="db-progress-track"><span id="anma-side-bar" style="width:85%"></span></div>
          <div class="db-flow-side-spec-row"><span>${escapeHtml(this._t('Стан АКБ'))}</span><b id="anma-side-state">Normal</b></div>
        </div>
        <div class="db-flow-side-card">
          <h4>${escapeHtml(this._t('СТАН СИСТЕМИ'))}</h4>
          <b id="anma-system-state">—</b>
          <div class="db-flow-side-spec-row"><span>${escapeHtml(this._t('Напруга АКБ'))}</span><b id="anma-side-v">53.2 V</b></div>
          <div class="db-flow-side-spec-row"><span>${escapeHtml(this._t('Температура'))}</span><b id="anma-side-t">24.5 °C</b></div>
          <div class="db-flow-side-spec-row"><span>${escapeHtml(this._t('Помилки'))}</span><b id="anma-system-error">—</b></div>
        </div>
      `;

      wrap.append(flow, sideCol);

      // Bottom Today Summary Bar
      const summaryBar = document.createElement('div');
      summaryBar.className = 'db-flow-summary-bar';
      summaryBar.innerHTML = `
        <div class="db-summary-item"><span>${escapeHtml(this._t('Генерація сьогодні'))}</span><b id="anma-sum-solar">24.5 kWh</b></div>
        <div class="db-summary-item"><span>${escapeHtml(this._t('Споживання сьогодні'))}</span><b id="anma-sum-load">12.8 kWh</b></div>
        <div class="db-summary-item"><span>${escapeHtml(this._t('Імпорт із мережі'))}</span><b id="anma-sum-import">1.4 kWh</b></div>
        <div class="db-summary-item"><span>${escapeHtml(this._t('Експорт у мережу'))}</span><b id="anma-sum-export">10.2 kWh</b></div>
      `;

      card.append(wrap, summaryBar);
      return card;
    }

    _buildChartWidget(l) {
      this._activeChartRange=l.widgetConfigs?.chart?.range||'24h';
      const card=window.AnmaDashboard.renderEnergyChart({config:l.widgetConfigs?.chart||{},uk:languageOf(l,this._hass)==='uk',
        onRange:range=>{this._activeChartRange=range;this._chartSignature='';this._refreshHistoryChart();}});
      this._chartArea=card;this._chartSignature='';return card;
    }
    async _refreshHistoryChart(){
      const area=this._chartArea,hass=this._hass;if(!area||!hass)return;
      const uk=languageOf(this._layout,hass)==='uk',range=this._activeChartRange,layout=this._layout;
      const roles=['solar','battery','load','grid'];const mapping={};
      roles.forEach(role=>mapping[role]=(layout.flowMeters?.[role]?.mode==='split'?[role+'_positive_power',role+'_negative_power']:[role+'_power']).map(k=>layout.bindings?.['chart_'+k]||layout.bindings?.[k]));
      const ids=[...new Set(Object.values(mapping).flat().filter(id=>id&&compatible(hass.states?.[id],'power')))];
      const signature=JSON.stringify([range,mapping,layout.flowInverted,Math.floor(Date.now()/60000)]);
      if(signature===this._chartSignature)return;this._chartSignature=signature;
      if(!ids.length){area.setChartData({},uk?'Оберіть датчики потужності в редакторі картки.':'Select power sensors in the card editor.');return;}
      area.setChartData({},uk?'Завантаження історії…':'Loading history…');
      const end=Date.now(),days=({'24h':1,'7d':7,'14d':14,'30d':30,year:365,years:1826})[range]||1,start=end-days*86400000;
      try{
        const isHistory=range==='24h';
        const raw=await hass.callWS(isHistory?{type:'history/history_during_period',start_time:new Date(start).toISOString(),end_time:new Date(end).toISOString(),entity_ids:ids,minimal_response:true,no_attributes:false}:{type:'recorder/statistics_during_period',start_time:new Date(start).toISOString(),end_time:new Date(end).toISOString(),statistic_ids:ids,period:days>30?'month':days>14?'day':'hour',types:['mean'],units:{power:'kW'}});
        if(this._chartArea!==area||this._chartSignature!==signature)return;
        const values={};
        for(const id of ids){let factor=UNITS.power[hass.states[id].attributes.unit_of_measurement]/1000;
          values[id]=(raw[id]||[]).map(p=>{if(p.a?.unit_of_measurement)factor=UNITS.power[p.a.unit_of_measurement]/1000;
            const value=isHistory?p.s:p.mean;
            return {t:isHistory?(p.lu??p.lc)*1000:p.start,end:p.end,v:value===null||value===undefined||value===''||!Number.isFinite(Number(value))?null:Number(value)*(isHistory?factor:1)};
          }).filter(p=>Number.isFinite(p.t)).sort((a,b)=>a.t-b.t);
        }
        const times=isHistory?Array.from({length:481},(_,i)=>start+(end-start)*i/480):[...new Set(Object.values(values).flat().map(p=>p.t))].sort((a,b)=>a-b);
        const indexes={};const at=(id,t)=>{const rows=values[id]||[];let i=indexes[id]??-1;while(i+1<rows.length&&rows[i+1].t<=t)i++;indexes[id]=i;const p=rows[i];return !p||(!isHistory&&t>=(p.end??p.t+3600000))?null:p.v;};
        const result={solar:[],battery:[],load:[],self:[]};
        for(const t of times){const v={};for(const role of roles){const ids=mapping[role],first=at(ids[0],t),second=ids.length===2?at(ids[1],t):0;v[role]=first===null||second===null?null:(first-second)*(layout.flowInverted?.[role]?-1:1);}for(const role of ['solar','battery','load'])result[role].push({t,v:v[role]});result.self.push({t,v:v.solar===null||v.grid===null?null:Math.max(0,v.solar-Math.max(0,-v.grid))});}
        const hasData=Object.values(result).some(rows=>rows.some(p=>p.v!==null));
        area.setChartData(result,hasData?(isHistory?'':uk?'Середня потужність за інтервал · kW':'Mean power per interval · kW'):(uk?'За цей період немає записаної історії або статистики.':'No recorded history or statistics for this period.'));
      }catch(error){if(this._chartArea===area&&this._chartSignature===signature)area.setChartData({},uk?'Не вдалося отримати історію. Натисніть період, щоб повторити.':'Could not load history. Select a period to retry.');}
    }

    _buildBatteryStackWidget(l) {
      const card = document.createElement('section');
      card.className = 'db-widget-box db-card-battery-stack';
      const bList = l.batteryStack || [];

      card.innerHTML = `
        <div class="db-widget-head">
          <div>
            <span class="db-eyebrow" style="color:#37c98b">CAN BMS BRIDGE</span>
            <b style="font-size:15px;display:block">${escapeHtml(l.widgetConfigs?.battery_stack?.title || this._t('▰ Стек акумуляторів (Master / Slave модулі)'))}</b>
          </div>
          <span style="font-size:10.5px;color:#37c98b;font-weight:700">${escapeHtml(this._t('ПОТРІБНІ ОКРЕМІ СЕНСОРИ BMS'))}</span>
        </div>
        <div class="db-battery-stack-list">
          ${bList.map((b, idx) => `
            <div class="db-battery-unit">
              <div class="db-battery-unit-top">
                <span class="db-role-pill">${idx === 0 ? 'MASTER' : 'SLAVE ' + idx}</span>
                <span style="font-weight:700;font-size:12px">${escapeHtml(b.name)}</span>
                <span class="db-battery-soc-num" id="anma-stack-soc-${idx}">${b.soc}%</span>
              </div>
              <div class="db-progress-track">
                <span id="anma-stack-bar-${idx}" style="width:${b.soc}%;background:${b.soc > 20 ? '#37c98b' : '#f59e0b'}"></span>
              </div>
              <div class="db-battery-specs">
                <span>${escapeHtml(this._t('Напруга'))}: <b id="anma-stack-v-${idx}">${escapeHtml(b.voltage)} V</b></span>
                <span>${escapeHtml(this._t('Струм'))}: <b id="anma-stack-a-${idx}">${escapeHtml(b.current)} A</b></span>
                <span>${escapeHtml(this._t('Температура'))}: <b id="anma-stack-t-${idx}">${b.temp} °C</b></span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      const photo = l.deviceImages?.['battery_stack'] || l.deviceImages?.['battery'];
      if (photo) {
        card.classList.add('has-photo');
        const wm = document.createElement('div');
        wm.className = 'db-watermark-bg';
        wm.style.backgroundImage = `url('${photo}')`;
        wm.style.opacity = ((l.photoOpacity || 50) / 100).toFixed(2);
        card.prepend(wm);
      }
      return card;
    }

    _buildMicroinverterWidget(l, microDevs) {
      const card = document.createElement('section');
      card.className = 'db-widget-box db-card-microinverter';
      const dev = microDevs[0] || { name: this._t('Мікроінвертор'), ratedPower: 1600 };
      const chs = dev.mpptChannels?.length ? dev.mpptChannels : [
        { name: 'MPPT 1', maxPower: 500, panelPower: 400, panelModel: '400W Mono PV' },
        { name: 'MPPT 2', maxPower: 500, panelPower: 400, panelModel: '400W Mono PV' },
        { name: 'MPPT 3', maxPower: 500, panelPower: 400, panelModel: '400W Mono PV' },
        { name: 'MPPT 4', maxPower: 500, panelPower: 400, panelModel: '400W Mono PV' }
      ];

      card.innerHTML = `
        <div class="db-widget-head">
          <div>
            <span class="db-eyebrow" style="color:#f59e0b">${escapeHtml(this._t('MPPT МАТРИЦЯ'))}</span>
            <b style="font-size:15px;display:block">▦ ${escapeHtml(dev.customName || dev.name)} (${dev.ratedPower || 1600} W)</b>
          </div>
          <b style="font-size:13px;color:#f59e0b" id="anma-micro-kpi">0 W</b>
        </div>
        <div class="db-mppt-grid">
          ${chs.map((ch, idx) => {
            const eff = Math.min(ch.panelPower || 400, ch.maxPower || 500);
            return `
              <div class="db-mppt-card">
                <div class="db-mppt-card-head">
                  <span class="db-mppt-badge">${escapeHtml(ch.name)}</span>
                  <span class="db-mppt-tag" id="anma-mppt-status-${idx}">—</span>
                </div>
                <div style="font-size:9.5px;color:var(--text-faint)">${escapeHtml(ch.panelModel || '400W Panel')}</div>
                <div class="db-mppt-watts" id="anma-mppt-pwr-${idx}">${eff} W</div>
                <div class="db-progress-track"><span id="anma-mppt-bar-${idx}" style="width:0%"></span></div>
                <div class="db-mppt-electrical">
                  <span id="anma-mppt-v-${idx}">—</span>
                  <span id="anma-mppt-a-${idx}">—</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      return card;
    }

    _buildCompactMetricsWidget(l, metricWidgets) {
      const card = document.createElement('section');
      card.className = 'db-widget-box db-compact-group';
      card.dataset.size = 'full';
      card.dataset.widgetRole = 'compact_group';

      const compactCfg = l.widgetConfigs?.compact_group || {};
      const cols = Math.min(7, Math.max(1, compactCfg.gridColumns || l.gridColumns || 5));

      card.innerHTML = `
        <div class="db-compact-group-head">
          <div>
            <span class="db-eyebrow" style="color:var(--accent,#f1873d)">⚡ ${escapeHtml(this._t('КОМПАКТНІ ПОКАЗНИКИ'))}</span>
            <b style="font-size:16px;display:block">${escapeHtml(compactCfg.title || this._t('Ключові показники енергосистеми'))}</b>
            <small style="color:var(--text-faint)">${escapeHtml(this._t('Живі вимірювання ліній живлення та накопичувачів'))}</small>
          </div>
        </div>
        <div class="db-compact-group-grid" style="--compact-cols: ${cols}; grid-template-columns: repeat(${cols}, minmax(0, 1fr));">
          ${metricWidgets.map(w => this._renderMetricCardHtml(l, w)).join('')}
        </div>
      `;
      return card;
    }

    _renderMetricCardHtml(l, w) {
      const uk = languageOf(l, this._hass) === 'uk';
      const bRole = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
      const cfg = l.widgetConfigs?.[w] || {};
      const nodeColor = l.flowColors?.[bRole] || l.accent || '#f1873d';
      const subCount = Number(cfg.subFields) || 1;
      const subLayout = cfg.subLayout || 'col';

      const titleMap = {
        solar: uk ? 'Сонячні панелі' : 'Solar Panels',
        battery: uk ? 'Акумулятор' : 'Battery',
        load: uk ? 'Споживання' : 'Consumption',
        grid: uk ? 'Мережа' : 'Grid',
        ev: uk ? 'EV-зарядка' : 'EV Charger',
        generator: uk ? 'Генератор' : 'Generator',
        metric: uk ? 'Показник' : 'Metric'
      };
      const icons = {
        solar: '☀', battery: '▰', load: '⌂', grid: '♜', ev: '🚗', generator: '⚙', metric: '⚡'
      };
      const m = typeof w === 'string' ? w.match(/_(\d+)$/) : null;
      const baseLabel = cfg.title || titleMap[bRole] || bRole;
      const displayTitle = m && !cfg.title ? `${baseLabel} #${m[1]}` : baseLabel;
      const icon = icons[bRole] || '⚡';

      const defaultItems = this._getDefaultMetricItems(bRole, uk);
      const items = (Array.isArray(cfg.items) && cfg.items.length)
        ? cfg.items.slice(0, subCount)
        : defaultItems.slice(0, subCount);

      let contentHtml = '';
      if (subCount > 1) {
        contentHtml = `
          <div class="db-subfields-container" data-layout="${subLayout === 'auto' ? 'col' : subLayout}">
            ${items.map((it, idx) => `
              <div class="db-subfield-item" data-sensor-id="${escapeHtml(it.sensor || '')}">
                <div class="db-subfield-label">${escapeHtml(it.label)}</div>
                <div class="db-subfield-val">
                  <span id="anma-metric-${escapeHtml(w)}-val-${idx}">${escapeHtml(it.val || '—')}</span>
                  <small id="anma-metric-${escapeHtml(w)}-unit-${idx}">${escapeHtml(it.unit || '')}</small>
                </div>
                <div class="db-subfield-progress">
                  <span id="anma-metric-${escapeHtml(w)}-bar-${idx}" style="width:${escapeHtml(it.pct || '50%')};background:${nodeColor}"></span>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        const mainItem = items[0] || { val: '—', unit: 'kW', pct: '50%' };
        contentHtml = `
          <div class="db-metric-value" data-sensor-id="${escapeHtml(mainItem.sensor || '')}">
            <span id="anma-metric-${escapeHtml(w)}-val-0">${escapeHtml(mainItem.val || '—')}</span>
            <small id="anma-metric-${escapeHtml(w)}-unit-0">${escapeHtml(mainItem.unit || '')}</small>
          </div>
          <div class="db-meter">
            <span id="anma-metric-${escapeHtml(w)}-bar-0" style="width:${escapeHtml(mainItem.pct || '50%')};background:${nodeColor}"></span>
          </div>
        `;
      }

      const photo = l.deviceImages?.[w] || l.deviceImages?.[bRole];
      const hasPhotoClass = photo ? ' has-photo' : '';
      const photoWatermark = photo ? `<div class="db-watermark-bg" style="background-image:url('${escapeHtml(photo)}');opacity:${((l.photoOpacity || 50) / 100).toFixed(2)}"></div>` : '';

      return `
        <div class="db-compact-card db-metric${hasPhotoClass}" data-widget-role="${escapeHtml(w)}">
          ${photoWatermark}
          <div class="db-widget-head">
            <b>${escapeHtml(displayTitle)}</b>
            <span>${icon}</span>
          </div>
          ${contentHtml}
        </div>
      `;
    }

    _buildSingleMetricCard(l, w) {
      const card = document.createElement('section');
      card.className = 'db-widget-box db-compact-card db-metric';
      card.dataset.widgetRole = escapeHtml(w);
      card.innerHTML = this._renderMetricCardHtml(l, w);
      return card;
    }

    _buildInverterHealthWidget(l) {
      const card = document.createElement('section');
      card.className = 'db-widget-box db-card-telemetry';
      card.dataset.widgetRole = 'inverter_health';
      card.innerHTML = `
        <div class="db-widget-head">
          <b>⚡ ${escapeHtml(this._t('Стан інвертора та мережі'))}</b>
          <span class="db-status-badge ok" id="anma-inverter-badge">ОНЛАЙН · ГІБРИД</span>
        </div>
        <div class="db-telemetry-grid">
          <div class="db-telemetry-item" data-sensor-id="${escapeHtml(l.bindings?.grid_voltage || 'sensor.grid_voltage')}">
            <span>${escapeHtml(this._t('Напруга мережі'))}</span>
            <b id="anma-telemetry-v">230.0 V</b>
          </div>
          <div class="db-telemetry-item" data-sensor-id="${escapeHtml(l.bindings?.grid_frequency || 'sensor.grid_frequency')}">
            <span>${escapeHtml(this._t('Частота мережі'))}</span>
            <b id="anma-telemetry-f">50.00 Hz</b>
          </div>
          <div class="db-telemetry-item" data-sensor-id="${escapeHtml(l.bindings?.inverter_temp || 'sensor.inverter_temperature')}">
            <span>${escapeHtml(this._t('Температура'))}</span>
            <b id="anma-telemetry-t">38.0 °C</b>
          </div>
          <div class="db-telemetry-item">
            <span>${escapeHtml(this._t('ККД інвертора'))}</span>
            <b id="anma-telemetry-eff">98.2 %</b>
          </div>
        </div>
      `;
      const photo = l.deviceImages?.['inverter_health'] || l.deviceImages?.['inverter'] || l.deviceImages?.['inv-1'];
      if (photo) {
        card.classList.add('has-photo');
        const wm = document.createElement('div');
        wm.className = 'db-watermark-bg';
        wm.style.backgroundImage = `url('${photo}')`;
        wm.style.opacity = ((l.photoOpacity || 50) / 100).toFixed(2);
        card.prepend(wm);
      }
      return card;
    }

    _buildServerHealthWidget(l) {
      const card = document.createElement('section');
      card.className = 'db-widget-box db-card-server';
      card.dataset.widgetRole = 'server_health';
      card.style.gridColumn = '1 / -1';
      card.innerHTML = `
        <div class="db-widget-head">
          <b>🖥 ${escapeHtml(this._t('Стан сервера (Home Assistant · локальні дані)'))}</b>
          <small style="color:#20bda0">● ОНЛАЙН</small>
        </div>
        <div class="db-server-grid">
          <div class="db-server-card" data-sensor-id="${escapeHtml(l.bindings?.server_cpu || 'sensor.processor_use')}">
            <div class="db-server-card-top">
              <span class="db-server-badge">CPU</span>
              <span class="db-server-name">${escapeHtml(this._t('Процесор'))}</span>
            </div>
            <div class="db-server-val" id="anma-server-cpu">—</div>
            <div class="db-server-sub">${escapeHtml(this._t('Навантаження'))}</div>
          </div>
          <div class="db-server-card" data-sensor-id="${escapeHtml(l.bindings?.server_ram || 'sensor.memory_use_percent')}">
            <div class="db-server-card-top">
              <span class="db-server-badge">RAM</span>
              <span class="db-server-name">${escapeHtml(this._t('Пам’ять'))}</span>
            </div>
            <div class="db-server-val" id="anma-server-ram">—</div>
            <div class="db-server-sub">${escapeHtml(this._t('Використано'))}</div>
          </div>
          <div class="db-server-card" data-sensor-id="${escapeHtml(l.bindings?.server_disk || 'sensor.disk_use_percent')}">
            <div class="db-server-card-top">
              <span class="db-server-badge">SSD</span>
              <span class="db-server-name">${escapeHtml(this._t('Диск'))}</span>
            </div>
            <div class="db-server-val" id="anma-server-disk">—</div>
            <div class="db-server-sub">${escapeHtml(this._t('Використано'))}</div>
          </div>
          <div class="db-server-card">
            <div class="db-server-card-top">
              <span class="db-server-badge">CTRL</span>
              <span class="db-server-name">${escapeHtml(this._t('Контур'))}</span>
            </div>
            <div class="db-server-val">${l.ratedPower || 6000} W</div>
            <div class="db-server-sub">${escapeHtml(this._t('Номінальна потужність'))}</div>
          </div>
        </div>
      `;
      return card;
    }

    _buildEquipmentStatusWidget(l) {
      const card = document.createElement('section');
      card.className = 'db-widget-box db-equipment-section';
      card.dataset.widgetRole = 'equipment_status';
      const inverters = (l.inverterStack && l.inverterStack.length) ? l.inverterStack : [
        { id: 'inv-1', name: this._t('Гібридний інвертор'), phase: 'Deye', power: l.ratedPower || 6000, status: 'В СИСТЕМІ' }
      ];
      card.innerHTML = `
        <div class="db-widget-head">
          <b>⚡ ${escapeHtml(this._t('Огляд інверторів (Кільця стану)'))}</b>
          <span style="font-size:11px;color:#20bda0">● ${escapeHtml(this._t('В СИСТЕМІ'))}</span>
        </div>
        <div class="db-inverter-rings-strip">
          ${inverters.map((inv, idx) => `
            <article class="db-inverter-ring-card" data-example="true">
              <div class="db-ring-circle">
                <span class="db-ring-icon-symbol">${inv.type === 'micro' ? '▦' : 'ϟ'}</span>
                <b class="db-ring-name">${escapeHtml(inv.name)}</b>
                <div class="db-ring-power" id="anma-inv-power-${idx}">${inv.power ? inv.power + ' W' : '—'}</div>
                <small class="db-ring-brand">${escapeHtml(inv.phase || 'Deye')}</small>
                <span class="db-ring-status-dot green" id="anma-inv-status-${idx}">● ${escapeHtml(inv.status || 'В СИСТЕМІ')}</span>
              </div>
            </article>
          `).join('')}
        </div>
      `;
      const photo = l.deviceImages?.['equipment_status'] || l.deviceImages?.['inverters'] || l.deviceImages?.['inverter'] || l.deviceImages?.['inv-1'];
      if (photo) {
        card.classList.add('has-photo');
        const wm = document.createElement('div');
        wm.className = 'db-watermark-bg';
        wm.style.backgroundImage = `url('${photo}')`;
        wm.style.opacity = ((l.photoOpacity || 50) / 100).toFixed(2);
        card.prepend(wm);
      }
      return card;
    }

    _buildPvFieldsWidget(l) {
      const card = document.createElement('section');
      card.className = 'db-widget-box db-equipment-section';
      card.dataset.widgetRole = 'pv_fields';
      card.style.gridColumn = '1 / -1';
      const pvs = (l.pvFields && l.pvFields.length) ? l.pvFields : [
        { name: 'PV 1', mppt: 'MPPT 1', orientation: 'Південь', sensors: {} },
        { name: 'PV 2', mppt: 'MPPT 2', orientation: 'Захід', sensors: {} }
      ];
      card.innerHTML = `
        <div class="db-widget-head">
          <div>
            <b>▦ ${escapeHtml(this._t('Схема PV-полів (MPPT матриця)'))}</b>
            <small style="color:var(--text-faint);display:block">${escapeHtml(this._t('Фактичні підключення сонячних полів'))}</small>
          </div>
          <span style="color:#f59e0b;font-size:12px;font-weight:700" id="anma-pvfields-total">0 W</span>
        </div>
        <div class="db-pv-field-grid">
          ${pvs.map((pv, idx) => `
            <article class="db-pv-field">
              <div class="db-pv-field-top">
                <span class="db-pv-subicon">☷</span>
                <span class="db-pv-tag green">${escapeHtml(pv.mppt || 'MPPT ' + (idx + 1))}</span>
              </div>
              <h5>${escapeHtml(pv.name || 'PV ' + (idx + 1))}</h5>
              <p>${escapeHtml(pv.orientation || '—')}</p>
              <b class="db-pv-watts" id="anma-pvfield-w-${idx}">—</b>
              <div class="db-pv-electrical">
                <span id="anma-pvfield-v-${idx}">— V</span>
                <span id="anma-pvfield-a-${idx}">— A</span>
              </div>
            </article>
          `).join('')}
        </div>
      `;
      const photo = l.deviceImages?.['pv_fields'] || l.deviceImages?.['solar'] || l.deviceImages?.['pv'];
      if (photo) {
        card.classList.add('has-photo');
        const wm = document.createElement('div');
        wm.className = 'db-watermark-bg';
        wm.style.backgroundImage = `url('${photo}')`;
        wm.style.opacity = ((l.photoOpacity || 50) / 100).toFixed(2);
        card.prepend(wm);
      }
      return card;
    }

    _getDefaultMetricItems(role, uk) {
      return getDefaultMetricItems(role, uk);
    }

    _updateLiveStates() {
      return this._updateLiveSensors();
    }

    _updateLiveSensors() {
      for (const host of this.shadowRoot?.querySelectorAll('[data-power-flow-host]') || []) {
        window.AnmaPowerFlow.update(host,this._layout, {uk:languageOf(this._layout,this._hass)==='uk',hass:this._hass});
      }
      if (!this._rendered) return;
      this._refreshHistoryChart();
      if(this._elementsHost && window.AnmaDashboard) this._elementsHost.replaceChildren(window.AnmaDashboard.renderElements(this._layout?.elements,{states:this._hass?.states||{}}));
      const b = this._layout?.bindings || {}, shadow = this.shadowRoot;
      const read = (key, kind) => reading(this._hass, b[key], kind);
      const power = key => window.AnmaDashboard.flowPower(this._layout,key,k=>read(k,'power'));
      const put = (id, value) => { const el = shadow.getElementById('anma-' + id); if (el) el.textContent = this._t(value); };
      const number = (value, unit, digits=1) => value === null ? '—' : value.toFixed(digits) + unit;
      const watts = val => val === null ? '—' : this._formatWatts(val);
      ['solar','grid','load','inverter','ev','generator'].forEach(key => put('val-' + key, watts(power(key))));
      const soc = read('battery_soc','soc'), bp = power('battery'), gp = power('grid');
      ['solar','grid','load','battery','ev','generator'].forEach(key => {
        const value = power(key), path = shadow.getElementById('anma-flow-'+key);
        if (!path) return;
        path.style.animationPlayState = value === null || value === 0 || this._layout?.motion === false ? 'paused' : 'running';
        path.style.animationDuration = window.AnmaDashboard.flowDuration(this._layout,key,value)+'s';
        path.style.opacity = value === null || value === 0 ? '0.15' : '1';
        path.style.animationDirection = (key === 'load' || key === 'ev' ? value >= 0 : value < 0) ? 'reverse' : 'normal';
      });
      put('val-battery', number(soc,'%',0));
      put('sub-battery', watts(bp));
      put('sub-grid', gp === null ? 'Не підключено' : gp > 0 ? 'Імпорт' : gp < 0 ? 'Експорт' : 'Немає потоку');
      put('side-state', b.battery_status ? read('battery_status','text') ?? '—' : bp === null ? '—' : bp > 0 ? 'Розряд' : bp < 0 ? 'Заряд' : 'Очікування');
      put('side-soc', number(soc,'%',0));
      const bar = shadow.getElementById('anma-side-bar');
      if (bar) bar.style.width = (soc ?? 0) + '%';
      put('side-v', number(read('battery_voltage','voltage'),' V'));
      put('side-t', number(read('battery_temp','temperature'),' °C'));
      put('frequency', number(read('grid_frequency','frequency'),' Hz'));
      put('inverter-state', read('inverter_mode','text') ?? '—');
      put('system-state', read(b.system_status ? 'system_status' : 'inverter_mode','text') ?? '—');
      put('system-error', read('system_error','text') ?? '—');
      [['solar','solar_daily_energy'],['load','load_daily_energy'],['import','grid_daily_import'],['export','grid_daily_export']]
        .forEach(([id,key]) => put('sum-'+id, number(read(key,'energy'),' kWh',2)));
      (this._layout?.batteryStack || []).forEach((bat, idx) => {
        const key = 'battery_' + idx + '_';
        const socVal = (bat.sensors?.soc ? reading(this._hass, bat.sensors.soc, 'soc') : null) ?? (b[key+'soc'] ? read(key+'soc','soc') : (idx === 0 ? soc : null));
        put('stack-soc-'+idx, number(socVal,'%',0));
        const bar = shadow.getElementById('anma-stack-bar-'+idx);
        if (bar) bar.style.width = (socVal ?? 0) + '%';
        const vVal = (bat.sensors?.voltage ? reading(this._hass, bat.sensors.voltage, 'voltage') : null) ?? (b[key+'voltage'] ? read(key+'voltage','voltage') : (idx === 0 ? read('battery_voltage','voltage') : null));
        put('stack-v-'+idx, number(vVal,' V'));
        const aVal = (bat.sensors?.current ? reading(this._hass, bat.sensors.current, 'current') : null) ?? (b[key+'current'] ? read(key+'current','current') : (idx === 0 ? read('battery_current','current') : null));
        put('stack-a-'+idx, number(aVal,' A'));
        const tVal = (bat.sensors?.temp ? reading(this._hass, bat.sensors.temp, 'temperature') : null) ?? (b[key+'temp'] ? read(key+'temp','temperature') : (idx === 0 ? read('battery_temp','temperature') : null));
        put('stack-t-'+idx, number(tVal,' °C'));
      });
      (window.AnmaDashboard?.flowDetails(this._layout)||[]).forEach((row,i)=>row.measurements.forEach((m,j)=>{
        const value=reading(this._hass,m.sensor,m.kind);
        put('detail-'+i+'-'+j,value===null?'—':m.kind==='power'?watts(value):Number(value.toFixed(2))+' '+m.unit);
        if (row.kind === 'pv' && m.kind === 'power') {
          const path = shadow.getElementById('anma-flow-' + row.key);
          if (path) {
            path.style.animationPlayState = value === null || value === 0 || this._layout.motion === false ? 'paused' : 'running';
            path.style.animationDuration = window.AnmaDashboard.flowDuration(this._layout, 'solar', value) + 's';
            path.style.animationDirection = value < 0 ? 'reverse' : 'normal';
            path.style.opacity = value === null || value === 0 ? '0.15' : '1';
          }
        }
      }));
      // Update Compact Metrics live values
      const liveMetricWidgets = (this._layout?.widgets || []).filter(w => {
        const bRole = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
        return ['solar', 'battery', 'load', 'grid', 'generator', 'ev', 'metric'].includes(bRole);
      });
      const metricFallbacks = {
        solar: ['solar_power', 'solar_daily_energy', 'pv1_voltage', 'pv1_current'],
        battery: ['battery_soc', 'battery_power', 'battery_voltage', 'battery_temp'],
        load: ['load_power', 'load_daily_energy', 'grid_frequency', 'grid_voltage'],
        grid: ['grid_power', 'grid_daily_import', 'grid_daily_export', 'grid_voltage'],
        ev: ['ev_power'],
        generator: ['generator_power']
      };
      liveMetricWidgets.forEach(w => {
        const bRole = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
        const cfg = this._layout?.widgetConfigs?.[w] || {};
        const subCount = Number(cfg.subFields) || 1;
        const defaultItems = this._getDefaultMetricItems(bRole, languageOf(this._layout, this._hass) === 'uk');
        const items = (Array.isArray(cfg.items) && cfg.items.length)
          ? cfg.items.slice(0, subCount)
          : defaultItems.slice(0, subCount);

        items.forEach((it, idx) => {
          const valEl = shadow.getElementById(`anma-metric-${w}-val-${idx}`);
          const barEl = shadow.getElementById(`anma-metric-${w}-bar-${idx}`);
          if (!valEl) return;

          let sensorId = it.sensor;
          if (!sensorId && metricFallbacks[bRole]?.[idx]) {
            const bKey = metricFallbacks[bRole][idx];
            sensorId = b[bKey];
          }

          if (sensorId && this._hass?.states?.[sensorId]) {
            const st = this._hass.states[sensorId];
            const rawVal = st.state;
            if (rawVal !== 'unknown' && rawVal !== 'unavailable') {
              const numVal = Number(rawVal);
              if (Number.isFinite(numVal)) {
                const uom = it.unit || st.attributes?.unit_of_measurement || '';
                if (uom.toLowerCase() === 'w' && Math.abs(numVal) >= 1000) {
                  valEl.textContent = (numVal / 1000).toFixed(2);
                  const unitEl = shadow.getElementById(`anma-metric-${w}-unit-${idx}`);
                  if (unitEl) unitEl.textContent = 'kW';
                } else if (Math.abs(numVal) >= 100) {
                  valEl.textContent = Math.round(numVal).toString();
                } else {
                  valEl.textContent = numVal.toFixed(numVal % 1 === 0 ? 0 : 1);
                }

                if (barEl) {
                  let pct = 50;
                  if (uom === '%') {
                    pct = Math.max(0, Math.min(100, numVal));
                  } else if (uom.toLowerCase() === 'v') {
                    pct = bRole === 'battery' ? Math.max(0, Math.min(100, ((numVal - 42) / 16) * 100)) : Math.max(0, Math.min(100, (numVal / 250) * 100));
                  } else if (uom.toLowerCase().includes('w')) {
                    const rated = this._layout?.ratedPower || 6000;
                    const wVal = uom.toLowerCase() === 'kw' ? numVal * 1000 : numVal;
                    pct = Math.max(0, Math.min(100, (Math.abs(wVal) / rated) * 100));
                  }
                  barEl.style.width = pct + '%';
                }
              } else {
                valEl.textContent = rawVal;
              }
            }
          }
        });
      });
      const micro = (this._layout?.devices || []).find(d => d.category === 'microinverters');
      let total = 0, complete = !!micro?.mpptChannels?.length;
      (micro?.mpptChannels || []).forEach((ch,idx) => {
        const value = reading(this._hass, ch.sensor, 'power');
        put('mppt-pwr-'+idx, watts(value));
        put('mppt-v-'+idx, number(read('mppt_'+idx+'_voltage','voltage'),' V'));
        put('mppt-a-'+idx, number(read('mppt_'+idx+'_current','current'),' A'));
        put('mppt-status-'+idx, read('mppt_'+idx+'_status','text') ?? '—');
        const bar=shadow.getElementById('anma-mppt-bar-'+idx);if(bar)bar.style.width=Math.max(0,Math.min(100,(value||0)/(ch.maxPower||500)*100))+'%';
        if (value === null) complete = false; else total += value;
      });
      put('micro-kpi', watts(complete ? total : null));

      // Update Server Health live values
      const cpuVal = read('server_cpu', 'percent') ?? (this._hass?.states?.[b.server_cpu]?.state != null ? parseFloat(this._hass.states[b.server_cpu].state) : null);
      if (cpuVal !== null && !isNaN(cpuVal)) put('server-cpu', cpuVal.toFixed(1) + ' %');
      const ramVal = read('server_ram', 'percent') ?? (this._hass?.states?.[b.server_ram]?.state != null ? parseFloat(this._hass.states[b.server_ram].state) : null);
      if (ramVal !== null && !isNaN(ramVal)) put('server-ram', ramVal.toFixed(1) + ' %');
      const diskVal = read('server_disk', 'percent') ?? (this._hass?.states?.[b.server_disk]?.state != null ? parseFloat(this._hass.states[b.server_disk].state) : null);
      if (diskVal !== null && !isNaN(diskVal)) put('server-disk', diskVal.toFixed(1) + ' %');

      // Update Telemetry & Inverter Health live values
      put('telemetry-v', number(read('grid_voltage', 'voltage'), ' V', 1));
      put('telemetry-f', number(read('grid_frequency', 'frequency'), ' Hz', 2));
      put('telemetry-t', number(read('inverter_temp', 'temperature'), ' °C', 1));

      const invMode = read('inverter_mode', 'text');
      const invBadge = shadow.getElementById('anma-inverter-badge');
      if (invBadge && invMode) {
        invBadge.textContent = this._t(invMode.toUpperCase()) + ' · ГІБРИД';
        const isOk = ['Normal', 'OK', 'В СИСТЕМІ', 'on'].includes(invMode);
        invBadge.className = 'db-status-badge ' + (isOk ? 'ok' : 'warn');
      }

      // Update Equipment Rings live values
      (this._layout?.inverterStack || []).forEach((inv, idx) => {
        const invSensor = inv.powerSensor || inv.sensor || b['inverter_' + idx + '_power'];
        let p = null;
        if (invSensor) {
          p = reading(this._hass, invSensor, 'power');
        } else if (idx === 0) {
          p = power('inverter');
        }
        if (p !== null) {
          put('inv-power-' + idx, watts(p));
        } else if (invSensor && this._hass?.states?.[invSensor]) {
          const st = this._hass.states[invSensor].state;
          if (st === 'unavailable' || st === 'unknown') {
            put('inv-power-' + idx, '0 W');
          }
        }

        const stSensor = inv.statusSensor || inv.stateSensor || b['inverter_' + idx + '_status'];
        const statusEl = shadow.getElementById('anma-inv-status-' + idx);
        if (statusEl) {
          let rawSt = null;
          if (stSensor && this._hass?.states?.[stSensor]) {
            rawSt = this._hass.states[stSensor].state;
          } else if (idx === 0 && b.inverter_mode && this._hass?.states?.[b.inverter_mode]) {
            rawSt = this._hass.states[b.inverter_mode].state;
          }
          if (rawSt) {
            const isOk = ['Normal', 'OK', 'on', 'В СИСТЕМІ', 'normal', 'ok'].includes(rawSt);
            const isOff = ['unavailable', 'unknown', 'off', 'Standby', 'standby', 'sleep'].includes(rawSt);
            statusEl.className = 'db-ring-status-dot ' + (isOk ? 'green' : isOff ? 'yellow' : 'red');
            statusEl.textContent = '● ' + this._t(rawSt === 'unavailable' ? 'Очікування' : rawSt);
          }
        }
      });

      // Update PV Fields live values
      let pvTotalWatts = 0;
      (this._layout?.pvFields || []).forEach((pv, idx) => {
        const pKey = pv.sensors?.power || `pv${idx + 1}_power`;
        const vKey = pv.sensors?.voltage || `pv${idx + 1}_voltage`;
        const aKey = pv.sensors?.current || `pv${idx + 1}_current`;
        const pVal = reading(this._hass, pKey, 'power');
        const vVal = reading(this._hass, vKey, 'voltage');
        const aVal = reading(this._hass, aKey, 'current');
        if (pVal !== null) {
          put('pvfield-w-' + idx, watts(pVal));
          pvTotalWatts += pVal;
        } else if (pKey && (this._hass?.states?.[pKey]?.state === 'unavailable' || this._hass?.states?.[pKey]?.state === 'unknown')) {
          put('pvfield-w-' + idx, '0 W');
        }
        if (vVal !== null) {
          put('pvfield-v-' + idx, number(vVal, ' V', 1));
        } else if (vKey && (this._hass?.states?.[vKey]?.state === 'unavailable' || this._hass?.states?.[vKey]?.state === 'unknown')) {
          put('pvfield-v-' + idx, '0.0 V');
        }
        if (aVal !== null) {
          put('pvfield-a-' + idx, number(aVal, ' A', 1));
        } else if (aKey && (this._hass?.states?.[aKey]?.state === 'unavailable' || this._hass?.states?.[aKey]?.state === 'unknown')) {
          put('pvfield-a-' + idx, '0.0 A');
        }
      });
      if (pvTotalWatts > 0) put('pvfields-total', watts(pvTotalWatts));

      if(this._weatherHosts?.length){
        const states=this._hass?.states||{},resolved=window.AnmaDashboard.solcastBindings(states,b),weatherId=this._weatherConnection(),weather=states[weatherId]?.attributes||{},sun=states[b.sun_entity||'sun.sun'];
        const dayKey=date=>new Date(date).toLocaleDateString('en-CA',{timeZone:this._hass?.config?.time_zone||undefined});
        const daily=i=>{const date=new Date();date.setDate(date.getDate()+i);return (this._weatherForecast||weather.forecast||[]).find(d=>dayKey(d.datetime)===dayKey(date))||{};};
        const readWeather=key=>{
          if(b[key]){const kind=key.startsWith('forecast_day_')?'energy':key.startsWith('forecast_peak_')?'power':'text',v=read(key,kind);return kind==='power'&&v!==null?v/1000:v;}
          const match=/^forecast_(day|peak|condition|hours)_(\d)$/.exec(key);
          if(match){const [,kind,i]=match,entity=states[resolved['forecast_day_'+i]];
            if(kind==='day')return reading(this._hass,resolved[key],'energy');
            if(kind==='condition')return daily(Number(i)).condition??null;
            if(kind==='peak'){const points=entity?.attributes?.detailedForecast||entity?.attributes?.detailed_forecast||[];const values=points.map(p=>p.pv_estimate).filter(v=>typeof v==='number'&&Number.isFinite(v));return values.length?Math.max(...values):null;}
            return null;
          }
          if(key==='daylight_hours')return window.AnmaDashboard.daylightHours(this._hass?.config?.latitude,new Date(),this._hass?.config?.time_zone);
          if(key==='sun_elevation')return sun?.attributes?.elevation??null;
          if(key==='cloud_cover')return weather.cloud_coverage??daily(0).cloud_coverage??null;
          if(key==='rain_probability')return daily(0).precipitation_probability??null;
          return null;
        };
        const keys=['sun_elevation','solar_irradiance','daylight_hours','rain_probability','rain_rate','cloud_cover',...Array.from({length:7},(_,i)=>['day','peak','hours','condition'].map(k=>'forecast_'+k+'_'+i)).flat()];
        const values=Object.fromEntries(keys.map(k=>[k,readWeather(k)]));
        for(const item of this._weatherHosts){const signature=JSON.stringify([this._layout.widgetConfigs?.[item.kind],values]);if(item.signature===signature)continue;item.signature=signature;
          item.host.replaceChildren(window.AnmaDashboard.renderWeather(item.kind,this._layout,{uk:languageOf(this._layout,this._hass)==='uk',read:key=>values[key]??null,change:()=>{item.signature=null;this._updateLiveSensors();}}));}
      }
    }
  }

  // One public card for every template. A private versioned renderer also lets
  // an already-registered legacy element forward to this bundle safely.
  const rendererTag='anma-card-runtime-'+CARD_VERSION.replaceAll('.','-');
  if(!customElements.get(rendererTag))customElements.define(rendererTag,AnmaCard);
  const existingCard=customElements.get('anma-card');
  if(!existingCard){
    customElements.define('anma-card',class extends AnmaCard {});
  }else{
    const mount=function(){
      if(this._anmaCurrentRenderer?.localName===rendererTag)return this._anmaCurrentRenderer;
      const child=document.createElement(rendererTag);
      const host=this.shadowRoot||this.attachShadow({mode:'open'});
      host.replaceChildren(child);this._anmaCurrentRenderer=child;
      return child;
    };
    Object.defineProperty(existingCard.prototype,'setConfig',{configurable:true,value:function(config){
      this._config=config;const child=mount.call(this);child.setConfig(config);
      if(this._hass)child.hass=this._hass;
    }});
    Object.defineProperty(existingCard.prototype,'hass',{configurable:true,get(){return this._hass;},set(value){
      this._hass=value;const child=mount.call(this);
      if(!child._config&&this._config)child.setConfig(this._config);
      child.hass=value;
    }});
    Object.defineProperty(existingCard.prototype,'connectedCallback',{configurable:true,value:function(){
      if(this._config)this.setConfig(this._config);
    }});
    Object.defineProperty(existingCard.prototype,'disconnectedCallback',{configurable:true,value:function(){}});
  }
  if(!customElements.get('anma-dashboard-card'))customElements.define('anma-dashboard-card',class extends AnmaCard {});
  // Compatibility only for YAML exported by 0.6.3; never exported or advertised.
  if(!customElements.get('anma-energy-station'))customElements.define('anma-energy-station',class extends AnmaCard {});

  class AnmaCardEditor extends HTMLElement {
    _t(text) { return translate(languageOf(this._config?.layout, this._hass), text); }
    _getDefaultMetricItems(role, uk) { return getDefaultMetricItems(role, uk); }

    setConfig(config) {
      if (!config) return;
      try {
        let rawLayout = config.layout || config;
        if (typeof rawLayout === 'string') {
          try { rawLayout = JSON.parse(rawLayout); } catch (_) {}
        }
        if (typeof rawLayout !== 'object' || rawLayout === null) rawLayout = {};
        const normalizedConfig = { ...config, type: 'custom:anma-card', layout: rawLayout };
        const previous = languageOf(this._config?.layout, this._hass);
        // HA echoes config-changed back while the user is still typing.
        if(this.shadowRoot && JSON.stringify(this._config)===JSON.stringify(normalizedConfig))return;
        this._config = normalizedConfig;
        if (!this.shadowRoot || previous !== languageOf(normalizedConfig.layout, this._hass)) this._build();
        this._rows();
        const langCtrl = this.shadowRoot?.querySelector('[data-control=language]');
        if (langCtrl) langCtrl.value = normalizedConfig.layout?.language || 'auto';
        const opacity = this.shadowRoot?.querySelector('[data-control=opacity]');
        if (opacity && this.shadowRoot?.activeElement !== opacity) {
          opacity.value = normalizedConfig.layout?.background?.opacity ?? 15;
          if (opacity.previousElementSibling) opacity.previousElementSibling.textContent = ' ' + opacity.value + '%';
        }
      } catch (err) {
        console.error('AnmaCardEditor setConfig error:', err);
      }
    }

    set hass(hass) {
      const previous = languageOf(this._config?.layout, this._hass);
      this._hass = hass;
      if (!this.shadowRoot) return;
      if (previous !== languageOf(this._config?.layout, hass)) {
        this._build();
        this._rows();
      }
      if (this._connection !== hass?.connection) {
        this._connection = hass?.connection;
        this._loadRegistry();
      }
      const keys = Object.keys(hass?.states || {}).sort().join('|');
      if (keys !== this._stateKeys) {
        this._stateKeys = keys;
        this._options();
      }
      this._values();
      this.shadowRoot.querySelectorAll('.apf-settings input').forEach(input=>input._refreshEntityStatus?.());
    }

    _node(tag, text, parent) {
      const el = document.createElement(tag);
      if (text) el.textContent = this._t(text);
      if (parent) parent.append(el);
      return el;
    }

    _build() {
      const shell = this.shadowRoot || this.attachShadow({ mode: 'open' });
      shell.replaceChildren();
      this._schema = null;
      const uk = languageOf(this._config?.layout, this._hass) === 'uk';

      const style = this._node('style', '', shell);
      style.textContent = `
        :host {
          display: block;
          min-width: 0;
          color-scheme: dark !important;
          background: #0d1117 !important;
          color: #f3f4f6 !important;
          --card-background-color: #0d1117;
          --input-fill-color: #141923;
          --primary-color: #ff8730;
          --accent: #f1873d;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          font-size: 13px;
          line-height: 1.5;
        }
        * { box-sizing: border-box; }
        .anma-editor-nav {
          position: sticky;
          top: 0;
          z-index: 20;
          background: #0d1117 !important;
          padding: 8px 0 6px;
          font-weight: 700;
          display: block;
          color: #ff8730 !important;
          border-bottom: 1px solid #1f2736;
        }
        .anma-editor-search-row {
          position: sticky;
          top: 48px;
          z-index: 19;
          background: #0d1117 !important;
          padding: 6px 0 10px;
          border-bottom: 1px solid #1f2736;
          margin-bottom: 12px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        label {
          display: block;
          margin: 10px 0;
          min-width: 0;
          font-size: 13px;
          font-weight: 600;
          color: #e5e7eb;
        }
        input:not([type=checkbox]), select {
          display: block;
          width: 100%;
          margin: 5px 0 0;
          padding: 9px 12px;
          border-radius: 7px;
          border: 1px solid #283344 !important;
          background-color: #141923 !important;
          color: #ff8730 !important;
          color-scheme: dark !important;
          font: inherit;
          font-size: 13px;
          font-weight: 500;
          transition: border-color 0.15s, box-shadow 0.15s, background-color 0.15s;
        }
        input:not([type=checkbox]):focus, select:focus {
          outline: none;
          border-color: #ff8730 !important;
          box-shadow: 0 0 0 2px rgba(255, 135, 48, 0.35) !important;
          background-color: #18202d !important;
        }
        input:not([type=checkbox])::placeholder {
          color: #64748b !important;
        }
        select {
          cursor: pointer;
        }
        option, optgroup {
          background-color: #10141b !important;
          color: #ff8730 !important;
          color-scheme: dark !important;
          padding: 8px 12px;
          font-size: 13px;
        }
        option:hover, option:focus, option:checked {
          background-color: #242d3d !important;
          color: #ffa54c !important;
          font-weight: 600;
        }
        fieldset {
          min-width: 0;
          border: 1px solid #232c3d;
          border-radius: 9px;
          margin: 12px 0;
          padding: 12px 14px;
          background: #121722;
          transition: border-color 0.15s;
        }
        fieldset:hover {
          border-color: #37445a;
        }
        legend {
          font-weight: 700;
          padding: 0 8px;
          color: #ff8730;
          font-size: 13.5px;
          letter-spacing: 0.02em;
        }
        details {
          min-width: 0;
          border: 1px solid #232c3d;
          border-radius: 9px;
          margin: 12px 0;
          padding: 10px 14px;
          background: #121722;
        }
        summary {
          cursor: pointer;
          font-weight: 700;
          color: #ff8730;
          padding: 6px 0;
          font-size: 14px;
          user-select: none;
          transition: color 0.15s;
        }
        summary:hover {
          color: #ffa54c;
        }
        button {
          font: inherit;
          font-size: 12.5px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 7px;
          border: 1px solid #2e3a4e !important;
          background: #18202d !important;
          color: #ff8730 !important;
          cursor: pointer;
          transition: all 0.15s ease;
          margin: 6px 8px 6px 0;
        }
        button:hover {
          background: #242f42 !important;
          border-color: #ff8730 !important;
          color: #ffa54c !important;
          box-shadow: 0 2px 10px rgba(255, 135, 48, 0.25);
        }
        button:active {
          transform: translateY(1px);
        }
        p {
          color: #94a3b8;
          font-size: 12.5px;
          line-height: 1.45;
          margin: 8px 0;
          overflow-wrap: anywhere;
        }
        small {
          display: block;
          color: #94a3b8;
          margin: 5px 0;
          font-size: 12px;
          overflow-wrap: anywhere;
        }
        input[type=checkbox] {
          accent-color: #ff8730;
          width: 16px;
          height: 16px;
          vertical-align: middle;
          cursor: pointer;
        }
        .anma-entity-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          max-height: 250px;
          overflow-y: auto;
          background: #10141b !important;
          border: 1px solid #ff8730 !important;
          border-radius: 8px;
          margin-top: 4px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 15px rgba(255,135,48,0.25);
          z-index: 50;
        }
        .anma-entity-dropdown::-webkit-scrollbar {
          width: 6px;
        }
        .anma-entity-dropdown::-webkit-scrollbar-track {
          background: #10141a;
        }
        .anma-entity-dropdown::-webkit-scrollbar-thumb {
          background: #2a3446;
          border-radius: 3px;
        }
        .anma-entity-dropdown::-webkit-scrollbar-thumb:hover {
          background: #ff8730;
        }
        .anma-entity-dropdown-empty {
          padding: 12px;
          color: #94a3b8;
          font-size: 12px;
          text-align: center;
        }
        .anma-entity-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 9px 12px;
          cursor: pointer;
          background: #121722;
          color: #ff8730 !important;
          border-bottom: 1px solid #1a2230;
          transition: all 0.12s ease;
        }
        .anma-entity-dropdown-item:last-child {
          border-bottom: none;
        }
        .anma-entity-dropdown-item.selected {
          background: #1a2333;
          border-left: 4px solid #ff8730;
        }
        .anma-entity-dropdown-item:hover,
        .anma-entity-dropdown-item:focus {
          background: #242e40 !important;
          color: #ffa54c !important;
          border-left: 4px solid #ff8730 !important;
          padding-left: 15px;
        }
        .anma-entity-dropdown-item:hover .anma-entity-title b,
        .anma-entity-dropdown-item:hover .anma-entity-id-text,
        .anma-entity-dropdown-item:hover .anma-entity-state-badge {
          color: #ffa54c !important;
          text-shadow: 0 0 8px rgba(255,135,48,0.45);
        }
        .anma-entity-title {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }
        .anma-entity-title b {
          font-size: 13px;
          color: #ff8730;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.12s ease;
        }
        .anma-entity-id-text {
          font-size: 11px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          color: #f1873d;
          opacity: 0.85;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.12s ease;
        }
        .anma-entity-state-badge {
          font-size: 11.5px;
          font-weight: 700;
          color: #34d399;
          background: rgba(52,211,153,0.12);
          padding: 3px 7px;
          border-radius: 5px;
          white-space: nowrap;
          transition: color 0.12s ease;
        }
      `;

      const nav = this._node('label', uk ? 'Секція налаштувань' : 'Settings section', shell);
      nav.className = 'anma-editor-nav';
      this._sectionSelect = this._node('select', '', nav);
      this._sectionSelect.dataset.control = 'section';
      this._sectionSelect.setAttribute('aria-label', uk ? 'Секція налаштувань' : 'Settings section');

      // Sticky global search bar and device selector
      const searchRow = this._node('div', '', shell);
      searchRow.className = 'anma-editor-search-row';

      const searchWrap = this._node('div', '', searchRow);
      searchWrap.style.cssText = 'flex:1 1 200px;min-width:0;';
      const searchLabel = this._node('label', uk ? 'Швидкий пошук сутностей (назва або ID)' : 'Quick search entities (name or ID)', searchWrap);
      searchLabel.style.margin = '0';
      this._search = this._node('input', '', searchLabel);
      this._search.type = 'search';
      this._search.placeholder = uk ? 'Введіть 1-3 літери для підказки...' : 'Type 1-3 letters for suggestions...';
      this._search.oninput = () => this._options();

      const deviceWrap = this._node('div', '', searchRow);
      deviceWrap.style.cssText = 'flex:1 1 160px;min-width:0;';
      const deviceLabel = this._node('label', uk ? 'Пристрій Home Assistant' : 'Home Assistant Device', deviceWrap);
      deviceLabel.style.margin = '0';
      this._device = this._node('select', '', deviceLabel);
      this._node('option', uk ? 'Усі пристрої' : 'All devices', this._device).value = '';
      this._device.onchange = () => this._options();

      const root = this._node('div', '', shell);
      this._general = root;
      this._sectionSelect.onchange = () => {
        this._activeSection = this._sectionSelect.value;
        this._showSection();
      };

      const houseLabel=this._node('label','Назва будинку / System name',root);
      const houseName=this._node('input','',houseLabel);
      houseName.type='text';houseName.value=this._config?.layout?.name||'';
      houseName.onchange=()=>this._emit({...this._config?.layout,name:houseName.value,brandTitle:'ANMA ELECTRIC'});
      const languageLabel = this._node('label', 'Мова картки', root);
      const language = this._node('select', '', languageLabel);
      language.dataset.control = 'language';
      [['auto', 'Автоматично (Home Assistant)'], ['en', 'English'], ['uk', 'Українська']].forEach(([val, name]) => {
        this._node('option', name, language).value = val;
      });
      language.value = this._config?.layout?.language || 'auto';
      language.onchange = () => {
        this._emit({ ...this._config?.layout, language: language.value });
        this._build();
        this._rows();
      };

      const label = this._node('label', 'Імпортувати макет ANMA / Import ANMA layout (.json)', root);
      const input = this._node('input', '', label);
      input.type = 'file';
      input.accept = '.json,application/json';
      this._status = this._node('p', '', root);
      this._status.setAttribute('role', 'status');
      input.onchange = async () => {
        try {
          const file = input.files[0];
          if (!file) return;
          if (file.size > 2000000) throw new Error('Maximum file size: 2 MB');
          if (!window.AnmaDashboard) throw new Error('Download the updated ANMA card bundle from Dashboard first.');
          this._emit(window.AnmaDashboard.validate(JSON.parse(await file.text())));
          this._build();
          this._rows();
          this._status.textContent = this._t('Макет імпортовано. Оберіть сутності та збережіть картку.');
        } catch (error) {
          this._status.textContent = error.message;
        } finally {
          input.value = '';
        }
      };

      this._node('p', 'Сутності читаються з вашого Home Assistant. W/kW/MW та одиниці перераховуються автоматично. Налаштуйте сутності кожного показника нижче.', root);

      const suggest = this._node('button', 'Запропонувати відповідності', root);
      suggest.type = 'button';
      suggest.onclick = () => this._suggest();

      const exportButton = this._node('button', 'Експорт JSON з прив’язками', root);
      exportButton.type = 'button';
      exportButton.onclick = () => {
        const url = URL.createObjectURL(new Blob([JSON.stringify(this._config?.layout, null, 2)], { type: 'application/json' }));
        const a = this._node('a');
        a.href = url;
        a.download = 'anma-dashboard-linked.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this._status.textContent = this._t('Імпортуйте JSON у ANMA та натисніть «Зберегти в акаунт», щоб зберегти прив’язки там.');
      };

      const photoLabel = this._node('label', 'Фото станції (PNG/JPG/WebP, до 10 МБ)', root);
      const photo = this._node('input', '', photoLabel);
      photo.type = 'file';
      photo.accept = 'image/png,image/jpeg,image/webp';
      photo.dataset.control = 'background';
      photo.onchange = async () => {
        const file = photo.files[0], layout = this._config?.layout;
        if (!file) return;
        try {
          const image = await window.AnmaDashboard.prepareBackground(file);
          if (this._config?.layout?.id !== layout?.id) return;
          this._emit({ ...this._config?.layout, background: { image, opacity: this._config?.layout?.background?.opacity ?? 15 } });
        } catch (_) {
          this._status.textContent = this._t('Не вдалося прочитати фото. Оберіть PNG/JPG/WebP до 10 МБ.');
        } finally {
          photo.value = '';
        }
      };

      const opacityLabel = this._node('label', 'Видимість фото', root);
      const opacityValue = this._node('output', '', opacityLabel);
      const opacity = this._node('input', '', opacityLabel);
      opacity.type = 'range';
      opacity.min = '0';
      opacity.max = '100';
      opacity.dataset.control = 'opacity';
      opacity.value = this._config?.layout?.background?.opacity ?? 15;
      opacityValue.textContent = ' ' + opacity.value + '%';
      opacity.oninput = () => {
        opacityValue.textContent = ' ' + opacity.value + '%';
        this._emit({ ...this._config?.layout, background: { ...this._config?.layout?.background, opacity: Number(opacity.value) } });
      };
      this._node('small', '0% — приховано, 100% — непрозоре. Фото входить у JSON макета.', root);

      const clear = this._node('button', 'Прибрати фото', root);
      clear.type = 'button';
      clear.onclick = () => this._emit({ ...this._config?.layout, background: { ...this._config?.layout?.background, image: '' } });

      this._widgetsSection = this._node('div', '', shell);
      this._equipmentSection = this._node('div', '', shell);
      this._fields = this._node('div', '', shell);
      if (this._hass) this._loadRegistry();
    }

    async _loadRegistry() {
      if (!this._hass?.callWS) return;
      try {
        const [devices, entities] = await Promise.all([
          this._hass.callWS({ type: 'config/device_registry/list' }),
          this._hass.callWS({ type: 'config/entity_registry/list' })
        ]);
        this._entities = new Map((entities || []).map(e => [e.entity_id, e.device_id]));
        const selected = this._device?.value;
        if (this._device) {
          this._device.replaceChildren();
          const uk = languageOf(this._config?.layout, this._hass) === 'uk';
          this._node('option', uk ? 'Усі пристрої' : 'All devices', this._device).value = '';
          (devices || []).sort((a, b) => String(a.name_by_user || a.name || a.id).localeCompare(b.name_by_user || b.name || b.id)).forEach(d => {
            this._node('option', d.name_by_user || d.name || d.id, this._device).value = d.id;
          });
          this._device.value = selected || '';
        }
        this._options();
      } catch (_) {
        if (this._status) this._status.textContent = this._t('Перелік пристроїв недоступний. Пошук серед доступних сутностей працює.');
      }
    }

    _emit(layout) {
      // Never let later editor mutations change an already emitted HA config.
      this._config = JSON.parse(JSON.stringify({ ...this._config, type: 'custom:anma-card', layout }));
      this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: JSON.parse(JSON.stringify(this._config)) }, bubbles: true, composed: true }));
    }

    _rows() {
      const layout = this._config?.layout || {};
      const active = new Set(Array.isArray(layout.widgets) ? layout.widgets : []);
      const has = (...names) => names.some(name => active.has(name) || [...active].some(w => w.startsWith(name + '_')));
      const hasMetrics = has('solar','battery','load','grid','generator','ev','metric');
      const fields = FIELDS.filter(([key]) => {
        if (['solar_power','grid_power','load_power','battery_power','inverter_power','battery_soc','battery_voltage','battery_temp','grid_frequency','inverter_mode','battery_status','system_status','system_error'].includes(key)) return has('flow');
        if (['solar_daily_energy','load_daily_energy','grid_daily_import','grid_daily_export'].includes(key)) return has('flow');
        if (key === 'ev_power') return has('ev') || (has('flow') && (layout.devices || []).some(d => d.role === 'ev'));
        if (key === 'generator_power') return has('generator') || (has('flow') && (layout.devices || []).some(d => d.role === 'generator'));
        return false;
      });
      const uk = languageOf(layout, this._hass) === 'uk';

      if (has('flow','battery_stack')) (layout.batteryStack || []).forEach((bat, i) => {
        [['soc', 'заряд', 'soc'], ['voltage', 'напруга', 'voltage'], ['current', 'струм', 'current'], ['temp', 'температура', 'temperature']].forEach(([key, label, kind]) => {
          fields.push(['battery_' + i + '_' + key, (bat.name || this._t('АКБ') + ' ' + (i + 1)) + ' — ' + this._t(label), kind]);
        });
      });

      if (has('flow','chart')) for (const role of ['grid', 'battery']) {
        if (layout.flowMeters?.[role]?.mode === 'split') {
          fields.push([role + '_positive_power', role === 'grid' ? 'Grid · Import / Імпорт' : 'Battery · Discharge / Розряд', 'power']);
          fields.push([role + '_negative_power', role === 'grid' ? 'Grid · Export / Експорт' : 'Battery · Charge / Заряд', 'power']);
        }
      }

      if (has('flow','pv_fields')) (layout.pvFields || []).forEach((pv, i) => {
        ['power', 'voltage', 'current'].forEach(kind => fields.push(['pvfield:' + i + ':' + kind, (pv.name || 'PV') + ' · ' + kind, kind]));
      });

      if (has('chart')) ['solar', 'load', 'grid', 'battery'].forEach(role => {
        const keys = layout.flowMeters?.[role]?.mode === 'split' ? [role + '_positive_power', role + '_negative_power'] : [role + '_power'];
        keys.forEach(key => fields.push(['chart_' + key, (uk ? 'Графік · ' : 'Chart · ') + key, 'power']));
      });

      if (has('weather','solar_forecast')) for (let i = 0; i < 7; i++) {
        fields.push(['forecast_day_' + i, (uk ? 'Прогноз · день ' : 'Forecast · day ') + (i + 1), 'energy']);
      }

      const weatherFields = [
        ['weather_condition', uk ? 'Джерело погоди · weather entity' : 'Weather source · weather entity', 'any'],
        ['sun_entity', uk ? 'Джерело сонця · sun.sun' : 'Sun source · sun.sun', 'any'],
        ['sun_elevation', uk ? 'Висота сонця (°)' : 'Sun elevation (°)', 'text'],
        ['solar_irradiance', uk ? 'Сонячна радіація (W/m²)' : 'Solar irradiance (W/m²)', 'text'],
        ['daylight_hours', uk ? 'Тривалість світлового дня (год)' : 'Daylight duration (h)', 'text'],
        ['rain_probability', uk ? 'Ймовірність опадів (%)' : 'Precipitation probability (%)', 'text'],
        ['rain_rate', uk ? 'Інтенсивність опадів (mm/h)' : 'Precipitation rate (mm/h)', 'text'],
        ['cloud_cover', uk ? 'Хмарність (%)' : 'Cloud cover (%)', 'text']
      ];
      if (has('weather')) weatherFields.forEach(([key, title, kind]) => fields.push([key, title, kind]));

      if (has('weather','solar_forecast')) for (let i = 0; i < 7; i++) {
        for (const [key, kind, ukTitle, enTitle] of [['condition', 'text', 'Погода', 'Conditions'], ['peak', 'power', 'Пікова потужність', 'Peak power'], ['hours', 'text', 'Тривалість сонячного сяйва (год)', 'Sunshine duration (h)']]) {
          fields.push(['forecast_' + key + '_' + i, (uk ? 'День ' : 'Day ') + (i + 1) + ' · ' + (uk ? ukTitle : enTitle), kind]);
        }
      }

      const gallery = (layout.elements || []).flatMap(e => [e, ...(e.children || [])]);
      if (gallery.length) gallery.forEach(e => fields.push(['element:' + e.id, e.title || e.type, 'any']));

      const micro = (layout.devices || []).find(d => d.category === 'microinverters');
      if (has('microinverter')) (micro?.mpptChannels || []).forEach((ch, i) => {
        fields.push(['mppt_' + i, 'Micro MPPT ' + (i + 1) + ' · W', 'power', i]);
        for (const [key, kind] of [['voltage', 'voltage'], ['current', 'current'], ['status', 'text']]) {
          fields.push(['mppt_' + i + '_' + key, 'Micro MPPT ' + (i + 1) + ' · ' + key, kind]);
        }
      });

      // Compact Metrics Card fields (Solar, Battery, Load, Grid, EV, Generator, Custom metrics)
      const metricWidgets = (layout.widgets || []).filter(w => {
        const bRole = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
        return ['solar', 'battery', 'load', 'grid', 'generator', 'ev', 'metric'].includes(bRole);
      });
      const metricRoleNames = {
        solar: uk ? 'Сонячні панелі' : 'Solar Panels',
        battery: uk ? 'Акумулятор' : 'Battery',
        load: uk ? 'Споживання' : 'Consumption',
        grid: uk ? 'Мережа' : 'Grid',
        ev: uk ? 'EV-зарядка' : 'EV Charger',
        generator: uk ? 'Генератор' : 'Generator',
        metric: uk ? 'Показник' : 'Metric'
      };
      metricWidgets.forEach(w => {
        const bRole = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
        const cfg = layout.widgetConfigs?.[w] || {};
        const subCount = Number(cfg.subFields) || (Array.isArray(cfg.items) ? cfg.items.length : 4);
        const m = typeof w === 'string' ? w.match(/_(\d+)$/) : null;
        const baseTitle = cfg.title || (m ? `${metricRoleNames[bRole] || bRole} #${m[1]}` : (metricRoleNames[bRole] || bRole));
        const defaultItems = getDefaultMetricItems(bRole, uk);
        const items = (Array.isArray(cfg.items) && cfg.items.length)
          ? cfg.items.slice(0, subCount)
          : defaultItems.slice(0, subCount);

        items.forEach((it, idx) => {
          const rowKey = `metric_item:${w}:${idx}`;
          const rowTitle = `${baseTitle} · ${it.label || (uk ? 'Показник ' + (idx + 1) : 'Field ' + (idx + 1))}${it.unit ? ' (' + it.unit + ')' : ''}`;
          let kind = 'any';
          const u = (it.unit || '').toLowerCase();
          if (u === '%') kind = 'soc';
          else if (['v', 'mv', 'в', 'мв'].includes(u)) kind = 'voltage';
          else if (['a', 'ma', 'а', 'ма'].includes(u)) kind = 'current';
          else if (['°c', '°f', 'k', 'c'].includes(u)) kind = 'temperature';
          else if (['w', 'kw', 'mw', 'вт', 'квт'].includes(u)) kind = 'power';
          else if (['wh', 'kwh', 'mwh'].includes(u)) kind = 'energy';
          else if (['hz', 'гц'].includes(u)) kind = 'frequency';

          fields.push([rowKey, rowTitle, kind]);
        });
      });

      // Rebuild only when the field schema changes, preserving focused controls on HA updates.
      const schema = languageOf(layout, this._hass) + JSON.stringify(fields);
      if (schema !== this._schema) {
        this._schema = schema;
        this._fields.replaceChildren();
        this._controls = [];
        const sections = new Map();

        fields.forEach(([key, title, kind, channel]) => {
          const category = key.startsWith('metric_item:')
            ? ['Компактні показники · сенсори карток', 'Compact metrics · card sensors']
            : weatherFields.some(f => f[0] === key)
            ? ['Погода та сонце · джерела й локація', 'Weather and sun · sources and location']
            : key.startsWith('chart_')
            ? ['Графік (порожньо — датчики потоків)', 'Chart (empty uses flow sensors)']
            : key.startsWith('forecast_')
            ? ['Прогноз генерації', 'Generation forecast']
            : key.startsWith('element:')
            ? ['Елементи галереї', 'Gallery elements']
            : key.startsWith('mppt_') || key.startsWith('pvfield:')
            ? ['PV та MPPT', 'PV and MPPT']
            : /^battery_\d/.test(key)
            ? ['Окремі батареї', 'Individual batteries']
            : key.includes('daily')
            ? ['Енергія за сьогодні', 'Today’s energy']
            : ['Потоки, акумулятор і стан системи', 'Flows, battery and system status'];

          const name = category[uk ? 0 : 1];
          let section = sections.get(name);
          if (!section) {
            section = this._node('details', '', this._fields);
            section.open = true;
            this._node('summary', name, section);
            sections.set(name, section);
            if (weatherFields.some(f => f[0] === key)) {
              this._node('p', uk
                ? 'Оберіть weather-сутність потрібної локації. Локація погоди налаштовується в її інтеграції; sun.sun використовує домашні координати Home Assistant. Нижче можна перевизначити кожен показник окремим датчиком.'
                : 'Choose the weather entity for your location. Set its location in the weather integration; sun.sun uses the Home Assistant home coordinates. Override individual readings below.', section);
            }
            if (key.startsWith('forecast_')) {
              this._node('p', uk
                ? 'Рекомендоване джерело генерації — Solcast. Оберіть прогноз сьогодні: інші дні цієї ж установки підтягуються автоматично.'
                : 'Recommended generation source: Solcast. Select today’s forecast to discover the other days for the same site.', section);
            }
          }

          const group = this._node('fieldset', '', section);
          this._node('legend', title, group);

          const searchContainer = this._node('div', '', group);
          searchContainer.style.cssText = 'position:relative;margin-top:4px;';

          const inputRow = this._node('div', '', searchContainer);
          inputRow.style.cssText = 'display:flex;gap:6px;align-items:center;';

          const dlId = 'dl_' + key.replace(/[^a-zA-Z0-9_-]/g, '_') + '_' + Math.random().toString(36).slice(2, 6);
          const input = this._node('input', '', inputRow);
          input.type = 'search';
          input.placeholder = this._t('Введіть 1-3 літери для підказки або sensor.entity_id');
          input.dataset.entity = key;
          input.setAttribute('aria-label', this._t(title) + ' · entity_id');
          input.setAttribute('list', dlId);
          input.style.flex = '1';

          const toggleBtn = this._node('button', '▼', inputRow);
          toggleBtn.type = 'button';
          toggleBtn.title = uk ? 'Показати список сутностей' : 'Show entity suggestions';
          toggleBtn.style.cssText = 'margin:5px 0 0;padding:9px 12px;flex-shrink:0;';

          const menu = this._node('div', '', searchContainer);
          menu.className = 'anma-entity-dropdown';
          menu.hidden = true;

          const datalist = this._node('datalist', '', group);
          datalist.id = dlId;

          const select = this._node('select', '', group);
          select.setAttribute('aria-label', this._t(title));
          select.dataset.binding = key;

          const value = this._node('small', '', group);
          const row = { key, kind, channel, select, value, input, datalist, menu, toggleBtn };
          this._controls.push(row);

          const commit = id => {
            id = (id || '').trim();
            if (id && !/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(id)) {
              value.textContent = this._t('Некоректний entity_id');
              return;
            }
            const next = JSON.parse(JSON.stringify(this._config?.layout || {}));
            if (key.startsWith('metric_item:')) {
              const [, wKey, idxStr] = key.split(':');
              const idx = Number(idxStr);
              if (!next.widgetConfigs) next.widgetConfigs = {};
              if (!next.widgetConfigs[wKey]) next.widgetConfigs[wKey] = {};
              if (!Array.isArray(next.widgetConfigs[wKey].items)) {
                const bR = wKey.replace(/_\d+$/, '');
                next.widgetConfigs[wKey].items = JSON.parse(JSON.stringify(getDefaultMetricItems(bR, uk)));
              }
              while (next.widgetConfigs[wKey].items.length <= idx) {
                next.widgetConfigs[wKey].items.push({ label: `Field ${idx + 1}`, val: '—', unit: '', sensor: '' });
              }
              next.widgetConfigs[wKey].items[idx].sensor = id;
              const bR = wKey.replace(/_\d+$/, '');
              const fallbacks = {
                solar: ['solar_power', 'solar_daily_energy', 'pv1_voltage', 'pv1_current'],
                battery: ['battery_soc', 'battery_power', 'battery_voltage', 'battery_temp'],
                load: ['load_power', 'load_daily_energy', 'grid_frequency', 'grid_voltage'],
                grid: ['grid_power', 'grid_daily_import', 'grid_daily_export', 'grid_voltage'],
                ev: ['ev_power'],
                generator: ['generator_power']
              };
              const bKey = fallbacks[bR]?.[idx];
              if (bKey && !wKey.includes('_')) {
                next.bindings = { ...next.bindings, [bKey]: id };
              }
            } else if (key.startsWith('pvfield:')) {
              const [, i, k] = key.split(':');
              next.pvFields[i].sensors ||= {};
              next.pvFields[i].sensors[k] = id;
            } else if (key.startsWith('element:')) {
              const item = (next.elements || []).flatMap(e => [e, ...(e.children || [])]).find(e => e.id === key.slice(8));
              if (item) item.entity = id;
            } else if (channel === undefined) {
              next.bindings = { ...next.bindings, [key]: id };
            } else {
              next.devices.find(d => d.category === 'microinverters').mpptChannels[channel].sensor = id;
            }

            input.value = id;
            row.query = '';
            this._emit(next);
            this._options();
            this._values();
          };

          row.commit = commit;

          toggleBtn.onclick = (e) => {
            e.preventDefault();
            menu.hidden = !menu.hidden;
            if (!menu.hidden) {
              this._options(row);
              input.focus();
            }
          };

          input.onfocus = () => {
            menu.hidden = false;
            this._options(row);
          };

          input.onblur = () => {
            setTimeout(() => { menu.hidden = true; }, 200);
          };

          select.onchange = () => commit(select.value);

          input.oninput = () => {
            const val = input.value.trim();
            row.query = val;
            menu.hidden = false;
            if (this._hass?.states?.[val]) {
              commit(val);
            } else {
              this._options(row);
            }
          };

          input.onchange = () => {
            const val = input.value.trim();
            if (val && this._hass?.states?.[val]) {
              commit(val);
            }
          };

          input.onkeydown = e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit(input.value);
              menu.hidden = true;
            }
          };

          const apply = this._node('button', 'Застосувати ID', group);
          apply.type = 'button';
          apply.onclick = () => {
            commit(input.value);
            menu.hidden = true;
          };

          this._node('small', uk ? 'Введіть назву, entity_id або оберіть зі списку підказок.' : 'Type name, entity_id or choose from suggested list.', group);

          const flow = key.replace('_power', '');
          if (['grid', 'battery', 'solar', 'load'].includes(flow)) {
            if (['grid', 'battery'].includes(flow)) {
              const modeLabel = this._node('label', uk ? 'Режим потужності' : 'Power mode', group);
              const mode = this._node('select', '', modeLabel);
              mode.dataset.flowMeter = flow;
              this._node('option', uk ? 'Один датчик зі знаком ±' : 'One signed sensor ±', mode).value = 'single';
              this._node('option', uk ? 'Два датчики: позитивний / негативний' : 'Two sensors: positive / negative', mode).value = 'split';
              mode.value = layout.flowMeters?.[flow]?.mode || 'single';
              mode.onchange = () => {
                const next = JSON.parse(JSON.stringify(this._config.layout));
                next.flowMeters ||= {};
                next.flowMeters[flow] = { ...next.flowMeters[flow], mode: mode.value };
                this._emit(next);
                this._rows();
              };
              this._node('small', uk ? 'Мережа: плюс — імпорт, мінус — експорт. Напрямок змінюється автоматично. Для протилежної конвенції увімкніть інверсію нижче.' : 'Grid: positive imports, negative exports. Direction changes automatically. Reverse the sign below if your sensor uses the opposite convention.', group);
            }
            const fLabel = this._node('label', '', group);
            const check = this._node('input', '', fLabel);
            check.type = 'checkbox';
            fLabel.append(document.createTextNode(' ' + this._t('Інвертувати знак потужності')));
            row.check = check;
            row.flow = flow;
            check.onchange = () => this._emit({ ...this._config?.layout, flowInverted: { ...this._config?.layout?.flowInverted, [flow]: check.checked } });
          }
        });
      }

      this._renderWidgetsSection();
      this._renderEquipmentSection();
      // Reuse the live entity pickers beside each PV, rather than hiding them in another section.
      for (const row of this._controls) {
        if (!row.key.startsWith('pvfield:')) continue;
        const index = row.key.split(':')[1];
        const target = this._equipmentSection.querySelector('[data-pv-entities="' + index + '"]');
        if (target) target.append(row.input.closest('fieldset'));
      }
      for (const section of [...this._fields.children]) {
        if (!section.querySelector('fieldset')) section.remove();
      }

      const nav = this._sectionSelect, previous = this._activeSection || ((layout.widgets||[]).includes('power_flow')?'equipment':'general');
      nav.replaceChildren();
      this._node('option', uk ? 'Загальні · мова, імпорт, фото' : 'General · language, import, photo', nav).value = 'general';
      this._node('option', uk ? '🧱 Віджети та розмітка' : '🧱 Widgets & Layout', nav).value = 'widgets';
      this._node('option', layout.template==='energy_station'?'⚡ Energy Station · Connections':(uk ? '⚡ Обладнання · інвертори, АКБ, PV' : '⚡ Equipment · inverters, batteries, PV'), nav).value = 'equipment';
      [...this._fields.children].forEach((section, i) => {
        section.dataset.section = String(i);
        this._node('option', section.querySelector('summary').textContent, nav).value = String(i);
      });
      nav.value = [...nav.options].some(o => o.value === previous) ? previous : 'general';
      this._activeSection = nav.value;
      this._showSection();
      this._options();
      this._values();
      this._controls.forEach(r => {
        if (r.check) r.check.checked = !!layout.flowInverted?.[r.flow];
      });
    }

    _renderWidgetsSection() {
      if (!this._widgetsSection) return;
      const parent = this._widgetsSection;
      parent.replaceChildren();
      const layout = this._config?.layout || {};
      const uk = languageOf(layout, this._hass) === 'uk';

      if ((layout.widgets || []).includes('power_flow')) {
        const openEquipment=this._node('button',layout.template==='energy_station'?'Energy Station · Connections':(uk?'Налаштувати Power Flow: сутності, потужність і рамки':'Configure Power Flow: entities, power and borders'),parent);
        openEquipment.type='button';openEquipment.onclick=()=>{this._activeSection='equipment';this._rows();};
      }
      // 1. Dashboard Layout Settings (Grid Columns & Metrics Grouping)
      const layoutGroup = this._node('fieldset', '', parent);
      this._node('legend', uk ? '📐 Загальна сітка дашборду' : '📐 Dashboard Grid Settings', layoutGroup);

      const colsLabel = this._node('label', uk ? 'Кількість колонок дашборду' : 'Dashboard Columns', layoutGroup);
      const colsSelect = this._node('select', '', colsLabel);
      [1, 2, 3, 4, 5, 6].forEach(c => {
        const opt = this._node('option', c + (uk ? ' кол.' : ' cols'), colsSelect);
        opt.value = String(c);
      });
      colsSelect.value = String(layout.gridColumns || 2);
      colsSelect.onchange = () => {
        this._emit({ ...layout, gridColumns: Number(colsSelect.value) || 2 });
      };

      const groupLabel = this._node('label', '', layoutGroup);
      const groupCheck = this._node('input', '', groupLabel);
      groupCheck.type = 'checkbox';
      groupCheck.checked = layout.groupMetrics !== false;
      groupLabel.append(document.createTextNode(' ' + (uk ? 'Об’єднувати компактні показники в спільний блок' : 'Group compact metrics into unified block')));
      groupCheck.onchange = () => {
        this._emit({ ...layout, groupMetrics: groupCheck.checked });
      };

      // 2. Palette: Add new widget
      const paletteGroup = this._node('fieldset', '', parent);
      this._node('legend', uk ? '➕ Додати новий віджет' : '➕ Add Widget', paletteGroup);

      const addRow = this._node('div', '', paletteGroup);
      addRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;';

      const typeSelect = this._node('select', '', addRow);
      typeSelect.style.cssText = 'flex:1 1 200px;min-width:0;';
      const availableTypes = [
        ['power_flow', 'ANMA Power Flow'],
        ['flow', uk ? '⚡ Потоки енергії (Flow)' : '⚡ Energy Flow'],
        ['weather', uk ? '🌤 Погода та сонце (Weather)' : '🌤 Weather & Sun'],
        ['chart', uk ? '📊 Графік потужності (Chart)' : '📊 Power Chart'],
        ['compact_group', uk ? '📋 Компактні показники (Group)' : '📋 Compact Metrics Block'],
        ['solar', uk ? '☀️ Сонячні панелі (Solar)' : '☀️ Solar Panels'],
        ['battery', uk ? '🔋 Акумулятор (Battery)' : '🔋 Battery'],
        ['grid', uk ? '🏢 Мережа (Grid)' : '🏢 Grid'],
        ['load', uk ? '🏠 Споживання (Load)' : '🏠 Home Load'],
        ['battery_stack', uk ? '🔋 Стек акумуляторів (Stack)' : '🔋 Battery Stack'],
        ['pv_fields', uk ? '☀️ Поля сонячних панелей (PV)' : '☀️ PV Arrays'],
        ['microinverter', uk ? '🔌 Мікроінвертори / MPPT' : '🔌 Microinverters / MPPT'],
        ['inverter_health', uk ? '🩺 Стан інвертора' : '🩺 Inverter Health'],
        ['equipment_status', uk ? '⚙️ Статус обладнання' : '⚙️ Equipment Status']
      ];
      availableTypes.forEach(([val, name]) => {
        const opt = this._node('option', name, typeSelect);
        opt.value = val;
      });

      const addBtn = this._node('button', uk ? '+ Додати віджет' : '+ Add Widget', addRow);
      addBtn.type = 'button';
      addBtn.style.cssText = 'background:var(--accent,#f1873d);color:#fff;border:none;padding:8px 16px;border-radius:6px;font-weight:600;';
      addBtn.onclick = () => {
        const chosen = typeSelect.value;
        const currentWidgets = [...(layout.widgets || [])];
        let newKey = chosen;
        if (chosen === 'compact_group') {
          ['solar', 'battery', 'load', 'grid'].forEach(m => {
            if (!currentWidgets.includes(m)) currentWidgets.push(m);
          });
        } else if (currentWidgets.includes(chosen)) {
          let count = 2;
          while (currentWidgets.includes(chosen + '_' + count)) count++;
          newKey = chosen + '_' + count;
          currentWidgets.push(newKey);
        } else {
          currentWidgets.push(chosen);
        }
        const next = JSON.parse(JSON.stringify(layout));
        next.widgets = currentWidgets;
        next.widgetConfigs ||= {};
        next.widgetConfigs[newKey] ||= {
          size: ['flow', 'compact_group', 'battery_stack'].includes(chosen) ? 'full' : '1x1',
          shape: layout.theme?.shape || 'rounded',
          title: ''
        };
        this._emit(next);
        this._build();
        this._rows();
      };

      // 3. Active Widgets Manager
      const listGroup = this._node('fieldset', '', parent);
      this._node('legend', uk ? '🧱 Активні віджети дашборду' : '🧱 Active Dashboard Widgets', listGroup);

      const widgets = layout.widgets || [];
      if (!widgets.length) {
        this._node('p', uk ? 'На дашборді немає активних віджетів. Додайте віджет з палітри вище.' : 'No active widgets on dashboard. Add a widget from the palette above.', listGroup);
        return;
      }

      widgets.forEach((w, idx) => {
        const wCard = this._node('div', '', listGroup);
        wCard.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid #5554;border-radius:8px;padding:10px;margin:8px 0;';

        const headRow = this._node('div', '', wCard);
        headRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;border-bottom:1px solid #4444;padding-bottom:6px;';

        const bRole = typeof w === 'string' ? w.replace(/_\d+$/, '') : '';
        const titleText = layout.widgetConfigs?.[w]?.title || (availableTypes.find(t => t[0] === bRole)?.[1] || w);
        const titleBadge = this._node('b', `#${idx + 1} · ${titleText}`, headRow);
        titleBadge.style.cssText = 'font-size:13px;color:var(--accent,#f1873d);';

        const btnRow = this._node('div', '', headRow);
        btnRow.style.cssText = 'display:flex;gap:4px;';

        const upBtn = this._node('button', '▲', btnRow);
        upBtn.type = 'button';
        upBtn.title = uk ? 'Перемістити вище' : 'Move up';
        upBtn.disabled = idx === 0;
        upBtn.onclick = () => {
          if (idx === 0) return;
          const next = JSON.parse(JSON.stringify(layout));
          const temp = next.widgets[idx - 1];
          next.widgets[idx - 1] = next.widgets[idx];
          next.widgets[idx] = temp;
          this._emit(next);
          this._build();
          this._rows();
        };

        const downBtn = this._node('button', '▼', btnRow);
        downBtn.type = 'button';
        downBtn.title = uk ? 'Перемістити нижче' : 'Move down';
        downBtn.disabled = idx === widgets.length - 1;
        downBtn.onclick = () => {
          if (idx >= widgets.length - 1) return;
          const next = JSON.parse(JSON.stringify(layout));
          const temp = next.widgets[idx + 1];
          next.widgets[idx + 1] = next.widgets[idx];
          next.widgets[idx] = temp;
          this._emit(next);
          this._build();
          this._rows();
        };

        const dupBtn = this._node('button', '📋', btnRow);
        dupBtn.type = 'button';
        dupBtn.title = uk ? 'Дублювати віджет' : 'Duplicate widget';
        dupBtn.onclick = () => {
          const next = JSON.parse(JSON.stringify(layout));
          let count = 2;
          let dupKey = bRole + '_' + count;
          while (next.widgets.includes(dupKey)) { count++; dupKey = bRole + '_' + count; }
          next.widgets.splice(idx + 1, 0, dupKey);
          next.widgetConfigs ||= {};
          next.widgetConfigs[dupKey] = JSON.parse(JSON.stringify(layout.widgetConfigs?.[w] || {}));
          this._emit(next);
          this._build();
          this._rows();
        };

        const delBtn = this._node('button', '🗑', btnRow);
        delBtn.type = 'button';
        delBtn.style.color = '#f87171';
        delBtn.title = uk ? 'Видалити віджет' : 'Delete widget';
        delBtn.onclick = () => {
          const next = JSON.parse(JSON.stringify(layout));
          next.widgets.splice(idx, 1);
          this._emit(next);
          this._build();
          this._rows();
        };

        const cfg = layout.widgetConfigs?.[w] || {};
        const cfgRow = this._node('div', '', wCard);
        cfgRow.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;';

        const titleLbl = this._node('label', uk ? 'Власна назва' : 'Custom title', cfgRow);
        titleLbl.style.margin = '0';
        const titleInp = this._node('input', '', titleLbl);
        titleInp.type = 'text';
        titleInp.value = cfg.title || '';
        titleInp.placeholder = uk ? 'Стандартна назва' : 'Default title';
        titleInp.onchange = () => {
          const next = JSON.parse(JSON.stringify(layout));
          next.widgetConfigs ||= {};
          next.widgetConfigs[w] ||= {};
          next.widgetConfigs[w].title = titleInp.value.trim();
          this._emit(next);
        };

        const sizeLbl = this._node('label', uk ? 'Розмір / Ширина' : 'Size / Width', cfgRow);
        sizeLbl.style.margin = '0';
        const sizeSel = this._node('select', '', sizeLbl);
        [
          ['1x1', uk ? '1 колонка (1x1)' : '1 column (1x1)'],
          ['2x1', uk ? '2 колонки (2x1)' : '2 columns (2x1)'],
          ['2x2', uk ? 'Подвійна (2x2)' : 'Double (2x2)'],
          ['full', uk ? 'На всю ширину (Full)' : 'Full width (Full)']
        ].forEach(([sVal, sName]) => {
          const opt = this._node('option', sName, sizeSel);
          opt.value = sVal;
        });
        sizeSel.value = cfg.size || (['flow', 'compact_group', 'battery_stack'].includes(w) ? 'full' : '1x1');
        sizeSel.onchange = () => {
          const next = JSON.parse(JSON.stringify(layout));
          next.widgetConfigs ||= {};
          next.widgetConfigs[w] ||= {};
          next.widgetConfigs[w].size = sizeSel.value;
          this._emit(next);
        };

        const colsLbl = this._node('label', uk ? 'Внутрішні колонки' : 'Internal Columns', cfgRow);
        colsLbl.style.margin = '0';
        const colsInp = this._node('select', '', colsLbl);
        [1, 2, 3, 4, 5, 6, 7].forEach(c => {
          const opt = this._node('option', c + (uk ? ' кол.' : ' cols'), colsInp);
          opt.value = String(c);
        });
        const curCols = cfg.gridColumns || (w === 'compact_group' ? 5 : (['weather', 'solar_forecast'].includes(w) ? (cfg.forecastDays || 7) : 2));
        colsInp.value = String(curCols);
        colsInp.onchange = () => {
          const next = JSON.parse(JSON.stringify(layout));
          next.widgetConfigs ||= {};
          next.widgetConfigs[w] ||= {};
          next.widgetConfigs[w].gridColumns = Number(colsInp.value) || 2;
          if (['weather', 'solar_forecast'].includes(w)) {
            next.widgetConfigs[w].forecastDays = Number(colsInp.value) || 7;
          }
          this._emit(next);
        };

        const autoLbl = this._node('label', '', wCard);
        autoLbl.style.margin = '6px 0 0';
        const autoCheck = this._node('input', '', autoLbl);
        autoCheck.type = 'checkbox';
        autoCheck.checked = !!cfg.autoFit;
        autoLbl.append(document.createTextNode(' ' + (uk ? 'AUTO: заповнити вільне місце в рядку' : 'AUTO: fill remaining row space')));
        autoCheck.onchange = () => {
          const next = JSON.parse(JSON.stringify(layout));
          next.widgetConfigs ||= {};
          next.widgetConfigs[w] ||= {};
          next.widgetConfigs[w].autoFit = autoCheck.checked;
          this._emit(next);
        };
      });
    }

    _renderEquipmentSection() {
      if (!this._equipmentSection) return;
      const parent = this._equipmentSection;
      parent.replaceChildren();
      const layout = this._config?.layout || {};
      const uk = languageOf(layout, this._hass) === 'uk';

      if(layout.template==='energy_station'){
        const editor=window.AnmaEnergyStation.editor(layout.powerFlow?.station,uk,station=>{
          this._emit({...this._config.layout,powerFlow:{...this._config.layout.powerFlow,station}});
        },{getStates:()=>this._hass?.states||{}});
        editor.open=true;parent.append(editor);return;
      }
      if((layout.widgets||[]).includes('power_flow')){
        const style=this._node('style','',parent);
        style.textContent='.apf-config{position:static;display:block}.apf-settings{display:grid;gap:12px}.apf-settings fieldset{min-width:0;border:1px solid #b8753e;border-radius:10px;padding:12px;display:grid;gap:10px;background:#ffffff05}.apf-settings legend{color:#f1873d}.apf-settings label{display:grid;gap:5px}.apf-settings input,.apf-settings select{box-sizing:border-box;width:100%;min-width:0}.apf-settings input[type=checkbox]{width:auto;justify-self:start}.apf-entity-menu{display:grid;gap:4px;max-height:220px;overflow:auto}.apf-entity-menu[hidden]{display:none}.apf-entity-menu button{text-align:left;overflow-wrap:anywhere;white-space:normal}.apf-capacity{border-left:3px solid #f1873d;padding:8px}.apf-settings small{opacity:.8}';
        const editor=window.AnmaPowerFlow.editor(layout.powerFlow,uk,(powerFlow,redraw=true)=>{
          this._emit({...this._config.layout,powerFlow});
          if(redraw)this._rows();
        },{getStates:()=>this._hass?.states||null,legacyBackground:layout.background,template:layout.template});
        editor.open=true;parent.append(editor);return;
      }

      // 1. Inverters
      const invGroup = this._node('fieldset', '', parent);
      this._node('legend', uk ? '⚡ Паралельні інвертори' : '⚡ Parallel Inverters', invGroup);

      const powerLabel = this._node('label', uk ? 'Номінальна потужність головного інвертора (Вт)' : 'Main Inverter Rated Power (W)', invGroup);
      const powerInput = this._node('input', '', powerLabel);
      powerInput.type = 'number';
      powerInput.value = String(layout.ratedPower || 6000);
      powerInput.onchange = () => {
        const next = JSON.parse(JSON.stringify(this._config.layout));
        next.ratedPower = Number(powerInput.value) || 6000;
        this._emit(next);
      };

      // 2. Battery Stack
      const batGroup = this._node('fieldset', '', parent);
      this._node('legend', uk ? '🔋 Акумуляторний стек' : '🔋 Battery Stack', batGroup);

      const batList = layout.batteryStack || [];
      batList.forEach((bat, i) => {
        const bCard = this._node('div', '', batGroup);
        bCard.style.cssText = 'display:flex;gap:8px;align-items:center;margin:6px 0;';
        const nameInp = this._node('input', '', bCard);
        nameInp.type = 'text';
        nameInp.value = bat.name || `АКБ #${i + 1}`;
        nameInp.style.flex = '2';
        nameInp.onchange = () => {
          const next = JSON.parse(JSON.stringify(this._config.layout));
          next.batteryStack[i].name = nameInp.value.trim();
          this._emit(next);
          this._rows();
        };
        const kwhInp = this._node('input', '', bCard);
        kwhInp.type = 'number';
        kwhInp.value = String(bat.capacityKwh || 5.12);
        kwhInp.placeholder = 'kWh';
        kwhInp.style.flex = '1';
        kwhInp.onchange = () => {
          const next = JSON.parse(JSON.stringify(this._config.layout));
          next.batteryStack[i].capacityKwh = Number(kwhInp.value) || 5.12;
          this._emit(next);
        };
        const delBtn = this._node('button', '🗑', bCard);
        delBtn.type = 'button';
        delBtn.style.color = '#f87171';
        delBtn.onclick = () => {
          const next = JSON.parse(JSON.stringify(this._config.layout));
          next.batteryStack.splice(i, 1);
          this._emit(next);
          this._build();
          this._rows();
        };
      });

      const addBatBtn = this._node('button', uk ? '+ Додати АКБ у стек' : '+ Add Battery to Stack', batGroup);
      addBatBtn.type = 'button';
      addBatBtn.onclick = () => {
        const next = JSON.parse(JSON.stringify(this._config.layout));
        next.batteryStack ||= [];
        next.batteryStack.push({ name: `АКБ #${next.batteryStack.length + 1}`, capacityKwh: 5.12, nominalVoltage: 51.2 });
        this._emit(next);
        this._build();
        this._rows();
      };

      // 3. PV Fields
      const pvGroup = this._node('fieldset', '', parent);
      this._node('legend', uk ? '☀️ Поля сонячних панелей (PV Strings)' : '☀️ PV Arrays / Strings', pvGroup);

      const pvList = layout.pvFields || [];
      pvList.forEach((pv, i) => {
        const pvBox = this._node('fieldset', '', pvGroup);
        this._node('legend', pv.name || `PV #${i + 1}`, pvBox);
        const pCard = this._node('div', '', pvBox);
        const entities = this._node('div', '', pvBox);
        entities.dataset.pvEntities = String(i);
        pCard.style.cssText = 'display:flex;gap:8px;align-items:center;margin:6px 0;';
        const nameInp = this._node('input', '', pCard);
        nameInp.type = 'text';
        nameInp.value = pv.name || `PV #${i + 1}`;
        nameInp.style.flex = '2';
        nameInp.onchange = () => {
          const next = JSON.parse(JSON.stringify(this._config.layout));
          next.pvFields[i].name = nameInp.value.trim();
          this._emit(next);
          this._rows();
        };
        const kwpInp = this._node('input', '', pCard);
        kwpInp.type = 'number';
        kwpInp.value = String(pv.kWp || 3.2);
        kwpInp.placeholder = 'kWp';
        kwpInp.style.flex = '1';
        kwpInp.onchange = () => {
          const next = JSON.parse(JSON.stringify(this._config.layout));
          next.pvFields[i].kWp = Number(kwpInp.value) || 3.2;
          this._emit(next);
        };
        const delBtn = this._node('button', '🗑', pCard);
        delBtn.type = 'button';
        delBtn.style.color = '#f87171';
        delBtn.onclick = () => {
          const next = JSON.parse(JSON.stringify(this._config.layout));
          next.pvFields.splice(i, 1);
          this._emit(next);
          this._build();
          this._rows();
        };
      });

      const addPvBtn = this._node('button', uk ? '+ Додати PV поле / стринг' : '+ Add PV Array', pvGroup);
      addPvBtn.type = 'button';
      addPvBtn.onclick = () => {
        const next = JSON.parse(JSON.stringify(this._config.layout));
        next.pvFields ||= [];
        next.pvFields.push({ name: `PV Стринг #${next.pvFields.length + 1}`, kWp: 3.2, azimuth: 180, tilt: 35, sensors: {} });
        this._emit(next);
        this._build();
        this._rows();
      };
    }

    _showSection() {
      this._general.hidden = this._activeSection !== 'general';
      if (this._widgetsSection) this._widgetsSection.hidden = this._activeSection !== 'widgets';
      if (this._equipmentSection) this._equipmentSection.hidden = this._activeSection !== 'equipment';
      [...this._fields.children].forEach(section => {
        section.hidden = section.dataset.section !== this._activeSection;
        section.open = true;
      });
    }

    _selected(row) {
      if (row.key.startsWith('metric_item:')) {
        const [, wKey, idxStr] = row.key.split(':');
        const idx = Number(idxStr);
        const item = this._config?.layout?.widgetConfigs?.[wKey]?.items?.[idx];
        if (item && item.sensor) return item.sensor;
        const bR = wKey.replace(/_\d+$/, '');
        const fallbacks = {
          solar: ['solar_power', 'solar_daily_energy', 'pv1_voltage', 'pv1_current'],
          battery: ['battery_soc', 'battery_power', 'battery_voltage', 'battery_temp'],
          load: ['load_power', 'load_daily_energy', 'grid_frequency', 'grid_voltage'],
          grid: ['grid_power', 'grid_daily_import', 'grid_daily_export', 'grid_voltage'],
          ev: ['ev_power'],
          generator: ['generator_power']
        };
        const bKey = fallbacks[bR]?.[idx];
        return bKey ? (this._config?.layout?.bindings?.[bKey] || '') : '';
      }
      if (row.key.startsWith('pvfield:')) {
        const [, i, kind] = row.key.split(':');
        return this._config?.layout?.pvFields?.[i]?.sensors?.[kind] || '';
      }
      if (row.key.startsWith('element:')) {
        return (this._config?.layout?.elements || []).flatMap(e => [e, ...(e.children || [])]).find(e => e.id === row.key.slice(8))?.entity || '';
      }
      if (row.channel !== undefined) {
        return (this._config?.layout?.devices || []).find(d => d.category === 'microinverters')?.mpptChannels?.[row.channel]?.sensor || '';
      }
      return this._config?.layout?.bindings?.[row.key] || '';
    }

    _candidates(kind, query = '') {
      const term = (query || this._search?.value || '').trim().toLowerCase();
      const device = this._device?.value;
      const states = Object.entries(this._hass?.states || {});

      return states.filter(([id, state]) => {
        if (device && this._entities?.get(id) !== device) return false;

        const fn = (state.attributes?.friendly_name || '').toLowerCase();
        const idLower = id.toLowerCase();

        // If the user typed letters (even 1, 2, 3), match ANY entity containing the substring!
        if (term) {
          return idLower.includes(term) || fn.includes(term);
        }

        // Without query: propose entities compatible with this field
        if (kind === 'any' || kind === 'text') return true;
        return (id.startsWith('sensor.') || id.startsWith('binary_sensor.') || id.startsWith('switch.') || id.startsWith('number.')) && compatible(state, kind);
      }).sort((a, b) => {
        const idA = a[0], stateA = a[1];
        const idB = b[0], stateB = b[1];

        // 1. Compatible units come first
        if (kind !== 'any' && kind !== 'text') {
          const compA = compatible(stateA, kind) ? 0 : 1;
          const compB = compatible(stateB, kind) ? 0 : 1;
          if (compA !== compB) return compA - compB;
        }

        // 2. Exact prefix matches rank higher
        if (term) {
          const fnA = (stateA.attributes?.friendly_name || '').toLowerCase();
          const fnB = (stateB.attributes?.friendly_name || '').toLowerCase();
          const startsA = (idA.toLowerCase().startsWith(term) || fnA.startsWith(term)) ? 0 : 1;
          const startsB = (idB.toLowerCase().startsWith(term) || fnB.startsWith(term)) ? 0 : 1;
          if (startsA !== startsB) return startsA - startsB;
        }

        const nameA = stateA.attributes?.friendly_name || idA;
        const nameB = stateB.attributes?.friendly_name || idB;
        return String(nameA).localeCompare(String(nameB));
      });
    }

    _options(onlyRow) {
      const controls = onlyRow ? [onlyRow] : (this._controls || []);
      controls.forEach(row => {
        const selected = this._selected(row);
        const query = (row.query || '').toLowerCase();
        const candidates = this._candidates(row.kind, query);

        if (!row.query && this.shadowRoot && this.shadowRoot.activeElement !== row.input) {
          row.input.value = selected || '';
        }

        if (row.datalist) {
          row.datalist.replaceChildren();
          candidates.slice(0, 60).forEach(([id, state]) => {
            const opt = document.createElement('option');
            opt.value = id;
            const fn = state.attributes?.friendly_name || id;
            const u = state.attributes?.unit_of_measurement ? ` ${state.attributes.unit_of_measurement}` : '';
            opt.label = `${fn} (${id}) · ${state.state}${u}`;
            row.datalist.append(opt);
          });
        }

        if (row.menu) {
          row.menu.replaceChildren();
          if (candidates.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'anma-entity-dropdown-empty';
            emptyEl.textContent = this._t('Сутностей не знайдено');
            row.menu.append(emptyEl);
          } else {
            const unbindEl = document.createElement('div');
            unbindEl.className = 'anma-entity-dropdown-item' + (!selected ? ' selected' : '');
            unbindEl.innerHTML = `<div class="anma-entity-title"><b>${this._t('Не підключено')}</b></div>`;
            unbindEl.onmousedown = (e) => {
              e.preventDefault();
              if (row.commit) row.commit('');
              row.menu.hidden = true;
            };
            row.menu.append(unbindEl);

            candidates.slice(0, 80).forEach(([id, state]) => {
              const item = document.createElement('div');
              item.className = 'anma-entity-dropdown-item' + (id === selected ? ' selected' : '');
              const fn = state.attributes?.friendly_name || id;
              const u = state.attributes?.unit_of_measurement ? ` ${state.attributes.unit_of_measurement}` : '';
              item.innerHTML = `
                <div class="anma-entity-title">
                  <b>${escapeHtml(fn)}</b>
                  <span class="anma-entity-id-text">${escapeHtml(id)}</span>
                </div>
                <div class="anma-entity-state-badge">${escapeHtml(state.state + u)}</div>
              `;
              item.onmousedown = (e) => {
                e.preventDefault();
                if (row.commit) row.commit(id);
                row.menu.hidden = true;
              };
              row.menu.append(item);
            });
          }
        }

        row.select.replaceChildren();
        this._node('option', this._t('Не підключено'), row.select).value = '';
        if (selected && !candidates.some(([id]) => id === selected)) {
          this._node('option', selected + ' (' + this._t('поточна прив’язка') + ')', row.select).value = selected;
        }
        candidates.slice(0, 100).forEach(([id, state]) => {
          const fn = state.attributes?.friendly_name || id;
          const u = state.attributes?.unit_of_measurement ? ` ${state.attributes.unit_of_measurement}` : '';
          this._node('option', fn + ' · ' + id + ' · ' + state.state + u, row.select).value = id;
        });
        row.select.value = selected || '';
      });
    }

    _values() {
      (this._controls || []).forEach(row => {
        const id = this._selected(row);
        const state = this._hass?.states?.[id];
        const val = reading(this._hass, id, row.kind);
        if (!id) {
          row.value.textContent = this._t('Оберіть сутність або введіть ID');
          row.value.style.color = '#888';
        } else if (!state) {
          row.value.textContent = `⚠️ ${id} — ${this._t('сутність не знайдено в Home Assistant')}`;
          row.value.style.color = '#f87171';
        } else if (!compatible(state, row.kind)) {
          row.value.textContent = `⚠️ ${state.attributes?.friendly_name || id} · ${state.state} ${state.attributes?.unit_of_measurement || ''} (${this._t('несумісні одиниці')})`;
          row.value.style.color = '#fbbf24';
        } else {
          const fn = state.attributes?.friendly_name || id;
          const u = state.attributes?.unit_of_measurement || '';
          row.value.textContent = `✓ ${fn} (${id}) · ${state.state} ${u}`;
          row.value.style.color = '#34d399';
        }
      });
    }

    _suggest() {
      const next = JSON.parse(JSON.stringify(this._config?.layout || {}));
      next.bindings = { ...next.bindings };
      let count = 0;
      if (window.AnmaDashboard?.solcastBindings) {
        const solcast = window.AnmaDashboard.solcastBindings(this._hass?.states, next.bindings);
        for (const [key, id] of Object.entries(solcast)) {
          if (id && !next.bindings[key]) {
            next.bindings[key] = id;
            count++;
          }
        }
      }
      FIELDS.forEach(([key, , kind]) => {
        if (this._hass?.states?.[next.bindings[key]]) return;
        const candidates = this._candidates(kind).filter(([id]) => id === 'sensor.' + key || id.endsWith('_' + key));
        if (candidates.length === 1) {
          next.bindings[key] = candidates[0][0];
          count++;
        }
      });
      this._emit(next);
      this._options();
      this._values();
      this._status.textContent = count + ' · ' + this._t('Перевірте запропоновані відповідності та збережіть картку.');
    }
  }
  const editorTag='anma-card-editor-'+CARD_VERSION.replaceAll('.','-');
  if (!customElements.get(editorTag)) customElements.define(editorTag, AnmaCardEditor);
  if (!customElements.get('anma-card-editor')) customElements.define('anma-card-editor', class extends AnmaCardEditor {});
  // HA may retain an older registered card constructor until a full reload.
  customElements.get('anma-card').getConfigElement=()=>document.createElement(editorTag);

  window.customCards = window.customCards || [];
  if (!window.customCards.some(c => c.type === 'anma-card')) {
    window.customCards.push({
      type: 'anma-card',
      name: 'ANMA Energy Card',
      description: 'ANMA Energy dashboard — JSON layout import; chart and forecast previews use demo data',
      preview: true,
      documentationURL: 'https://github.com/bobantonbob/anma-energy-platform'
    });
  }

  console.info(`%c ANMA-CARD %c v${CARD_VERSION} FULL DASHBOARD LOADED `, 'background:#f1873d;color:#fff;font-weight:700;border-radius:3px 0 0 3px;', 'background:#1e293b;color:#38bdf8;font-weight:700;border-radius:0 3px 3px 0;');
})();
