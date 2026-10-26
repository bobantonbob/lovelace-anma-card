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
      pvTotal:str(raw.pvTotal),solarToday:str(raw.solarToday),solarForecast:str(raw.solarForecast),backupPower:str(raw.backupPower),nonBackupPower:str(raw.nonBackupPower),
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
    return {availableEnergy,loadRuntime,phaseReadings,master,telemetry,runtime,inverterState,pv,solar,today:read(c.solarToday,48.6,'energy'),forecast:read(c.solarForecast,55,'energy'),batteries,batteryTotal,grid,gridState,aux,loads,backup,nonBackup,inverter:read(c.inverterPower,night?3000:8000)};
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
    .energy-station[data-phone=false] h2{font-size:22px}.energy-station[data-phone=false] .es-foot{font-size:13px}
    .energy-station[data-phone=false] .es-svg .es-name{font-size:15px}.energy-station[data-phone=false] .es-svg .es-value{font-size:22px}.energy-station[data-phone=false] .es-svg .es-detail{font-size:13px}
    .energy-station[data-phone=false] .es-svg .es-reading,.energy-station[data-phone=false] .es-svg .es-reading-value{font-size:22px}
    .es-svg .es-frequency{font-size:13px;text-anchor:end;fill:var(--node-color);font-weight:600}
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
      card.dataset.fit=String(cfg.fit&&!mobile);card.dataset.phone=String(mobile);
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
      const todayNode=nodes.get('today');
      if(todayNode&&(isDemo||cfg.solarForecast)){
        todayNode.val.replaceChildren();
        for(const [x,anchor,value] of [[-14,'end',number(data.today,'kWh',1)],[0,'middle','/'],[14,'start',number(data.forecast,'kWh',1)]]){
          const part=svgEl('tspan',{x,'text-anchor':anchor});part.style.textAnchor=anchor;part.textContent=value;todayNode.val.append(part);
        }
        todayNode.g.setAttribute('aria-label',tr('Generated today / forecast today: ','Вироблено сьогодні / прогноз на сьогодні: ')+number(data.today,'kWh',1)+' / '+number(data.forecast,'kWh',1));
      }
      const temperatureRows=['acTemperature','dcTemperature'].filter(k=>isDemo||cfg.telemetry[k]).map(k=>['',label[k]+' '+number(data.telemetry[k],unit[k])]);
      const inverterReadingY=cfg.phases===3?-12:10;
      if(!phone)beside('inverter',temperatureRows,'left',inverterReadingY);
      const acRows=cfg.phases===3?cfg.phaseReadings.flatMap((p,i)=>phone?[[ '', 'L'+(i+1)+' · '+number(data.phaseReadings[i].voltage,'V')],['',number(data.phaseReadings[i].current,'A')]]:[['','L'+(i+1)+' · '+number(data.phaseReadings[i].voltage,'V')+' · '+number(data.phaseReadings[i].current,'A')]]):['voltage','current'].filter(k=>isDemo||cfg.telemetry[k]).map(k=>[label[k],number(data.telemetry[k],unit[k])]);
      const inverterNode=nodes.get('inverter');
      inverterNode?.g.querySelector('.es-frequency')?.remove();
      if(isDemo||cfg.telemetry.frequency){
        if(phone)acRows.push([label.frequency,number(data.telemetry.frequency,'Hz')]);
        else if(inverterNode){
          inverterNode.g.querySelector('.es-icon').setAttribute('x',-52);
          const hz=svgEl('text',{x:58,y:20,'class':'es-frequency'});hz.textContent=number(data.telemetry.frequency,'Hz');inverterNode.g.append(hz);
        }
      }
      beside('inverter',phone?[...temperatureRows,...acRows]:acRows,phone?'above':'right',phone?150:inverterReadingY);

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
      const solar=group(tr('Solar · up to 10 fields','Сонце · до 10 полів'));check(solar,tr('Show solar','Показувати сонце'),c,'showSolar');sensor(solar,tr('Solar energy today (kWh)','Генерація сьогодні (кВт·год)'),c,'solarToday','energy');sensor(solar,tr('Solar forecast today (kWh)','Прогноз генерації на сьогодні (кВт·год)'),c,'solarForecast','energy');sensor(solar,tr('PV total (optional; otherwise sum fields)','Сумарна PV (або сума полів)'),c,'pvTotal');
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


/* ANMA Cloud Flow: responsive architectural scene; shared studio / HA runtime. */
(function(root){
  'use strict';
  const str=v=>typeof v==='string'?v.slice(0,200):'';
  const num=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
  const clamp=(v,min,max,fallback)=>num(v)===null?fallback:Math.max(min,Math.min(max,Number(v)));
  const atlas='data:image/webp;base64,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',sky='data:image/webp;base64,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',evAsset='data:image/webp;base64,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';
  const asset=name=>typeof document!=='undefined'&&document.currentScript?.src?new URL('assets/'+name,document.currentScript.src).href:'/static/dashboards/assets/'+name;
  const assets={atlas:atlas.startsWith('__')?asset('cloud-flow-atlas.webp'):atlas,sky:sky.startsWith('__')?asset('cloud-flow-sky.webp'):sky,ev:evAsset.startsWith('__')?asset('cloud-flow-ev.webp'):evAsset};
  function normalize(raw={}){
    raw=raw&&typeof raw==='object'?raw:{};
    return {solarPower:str(raw.solarPower),batteryPower:str(raw.batteryPower),batterySoc:str(raw.batterySoc),showNonBackup:raw.showNonBackup!==false,showEv:raw.showEv===true,evGroup:raw.evGroup==='grid'?'grid':'backup',evName:str(raw.evName)||'Tesla · EV',weatherEntity:/^weather\.[\w]+$/.test(raw.weatherEntity)?raw.weatherEntity:'',forecastEntity:/^weather\.[\w]+$/.test(raw.forecastEntity)?raw.forecastEntity:'',forecastType:['auto','hourly','daily','twice_daily'].includes(raw.forecastType)?raw.forecastType:'auto',effects:raw.effects!==false,effectOpacity:clamp(raw.effectOpacity,0,100,35),showForecast:raw.showForecast!==false,solarToday:str(raw.solarToday),demoWeather:['sunny','partlycloudy','rainy','snowy','cloudy','clear-night'].includes(raw.demoWeather)?raw.demoWeather:'partlycloudy'};
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
    return {solar,battery,batteryState:batteryState(battery),soc:c.cloud.batterySoc?value(c.cloud.batterySoc,76,'soc'):c.batteries.length?value(c.batteries[0].soc,76,'soc'):null,inverter:value(c.inverter.power,solar),inverterState:state(c.inverterStatus,c.inverterOn,c.inverterOff,c.inverterFault),grid:gridState==='offline'?0:rawGrid===null?null:rawGrid*(c.invertGrid?-1:1),gridState,home:value(c.load||layout.bindings?.load_power,2450),nonBackup:gridState==='offline'?0:value(c.nonBackup,350),ev:evOffline?0:value(c.ev||layout.bindings?.ev_power,1000),evOffline,today:value(c.cloud.solarToday,18.6,'energy')};
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
    phone:{width:375,height:630,solar:[76,118,145,145],grid:[302,120,120,165],house:[188,315,156,160],battery:[74,474,135,135],nonBackup:[303,474,135,135],solarLabel:[76,32],gridLabel:[300,32],inverterLabel:[78,268],homeLabel:[188,425],batteryLabel:[75,554],nonBackupLabel:[300,554]}
  };
  function sceneLayout(phone,cloud){const base=layouts[phone?'phone':'desktop'];return {...base,height:base.height+(cloud.showEv?(phone?160:140):0),ev:phone?[188,cloud.showEv?640:560,170,126]:[600,cloud.showEv?655:560,210,140],evLabel:phone?[188,cloud.showEv?742:600]:[600,cloud.showEv?762:620]};}
  const css=`
    .cf-scene{--cf-bg:#0b1721;--cf-text:#f1f6fb;--cf-muted:#a9bbcd;--cf-border:#304658;--cf-panel:#102130;position:relative;isolation:isolate;grid-column:1/-1;width:100%;min-width:0;box-sizing:border-box;border:1px solid var(--cf-border);border-radius:18px;overflow:hidden;background:var(--cf-bg);color:var(--cf-text);font:14px system-ui,sans-serif;container-type:inline-size;container-name:cloudscene}
    .cf-scene[data-theme=day]{--cf-bg:#e9f0f6;--cf-text:#172d40;--cf-muted:#465d70;--cf-border:#b7c9d8;--cf-panel:#f5f8fc}.cf-scene[data-theme=day] .cf-landscape{opacity:.18}.cf-scene[data-theme=day] .cf-number{text-shadow:0 1px 1px #fff}.cf-scene[data-theme=day] .cf-node-label{--cf-label-shadow:#fff9}.cf-scene[data-theme=day] .cf-node-label[data-state=offline],.cf-scene[data-theme=day] .cf-node-label[data-state=unknown]{color:#566573}
    .cf-landscape{position:absolute;inset:0;background-image:var(--cf-sky);background-size:cover;background-position:center top;opacity:.45;pointer-events:none;z-index:-3}.cf-scene::before{content:'';position:absolute;inset:0;z-index:-2;pointer-events:none;background:linear-gradient(180deg,transparent 0%,var(--cf-bg) 90%)}
    .cf-scene.cf-scene>.cf-landscape{position:absolute;z-index:-3}.cf-scene.cf-scene>.cf-atmosphere{position:absolute;z-index:-1}
    .cf-head{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:18px 20px 10px}.cf-head h2{margin:0;color:#f1873d;font-size:22px}.cf-head .cf-name{color:var(--cf-text);font-size:14px;margin-left:12px}.cf-tools{display:flex;gap:6px}.cf-scene button{font:inherit;cursor:pointer;color:inherit;border:1px solid var(--cf-border);border-radius:10px;background:var(--cf-panel);padding:9px 11px}.cf-scene .cf-connections{color:#f1873d}
    .cf-weather{display:flex;align-items:center;justify-content:flex-end;gap:16px;flex-wrap:wrap;padding:0 20px 12px;min-height:40px;font-size:13px}.cf-weather-main{display:flex;align-items:center;gap:9px}.cf-weather-main b{font-size:24px}.cf-weather-icon{font-size:28px;color:#f6b94b}.cf-weather-forecast{display:flex;gap:14px;list-style:none;margin:0;padding:0}.cf-weather-forecast li{display:grid;grid-template-columns:auto auto;gap:2px 5px}.cf-weather-forecast time{grid-column:1/-1;color:var(--cf-muted);font-size:11px}.cf-weather-note{font-size:12px;color:var(--cf-muted)}
    .cf-stage{position:relative;aspect-ratio:1200/680;width:100%;min-width:0}.cf-svg{display:block;width:100%;height:100%;overflow:visible}.cf-object{position:absolute;transform:translate(-50%,-50%);pointer-events:none;background-image:var(--cf-atlas);background-repeat:no-repeat;filter:drop-shadow(0 8px 8px #0004)}.cf-object[data-state=idle],.cf-object[data-state=offline],.cf-object[data-state=unknown]{filter:grayscale(.8) brightness(.65) drop-shadow(0 6px 7px #0003)}
    .cf-node-label{--cf-label-shadow:#08121de6;position:absolute;transform:translate(-50%,-50%);text-align:center;white-space:nowrap;color:var(--cf-color);text-shadow:0 2px 5px var(--cf-label-shadow);line-height:1.35;z-index:3}.cf-node-label span{display:block;font-size:clamp(12px,1.1cqw,16px);color:var(--cf-text)}.cf-node-label b{display:block;font-size:clamp(24px,2.7cqw,38px);font-weight:750;font-variant-numeric:tabular-nums}.cf-node-label small{font-size:clamp(11px,1cqw,14px);color:var(--cf-muted);display:block}.cf-node-label[data-state=unknown],.cf-node-label[data-state=offline],.cf-node-label[data-state=idle]{color:#8998a7}.cf-node-label[data-kind=inverter] b{font-size:clamp(20px,2cqw,29px)}
    .cf-track{fill:none;stroke:var(--cf-wire);stroke-width:1.5;opacity:.2}.cf-flow{fill:none;stroke:var(--cf-wire);stroke-width:2.6;stroke-dasharray:5 13;stroke-linecap:round;animation:cf-flow 1s linear infinite;filter:drop-shadow(0 0 3px var(--cf-wire))}.cf-flow[data-active=false]{display:none}.cf-flow[data-reverse=true]{animation-direction:reverse}.cf-particle{fill:var(--cf-wire);filter:drop-shadow(0 0 4px var(--cf-wire))}.cf-edge[data-active=false] .cf-particle{display:none}.cf-arrow{fill:var(--cf-wire)}@keyframes cf-flow{to{stroke-dashoffset:-18}}
    .cf-atmosphere{position:absolute;inset:0;opacity:var(--cf-effects,.35);pointer-events:none;z-index:-1;overflow:hidden}.cf-scene[data-effects=false] .cf-atmosphere{display:none}.cf-atmosphere::after{content:'';position:absolute;inset:-30%;background:radial-gradient(ellipse at 15% 10%,#ffc76177,transparent 48%)}.cf-scene[data-weather=cloudy] .cf-atmosphere::after,.cf-scene[data-weather=fog] .cf-atmosphere::after{background:radial-gradient(ellipse at 60% 0,#c8d7e855,transparent 65%)}.cf-scene[data-weather=clear-night] .cf-atmosphere::after{background:radial-gradient(ellipse at 80% 0,#87aaff33,transparent 60%)}
    .cf-scene[data-weather=rainy] .cf-atmosphere::after,.cf-scene[data-weather=pouring] .cf-atmosphere::after,.cf-scene[data-weather=lightning-rainy] .cf-atmosphere::after{background:repeating-linear-gradient(110deg,transparent 0 47px,#c4dcf866 48px 49px,transparent 50px 90px);animation:cf-rain 1.6s linear infinite}.cf-scene[data-weather=snowy] .cf-atmosphere::after,.cf-scene[data-weather=snowy-rainy] .cf-atmosphere::after{background-image:radial-gradient(circle,#fff8 1px,transparent 2px);background-size:52px 65px;animation:cf-snow 10s linear infinite}@keyframes cf-rain{to{transform:translate(-45px,100px)}}@keyframes cf-snow{to{transform:translate(25px,130px)}}
    .cf-foot{display:flex;justify-content:center;gap:20px;padding:12px 18px 18px;font-size:12px;color:var(--cf-muted)}.cf-foot span::before{content:'●';color:var(--cf-color);margin-right:6px}.cf-settings{position:absolute;z-index:10;inset:65px 10px 10px auto;width:min(450px,calc(100% - 20px));background:var(--cf-panel);border:1px solid #b8753e;border-radius:12px;padding:12px;overflow:auto;box-sizing:border-box;overscroll-behavior:contain}.cf-settings[hidden]{display:none}.cf-settings .apf-config{position:static;inset:auto;display:block;background:transparent;overflow:visible;border:0;padding:0}.cf-settings .apf-settings{display:grid;grid-template-columns:minmax(0,1fr);gap:12px}.cf-settings fieldset{min-width:0;border:1px solid #6d7c89;border-radius:8px;padding:10px;display:grid;gap:8px}.cf-settings legend{color:#f1873d}.cf-settings label{display:grid;gap:5px}.cf-settings input,.cf-settings select{width:100%;box-sizing:border-box;min-width:0;padding:8px;border:1px solid #526677;border-radius:6px;color:var(--cf-text);background:var(--cf-bg);font:inherit}.cf-settings input[type=checkbox]{width:auto;justify-self:start}.cf-settings .apf-entity-menu{display:grid;gap:4px}.cf-settings .apf-entity-menu[hidden]{display:none}.cf-settings small{color:var(--cf-muted)}
    .cf-scene[data-fit=true]{min-height:540px}.cf-scene:fullscreen{height:100dvh;border-radius:0;display:flex;flex-direction:column}.cf-scene:fullscreen .cf-stage{flex:1;min-height:0;aspect-ratio:auto}.cf-scene:fullscreen .cf-svg{position:absolute;inset:0}.cf-scene[data-phone=true] .cf-head{padding:14px 12px 8px;align-items:flex-start}.cf-scene[data-phone=true] .cf-head h2{font-size:18px}.cf-scene[data-phone=true] .cf-name{display:block;font-size:12px;margin:4px 0 0}.cf-scene[data-phone=true] .cf-connections{font-size:0}.cf-scene[data-phone=true] .cf-connections::before{content:'⚙';font-size:18px}.cf-scene[data-phone=true] .cf-weather{padding:4px 12px 12px;gap:8px;justify-content:space-between}.cf-scene[data-phone=true] .cf-weather-main b{font-size:21px}.cf-scene[data-phone=true] .cf-weather-forecast{width:100%;justify-content:space-between;gap:8px}.cf-scene[data-phone=true] .cf-weather-forecast li{display:flex;align-items:center;gap:5px}.cf-scene[data-phone=true] .cf-foot{gap:12px;flex-wrap:wrap;font-size:11px}.cf-scene[data-phone=true] .cf-node-label span{font-size:12px}.cf-scene[data-phone=true] .cf-node-label b{font-size:22px}.cf-scene[data-phone=true] .cf-node-label small{font-size:11px}.cf-scene[data-phone=true] .cf-node-label[data-kind=inverter] b{font-size:20px}.cf-scene[data-phone=true] .cf-node-label[data-kind=inverter] span{font-size:11px}.cf-scene[data-phone=true] .cf-settings{top:58px}
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
    const stage=n('div','cf-stage'),svg=s('svg',{'class':'cf-svg','aria-hidden':'true',preserveAspectRatio:'none'});stage.append(svg);card.append(stage);
    const objects={},labels={};
    for(const kind of [...Object.keys(crops),'ev']){const obj=n('div','cf-object');obj.dataset.kind=kind;obj.setAttribute('aria-hidden','true');objects[kind]=obj;stage.append(obj);if(kind==='ev'){obj.style.backgroundImage=`url("${assets.ev}")`;obj.style.backgroundSize='contain';obj.style.backgroundPosition='center';}}
    const names={solar:tr('SOLAR','СОНЦЕ'),grid:tr('GRID','МЕРЕЖА'),inverter:c.inverter.name||tr('INVERTER','ІНВЕРТОР'),home:c.backupName==='EPS / Backup'?tr('HOME','БУДИНОК'):c.backupName,battery:tr('BATTERY','БАТАРЕЯ'),nonBackup:c.nonBackupName==='Grid / Non-backup'?tr('NON-BACKUP','НЕГАРАНТОВАНЕ'):c.nonBackupName};
    names.ev=c.cloud.evName;
    for(const kind of Object.keys(names)){const el=n('div','cf-node-label'),title=n('span','',names[kind]),value=n('b','','—'),detail=n('small');el.dataset.kind=kind;el.style.setProperty('--cf-color',colors[kind]);el.append(title,value,detail);stage.append(el);labels[kind]={el,value,detail};}
    const foot=n('div','cf-foot');for(const kind of ['solar','grid','battery','home']){const el=n('span','',names[kind]);el.style.setProperty('--cf-color',colors[kind]);foot.append(el);}if(demo)foot.append(n('small','',tr('DEMO · simulated values','ДЕМО · змодельовані значення')));card.append(foot);
    let live=hass,data,phone=false,forecast=[],subscription=null,connection=null,subscriptionKey='',dead=false,token=null,resizeObserver;
    const edges={};for(const key of ['solar','grid','battery','home','nonBackup','ev']){const g=s('g',{'class':'cf-edge','data-branch':key}),track=s('path',{'class':'cf-track'}),flow=s('path',{'class':'cf-flow'});g.style.setProperty('--cf-wire',colors[key]);g.append(track,flow);const dots=[];for(let i=0;i<3;i++){const dot=s('circle',{'class':'cf-particle',r:3-i*.6,opacity:1-i*.28}),motion=s('animateMotion',{dur:'4s',repeatCount:'indefinite',begin:(-i*.11)+'s'});dot.append(motion);g.append(dot);dots.push(motion);}svg.append(g);edges[key]={g,track,flow,dots};}
    function place(){
      const width=stage.getBoundingClientRect().width;if(!width)return;phone=c.profile==='mobile'||c.profile!=='desktop'&&width<600;card.dataset.phone=String(phone);
      const l=sceneLayout(phone,c.cloud);stage.style.aspectRatio=l.width+'/'+l.height;svg.setAttribute('viewBox',`0 0 ${l.width} ${l.height}`);
      for(const [kind,el] of Object.entries(objects)){const [x,y,w,h]=l[kind];el.style.left=x/l.width*100+'%';el.style.top=y/l.height*100+'%';el.style.width=w/l.width*100+'%';el.style.height=h/l.height*100+'%';if(crops[kind]){const [sx,sy,cw,ch]=crops[kind];el.style.backgroundSize=`${1536/cw*100}% ${1024/ch*100}%`;el.style.backgroundPosition=`${sx/(1536-cw)*100}% ${sy/(1024-ch)*100}%`;}}
      for(const [kind,{el}] of Object.entries(labels)){const [x,y]=l[kind+'Label'];el.style.left=x/l.width*100+'%';el.style.top=y/l.height*100+'%';}
      const paths=phone?{solar:'M100 180L137 215Q145 220 145 232V268L174 285',grid:'M290 190L246 226Q238 230 238 244V280L210 295',battery:'M173 365L125 395Q114 402 110 415L94 435',home:'M188 365V403',nonBackup:'M262 215V330Q262 345 277 354L307 375V433'}:{solar:'M240 260L400 314L535 366',grid:'M978 270L800 320L680 360',battery:'M545 450L402 490L260 550',home:'M602 460V515',nonBackup:'M950 286L895 330L955 380Q975 393 975 420V470'};
      paths.ev=phone?(c.cloud.evGroup==='grid'?'M302 190H366V598H235V615':'M188 452V595'):(c.cloud.evGroup==='grid'?'M978 270H1160V730H760L705 675':'M602 460L730 520V620Q730 640 710 640H705');
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
      setLabel('solar',power(data.solar),data.today===null?'':tr('Today ','Сьогодні ')+data.today.toLocaleString(uk?'uk':'en',{maximumFractionDigits:1})+' '+tr('kWh','кВт·год'),knownState(data.solar));
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
    card._cloudRefresh=refresh;card._cloudDispose=()=>{dead=true;card._cloudDisposed=true;token=null;subscription?.();subscription=null;resizeObserver?.disconnect();removalObserver?.disconnect();};card._cloudKey=JSON.stringify([layout.powerFlow,layout.theme,layout.name,layout.motion,uk,demo]);
    refresh();requestAnimationFrame(()=>{if(!card.isConnected)return;subscriptionKey='';refresh();place();resizeObserver=new ResizeObserver(place);resizeObserver.observe(stage);removalObserver=new MutationObserver(()=>{if(!card.isConnected)card._cloudDispose();});removalObserver.observe(card.getRootNode(),{childList:true,subtree:true});});
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

/* ANMA Power Flow: shared studio and Home Assistant renderer. */
(function(root){
  'use strict';
  const Station=root.AnmaEnergyStation||(typeof require==='function'?require('./energy-station.js'):null);
  const Cloud=root.AnmaCloudFlow||(typeof require==='function'?require('./cloud-flow.js'):null);
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
    const cloud=Cloud.normalize(raw.cloud);
    const unit=(v,i,prefix)=>({chargeSource:['solar','grid','mixed','sensor'].includes(v?.chargeSource)?v.chargeSource:'sensor',chargeSourceEntity:text(v?.chargeSourceEntity),backgroundOpacity:opacity(v?.backgroundOpacity),capacityKw:rating(v?.capacityKw),name:text(v?.name)||`${prefix} ${i+1}`,image:image(v?.image),imageOpacity:v?.imageOpacity!=null&&Number.isFinite(Number(v.imageOpacity))?Math.max(0,Math.min(100,Number(v.imageOpacity))):25,power:powerValue(v?.power),soc:text(v?.soc),voltage:text(v?.voltage),temperature:text(v?.temperature),mppts:Array.isArray(v?.mppts)?v.mppts.slice(0,2).map(x=>({name:text(x?.name),power:powerValue(x?.power)})):[]});
    return {cloud,station:Station.normalize(raw.station),nodeAppearance:Object.fromEntries(['grid','load','nonBackup','ev','solar','battery'].map(k=>[k,appearance(raw.nodeAppearance?.[k])])),background:raw.background&&typeof raw.background==='object'?background(raw.background):null,gridCapacityKw:rating(raw.gridCapacityKw),fit:raw.fit!==false,gridStatus:text(raw.gridStatus),gridOn:text(raw.gridOn)||'on,connected,online,1',gridOff:text(raw.gridOff)||'off,disconnected,offline,0',inverterStatus:text(raw.inverterStatus),inverterOn:text(raw.inverterOn)||'on,running,normal,online',inverterOff:text(raw.inverterOff)||'off,standby,offline',inverterFault:text(raw.inverterFault)||'error,fault,alarm',nonBackup:powerValue(raw.nonBackup),backupName:text(raw.backupName)||'EPS / Backup',nonBackupName:text(raw.nonBackupName)||'Grid / Non-backup',mode:['auto','day','night'].includes(raw.mode)?raw.mode:'auto',profile:['auto','desktop','tablet','mobile'].includes(raw.profile)?raw.profile:'auto',hideDetails:raw.hideDetails!==false,showEv:raw.showEv!==false,invertGrid:raw.invertGrid===true,invertBattery:raw.invertBattery===true,inverter:unit(raw.inverter,0,'Inverter'),batteries:(Array.isArray(raw.batteries)?raw.batteries:[{},{}]).slice(0,5).map((v,i)=>unit(v,i,'Battery')),strings:(Array.isArray(raw.strings)?raw.strings:[{},{}]).slice(0,10).map((v,i)=>unit(v,i,'PV')),grid:powerValue(raw.grid),load:powerValue(raw.load),ev:powerValue(raw.ev)};
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
    if(layout.template==='cloud_flow')return Cloud.render(layout,{uk,demo,hass,change,normalizePower:normalize});
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
    if(layout.template==='cloud_flow')return Cloud.update(host,layout,{...options,normalizePower:normalize});
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
  function editor(raw,uk,onchange,{getStates=()=>null,legacyBackground=null,template=null,demoPreview=false,showEntityImport=true}={}){
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
    if(template==='cloud_flow'){
      if(!showEntityImport||Object.keys(getStates()||{}).length)importLabel.remove();
      summary.textContent=tr('Cloud Flow · Connections','Cloud Flow · З’єднання');
      const section=(en,ua)=>{const el=n('fieldset');el.append(n('legend',tr(en,ua)));form.append(el);return el;};
      const toggle=(parent,en,ua,obj,key)=>{const label=n('label',tr(en,ua)),input=n('input');input.type='checkbox';input.checked=obj[key];input.onchange=()=>{obj[key]=input.checked;commit();};label.append(input);parent.append(label);};
      const solar=section('Solar · total','Сонце · разом');
      powerInput(solar,tr('Total solar power','Загальна потужність сонця'),c.cloud,'solarPower');
      field(solar,tr('Solar energy today (kWh or entity)','Генерація сьогодні (кВт·год або сутність)'),c.cloud,'solarToday');
      solar.append(n('small',tr('One solar object. An empty total preserves the sum of previously connected PV sensors. A total sensor overrides that sum without double counting.','Один об’єкт сонця. Порожнє поле потужності зберігає суму раніше підключених PV-сенсорів. Загальний сенсор замінює цю суму без подвійного підрахунку.')));
      const battery=section('Battery · total','Батарея · разом');
      powerInput(battery,tr('Total battery power','Загальна потужність батареї'),c.cloud,'batteryPower');
      field(battery,tr('Total battery SOC entity or %','Загальний SOC батареї · сутність або %'),c.cloud,'batterySoc');suggest(battery.querySelector('label:last-child input'),'soc');
      toggle(battery,'Reverse battery sign (default: positive discharge)','Інвертувати знак батареї (типово: плюс = розряд)',c,'invertBattery');
      battery.append(n('small',tr('Empty fields retain the previous battery power sum and first battery SOC. Charging, discharging and standby are detected automatically.','Порожні поля зберігають попередню суму потужності батарей і SOC першої батареї. Заряд, розряд та очікування визначаються автоматично.')));
      const inverter=section('Inverter','Інвертор');field(inverter,tr('Inverter name','Назва інвертора'),c.inverter,'name');powerInput(inverter,tr('Inverter power','Потужність інвертора'),c.inverter);
      for(const [key,en,ua] of [['inverterStatus','Inverter status entity','Сенсор стану інвертора'],['inverterOn','Running values (comma separated)','Значення: працює (через кому)'],['inverterOff','Standby / off values','Значення: очікування / вимкнений'],['inverterFault','Fault values','Значення: помилка']])field(inverter,tr(en,ua),c,key);
      const grid=section('Grid','Мережа');powerInput(grid,tr('Grid power','Потужність мережі'),c,'grid');toggle(grid,'Reverse grid sign (default: positive import)','Інвертувати знак мережі (типово: плюс = імпорт)',c,'invertGrid');
      for(const [key,en,ua] of [['gridStatus','Grid status entity','Сенсор стану мережі'],['gridOn','Connected values (comma separated)','Значення: мережа є (через кому)'],['gridOff','Disconnected values','Значення: мережі немає']])field(grid,tr(en,ua),c,key);
      const home=section('House · backup group','Будинок · гарантована група');field(home,tr('House / group name','Назва будинку / групи'),c,'backupName');powerInput(home,tr('House power','Потужність будинку'),c,'load');
      const nonBackup=section('Non-backup group','Негарантована група');toggle(nonBackup,'Show non-backup group','Показувати негарантовану групу',c.cloud,'showNonBackup');field(nonBackup,tr('Group name','Назва групи'),c,'nonBackupName');powerInput(nonBackup,tr('Non-backup power','Потужність негарантованої групи'),c,'nonBackup');
      const groups=n('fieldset');groups.append(n('legend',tr('Electric vehicle','Електромобіль')));form.append(groups);
      toggle(groups,'Show Tesla / EV below the house','Показувати Tesla / авто під будинком',c.cloud,'showEv');
      field(groups,tr('EV name','Назва авто'),c.cloud,'evName');
      field(groups,tr('EV supply group','Група живлення авто'),c.cloud,'evGroup',[['backup',tr('Backup / house','Гарантована / будинок')],['grid',tr('Grid / non-backup','Мережа / негарантована')]]);
      powerInput(groups,tr('EV power','Потужність авто'),c,'ev');
      groups.append(n('small',tr('Select the EV power entity. Appliance power is part of its parent group, not added again. Battery states: charging, discharging, standby (below 10 W).','Оберіть сутність потужності авто. Потужність авто входить у підсумок своєї групи й повторно не додається. Стани батареї: заряд, розряд, очікування (менше 10 Вт).')));
      const group=n('fieldset');group.append(n('legend',tr('Cloud Flow · weather and atmosphere','Cloud Flow · погода й атмосфера')));form.append(group);
      for(const [key,en,ua] of [['weatherEntity','Current weather entity (weather.*)','Поточна погода · сутність (weather.*)'],['forecastEntity','Forecast entity (optional; same as current weather if empty)','Сутність прогнозу (порожньо — як поточна погода)']]){
        field(group,tr(en,ua),c.cloud,key);
        const weatherInput=group.querySelector('label:last-child input'),list=n('datalist');list.id='cloud-weather-'+Math.random().toString(36).slice(2);weatherInput.setAttribute('list',list.id);weatherInput.placeholder='weather.home';
        for(const [id,value] of Object.entries(getStates()||{}).filter(([id])=>id.startsWith('weather.'))){const option=n('option',value.attributes?.friendly_name||id);option.value=id;list.append(option);}group.append(list);
      }
      field(group,tr('Forecast','Прогноз'),c.cloud,'forecastType',[['auto',tr('Auto (prefer hourly)','Авто (спочатку погодинний)')],['hourly',tr('Hourly','Погодинний')],['daily',tr('Daily','Добовий')],['twice_daily',tr('Day / night','День / ніч')]]);
      for(const [key,en,ua] of [['effects','Weather background effects','Погодні ефекти фону'],['showForecast','Show forecast','Показувати прогноз']]){const label=n('label',tr(en,ua)),input=n('input');input.type='checkbox';input.checked=c.cloud[key];input.onchange=()=>{c.cloud[key]=input.checked;commit();};label.append(input);group.append(label);}
      const label=n('label',tr('Weather effects intensity','Інтенсивність погодних ефектів')),input=n('input'),value=n('output');input.type='range';input.min=0;input.max=100;input.value=c.cloud.effectOpacity;value.textContent=input.value+'%';input.oninput=()=>{c.cloud.effectOpacity=Number(input.value);value.textContent=input.value+'%';};input.onchange=()=>commit();label.append(input,value);group.append(label);
      if(demoPreview)field(group,tr('Demo weather (preview only)','Погода в демо (лише перегляд)'),c.cloud,'demoWeather',[['partlycloudy',tr('Partly cloudy','Мінлива хмарність')],['sunny',tr('Sunny','Сонячно')],['rainy',tr('Rain','Дощ')],['snowy',tr('Snow','Сніг')],['cloudy',tr('Cloudy','Хмарно')],['clear-night',tr('Clear night','Ясна ніч')]]);
      group.append(n('small',tr('Current conditions and forecast use your selected Home Assistant weather provider. Unavailable data stays unknown. Demo weather is only used in website preview.','Поточна погода та прогноз — з обраної погодної сутності Home Assistant. Недоступні дані не підмінюються. Демопогода працює лише в перегляді сайту.')));
      const view=section('Appearance','Вигляд');field(view,tr('Theme','Тема'),c,'mode',[['auto','Auto'],['day',tr('Day','День')],['night',tr('Night','Ніч')]]);field(view,tr('Display','Екран'),c,'profile',[['auto','Auto'],['desktop','Desktop'],['tablet','Tablet'],['mobile','Phone']]);
      view.append(n('small',tr('Equipment illustrations are fixed. Node photos, border ratings and MPPT layout controls belong to other views and are not used here.','Зображення обладнання фіксовані. Фото вузлів, номінали рамок і розмітка MPPT належать іншим дашбордам і тут не використовуються.')));
      return box;
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
    field(form,tr('Theme','Тема'),c,'mode',[['auto','Auto'],['day',tr('Day','День')],['night',tr('Night','Ніч')]]);field(form,tr('Display','Екран'),c,'profile',[['auto','Auto'],['desktop','Desktop'],['tablet','Tablet'],['mobile','Phone']]);check(tr('Fit screen','Вписувати в екран'),'fit');check(tr('Hide secondary details on phone','Приховувати дрібні показники на телефоні'),'hideDetails');if(template!=='cloud_flow')check(tr('Show EV load','Показувати зарядку авто'),'showEv');check(tr('Reverse grid sign (default: positive import)','Інвертувати знак мережі (типово: плюс = імпорт)'),'invertGrid');check(tr('Reverse battery sign (default: positive discharge)','Інвертувати знак батарей (типово: плюс = розряд)'),'invertBattery');
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

  const CARD_VERSION = '0.7.2';
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
    disconnectedCallback(){this._weatherToken=null;this._weatherUnsub?.();this._weatherUnsub=null;this._weatherSource=null;this.shadowRoot?.querySelectorAll('.cf-scene').forEach(e=>e._cloudDispose?.());}
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
      if(layout.template!=='cloud_flow')this._node('option', uk ? '🧱 Віджети та розмітка' : '🧱 Widgets & Layout', nav).value = 'widgets';
      this._node('option', layout.template==='cloud_flow'?'⚡ Cloud Flow · Connections':layout.template==='energy_station'?'⚡ Energy Station · Connections':(uk ? '⚡ Обладнання · інвертори, АКБ, PV' : '⚡ Equipment · inverters, batteries, PV'), nav).value = 'equipment';
      [...(layout.template==='cloud_flow'?[]:this._fields.children)].forEach((section, i) => {
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
        },{getStates:()=>this._hass?.states||null,legacyBackground:layout.background,template:layout.template,showEntityImport:false});
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
