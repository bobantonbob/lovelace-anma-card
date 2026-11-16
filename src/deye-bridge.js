/* Shared ANMA studio / HA adapter. Synthetic totals are display-only. */
(function(root){
  'use strict';
  const tag='anma-deye-lcd';
  function normalize(raw={}){return Object.fromEntries(Object.entries(raw&&typeof raw==='object'?raw:{}).filter(([k,v])=>/^[a-z0-9_]+$/.test(k)&&((typeof v==='string'&&v.trim()&&v.length<200)||typeof v==='boolean')));}
  // Only propose exact, existing entity IDs within the user-selected Solarman prefix.
  // Explicit bindings always win. No cross-inverter fuzzy matching or register writes.
  function discover(states,prefix,phases='1'){
    if(!/^[a-z0-9_]+$/.test(prefix))return {};
    const result={inverter_phases:String(phases)};
    const bind=(key,domain,suffix)=>{const id=domain+'.'+prefix+'_'+suffix;if(states===null||states[id])result[key]=id;};
    const telemetry={pv_power:'pv_power',grid_power:'grid_power',load_power:'load_power',battery_power:'battery_power',battery_soc:'battery',battery_voltage:'battery_voltage',battery_current:'battery_current',battery_temperature:'battery_temperature',grid_voltage:'grid_voltage',grid_frequency_sensor:'grid_frequency',load_frequency:'load_frequency',inverter_power:'power',inverter_voltage:'output_voltage',inverter_frequency:'output_frequency',inverter_dc_temperature:'dc_temperature',inverter_ac_temperature:'temperature',pv_energy_today:'today_production',pv_energy_total:'total_production',grid_energy_today:'today_energy_import',grid_energy_total:'total_energy_import',grid_export_today:'today_energy_export',grid_export_total:'total_energy_export',load_energy_today:'today_load_consumption',load_energy_total:'total_load_consumption'};
    for(const [k,v]of Object.entries(telemetry))bind(k,'sensor',v);
    bind('grid_connected','binary_sensor','grid');bind('inverter_status','sensor','device_state');
    for(const source of ['grid','load','inverter'])for(let i=1;i<=Number(phases);i++)for(const metric of ['power','voltage','current'])bind(`${source}_l${i}_${metric}`,'sensor',`${source==='inverter'?'output':source}_l${i}_${metric}`);
    for(let i=1;i<=3;i++)for(const metric of ['power','voltage','current'])bind(`pv_${i}_${metric}`,'sensor',`pv${i}_${metric}`);
    const numbers={battery_capacity:'battery_capacity',battery_max_charging_current:'battery_max_charging_current',battery_max_discharging_current:'battery_max_discharging_current',generator_charge_start_soc:'battery_generator_charging_start',generator_charge_start_voltage:'battery_generator_charging_start_voltage',grid_charge_start_soc:'battery_grid_charging_start',grid_charge_start_voltage:'battery_grid_charging_start_voltage',generator_charge_current:'battery_generator_charging_current',grid_charge_current:'battery_grid_charging_current',battery_shutdown_soc:'battery_shutdown_soc',battery_low_soc:'battery_low_soc',battery_restart_soc:'battery_restart_soc',max_solar_power:'pv_power',max_sell_power:'export_surplus_power',zero_export_power:'zero_export_power',grid_peak_shaving_power:'grid_peak_shaving',generator_peak_shaving_power:'generator_peak_shaving',micro_inverter_on_soc:'smartload_on',micro_inverter_off_soc:'smartload_off',export_power_limit:'grid_max_export_power',import_power_limit:'grid_max_import_power'};
    for(const [k,v]of Object.entries(numbers))bind(k,'number',v);
    const switches={battery_activate:'battery_wake_up',generator_charge:'battery_generator_charging',grid_charge:'battery_grid_charging',solar_sell:'export_surplus',grid_peak_shaving:'grid_peak_shaving',generator_peak_shaving:'generator_peak_shaving',gen_grid_input:'generator_grid_side',mppt_multi_point:'mppt_multi_point_scanning'};
    for(const [k,v]of Object.entries(switches))bind(k,'switch',v);
    const selects={battery_control_mode:'battery_control_mode',battery_operation_mode:'battery_operation_mode',charging_signal:'charging_signal',work_mode:'work_mode',energy_pattern:'energy_pattern',time_of_use:'time_of_use',gen_port_mode:'io_mode',grid_frequency:'grid_frequency',grid_output_voltage:'grid_voltage',lithium_mode:'battery_bms_type',meter_select:'meter'};
    for(const [k,v]of Object.entries(selects))bind(k,'select',v);
    for(let i=1;i<=6;i++){bind(`tou_${i}_charging`,'select',`program_${i}_charging`);bind(`tou_${i}_time`,'time',`program_${i}_time`);for(const k of ['power','soc','voltage'])bind(`tou_${i}_${k}`,'number',`program_${i}_${k}`);}
    return result;
  }
  function applyDevice(raw={},device={}){
    const name=String(device.name||'');
    const phases=/[LH]P3/i.test(name)?'3':/LP1/i.test(name)?'1':raw.inverter_phases||'1';
    const oldDefaults=discover(null,'inverter','3'),deyeDefaults=discover(null,'deye','3');
    const next={...raw,inverter_phases:phases};
    const preset=discover(null,'deye',phases);
    for(const key of Object.keys(deyeDefaults)){
      if(key==='inverter_phases')continue;
      if(!next[key]||next[key]===oldDefaults[key]||next[key]===deyeDefaults[key]){
        if(preset[key])next[key]=preset[key];else delete next[key];
      }
    }
    const power=/SUN-(\d+(?:\.\d+)?)K/i.exec(name);
    if(power)next.inverter_model=power[1];
    return next;
  }
  function data(layout,{hass=null,demo=false}={}){
    const p=layout.powerFlow||{},b=layout.bindings||{},config={lcd_theme:'anma',inverter_model:'12',inverter_phases:'1',grid_power:p.grid||b.grid_power,load_power:p.load||b.load_power,battery_power:b.battery_power,battery_soc:b.battery_soc,pv_power:b.solar_power,grid_connected:p.gridStatus,inverter_status:p.inverterStatus,invert_battery:!!p.invertBattery,invert_grid:!!p.invertGrid,...normalize(p.deye)};
    const states={...(hass?.states||{})};
    const read=(id,power=false)=>{if(!id)return null;const state=states[id];if(!state||['','unknown','unavailable'].includes(state.state)||!Number.isFinite(Number(state.state)))return null;const factor=power?({W:1,kW:1000,MW:1e6}[state.attributes?.unit_of_measurement]):1;return factor?Number(state.state)*factor:null;};
    const put=(key,value,unit)=>{const id='sensor.anma_lcd_'+key;states[id]={state:value===null?'unavailable':String(value),attributes:{unit_of_measurement:unit}};config[key]=id;};
    // Unconfigured rows are ignored; configured-but-offline channels invalidate totals.
    const sum=ids=>{const values=ids.map(id=>read(id,true));return values.length&&values.every(v=>v!==null)?values.reduce((a,v)=>a+v,0):null;};
    const pv=(p.strings||[]).flatMap(s=>s.power?[s.power]:(s.mppts||[]).map(m=>m.power).filter(Boolean));
    const bats=(p.batteries||[]).filter(x=>x.power||x.soc);
    if(!p.deye?.pv_power&&pv.length)put('pv_power',sum(pv),'W');
    if(!p.deye?.battery_power&&bats.length)put('battery_power',sum(bats.map(x=>x.power)),'W');
    if(!p.deye?.battery_soc&&bats.length){const soc=bats.map(x=>read(x.soc));put('battery_soc',soc.every(x=>x!==null)?soc.reduce((a,v)=>a+v,0)/soc.length:null,'%');}
    if(bats.length===1){for(const k of ['voltage','temperature'])if(!config['battery_'+k])config['battery_'+k]=bats[0][k];}
    for(const key of ['grid_power','load_power','pv_power','battery_power'])if(config[key]&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(config[key]))put(key,Number(config[key]),'W');
    if(demo){for(const [key,value,unit] of [['pv_power',3200,'W'],['grid_power',930,'W'],['load_power',870,'W'],['battery_power',-3260,'W'],['battery_soc',64.25,'%'],['battery_voltage',52.4,'V'],['battery_current',-62.2,'A'],['battery_temperature',25,'°C'],['grid_voltage',230,'V'],['load_voltage',230,'V']])put(key,value,unit);config.invert_battery=false;config.invert_grid=false;}
    const adapted={...hass,states,user:demo?{is_admin:false}:hass?.user};
    for(const name of ['callService','callWS','callApi'])if(!demo&&typeof hass?.[name]==='function')adapted[name]=hass[name].bind(hass);
    if(demo)delete adapted.callService;
    return {config,hass:adapted};
  }
  function refresh(card,layout,options){card._layout=layout;card._options=options;const lcd=card.querySelector(tag),next=data(layout,options);next.config.language_key=layout.id||next.config.grid_power||'default';next.config.initial_language=layout.language==='uk'||options.uk?'uk':'en';const signature=JSON.stringify(next.config);if(lcd.dataset.config!==signature){lcd.setConfig(next.config);lcd.dataset.config=signature;}lcd.hass=next.hass;card._localizer?.apply();}
  function render(layout,options={}){
    const card=document.createElement('section');card.className='apf-deye db-widget-box';card.style.cssText='grid-column:1/-1;min-width:0;width:100%';
    const lcd=document.createElement(tag);card.append(lcd);
    lcd.addEventListener('deye-language-changed',event=>{const current=card._layout||layout;current.powerFlow={...current.powerFlow,deye:{...current.powerFlow?.deye,ui_language:event.detail.language}};card._localizer?.apply();(card._options||options).change?.(false);});
    const toolbar=document.createElement('div');toolbar.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px;font:12px system-ui;color:inherit';
    const label=document.createElement('span');label.textContent=options.demo?'DEMO · Deye LCD · тестові дані':'ANMA · Deye LCD';toolbar.append(label);
    if(options.change){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Прив’язки Deye LCD';summary.style.cursor='pointer';details.append(summary);details.append(editor(layout.powerFlow||{},options.uk,(next)=>{layout.powerFlow=next;options.change(layout);},{getStates:()=>options.hass?.states}));toolbar.append(details);}
    card.append(toolbar);refresh(card,layout,options);card._localizer=root.AnmaDeyeI18n.attach(toolbar,()=>lcd.uiLanguage);return card;
  }
  function update(host,layout,options){let card=host.querySelector('.apf-deye');if(!card){card=render(layout,options);host.replaceChildren(card);}else refresh(card,layout,options);return card;}
  function editor(raw,uk,onchange,{getStates=()=>null}={}){
    const panel=document.createElement('div');panel.style.cssText='padding:12px;display:grid;gap:12px;max-width:100%;font:13px system-ui';
    let importedStates=null;const availableStates=()=>{const live=getStates();return live&&Object.keys(live).length?live:importedStates||{};};
    const config=normalize(raw.deye),Class=root.customElements?.get(tag),form=Class?.getConfigForm();
    if(!form)return panel;
    const setup=document.createElement('fieldset');panel.append(setup);
    const legend=document.createElement('legend');legend.textContent=uk?'Solarman · підбір сутностей':'Solarman · entity mapping';setup.append(legend);
    const prefix=document.createElement('input');prefix.value='deye';prefix.placeholder=uk?'Префікс сутностей, наприклад deye':'Entity prefix, e.g. deye';prefix.setAttribute('aria-label','Solarman entity prefix');
    const prefixes=document.createElement('datalist');prefixes.id='solarman-prefix-'+Math.random().toString(36).slice(2);prefix.setAttribute('list',prefixes.id);
    for(const id of Object.keys(availableStates())){const match=/^sensor\.(.+)_battery_power$/.exec(id);if(match){const option=document.createElement('option');option.value=match[1];prefixes.append(option);}}
    const phase=document.createElement('select');phase.setAttribute('aria-label',uk?'Кількість фаз':'Phase count');for(const n of ['1','3']){const option=document.createElement('option');option.value=n;option.textContent=uk?n+' фази':n+' phase';phase.append(option);}phase.value=config.inverter_phases||'1';
    const button=document.createElement('button');button.type='button';button.textContent=uk?'Заповнити порожні прив’язки':'Fill empty bindings';
    const status=document.createElement('p');status.setAttribute('role','status');setup.append(prefix,prefixes,phase,button,status);
    const preset=document.createElement('button');preset.type='button';preset.textContent=uk?'Стандартні прив’язки (без HA)':'Standard bindings (offline)';setup.append(preset);
    const fillBindings=(offline=false)=>{const states=availableStates();const found=discover(offline?null:states,prefix.value.trim(),phase.value);let count=0;
      for(const [key,id]of Object.entries(found)){if(key==='inverter_phases'||!config[key]){config[key]=id;if(key!=='inverter_phases')count++;}}
      status.textContent=offline?(uk?`Додано ${count} стандартних прив’язок. Наявність у HA не перевірена. Перевірте назви перед застосуванням.`:`Added ${count} standard bindings. Availability in HA is unverified. Review names before applying.`):(uk?`Додано ${count} прив’язок. Перевірте поля нижче. Відсутні сутності не створюються.`:`Added ${count} bindings. Review fields below. Missing entities are not created.`);
      for(const input of panel.querySelectorAll('[data-binding-key]')){const value=config[input.dataset.bindingKey];if(value&&input.type!=='checkbox')input.value=value;}
      onchange({...raw,deye:{...config}},false);
    };
    button.onclick=()=>fillBindings();preset.onclick=()=>fillBindings(true);
    phase.onchange=()=>fillBindings(true);
    const importLabel=document.createElement('label');importLabel.textContent=uk?'Імпорт переліку сутностей HA (JSON, лише локально)':'Import HA entity list (JSON, local only)';
    const file=document.createElement('input');file.type='file';file.accept='.json,application/json';importLabel.append(file);setup.append(importLabel);
    file.onchange=async()=>{try{const input=JSON.parse(await file.files[0].text());const entries=Array.isArray(input)?input:Object.entries(input).map(([entity_id,state])=>({entity_id,...state}));const clean={};for(const item of entries){if(!/^(sensor|binary_sensor|number|switch|select|time)\.[a-z0-9_]+$/.test(item.entity_id||''))continue;clean[item.entity_id]={state:String(item.state??'unknown'),attributes:item.attributes&&typeof item.attributes==='object'?item.attributes:{}};}if(!Object.keys(clean).length)throw Error();importedStates=clean;prefixes.replaceChildren();for(const id of Object.keys(clean)){const match=/^sensor\.(.+)_battery_power$/.exec(id);if(match){const option=document.createElement('option');option.value=match[1];prefixes.append(option);}}status.textContent=uk?'Перелік завантажено локально. Оберіть префікс і фази.':'List loaded locally. Choose the prefix and phase count.';}catch{status.textContent=uk?'Не вдалося прочитати перелік сутностей JSON.':'Could not read the JSON entity list.'}};
    const note=document.createElement('p');note.textContent='Порожні головні показники використовують наявні прив’язки ANMA. Налаштування інвертора працюють лише з вибраними сутностями HA. Для історії суми підключіть постійний сенсор загальної потужності.';panel.append(note);
    function add(schema,parent){for(const entry of schema){if(entry.schema){const group=document.createElement('details'),title=document.createElement('summary');title.textContent=entry.title;group.append(title);add(entry.schema,group);parent.append(group);continue;}
      const label=document.createElement('label');label.style.cssText='display:grid;grid-template-columns:minmax(120px,1fr) minmax(100px,1fr);gap:8px;align-items:center;margin:7px 0';const text=document.createElement('span');text.textContent=form.computeLabel?.(entry)||entry.name;label.append(text);
      const opts=entry.selector?.select?.options;let input=document.createElement(opts?'select':'input');input.dataset.bindingKey=entry.name;input.style.cssText='min-width:0;width:100%;box-sizing:border-box;padding:7px';
      if(opts)for(const o of opts){const op=document.createElement('option');op.value=typeof o==='string'?o:o.value;op.textContent=typeof o==='string'?o:o.label;input.append(op);}
      if(entry.selector?.boolean){input.type='checkbox';input.checked=!!config[entry.name];}else{input.value=config[entry.name]||({lcd_theme:'anma',inverter_model:'12',inverter_phases:'1'}[entry.name])||'';input.placeholder='sensor… / number… / select…';}
      if(entry.selector?.entity){const list=document.createElement('datalist'),id='deye-entities-'+Math.random().toString(36).slice(2);list.id=id;const domains=[entry.selector.entity.domain].flat();for(const entity of Object.keys(availableStates()).filter(e=>domains.includes(e.split('.')[0]))){const op=document.createElement('option');op.value=entity;list.append(op);}input.setAttribute('list',id);label.append(list);}
      input.addEventListener('change',()=>{config[entry.name]=input.type==='checkbox'?input.checked:input.value.trim();onchange({...raw,deye:{...config}},false);});label.append(input);parent.append(label);
    }}
    add(form.schema,panel);
    const audit=document.createElement('details'),auditTitle=document.createElement('summary'),auditBody=document.createElement('pre');auditTitle.textContent=uk?'Перевірка прив’язок':'Binding audit';auditBody.style.cssText='white-space:pre-wrap;font:12px system-ui';audit.append(auditTitle,auditBody);panel.append(audit);
    function auditBindings(){const states=availableStates(),online=Object.keys(states).length>0,rows=[];const scan=items=>{for(const entry of items){if(entry.schema){scan(entry.schema);continue;}if(!entry.selector?.entity)continue;const id=config[entry.name],domains=[entry.selector.entity.domain].flat();let result=!id?(uk?'не підключено':'unbound'):!domains.includes(id.split('.')[0])?(uk?'неправильний тип':'wrong domain'):online&&!states[id]?(uk?'сутність не знайдена':'entity missing'):online&&['unknown','unavailable'].includes(states[id]?.state)?(uk?'недоступна':'unavailable'):(uk?'прив’язано':'bound');rows.push(`${entry.name}: ${result}${id?' — '+id:''}`);}};scan(form.schema);auditBody.textContent=rows.join('\n');}
    audit.addEventListener('toggle',()=>{if(audit.open)auditBindings()});panel.addEventListener('change',auditBindings);button.addEventListener('click',auditBindings);auditBindings();
    const diagnostic=document.createElement('details'),title=document.createElement('summary');title.textContent='Device Info · сутності';diagnostic.append(title);for(const key of ['inverter_serial','hmi_version','main_version','pack_version','alarm_history']){const input=document.createElement('input');input.placeholder=key;input.value=config[key]||'';input.setAttribute('aria-label',key);input.onchange=()=>{config[key]=input.value.trim();onchange({...raw,deye:{...config}},false);};diagnostic.append(input);}panel.append(diagnostic);
    root.AnmaDeyeI18n.attach(panel,()=>config.ui_language||(uk?'uk':'en')).disconnect();
    return panel;
  }
  root.AnmaDeyeBridge={normalize,data,render,update,editor,discover,applyDevice,defaults:(prefix='deye',phases='1')=>discover(null,prefix,phases)};
  if(typeof module!=='undefined')module.exports=root.AnmaDeyeBridge;
})(typeof window!=='undefined'?window:globalThis);
