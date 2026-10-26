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
      const view=section('Appearance','Вигляд');toggle(view,'Automatically fit the whole scene to the screen','Автоматично вписувати всю сцену в екран',c,'fit');field(view,tr('Theme','Тема'),c,'mode',[['auto','Auto'],['day',tr('Day','День')],['night',tr('Night','Ніч')]]);field(view,tr('Display','Екран'),c,'profile',[['auto','Auto'],['desktop','Desktop'],['tablet','Tablet'],['mobile','Phone']]);
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
