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
      return 'type: custom:anma-card\nlayout: ' + JSON.stringify(exportLayout);
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
      lines.push('      - type: custom:anma-card');
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

    return 'type: custom:anma-card\nlayout: ' + JSON.stringify(exportLayout);
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
