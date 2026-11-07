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

  // Four cathodes plus an independent neon decimal; precision adapts, tube size does not.
  function nixieFormat(value,kind='power'){
    if(kind==='energy'){const f=nixieFormat(value===null?null:value*1000);return {...f,unit:f.unit==='MW'?'MWh':'kWh'};}
    if(value===null||!Number.isFinite(value))return {digits:kind==='soc'?'---':'----',point:-1,unit:kind==='soc'?'%':'kW',negative:false};
    if(kind==='soc')return {digits:String(Math.round(Math.max(0,Math.min(100,value)))).padStart(3,' '),point:-1,unit:'%',negative:false};
    let v=Math.abs(value)/1000,unit='kW';
    if(v>=9999.5){v/=1000;unit='MW';}
    let decimals=Math.max(0,3-Math.floor(Math.log10(Math.max(1,v))));
    let shown=v.toFixed(decimals);
    if(shown.replace('.','').length>4){decimals=Math.max(0,decimals-1);shown=v.toFixed(decimals);}
    if(shown.replace('.','').length>4)return {digits:'----',point:-1,unit,negative:value<0};
    return {digits:shown.replace('.','').padStart(4,'0'),point:shown.includes('.')?shown.indexOf('.')-1:-1,unit,negative:value<0};
  }
  function solarRows(count){return count<=5?[count].filter(Boolean):[Math.floor(count/2),Math.ceil(count/2)];}
  const cathodes=[
    'M17 25C6 25 6 76 17 76C29 76 29 25 17 25Z',
    'M10 34L18 25V76M11 76H25',
    'M7 35C7 19 29 21 29 36C29 49 7 60 7 76H29',
    'M7 29C27 16 36 46 18 49C37 50 30 86 7 73',
    'M24 76V25L6 59H31',
    'M29 25H9L7 48C32 38 37 80 12 76L6 72',
    'M28 27C3 12 1 77 18 76C34 76 33 45 17 46L7 51',
    'M6 25H30L13 76',
    'M18 49C-1 45 5 20 18 25C34 20 37 45 18 49C-2 53 1 79 18 76C37 79 39 53 18 49Z',
    'M8 74C32 90 35 24 18 25C2 24 1 55 18 55L29 49'
  ];
  function nixieReadout(element,value,kind='power'){
    const original=element.textContent,f=nixieFormat(value,kind),doc=element.ownerDocument;
    element.classList.add('nx-readout');element.dataset.value=original;element.setAttribute('aria-label',original);
    element.replaceChildren();
    const readable=doc.createElement('span');readable.className='nx-readable';readable.textContent=original;element.append(readable);
    const group=doc.createElement('span');group.className='nx-tubes';group.setAttribute('aria-hidden','true');element.append(group);
    const sign=doc.createElement('span');sign.className='nx-sign';sign.textContent=f.negative?'−':'';group.append(sign);
    [...f.digits].forEach((digit,i)=>{
      const tube=doc.createElement('span');tube.className='nx-tube';tube.dataset.digit=digit;tube.dataset.lit=String(/\d/.test(digit));tube.style.setProperty('--nx-phase',(-i*1.37-Number(digit||0)*.31)+'s');tube.style.setProperty('--nx-period',(4.6+i*.43)+'s');
      const glass=doc.createElement('span');glass.className='nx-glass';
      const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 36 100');svg.setAttribute('class','nx-cathodes');
      for(const d of cathodes){const path=doc.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);path.setAttribute('class','nx-ghost');svg.append(path);}
      const lit=doc.createElementNS(svg.namespaceURI,'path');lit.setAttribute('class','nx-digit');lit.setAttribute('d',digit==='-'?'M8 51H28':cathodes[Number(digit)]||'');if(digit===' ')lit.setAttribute('d','');
      const halo=lit.cloneNode(false);halo.setAttribute('class','nx-digit-halo');
      const core=lit.cloneNode(false);core.setAttribute('class','nx-digit-core');svg.append(halo,lit,core);
      glass.append(svg);tube.append(glass);group.append(tube);
      if(i<f.digits.length-1){const dot=doc.createElement('span');dot.className='nx-dot';dot.dataset.lit=String(i===f.point);group.append(dot);}
    });
    const unit=doc.createElement('span');unit.className='nx-unit';unit.textContent=f.unit;unit.setAttribute('aria-hidden','true');element.append(unit);
  }
  const nixieAtlas='__ANMA_NIXIE_BACKGROUNDS__';
  const nixieCss=`
  .apf.apf-nixie{--pf-bg:#101213;--pf-panel:#171a1b;--pf-ink:#ebd3a6;--pf-muted:#b8a886;color:#ebd3a6;border:2px solid #957545;border-radius:16px;background:repeating-linear-gradient(0deg,#ffffff02 0 1px,transparent 1px 3px),linear-gradient(115deg,#202323,#0c0e0f 45%,#191c1d);box-shadow:inset 0 0 0 3px #0a0b0c,inset 0 0 0 4px #705937,0 12px 35px #0005;padding:20px}
  .apf-nixie .apf-head{padding:0 2px 12px;border-bottom:1px solid #8c70474d}.apf-nixie h2{font-family:Georgia,serif;letter-spacing:3px;color:#efd6a3}.apf-nixie .apf-kicker{color:#cbaa70;letter-spacing:2px}.apf-nixie .apf-caption{color:#d4b681;letter-spacing:1.5px;font-size:11px;margin-top:8px}
  .apf-nixie .apf-node{container-type:inline-size;border:1px solid #8e7046;border-radius:9px;padding:14px 10px 20px!important;gap:6px!important;box-shadow:inset 0 0 0 2px #070a0b,inset 0 0 0 3px #bca57722,0 5px 10px #0006;background:linear-gradient(115deg,rgb(38 42 41 / var(--nx-panel-alpha,.8)),rgb(9 12 13 / var(--nx-panel-alpha,.8)))!important}
  .apf-nixie .nx-backdrop{position:absolute;inset:0;z-index:-1;pointer-events:none;background-size:300% 100%;background-repeat:no-repeat;opacity:.4}
  .apf-nixie .apf-node::after{content:'';position:absolute;left:7px;top:7px;width:5px;height:5px;border-radius:50%;background:linear-gradient(130deg,#e7d3a6 40%,#29271d 42% 58%,#967e53 60%);box-shadow:0 1px 2px #000;pointer-events:none}
  .apf-nixie .apf-name{color:#ecd3a0!important;text-transform:uppercase;font-size:12px;letter-spacing:1px}.apf-nixie .apf-icon{color:#c8ab76}.apf-nixie .apf-icon svg{width:23px;height:23px}.apf-nixie .apf-state{color:#cbb78c;display:flex;align-items:center;justify-content:center;gap:6px}.apf-nixie .apf-state::before{content:'';width:6px;height:6px;border-radius:50%;background:#514c3c;flex:none;box-shadow:inset 0 1px 2px #fff4}
  .apf-nixie [data-state=online]>.apf-state::before,.apf-nixie [data-state=charging]>.apf-state::before{background:#83ed5c;box-shadow:0 0 6px #78eb57}.apf-nixie [data-state=discharging]>.apf-state::before{background:#ffb944;box-shadow:0 0 6px #ffac36}.apf-nixie [data-state=fault]>.apf-state::before{background:#ff6149;box-shadow:0 0 7px #f33}
  .apf-nixie .apf-body{overflow:auto;scrollbar-width:thin;scrollbar-color:#8c7047 transparent;padding:2px;gap:12px}.apf-nixie .apf-solar{flex:none;gap:10px}.apf-nixie .apf-solar-row{min-height:148px;flex:none;gap:10px}.apf-nixie .apf-batteries{flex:none;min-height:218px;gap:10px}.apf-nixie .apf-core{flex:none;min-height:300px;gap:24px 34px}.apf-nixie .apf-system-note{font-size:10px;letter-spacing:2px;background:#111415;color:#a08d67;max-width:90%}
  .apf-nixie .apf-stream{height:3px;bottom:6px}.apf-nixie .apf-stream[data-active=true]{filter:drop-shadow(0 0 3px #ff9f36)}.apf-nixie .apf-wire[data-active=true]{filter:drop-shadow(0 0 3px #ffb347)}
  /* Quiet, continuous illuminated wiring; no conveyor strips on equipment. */
  .apf-nixie .apf-stream{display:none!important}
  .apf-nixie .apf-node{padding-bottom:14px!important}
  .apf-nixie .apf-wire-track{fill:none;stroke:#766749;stroke-width:1.5;vector-effect:non-scaling-stroke;opacity:.28}
  .apf-nixie .apf-wire-track[data-powered=true]{stroke:#ffb74b;opacity:1;filter:drop-shadow(0 0 3px #ff890c) drop-shadow(0 0 6px #fa781740)}
  .apf-nixie .apf-wire{opacity:0;stroke:#fff1bc;stroke-linecap:round;stroke-width:3}
  .apf-nixie .apf-wire[data-active=true]{opacity:1;stroke-dasharray:1.5 98.5;animation:nx-current calc(var(--flow-duration,2s)*2.5) linear infinite;filter:drop-shadow(0 0 3px #ffd67c)}
  .apf-nixie .apf-wire[data-reverse=true]{animation-direction:reverse}
  .apf-nixie .apf-wire-arrow{fill:none;stroke:#ffd17b;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;filter:drop-shadow(0 0 3px #ff8b22)}
  .apf-nixie .apf-wire-arrow[data-powered=false]{display:none}
  .apf-nixie .apf-core{column-gap:52px;row-gap:24px}
  .apf-nixie .apf-system-note{visibility:hidden}
  .apf-nixie .apf-caption{padding:8px 0}
  .apf-nixie .apf-node{box-shadow:inset 0 0 0 2px #070a0b,inset 0 0 0 3px #bca57722,0 7px 15px #0008}
  @keyframes nx-current{to{stroke-dashoffset:-100}}
  @container powerflow (max-width:600px){.apf-nixie .apf-core{column-gap:16px}}
  .apf-nixie .nx-readout{--tube:clamp(17px,15cqw,48px);display:flex!important;justify-content:center;align-items:center;gap:5px;position:relative;max-width:100%;font-weight:400;line-height:1!important;letter-spacing:0;white-space:nowrap}
  .apf-nixie .nx-tubes{display:flex;align-items:center;position:relative;gap:1px}.apf-nixie .nx-tube{width:var(--tube);height:calc(var(--tube)*1.82);display:block;position:relative;border-radius:35% 35% 15% 15%;background:linear-gradient(90deg,#070909,#505452 10%,#080a0b 22% 76%,#4a504b 90%,#070909);box-shadow:0 3px 4px #0009,inset 0 -3px 1px #0a0a0a}
  .apf-nixie .nx-glass{position:absolute;inset:0 1px 12%;overflow:hidden;border:1px solid #afb9ad66;border-radius:38% 38% 18% 18%;background:radial-gradient(ellipse at 50% 65%,#ff6a161a,transparent 65%),linear-gradient(90deg,#d6eee218,#0005 15%,#0008 40%,#9cb09e09 75%,#e5fff51c);box-shadow:inset 2px 0 2px #edfff221,inset -2px 0 2px #ecfff321,inset 0 2px 2px #ffffff52}
  .apf-nixie .nx-glass::before{content:'';position:absolute;inset:10% 12% 7%;background:repeating-linear-gradient(0deg,transparent 0 3px,#bca78014 3px 4px),repeating-linear-gradient(90deg,transparent 0 4px,#bca78012 4px 5px);border-left:1px solid #66583b;border-right:1px solid #66583b;border-radius:12%;pointer-events:none}
  .apf-nixie .nx-glass::after{content:'';position:absolute;left:9%;top:6%;width:64%;height:16%;border-top:2px solid #f1fff6ad;border-radius:50%;transform:rotate(-12deg);background:linear-gradient(130deg,#fff8,transparent 65%);opacity:.75}
  .apf-nixie .nx-tube::after{content:'';position:absolute;bottom:4%;left:8%;right:8%;height:8%;border-radius:50%;border-top:1px solid #a9ad9780;background:linear-gradient(90deg,#222,#8d8e7944,#080a0a 70%,#7f847c66)}
  .apf-nixie .nx-cathodes{position:absolute;inset:3% 11% 0;width:78%;height:96%;overflow:visible;fill:none;stroke-linecap:round;stroke-linejoin:round}.apf-nixie .nx-ghost{stroke:#b9915c;stroke-width:.55;opacity:.10}.apf-nixie .nx-digit{stroke:#ffd18a;stroke-width:1.7;filter:drop-shadow(0 0 1px #fff5ce) drop-shadow(0 0 3px #ff7b18) drop-shadow(0 0 6px #f95106)}
  .apf-nixie .nx-tube[data-lit=false] .nx-digit{stroke:#a39375;filter:none;opacity:.45}.apf-nixie .nx-dot{width:4px;height:4px;flex:none;margin-top:calc(var(--tube)*.85);border-radius:50%;background:#695037;opacity:.25}.apf-nixie .nx-dot[data-lit=true]{background:#ffe29a;opacity:1;box-shadow:0 0 4px #ff881d,0 0 8px #ff7014}
  /* Light belongs inside the glass: broad gas halo, orange wire, hot inner core. */
  .apf-nixie .nx-digit-halo{stroke:#ff6718;stroke-width:5;opacity:.65;filter:blur(2.2px)}
  .apf-nixie .nx-digit-core{stroke:#fff3c1;stroke-width:.65;opacity:.95;filter:drop-shadow(0 0 1px #ffe9a3)}
  .apf-nixie .nx-tube[data-lit=true] .nx-digit{stroke:#ffbd68;stroke-width:1.9;filter:drop-shadow(0 0 2px #ffbc57) drop-shadow(0 0 5px #ff681b)}
  .apf-nixie .nx-tube[data-lit=true] .nx-digit-halo{animation:nx-gas-glow var(--nx-period,5s) ease-in-out var(--nx-phase,0s) infinite}
  .apf-nixie .nx-tube[data-lit=true] .nx-glass{background:radial-gradient(ellipse at 50% 58%,#ff871e38,transparent 70%),linear-gradient(90deg,#fff3c426,#0004 17%,#0006 50%,#fc9d2910 78%,#ffd3a930);box-shadow:inset 2px 0 3px #ffe2b638,inset -2px 0 4px #ffb2593d,inset 0 2px 2px #ffffff70,0 0 8px #ff7a171a}
  .apf-nixie .nx-tube[data-lit=true]::before{content:'';position:absolute;inset:18% -18% 4%;border-radius:50%;background:radial-gradient(ellipse,#ff681b1f,transparent 70%);pointer-events:none}
  .apf-nixie .nx-tube[data-lit=false] .nx-digit-halo,.apf-nixie .nx-tube[data-lit=false] .nx-digit-core{display:none}
  .apf-nixie .apf-node[data-state=unknown] .nx-digit-halo,.apf-nixie .apf-node[data-state=offline] .nx-digit-halo{display:none}
  @keyframes nx-gas-glow{0%,100%{opacity:.57}45%{opacity:.73}70%{opacity:.64}}
  .apf-nixie .nx-pv-capacity{width:90%;margin-top:5px;flex:none}
  .apf-nixie .nx-pv-track{height:5px;border-radius:4px;background:#51452e;overflow:hidden;box-shadow:inset 0 1px 2px #0008}
  .apf-nixie .nx-pv-track i{display:block;height:100%;background:linear-gradient(90deg,#bb7529,#ffc76c);border-radius:inherit}
  .apf-nixie .nx-pv-capacity small{font-size:9px;color:#bca77f;margin-top:5px}
  .apf-nixie .nx-pv-capacity[data-overload=true] .nx-pv-track i{background:#ff7350}
  .apf-nixie .nx-pv-capacity[data-known=false] .nx-pv-track{opacity:.35}
  .nx-solar-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:start;gap:12px;flex:none;padding:8px 0}.nx-summary-metric{display:grid;justify-items:center;text-align:center;gap:6px;min-width:0}.nx-summary-metric>small{font-size:10px;color:var(--pf-muted)}.apf-nixie .nx-solar-summary .nx-readout{--tube:clamp(17px,2.4cqw,30px);justify-content:flex-start}@container powerflow (max-width:600px){.nx-solar-summary{gap:8px}.nx-summary-metric>small{font-size:9px}.apf-nixie .nx-solar-summary .nx-readout{--tube:clamp(10px,3.1cqw,20px);gap:2px}.nx-solar-summary .nx-unit{font-size:8px;padding-bottom:4px}.nx-summary-metric>small{min-height:27px}.nx-solar-summary .nx-dot{width:2px}}
  .apf.apf-nixie[data-fit=true]{max-height:none;min-height:0}
  @container powerflow (min-width:850px){
    .apf-nixie[data-fit=true] .apf-body{gap:7px}
    .apf-nixie[data-fit=true] .apf-solar{flex:2;min-height:190px;gap:7px}
    .apf-nixie[data-fit=true] .apf-solar-row{flex:1;min-height:90px;gap:7px}
    .apf-nixie[data-fit=true] .apf-core{flex:2;min-height:190px;gap:12px 30px}
    .apf-nixie[data-fit=true] .apf-batteries{flex:1.4;min-height:130px;gap:7px}
    .apf-nixie[data-fit=true] .apf-node{padding:5px 7px 9px!important;gap:3px!important}
    .apf-nixie[data-fit=true] .nx-readout{--tube:clamp(15px,9cqw,28px)}
    .apf-nixie[data-fit=true] .apf-energy.nx-readout{--tube:15px}
    .apf-nixie[data-fit=true] .nx-solar-summary .nx-readout{--tube:22px}
    .apf-nixie[data-fit=true] .apf-icon svg{width:18px;height:18px}
    .apf-nixie[data-fit=true] .apf-caption{padding:2px 0}
    .apf-nixie[data-fit=true] .nx-solar-summary{padding:2px 0}
    .apf-nixie[data-fit=true] .apf-name{font-size:10px}
  }
  .apf-nixie .nx-sign{position:absolute;right:100%;color:#ffc481;font:16px Georgia;text-shadow:0 0 5px #ff791c}.apf-nixie .nx-unit{font:clamp(9px,5cqw,15px) Georgia,serif;color:#e7cfa1;align-self:flex-end;padding-bottom:10px}.apf-nixie .nx-readable{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
  .apf-nixie .apf-energy.nx-readout{--tube:clamp(15px,10cqw,27px);display:flex!important}.apf-nixie .apf-energy .nx-unit{font-size:10px}.apf-nixie .apf-node[data-state=idle] .nx-digit{opacity:.7}.apf-nixie .apf-node[data-state=unknown] .nx-digit,.apf-nixie .apf-node[data-state=offline] .nx-digit{filter:none;stroke:#9a886a}
  .apf-nixie[data-motion=false] *{animation:none!important}
  @container powerflow (max-width:900px){.apf-nixie .apf-solar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}.apf-nixie .apf-solar-row{display:contents}.apf-nixie .apf-solar .apf-node{min-height:135px}.apf-nixie .apf-batteries{grid-template-columns:repeat(3,minmax(0,1fr))}.apf-nixie .apf-batteries .apf-node{min-height:205px}}
  @container powerflow (max-width:600px){.apf-nixie .apf-solar{grid-template-columns:repeat(2,minmax(0,1fr))}.apf-nixie .apf-solar[data-odd=true] .apf-solar-row:last-child .apf-node:last-child{grid-column:1/-1}.apf-nixie .apf-batteries{grid-template-columns:repeat(2,minmax(0,1fr))}.apf-nixie .apf-batteries .apf-node:last-child:nth-child(odd){grid-column:1/-1;justify-self:center;width:calc(50% - 5px)}.apf-nixie .apf-core{gap:18px 10px;min-height:270px}.apf-nixie .apf-node{padding:12px 4px 14px!important}.apf-nixie .apf-core .apf-name,.apf-nixie .apf-core .apf-state{display:flex;font-size:8px;white-space:normal;letter-spacing:0}.apf-nixie .apf-core .apf-system-note{display:none}.apf-nixie .apf-short-name{color:#dec292;letter-spacing:1px}.apf-nixie .nx-readout{--tube:clamp(12px,14cqw,36px);gap:2px}.apf-nixie .nx-dot{width:2px;height:2px}.apf-nixie .apf-core .nx-unit{font-size:8px}.apf-nixie .apf-core .nx-tubes{gap:0}.apf-nixie .apf-energy.nx-readout{--tube:clamp(14px,10cqw,24px)}.apf-nixie .apf-caption{font-size:9px;letter-spacing:.5px}.apf-nixie .apf-state::before{width:4px;height:4px}}
  `;

  let importedStates={};
  const opacity=(v,fallback=40)=>v!=null&&Number.isFinite(Number(v))?Math.max(0,Math.min(100,Number(v))):fallback;
  const customIcon=v=>typeof v==='string'&&v.length<=12000&&/^[MmLlHhVvCcSsQqTtAaZz0-9.,+\s-]+$/.test(v)?v:'';
  const iconChoices=['default','none','solar','grid','inverter','home','battery','car','plug','custom'];
  const iconConfig=v=>({icon:iconChoices.includes(v?.icon)?v.icon:'default',iconPath:customIcon(v?.iconPath)});
  const appearance=(v={})=>({...iconConfig(v),image:image(v?.image),imageOpacity:opacity(v?.imageOpacity,25),backgroundOpacity:opacity(v?.backgroundOpacity)});
  function background(raw={}) {
    return {image:image(raw?.image),opacity:raw?.opacity!=null&&Number.isFinite(Number(raw.opacity))?Math.max(0,Math.min(100,Number(raw.opacity))):25,fit:['cover','contain'].includes(raw?.fit)?raw.fit:'cover',position:['center','top','bottom','left','right','left top','right top','left bottom','right bottom'].includes(raw?.position)?raw.position:'center'};
  }
  function normalize(raw={}) {
    raw=raw&&typeof raw==='object'?raw:{};
    const cloud=Cloud.normalize(raw.cloud);
    const unit=(v,i,prefix)=>({...iconConfig(v),chargeSource:['solar','grid','mixed','sensor'].includes(v?.chargeSource)?v.chargeSource:'sensor',chargeSourceEntity:text(v?.chargeSourceEntity),backgroundOpacity:opacity(v?.backgroundOpacity),capacityKw:rating(v?.capacityKw),name:text(v?.name)||`${prefix} ${i+1}`,image:image(v?.image),imageOpacity:v?.imageOpacity!=null&&Number.isFinite(Number(v.imageOpacity))?Math.max(0,Math.min(100,Number(v.imageOpacity))):25,power:powerValue(v?.power),soc:text(v?.soc),voltage:text(v?.voltage),temperature:text(v?.temperature),mppts:Array.isArray(v?.mppts)?v.mppts.slice(0,2).map(x=>({name:text(x?.name),power:powerValue(x?.power)})):[]});
    return {backdrop:['default','plaster','wood','cabinet','custom'].includes(raw.backdrop)?raw.backdrop:(raw.background?.image?'custom':'default'),panelOpacity:opacity(raw.panelOpacity,80),evName:text(raw.evName),cloud,station:Station.normalize(raw.station),nodeAppearance:Object.fromEntries(['grid','load','nonBackup','ev','solar','battery'].map(k=>[k,appearance(raw.nodeAppearance?.[k])])),background:raw.background&&typeof raw.background==='object'?background(raw.background):null,gridCapacityKw:rating(raw.gridCapacityKw),fit:raw.fit!==false,gridStatus:text(raw.gridStatus),gridOn:text(raw.gridOn)||'on,connected,online,1',gridOff:text(raw.gridOff)||'off,disconnected,offline,0',inverterStatus:text(raw.inverterStatus),inverterOn:text(raw.inverterOn)||'on,running,normal,online',inverterOff:text(raw.inverterOff)||'off,standby,offline',inverterFault:text(raw.inverterFault)||'error,fault,alarm',nonBackup:powerValue(raw.nonBackup),backupName:text(raw.backupName)||'EPS / Backup',nonBackupName:text(raw.nonBackupName)||'Grid / Non-backup',mode:['auto','day','night'].includes(raw.mode)?raw.mode:'auto',profile:['auto','desktop','tablet','mobile'].includes(raw.profile)?raw.profile:'auto',hideDetails:raw.hideDetails!==false,showEv:raw.showEv!==false,showNonBackup:raw.showNonBackup!==false,invertGrid:raw.invertGrid===true,invertBattery:raw.invertBattery===true,inverter:unit(raw.inverter,0,'Inverter'),batteries:(Array.isArray(raw.batteries)?raw.batteries:[{},{}]).slice(0,5).map((v,i)=>unit(v,i,'Battery')),strings:(Array.isArray(raw.strings)?raw.strings:Array.from({length:10},()=>({}))).slice(0,10).map((v,i)=>unit(v,i,'PV')),grid:powerValue(raw.grid),load:powerValue(raw.load),ev:powerValue(raw.ev)};
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
  .apf-config{position:absolute;z-index:10;inset:8px;overflow:auto;padding:16px;background:var(--pf-bg);border:1px solid #526677;border-radius:12px}.apf-config:not([open]){display:none}.apf-config summary{cursor:pointer;color:#f1873d;position:sticky;top:0;background:var(--pf-bg);padding:8px;z-index:1}.apf-settings{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:12px;margin-top:12px}.apf-settings small{line-height:1.5;color:var(--pf-muted)}.apf-settings label.apf-check{flex-direction:row;align-items:center;gap:8px}.apf-settings .apf-check input{width:18px;height:18px;accent-color:#f1873d;flex:none}.apf-tools button{min-height:36px;border:1px solid #304655;border-radius:8px;padding:8px;background:var(--pf-panel);color:var(--pf-ink)}.apf-settings label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:var(--pf-muted)}.apf-settings input,.apf-settings select{width:100%;min-width:0;background:var(--pf-panel);color:var(--pf-ink);padding:8px;border:1px solid #526677;border-radius:7px}.apf-settings input[type=checkbox]{width:auto;align-self:start}.apf-settings{align-items:start}.apf-settings fieldset{min-width:0;border:1px solid #b8753e;border-radius:10px;display:grid;align-content:start;gap:10px;padding:12px;background:color-mix(in srgb,var(--pf-panel,#15232f) 94%,white)}.apf-settings fieldset legend{color:#f1873d;font-weight:700;padding:0 5px}.apf-settings fieldset:focus-within{border-color:#ff9b4b;box-shadow:0 0 0 1px #f1873d55}.apf-settings fieldset fieldset{background:transparent;border-color:#815638}.apf-capacity{border-left:3px solid #f1873d;padding:9px;background:#f1873d12;border-radius:6px}.apf-capacity small{line-height:1.5;color:var(--pf-muted)}.apf-settings button{background:#f1873d;color:#101b25;border:0;border-radius:7px;padding:8px}
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
    const card=n('section','apf apf-nixie db-widget-box');card.style.setProperty('--nx-panel-alpha',String(c.panelOpacity/100));card.dataset.backdrop=c.backdrop;card.dataset.motion=String(layout.motion!==false);card.dataset.mode=c.mode==='auto'?(String(layout.theme?.mode).startsWith('light')||layout.theme?.mode==='nordic'?'day':'night'):c.mode;card.dataset.autoTheme=String(c.mode==='auto');card.dataset.profile=c.profile;card.setAttribute('aria-label','ANMA Power Flow');
    card.append(n('style','',css+nixieCss));const sceneBackground=background(c.background||layout.background);if(c.backdrop==='custom'&&sceneBackground.image){const bg=n('img','apf-bg');bg.src=sceneBackground.image;bg.alt='';bg.style.cssText='position:absolute;inset:0;width:100%;height:100%;max-width:none;max-height:none;z-index:-1;pointer-events:none';bg.style.opacity=sceneBackground.opacity/100;bg.style.objectFit=sceneBackground.fit;bg.style.objectPosition=sceneBackground.position;card.append(bg);}
    const head=n('header','apf-head'),brand=n('div');brand.append(n('span','apf-kicker','ANMA ELECTRIC / ENERGY SYSTEM'),n('h2','','Power Flow · Nixie'));head.append(brand,n('span','apf-badge',demo?tr('DEMO · PREVIEW','ДЕМО · ПЕРЕГЛЯД'):tr('HOME ASSISTANT','HOME ASSISTANT')));card.append(head);
    const manualValues=[c.grid,c.load,c.ev,c.nonBackup,c.inverter.power,...c.batteries.map(b=>b.power),...c.strings.map(s=>s.power)].some(isManual);
    if(manualValues){head.querySelector('.apf-badge').textContent=tr('MANUAL VALUES INCLUDED','Є РУЧНІ ЗНАЧЕННЯ');head.querySelector('h2').title=tr('Some power values are manually configured, not live telemetry.','Частину потужностей задано вручну — це не живі показники сенсорів.');}
    if(['plaster','wood','cabinet'].includes(c.backdrop)){const texture=n('div','nx-backdrop');texture.setAttribute('aria-hidden','true');const atlas=nixieAtlas.startsWith('__')?'/static/dashboards/assets/nixie-backgrounds.png':nixieAtlas;texture.style.backgroundImage='url('+JSON.stringify(atlas)+')';texture.style.backgroundPosition=({plaster:'0%',wood:'50%',cabinet:'100%'})[c.backdrop]+' center';card.append(texture);}
    const read=(id,fallback,kind='power')=>{if((kind==='power'||kind==='energy')&&isManual(id))return Number(id);if(demo)return fallback;const s=hass?.states?.[id];if(!s||['','unknown','unavailable'].includes(s.state)||!Number.isFinite(Number(s.state)))return null;let v=Number(s.state);if(kind==='power'){const u=s.attributes?.unit_of_measurement;if(u==='kW')v*=1000;else if(u==='MW')v*=1000000;else if(u!=='W')return null;}if(kind==='energy'){const u=s.attributes?.unit_of_measurement;if(u==='Wh')v/=1000;else if(u==='MWh')v*=1000;else if(u!=='kWh')return null;if(v<0)return null;}return v;};
    const fmt=v=>v===null?'—':Math.abs(v)>=1000?(v/1000).toLocaleString(uk?'uk':'en',{maximumFractionDigits:3})+' kW':Math.round(v)+' W';
    const node=(name,icon,color,value,img,imageOpacity=25)=>{const e=n('div','apf-node');e.style.setProperty('--node',color);if(img){const pic=n('div','apf-node-photo');pic.style.backgroundImage='url('+JSON.stringify(img)+')';pic.style.opacity=imageOpacity/100;pic.setAttribute('aria-hidden','true');e.append(pic);} {const holder=n('span','apf-icon');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 32 32');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.7');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',({'☀':'M16 1v4m0 22v4M1 16h4m22 0h4M5 5l3 3m16 16 3 3M5 27l3-3M24 8l3-3M23 16a7 7 0 1 1-14 0 7 7 0 0 1 14 0','♜':'M12 3h8l6 26H6L12 3Zm-4 9h16M5 19h22M12 12l10 14m-2-14L10 26M9 6h14','ϟ':'M8 3h16v26H8V3Zm4 5h8v5h-8V8Zm6 9-5 5h6l-5 5','⌂':'M3 15 16 4l13 11M7 12v16h7v-9h5v9h6V12','▤':'M12 3h8v3H12V3ZM7 6h18v23H7V6Zm4 5h10m-10 5h10m-10 5h10','🚘':'M5 15 9 6h14l4 9v11h-4v-4H9v4H5V15Zm0 0h22M8 18h4m8 0h4'})[icon]||'M16 3v26M3 16h26');svg.append(path);holder.append(svg);e.append(holder);}e.append(n('span','apf-name',name),n('b','',value));e.setAttribute('aria-label',name+' · '+value);e.title=name+' · '+value;return e;};
    function pvCapacity(element,power,capacityKw){
      const capacity=rating(capacityKw),ratio=power===null||power<0?null:utilization(power,capacity);
      const box=n('div','nx-pv-capacity'),bar=n('div','nx-pv-track'),fill=n('i'),label=n('small');
      box.dataset.known=String(ratio!==null);box.dataset.overload=String(ratio!==null&&ratio>1);
      bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',tr('PV nominal power utilization','Використання номінальної потужності PV'));bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');
      if(ratio!==null)bar.setAttribute('aria-valuenow',String(Math.min(100,Math.round(ratio*100))));
      const description=!capacity?tr('Set rated kW','Задайте номінал, кВт'):ratio===null?tr('No power data','Немає даних потужності'):Math.round(ratio*100)+'% · '+fmt(power)+' / '+capacity+' kW';
      label.textContent=description;bar.setAttribute('aria-valuetext',description);box.title=description;
      fill.style.width=(ratio===null?0:Math.min(100,ratio*100))+'%';bar.append(fill);box.append(bar,label);element.append(box);
    }
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
    const solar=n('div','apf-solar');solar.dataset.dense=String(c.strings.length>5);solar.dataset.odd=String(c.strings.length%2===1);solar.style.setProperty('--cols',Math.max(1,Math.min(5,c.strings.length)));solar.style.setProperty('--total',Math.max(1,c.strings.length));const counts=solarRows(c.strings.length),topCount=counts[0]||0,rows=[];for(const count of counts){if(!count)continue;const row=n('div','apf-solar-row');row.style.setProperty('--row-cols',count);solar.append(row);rows.push(row);}let total=0,known=true;
    c.strings.forEach((s,i)=>{
      const readings=[read(s.power,1800+i*200)];
      const p=readings.every(v=>v!==null)?readings.reduce((a,b)=>a+b,0):null;if(p===null)known=false;else total+=p;
      const e=node(s.name,'☀','#f6ae49',fmt(p));e.querySelector('b').before(n('span','apf-short-name','PV '+(i+1)));e.dataset.state=p===null?'unknown':p>0?'online':'idle';e.title=s.name+' · '+(p===null?tr('No data','Немає даних'):p>0?tr('Generating','Генерує'):tr('No generation','Без генерації'));
      stream(e,p,false,s.capacityKw);pvCapacity(e,p,s.capacityKw);rows[i<topCount?0:1].append(e);
    });
    if(c.strings.length){
      const summary=n('div','nx-solar-summary');
      const metrics=[[tr('GENERATION NOW','ГЕНЕРАЦІЯ ЗАРАЗ'),known?total:null,'power'],[tr('GENERATED TODAY','ЗГЕНЕРОВАНО СЬОГОДНІ'),read(c.cloud.solarToday,null,'energy'),'energy'],[tr('FORECAST TODAY','ПРОГНОЗ НА СЬОГОДНІ'),read(c.cloud.solarForecast,null,'energy'),'energy']];
      metrics.forEach(([label,value,kind],index)=>{const metric=n('div','nx-summary-metric');metric.append(n('small','',label));const display=n('b','',(value===null?'—':kind==='power'?fmt(value):value+' kWh'));nixieReadout(display,value,kind);metric.append(display);summary.append(metric);});
      body.append(summary,solar);
    }
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
    const wire=(id,d,p,reverse,color,enabled=true,capacityKw=null)=>{const line=document.createElementNS(svg.namespaceURI,'path');line.classList.add('apf-wire');line.dataset.branch=id;line.setAttribute('d',d);line.style.setProperty('--wire',!enabled||p===0?'#81909c':color);line.dataset.active=String(enabled&&p!==null&&p!==0&&layout.motion!==false);line.dataset.reverse=String(reverse);line.style.setProperty('--flow-duration',flowDuration(p,capacityKw)+'s');line.setAttribute('pathLength','100');
      const powered=enabled&&p!==null&&p!==0;
      const track=line.cloneNode(false);track.setAttribute('class','apf-wire-track');track.dataset.powered=String(powered);track.removeAttribute('style');
      const arrow=document.createElementNS(svg.namespaceURI,'path');arrow.setAttribute('class','apf-wire-arrow');arrow.dataset.branch=id;arrow.dataset.powered=String(powered);arrow.dataset.reverse=String(reverse);
      svg.append(track,line,arrow);};
    wire('solar-inverter','M150 -8V52',known?total:null,false,'#f6ae49',true,c.strings.every(s=>s.capacityKw)?c.strings.reduce((sum,s)=>sum+s.capacityKw,0):null);
    wire('grid-inverter','M50 52H150',grid,grid<0,'#83b4ff',gridState!=='offline',c.gridCapacityKw);
    wire('inverter-backup','M150 52H250',load,load<0,'#58c7db',true,c.inverter.capacityKw);
    if(c.showNonBackup)wire('grid-nonbackup','M50 52V158',nonBackup,nonBackup<0,'#83b4ff',gridState!=='offline',c.gridCapacityKw);
    if(c.showEv){wire('backup-ev','M250 52V158',ev,ev<0,'#58c7db',true,c.inverter.capacityKw);const car=node(c.evName||tr('EV charger','Зарядка авто'),'🚘','#58c7db',fmt(ev));car.classList.add('apf-ev');core.append(car);}
    core.append(svg,gridNode,inv,backed,...(c.showNonBackup?[non]:[]),n('div','apf-system-note',gridState==='offline'?tr('Backup circuit · inverter / battery','Резервна група · інвертор / АКБ'):tr('ANMA ENERGY SYSTEM','ЕНЕРГОСИСТЕМА ANMA')));body.append(core);
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
        svg.querySelectorAll('.apf-wire,.apf-wire-track').forEach(path=>{if(routes[path.dataset.branch])path.setAttribute('d',routes[path.dataset.branch]);});
        svg.querySelectorAll('.apf-wire-arrow').forEach(arrow=>{
          const line=svg.querySelector('.apf-wire[data-branch="'+arrow.dataset.branch+'"]');if(!line)return;
          const length=line.getTotalLength();if(length<2){arrow.setAttribute('d','');return;}
          const center=line.getPointAtLength(length*.5),before=line.getPointAtLength(Math.max(0,length*.5-.5)),after=line.getPointAtLength(Math.min(length,length*.5+.5));
          const direction=arrow.dataset.reverse==='true'?-1:1,dx=(after.x-before.x)*bounds.width/300,dy=(after.y-before.y)*bounds.height/200,mag=Math.hypot(dx,dy)||1;
          const ux=dx/mag*direction,uy=dy/mag*direction,sx=300/bounds.width,sy=200/bounds.height;
          arrow.setAttribute('d',`M${center.x+(-ux*3-uy*3)*sx} ${center.y+(-uy*3+ux*3)*sy}L${center.x+ux*3*sx} ${center.y+uy*3*sy}L${center.x+(-ux*3+uy*3)*sx} ${center.y+(-uy*3-ux*3)*sy}`);
        });
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
    const symbols={solar:'☀',grid:'♜',inverter:'ϟ',home:'⌂',battery:'▤',car:'🚘',plug:'+'};
    function applyIcon(element,config){if(!element||!config||config.icon==='default')return;const holder=element.querySelector('.apf-icon');if(!holder)return;if(config.icon==='none'){holder.remove();return;}if(config.icon==='custom'){const d=customIcon(config.iconPath);if(!d)return;const svg=holder.querySelector('svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','currentColor');svg.setAttribute('stroke','none');svg.querySelector('path').setAttribute('d',d);}else{holder.replaceChildren(node('',symbols[config.icon],'','').querySelector('.apf-icon svg'));}}
    for(const [selector,key] of [['.apf-grid','grid'],['.apf-backup','load'],['.apf-nonbackup','nonBackup'],['.apf-ev','ev']])applyIcon(body.querySelector(selector),c.nodeAppearance[key]);
    applyIcon(body.querySelector('.apf-inverter'),c.inverter);
    body.querySelectorAll('.apf-solar .apf-node').forEach((e,i)=>applyIcon(e,c.strings[i]));
    body.querySelectorAll('.apf-batteries .apf-node').forEach((e,i)=>applyIcon(e,c.batteries[i]));
    // Presentation only: preserve original values for assistive technology and existing state logic.
    body.querySelectorAll('.apf-node > b,.apf-energy').forEach(element=>{
      const raw=element.textContent,match=raw.match(/^([+-]?[\d.,\s]+)\s*(kW|W|%)$/);
      const kind=element.tagName==='B'&&element.closest('.apf-batteries')?'soc':'power';
      const value=match?Number(match[1].replace(/\s/g,'').replace(',','.'))*(match[2]==='kW'?1000:1):null;
      nixieReadout(element,value,kind);
    });
    return card;
  }
  // Keep live nodes (and their animation timelines) across HA state updates.
  function update(host,layout,options={}){
    if(layout.template==='energy_station')return Station.update(host,layout,options);
    if(layout.template==='cloud_flow')return Cloud.update(host,layout,{...options,normalizePower:normalize});
    const next=render(layout,options),current=host.firstElementChild;
    if(!current||current.className!==next.className||current.dataset.backdrop!==next.dataset.backdrop||!!current.querySelector('.apf-nonbackup')!==!!next.querySelector('.apf-nonbackup')||!!current.querySelector('.apf-ev')!==!!next.querySelector('.apf-ev')||current.querySelectorAll('.apf-solar .apf-node').length!==next.querySelectorAll('.apf-solar .apf-node').length||current.querySelectorAll('.apf-batteries .apf-node').length!==next.querySelectorAll('.apf-batteries .apf-node').length){if(current?.querySelector('.apf-config')?.open){const settings=next.querySelector('.apf-config');if(settings)settings.open=true;}host.replaceChildren(next);return next;}
    function sync(target,source){
      if(target.nodeType!==source.nodeType||target.nodeName!==source.nodeName){target.replaceWith(source);return;}
      if(target.nodeType===3){if(target.data!==source.data)target.data=source.data;return;}
      if(target.nodeType!==1)return;
      if(target.classList?.contains('nx-digit')&&target.getAttribute('d')!==source.getAttribute('d')&&layout.motion!==false&&!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches)target.animate?.([{opacity:.3},{opacity:1}],{duration:260,easing:'ease-out'});
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
  function editor(raw,uk,onchange,{getStates=()=>null,legacyBackground=null,template=null,demoPreview=false,showEntityImport=true,systemName=''}={}){
    if(template==='energy_station')return Station.editor(raw?.station,uk,(station,redraw)=>onchange({...normalize(raw),station},redraw),{getStates});
    const c=normalize(raw),n=(tag,txt)=>{const e=document.createElement(tag);if(txt)e.textContent=txt;return e;},tr=(en,ua)=>uk?ua:en;
    const box=n('details'),summary=n('summary',tr('Configure Power Flow','Налаштувати Power Flow')),form=n('div');form.className='apf-settings';box.className='apf-config';box.append(summary,form);const commit=(redraw=true)=>{const host=box.getRootNode();onchange(c,redraw);host.querySelectorAll('.apf-config').forEach(e=>e.open=true);};box.addEventListener('click',e=>e.stopPropagation());
    function suggest(input,kind){
      const menu=n('div');menu.className='apf-entity-menu';menu.setAttribute('role','group');menu.setAttribute('aria-label',tr('Matching entities','Знайдені сутності'));menu.hidden=true;input.after(menu);input.autocomplete='off';
      const search=()=>{const live=getStates(),states=live||importedStates;menu.replaceChildren();menu.hidden=false;
        const query=input.value.trim().toLowerCase();let results=Object.entries(states).filter(([id,v])=>v&&typeof v==='object'&&id.startsWith('sensor.')||v&&typeof v==='object'&&id.startsWith('binary_sensor.'));
        results=results.filter(([id,v])=>{const unit=v.attributes?.unit_of_measurement||'';if(kind==='power'&&!['W','kW','MW'].includes(unit)&&v.attributes?.device_class!=='power')return false;if(kind==='energy'&&!['Wh','kWh','MWh'].includes(unit))return false;if(kind==='soc'&&unit!=='%')return false;if(kind==='voltage'&&!['V','mV'].includes(unit))return false;if(kind==='temperature'&&!['°C','°F','K'].includes(unit))return false;return (id+' '+(v.attributes?.friendly_name||'')).toLowerCase().includes(query);}).slice(0,30);
        menu.append(n('small',live?tr('Live Home Assistant values','Живі значення Home Assistant'):tr('Imported snapshot · not live','Імпортований знімок · не живі дані')));
        if(!results.length)menu.append(n('small',Object.keys(states).length?tr('No matching entities. You can enter an ID manually.','Збігів немає. Можна ввести сутність вручну.'):tr('Open in HA or import entity JSON below.','Відкрийте в HA або імпортуйте JSON сутностей нижче.')));
        for(const [id,v] of results){const button=n('button',id+' · '+(v.attributes?.friendly_name||'')+' · '+v.state+' '+(v.attributes?.unit_of_measurement||''));button.type='button';button.onmousedown=e=>e.preventDefault();button.onclick=()=>{input.value=id;menu.hidden=true;input.dispatchEvent(new Event('change',{bubbles:true}));};menu.append(button);}
      };input.addEventListener('focus',search);input.addEventListener('input',search);input.addEventListener('keydown',e=>{if(e.key==='Escape')menu.hidden=true;if(e.key==='ArrowDown'){e.preventDefault();menu.querySelector('button')?.focus();}});input.addEventListener('blur',()=>setTimeout(()=>{if(!menu.contains(menu.getRootNode().activeElement))menu.hidden=true;},150));
    }
    const importLabel=n('label',tr('Entity list JSON (snapshot for website search)','JSON списку сутностей (знімок для пошуку на сайті)')),uploadStates=n('input');uploadStates.type='file';uploadStates.accept='.json,application/json';uploadStates.onchange=async()=>{try{const file=uploadStates.files[0];if(!file)return;if(file.size>2000000)throw Error();const data=JSON.parse(await file.text());const entries=Array.isArray(data)?data.map(v=>[v.entity_id,v]):Object.entries(data.states||data);importedStates=Object.fromEntries(entries.filter(([id,v])=>typeof id==='string'&&/^(sensor|binary_sensor)\.[\w]+$/.test(id)&&v&&typeof v==='object').slice(0,10000));uploadStates.setCustomValidity('');}catch(_){uploadStates.setCustomValidity(tr('Choose a valid entity JSON under 2 MB','Оберіть JSON сутностей до 2 МБ'));uploadStates.reportValidity();}};importLabel.append(uploadStates);form.append(importLabel);
    function field(parent,title,obj,key,options){const label=n('label',title),input=n(options?'select':'input');input.setAttribute('aria-label',title);if(options)options.forEach(([v,t])=>{const o=n('option',t);o.value=v;input.append(o);});input.value=obj[key]||'';input.onchange=()=>{obj[key]=input.value;commit();};if(!options)input.oninput=()=>{obj[key]=input.value;commit(false);};label.append(input);parent.append(label);if(!options&&['soc','voltage','temperature','gridStatus','inverterStatus','chargeSourceEntity'].includes(key))suggest(input,key);}
    function capacity(parent,title,obj,key='capacityKw',pv=false){
      const label=n('label',title),input=n('input');label.className='apf-capacity';label.append(n('strong',pv?tr('100% PV CAPACITY','100% ПОТУЖНОСТІ PV'):tr('100% BORDER','100% РАМКИ')));input.type='number';input.min='0.001';input.max='1000000';input.step='any';input.placeholder=tr('Not set','Не задано');input.value=obj[key]??'';input.setAttribute('aria-label',title);
      input.oninput=()=>{if(input.checkValidity()){obj[key]=rating(input.value);commit(false);}};input.onchange=()=>{if(!input.checkValidity()){input.reportValidity();return;}obj[key]=rating(input.value);commit();};label.append(input,n('small',pv?tr('Enter the total rated panel capacity of this string manually in kW. A 10 kW rating and 5 kW generation fill 50% of the bar. This is not energy in kWh or current generation.','Вкажіть сумарну номінальну потужність панелей цього стрінга вручну, у кВт. Наприклад: 10 кВт номіналу та 5 кВт генерації = 50% смужки. Це не ємність у кВт·год і не поточна генерація.'):tr('Maximum 9 kW + current 4500 W = 50% border. This is not current power.','Максимум 9 кВт + поточні 4500 Вт = 50% рамки. Це не поточна потужність.')));parent.append(label);
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
      const captions=section('Names and captions','Назви й підписи');
      if(c.cloud.subtitle===null)c.cloud.subtitle=systemName;
      field(captions,tr('System caption beside Cloud Flow','Підпис системи поруч із Cloud Flow'),c.cloud,'subtitle');
      captions.append(n('small',tr('Cloud Flow stays fixed. Leave the caption empty to hide it.','Cloud Flow залишається незмінним. Порожній підпис не відображається.')));
      for(const [key,en,ua] of [['solar','Solar','Сонце'],['grid','Grid','Мережа'],['inverter','Inverter','Інвертор'],['home','House','Будинок'],['battery','Battery','Батарея'],['nonBackup','Non-backup','Негарантоване'],['ev','EV','Авто']]){toggle(captions,'Show name: '+en,'Показувати назву: '+ua,c.cloud.labels[key],'show');field(captions,tr(en+' name',ua+' · назва'),c.cloud.labels[key],'name');}
      const solar=section('Solar · total','Сонце · разом');
      powerInput(solar,tr('Total solar power','Загальна потужність сонця'),c.cloud,'solarPower');
      field(solar,tr('Solar energy today (kWh or entity)','Генерація сьогодні (кВт·год або сутність)'),c.cloud,'solarToday');
      field(solar,tr('Solar forecast today (kWh or entity)','Прогноз генерації на сьогодні (кВт·год або сутність)'),c.cloud,'solarForecast');
      solar.append(n('small',tr('Today: actual / forecast, in kWh. Choose the total generation forecast for today, not the remaining forecast.','Сьогодні: факт / прогноз, у кВт·год. Оберіть прогноз загальної генерації за сьогодні, а не залишок прогнозу.')));
      solar.append(n('small',tr('One solar object. An empty total preserves the sum of previously connected PV sensors. A total sensor overrides that sum without double counting.','Один об’єкт сонця. Порожнє поле потужності зберігає суму раніше підключених PV-сенсорів. Загальний сенсор замінює цю суму без подвійного підрахунку.')));
      const battery=section('Battery · total','Батарея · разом');
      powerInput(battery,tr('Total battery power','Загальна потужність батареї'),c.cloud,'batteryPower');
      field(battery,tr('Total battery SOC entity or %','Загальний SOC батареї · сутність або %'),c.cloud,'batterySoc');suggest(battery.querySelector('label:last-child input'),'soc');
      toggle(battery,'Reverse battery sign (default: positive discharge)','Інвертувати знак батареї (типово: плюс = розряд)',c,'invertBattery');
      field(battery,tr('Capacity source','Джерело ємності'),c.cloud,'capacitySource',[['manual',tr('Manual · kWh','Вручну · кВт·год')],['sensor',tr('Home Assistant entity','Сутність Home Assistant')]]);
      if(c.cloud.capacitySource==='sensor'){
        field(battery,tr('Total capacity entity','Сутність повної ємності'),c.cloud,'capacityEntity');
        const input=battery.querySelector('label:last-child input');suggest(input,'energy');
        battery.append(n('small',tr('Use total battery capacity in Wh, kWh or MWh, not remaining energy or Ah. Unavailable sensors produce no runtime estimate.','Повна ємність батареї у Wh, kWh або MWh, не залишок енергії й не Ah. Якщо сенсор недоступний, оцінка часу не розраховується.')));
      }
      for(const [key,title,max] of [['batteryCapacityKwh',tr('Battery capacity (kWh)','Ємність батареї (кВт·год)'),1000000],['reserveSoc',tr('Reserve SOC (%)','Резервний SOC (%)'),100]]){if(key==='batteryCapacityKwh'&&c.cloud.capacitySource==='sensor')continue;const label=n('label',title),input=n('input');input.type='number';input.min='0';input.max=String(max);input.step='any';input.value=c.cloud[key];input.setAttribute('aria-label',title);input.onchange=()=>{if(!input.checkValidity())return input.reportValidity();c.cloud[key]=Number(input.value);commit();};label.append(input);battery.append(label);}
      battery.append(n('small',tr('Runtime estimate uses energy above reserve and current home load, without solar or grid contribution. Inverter losses are not included. Enter battery capacity in kWh, not kW.','Оцінка часу використовує енергію вище резерву та поточне навантаження будинку, без допомоги сонця й мережі. Втрати інвертора не враховано. Ємність вказуйте у кВт·год, не кВт.')));
      const illustrations=section('Equipment icons','Піктограми обладнання');illustrations.append(n('small',tr('Upload PNG or WebP with a transparent background, up to 2 MB. House artwork also represents the inverter.','Завантажте PNG або WebP із прозорим фоном, до 2 МБ. Будинок також представляє інвертор.')));
      for(const [key,title] of [['solar',tr('Solar','Сонце')],['grid',tr('Grid','Мережа')],['house',tr('House / inverter','Будинок / інвертор')],['battery',tr('Battery','Батарея')],['nonBackup',tr('Non-backup','Негарантована група')],['ev',tr('Vehicle','Авто')]]){const label=n('label',title),upload=n('input');upload.type='file';upload.accept='image/png,image/webp';upload.setAttribute('aria-label',title+' · PNG / WebP');upload.onchange=async()=>{try{const f=upload.files[0];if(!f)return;if(f.size>2000000||!['image/png','image/webp'].includes(f.type))throw Error();const url=URL.createObjectURL(f);try{const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url;});const canvas=document.createElement('canvas'),scale=Math.min(1,512/Math.max(img.width,img.height));canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let clear=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]<32)clear++;if(clear<pixels.length/4*.01)throw Error();const data=canvas.toDataURL('image/webp',.9);if(data.length>900000)throw Error();c.cloud.icons[key]=data;upload.setCustomValidity('');commit();}finally{URL.revokeObjectURL(url);}}catch(_){upload.setCustomValidity(tr('Use a PNG/WebP under 2 MB with a transparent background.','Оберіть PNG/WebP до 2 МБ із прозорим фоном.'));upload.reportValidity();}};const reset=n('button',tr('Restore default','Стандартна піктограма'));reset.type='button';reset.onclick=()=>{c.cloud.icons[key]='';commit();};label.append(upload,reset);illustrations.append(label);}
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
      const view=section('Appearance','Вигляд');toggle(view,'Automatically fit the whole scene to the screen','Автоматично вписувати всю сцену в екран',c,'fit');field(view,tr('Display','Екран'),c,'profile',[['auto','Auto'],['desktop','Desktop'],['tablet','Tablet'],['mobile','Phone']]);
      view.append(n('small',tr('Equipment illustrations are fixed. Node photos, border ratings and MPPT layout controls belong to other views and are not used here.','Зображення обладнання фіксовані. Фото вузлів, номінали рамок і розмітка MPPT належать іншим дашбордам і тут не використовуються.')));
      appendBackground(form,true);
      return box;
    }
    if(!showEntityImport||Object.keys(getStates()||{}).length)importLabel.remove();
    const section=(title,description)=>{const g=n('fieldset');g.append(n('legend',title),n('small',description));form.append(g);return g;};
    const view=section(tr('Appearance and visible groups','Вигляд і видимі групи'),tr('Hide optional groups and their flows without deleting sensor connections.','Приховуйте необов’язкові групи разом із потоками, зберігаючи прив’язки сенсорів.'));
    const backdropGroup=section(tr('Background and panel transparency','Фон і прозорість блоків'),tr('Only the panel backgrounds fade. Lamps, labels and icons stay opaque.','Змінюється лише тло блоків. Лампи, підписи та піктограми залишаються непрозорими.'));
    field(backdropGroup,tr('Background style','Варіант фону'),c,'backdrop',[['default',tr('Standard dark','Стандартний темний')],['plaster',tr('Old wall','Стара стіна')],['wood',tr('Wooden case','Дерев’яний корпус')],['cabinet',tr('Electrical cabinet','Електрощит')],['custom',tr('My photo','Власне фото')]]);
    const panelLabel=n('label',tr('Panel background transparency','Прозорість тла блоків')),panelSlider=n('input'),panelOutput=n('output');panelSlider.type='range';panelSlider.min='0';panelSlider.max='100';panelSlider.step='1';panelSlider.value=String(100-c.panelOpacity);panelSlider.setAttribute('aria-label',tr('Panel background transparency','Прозорість тла блоків'));panelOutput.textContent=panelSlider.value+'%';panelSlider.oninput=()=>{c.panelOpacity=100-Number(panelSlider.value);panelOutput.textContent=panelSlider.value+'%';box.closest('.apf')?.style.setProperty('--nx-panel-alpha',String(c.panelOpacity/100));};panelSlider.onchange=()=>commit(false);panelLabel.append(panelOutput,panelSlider);backdropGroup.append(panelLabel,n('small',tr('0%: solid backgrounds. 100%: no panel fill.','0% — суцільне тло. 100% — тло блоків невидиме.')));
    if(c.backdrop==='custom')appendBackground(form);
    function appendBackground(parent,cloudScene=false){
    async function prepareScenePhoto(file){
      const url=URL.createObjectURL(file);
      try{
        const photo=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=url;});
        const canvas=document.createElement('canvas'),ratio=Math.min(1,1600/Math.max(photo.naturalWidth,photo.naturalHeight));canvas.width=Math.max(1,Math.round(photo.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(photo.naturalHeight*ratio));
        canvas.getContext('2d').drawImage(photo,0,0,canvas.width,canvas.height);
        for(const quality of [.82,.65,.45]){const data=canvas.toDataURL('image/webp',quality);if(data.length<700000)return data;}
        const small=document.createElement('canvas');small.width=Math.max(1,Math.round(canvas.width/2));small.height=Math.max(1,Math.round(canvas.height/2));small.getContext('2d').drawImage(canvas,0,0,small.width,small.height);const data=small.toDataURL('image/webp',.6);if(data.length>=700000)throw Error('Image too large');return data;
      }finally{URL.revokeObjectURL(url);}
    }
    const photoGroup=n('fieldset');photoGroup.append(n('legend',cloudScene?tr('Scene background','Фон сцени'):tr('Card background','Фон картки')));parent.append(photoGroup);
    const scene=background(c.background||legacyBackground),saveBackground=()=>{c.background={...scene};commit(false);};
    const photoUrlLabel=n('label',tr('Background image URL','URL фонового фото')),photoUrl=n('input');photoUrl.type='text';photoUrl.value=scene.image;photoUrl.placeholder='/local/background.jpg';photoUrl.setAttribute('aria-label',tr('Background image URL','URL фонового фото'));photoUrl.onchange=()=>{scene.image=image(photoUrl.value);saveBackground();};photoUrlLabel.append(photoUrl);photoGroup.append(photoUrlLabel);
    const uploadBackground=n('input');uploadBackground.type='file';uploadBackground.accept='image/png,image/jpeg,image/webp';uploadBackground.setAttribute('aria-label',tr('Upload card background','Завантажити фон картки'));
    uploadBackground.onchange=async()=>{const file=uploadBackground.files[0];if(!file)return;try{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10000000)throw Error();const prepared=cloudScene?await prepareScenePhoto(file):root.AnmaDashboard?.prepareBackground?await root.AnmaDashboard.prepareBackground(file):await new Promise((resolve,reject)=>{if(file.size>500000)return reject(Error());const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});scene.image=image(prepared);photoUrl.value=scene.image;saveBackground();uploadBackground.setCustomValidity('');}catch(_){uploadBackground.setCustomValidity(tr('Choose a PNG/JPEG/WebP image up to 10 MB','Оберіть PNG/JPEG/WebP до 10 МБ'));uploadBackground.reportValidity();}};photoGroup.append(uploadBackground);
    for(const [key,title,options] of [['fit',tr('Photo fit','Заповнення фото'),[['cover',tr('Fill and crop','Заповнити з обрізанням')],['contain',tr('Show entire photo','Показати фото повністю')]]],['position',tr('Photo position','Позиція фото'),[['center',tr('Center','Центр')],['top',tr('Top','Вгорі')],['bottom',tr('Bottom','Внизу')],['left',tr('Left','Ліворуч')],['right',tr('Right','Праворуч')],['left top',tr('Top left','Вгорі ліворуч')],['right top',tr('Top right','Вгорі праворуч')],['left bottom',tr('Bottom left','Внизу ліворуч')],['right bottom',tr('Bottom right','Внизу праворуч')]]]]){const label=n('label',title),select=n('select');select.setAttribute('aria-label',title);for(const [value,caption] of options){const option=n('option',caption);option.value=value;select.append(option);}select.value=scene[key];select.onchange=()=>{scene[key]=select.value;saveBackground();};label.append(select);photoGroup.append(label);}
    const visibilityLabel=n('label',tr('Background visibility (%)','Видимість фону (%)')),visibility=n('input'),visibilityValue=n('output');visibility.type='range';visibility.min=0;visibility.max=100;visibility.value=scene.opacity;visibility.setAttribute('aria-label',tr('Background visibility (%)','Видимість фону (%)'));visibilityValue.textContent=scene.opacity+'%';visibility.oninput=()=>{scene.opacity=Number(visibility.value);visibilityValue.textContent=scene.opacity+'%';saveBackground();};visibilityLabel.append(visibility,visibilityValue);photoGroup.append(visibilityLabel,n('small',tr('0% = transparent, 100% = opaque. Photo proportions are preserved.','0% = прозоре, 100% = непрозоре. Пропорції фото зберігаються.')));
    const clearBackground=n('button',tr('Remove card background','Прибрати фон картки'));clearBackground.type='button';clearBackground.onclick=()=>{scene.image='';photoUrl.value='';saveBackground();};photoGroup.append(clearBackground);
    }
    capacity(form,tr('Grid maximum power for border (kW)','Максимальна потужність мережі для рамки (кВт)'),c,'gridCapacityKw');
    function check(title,key){const label=n('label',title),input=n('input');label.className='apf-check';input.setAttribute('aria-label',title);input.type='checkbox';input.checked=c[key];input.onchange=()=>{c[key]=input.checked;commit();};label.prepend(input);view.append(label);}
    field(view,tr('Display','Екран'),c,'profile',[['auto','Auto'],['desktop','Desktop'],['tablet','Tablet'],['mobile','Phone']]);check(tr('Fit screen','Вписувати в екран'),'fit');check(tr('Show non-backup group','Показувати негарантовану групу'),'showNonBackup');if(template!=='cloud_flow')check(tr('Show EV load','Показувати зарядку авто'),'showEv');check(tr('Reverse grid sign (default: positive import)','Інвертувати знак мережі (типово: плюс = імпорт)'),'invertGrid');check(tr('Reverse battery sign (default: positive discharge)','Інвертувати знак батарей (типово: плюс = розряд)'),'invertBattery');
    const dailySolar=section(tr('Solar · daily totals','Сонце · підсумок дня'),tr('Current generation sums all PV readings automatically. Rated capacity sums their manually entered kW values. Daily energy and forecast require separate data, not a sum of power ratings.','Поточна генерація автоматично сумує показники всіх PV. Номінал — сума заданих вручну кВт. Добова генерація та прогноз потребують окремих даних: їх не можна отримати просто із суми номіналів.'));
    field(dailySolar,tr('Generated today (kWh or entity)','Згенеровано сьогодні (кВт·год або сутність)'),c.cloud,'solarToday');
    field(dailySolar,tr('Total forecast for today (kWh or entity)','Повний прогноз на сьогодні (кВт·год або сутність)'),c.cloud,'solarForecast');
    dailySolar.append(n('small',tr('Use the full-day forecast, not the remaining forecast. Empty or unavailable data shows —. Manual values are fixed.','Оберіть прогноз на весь день, не залишок дня. Порожні або недоступні дані показують —. Ручні значення фіксовані.')));
    const statusGroup=section(tr('Operating states and group names','Стани роботи й назви груп'),tr('Connect status sensors and specify their reported values.','Підключіть сенсори стану та вкажіть значення, які вони передають.'));
    [['gridStatus','Grid status entity','Сенсор стану мережі'],['gridOn','Grid connected values (comma separated)','Значення: мережа є (через кому)'],['gridOff','Grid lost values','Значення: мережі немає'],['inverterStatus','Inverter status entity','Сенсор стану інвертора'],['inverterOn','Inverter running values','Значення: інвертор працює'],['inverterOff','Inverter off values','Значення: інвертор вимкнений'],['inverterFault','Inverter fault values','Значення: помилка інвертора'],['backupName','Guaranteed group name','Назва гарантованої групи'],['nonBackupName','Non-guaranteed group name','Назва негарантованої групи']].forEach(([key,en,ua])=>field(statusGroup,tr(en,ua),c,key));
    const powerGroup=section(tr('Power readings','Показники потужності'),tr('Select live sensors or fixed demo values in watts.','Оберіть живі сенсори або фіксовані демонстраційні значення у ватах.'));
    ['grid','load','ev','nonBackup'].forEach(k=>powerInput(powerGroup,tr(k+' power',({grid:'Мережа',load:'Гарантоване',ev:'Авто',nonBackup:'Негарантоване'})[k]+' · потужність'),c,k));
    function iconEditor(parent,obj){
      field(parent,tr('Icon','Піктограма'),obj,'icon',[['default',tr('Default','Стандартна')],['none',tr('No icon','Без піктограми')],['solar','☀ Сонце / Solar'],['grid','Мережа / Grid'],['inverter','Інвертор / Inverter'],['home','Будинок / Home'],['battery','Акумулятор / Battery'],['car','Авто / Car'],['plug','Інше навантаження / Other load'],['custom',tr('Custom SVG path','Власний SVG-контур')]]);
      if(obj.icon==='custom'){field(parent,tr('SVG path d (24 × 24)','SVG-контур d (24 × 24)'),obj,'iconPath');parent.append(n('small',tr('Paste only the d attribute of a 24 × 24 SVG path. The card applies its own colour.','Вставте лише значення атрибута d з SVG 24 × 24. Колір автоматично задає картка.')));}
    }
    const iconsGroup=section(tr('Block icons','Піктограми блоків'),tr('Choose an icon or hide it. Colours follow the card theme.','Оберіть піктограму або приховайте її. Колір відповідає темі картки.'));
    for(const [key,title] of [['grid',tr('Grid','Мережа')],['load',tr('Backup load','Гарантована група')],['nonBackup',tr('Non-backup load','Негарантована група')],['ev',tr('Additional load / EV','Додаткове навантаження / авто')]]){const group=n('fieldset');group.append(n('legend',title));iconEditor(group,c.nodeAppearance[key]);if(key==='ev')field(group,tr('Load name','Назва навантаження'),c,'evName');iconsGroup.append(group);}
    function device(obj,title,battery){const group=n('fieldset');group.append(n('legend',title));capacity(group,tr('Maximum power for border (kW)','Максимальна потужність для рамки (кВт)'),obj);field(group,tr('Name','Назва'),obj,'name');iconEditor(group,obj);powerInput(group,tr('Power','Потужність'),obj);if(battery){field(group,tr('Charging source','Джерело заряду'),obj,'chargeSource',[['sensor',tr('From source sensor','За сенсором джерела')],['solar',tr('Solar (fixed)','Сонце (задано вручну)')],['grid',tr('Grid (fixed)','Мережа (задано вручну)')],['mixed',tr('Mixed (fixed)','Змішане (задано вручну)')]]);if(obj.chargeSource==='sensor'){field(group,tr('Source entity: solar / grid / mixed','Сенсор джерела: solar / grid / mixed'),obj,'chargeSourceEntity');group.append(n('small',tr('Unknown source stays grey; sunlight alone does not prove solar charging.','Невідоме джерело — сіре. Наявність сонця сама по собі не визначає джерело заряду.')));}}if(battery)['soc','voltage','temperature'].forEach(k=>field(group,k+' entity',obj,k));form.append(group);return group;}
    device(c.inverter,tr('Inverter','Інвертор'));
    const batteryCountGroup=section(tr('Batteries · quantity','Акумулятори · кількість'),tr('Choose 0–5 batteries. Reducing the count removes the last battery blocks and their connections.','Оберіть від 0 до 5 акумуляторів. Зменшення кількості прибирає останні блоки та їхні прив’язки.'));
    const countLabel=n('label',tr('Battery count','Кількість акумуляторів')),countInput=n('input'),countOutput=n('output',String(c.batteries.length));
    countInput.type='range';countInput.min='0';countInput.max='5';countInput.step='1';countInput.value=String(c.batteries.length);countInput.setAttribute('aria-label',tr('Battery count','Кількість акумуляторів'));countInput.style.accentColor='#f1873d';
    countInput.oninput=()=>{countOutput.textContent=countInput.value;};
    countInput.onchange=()=>{const count=Number(countInput.value);while(c.batteries.length<count)c.batteries.push({});c.batteries.length=count;commit();};
    countLabel.append(countOutput,countInput);batteryCountGroup.append(countLabel);
    c.batteries.forEach((b,i)=>device(b,tr('Battery ','Акумулятор ')+(i+1),true));
    c.strings.forEach((s,i)=>{const group=n('fieldset');group.append(n('legend','PV '+(i+1)));field(group,tr('PV name','Назва PV'),s,'name');iconEditor(group,s);capacity(group,tr('PV rated capacity (kW)','Номінальна потужність PV (кВт)'),s,'capacityKw',true);powerInput(group,tr('Current PV generation','Поточна генерація PV'),s);const del=n('button',tr('Remove PV','Видалити PV'));del.type='button';del.onclick=()=>{c.strings.splice(i,1);commit();};group.append(del);form.append(group);});
    [['strings',10,tr('+ PV','+ PV')]].forEach(([key,max,title])=>{const b=n('button',title+' · '+c[key].length+'/'+max);b.type='button';b.disabled=c[key].length>=max;b.onclick=()=>{c[key].push({});commit();};form.append(b);});box.append(n('p',tr('Manual values are fixed watts, not live telemetry. Nominal power is kW. Each PV uses one generation reading and its own rated capacity. Unavailable sensors show —.','Ручні значення — фіксована потужність у Вт, не живі дані. Номінал — у кВт. Кожне PV використовує один показник генерації та власний номінал. Можна додати до 10 PV або видалити непотрібні. Недоступні сенсори показують —.')));return box;
  }
  const api={normalize,render,update,editor,utilization,flowDuration,nixieFormat,solarRows};root.AnmaPowerFlow=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
