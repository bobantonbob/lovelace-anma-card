/* UI-only language layer. Entity IDs, option values and service payloads stay unchanged. */
(function(root){
 'use strict';
 const pairs=`
System Setup|Налаштування системи
Battery Setting|Налаштування батареї
Work Mode|Режим роботи
Smart Devices|Розумні пристрої
Grid Setting|Налаштування мережі
Gen Port Use|Порт генератора
Basic Setting|Основні налаштування
Advanced Function|Розширені функції
Device Info.|Інформація про пристрій
Language Select|Вибір мови
Pack Version|Версія пакета
Batt Mode|Режим батареї
Batt Set2|Батарея 2
Batt Set3|Батарея 3
Work Mode1|Режим роботи 1
Work Mode2|Режим роботи 2
Work Mode3|Режим роботи 3
Grid Set1|Мережа 1
Connect|Підключення
IP Protection|Захист мережі
PORT Set1|Порт 1
Basic Set1|Основні 1
Basic Set2|Основні 2
Func Set1|Функції 1
Func Set4|Функції 4
Wind Set|Вітрогенератор
Lithium|Літієва
Lithium Mode|Літієвий режим
Use Batt V|За напругою батареї
Use Batt %|За зарядом батареї
No Batt|Без батареї
Batt Capacity|Ємність батареї
Max A Charge|Макс. струм заряду
Max A Discharge|Макс. струм розряду
Activate Battery|Активація батареї
Disable Float Charge|Вимкнути підтримувальний заряд
Shutdown %|Вимкнення, %
Low Batt %|Низький заряд, %
Restart %|Повторний запуск, %
Scroll sideways to see Batt and Gen|Прокрутіть убік, щоб побачити Бат. і Ген.
Charge|Заряд
Gen Charge|Заряд від генератора
Grid Charge|Заряд від мережі
Gen Signal|Сигнал генератора
Grid Signal|Сигнал мережі
Gen Force|Примусовий запуск генератора
Selling First|Пріоритет продажу
Max Solar Power|Макс. сонячна потужність
Zero Export To Load|Без експорту за навантаженням
Zero Export To CT|Без експорту за CT
Solar Sell|Продаж сонячної енергії
Max Sell Power|Макс. потужність продажу
Zero-export Power|Резерв нульового експорту
Energy pattern|Пріоритет енергії
Batt First|Спочатку батарея
Load First|Спочатку навантаження
Grid Peak Shaving|Обмеження піків мережі
Gen Peak Shaving|Обмеження піків генератора
Gen peak-shaving|Обмеження піків генератора
Time Of Use|Часовий розклад
Time Of Use · Week|Часовий розклад · тиждень
Grid|Мережа
Gen|Ген.
Sell|Продаж
Time|Час
Power|Потужність
Batt|Батарея
Start|Початок
End|Кінець
ON SOC|SOC увімкнення
OFF SOC|SOC вимкнення
Enable|Увімкнути
Switch|Перемикач
Time Mode|За розкладом
Manual Mode|Ручний режим
Off grid off|Вимкнути без мережі
Smart CT|Розумні CT
Smart Switch|Розумний перемикач
Smart EV Charge|Розумний заряд авто
Smart TX|Розумний TX
Enable CT1|Увімкнути CT1
Enable CT2|Увімкнути CT2
SN|Серійний номер
Plug and play / Time of charge|Після підключення / за розкладом
Free Watt|Вільна потужність
ADJ SOC|Регулювання SOC
Solar Only SOC|SOC лише від сонця
OFF EV Charge OFF|Вимкнути заряд авто
EV Charge Connect at Grid Port|Заряд авто на порту мережі
EV Charge Connect at LD Port|Заряд авто на порту навантаження
Max charge power|Макс. потужність заряду
Channel|Канал
Smart TX · Reset is not exposed as a persistent switch.|Smart TX · Скидання не доступне як постійний перемикач.
Unlock Grid Setting|Розблокувати налаштування мережі
Grid Mode|Стандарт мережі
Grid Frequency|Частота мережі
INV Output Voltage|Вихідна напруга інвертора
Grid Type|Тип мережі
Normal connect|Звичайне підключення
Reconnect after trip|Повторне підключення після захисту
ramp|Темп наростання
low frequency|Мін. частота
high frequency|Макс. частота
low voltage|Мін. напруга
high voltage|Макс. напруга
time|Час
Over Voltage Uv (10 min)|Перенапруга Uv (10 хв)
Protection|Захист
Threshold|Поріг
Over Frequency|Підвищена частота
Under Frequency|Знижена частота
droop|Нахил характеристики
start frequency|Частота початку
stop frequency|Частота завершення
start delay|Затримка початку
stop delay|Затримка завершення
Point|Точка
Voltage|Напруга
Current|Струм
Reactive power|Реактивна потужність
Tau|Стала часу
Lock-in Power|Потужність увімкнення
Lock-out Power|Потужність вимкнення
Lock-in|Увімкнення
Lock-out|Вимкнення
Fixed Q|Фіксована Q
Zero I mode|Режим нульового струму
Mode|Режим
Rated Power|Номінальна потужність
SmartLoad Output Power|Потужність розумного навантаження
AC couple on grid side|AC-зв’язок на стороні мережі
AC couple on load side|AC-зв’язок на стороні навантаження
GEN connect to Grid input|Генератор на вході мережі
On Grid always on|Завжди увімкнено за наявності мережі
Off grid immediately off|Негайно вимкнути без мережі
Micro Inv Input ON %|Увімкнення мікроінвертора, %
OFF %|Вимкнення, %
AC Couple Freq High|Верхня частота AC-зв’язку
Time Syncs|Синхронізація часу
Beep|Звуковий сигнал
Auto Dim|Автозатемнення
Year|Рік
Month|Місяць
Day|День
Hour|Година
Minute|Хвилина
24-Hour|24-годинний формат
Lock out all changes|Заблокувати всі зміни
Solar Arc Fault ON|Захист від сонячної дуги
Backup Delay|Затримка резерву
System selfcheck|Самоперевірка системи
CT Ratio|Коефіцієнт CT
Neutral to earth bonding|З’єднання нейтралі із землею
BMS_Err_Stop|Зупинка за помилкою BMS
CEI 0-21 Report|Звіт CEI 0-21
Parallel|Паралельна робота
Factory Reset|Заводські налаштування
Clear Arc_Fault|Скинути помилку дуги
Generator Input|Вхід генератора
SmartLoad Output|Вихід розумного навантаження
Micro Inv Input|Вхід мікроінвертора
Master|Головний
Slave|Підлеглий
Ex_Meter For CT|Зовнішній лічильник для CT
AC Couple Frz High|Верхня частота AC-зв’язку
Master / Slave|Головний / підлеглий
Modbus SN|Адреса Modbus
A / B / C Phase|Фаза A / B / C
Ex Meter For CT|Зовнішній лічильник для CT
Meter Select|Вибір лічильника
A Phase|Фаза A
B Phase|Фаза B
C Phase|Фаза C
Disable Smart CT|Вимкнути розумні CT
Grid Tie Meter2|Другий мережевий лічильник
Export P limiter|Обмеження експорту
Import P limiter|Обмеження імпорту
AC Output P Limit|Ліміт вихідної потужності AC
AC backup P Limit|Ліміт резервної потужності AC
Low Noise Mode|Тихий режим
Low Power Mode-Low Batt|Економний режим за низького заряду
MPPT Multi Point Scanning|Багатоточкове сканування MPPT
Inverter ID|Ідентифікатор інвертора
HMI Version|Версія HMI
MAIN Version|Основна версія
Alarms Code / Occurred|Код помилки / час виникнення
Disable TOU When Grid Off|Вимкнути розклад без мережі
Batt Supply @ Grid Cut|Живлення від батареї при зникненні мережі
Enable grid start value|Увімкнути поріг запуску від мережі
Gen charge stop %|Завершення заряду від генератора, %
Grid charge stop %|Завершення заряду від мережі, %
Frequency|Частота
Today|Сьогодні
Total|Загалом
BUY Today|Куплено сьогодні
BUY Total|Куплено загалом
SELL Today|Продано сьогодні
SELL Total|Продано загалом
Li-BMS Charge limit|Ліміт заряду Li-BMS
Li-BMS Discharge limit|Ліміт розряду Li-BMS
Li-BMS Alarm|Помилка Li-BMS
Power / Energy|Потужність / енергія
Inverter|Інвертор
Solar generation|Сонячна генерація
Battery|Батарея
Load|Навантаження
Battery temperature|Температура АКБ
Phase readings|Покази по фазах
Individual batteries|Окремі АКБ
Reading|Показ
Reading unavailable|Показ недоступний
No entity selected|Сутність не вибрано
Back|Назад
‹ Back|‹ Назад
Close|Закрити
Previous page|Попередня сторінка
Next page|Наступна сторінка
Back · discard unapplied changes|Назад · скасувати незастосовані зміни
Apply page changes|Застосувати зміни сторінки
Read only · HA administrator access required for changes|Лише перегляд · зміни доступні адміністратору HA
Connect control entities in the card editor.|Під’єднай сутності керування в редакторі картки.
Grid disconnected|Мережу від’єднано
Inverter settings|Налаштування інвертора
About Deye LCD|Про картку Deye LCD
Deye home screen|Головний екран Deye
24-hour power chart in kilowatts|Графік потужності за останні 24 години у кіловатах
Connect a cumulative energy meter (kWh) for this chart.|Під’єднайте накопичувальний лічильник енергії (kWh) для цього графіка.
No data|Немає даних
Home Assistant history is temporarily unavailable.|Історія Home Assistant тимчасово недоступна.
Loading energy…|Завантажую енергію…
No energy statistics for this period.|За цей період немає статистики енергії.
Could not retrieve energy statistics.|Не вдалося отримати статистику енергії.
Connect a persistent total power sensor for history.|Для історії під’єднайте постійний сенсор загальної потужності.
Select a power sensor in the card editor.|Виберіть датчик потужності в редакторі картки.
Loading history…|Завантажую історію…
No power records for the last 24 hours.|Немає записів потужності за останні 24 години.
Could not load Home Assistant history.|Не вдалося завантажити історію Home Assistant.
Mode unavailable.|Недоступний режим.
Alarm history not connected|Журнал не підключено
The field entity changed. Enter the value again.|Змінилася сутність для поля. Введи значення повторно.
Sending changes…|Надсилаю зміни…
Waiting for Home Assistant state update…|Очікую оновлення стану в Home Assistant…
Home Assistant has not confirmed the change yet. Check its state before retrying.|Home Assistant ще не підтвердив зміну. Звір стан перед повторною спробою.
The entity state or binding changed. Check the menu values.|Стан або прив’язка сутності змінилися. Перевір значення в меню.
The selected mode is currently unavailable.|Обраний режим зараз недоступний.
This combination is not supported by the selected entity.|Цю комбінацію не підтримує обрана сутність.
An entity received conflicting values. Check the editor bindings.|Одна сутність отримала різні значення. Перевір прив’язки в редакторі.
The entity changed or is unavailable. Check the remaining fields.|Сутність змінилася або недоступна. Перевір решту полів.
The value changed in Home Assistant. Check the remaining fields.|Значення змінилося в Home Assistant. Перевір решту полів.
Home Assistant rejected the change. Check the entity and try again.|Home Assistant не прийняв зміну. Перевір сутність і повтори спробу.
Enter a number.|Введи число.
W|Вт
kW|кВт
A|А
V|В
mA|мА
mV|мВ
kV|кВ
Mon|Пн
Tue|Вт
Wed|Ср
Thu|Чт
Fri|Пт
Sat|Сб
Sun|Нд
ON|ON
OFF|OFF
Off grid|Off grid
DEMO · Deye LCD · sample data|DEMO · Deye LCD · тестові дані
Deye LCD bindings|Прив’язки Deye LCD
Device Info · entities|Device Info · сутності
Theme|Тема
Inverter model|Модель інвертора
Number of phases|Кількість фаз
1 phase|1 фаза
3 phases|3 фази
Classic|КЛАСіК
Battery 1 · state of charge|Батарея 1 · заряд
Battery 2 · state of charge|Батарея 2 · заряд
Parallel label|Позначка паралельної роботи
Grid status|Стан мережі
Inverter status|Статус інвертора
Positive battery sensor values mean charging|Додатний показ датчика батареї означає заряд
Negative grid sensor values mean import|Від’ємний показ датчика мережі означає імпорт
Inverter and parallel operation|Інвертор і паралельна робота
Deye · detailed readings and energy|Deye · детальні показники та енергія
Deye LCD · additional menus|Deye LCD · додаткові меню
Unbound main readings reuse existing ANMA bindings. Inverter settings require selected HA entities. Connect a persistent total power sensor for aggregate history.|Порожні головні показники використовують наявні прив’язки ANMA. Налаштування інвертора працюють лише з вибраними сутностями HA. Для історії суми підключіть постійний сенсор загальної потужності.
`;
 const extraPairs=`
Controls|Керування
individual readings|окремі покази
additional menus|додаткові меню
KW|кВт
Battery 1|АКБ 1
Battery 2|АКБ 2
Gen Start|Запуск генератора
Grid Start|Запуск від мережі
Gen · charging current|Gen · струм заряду
Grid · charging current|Grid · струм заряду
Deye LCD card for Home Assistant by the ANMA Electric channel.|Картка Deye LCD для Home Assistant від каналу ANMA Electric.
YouTube channel|Канал на YouTube
Support via monobank|Підтримати через monobank
H-Auto and ТЕХНіКА donation jar|Банка H-Auto та ТЕХНіКА
Easter egg by ТЕХНіКА|Пасхалка від ТЕХНіКА
H-Auto and ТЕХНіКА donation QR code|QR-код Банки H-Auto та ТЕХНіКА
Batt Mode · single selector for all modes|Batt Mode · один селектор з усіма режимами
Battery type · lithium / lead acid|Тип АКБ · літій / свинець
Battery control · voltage / SOC / no battery|Керування АКБ · напруга / заряд / без АКБ
Battery capacity|Ємність АКБ
Maximum charging current|Максимальний струм заряду
Maximum discharging current|Максимальний струм розряду
Activate Battery · battery activation|Activate Battery · активація АКБ
Disable Float Charge · disable maintenance charging|Disable Float Charge · вимкнення підтримувального заряду
Gen Start · SOC, %|Gen Start · заряд, %
Gen Start · voltage, V|Gen Start · напруга, В
Grid Start · SOC, %|Grid Start · заряд, %
Grid Start · voltage, V|Grid Start · напруга, В
Battery charging current from generator|Струм заряду АКБ від генератора
Battery charging current from grid|Струм заряду АКБ від мережі
Gen Charge · charging from generator|Gen Charge · заряд від генератора
Grid Charge · charging from grid|Grid Charge · заряд від мережі
Charging Signal · combined Gen / Grid selector|Charging Signal · спільний селектор Gen / Grid
Gen Signal · separate switch|Gen Signal · окремий перемикач
Grid Signal · separate switch|Grid Signal · окремий перемикач
Gen Force · forced generator start|Gen Force · примусовий запуск генератора
Work Mode · operating mode|Work Mode · режим роботи
Max Solar Power · solar generation limit|Max Solar Power · ліміт сонячної генерації
Solar Sell · sell surplus|Solar Sell · продаж надлишку
Max Sell Power · export limit|Max Sell Power · ліміт продажу
Zero-export Power · zero export reserve|Zero-export Power · значення нульового експорту
Energy pattern · battery / load priority|Energy pattern · пріоритет АКБ / навантаження
Grid peak shaving · switch|Шейвінг мережі · перемикач
Grid peak shaving · limit|Шейвінг мережі · значення
Time Of Use · switch or selector|Time Of Use · перемикач або селектор
Generator peak shaving · switch|Шейвінг генератора · перемикач
Generator peak shaving · limit|Шейвінг генератора · значення
The default theme is Classic.|Тема за замовчуванням — КЛАСіК.
For 80 + 80 kW use combined power sensors and Master setting entities.|Для 80 + 80 кВт вибирай сумарні сенсори потужності та сутності налаштувань Master.
For three phases, connect L1–L3 sensors in the Grid and Load groups.|Для 3 фаз можна під’єднати датчики L1–L3 у групах «Мережа» та «Навантаження».
Choose a binary sensor where off means the grid is unavailable.|Обери двійковий датчик, у якому «вимкнено» означає, що мережі немає.
If your integration exposes battery type and mode separately, leave this field empty and connect both selectors below.|Якщо інтеграція окремо дає тип і режим АКБ, залиш це поле порожнім і під’єднай обидва селектори нижче.
Use the combined Normal / Grid / Generator / Both selector when available. Otherwise connect the individual switches below.|Якщо є спільний селектор Normal / Grid / Generator / Both, використай його. Для окремих перемикачів заповни поля нижче.
On Work Mode page 2, this checkbox is independent of Grid Peak Shaving.|На другій сторінці Work Mode галочка знімається окремо від Grid Peak Shaving.
Select only the Gen Force entity. Some integrations cannot change this inverter setting.|Обирай сутність лише для Gen Force. Деякі інтеграції не змінюють стан цього пункту на інверторі.
Grid input voltage. A reading of 0 V also helps detect an outage.|Напруга входу Grid. Також допомагає визначити Off grid, коли показує 0 В.
`;
 const en=new Map(),uk=new Map();for(const line of (pairs.trim()+'\n'+extraPairs.trim()).split('\n')){const [e,u]=line.split('|');en.set(e,e);en.set(u,e);uk.set(e,u);uk.set(u,u);}
 // "Вт" is also the Ukrainian abbreviation of Tuesday. Handle weekday separately.
 en.set('Вт','W');
 function translate(value,lang){const map=lang==='uk'?uk:en,key=value.trim();if(map.has(key))return value.replace(key,map.get(key));
   if(lang!=='uk'&&/^Допустиме (значення|крок) /.test(key))return value.replace('Допустиме значення ','Allowed value ').replace('Допустимий крок ','Allowed step ').replace(/від /g,'from ').replace(/ до /g,' to ');
   if(key.includes(' · ')){const parts=key.split(' · ');const translated=parts.map(part=>map.get(part)||part).join(' · ');if(translated!==key)return value.replace(key,translated);}
   const rules=lang==='uk'?[[/^MPPT(\d+) WindTurbine$/,'MPPT$1 Вітротурбіна'],[/^PV(\d+) Enable$/,'Увімкнути PV$1'],[/^Total: /,'Загалом: '],[/^Battery (\d+)/,'АКБ $1']]:[[/^АКБ (\d+)/,'Battery $1'],[/^Фаза /,'Phase '],[/ · окремі покази$/,' · individual readings'],[/^Керування · /,'Controls · '],[/^Головний екран /,'Home screen '],[/кВт/g,'kW'],[/^Допустимий крок /,'Allowed step ']];
   let text=value;for(const [re,replacement]of rules)text=text.replace(re,replacement);
   if(text!==value&&text.includes(' · '))text=text.split(' · ').map(part=>map.get(part)||part).join(' · ');
   return text;
 }
 function attach(container,getLanguage){const texts=new WeakMap(),attrs=new WeakMap();let observer;
   const apply=()=>{observer?.disconnect();const lang=getLanguage()==='uk'?'uk':'en';const walker=document.createTreeWalker(container,NodeFilter.SHOW_TEXT);let node;
     while(node=walker.nextNode()){if(node.parentElement?.closest('style,script,[data-live],[data-alarm-history],datalist,[data-ui-language]'))continue;
       let record=texts.get(node);if(!record||node.data!==record.output)record={source:node.data};const output=translate(record.source,lang);record.output=output;texts.set(node,record);if(node.data!==output)node.data=output;
     }
     for(const el of container.querySelectorAll('[title],[aria-label]')){let record=attrs.get(el)||{};for(const name of ['title','aria-label']){const value=el.getAttribute(name);if(value===null)continue;let r=record[name];if(!r||value!==r.output)r={source:value};r.output=translate(r.source,lang);if(value!==r.output)el.setAttribute(name,r.output);record[name]=r;}attrs.set(el,record);}
     const weekday=container.querySelector('[data-weekday]');if(weekday&&lang==='en'){const reverse={Пн:'Mon',Вт:'Tue',Ср:'Wed',Чт:'Thu',Пт:'Fri',Сб:'Sat',Нд:'Sun',W:'Tue'};if(reverse[weekday.textContent])weekday.textContent=reverse[weekday.textContent];}
     container.host?.scheduleSettingsFit?.();
     observer?.observe(container,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label']});
   };
   observer=new MutationObserver(apply);apply();return {apply,disconnect:()=>observer.disconnect()};
 }
 root.AnmaDeyeI18n={translate,attach};
})(typeof window!=='undefined'?window:globalThis);
