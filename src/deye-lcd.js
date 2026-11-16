/* Adapted from Deye LCD Alpha 0.7 by ТЕХНіКА / H-Auto. Original attribution retained. */
(() => {
  if (typeof customElements === "undefined") return;
  const cardTag = "anma-deye-lcd";
  if (customElements.get(cardTag)) return;

  const version = "0.5";
  const models = [6, 8, 10, 12, 15, 20, 30, 80, 160];
  const defaultModel = 8;
  const themes = [
    { value: "classic", label: "КЛАСіК" },
    { value: "anma", label: "ANMA" },
  ];
  const phaseOptions = [
    { value: "1", label: "1 фаза" },
    { value: "3", label: "3 фази" },
  ];
  const threePhaseValues = ["3", 3];
  const acSources = ["grid", "load"];
  const screenWhite = "#ffffff";
  const flowThreshold = 5;
  const settingTimeout = 45000;
  const weekdays = { Mon: "Пн", Tue: "Вт", Wed: "Ср", Thu: "Чт", Fri: "Пт", Sat: "Сб", Sun: "Нд" };
  const modelLabel = (model) => model === 160 ? "Deye 80 + 80 кВт (160 кВт)" : `Deye ${model} кВт`;
  const settingsMenus = [
    { id: "battery", title: "Battery Setting", pages: ["Batt Mode", "Batt Set2"] },
    { id: "work", title: "Work Mode", pages: ["Work Mode1", "Work Mode2"] },
    { id: "smart", title: "Smart Devices" },
    { id: "grid", title: "Grid Setting" },
    { id: "gen", title: "Gen Port Use", pages: ["Gen Port"] },
    { id: "basic", title: "Basic Setting" },
    { id: "advanced", title: "Advanced Function" },
    { id: "device", title: "Device Info." },
  ];
  const settingBindings = [
    ["Battery Setting · Batt Mode", [
      ["battery_mode", "select", "Batt Mode · один селектор з усіма режимами"],
      ["battery_control_mode", "select", "Тип АКБ · літій / свинець"],
      ["battery_operation_mode", "select", "Керування АКБ · напруга / заряд / без АКБ"],
      ["battery_capacity", "number", "Ємність АКБ"],
      ["battery_max_charging_current", "number", "Максимальний струм заряду"],
      ["battery_max_discharging_current", "number", "Максимальний струм розряду"],
      ["battery_activate", "switch", "Activate Battery · активація АКБ"],
      ["battery_disable_float_charge", "switch", "Disable Float Charge · вимкнення підтримувального заряду"],
    ]],
    ["Battery Setting · Gen / Grid", [
      ["generator_charge_start_soc", "number", "Gen Start · заряд, %"],
      ["generator_charge_start_voltage", "number", "Gen Start · напруга, В"],
      ["grid_charge_start_soc", "number", "Grid Start · заряд, %"],
      ["grid_charge_start_voltage", "number", "Grid Start · напруга, В"],
      ["generator_charge_current", "number", "Струм заряду АКБ від генератора"],
      ["grid_charge_current", "number", "Струм заряду АКБ від мережі"],
      ["generator_charge", "switch", "Gen Charge · заряд від генератора"],
      ["grid_charge", "switch", "Grid Charge · заряд від мережі"],
      ["charging_signal", "select", "Charging Signal · спільний селектор Gen / Grid"],
      ["generator_signal", "switch", "Gen Signal · окремий перемикач"],
      ["grid_signal", "switch", "Grid Signal · окремий перемикач"],
      ["generator_force", "switch", "Gen Force · примусовий запуск генератора"],
    ]],
    ["Work Mode", [
      ["work_mode", "select", "Work Mode · режим роботи"],
      ["max_solar_power", "number", "Max Solar Power · ліміт сонячної генерації"],
      ["solar_sell", "switch", "Solar Sell · продаж надлишку"],
      ["max_sell_power", "number", "Max Sell Power · ліміт продажу"],
      ["zero_export_power", "number", "Zero-export Power · значення нульового експорту"],
      ["energy_pattern", "select", "Energy pattern · пріоритет АКБ / навантаження"],
      ["grid_peak_shaving", "switch", "Шейвінг мережі · перемикач"],
      ["grid_peak_shaving_power", "number", "Шейвінг мережі · значення"],
      ["time_of_use", ["switch", "select"], "Time Of Use · перемикач або селектор"],
    ]],
    ["Gen Port Use", [
      ["generator_peak_shaving", "switch", "Шейвінг генератора · перемикач"],
      ["generator_peak_shaving_power", "number", "Шейвінг генератора · значення"],
    ]],
  ];
  const extra = window.AnmaDeyePages;
  for (const menu of settingsMenus) menu.pages = extra.menus[menu.id];
  const existingFields = new Set(settingBindings.flatMap(([, fs]) => fs.map(f => f[0])));
  settingBindings.push(["Deye LCD · додаткові меню", extra.fields.filter(f => !existingFields.has(f[0]))]);
  for(let i=1;i<=6;i++){
    settingBindings.push([`TOU ${i}`,[[`tou_${i}_charging`,'select',`Program ${i} Charging · Grid / Generator / Both`]]]);
    const field=settingBindings.flatMap(([,fs])=>fs).find(f=>f[0]===`tou_${i}_time`);if(field)field[1]=['select','time'];
  }
  const settingFields = settingBindings.flatMap(([, fields]) => fields);
  const bindingDomains = Object.fromEntries(settingFields.map(([name, domain]) => [name, domain]));
  const batteryChoices = {
    lithium: ["Lithium"],
    voltage: ["Use Batt V", "Voltage"],
    soc: ["Use Batt %", "Capacity", "SOC"],
    none: ["No Batt", "No Battery"],
    solar: ["solar supply only", "Solar Only"],
  };
  const batteryChemistries = {
    lithium: batteryChoices.lithium,
    lead: ["Lead-Battery, four-stage charging method", "Lead Acid", "Lead Battery"],
  };
  const batteryOperationModes = { voltage: batteryChoices.voltage, soc: batteryChoices.soc, none: batteryChoices.none };
  const settingOptions = {
    work_mode: {
      sell: ["Selling First", "Export First"],
      load: ["Zero Export To Load"],
      ct: ["Zero Export To CT"],
    },
    energy_pattern: {
      battery: ["Batt First", "Battery First"],
      load: ["Load First"],
    },
    charging_signal: {
      0: ["Normal", "None", "Disabled", "Off"],
      1: ["Generator", "Gen"],
      2: ["Grid"],
      3: ["Both", "Grid and Generator", "Gen and Grid"],
    },
  };
  const settingsButtonIcons = {
    up: "M12 2 22 13h-6v9H8v-9H2Z",
    down: "M8 2h8v9h6L12 22 2 11h6Z",
    cancel: "M6 3l6 6 6-6 3 3-6 6 6 6-3 3-6-6-6 6-3-3 6-6-6-6Z",
    apply: "m2 12 4-4 4 4L19 3l4 4-13 13Z",
  };
  const settingUnits = { A: "А", W: "Вт", kW: "кВт" };
  const gaugeLayout = [
    { key: "pv_power", source: "pv", label: "Сонячна генерація", icon: "solar", x: 70, y: 87 },
    { key: "grid_power", source: "grid", label: "Мережа", icon: "grid", x: 333, y: 87, invert: "invert_grid" },
    { key: "battery_power", source: "battery", label: "Батарея", icon: "battery", x: 70, y: 204, invert: "invert_battery" },
    { key: "load_power", source: "load", label: "Навантаження", icon: "house", x: 333, y: 204 },
  ];
  const gaugeByKey = Object.fromEntries(gaugeLayout.map(gauge => [gauge.key, gauge]));
  gaugeByKey.inverter_power = {key:'inverter_power', source:'inverter', label:'Inverter'};
  const extraReadings = {
    pv: [['pv_1_voltage','PV1 V'],['pv_1_current','PV1 A'],['pv_1_power','PV1 W'],['pv_2_voltage','PV2 V'],['pv_2_current','PV2 A'],['pv_2_power','PV2 W'],['pv_3_voltage','PV3 V'],['pv_3_current','PV3 A'],['pv_3_power','PV3 W'],['pv_energy_today','Today'],['pv_energy_total','Total']],
    grid: [['grid_frequency_sensor','Frequency'],['grid_energy_today','BUY Today'],['grid_energy_total','BUY Total'],['grid_export_today','SELL Today'],['grid_export_total','SELL Total']],
    load: [['load_frequency','Frequency'],['load_energy_today','Today'],['load_energy_total','Total']],
    battery: [['battery_soc','SOC'],['battery_bms_charge_limit','Li-BMS Charge limit'],['battery_bms_discharge_limit','Li-BMS Discharge limit'],['battery_bms_alarm','Li-BMS Alarm']],
    inverter: [['inverter_frequency','Frequency'],['inverter_dc_temperature','DC-T'],['inverter_ac_temperature','AC-T']]
  };
  const measurementFields = [
    { key: "current", label: "Струм", unit: "А" },
    { key: "voltage", label: "Напруга", unit: "В" },
    { key: "power", label: "Потужність", unit: "кВт" },
    { key: "temperature", label: "Температура АКБ", unit: "°C" },
  ];
  const acMeasurements = measurementFields.filter(({ key }) => key !== "temperature");
  const phaseColumns = [
    { prefix: "l1", label: "L1" },
    { prefix: "l2", label: "L2" },
    { prefix: "l3", label: "L3" },
  ];
  const batteryColumns = [
    { prefix: "battery_1", label: "АКБ 1" },
    { prefix: "battery_2", label: "АКБ 2" },
  ];
  const detailBreakdowns = [
    { key: "phases", title: "Покази по фазах", columns: phaseColumns, fields: acMeasurements },
    { key: "batteries", title: "Окремі АКБ", columns: batteryColumns, fields: measurementFields },
  ];
  const measurementUnits = { ...settingUnits, mA: "мА", V: "В", mV: "мВ", kV: "кВ", "°C": "°C", "°F": "°F" };
  const historyDuration = 24 * 60 * 60 * 1000;
  const measurementFormat = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2, useGrouping: false });
  const chartFormat = new Intl.NumberFormat("uk-UA", { maximumSignificantDigits: 4, useGrouping: false });
  const wireLayout = [
    { name: "solar", from: [118, 83], bendX: 143, to: [168, 133] },
    { name: "grid", from: [285, 83], bendX: 259, to: [235, 133] },
    { name: "battery", from: [168, 150], bendX: 143, to: [118, 200] },
    { name: "load", from: [235, 150], bendX: 259, to: [285, 200] },
  ];

  function numericState(state) {
    if (typeof state !== "string" || !state.trim()) return null;
    const value = Number(state);
    return Number.isFinite(value) ? value : null;
  }

  function reading(entity) {
    return numericState(entity?.state);
  }

  function powerFactor(unit) {
    const normalized = typeof unit === "string" ? unit.trim().toLowerCase() : "";
    return normalized === "kw" || normalized === "квт" ? 1000 : 1;
  }

  function watts(entity) {
    const value = reading(entity);
    if (value === null) return null;
    return value * powerFactor(entity.attributes?.unit_of_measurement);
  }

  function signed(value, invert) {
    return value === null ? null : (invert ? -value : value);
  }

  function isGridDisconnected(statusEntity, voltageEntity) {
    if (statusEntity?.state === "off") return true;
    if (statusEntity?.state === "on") return false;
    const unit = voltageEntity?.attributes?.unit_of_measurement?.trim().toLowerCase();
    return (!unit || ["v", "в", "mv", "kv"].includes(unit)) && reading(voltageEntity) === 0;
  }

  function formatPower(w) {
    if (w === null) return "—";
    const kw = Math.sign(w) * Math.round(Math.abs(w) / 10) / 100;
    return kw.toFixed(2);
  }

  function arc(from, to) {
    const point = (fraction) => {
      const radians = (142 + fraction * 256) * Math.PI / 180;
      return [41 * Math.cos(radians), 41 * Math.sin(radians)].map(n => n.toFixed(3)).join(" ");
    };
    const large = (to - from) * 256 > 180 ? 1 : 0;
    return `M${point(from)} A41 41 0 ${large} 1 ${point(to)}`;
  }

  const sunRays = Array.from({ length: 16 }, (_, index) =>
    `<path d="M-2.1 -10.1L-.3 -13.3Q0 -13.7 .3 -13.3L2.1 -10.1Z" transform="rotate(${index * 22.5})"/>`
  ).join("");
  const towerArms = [-1, 1].map(direction => `<g transform="scale(${direction} 1)" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4.5-16 11.5-9v3.8m-7-3.8h7M4.5-5.1l7 7v3.8m-7-3.8h7" stroke-width="1.65"/>
    <path d="M12.2-9.5Q17.9-5.1 24 .2M12.2-4.2Q18.6-.8 24 1.7M12.2 2.4Q18.3 3.2 24 3.3" stroke-width=".8"/>
  </g>`).join("");
  const gearIcon = `
    <path fill-rule="evenodd" d="M13.35 0a13.35 13.35 0 1 0-26.7 0 13.35 13.35 0 1 0 26.7 0ZM8.3 0a8.3 8.3 0 1 0-16.6 0 8.3 8.3 0 1 0 16.6 0Z"/>
    ${Array.from({ length: 12 }, (_, index) =>
      `<path d="M-2.9-12.6-2.65-16.1Q-2.6-16.7-2-16.7h4q.6 0 .65.6l.25 3.5Z" transform="rotate(${index * 30})"/>`
    ).join("")}
    <circle r="3.45"/>`;
  const icons = {
    solar: `<g transform="translate(-10.6 -8.2)" fill="currentColor">
      <circle r="11.15"/>${sunRays}
      <circle r="8.85" fill="none" stroke="${screenWhite}" stroke-width="1.2"/>
      <path d="M-6.65 3.45C-9.25-2.35-4.87-8.22 1.42-7.48C-3.9-6.54-6.96-2.18-6.65 3.45Z" fill="${screenWhite}"/>
    </g>
    <path d="M-10.3-6H16.4L22 12.8H-15.2Z" fill="currentColor" stroke="${screenWhite}" stroke-width="1.25" stroke-linejoin="round"/>
    <path d="M-3.6-6-5.9 12.8M3.1-6l.3 18.8M9.8-6l2.9 18.8M-12 .2h30.3m-32 6.2h33.8" fill="none" stroke="${screenWhite}" stroke-width="1.1"/>
    <path d="M-15.2 13.4H22v2.4H5.8v3l2.5 1.4h4.4v1.7h-18v-1.7h4.7l2.3-1.4v-3h-16.9Z" fill="currentColor"/>`,
    grid: `${towerArms}
    <path d="M-9.9 21.7-4.55 1.6V-16.9Q-4.55-18.65-2.8-18.65h5.6q1.75 0 1.75 1.75V1.6L9.9 21.7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M-4.15-17.5 4.15-8.95M4.15-17.5-4.15-8.95M-4.15-8.95 4.15 1.6M4.15-8.95-4.15 1.6
      M-4.15 1.6 7.05 11.7M4.15 1.6-7.05 11.7M-7.05 11.7 9.9 21.7M7.05 11.7-9.9 21.7
      M-4.35-8.95h8.7M-4.35 1.6h8.7M-7.05 11.7h14.1" fill="none" stroke="currentColor" stroke-width="1.18" stroke-linejoin="round"/>
    <rect x="-13.7" y="21" width="27.4" height="3.2" rx=".25" fill="currentColor"/>`,
    battery: `<rect x="-23" y="-9" width="44" height="21" rx="3" fill="none" stroke="currentColor" stroke-width="2.3"/>
    <path d="M22-3h3v9h-3M-17-6 4 8l-2-7 13 4L-6-6l2 5z" fill="currentColor"/>`,
    dual: [-7, 7].map(x => `<g transform="translate(${x} 0)"><rect x="-5.8" y="-9" width="11.6" height="24" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M-2-11h4v2h-4m4 3-6 10h4l-2 7 6-10H0Z" fill="currentColor"/></g>`).join(""),
    house: `<path d="M-24-5 0-18l10 5v-5h5v8l9 5-2 3L0-14-22-2Z" fill="currentColor"/>
    <path d="M-18-1 0-11l18 10v21h-36zm10 5v12h6V4zm10 0v12h6V4zM-19 23h38l3 3h-44z" fill="currentColor" fill-rule="evenodd"/>`,
  };

  const technikaDefinitions = `
    <radialGradient id="deye-technika-status" cx=".43" cy=".34" r=".75">
      <stop stop-color="#407761"/>
      <stop offset=".55" stop-color="#2b624b"/>
      <stop offset="1" stop-color="#234f3e"/>
    </radialGradient>
    <radialGradient id="deye-technika-face" cx=".4" cy=".31" r=".76">
      <stop offset="0" stop-color="#F1F9ED"/>
      <stop offset="0.55" stop-color="#DFEDD8"/>
      <stop offset="1" stop-color="#A9C0A2"/>
    </radialGradient>
    <linearGradient id="deye-technika-power" gradientUnits="userSpaceOnUse" x1="-33" y1="0" x2="34" y2="0">
      <stop offset="0" stop-color="#277454"/>
      <stop offset=".37" stop-color="#437442"/>
      <stop offset=".64" stop-color="#816728"/>
      <stop offset="1" stop-color="#A74F2D"/>
    </linearGradient>
    <linearGradient id="deye-technika-icon-dark" x1="0" y1="0" x2=".18" y2="1">
      <stop offset="0" stop-color="#608778"/>
      <stop offset="0.48" stop-color="#3C6152"/>
      <stop offset="1" stop-color="#294237"/>
    </linearGradient>
    <linearGradient id="deye-technika-icon-light" x1="0" y1="0" x2=".18" y2="1">
      <stop offset="0" stop-color="#EEF3DD"/>
      <stop offset="0.53" stop-color="#C5DAC1"/>
      <stop offset="1" stop-color="#89AB96"/>
    </linearGradient>
    <clipPath id="deye-technika-face-cut" clipPathUnits="userSpaceOnUse">
      <path d="M-48-48H48V19.5H32Q25 28.5 19.2 28.5H-19.2Q-25 28.5-32 19.5H-48Z"/>
    </clipPath>
    <radialGradient id="deye-technika-sun" cx=".34" cy=".27" r=".78">
      <stop offset="0" stop-color="#FFE09A"/>
      <stop offset=".59" stop-color="#EAC16B"/>
      <stop offset="1" stop-color="#C49346"/>
    </radialGradient>
    <linearGradient id="deye-technika-gear" x1=".20" y1="0" x2=".67" y2="1">
      <stop offset="0" stop-color="#719282"/>
      <stop offset=".38" stop-color="#557669"/>
      <stop offset=".62" stop-color="#3C5F51"/>
      <stop offset="1" stop-color="#294337"/>
    </linearGradient>
  `;
  const technikaIcons = {
    solar: `
      <g stroke-width="1.08" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="-12.7" cy="-9.9" r="6.2" fill="url(#deye-technika-sun)" stroke="#A07035" stroke-width=".85"/>
        <path d="M-12.7-19.5v2.05m-6.8-.2 1.4 1.45m-4.45 6.3h2.1m.5 6.55 1.5-1.45m12.4-12.85-1.4 1.45m4.1 6.3h-2.05" fill="none" stroke="#A07035" stroke-width="1.1"/>
        <path d="M-12-3h27l6 16h-39z" fill="url(#deye-technika-icon-dark)" stroke="#2E4840"/>
        <path d="M-12.1-2.6h27.7" fill="none" stroke="#ECF5D9"/>
        <path d="M-14.6 5h32.7M-3.1-2l-2.3 14M6.5-2l2.2 14" fill="none" stroke="#C3D9CC"/>
        <path d="M1.5 13v6m-8 0h16" fill="none" stroke="#2E4840" stroke-width="2"/>
      </g>`,
    grid: `
      <g fill="none" stroke="#2E4840" stroke-width="1.12" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-22-9q4 3 9 .5q13 11 26 4q4 2.5 8.4 1.0                M-21-3.8q3 2.4 8 1.1q13 9.4 26 3.1q4 2.2 8 1.3" stroke="#38594F" stroke-width="1.16"/>
        <path d="M-13.7-19h2.9l.35 39h-3.7zM12.0-14h2.2l.3 31.5h-2.8z" fill="url(#deye-technika-icon-dark)" stroke-width=".8"/>
        <path d="M-13.05-16.7l-.25 33.4m25.8-28.6-.18 27.4" stroke="#BDCEC0" stroke-width=".85"/>
        <path d="M-19.8-12.8h15.4m-.8 0v2.8m-13.8-2.8v2.8m-1 2.7h14.1                M8.1-8.4h10.4m-.7 0v2.1m-8.9-2.1v2.1m.6 2.3h7.5" stroke-width="1.45"/>
        <path d="M-15.4 20.2h6.4m20-2.5h5.3" stroke-width="1.3"/>
      </g>`,
    battery: `
      <g stroke-width="1.08" stroke-linecap="round" stroke-linejoin="round">
        <rect x="-20" y="-9" width="38" height="19" rx="3.5" fill="url(#deye-technika-icon-light)" stroke="#2E4840" stroke-width="1.6"/>
        <path d="M18-3h4v7h-4z" fill="#486F59" stroke="#2E4840"/>
        <path d="M-16.6-6.3h31" fill="none" stroke="#F0F7E9"/>
        <path d="M2.3-6-6.6 1.5h6L-2.1 7l8.9-8.6H1z" fill="url(#deye-technika-icon-dark)"/>
      </g>`,
    house: `
      <g stroke-width="1.08" stroke-linecap="round" stroke-linejoin="round">
        <path d="M-15 1 0-12 15 1v19h-30z" fill="url(#deye-technika-icon-light)" stroke="#2E4840"/>
        <path d="m-21 1 21-18 9 7.7v-4.7h3.6v7.6L21 1l-2.4 2.6L0-12-18.6 3.6Z" fill="url(#deye-technika-icon-dark)" stroke="#2E4840"/>
        <path d="M-18.3 1.1 0-15l10.1 8.7" fill="none" stroke="#D3E2CD" stroke-opacity=".76"/>
        <path d="M-4 10h8v10h-8z" fill="#355447"/>
        <rect x="-12.7" y="3.2" width="6" height="7.2" rx=".65" fill="#E0ECE0" stroke="#3A6052" stroke-width="1"/>
        <path d="M-11.95 6.8h4.5" fill="none" stroke="#628477" stroke-width=".75"/>
        <rect x="6.7" y="3.2" width="6" height="7.2" rx=".65" fill="#E0ECE0" stroke="#3A6052" stroke-width="1"/>
        <path d="M7.45 6.8h4.5" fill="none" stroke="#628477" stroke-width=".75"/>
      </g>`,
  };
  const technikaGear = `
    <g>
      <path d="M-4.28 -11.75L-2.85 -12.17L-2.33 -15.02L-1.87 -15.69L1.87 -15.69L2.33 -15.02L2.85 -12.17L4.28 -11.75L5.64 -11.16L7.87 -13.00L8.65 -13.22L11.52 -10.82L11.44 -10.01L10.01 -7.49L10.83 -6.25L11.49 -4.92L14.39 -4.90L15.13 -4.57L15.78 -0.88L15.20 -0.32L12.48 0.70L12.31 2.17L11.97 3.61L14.17 5.50L14.52 6.22L12.65 9.46L11.85 9.52L9.11 8.56L8.03 9.58L6.84 10.46L7.32 13.32L7.12 14.10L3.61 15.38L2.95 14.91L1.48 12.41L0.00 12.50L-1.48 12.41L-2.95 14.91L-3.61 15.38L-7.12 14.10L-7.32 13.32L-6.84 10.46L-8.03 9.58L-9.11 8.56L-11.85 9.52L-12.65 9.46L-14.52 6.22L-14.17 5.50L-11.97 3.61L-12.31 2.17L-12.48 0.70L-15.20 -0.32L-15.78 -0.88L-15.13 -4.57L-14.39 -4.90L-11.49 -4.92L-10.83 -6.25L-10.01 -7.49L-11.44 -10.01L-11.52 -10.82L-8.65 -13.22L-7.87 -13.00L-5.64 -11.16Z M-5.55 0a5.55 5.55 0 1 1 11.1 0a5.55 5.55 0 1 1 -11.1 0Z" fill="#1C3A2F" fill-rule="evenodd" opacity=".13" transform="translate(.65 1.75)" stroke="#1C3A2F" stroke-width="1.45" stroke-linejoin="round"/>
      <path d="M-4.28 -11.75L-2.85 -12.17L-2.33 -15.02L-1.87 -15.69L1.87 -15.69L2.33 -15.02L2.85 -12.17L4.28 -11.75L5.64 -11.16L7.87 -13.00L8.65 -13.22L11.52 -10.82L11.44 -10.01L10.01 -7.49L10.83 -6.25L11.49 -4.92L14.39 -4.90L15.13 -4.57L15.78 -0.88L15.20 -0.32L12.48 0.70L12.31 2.17L11.97 3.61L14.17 5.50L14.52 6.22L12.65 9.46L11.85 9.52L9.11 8.56L8.03 9.58L6.84 10.46L7.32 13.32L7.12 14.10L3.61 15.38L2.95 14.91L1.48 12.41L0.00 12.50L-1.48 12.41L-2.95 14.91L-3.61 15.38L-7.12 14.10L-7.32 13.32L-6.84 10.46L-8.03 9.58L-9.11 8.56L-11.85 9.52L-12.65 9.46L-14.52 6.22L-14.17 5.50L-11.97 3.61L-12.31 2.17L-12.48 0.70L-15.20 -0.32L-15.78 -0.88L-15.13 -4.57L-14.39 -4.90L-11.49 -4.92L-10.83 -6.25L-10.01 -7.49L-11.44 -10.01L-11.52 -10.82L-8.65 -13.22L-7.87 -13.00L-5.64 -11.16Z M-5.55 0a5.55 5.55 0 1 1 11.1 0a5.55 5.55 0 1 1 -11.1 0Z" fill="#314D41" fill-rule="evenodd" transform="translate(.22 1.1)" stroke="#284237" stroke-width="1.25" stroke-linejoin="round"/>
      <path d="M-4.28 -11.75L-2.85 -12.17L-2.33 -15.02L-1.87 -15.69L1.87 -15.69L2.33 -15.02L2.85 -12.17L4.28 -11.75L5.64 -11.16L7.87 -13.00L8.65 -13.22L11.52 -10.82L11.44 -10.01L10.01 -7.49L10.83 -6.25L11.49 -4.92L14.39 -4.90L15.13 -4.57L15.78 -0.88L15.20 -0.32L12.48 0.70L12.31 2.17L11.97 3.61L14.17 5.50L14.52 6.22L12.65 9.46L11.85 9.52L9.11 8.56L8.03 9.58L6.84 10.46L7.32 13.32L7.12 14.10L3.61 15.38L2.95 14.91L1.48 12.41L0.00 12.50L-1.48 12.41L-2.95 14.91L-3.61 15.38L-7.12 14.10L-7.32 13.32L-6.84 10.46L-8.03 9.58L-9.11 8.56L-11.85 9.52L-12.65 9.46L-14.52 6.22L-14.17 5.50L-11.97 3.61L-12.31 2.17L-12.48 0.70L-15.20 -0.32L-15.78 -0.88L-15.13 -4.57L-14.39 -4.90L-11.49 -4.92L-10.83 -6.25L-10.01 -7.49L-11.44 -10.01L-11.52 -10.82L-8.65 -13.22L-7.87 -13.00L-5.64 -11.16Z M-5.55 0a5.55 5.55 0 1 1 11.1 0a5.55 5.55 0 1 1 -11.1 0Z" fill="url(#deye-technika-gear)" fill-rule="evenodd" stroke="#2E4840" stroke-width="1.0" stroke-linejoin="round"/>
      <path d="M-4.28 -11.75L-2.85 -12.17L-2.33 -15.02L-1.87 -15.69L1.87 -15.69L2.33 -15.02L2.85 -12.17L4.28 -11.75L5.64 -11.16L7.87 -13.00L8.65 -13.22L11.52 -10.82L11.44 -10.01L10.01 -7.49L10.83 -6.25L11.49 -4.92L14.39 -4.90L15.13 -4.57L15.78 -0.88L15.20 -0.32L12.48 0.70L12.31 2.17L11.97 3.61L14.17 5.50L14.52 6.22L12.65 9.46L11.85 9.52L9.11 8.56L8.03 9.58L6.84 10.46L7.32 13.32L7.12 14.10L3.61 15.38L2.95 14.91L1.48 12.41L0.00 12.50L-1.48 12.41L-2.95 14.91L-3.61 15.38L-7.12 14.10L-7.32 13.32L-6.84 10.46L-8.03 9.58L-9.11 8.56L-11.85 9.52L-12.65 9.46L-14.52 6.22L-14.17 5.50L-11.97 3.61L-12.31 2.17L-12.48 0.70L-15.20 -0.32L-15.78 -0.88L-15.13 -4.57L-14.39 -4.90L-11.49 -4.92L-10.83 -6.25L-10.01 -7.49L-11.44 -10.01L-11.52 -10.82L-8.65 -13.22L-7.87 -13.00L-5.64 -11.16Z" transform="scale(.91)" fill="none" stroke="#D2E6D3" stroke-width=".88" stroke-linejoin="round" opacity=".42"/>
      <path d="M-5.9 .7A5.95 5.95 0 0 1 4.65-3.72" fill="none" stroke="#223D33" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M5.59 2.05A5.95 5.95 0 0 1-4.55 3.86" fill="none" stroke="#C5DBCA" stroke-width="1.08" stroke-linecap="round" opacity=".66"/>
    </g>
  `;
  const technikaBackground = "data:image/png;base64,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";

  function dialIcon(icon) {
    const technika = icon === "dual" ? [-7, 7].map(x => `<g transform="translate(${x} 0)">
      <rect x="-5.3" y="-9" width="10.6" height="24" rx="1.8" fill="url(#deye-technika-icon-light)" stroke="#2e4840" stroke-width="1.1"/>
      <path d="M-2-11h4v2h-4zM-1 0l-3 5.6h3l-.9 4.5 4.6-6.1H.1L1.1 0z" fill="url(#deye-technika-icon-dark)"/>
    </g>`).join("") : technikaIcons[icon];
    // Optical bounds stay within each dial; the battery leaves room above for SOC.
    const anmaIcons={
      solar:`<circle cx="-13" cy="-15" r="6" fill="#ff8a32" stroke="none"/>
        <path d="M-13-26v2M-24-15h2M-21-23l2 2M-5-23l-2 2M-2-15h-2" stroke="#ff8a32"/>
        <path d="M-19-4H19L24 16H-24Z" fill="#303840"/>
        <path d="M-7-4l-2 20M7-4l2 20M-21 6h42" stroke="#ff8a32" stroke-width="1.3"/>
        <path d="M0 16v7M-10 23h20"/>`,
      grid:`<path d="M-5-24H5L16 23H-16Z" fill="#303840"/>
        <path d="M-17-12H17M-23 0H23M-20 23H20"/>
        <path d="M-7-12L10 0M7-12L-10 0M-10 0L16 23M10 0L-16 23" stroke="#ff8a32" stroke-width="1.5"/>
        <path d="M-17-12v5M17-12v5M-23 0v5M23 0v5" stroke="#ff8a32"/>`,
      house:`<path d="M-19-2V21H19V-2L0-18Z" fill="#303840"/>
        <path d="M-25 1L0-22 25 1" stroke="#ff8a32" stroke-width="2.7"/>
        <path d="M12-13v-8h6v14"/>
        <rect x="-12" y="2" width="8" height="8" rx="1" fill="#ff8a32" stroke="none"/>
        <path d="M4 21V3h9v18M-22 24h44"/>`,
      battery:`<rect x="-23" y="-5" width="43" height="22" rx="4" fill="#303840"/>
        <path d="M22 2h3v8h-3" stroke="#ff8a32"/>
        <rect x="-19" y="-1" width="8" height="14" rx="1.5" fill="#ff8a32" stroke="none"/>
        <rect x="-8" y="-1" width="8" height="14" rx="1.5" fill="#ff8a32" fill-opacity=".6" stroke="none"/>
        <path d="M10-1L5 6h5l-2 7 8-9h-5l2-5Z" fill="#ff8a32" stroke="none"/>`,
      dual:`<rect x="-19" y="-8" width="16" height="25" rx="3" fill="#303840"/><rect x="3" y="-8" width="16" height="25" rx="3" fill="#303840"/>
        <path d="M-14-11h6M8-11h6M-10-3l-5 8h5l-2 7M12-3L7 5h5l-2 7" stroke="#ff8a32"/>`
    };
    return `<g class="classic-only">${icons[icon]}</g><g class="technika-only" aria-hidden="true">${technika}</g><g class="anma-only" aria-hidden="true" fill="none" stroke="#d4dce2" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${anmaIcons[icon]||anmaIcons.house}</g>`;
  }

  function gauge({ key, label, icon, x, y }) {
    const isBattery = key === "battery_power";
    const track = arc(0, 1);
    return `<g class="gauge" data-gauge="${key}" transform="translate(${x} ${y})" role="button" tabindex="0" aria-label="${label}" aria-controls="details-screen">
      <title>${label}</title>
      <rect class="hit" fill-opacity="0" x="-54" y="-47" width="108" height="107" rx="4"/>
      <circle class="technika-only" r="36.65" fill="url(#deye-technika-face)" stroke="#ffffff" stroke-width=".55" stroke-opacity=".569" clip-path="url(#deye-technika-face-cut)" aria-hidden="true"/>
      <path class="technika-only" d="${track}" fill="none" stroke="#faf6eb" stroke-width="11.8" stroke-linecap="round" aria-hidden="true"/>
      <path class="track" d="${track}"/>
      <path class="fill" stroke="url(#deye-lcd-arc)"/>
      <g class="symbol ${isBattery ? "single-battery" : ""}" transform="translate(0 ${isBattery ? "11" : "0"})">${dialIcon(icon)}</g>
      ${isBattery ? `<g class="dual-battery">
        <g class="symbol" transform="translate(0 4) scale(1.45)">${dialIcon("dual")}</g>
        <text class="soc-side" x="-43" y="-33" data-soc-left="">—</text>
        <text class="soc-side" x="43" y="-33" data-soc-right="">—</text>
      </g><text class="soc single-battery" x="0" y="-10" data-soc="">—</text>` : ""}
      <text class="scale" x="-46" y="46" text-anchor="middle">0</text>
      <text class="scale" x="47" y="46" text-anchor="middle" data-scale="">${defaultModel.toFixed(1)}</text>
      <text class="value" x="0" y="46">—</text>
      <text class="unit" x="0" y="57">KW</text>
    </g>`;
  }

  function flowArrows([x, y], bendX, direction) {
    // Use the same endpoint as the wire, with the point facing away from its nearest bend.
    const sign = Math.sign(x - bendX);
    const base = x - sign * 7;
    const tail = x - sign * 8;
    const notch = x - sign * 5.6;
    return `<path class="classic-only arrow ${direction}" d="M${base} ${y - 3}L${x} ${y}L${base} ${y + 3}Z"/>
      <path class="technika-only technika-arrow ${direction}" d="M${x} ${y}L${tail} ${y - 3.8}L${notch} ${y}L${tail} ${y + 3.8}Z"/>`;
  }

  function technikaParticle(path, direction, index) {
    const keyPoints = direction === "forward" ? "0;1" : "1;0";
    const begin = (index * 0.04 - 0.16).toFixed(2);
    return `<g class="technika-only technika-particle ${direction}" opacity="0" aria-hidden="true">
      <circle r="4.65" class="particle-halo" opacity=".16"/>
      <circle r="3.65" class="particle-halo" opacity=".25"/>
      <circle r="2.92" class="particle-edge"/>
      <circle r="2.23" class="particle-body"/>
      <circle r="1.02" cx="-.61" cy="-.69" fill="#f6fcea"/>
      <animateMotion begin="${begin}s" dur="2s" path="${path}" calcMode="linear" keyTimes="0;1" keyPoints="${keyPoints}" repeatCount="indefinite"/>
      <animate begin="${begin}s" dur="2s" attributeName="opacity" values=".67;1;1;.67" keyTimes="0;.07;.94;1" repeatCount="indefinite"/>
    </g>`;
  }

  function wire({ name, from, bendX, to }, index) {
    const path = `M${from.join(" ")}H${bendX}V${to[1]}H${to[0]}`;
    return `<g class="wire" data-wire="${name}" data-flow="off">
      <path class="wire-track" d="${path}"/>
      ${flowArrows(to, bendX, "forward")}${flowArrows(from, bendX, "backward")}
      <circle class="classic-only dot forward" r="2.8"><animateMotion dur="2s" path="${path}" repeatCount="indefinite"/></circle>
      <circle class="classic-only dot backward" r="2.8"><animateMotion dur="2s" path="${path}" repeatCount="indefinite" calcMode="linear" keyTimes="0;1" keyPoints="1;0"/></circle>
      ${technikaParticle(path, "forward", index)}${technikaParticle(path, "backward", index)}
      ${name === "grid" ? `<g class="grid-outage" role="img" aria-label="Мережу від’єднано">
        <text x="259" y="77">Off grid</text>
        <path d="M254 102h10v13h-10z" fill="${screenWhite}"/>
        <path d="M255 103l8 11m0-11-8 11" fill="none" stroke="currentColor" stroke-width="2.3"/>
      </g>` : ""}
    </g>`;
  }

  function onActivate(element, action) {
    element.addEventListener("click", action);
    element.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      action();
    });
  }

  const measurementMarkup = '<span data-metric-value>—</span><small data-metric-unit></small>';

  function breakdownMarkup({ key, title, columns, fields }) {
    return `<div class="details-breakdown" data-breakdown="${key}" hidden>
      <table>
        <caption>${title}</caption>
        <thead><tr><th scope="col">Показ</th>${columns.map(({ label }) => `<th scope="col">${label}</th>`).join("")}</tr></thead>
        <tbody>
          ${fields.map(({ key: metric, label }) => `<tr>
            <th scope="row">${label}</th>
            ${columns.map(({ prefix }) => `<td data-reading="${prefix}_${metric}">${measurementMarkup}</td>`).join("")}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
  }

  function measurementNodes(row, field) {
    return { ...field, row, value: row.querySelector("[data-metric-value]"), unitText: row.querySelector("[data-metric-unit]") };
  }

  function renderMeasurement({ key, unit, row, value, unitText }, id, states, invert) {
    const entity = states[id];
    const unitName = entity?.attributes?.unit_of_measurement;
    const power = key === "power";
    const amount = power ? signed(watts(entity), invert) : reading(entity);
    value.textContent = amount === null ? "—" : measurementFormat.format(power ? amount / 1000 : amount);
    unitText.textContent = amount === null ? "" : power ? unit : measurementUnits[unitName] ?? unitName ?? unit;
    row.title = amount === null ? (id ? "Показ недоступний" : "Сутність не вибрано") : "";
  }

  function detailsMarkup() {
    return `<section class="details-screen" id="details-screen" aria-labelledby="details-title" hidden>
      <header class="details-header">
        <button type="button" class="details-back" aria-label="Назад" title="Назад">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l-6 6 6 6m-6-6h12"/></svg>
        </button>
        <h2 id="details-title" tabindex="-1"></h2><button type="button" class="details-prev" aria-label="Previous page">‹</button><span class="details-page-number"></span><button type="button" class="details-next" aria-label="Next page">›</button>
      </header>
      <div class="deye-reference-readings"></div><dl class="details-readings">
        ${measurementFields.map(({ key, label }) => `<div class="details-metric" data-metric="${key}">
          <dt>${label}</dt>
          <dd>${measurementMarkup}</dd>
        </div>`).join("")}
      </dl>
      ${detailBreakdowns.map(breakdownMarkup).join("")}
      <div class="deye-detail-extra"></div>
      <section class="details-history" aria-labelledby="details-history-title">
        <h3 id="details-history-title">Power / Energy</h3>
        <div class="deye-history-tabs">${['Power','Day','Month','Year','Total'].map(period=>`<button type="button" data-history-period="${period}">${period}</button>`).join('')}</div>
        <p class="history-message" role="status"></p>
        <div class="history-chart" hidden></div>
      </section>
    </section>`;
  }

  function dateFormatter(locale, options, timeZone) {
    try {
      return new Intl.DateTimeFormat(locale, { ...options, timeZone });
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      const alias = timeZone === "Europe/Kyiv" ? "Europe/Kiev" : undefined;
      return new Intl.DateTimeFormat(locale, { ...options, timeZone: alias });
    }
  }

  function historyPoints(rows, start, end, defaultUnit, invert) {
    if (!Array.isArray(rows)) return [];
    let factor = powerFactor(defaultUnit);
    const points = [];
    for (const row of rows) {
      const stamp = row.lu ?? row.lc ?? row.last_updated ?? row.last_changed;
      const timestamp = typeof stamp === "number" ? stamp * 1000 : Date.parse(stamp);
      if (!Number.isFinite(timestamp) || timestamp > end) continue;
      const unit = (row.a ?? row.attributes)?.unit_of_measurement;
      if (unit) factor = powerFactor(unit);
      const value = numericState(row.s ?? row.state);
      const point = { time: Math.max(start, timestamp), value: signed(value === null ? null : value * factor / 1000, invert) };
      if (points.at(-1)?.time === point.time) points.pop();
      points.push(point);
    }
    return points;
  }

  function plotSamples(points, start, end, columns) {
    const samples = [];
    let bucket;
    // Keep extremes as well as the first and last sample within each plot column.
    const flush = () => {
      if (!bucket) return;
      const retained = new Set([bucket.first, bucket.low, bucket.high, bucket.last]);
      samples.push(...[...retained].sort((left, right) => left.time - right.time));
      bucket = null;
    };
    for (const point of points) {
      if (point.value === null) {
        flush();
        if (samples.at(-1)?.value !== null) samples.push(point);
        continue;
      }
      const column = Math.floor((point.time - start) * columns / (end - start));
      if (bucket?.column !== column) {
        flush();
        bucket = { column, first: point, low: point, high: point, last: point };
      }
      if (point.value < bucket.low.value) bucket.low = point;
      if (point.value > bucket.high.value) bucket.high = point;
      bucket.last = point;
    }
    flush();
    return samples;
  }

  function historyPlot(points, start, end, zone) {
    const left = 45, right = 379, top = 16, bottom = 121;
    const samples = plotSamples(points, start, end, right - left);
    let low = 0, high = 0;
    for (const { value } of samples) {
      if (value === null) continue;
      low = Math.min(low, value);
      high = Math.max(high, value);
    }
    if (low === high) high = 1;
    const interval = (high - low) / 3;
    const magnitude = 10 ** Math.floor(Math.log10(interval));
    const step = [1, 2, 2.5, 5, 10].find(size => interval <= size * magnitude) * magnitude;
    const lowTick = Math.floor(low / step), highTick = Math.ceil(high / step);
    const x = (time) => (left + (time - start) * (right - left) / (end - start)).toFixed(1);
    const y = (value) => (bottom - (value / step - lowTick) * (bottom - top) / (highTick - lowTick)).toFixed(1);
    const formatTime = dateFormatter("uk-UA", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, zone);
    const horizontal = Array.from({ length: highTick - lowTick + 1 }, (_, index) => {
      const tick = lowTick + index;
      const value = tick * step;
      return `<path class="history-rule${tick === 0 ? " history-zero" : ""}" d="M${left} ${y(value)}H${right}"/>
        <text x="${left - 5}" y="${y(value)}" dy=".34em" text-anchor="end">${chartFormat.format(value)}</text>`;
    }).join("");
    const vertical = Array.from({ length: 5 }, (_, index) => {
      const time = start + index * (end - start) / 4;
      return `<path class="history-rule" d="M${x(time)} ${top}V${bottom}"/>
        <text x="${x(time)}" y="142" text-anchor="${index === 0 ? "start" : index === 4 ? "end" : "middle"}">${formatTime.format(time)}</text>`;
    }).join("");
    const trace = [];
    let previous = null;
    for (const { time, value } of samples) {
      const position = x(time);
      if (previous !== null) trace.push(`H${position}`);
      if (value !== null) {
        trace.push(previous === null ? `M${position} ${y(value)}` : `V${y(value)}`);
      }
      previous = value;
    }
    if (previous !== null) trace.push(`H${right}`);
    return `<svg viewBox="0 0 390 150" role="img" aria-label="Графік потужності за останні 24 години у кіловатах">
      <text x="4" y="9">кВт</text>
      ${horizontal}${vertical}
      <path class="history-trace" d="${trace.join(" ")}"/>
    </svg>`;
  }

  function settingsButton(name, label) {
    return `<button class="settings-button" type="${name === "apply" ? "submit" : "button"}" data-settings-button="${name}" aria-label="${label}" title="${label}">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${settingsButtonIcons[name]}"/></svg>
    </button>`;
  }

  function settingNumber(name, label, layout = "") {
    return `<label class="lcd-setting lcd-number ${layout}" data-setting="${name}">
      <span class="lcd-label">${label}</span>
      <span class="lcd-number-value">
        <input type="text" inputmode="decimal" autocomplete="off" placeholder="—" disabled/>
        <span class="lcd-unit"></span>
      </span>
    </label>`;
  }

  function settingCheck(name, label, option = "", type = "checkbox") {
    const value = option ? ` name="${name}" value="${option}"` : "";
    return `<label class="lcd-setting lcd-check" data-setting="${name}">
      <input type="${type}"${value} disabled/><span>${label}</span>
    </label>`;
  }

  function settingsPageContent(menu, page) {
    if (extra.pages[`${menu}:${page}`]) return extra.pages[`${menu}:${page}`];
    const choice = (name, label, option) => settingCheck(name, label, option, "radio");
    if (menu === "battery" && page === 0) return `
      <div class="lcd-battery-mode">
        <fieldset>
          <legend>Batt Mode</legend>
          ${choice("battery_mode", "Lithium", "lithium")}
          ${choice("battery_mode", "Use Batt V", "voltage")}
          ${choice("battery_mode", "Use Batt %", "soc")}
          ${choice("battery_mode", "No Batt", "none")}
          ${choice("battery_mode", "solar supply only", "solar")}
        </fieldset>
        <div class="lcd-battery-limits">
          ${settingNumber("battery_capacity", "Batt Capacity")}
          ${settingNumber("battery_max_charging_current", "Max A Charge")}
          ${settingNumber("battery_max_discharging_current", "Max A Discharge")}
        </div>
      </div>
      <div class="lcd-pair lcd-page-bottom">
        ${settingCheck("battery_activate", "Activate Battery")}
        ${settingCheck("battery_disable_float_charge", "Disable Float Charge")}
      </div>`;
    if (menu === "battery") return `
      <div class="lcd-charge">
        <span>Start</span>
        ${settingNumber("generator_start", "Gen Start", "lcd-value-only")}
        ${settingNumber("grid_start", "Grid Start", "lcd-value-only")}
        <span>A</span>
        ${settingNumber("generator_charge_current", "Gen · струм заряду", "lcd-value-only")}
        ${settingNumber("grid_charge_current", "Grid · струм заряду", "lcd-value-only")}
        <span aria-hidden="true"></span>
        ${settingCheck("generator_charge", "Gen Charge")}
        ${settingCheck("grid_charge", "Grid Charge")}
        <span aria-hidden="true"></span>
        ${settingCheck("generator_signal", "Gen Signal")}
        ${settingCheck("grid_signal", "Grid Signal")}
      </div>
      <div class="lcd-page-bottom">
        ${settingCheck("generator_force", "Gen Force")}
      </div>${extra.batteryExtra}`;
    if (menu === "work" && page === 0) return `
      <div class="lcd-work-modes" role="group" aria-label="Work Mode">
        ${choice("work_mode", "Selling First", "sell")}
        ${settingNumber("max_solar_power", "Max Solar Power", "lcd-value-first")}
        ${choice("work_mode", "Zero Export To Load", "load")}
        <div class="deye-work-sell">${settingCheck("solar_sell", "Solar Sell")}${extra.workCt}</div>
        ${choice("work_mode", "Zero Export To CT", "ct")}
        ${settingCheck("solar_sell", "Solar Sell")}
      </div>
      <div class="lcd-pair lcd-export">
        ${settingNumber("max_sell_power", "Max Sell Power")}
        ${settingNumber("zero_export_power", "Zero-export Power")}
      </div>
      <div class="lcd-pattern" role="group" aria-label="Energy pattern">
        <span>Energy pattern</span>
        ${choice("energy_pattern", "Batt First", "battery")}
        ${choice("energy_pattern", "Load First", "load")}
      </div>
      <div class="lcd-pair lcd-page-bottom">
        ${settingCheck("grid_peak_shaving", "Grid Peak Shaving")}
        ${settingNumber("grid_peak_shaving_power", "Power", "lcd-value-first")}
      </div>`;
    if (menu === "work") return `
      <div class="lcd-tou">${settingCheck("time_of_use", "Time Of Use")}</div>
      <p class="lcd-placeholder">У процесі розробки</p>`;
    if (menu === "gen") return `
      <div class="lcd-pair">
        ${settingCheck("generator_peak_shaving", "Gen Peak Shaving")}
        ${settingNumber("generator_peak_shaving_power", "Power", "lcd-value-first")}
      </div>
      <p class="lcd-placeholder">У процесі розробки</p>`;
    return '<p class="lcd-placeholder">У процесі розробки</p>';
  }

  function settingsMarkup() {
    return `<section class="settings" id="settings-screen" aria-labelledby="settings-title" hidden>
      <header class="settings-header"><h2 id="settings-title" tabindex="-1">System Setup</h2></header>
      <div class="settings-menu">
        <div class="settings-tiles">
          ${settingsMenus.map(({ id, title }) => `<button class="settings-tile" type="button" data-settings-menu="${id}">${title}</button>`).join("")}
        </div>
        <button class="settings-back" type="button" data-back-to-screen>‹ Назад</button>
      </div>
      <form class="settings-body" hidden>
        <div class="settings-main"><div class="deye-fit-content">
          ${settingsMenus.flatMap(({ id, pages }) => (pages ?? [""]).map((_, index) => `
            <section class="settings-page" data-settings-page="${id}:${index}" hidden>
              ${settingsPageContent(id, index)}
            </section>`)).join("")}
          <div class="settings-feedback">
            <p class="settings-hint" data-view-only hidden>Лише перегляд · зміни доступні адміністратору HA</p>
            <p class="settings-hint" data-no-settings hidden>Під’єднай сутності керування в редакторі картки.</p>
            <p class="settings-hint" data-settings-message role="status" hidden></p>
          </div>
        </div>
        </div><div class="settings-controls">
          <div class="settings-nav">
            ${settingsButton("up", "Попередня сторінка")}
            <span class="settings-page-name" data-settings-page-name></span>
            ${settingsButton("down", "Наступна сторінка")}
          </div>
          <div class="settings-actions">
            ${settingsButton("cancel", "Назад · скасувати незастосовані зміни")}
            ${settingsButton("apply", "Застосувати зміни сторінки")}
          </div>
        </div>
      </form>
    </section>`;
  }

  function aboutMarkup(signature = false) {
    const id = signature ? "about-signature" : "about-dialog";
    const title = "ANMA Electric";
    return `<dialog class="about" id="${id}" aria-labelledby="${id}-title">
      <form class="about-close" method="dialog">
        <button type="submit" aria-label="Закрити" autofocus><span aria-hidden="true">×</span></button>
      </form>
      <div class="about-content">
        <p class="about-version">Deye · LCD · ${version}</p>
        <h2 id="${id}-title">${title}</h2>
        <p class="about-message">Картка Deye LCD для Home Assistant від каналу ANMA Electric.</p>
        <div class="about-links">
          <a href="https://www.youtube.com/@AntonBABENKO55" target="_blank" rel="noopener noreferrer">Канал на YouTube</a>
          <a href="${supportUrl}" target="_blank" rel="noopener noreferrer">Підтримати через monobank</a>
        </div>
        <figure class="about-support">
          <img alt="QR monobank · ANMA Electric" src="data:image/png;base64,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">
        </figure>
      </div>
    </dialog>`;
  }

  function settingValue(entity, domain) {
    if (domain === "time") return /^\d{2}:\d{2}(:\d{2})?$/.test(entity?.state||"") ? entity.state.slice(0,5) : null;
    if (domain === "number") return reading(entity);
    if (domain === "select") {
      return Array.isArray(entity?.attributes?.options) && entity.attributes.options.includes(entity.state)
        ? entity.state : null;
    }
    if (entity?.state === "on") return true;
    if (entity?.state === "off") return false;
    return null;
  }

  function optionKey(value) {
    return typeof value === "string" ? value.trim().toLowerCase().replace(/[._-]/g, " ").replace(/\s+/g, " ") : "";
  }

  function optionMatches(target, choices) {
    if (!target) return {};
    const options = target.entity.attributes.options;
    return Object.fromEntries(Object.entries(choices).map(([key, aliases]) => {
      const keys = aliases.map(optionKey);
      return [key, options.find(option => keys.includes(optionKey(option)))];
    }).filter(([, option]) => option !== undefined));
  }

  function selectedChoice(target, options) {
    return Object.keys(options).find(key => options[key] === target?.value) ?? null;
  }

  const unavailableSetting = { current: null, targets: [] };

  function selectControl(target, choices) {
    const options = optionMatches(target, choices);
    return {
      current: selectedChoice(target, options),
      targets: target ? [target] : [],
      choices: Object.keys(options),
      writes: value => [{ target, value: options[value] }],
    };
  }

  function sameSetting(first, second) {
    if (typeof first !== "number" || typeof second !== "number") return first === second;
    return Math.abs(first - second) < 1e-8;
  }

  function validateSettingNumber(text, attributes) {
    let value = text;
    if (typeof text === "string") {
      const normalized = text.trim().replace(",", ".");
      value = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
    }
    if (!Number.isFinite(value)) throw new Error("Введи число.");
    const { min, max, step } = attributes;
    const hasMin = Number.isFinite(min);
    const hasMax = Number.isFinite(max);
    if ((hasMin && value < min) || (hasMax && value > max)) {
      const range = hasMin && hasMax ? `від ${min} до ${max}` : hasMin ? `від ${min}` : `до ${max}`;
      throw new Error(`Допустиме значення ${range}.`);
    }
    if (Number.isFinite(step) && step > 0) {
      const steps = (value - (hasMin ? min : 0)) / step;
      if (Math.abs(steps - Math.round(steps)) > 1e-7) throw new Error(`Допустимий крок ${step}.`);
    }
    return value;
  }

  const styles = extra.css + `
    .deye-table{color:var(--lcd-ink)}.deye-detail-extra{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:9px;font-size:13px}.deye-detail-extra>div{display:flex;flex-direction:column;gap:4px;border-bottom:1px solid #ffffff40;padding:5px}.deye-history-tabs{display:flex;flex-wrap:wrap;gap:6px;padding:7px}.deye-history-tabs button{background:#cbdcc3;color:#18363c;border:1px solid #5f8085;font:inherit;padding:6px 12px;cursor:pointer}.deye-history-tabs button[aria-pressed=true]{background:#1b7184;color:white}.status,.status-text{cursor:pointer}

    :host { display:block; }
    ha-card { display:block; overflow:hidden; border:1px solid #303840; border-radius:12px; background:#171b1d; padding:6px; }
    .screen { display:block; width:100%; height:auto; background:${screenWhite}; border-radius:5px; font-family:Roboto,Arial,sans-serif; }
    text { font-variant-numeric:tabular-nums; }
    .top { fill:#142b38; font-size:15px; font-weight:600; }
    .track,.fill { fill:none; stroke-width:9.7; stroke-linecap:butt; }
    .track { stroke:#101415; }
    .symbol { color:#101415; }
    .scale { fill:#24404e; font-size:13px; }
    .value,.unit,.soc,.soc-side,.parallel { text-anchor:middle; }
    .value { fill:#165f49; font-size:16px; font-weight:600; }
    .value[data-unavailable] { fill:#626a68; }
    .unit { fill:#17363c; font-size:9.5px; font-weight:600; }
    .soc { fill:#229d56; font-size:16px; font-weight:600; }
    .soc-side,.parallel { fill:#285e51; font-size:10px; font-weight:600; }
    .dual-battery,.screen[data-battery="dual"] .single-battery { display:none; }
    .screen[data-battery="dual"] .dual-battery { display:inline; }
    .status { stroke:#2d8852; stroke-width:2.9; }
    .status-text { fill:#235f49; font-size:15px; font-weight:600; text-anchor:middle; }
    .status-text[data-on] { font-size:18px; }
    .screen[data-status="missing"] .status { stroke:#7b8687; }
    .screen[data-status="missing"] .status-text { fill:#626a68; }
    .screen[data-status="fault"] .status { stroke:#bc3b2b; }
    .screen[data-status="fault"] .status-text { fill:#a22f23; }
    .wire-track { stroke:#245163; stroke-width:1.25; stroke-dasharray:1.2 1.65; fill:none; }
    .arrow { fill:#131716; }
    .dot { fill:#43bd47; }
    .wire .forward,.wire .backward { visibility:hidden; }
    .wire[data-flow="forward"] .forward,.wire[data-flow="backward"] .backward { visibility:visible; }
    .grid-outage { display:none; color:#c32536; }
    .grid-outage text { fill:currentColor; font-size:11px; font-weight:650; text-anchor:middle; }
    .wire[data-disconnected] .grid-outage { display:inline; }
    .screen [role="button"] { cursor:pointer; }
    .screen [role="button"]:focus-visible { outline:none; }
    .screen [role="button"]:focus-visible .hit { stroke:#346e30; stroke-width:1; stroke-dasharray:3 2; }
    [data-clock-tap],[data-open-about] { touch-action:manipulation; }
    .about {
      box-sizing:border-box; width:min(480px,calc(100% - 24px)); max-height:calc(100% - 24px);
      padding:0; border:1px solid #745032; border-radius:16px; overflow:auto;
      color:#f2f4f6; background:#24282e; color-scheme:dark; box-shadow:0 20px 60px #0009;
      font:400 15px/1.5 Roboto,Arial,sans-serif; text-align:start;
    }
    .about::backdrop { background:#090d13d9; }
    .about-close { position:absolute; top:10px; right:10px; margin:0; }
    .about-close button {
      display:grid; place-items:center; width:44px; height:44px; padding:0; border:1px solid #ff8a32;
      border-radius:50%; color:#f2f4f6; background:#24282e; font:400 28px/1 Roboto,Arial,sans-serif; cursor:pointer;
    }
    .about-close button:focus { outline:none; box-shadow:0 0 0 2px #24282e,0 0 0 4px #ff8a32; }
    .about-close button:focus:not(:focus-visible) { box-shadow:none; }
    .about-content {
      box-sizing:border-box; padding:20px 24px 24px; padding:clamp(16px,5vw,26px);
      border-top:2px solid #ff8a32;
    }
    .about-content h2 { margin:2px 0 1px; font-size:32px; font-size:clamp(28px,8vw,40px); line-height:1.08; }
    .about-version { margin:0; color:#ff9a4e; font-size:13px; font-weight:700; }
    .about-message { margin:10px 0 16px; color:#cbd1d8; }
    .about-content h2,.about-version { padding-inline-end:47px; }
    .about-links { display:flex; flex-wrap:wrap; gap:8px; }
    .about-links a {
      display:inline-flex; align-items:center; justify-content:center; min-height:36px; padding:4px 10px;
      border-radius:6px; color:#181c21; background:#ff8a32; font-weight:650; text-decoration:none;
    }
    .about-links a:focus-visible { outline:2px solid #ffac70; outline-offset:3px; }
    .about-support { display:grid; justify-items:start; gap:5px; margin:16px 0 0; color:#cbd1d8; }
    .about-support img { display:block; width:min(180px,100%); height:auto; padding:12px; background:white; box-sizing:border-box; border-radius:8px; }
    @media (prefers-reduced-motion:reduce) { .wire .dot { display:none; } }
    [hidden] { display:none !important; }
    .settings {
      --lcd-ink:#f4faff;
      --lcd-line:#aeedfc;
      --lcd-field:#def4ed;
      --lcd-dark:#12284e;
      --lcd-button:#08469744;
      --lcd-hover:#2169a1;
      --lcd-hint:#e4f6ff;
      --lcd-focus:#ffdf84;
      display:flex; flex-direction:column; box-sizing:border-box; inline-size:100%; min-inline-size:0;
      min-block-size:256px; aspect-ratio:400 / 268; border-radius:5px; overflow:hidden; container-type:inline-size;
      background:linear-gradient(163deg,#2d177f 4%,#31309f 47%,#14618b 83%,#087990);
      color:var(--lcd-ink); color-scheme:light; font:400 14px/1.25 Roboto,Arial,sans-serif;
    }
    .settings-header {
      display:flex; align-items:center; flex:none; padding:5px clamp(8px,2.7cqi,20px);
      border-bottom:2px solid var(--lcd-line); background:linear-gradient(180deg,#106a9e,#166594);
    }
    .settings-header h2 {
      margin:0; font-size:clamp(16px,4.8cqi,32px); overflow-wrap:anywhere;
    }
    .settings-menu {
      flex:1; display:flex; flex-direction:column; justify-content:center; min-inline-size:0;
      min-block-size:0; overflow:auto;
      padding:clamp(8px,3.2cqi,24px);
    }
    .settings-tiles {
      display:grid; flex:1; gap:clamp(5px,2.2cqi,16px);
      grid-template-columns:minmax(0,.84fr) repeat(2,minmax(0,1fr));
      grid-template-rows:repeat(3,minmax(0,1fr));
      grid-template-areas:"battery work smart" "battery grid gen" "basic advanced device";
    }
    .settings-tile[data-settings-menu="battery"] { grid-area:battery; }
    .settings-tile[data-settings-menu="work"] { grid-area:work; }
    .settings-tile[data-settings-menu="smart"] { grid-area:smart; }
    .settings-tile[data-settings-menu="grid"] { grid-area:grid; }
    .settings-tile[data-settings-menu="gen"] { grid-area:gen; }
    .settings-tile[data-settings-menu="basic"] { grid-area:basic; }
    .settings-tile[data-settings-menu="advanced"] { grid-area:advanced; }
    .settings-tile[data-settings-menu="device"] { grid-area:device; }
    .settings-tile,.settings-button,.settings-back {
      box-sizing:border-box; min-inline-size:0; color:var(--lcd-ink); background:var(--lcd-button);
      border:1.5px solid var(--lcd-line); border-radius:4px; font:inherit;
      cursor:pointer; touch-action:manipulation; overflow-wrap:anywhere;
    }
    .settings-tile {
      min-block-size:36px; padding:4px; font-size:clamp(12px,3.75cqi,25px); font-weight:600;
    }
    .settings-back {
      align-self:start; margin-top:8px; padding:4px 9px; min-height:30px; font-size:clamp(11px,3cqi,16px);
    }
    .settings-tile:hover,.settings-button:enabled:hover,.settings-back:hover { background:var(--lcd-hover); }
    .settings-body {
      flex:1; box-sizing:border-box; inline-size:100%; min-inline-size:0; min-block-size:0;
      display:grid; grid-template-columns:minmax(0,1fr) clamp(39px,12cqi,74px); gap:clamp(4px,1.6cqi,10px);
      align-items:stretch; margin:0; padding:clamp(5px,1.8cqi,13px);
    }
    .settings-main { display:flex; flex-direction:column; min-inline-size:0; min-block-size:0; overflow:auto; }
    .settings-page {
      display:flex; flex:1; flex-direction:column; min-inline-size:0;
      gap:clamp(4px,2.1cqi,17px); padding:clamp(2px,1.2cqi,8px);
      font-size:clamp(12px,3.1cqi,21px); overflow-wrap:anywhere;
    }
    .lcd-pair,.lcd-battery-mode,.lcd-work-modes,.lcd-charge,.lcd-pattern {
      display:grid; align-items:center; gap:clamp(3px,1.2cqi,10px);
      grid-template-columns:repeat(2,minmax(0,1fr));
    }
    .lcd-battery-mode { grid-template-columns:minmax(0,.77fr) minmax(0,1.23fr); align-items:start; }
    .lcd-battery-mode fieldset { min-inline-size:0; margin:0; padding:0; border:0; }
    .lcd-battery-mode legend { margin:0 0 2px; padding:0; font-weight:700; }
    .lcd-battery-limits { display:grid; gap:3px; padding-top:1.4em; }
    .lcd-charge,.lcd-pattern { grid-template-columns:minmax(0,.42fr) repeat(2,minmax(0,1fr)); }
    .lcd-pattern { grid-template-columns:repeat(3,minmax(0,1fr)); }
    .lcd-work-modes { grid-template-columns:minmax(0,1.08fr) minmax(0,.92fr); }
    .lcd-export .lcd-number { font-size:.94em; }
    .lcd-page-bottom { margin-top:auto; }
    .lcd-tou { align-self:center; }
    .lcd-placeholder { margin:auto 0; padding:12px 4px; text-align:center; color:var(--lcd-hint); }
    .lcd-setting { min-inline-size:0; }
    .lcd-number { display:flex; align-items:center; gap:3px; }
    .lcd-number-value {
      display:flex; align-items:center; gap:2px; inline-size:clamp(41px,15cqi,120px);
      flex:none; min-inline-size:0;
    }
    .lcd-number input {
      box-sizing:border-box; min-inline-size:0; inline-size:100%; min-block-size:26px; padding:2px 2px;
      border:1px solid #ffffffe0; border-radius:2px; background:var(--lcd-field); color:var(--lcd-dark);
      font:inherit; text-align:center; font-variant-numeric:tabular-nums;
      flex:1 1 0;
    }
    .lcd-number input:disabled { opacity:1; }
    .lcd-number input::placeholder { color:#536163; }
    .lcd-unit { font-size:.8em; flex:none; max-inline-size:3em; }
    .lcd-unit:empty { display:none; }
    .lcd-value-first .lcd-number-value { order:-1; }
    .lcd-value-only .lcd-number-value { inline-size:100%; }
    .lcd-value-only .lcd-label {
      position:absolute; inline-size:1px; block-size:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap;
    }
    .lcd-check { display:flex; align-items:center; min-height:24px; gap:clamp(3px,1.15cqi,8px); }
    .lcd-check input {
      box-sizing:border-box; appearance:none; display:grid; place-items:center; flex:none;
      width:clamp(15px,4.3cqi,28px); height:clamp(15px,4.3cqi,28px);
      margin:0; border:1px solid var(--lcd-line); border-radius:2px; background:var(--lcd-field);
    }
    .lcd-check input[type="radio"] { border-radius:50%; }
    .lcd-pattern input[type="radio"] { border-radius:2px; }
    .lcd-check input:checked::before { content:""; width:66%; height:66%; border-radius:50%; background:var(--lcd-dark); }
    .lcd-check input[type="checkbox"]:checked::before,.lcd-pattern input:checked::before {
      box-sizing:border-box; width:35%; height:63%; border-radius:0; background:none;
      border:solid var(--lcd-dark); border-width:0 2px 2px 0; transform:translateY(-9%) rotate(42deg);
    }
    .lcd-check input:indeterminate::before { content:""; width:55%; height:2px; background:var(--lcd-dark); }
    .lcd-check input:enabled { cursor:pointer; }
    .lcd-setting[data-unavailable] { opacity:.72; }
    .lcd-setting[data-dirty] input { outline:1px solid var(--lcd-focus); outline-offset:1px; }
    .settings-hint {
      margin:3px 0 0; color:var(--lcd-hint); font-size:clamp(11px,2.65cqi,15px); overflow-wrap:anywhere;
    }
    .settings-feedback { margin:0 2px; }
    .settings-hint[data-error] { padding:3px 5px; border-radius:2px; color:#441428; background:#ffe3e9; }
    .settings-controls { display:flex; flex-direction:column; gap:3px; min-inline-size:0; }
    .settings-nav,.settings-actions {
      display:grid; grid-template-rows:1fr auto 1fr; min-inline-size:0; gap:2px; flex:1;
      padding:2px; border:1px solid var(--lcd-line); border-radius:4px;
    }
    .settings-actions { grid-template-rows:repeat(2,minmax(32px,1fr)); }
    .settings-page-name {
      margin:1px 0; text-align:center; font-size:clamp(9px,2.65cqi,16px); line-height:1.12; overflow-wrap:anywhere;
    }
    .settings-page-name:empty { display:none; }
    .settings-button { display:grid; place-items:center; width:100%; min-height:29px; padding:2px; }
    .settings-button svg { display:block; width:min(90%,clamp(16px,5cqi,34px)); height:auto; fill:currentColor; }
    .settings-button:disabled { opacity:.5; cursor:default; }
    .settings :focus-visible { outline:2px solid var(--lcd-focus); outline-offset:1px; }
    .settings h2:focus { outline:0; }
    @container (max-width:390px) {
      .lcd-number { align-items:flex-start; flex-direction:column; }
      .lcd-number-value { inline-size:100%; max-inline-size:7rem; }
      .lcd-value-first .lcd-number-value { order:0; }
    }
    @container (max-width:230px) {
      .lcd-battery-mode,.lcd-work-modes,.lcd-export,.lcd-pattern,.lcd-page-bottom { grid-template-columns:minmax(0,1fr); }
      .lcd-battery-limits { padding-top:0; }
      .lcd-number input { font-size:12px; }
    }
    :host([data-theme="technika"]) .settings {
      --lcd-ink:#213b2e;
      --lcd-line:#62806b;
      --lcd-field:#f5f8ed;
      --lcd-dark:#2b5743;
      --lcd-button:#f6fae670;
      --lcd-hover:#c4dac7;
      --lcd-hint:#394f40;
      --lcd-focus:#674618;
      background:radial-gradient(ellipse at 45% 5%,#f3f7e8,#e3eddd 60%,#cddfcc);
      box-shadow:inset 0 0 0 1px #ffffffad;
    }
    :host([data-theme="technika"]) .settings-header {
      background:linear-gradient(180deg,#adc5b0,#dce8d6);
    }
    :host([data-theme="technika"]) .settings-tile {
      border-radius:6px; box-shadow:inset 0 0 0 1px #ffffff84;
    }
    :host([data-theme="technika"]) .settings-button[data-settings-button="apply"]:enabled {
      color:#fff; background:#335945;
    }

    .technika-only { display:none; }
    :host([data-theme="technika"]) { --technika-background:url("${technikaBackground}"); }
    :host([data-theme="technika"]) .technika-only { display:inline; }
    :host([data-theme="technika"]) .classic-only { display:none; }
    :host([data-theme="technika"]) ha-card { border-color:#2a5b47; border-radius:13px; background:#2b624b; }
    :host([data-theme="technika"]) .screen {
      background:#ddebe0 var(--technika-background) center / 100% 100% no-repeat;
      border-radius:6px; box-shadow:inset 0 0 0 1px #ffffff7a; font-family:"Open Sans",Roboto,Arial,sans-serif;
    }
    :host([data-theme="technika"]) .top { fill:#263a35; }
    :host([data-theme="technika"]) .track { stroke:#c0c4b7; stroke-width:9; stroke-linecap:round; }
    :host([data-theme="technika"]) .fill { stroke-width:8.5; stroke-linecap:round; }
    :host([data-theme="technika"]) .value { fill:#172e26; font-size:17.5px; font-weight:750; }
    :host([data-theme="technika"]) .value[data-unavailable] { fill:#4f5b4e; }
    :host([data-theme="technika"]) .scale { fill:#4f5b4e; font-size:11.5px; font-weight:550; }
    :host([data-theme="technika"]) .unit { fill:#536153; font-size:8.5px; font-weight:650; letter-spacing:.8px; }
    :host([data-theme="technika"]) .soc,
    :host([data-theme="technika"]) .soc-side { fill:#296348; font-weight:750; }
    :host([data-theme="technika"]) .status { stroke:#2a5b47; stroke-width:1.65; }
    :host([data-theme="technika"]) .status-text,
    :host([data-theme="technika"]) .parallel { fill:#f5f7df; font-weight:750; }
    :host([data-theme="technika"]) .screen[data-status="missing"] .status { fill:#e5eee5; stroke:#708078; }
    :host([data-theme="technika"]) .screen[data-status="missing"] .status-text,
    :host([data-theme="technika"]) .screen[data-status="missing"] .parallel { fill:#475c52; }
    :host([data-theme="technika"]) .screen[data-status="fault"] .status { fill:#743e37; stroke:#9d3230; }
    :host([data-theme="technika"]) .screen[data-status="fault"] .status-text { fill:#ffe7d7; }
    :host([data-theme="technika"]) .wire-track {
      stroke:var(--flow-track); stroke-width:1.4; stroke-dasharray:4.4 2.65 .25 2.65; stroke-linecap:round;
    }
    :host([data-theme="technika"]) .wire[data-flow="off"] .wire-track { stroke:#879b8a; }
    :host([data-theme="technika"]) .grid-outage [fill="#ffffff"] { fill:#ddebe0; }
    .wire[data-wire="solar"] { --flow:#9c5e27; --flow-track:#a98b63; --flow-edge:#765030; --flow-body:#bcae7c; }
    .wire[data-wire="grid"] { --flow:#446575; --flow-track:#758f91; --flow-edge:#365462; --flow-body:#99b4a3; }
    .wire[data-wire="battery"] { --flow:#337458; --flow-track:#6b9880; --flow-edge:#2a5f4c; --flow-body:#94ba8f; }
    .wire[data-wire="load"] { --flow:#39655e; --flow-track:#6e8f83; --flow-edge:#2e554f; --flow-body:#96b493; }
    .technika-arrow,.particle-halo { fill:var(--flow); }
    .particle-edge { fill:var(--flow-edge); }
    .particle-body { fill:var(--flow-body); }
    @media (prefers-reduced-motion:reduce) {
      :host([data-theme="technika"]) .technika-particle { display:none; }
    }

    .deye-reference-readings {position:relative;height:224px;font-size:13px;font-weight:600;padding:12px 7px;box-sizing:border-box;}
    .reference-top {display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
    .reference-pv {display:grid;grid-template-columns:repeat(3,1fr);gap:12px 5px;}
    .reference-energy {text-align:center;margin-top:16px;line-height:1.9;}
    .reference-left {width:48%;text-align:center;line-height:1.9;}
    .reference-right {position:absolute;left:51%;top:12px;width:47%;line-height:1.9;text-align:center;}
    .deye-reference-readings[data-source="battery"] .reference-right {font-size:10px;text-align:left;line-height:2.3;}
    .deye-detail-corner {position:absolute;bottom:0;right:0;width:76px;height:48px;border:0;border-left:2px solid #c2d9d9;border-top:2px solid #c2d9d9;border-radius:100% 0 0 0;background:transparent;color:inherit;font:italic 12px Arial;padding:18px 0 0 18px;cursor:pointer;}
    .deye-detail-corner.bms {right:80px;}
    .details-screen { width:400px;height:268px;min-height:0!important;zoom:var(--details-scale,1); }
    .details-header h2 { flex:1;font-size:18px!important; }
    .details-header { height:40px;min-height:40px!important; }
    .details-prev,.details-next {font:24px Arial;color:inherit;background:transparent;border:1px solid currentColor;border-radius:4px;cursor:pointer;}
    .details-page-number {font-size:11px;white-space:nowrap;}
    .details-screen .details-metric dt {font-size:12px;}
    .details-screen .details-metric dd {font-size:20px;}
    .details-screen .details-history h3 {font-size:13px;}
    .details-screen .deye-history-tabs {gap:3px;padding:4px;}
    .details-screen .deye-history-tabs button {padding:4px 7px;font-size:11px;}
    .details-screen .deye-detail-extra {font-size:12px;gap:5px;padding:7px;}
    .details-screen .history-chart svg {max-height:172px;}
    .details-screen {
      --details-ink:#f0faff;
      --details-muted:#d7edff;
      --details-rule:#b4dcec56;
      --details-zero:#b4dceca7;
      --details-edge:#9ee2f5;
      --details-metric-edge:#a4dbf085;
      --details-metric-face:#1332704f;
      --details-plot-face:#0d275e50;
      --details-line:#b3f4ff;
      --details-focus:#ffe38a;
      min-height:256px; box-sizing:border-box; border-radius:5px; overflow:hidden; container-type:inline-size;
      background:linear-gradient(180deg,#362382 12%,#254698 52%,#08768d 100%);
      color:var(--details-ink); color-scheme:light; font:400 14px/1.3 Roboto,Arial,sans-serif;
    }
    .details-header {
      display:flex; align-items:center; gap:8px; min-height:44px; padding:0 10px;
      border-bottom:2px solid var(--details-edge); background:linear-gradient(180deg,#0d75ae,#126499);
    }
    .details-header h2 { margin:0; font-size:19px; font-size:clamp(16px,4.7cqi,24px); font-weight:700; }
    .details-back {
      display:grid; place-items:center; box-sizing:border-box; width:38px; min-width:38px; height:36px;
      padding:0; border:1px solid var(--details-metric-edge); border-radius:4px;
      background:var(--details-metric-face); color:inherit; cursor:pointer; touch-action:manipulation;
    }
    .details-back svg { width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
    .details-back:focus-visible { outline:2px solid var(--details-focus); outline-offset:2px; }
    .details-header h2:focus { outline:0; }
    .details-readings { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:5px; margin:9px 9px 7px; }
    .details-screen[data-source="battery"] .details-readings { grid-template-columns:repeat(4,minmax(0,1fr)); }
    .details-metric {
      min-width:0; padding:5px 5px 6px; text-align:center; border:1px solid var(--details-metric-edge);
      border-radius:4px; background:var(--details-metric-face);
    }
    .details-metric dt { color:var(--details-muted); font-size:11px; font-size:clamp(10px,2.9cqi,14px); overflow-wrap:anywhere; }
    .details-metric dd {
      margin:2px 0 0; font-size:16px; font-size:clamp(13px,4.4cqi,22px); font-weight:700;
      font-variant-numeric:tabular-nums; overflow-wrap:anywhere;
    }
    .details-metric small,.details-breakdown small {
      margin-inline-start:.28em; font-size:.72em; font-weight:600; color:var(--details-muted);
    }
    .details-metric small { font-size:.58em; }
    .details-metric small:empty,.details-breakdown small:empty { display:none; }
    .details-breakdown {
      margin:0 9px 7px; border:1px solid var(--details-metric-edge); border-radius:4px;
      background:var(--details-metric-face);
    }
    .details-breakdown table {
      width:100%; table-layout:fixed; border-collapse:collapse; font-variant-numeric:tabular-nums;
    }
    .details-breakdown caption {
      padding:6px 7px; text-align:start; font-size:clamp(12px,3.3cqi,16px); font-weight:700;
    }
    .details-breakdown th,.details-breakdown td {
      border-top:1px solid var(--details-rule); padding:4px 3px; text-align:center;
      font-size:clamp(10px,3.1cqi,14px); overflow-wrap:anywhere;
    }
    .details-breakdown th { color:var(--details-muted); font-weight:600; }
    .details-breakdown th:first-child { width:29%; padding-inline-start:7px; text-align:start; }
    .details-breakdown[data-breakdown="batteries"] th:first-child { width:40%; }
    .details-breakdown td { font-weight:700; }
    .details-history { margin:0 9px 9px; border:1px solid var(--details-metric-edge); border-radius:4px; background:var(--details-plot-face); }
    .details-history h3 { margin:6px 7px 2px; font-size:13px; font-size:clamp(12px,3.3cqi,16px); font-weight:700; }
    .history-message {
      display:grid; min-height:108px; padding:4px 9px; margin:0; place-items:center;
      text-align:center; color:var(--details-muted); font-size:12px;
    }
    .history-chart svg { display:block; width:100%; height:auto; }
    .history-chart text { fill:var(--details-muted); font-size:10px; font-weight:600; }
    .history-rule { fill:none; stroke:var(--details-rule); stroke-width:1; }
    .history-zero { stroke:var(--details-zero); }
    .history-trace { fill:none; stroke:var(--details-line); stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
    :host([data-theme="technika"]) .details-screen {
      --details-ink:#172e26;
      --details-muted:#324e41;
      --details-rule:#63867441;
      --details-zero:#638674b0;
      --details-edge:#59826b;
      --details-metric-edge:#698f7580;
      --details-metric-face:#f6faf3a0;
      --details-plot-face:#f5f9f0a6;
      --details-line:#286549;
      --details-focus:#255d47;
      background:#ddebe0 var(--technika-background) center / 100% 100% no-repeat;
      border-radius:6px; font-family:"Open Sans",Roboto,Arial,sans-serif;
    }
    :host([data-theme="technika"]) .details-header { background:linear-gradient(180deg,#e9f2e8,#c9dece); }
    @container (max-width:290px) {
      .details-screen[data-source="battery"] .details-readings { grid-template-columns:repeat(2,minmax(0,1fr)); }
    }
  `;

  const responsiveStyles = extra.css + '@container (max-width:450px){.settings{min-block-size:370px}.deye-table th{white-space:nowrap;font-size:10px}}';
  class DeyeLcd extends HTMLElement {
    static getStubConfig() {
      return { lcd_theme: "anma", inverter_model: String(defaultModel), inverter_phases: "1" };
    }

    static getConfigForm() {
      const entity = (name, required = true, domain = "sensor") => ({ name, required, selector: { entity: { domain } } });
      const toggle = (name) => ({ name, selector: { boolean: {} } });
      const group = (name, title, schema) => ({ name, title, type: "expandable", flatten: true, schema });
      const readings = (source, powerRequired = true) => [
        entity(`${source}_power`, powerRequired),
        entity(`${source}_current`, false),
        entity(`${source}_voltage`, false),
      ];
      const labels = {
        lcd_theme: "Тема",
        inverter_model: "Модель інвертора",
        inverter_phases: "Кількість фаз",
        ...Object.fromEntries(gaugeLayout.flatMap(({ source }) =>
          acMeasurements.map(({ key, label }) => [`${source}_${key}`, label])
        )),
        battery_soc: "Батарея 1 · заряд",
        battery_soc_2: "Батарея 2 · заряд",
        battery_temperature: "Температура АКБ",
        parallel_id: "Позначка паралельної роботи",
        grid_connected: "Стан мережі",
        inverter_status: "Статус інвертора",
        invert_battery: "Додатний показ датчика батареї означає заряд",
        invert_grid: "Від’ємний показ датчика мережі означає імпорт",
        ...Object.fromEntries(settingFields.map(([name, , editor]) => [name, editor])),
      };
      const optionalReadings = (prefix, fields) => fields.map(({ key, label }) => {
        const name = `${prefix}_${key}`;
        labels[name] = label;
        return entity(name, false);
      });
      const phaseGroups = (source) => phaseColumns.map(({ prefix, label }) => {
        const name = `${source}_${prefix}`;
        return {
          ...group(`${name}_entities`, `Фаза ${label}`, optionalReadings(name, acMeasurements)),
          visible: { field: "inverter_phases", operator: "in", value: threePhaseValues },
        };
      });
      return {
        schema: [
          { name: "lcd_theme", selector: { select: { mode: "dropdown", options: themes } } },
          { name: "inverter_model", selector: { select: { mode: "dropdown", options: models.map(model => ({ value: String(model), label: modelLabel(model) })) } } },
          { name: "inverter_phases", default: "1", selector: { select: { mode: "dropdown", options: phaseOptions } } },
          group("extended_readings", "Deye · детальні показники та енергія", [...['pv_grid_tie_power','grid_ct_power','grid_ld_power','battery_soh','battery_bms_brand','battery_bms_charge_voltage','battery_bms_version'].map(name=>entity(name,false)),...Object.values(extraReadings).flat().map(([name,label])=>{labels[name]=label;return entity(name,false);}),...readings('inverter',false)]),
          group('gen_port_entities','GEN · Micro Inverter / Generator / Smart Load',[['gen_port_power','GEN port power'],['micro_inverter_power','Micro inverter power'],['generator_power','Generator power'],['smart_load_actual_power','Smart load power']].map(([name,label])=>{labels[name]=label;return entity(name,false);})),
          group("solar_entities", "Сонячна генерація", readings("pv", false)),
          group("grid_entities", "Мережа", [
            ...readings("grid"), entity("grid_connected", false, "binary_sensor"), toggle("invert_grid"),
            ...phaseGroups("grid"),
          ]),
          group("load_entities", "Навантаження", [...readings("load"), ...phaseGroups("load")]),
          group("battery_entities", "Батарея", [
            ...readings("battery"), entity("battery_soc"), entity("battery_soc_2", false),
            entity("battery_temperature", false), toggle("invert_battery"),
            ...batteryColumns.map(({ prefix, label }) =>
              group(`${prefix}_entities`, `${label} · окремі покази`, optionalReadings(prefix, measurementFields))
            ),
          ]),
          group("inverter_entities", "Інвертор і паралельна робота", [
            entity("inverter_status", false), { name: "parallel_id", selector: { text: {} } },
          ]),
          ...settingBindings.map(([title, fields], index) =>
            group(`controls_${index}`, `Керування · ${title}`,
              fields.map(([name, domain]) => entity(name, false, domain)))
          ),
        ],
        computeLabel: ({ name }) => labels[name],
        computeHelper: ({ name }) => ({
          lcd_theme: "Тема за замовчуванням — КЛАСіК.",
          inverter_model: "Для 80 + 80 кВт вибирай сумарні сенсори потужності та сутності налаштувань Master.",
          inverter_phases: "Для 3 фаз можна під’єднати датчики L1–L3 у групах «Мережа» та «Навантаження».",
          grid_connected: "Обери двійковий датчик, у якому «вимкнено» означає, що мережі немає.",
          battery_mode: "Якщо інтеграція окремо дає тип і режим АКБ, залиш це поле порожнім і під’єднай обидва селектори нижче.",
          charging_signal: "Якщо є спільний селектор Normal / Grid / Generator / Both, використай його. Для окремих перемикачів заповни поля нижче.",
          time_of_use: "На другій сторінці Work Mode галочка знімається окремо від Grid Peak Shaving.",
          generator_force: "Обирай сутність лише для Gen Force. Деякі інтеграції не змінюють стан цього пункту на інверторі.",
          grid_voltage: "Напруга входу Grid. Також допомагає визначити Off grid, коли показує 0 В.",
        })[name],
      };
    }

    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>${styles}${responsiveStyles}</style><ha-card>
        <svg class="screen" data-status="missing" viewBox="0 0 400 268" aria-label="Головний екран Deye">
          <defs>
            <linearGradient id="deye-lcd-arc" gradientUnits="userSpaceOnUse" x1="-43" y1="12" x2="37" y2="20">
              <stop offset="0" stop-color="#3adb36"/><stop offset=".24" stop-color="#26a73b"/>
              <stop offset=".48" stop-color="#6e9133"/><stop offset=".66" stop-color="#a89131"/>
              <stop offset=".83" stop-color="#ca7825"/><stop offset="1" stop-color="#bc3e2b"/>
            </linearGradient>
            ${technikaDefinitions}
          </defs>
          <g data-clock-tap="">
            <rect x="96" y="4" width="194" height="31" fill="transparent"/>
            <text class="top" x="193" y="25" text-anchor="middle" data-clock="">--/--/---- --:--:--</text>
          </g>
          <text class="top" x="340" y="25" text-anchor="end" data-weekday=""></text>
          <g transform="translate(373 24)" fill="#171b1b" role="button" tabindex="0" aria-label="Налаштування інвертора" data-gear="">
            <title>Налаштування інвертора</title>
            <rect class="hit" x="-22" y="-22" width="44" height="44" rx="6" fill-opacity="0"/>
            <g class="classic-only">${gearIcon}</g>
            <g class="technika-only" aria-hidden="true">${technikaGear}</g>
          </g>
          ${wireLayout.map(wire).join("")}
          <circle class="status" cx="202" cy="142" r="25" fill="${screenWhite}"/>
          <circle class="technika-only" cx="202" cy="142" r="21.75" fill="none" stroke="#719482" stroke-width=".7" aria-hidden="true"/>
          <text class="parallel" x="202" y="135" data-parallel=""></text>
          <text class="status-text" x="202" y="148" data-status-label="">—</text>
          <g role="button" tabindex="0" aria-label="Про картку Deye LCD" aria-haspopup="dialog" aria-controls="about-dialog" data-open-about="">
            <title>Про картку Deye LCD</title>
            <circle class="hit" cx="202" cy="142" r="28" fill="transparent"/>
          </g>
          ${gaugeLayout.map(gauge).join("")}
          <g data-gen-port-indicator style="display:none" role="img">
            <path data-gen-port-wire fill="none" stroke="#688c7a" stroke-width="1.4" stroke-dasharray="3 2"/>
            <g data-gen-port-symbol fill="#d8e7d4" stroke="#315e4a" stroke-width="1.5"></g>
            <text data-gen-port-power text-anchor="middle" fill="#244d3c" font-size="9"></text><text data-gen-port-label text-anchor="middle" fill="#244d3c" font-size="8"></text>
          </g>
        </svg>
        ${detailsMarkup()}
        <div class="deye-firmware-viewport">${settingsMarkup()}</div>
        ${aboutMarkup()}
        ${aboutMarkup(true)}
      </ha-card>`;
      const select = (selector) => this.shadowRoot.querySelector(selector);
      this.screen = select(".screen");
      this.clock = select("[data-clock]");
      this.weekday = select("[data-weekday]");
      this.statusSurface = select(".status");
      this.statusLabel = select("[data-status-label]");
      this.statusSurface.setAttribute('role','button');this.statusSurface.setAttribute('tabindex','0');this.statusSurface.setAttribute('aria-label','Inverter');
      onActivate(this.statusSurface,()=>this.openDetails('inverter_power'));
      onActivate(this.statusLabel,()=>this.openDetails('inverter_power'));
      this.socLabel = select("[data-soc]");
      this.socLeft = select("[data-soc-left]");
      this.socRight = select("[data-soc-right]");
      this.parallelLabel = select("[data-parallel]");
      this.detailsScreen = select(".details-screen");
      this.detailsTitle = select("#details-title");
      this.historyMessage = select(".history-message");
      this.historyChart = select(".history-chart");
      this.detailsKey = null;
      this.historyRequest = 0;
      this.detailMetrics = measurementFields.map(field =>
        measurementNodes(select(`[data-metric="${field.key}"]`), field)
      );
      this.detailBreakdowns = detailBreakdowns.map(({ key, columns, fields }) => {
        const panel = select(`[data-breakdown="${key}"]`);
        const cells = columns.flatMap(({ prefix }) => fields.map(field => {
          const row = panel.querySelector(`[data-reading="${prefix}_${field.key}"]`);
          return { ...measurementNodes(row, field), prefix };
        }));
        return { key, panel, cells };
      });
      this.shadowRoot.querySelector('.deye-reference-readings').addEventListener('click',event=>{const action=event.target.closest('[data-detail-action]')?.dataset.detailAction;if(!action)return;this.detailsBms=action==='bms';this.detailsPage=action==='energy'?1:0;this.updateDetails();});
      for (const [selector, step] of [['.details-prev',-1],['.details-next',1]]) select(selector).addEventListener('click',()=>{this.detailsPage+=step;this.updateDetails();});
      select(".details-back").addEventListener("click", () => this.closeDetails());
      this.historyPeriod = 'Power';
      for (const button of this.shadowRoot.querySelectorAll('[data-history-period]')) button.addEventListener('click',()=>{this.historyPeriod=button.dataset.historyPeriod;this.loadDetailsHistory();});
      this.detailsScreen.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        this.closeDetails();
      });
      select('[data-ui-language]').addEventListener('change',event=>{this.pendingUiLanguage=event.target.value===this.uiLanguage?null:event.target.value;this.renderSettings();});
      this.settingsScreen = select(".settings");
      this.settingsTitle = select("#settings-title");
      this.settingsMenu = select(".settings-menu");
      this.settingsBody = select(".settings-body");
      this.settingsMain = select(".settings-main");
      this.settingsPanels = new Map();
      this.settingsMenuId = null;
      this.settingsPage = 0;
      this.settingsSession = 0;
      this.settingsDrafts = new Map();
      this.pendingSettings = new Map();
      this.settingsNotice = "";
      this.savingSettings = false;
      this.settingsPageName = select("[data-settings-page-name]");
      this.settingsPrevious = select('[data-settings-button="up"]');
      this.settingsNext = select('[data-settings-button="down"]');
      this.settingsApply = select('[data-settings-button="apply"]');
      this.gear = select("[data-gear]");
      this.viewOnlyLabel = select("[data-view-only]");
      this.noSettingsLabel = select("[data-no-settings]");
      this.settingsMessage = select("[data-settings-message]");
      onActivate(this.gear, () => this.openSettings());
      const aboutButton = select("[data-open-about]");
      if (aboutButton) onActivate(aboutButton, () => this.openAbout("about-dialog", aboutButton));
      let firstTap = -Infinity;
      let tapCount = 0;
      select("[data-clock-tap]").addEventListener("click", () => {
        const now = performance.now();
        if (now - firstTap > 2500) {
          firstTap = now;
          tapCount = 0;
        }
        if (++tapCount === 5) {
          tapCount = 0;
          firstTap = -Infinity;
          this.openAbout("about-signature");
        }
      });
      for (const { id, pages } of settingsMenus) {
        select(`[data-settings-menu="${id}"]`).addEventListener("click", () => this.goToSettingsPage(id, 0));
        for (let index = 0; index < (pages?.length ?? 1); index++) {
          const key = `${id}:${index}`;
          const element = select(`[data-settings-page="${key}"]`);
          const fields = new Map();
          for (const setting of element.querySelectorAll("[data-setting]")) {
            const name = setting.dataset.setting;
            const view = { name, element: setting, input: setting.querySelector("input,select"), unit: setting.querySelector(".lcd-unit") };
            if (!fields.has(name)) fields.set(name, []);
            fields.get(name).push(view);
            view.input.addEventListener("input", () => this.stageSetting(view));
            for (const button of setting.querySelectorAll('[data-step]')) button.addEventListener('click',()=>{
              if(view.input.disabled)return;
              const target=this.readSetting(name).targets[0],attrs=target?.entity.attributes||{};
              const value=Number(view.input.value.replace(',','.'))+Number(button.dataset.step)*Number(attrs.step||1);
              if(!Number.isFinite(value)||value<Number(attrs.min??-Infinity)||value>Number(attrs.max??Infinity))return;
              view.input.value=String(value);this.stageSetting(view);
            });
          }
          this.settingsPanels.set(key, { element, fields });
        }
      }
      for (const button of this.shadowRoot.querySelectorAll('[data-deye-page]')) button.addEventListener('click', () => {
        const [menu, page] = button.dataset.deyePage.split(':'); this.goToSettingsPage(menu, Number(page));
      });
      select("[data-back-to-screen]").addEventListener("click", () => this.closeSettings());
      this.settingsPrevious.addEventListener("click", () => this.goToSettingsPage(this.settingsMenuId, this.settingsPage - 1));
      this.settingsNext.addEventListener("click", () => this.goToSettingsPage(this.settingsMenuId, this.settingsPage + 1));
      select('[data-settings-button="cancel"]').addEventListener("click", () => this.backFromSettings());
      this.settingsBody.addEventListener("submit", (event) => {
        event.preventDefault();
        this.applySettings();
      });
      this.settingsScreen.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        this.backFromSettings();
      });
      this.wires = Object.fromEntries(wireLayout.map(({ name }) => [name, select(`[data-wire="${name}"]`)]));
      this.gauges = Object.fromEntries(gaugeLayout.map(({ key }) => {
        const element = select(`[data-gauge="${key}"]`);
        onActivate(element, () => this.openDetails(key));
        return [key, { element, value: element.querySelector(".value"), fill: element.querySelector(".fill"), maximum: element.querySelector("[data-scale]") }];
      }));
    }

    get uiLanguage() {
      if(['en','uk'].includes(this.config?.ui_language))return this.config.ui_language;
      try { const saved=localStorage.getItem('anma-deye-language:'+this.languageKey);if(['en','uk'].includes(saved))return saved; } catch {}
      return this.config?.initial_language==='uk'?'uk':'en';
    }
    get languageKey(){return this.config?.language_key||this.config?.grid_power||'default';}
    setUiLanguage(language){
      if(!['en','uk'].includes(language))return;
      this.config={...this.config,ui_language:language};
      try{localStorage.setItem('anma-deye-language:'+this.languageKey,language);}catch{}
      this.shadowRoot.querySelector('[data-ui-language]').value=language;
      this.setAttribute('lang',language);this.localizer?.apply();
      this.dispatchEvent(new CustomEvent('deye-language-changed',{detail:{language},bubbles:true,composed:true}));
    }
    setConfig(config) {
      const bindingsChanged = settingFields.some(([name]) => this.config?.[name] !== config[name]);
      const gauge = gaugeByKey[this.detailsKey];
      const historyChanged = gauge && (
        this.config?.[gauge.key] !== config[gauge.key] ||
        (gauge.invert && this.config?.[gauge.invert] !== config[gauge.invert])
      );
      this.config = { ...config };
      this.shadowRoot.querySelector('[data-ui-language]').value=this.uiLanguage;
      this.setAttribute('lang',this.uiLanguage);
      this.localizer?.apply();
      const technika = false;
      this.dataset.theme = config.lcd_theme === 'classic' ? 'classic' : 'anma';
      this.statusSurface.setAttribute("fill", technika ? "url(#deye-technika-status)" : screenWhite);
      const requestedModel = Number(config.inverter_model);
      this.scale = models.includes(requestedModel) ? requestedModel : defaultModel;
      this.screen.setAttribute("aria-label", `Головний екран ${modelLabel(this.scale)}`);
      const secondBattery = config.battery_soc_2 || measurementFields.some(({ key }) => config[`battery_2_${key}`]);
      this.screen.dataset.battery = this.scale >= 80 || secondBattery ? "dual" : "single";
      const parallelId = config.parallel_id?.trim().slice(0, 6) || "";
      this.parallelLabel.textContent = parallelId;
      this.statusLabel.setAttribute("y", parallelId ? "156" : "148");
      for (const { maximum, fill } of Object.values(this.gauges)) {
        maximum.textContent = this.scale.toFixed(1);
        fill.setAttribute("stroke", technika ? "url(#deye-technika-power)" : "url(#deye-lcd-arc)");
      }
      if (bindingsChanged) {
        this.settingsSession++;
        this.lastTimeOfUse = null;
        this.clearSettingDrafts();
        this.clearPendingSettings();
      }
      this.update();
      if (historyChanged) this.loadDetailsHistory();
    }

    set hass(hass) {
      const historyConnected = typeof this.hassData?.callWS !== "function" && typeof hass?.callWS === "function";
      this.hassData = hass;
      this.update();
      if (historyConnected && this.detailsKey) this.loadDetailsHistory();
    }

    connectedCallback() {
      this.firmwareResize?.disconnect();
      const fit=()=>{const viewport=this.shadowRoot.querySelector('.deye-firmware-viewport');viewport.style.zoom=String(Math.min(1,Math.max(0.1,this.getBoundingClientRect().width/720)));this.detailsScreen.style.setProperty('--details-scale',String(Math.max(0.1,(this.getBoundingClientRect().width-14)/400)));this.scheduleSettingsFit();};
      this.firmwareResize=new ResizeObserver(fit);this.firmwareResize.observe(this);fit();
      this.localizer?.disconnect();
      this.localizer=window.AnmaDeyeI18n.attach(this.shadowRoot,()=>this.uiLanguage);
      this.updateClock();
      this.timer = setInterval(() => this.updateClock(), 1000);
    }

    disconnectedCallback() {
      cancelAnimationFrame(this.settingsFitFrame);
      this.firmwareResize?.disconnect();
      this.localizer?.disconnect();
      clearInterval(this.timer);
      this.closeDetails();
      this.closeSettings();
      for (const dialog of this.shadowRoot.querySelectorAll("dialog")) {
        if (dialog.open) dialog.close();
      }
      this.clearPendingSettings();
    }

    getCardSize() { return 5; }
    scheduleSettingsFit() {
      cancelAnimationFrame(this.settingsFitFrame);
      this.settingsFitFrame=requestAnimationFrame(()=>{
        const main=this.shadowRoot.querySelector('.settings-main'),content=this.shadowRoot.querySelector('.deye-fit-content');
        if(!main||!content||this.settingsScreen.hidden||this.settingsBody.hidden)return;
        content.style.zoom='1';
        content.style.width=main.clientWidth+'px';
        content.style.fontSize=this.uiLanguage==='uk'?'20px':'22px';
        const scale=Math.min(1,(main.clientHeight-2)/Math.max(1,content.scrollHeight),(main.clientWidth-2)/Math.max(1,content.scrollWidth));
        content.style.zoom=String(Math.max(0.1,scale));
        for(let i=0;i<4;i++){
          const m=main.getBoundingClientRect(),c=content.getBoundingClientRect();
          const correction=Math.min(1,(m.bottom-c.top-1)/Math.max(1,c.height),(m.right-c.left-1)/Math.max(1,c.width));
          if(correction>=1)break;
          content.style.zoom=String(Number(content.style.zoom)*correction);
        }
        main.scrollTop=0;main.scrollLeft=0;
      });
    }
    getGridOptions() { return { columns: 12, min_columns: 6 }; }

    openAbout(id, opener) {
      const dialog = this.shadowRoot.getElementById(id);
      if (!this.isConnected || !dialog || dialog.open) return;
      opener?.focus();
      dialog.showModal();
    }

    updateClock() {
      const zone = this.hassData?.config?.time_zone;
      if (!this.clockFormatter || zone !== this.clockZone) {
        this.clockZone = zone;
        const options = {
          weekday: "short", month: "2-digit", day: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
        };
        this.clockFormatter = dateFormatter("en-US", options, zone);
      }
      const parts = Object.fromEntries(this.clockFormatter.formatToParts(new Date()).map(({ type, value }) => [type, value]));
      this.clock.textContent = `${parts.month}/${parts.day}/${parts.year}  ${parts.hour}:${parts.minute}:${parts.second}`;
      this.weekday.textContent = weekdays[parts.weekday];
      this.weekday.setAttribute("lang", "uk");
    }

    openDetails(key) {
      if (!this.config || !this.settingsScreen.hidden) return;
      const gauge = gaugeByKey[key];
      if (!gauge) return;
      this.historyPeriod = "Power";
      this.detailsKey = key;
      this.detailsPage = 0;this.detailsBms=false;
      this.detailsScreen.dataset.source = gauge.source;
      this.detailsTitle.textContent = gauge.label;
      this.screen.setAttribute("hidden", "");
      this.detailsScreen.hidden = false;
      this.updateDetails();
      this.detailsTitle.focus({ preventScroll: true });
      this.loadDetailsHistory();
    }

    closeDetails() {
      if (!this.detailsKey) return;
      const opener = this.gauges[this.detailsKey]?.element || this.statusSurface;
      this.detailsKey = null;
      this.historyRequest++;
      this.detailsScreen.hidden = true;
      this.screen.removeAttribute("hidden");
      if (this.isConnected) opener.focus({ preventScroll: true });
    }

    updateDetails() {
      const gauge = gaugeByKey[this.detailsKey];
      const states = this.hassData?.states ?? {};
      const invert = gauge.invert && this.config[gauge.invert];
      const extraNode=this.shadowRoot.querySelector('.deye-detail-extra');extraNode.replaceChildren();
      for(const [key,label] of extraReadings[gauge.source]||[]){const row=document.createElement('div'),name=document.createElement('span'),value=document.createElement('b');name.textContent=label;const entity=states[this.config[key]];value.textContent=entity&&!['unknown','unavailable'].includes(entity.state)?entity.state+' '+(entity.attributes?.unit_of_measurement||''):'—';row.append(name,value);extraNode.append(row);}
      const showBreakdown = {
        phases: acSources.includes(gauge.source) && threePhaseValues.includes(this.config.inverter_phases),
        batteries: gauge.source === "battery" && this.screen.dataset.battery === "dual",
      };
      for (const metric of this.detailMetrics) {
        metric.row.hidden = metric.key === "temperature" && gauge.source !== "battery";
        if (!metric.row.hidden) renderMeasurement(metric, this.config[`${gauge.source}_${metric.key}`], states, invert);
      }
      for (const { key, panel, cells } of this.detailBreakdowns) {
        panel.hidden = !showBreakdown[key];
        if (panel.hidden) continue;
        for (const cell of cells) {
          const prefix = key === "phases" ? `${gauge.source}_${cell.prefix}` : cell.prefix;
          renderMeasurement(cell, this.config[`${prefix}_${cell.key}`], states, invert);
        }
      }
      this.paginateDetails();
    }

    paginateDetails() {
      this.renderReferenceDetails();
      const pages=[this.shadowRoot.querySelector('.deye-reference-readings'),this.shadowRoot.querySelector('.details-history')];
      this.detailsPage=Math.max(0,Math.min(this.detailsPage||0,1));
      for(const el of this.detailsScreen.querySelectorAll(':scope > :not(header)'))el.style.display='none';
      pages[this.detailsPage].style.display='';
      this.shadowRoot.querySelector('.details-prev').style.visibility=this.detailsPage?'visible':'hidden';
      this.shadowRoot.querySelector('.details-next').style.visibility=this.detailsPage?'hidden':'visible';
      this.shadowRoot.querySelector('.details-page-number').textContent=`${this.detailsPage+1}/2`;
    }

    renderReferenceDetails() {
      const source=gaugeByKey[this.detailsKey].source, root=this.shadowRoot.querySelector('.deye-reference-readings'), states=this.hassData?.states||{};
      root.replaceChildren();root.dataset.source=source;
      const value=(key,energy=false)=>{const e=states[this.config[key]];if(!e||['unknown','unavailable'].includes(e.state))return '—';const unit=e.attributes?.unit_of_measurement||'';const num=Number(e.state);if(energy&&Number.isFinite(num)){const kwh=unit==='Wh'?num/1000:unit==='MWh'?num*1000:num;return kwh>=1000?(kwh/1000).toFixed(2)+' MWh':kwh.toFixed(1)+' kWh';}return e.state+(unit?' '+unit:'');};
      const caption=label=>this.uiLanguage==='uk'?({'Power:':'Потужність:','Grid Tie Power:':'Мережева потужність:','Today=':'Сьогодні=','Total =':'Загалом =','Stand by':'Очікування','Charge':'Заряд','Discharge':'Розряд','BUY':'КУПІВЛЯ','SELL':'ПРОДАЖ','Battery Voltage:':'Напруга АКБ:','Battery Current:':'Струм АКБ:','Battery Temp.:':'Темп. АКБ:','Alarms:':'Помилки:','Battery Charge Voltage:':'Напруга заряду:','Charge Current limit:':'Ліміт струму заряду:','Discharge Current limit:':'Ліміт струму розряду:'}[label]||label):label;
      const block=(cls,items)=>{const el=document.createElement('div');el.className=cls;for(const [label,key,energy] of items){const row=document.createElement('div');row.textContent=caption(label)+(key?' '+value(key,energy):'');el.append(row);}root.append(el);};
      const action=(label,id,cls='')=>{const button=document.createElement('button');button.type='button';button.dataset.detailAction=id;button.className='deye-detail-corner '+cls;button.textContent=label;root.append(button);};
      this.detailsTitle.textContent=this.detailsBms&&source==='battery'?'Li-BMS':({pv:'Solar',grid:'Grid',load:'Load',battery:(Number(states[this.config.battery_voltage]?.state)>=40&&Number(states[this.config.battery_voltage]?.state)<=65?'Batt-48V':'Battery'),inverter:'Inverter'}[source]||source);
      if(this.detailsBms&&source==='battery'){
        block('reference-left',[['Battery Voltage:','battery_voltage'],['Battery Current:','battery_current'],['Battery Temp.:','battery_temperature'],['SOC:','battery_soc'],['SOH:','battery_soh'],['Alarms:','battery_bms_alarm']]);
        block('reference-right',[['LiBms:','battery_bms_brand'],['Battery Charge Voltage:','battery_bms_charge_voltage'],['Charge Current limit:','battery_bms_charge_limit'],['Discharge Current limit:','battery_bms_discharge_limit'],['BMS Ver:','battery_bms_version']]);action('‹ Back','readings');return;
      }
      if(source==='pv'){
        block('reference-top',[['Power:','pv_power'],['Grid Tie Power:','pv_grid_tie_power']]);
        const rows=[];for(const [metric,short]of [['voltage','V'],['current','I'],['power','P']])for(let i=1;i<=3;i++)rows.push([metric==='power'?`P${i}:`:`PV${i}-${short}:`,`pv_${i}_${metric}`]);block('reference-pv',rows);
        block('reference-energy',[['Today=','pv_energy_today',true],['Total =','pv_energy_total',true]]);
      }else if(source==='grid'){
        const power=watts(states[this.config.grid_power]);block('reference-left',[[power===null?'—':Math.abs(power)<5?'Stand by':power>0?'BUY':'SELL'],['','grid_power'],['','grid_frequency_sensor'],['','grid_voltage'],['','grid_current'],['CT:','grid_ct_power'],['LD:','grid_ld_power']]);
        block('reference-right',[['BUY'],['Today=','grid_energy_today',true],['Total =','grid_energy_total',true],['SELL'],['Today=','grid_export_today',true],['Total =','grid_export_total',true]]);
      }else if(source==='battery'){
        const p=watts(states[this.config.battery_power]);block('reference-left',[[p===null?'—':Math.abs(p)<5?'Stand by':p<0?'Charge':'Discharge'],['SOC:','battery_soc'],['U:','battery_voltage'],['I:','battery_current'],['Power:','battery_power'],['Temp:','battery_temperature']]);action('Li-BMS','bms','bms');
      }else{
        block('reference-left',[['Power:',source+'_power'],['L:',source+'_voltage'],['I:',source+'_current']]);block('reference-right',[['Today=',source+'_energy_today',true],['Total =',source+'_energy_total',true]]);
      }
      action('Energy','energy');
    }

    showHistory(message, plot = "") {
      this.historyMessage.textContent = message;
      this.historyMessage.hidden = !message;
      this.historyChart.innerHTML = plot;
      this.historyChart.hidden = !plot;
    }

    async loadEnergyHistory() {
      const request=++this.historyRequest,source=gaugeByKey[this.detailsKey].source,id=this.config[source+'_energy_total'],period=this.historyPeriod,hass=this.hassData;
      if(!id){this.showHistory('Під’єднайте накопичувальний лічильник енергії (kWh) для цього графіка.');return;}
      if(period==='Total'){const e=hass?.states?.[id];this.showHistory(e&&!['unknown','unavailable'].includes(e.state)?'Total: '+e.state+' '+(e.attributes?.unit_of_measurement||''):'Немає даних');return;}
      if(typeof hass?.callWS!=='function'){this.showHistory('Історія Home Assistant тимчасово недоступна.');return;}
      const now=new Date(),start=new Date(now);if(period==='Day')start.setHours(0,0,0,0);else if(period==='Month'){start.setDate(1);start.setHours(0,0,0,0);}else{start.setMonth(0,1);start.setHours(0,0,0,0);}
      this.showHistory('Завантажую енергію…');
      try{const result=await hass.callWS({type:'recorder/statistics_during_period',start_time:start.toISOString(),end_time:now.toISOString(),statistic_ids:[id],period:period==='Day'?'hour':period==='Month'?'day':'month',types:['change'],units:{energy:'kWh'}});
        if(request!==this.historyRequest)return;const rows=(result?.[id]||[]).filter(r=>Number.isFinite(r.change));if(!rows.length){this.showHistory('За цей період немає статистики енергії.');return;}
        const max=Math.max(1,...rows.map(r=>r.change)),width=340/rows.length;
        const plot='<svg viewBox="0 0 390 180" role="img" aria-label="Energy kWh"><text x="8" y="15">kWh · '+period+'</text>'+rows.map((r,i)=>'<rect x="'+(30+i*width)+'" y="'+(150-r.change/max*120)+'" width="'+Math.max(1,width-3)+'" height="'+Math.max(0,r.change/max*120)+'" fill="#3ab8ff"><title>'+extra.esc(new Date(r.start).toLocaleString())+': '+r.change.toFixed(2)+' kWh</title></rect>').join('')+'<text x="30" y="174">'+extra.esc(start.toLocaleDateString())+'</text><text x="260" y="174">'+extra.esc(now.toLocaleDateString())+'</text></svg>';
        this.showHistory('',plot);
      }catch{if(request===this.historyRequest)this.showHistory('Не вдалося отримати статистику енергії.');}
    }
    async loadDetailsHistory() {
      for(const button of this.shadowRoot.querySelectorAll('[data-history-period]'))button.setAttribute('aria-pressed',String(button.dataset.historyPeriod===this.historyPeriod));
      if(this.historyPeriod!=='Power')return this.loadEnergyHistory();
      const gauge = gaugeByKey[this.detailsKey];
      const id = this.config[gauge.key];
      const request = ++this.historyRequest;
      if(id?.startsWith('sensor.anma_lcd_')){this.showHistory('Для історії під’єднайте постійний сенсор загальної потужності.');return;}
      const hass = this.hassData;
      if (!id) {
        this.showHistory("Виберіть датчик потужності в редакторі картки.");
        return;
      }
      if (typeof hass?.callWS !== "function") {
        this.showHistory("Історія Home Assistant тимчасово недоступна.");
        return;
      }
      this.showHistory("Завантажую історію…");
      const end = Date.now();
      const start = end - historyDuration;
      const unit = hass.states?.[id]?.attributes?.unit_of_measurement;
      const invert = gauge.invert && this.config[gauge.invert];
      try {
        const history = await hass.callWS({
          type: "history/history_during_period",
          start_time: new Date(start).toISOString(),
          end_time: new Date(end).toISOString(),
          entity_ids: [id],
          include_start_time_state: true,
          significant_changes_only: false,
          minimal_response: true,
          no_attributes: false,
        });
        if (request !== this.historyRequest) return;
        const points = historyPoints(history?.[id], start, end, unit, invert);
        if (points.some(point => point.value !== null)) {
          this.showHistory("", historyPlot(points, start, end, hass.config?.time_zone));
        } else {
          this.showHistory("Немає записів потужності за останні 24 години.");
        }
      } catch {
        if (request === this.historyRequest) this.showHistory("Не вдалося завантажити історію Home Assistant.");
      }
    }

    openSettings() {
      if (!this.settingsScreen.hidden || this.detailsKey) return;
      this.settingsMenuId = null;
      this.screen.setAttribute("hidden", "");
      this.settingsScreen.hidden = false;
      this.renderSettings();
      this.settingsTitle.focus({ preventScroll: true });
    }

    closeSettings() {
      if (this.settingsScreen.hidden) return;
      this.settingsSession++;
      this.settingsScreen.hidden = true;
      this.screen.removeAttribute("hidden");
      this.clearSettingDrafts();
      if (this.isConnected) this.gear.focus({ preventScroll: true });
    }

    backFromSettings() {
      if (this.settingsMenuId === null) {
        this.closeSettings();
        return;
      }
      const tile = this.shadowRoot.querySelector(`[data-settings-menu="${this.settingsMenuId}"]`);
      this.settingsSession++;
      this.clearSettingDrafts();
      this.settingsMenuId = null;
      this.renderSettings();
      tile.focus({ preventScroll: true });
    }

    goToSettingsPage(menuId, page) {
      const menu = settingsMenus.find(({ id }) => id === menuId);
      if (this.savingSettings || !menu || page < 0 || page >= (menu.pages?.length ?? 1)) return;
      this.settingsMenuId = menuId;
      this.settingsPage = page;
      this.settingsNotice = "";
      this.renderSettings();
      this.settingsMain.scrollTop = 0;
      this.settingsTitle.focus({ preventScroll: true });
    }

    canEditSettings() {
      return this.hassData?.user?.is_admin === true && typeof this.hassData.callService === "function";
    }

    settingTarget(name) {
      const id = this.config?.[name];
      if (typeof id !== "string") return null;
      const [domain] = id.split(".", 1);
      const allowed = bindingDomains[name];
      if (!(Array.isArray(allowed) ? allowed.includes(domain) : allowed === domain)) return null;
      const entity = this.hassData?.states?.[id];
      const value = settingValue(entity, domain);
      return value === null ? null : { name, id, domain, entity, value };
    }

    batteryModeControl() {
      if (this.config?.battery_mode) return selectControl(this.settingTarget("battery_mode"), batteryChoices);
      const type = this.settingTarget("battery_control_mode");
      const mode = this.settingTarget("battery_operation_mode");
      const types = optionMatches(type, batteryChemistries);
      const modes = optionMatches(mode, batteryOperationModes);
      const currentType = selectedChoice(type, types);
      const currentMode = selectedChoice(mode, modes);
      const current = currentMode === "none" ? "none" : currentType === "lithium" ? "lithium"
        : currentType === "lead" ? currentMode : null;
      const choices = {
        lithium: currentType && currentMode && types.lithium && modes.soc,
        voltage: currentType && currentMode && types.lead && modes.voltage,
        soc: currentType && currentMode && types.lead && modes.soc,
        none: currentMode && modes.none,
      };
      return {
        current,
        targets: [type, mode].filter(Boolean),
        choices: Object.keys(choices).filter(key => choices[key]),
        writes: value => {
          const operation = { target: mode, value: modes[value === "lithium" ? "soc" : value] };
          if (value === "none") return [operation];
          const chemistry = { target: type, value: value === "lithium" ? types.lithium : types.lead };
          return value === "lithium" ? [operation, chemistry] : [chemistry, operation];
        },
      };
    }

    chargeStartTarget(name) {
      const soc = `${name}_soc`;
      const voltage = `${name}_voltage`;
      const mode = this.batteryModeControl().current;
      if (mode === "none") return null;
      if (mode === "lithium" || mode === "soc") return this.settingTarget(soc);
      if (mode === "voltage") return this.settingTarget(voltage);
      const single = [soc, voltage].filter(key => this.config?.[key]);
      return single.length === 1 ? this.settingTarget(single[0]) : null;
    }

    signalControl(name) {
      const target = this.settingTarget("charging_signal");
      const options = optionMatches(target, settingOptions.charging_signal);
      const key = selectedChoice(target, options);
      if (key === null) return unavailableSetting;
      const mask = Number(key);
      const isGen = name === "generator_signal";
      const bit = isGen ? 1 : 2;
      const current = Boolean(mask & bit);
      return {
        current,
        targets: [target],
        canWrite: options[mask ^ bit] !== undefined,
        writes: value => {
          const other = this.settingsDrafts.get(isGen ? "grid_signal" : "generator_signal");
          const otherBit = isGen ? 2 : 1;
          const otherValue = other?.route === target.id ? other.raw : Boolean(mask & otherBit);
          return [{ target, value: options[(value ? bit : 0) | (otherValue ? otherBit : 0)] }];
        },
      };
    }

    timeOfUseControl(target) {
      const options = target.entity.attributes.options;
      const offOptions = ["disabled", "off", "disable"];
      const off = options.find(option => offOptions.includes(optionKey(option)));
      const current = !offOptions.includes(optionKey(target.value));
      if (current) this.lastTimeOfUse = { id: target.id, option: target.value };
      const remembered = this.lastTimeOfUse;
      const enabled = remembered?.id === target.id && options.includes(remembered.option) ? remembered.option
        : options.find(option => ["enabled", "on", "enable", "week"].includes(optionKey(option)));
      return {
        current,
        targets: [target],
        canWrite: (current ? off : enabled) !== undefined,
        writes: value => [{ target, value: value ? enabled : off }],
      };
    }

    programChargingControl(name,index,kind) {
      const target=this.settingTarget(`tou_${index}_charging`);
      const options=optionMatches(target,{'0':['Disabled','Off','None'],'1':['Grid'],'2':['Generator','Gen'],'3':['Both']});
      const key=selectedChoice(target,options);if(key===null)return unavailableSetting;
      const mask=Number(key),bit=kind==='grid'?1:2,otherName=`tou_${index}_${kind==='grid'?'gen':'grid'}`;
      return {current:Boolean(mask&bit),targets:[target],writes:value=>{
        const other=this.settingsDrafts.get(otherName),otherBit=bit===1?2:1;
        const otherValue=other?.route===target.id?other.raw:Boolean(mask&otherBit);
        return [{target,value:options[(value?bit:0)|(otherValue?otherBit:0)]}];
      }};
    }

    readSetting(name) {
      const program=/^tou_(\d)_(grid|gen)$/.exec(name);
      if(program&&this.config[`tou_${program[1]}_charging`])return this.programChargingControl(name,program[1],program[2]);
      if (name === "battery_mode") return this.batteryModeControl();
      if (["generator_signal", "grid_signal"].includes(name) && this.config?.charging_signal) {
        return this.signalControl(name);
      }
      const target = ["generator_start", "grid_start"].includes(name)
        ? this.chargeStartTarget(name.replace("_start", "_charge_start"))
        : this.settingTarget(name);
      if (!target) return unavailableSetting;
      if (name === "time_of_use" && target.domain === "select") return this.timeOfUseControl(target);
      if (name === "work_mode" || name === "energy_pattern") return selectControl(target, settingOptions[name]);
      const unit = target.entity.attributes?.unit_of_measurement ?? "";
      return {
        current: target.value,
        targets: [target],
        unit: typeof unit === "string" ? (settingUnits[unit] ?? unit) : "",
        writes: value => {
          if(target.domain==='time'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))throw new Error('Invalid time / Неправильний час');
          if (target.domain === 'select' && !target.entity.attributes.options.includes(value)) throw new Error('Недоступний режим.');
          return [{ target, value: target.domain === "number" ? validateSettingNumber(value, target.entity.attributes ?? {}) : value }];
        },
      };
    }

    settingRoute(setting) {
      return setting.targets.map(({ id }) => id).join(",");
    }

    clearSettingDrafts() {
      this.pendingUiLanguage=null;
      this.shadowRoot.querySelector('[data-ui-language]').value=this.uiLanguage;
      this.settingsDrafts.clear();
      this.settingsNotice = "";
    }

    clearPendingSettings() {
      for (const pending of this.pendingSettings.values()) clearTimeout(pending.timer);
      this.pendingSettings.clear();
    }

    stageSetting(view) {
      if (view.input.disabled || !this.canEditSettings() || this.savingSettings) return;
      const { name, input } = view;
      const setting = this.readSetting(name);
      if (setting.current === null) return;
      const raw = input.type === "checkbox" ? input.checked : input.value;
      if (setting.current === raw) this.settingsDrafts.delete(name);
      else this.settingsDrafts.set(name, { raw, route: this.settingRoute(setting) });
      this.settingsNotice = "";
      this.renderSettings();
    }

    reconcileSettings() {
      for (const [id, pending] of this.pendingSettings) {
        const entity = this.hassData?.states?.[id];
        if (!sameSetting(settingValue(entity, pending.domain), pending.value)) continue;
        clearTimeout(pending.timer);
        this.pendingSettings.delete(id);
      }
    }

    renderSettings() {
      const menu = settingsMenus.find(({ id }) => id === this.settingsMenuId);
      const page = menu ? this.settingsPanels.get(`${menu.id}:${this.settingsPage}`) : null;
      const pageName = menu?.pages?.[this.settingsPage] ?? "";
      this.settingsTitle.textContent = menu?.id === 'grid' ? ['Grid Setting','Grid Setting/Connect','Grid Setting/IP protection','Grid Setting/F(W)','Grid Setting/V(W) V(Q)','Grid Setting/P(Q) P(F)','Grid Setting/LVRT'][this.settingsPage] : (menu?.title ?? "System Setup");
      this.settingsMenu.hidden = Boolean(menu);
      this.settingsBody.hidden = !menu;
      for (const panel of this.settingsPanels.values()) panel.element.hidden = panel !== page;
      for (const el of this.shadowRoot.querySelectorAll('[data-live]')) {
        const state = this.hassData?.states?.[this.config?.[el.dataset.live]]?.state;
        el.textContent = state && !['unknown','unavailable'].includes(state) ? state : '—';
      }
      const alarms = this.hassData?.states?.[this.config?.alarm_history];
      const log = this.shadowRoot.querySelector('[data-alarm-history]');
      if (log) log.textContent = alarms && !['unknown','unavailable'].includes(alarms.state) ? String(alarms.state) : 'Журнал не підключено';
      this.reconcileSettings();
      if (!page) return;
      this.settingsPageName.textContent = menu?.id === 'grid' ? 'Grid Set'+(this.settingsPage+1) : pageName;
      this.settingsPrevious.disabled = this.savingSettings || this.settingsPage === 0;
      this.settingsNext.disabled = this.savingSettings || this.settingsPage >= (menu.pages?.length ?? 1) - 1;
      this.settingsNext.style.visibility = this.settingsPage >= (menu.pages?.length ?? 1) - 1 ? 'hidden' : 'visible';
      const editable = this.canEditSettings();
      let connected = false;
      let dirty = false;
      let blocked = false;
      let waiting = false;
      let expired = false;
      for (const [name, views] of page.fields) {
        const setting = this.readSetting(name);
        let draft = this.settingsDrafts.get(name);
        const route = this.settingRoute(setting);
        if (draft && route && draft.route !== route) {
          this.settingsDrafts.delete(name);
          draft = undefined;
          this.settingsNotice = "Змінилася сутність для поля. Введи значення повторно.";
        }
        const available = setting.current !== null;
        const pending = setting.targets.map(({ id }) => this.pendingSettings.get(id)).filter(Boolean);
        const pendingUpdate = pending.some(item => !item.expired);
        const disabled = !editable || !available || pendingUpdate || this.savingSettings || setting.canWrite === false;
        const value = draft ? draft.raw : setting.current;
        connected ||= available;
        dirty ||= Boolean(draft);
        blocked ||= Boolean(draft && disabled);
        waiting ||= pendingUpdate;
        expired ||= pending.some(item => item.expired);
        for (const view of views) {
          const {element,unit}=view;let input=view.input;
          const isTime=setting.targets[0]?.domain==='time';
          if(isTime&&input.tagName==='SELECT'){
            const replacement=document.createElement('input');replacement.type='time';replacement.step='60';
            replacement.addEventListener('input',()=>this.stageSetting(view));input.replaceWith(replacement);view.input=input=replacement;
          }else if(!isTime&&input.type==='time'){
            const replacement=document.createElement('select');replacement.addEventListener('input',()=>this.stageSetting(view));input.replaceWith(replacement);view.input=input=replacement;
          }
          if(input.dataset.optionLabel){
            const options=setting.targets[0]?.entity.attributes?.options||[];
            const clean=v=>String(v).toLowerCase().replace(/[^a-z0-9]/g,'');
            const aliases=name==='gen_port_mode'?{'Generator Input':['Generator','Generator Input'],'SmartLoad Output':['SmartLoad','Smart Load','SmartLoad Output'],'Micro Inv Input':['Microinverter','Micro Inv Input']}[input.dataset.optionLabel]:null;
            const match=options.find(v=>(aliases||[input.dataset.optionLabel]).some(a=>clean(v)===clean(a)));
            input.value=match??input.dataset.optionLabel;
            input.dataset.optionAvailable=String(match!==undefined);
          }
          input.disabled = disabled || (input.type === "radio" && !setting.choices?.includes(input.value));
          if(input.dataset.optionLabel)input.disabled=disabled||input.dataset.optionAvailable!=='true';
          for(const button of element.querySelectorAll('[data-step]'))button.disabled=input.disabled;
          if (input.tagName === "SELECT") {
            const options = setting.targets[0]?.entity.attributes?.options || [];
            const signature = JSON.stringify(options);
            if (input.dataset.options !== signature) {
              input.replaceChildren(...(options.length ? options : ['—']).map(option => { const el = document.createElement('option'); el.value = option; el.textContent = option; return el; }));
              input.dataset.options = signature;
            }
            input.value = value === null ? '—' : String(value);
          } else if (input.type === "radio") input.checked = input.value === value;
          else if (input.type === "checkbox") {
            input.checked = value === true;
            input.indeterminate = !available;
          } else {
            const text = value === null ? "" : String(value).replace(".", ",");
            if (text !== input.value) input.value = text;
            unit.textContent = setting.unit ?? "";
          }
          element.toggleAttribute("data-unavailable", !available);
          element.toggleAttribute("data-dirty", Boolean(draft));
        }
      }
      this.viewOnlyLabel.hidden = editable || !page.fields.size;
      this.noSettingsLabel.hidden = connected || !page.fields.size;
      this.settingsApply.disabled = (!dirty || blocked) && !(this.settingsMenuId==='basic'&&this.settingsPage===1&&this.pendingUiLanguage);
      const message = this.settingsNotice || (this.savingSettings ? "Надсилаю зміни…" : waiting
        ? "Очікую оновлення стану в Home Assistant…" : expired
          ? "Home Assistant ще не підтвердив зміну. Звір стан перед повторною спробою." : "");
      this.settingsMessage.textContent = message;
      this.settingsMessage.hidden = !message;
      this.settingsMessage.toggleAttribute("data-error", Boolean(this.settingsNotice));
    }

    settingRequests(name, draft) {
      const setting = this.readSetting(name);
      if (setting.current === null || this.settingRoute(setting) !== draft.route || setting.canWrite === false) {
        throw new Error("Стан або прив’язка сутності змінилися. Перевір значення в меню.");
      }
      if (setting.choices && !setting.choices.includes(draft.raw)) {
        throw new Error("Обраний режим зараз недоступний.");
      }
      const requests = setting.writes(draft.raw);
      for (const { target, value } of requests) {
        if (!target || value === undefined) throw new Error("Цю комбінацію не підтримує обрана сутність.");
      }
      return requests;
    }

    async applySettings() {
      if(!this.settingsScreen.hidden&&!this.settingsApply.disabled&&this.settingsMenuId==='basic'&&this.settingsPage===1&&this.pendingUiLanguage){const language=this.pendingUiLanguage;this.pendingUiLanguage=null;this.setUiLanguage(language);this.renderSettings();return;}
      if (this.settingsScreen.hidden || this.settingsApply.disabled || !this.canEditSettings() || this.savingSettings) return;
      const page = this.settingsPanels.get(`${this.settingsMenuId}:${this.settingsPage}`);
      if (!page) return;
      const session = this.settingsSession;
      const requests = new Map();
      const edits = [];
      for (const [name, views] of page.fields) {
        const draft = this.settingsDrafts.get(name);
        if (!draft) continue;
        try {
          const plan = this.settingRequests(name, draft);
          edits.push({ name, draft, plan });
          for (const request of plan) {
            const id = request.target.id;
            if (requests.has(id) && !sameSetting(requests.get(id).value, request.value)) {
              throw new Error("Одна сутність отримала різні значення. Перевір прив’язки в редакторі.");
            }
            if (!requests.has(id)) requests.set(id, { ...request, name, route: draft.route });
          }
        } catch (error) {
          this.settingsNotice = error.message;
          this.renderSettings();
          views.find(view => !view.input.disabled)?.input.focus();
          return;
        }
      }
      // Apply limits before enabling a switch. Disable a switch before changing its limit.
      const order = ({ target, value }) => target.domain === "number" ? 1 : target.domain === "select" ? 2 : (value ? 3 : 0);
      const sequence = [...requests.values()].sort((a, b) => order(a) - order(b));
      const applied = new Set();
      this.settingsNotice = "";
      this.savingSettings = true;
      this.renderSettings();
      try {
        for (const { target, value, name, route } of sequence) {
          if (!this.isConnected || this.settingsSession !== session || !this.canEditSettings()) break;
          const current = this.settingTarget(target.name);
          if (this.settingRoute(this.readSetting(name)) !== route || current?.id !== target.id) {
            throw new Error("Сутність змінилася або недоступна. Перевір решту полів.");
          }
          if (!sameSetting(current.value, value)) {
            if (!sameSetting(current.value, target.value)) throw new Error("Значення змінилося в Home Assistant. Перевір решту полів.");
            if (target.domain === "number") validateSettingNumber(value, current.entity.attributes ?? {});
            if (target.domain === "select" && !current.entity.attributes.options.includes(value)) {
              throw new Error("Обраний режим зараз недоступний.");
            }
            await this.writeSetting(target, value);
            if (!this.isConnected || this.settingsSession !== session) break;
            this.awaitSetting(target, value);
          }
          applied.add(target.id);
        }
      } catch (error) {
        if (this.settingsSession === session) this.settingsNotice = error.message;
      } finally {
        if (this.settingsSession === session) {
          for (const { name, draft, plan } of edits) {
            if (plan.every(({ target }) => applied.has(target.id)) && this.settingsDrafts.get(name) === draft) {
              this.settingsDrafts.delete(name);
            }
          }
        }
        this.savingSettings = false;
        if (!this.settingsScreen.hidden) this.renderSettings();
      }
    }

    async writeSetting({ id, domain }, value) {
      try {
        const target = { entity_id: id };
        if (domain === "time") await this.hassData.callService(domain,"set_value",{time:value},target);
        else if (domain === "number") await this.hassData.callService(domain, "set_value", { value }, target);
        else if (domain === "select") await this.hassData.callService(domain, "select_option", { option: value }, target);
        else await this.hassData.callService(domain, value ? "turn_on" : "turn_off", {}, target);
      } catch {
        throw new Error("Home Assistant не прийняв зміну. Перевір сутність і повтори спробу.");
      }
    }

    awaitSetting({ id, domain }, value) {
      clearTimeout(this.pendingSettings.get(id)?.timer);
      const pending = { domain, value, expired: false };
      this.pendingSettings.set(id, pending);
      pending.timer = setTimeout(() => {
        pending.expired = true;
        if (!this.settingsScreen.hidden) this.renderSettings();
      }, settingTimeout);
      this.reconcileSettings();
    }

    setGauge(key, wattsValue) {
      const { element, value, fill } = this.gauges[key];
      const ratio = Math.abs(wattsValue ?? 0) / (this.scale * 1000);
      const fraction = Math.min(ratio, 1);
      const level = wattsValue === null ? 'unavailable' : ratio >= 1 ? 'overload' : ratio >= .8 ? 'warning' : 'normal';
      const color = level === 'overload' ? '#ef4444' : level === 'warning' ? '#facc15' : '';
      element.dataset.powerLevel = level;
      // Preserve the firmware's green-to-amber gradient along the filled arc in both themes.
      fill.style.stroke = level === 'overload' ? '#ef4444' : 'url(#deye-lcd-arc)';
      if (color) {
        value.style.fill = color;
      } else {
        value.style.removeProperty('fill');
      }
      value.textContent = formatPower(wattsValue);
      value.toggleAttribute("data-unavailable", wattsValue === null);
      fill.setAttribute("d", fraction > 0 ? arc(0, fraction) : "");
    }

    setFlow(name, power) {
      const direction = power === null || Math.abs(power) < flowThreshold ? "off" : power > 0 ? "forward" : "backward";
      this.wires[name].dataset.flow = direction;
    }

    updateStatus(states, readings) {
      const status = states[this.config.inverter_status]?.state?.trim();
      const hasPower = readings.some(value => value !== null);
      const known = status && status !== "unknown" && status !== "unavailable";
      const label = known ? status : this.config.inverter_status || !hasPower ? "—" : "ON";
      this.statusLabel.textContent = label.length <= 6 ? label : label.slice(0, 5) + "…";
      this.statusLabel.setAttribute("aria-label", label);
      this.statusLabel.toggleAttribute("data-on", /^on$/i.test(label));
      this.screen.dataset.status = label === "—" ? "missing" : /^(?:F\d|fault|alarm|error|off$)/i.test(label) ? "fault" : "normal";
    }

    update() {
      if (!this.config || !this.hassData?.states) {
        if (!this.settingsScreen.hidden) this.renderSettings();
        return;
      }
      const states = this.hassData.states;
      const port=this.shadowRoot.querySelector('[data-gen-port-indicator]');
      const mode=String(states[this.config.gen_port_mode]?.state||'').toLowerCase().replace(/[^a-z0-9]/g,'');
      const kind=mode.includes('micro')?'micro':mode.includes('smart')?'smart':mode.includes('generator')||mode==='gen'?'generator':null;
      port.style.display=kind?'':'none';
      if(kind){
        port.dataset.mode=kind;
        const top=kind==='micro',y=top?66:211;
        const label=kind==='micro'?'Micro Inverter':kind==='smart'?'Smart Load':'Generator';
        port.setAttribute('aria-label',label);
        const symbol=port.querySelector('[data-gen-port-symbol]');symbol.setAttribute('transform',`translate(202 ${y})`);
        symbol.innerHTML=kind==='micro'?'<rect x="-13" y="-10" width="26" height="19" rx="2"/><path d="M-9 -4h18M-9 1h6l3 4 4-8 3 4h3M-17 -4h4m26 0h4"/>':kind==='generator'?'<rect x="-14" y="-9" width="28" height="19" rx="2"/><path d="M-7 -9v-4h14v4M-18 10h36M6 -4h5M6 0h5"/><circle cx="-5" cy="1" r="5"/>':'<path d="M-15 0L0 -12 15 0M-11 -3v14h22V-3M-3 11V3h6v8"/>';
        const power=watts(states[this.config[kind==='micro'?'micro_inverter_power':kind==='generator'?'generator_power':'smart_load_actual_power']||this.config.gen_port_power]);const powerText=port.querySelector('[data-gen-port-power]');powerText.setAttribute('x','202');powerText.setAttribute('y',String(y+(top?-25:34)));powerText.textContent=power===null?'—':Math.round(power)+' W';
        const text=port.querySelector('[data-gen-port-label]');text.setAttribute('x','202');text.setAttribute('y',String(y+(top?-15:23)));text.textContent=label;
        port.querySelector('[data-gen-port-wire]').setAttribute('d',top?'M202 77V111l-3 -5m3 5 3 -5':kind==='generator'?'M202 198V174l-3 5m3 -5 3 5':'M202 174V195l-3 -5m3 5 3 -5');
      }
      const grid = signed(watts(states[this.config.grid_power]), this.config.invert_grid);
      const gridDisconnected = isGridDisconnected(states[this.config.grid_connected], states[this.config.grid_voltage]);
      const battery = signed(watts(states[this.config.battery_power]), this.config.invert_battery);
      const load = watts(states[this.config.load_power]);
      const pv = this.config.pv_power ? watts(states[this.config.pv_power]) : 0;
      const percent = (id) => {
        const soc = reading(states[id]);
        return soc === null || soc < 0 || soc > 100 ? "—" : `${Number(soc.toFixed(2))}%`;
      };
      this.setGauge("grid_power", gridDisconnected ? 0 : grid);
      this.setGauge("battery_power", battery);
      this.setGauge("load_power", load);
      this.setGauge("pv_power", pv);
      this.socLabel.textContent = this.socLeft.textContent = percent(this.config.battery_soc);
      this.socRight.textContent = percent(this.config.battery_soc_2);
      this.setFlow("solar", pv);
      this.wires.grid.toggleAttribute("data-disconnected", gridDisconnected);
      this.setFlow("grid", gridDisconnected ? null : grid);
      this.setFlow("battery", signed(battery, true));
      this.setFlow("load", load);
      this.updateStatus(states, [grid, load, battery]);
      if (this.detailsKey) this.updateDetails();
      if (!this.settingsScreen.hidden) this.renderSettings();
      else if (this.pendingSettings.size) this.reconcileSettings();
      if (this.clockZone !== this.hassData.config?.time_zone) this.updateClock();
    }
  }

  const supportUrl = "https://send.monobank.ua/jar/2ovzwMr316";

  customElements.define(cardTag, DeyeLcd);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: cardTag,
    name: "Deye · LCD",
    description: `Екран Deye з двома темами, меню System Setup, показами по фазах і добовими графіками. ${version}.`,
  });
})();
