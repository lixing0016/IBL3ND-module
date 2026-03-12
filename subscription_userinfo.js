/**
 * 🧧 Egern 黄历小组件 - 今日黄历
 * 功能：公历/农历/节气/节日/宜忌/生肖/干支
 * 兼容：Egern widgets DSL + JavaScript API
 * 特点：纯内联实现 · 无需外部依赖 · 离线可用
 * 版本：1.0.0
 */

/* ========== 🌙 农历计算核心（1900-2050） ========== */
const Lunar = (function() {
  const lunarInfo = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
    0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0
  ];
  const nStr1 = ['日','一','二','三','四','五','六'];
  const nStr2 = ['初','十','廿','卅'];
  const nStr3 = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
  const animals = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  const gan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const zhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

  function getBit(num, n) { return (num >> n) & 1; }
  
  function lunarYearDays(y) {
    let sum = 348, i = 0x8000;
    for(; i > 0x8; i >>= 1) sum += getBit(lunarInfo[y-1900], i) ? 1 : 0;
    return sum + leapDays(y);
  }
  
  function leapDays(y) {
    return leapMonth(y) ? (getBit(lunarInfo[y-1900], 0x10000) ? 30 : 29) : 0;
  }
  
  function leapMonth(y) {
    return lunarInfo[y-1900] & 0xf;
  }
  
  function monthDays(y, m) {
    return getBit(lunarInfo[y-1900], 0x10000 - m) ? 30 : 29;
  }
  
  function getLunarDate(objDate) {
    let baseDate = new Date(1900, 0, 31);
    let offset = Math.floor((objDate - baseDate) / 86400000);
    let y = 1900, m = 1, d = 1, leap = 0;
    
    for(; y < 2050 && offset > 0; y++) {
      let yearDays = lunarYearDays(y);
      if(offset > yearDays) { offset -= yearDays; } else break;
    }
    
    let lm = leapMonth(y);
    for(let i = 1; i < 13 && offset > 0; i++) {
      if(lm > 0 && i === lm + 1 && !leap) { --i; leap = 1; continue; }
      let md = leap ? leapDays(y) : monthDays(y, i);
      if(offset <= md) { m = i; d = offset; break; }
      offset -= md; leap = 0;
    }
    
    const yearGanZhi = gan[(y-4)%10] + zhi[(y-4)%12];
    const animal = animals[(y-4)%12];
    
    let dayStr = nStr2[Math.floor((d-1)/10)] + nStr1[(d-1)%10];
    if(d === 10) dayStr = '初十';
    if(d === 20) dayStr = '二十';
    if(d === 30) dayStr = '三十';
    
    return {
      year: y, month: m, day: d, leap,
      monthStr: nStr3[m-1], dayStr, full: `${nStr3[m-1]}月${dayStr}`,
      ganZhi: yearGanZhi, animal,
      isLeap: leap && m === lm
    };
  }
  
  function getTodayTerm(date) {
    const termMap = {
      '1-5':'小寒','1-20':'大寒','2-4':'立春','2-19':'雨水',
      '3-5':'惊蛰','3-20':'春分','4-4':'清明','4-20':'谷雨',
      '5-5':'立夏','5-21':'小满','6-6':'芒种','6-21':'夏至',
      '7-7':'小暑','7-23':'大暑','8-7':'立秋','8-23':'处暑',
      '9-7':'白露','9-23':'秋分','10-8':'寒露','10-23':'霜降',
      '11-7':'立冬','11-22':'小雪','12-7':'大雪','12-21':'冬至'
    };
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return termMap[`${m}-${d}`] || null;
  }
  
  return { getLunarDate, getTodayTerm, animals, gan, zhi };
})();

/* ========== 📅 节日/宜忌数据 ========== */
const FESTIVALS = {
  '01-01': '元旦', '02-14': '情人节', '03-08': '妇女节', '04-04': '清明节',
  '05-01': '劳动节', '05-04': '青年节', '06-01': '儿童节', '07-01': '建党节',
  '08-01': '建军节', '09-10': '教师节', '10-01': '国庆节', '12-25': '圣诞节'
};

const LUNAR_FESTIVALS = {
  '1-1': '春节', '1-15': '元宵', '5-5': '端午', '7-7': '七夕',
  '8-15': '中秋', '9-9': '重阳', '12-8': '腊八', '12-30': '除夕'
};

const YIJI = {
  yi: ['出行','签约','祈福','嫁娶','开市','动土','纳财','祭祀','求医','学习'],
  ji: ['安葬','破土','诉讼','远行','投资','搬家','理发','开业']
};

function getYiJi(date) {
  const seed = date.getDate() + date.getMonth();
  const shuffledYi = [...YIJI.yi].sort(() => Math.random() - 0.5);
  const shuffledJi = [...YIJI.ji].sort(() => Math.random() - 0.5);
  return {
    yi: shuffledYi.slice(0, 3 + seed % 3),
    ji: shuffledJi.slice(0, 2 + (seed + 1) % 3)
  };
}

/* ========== 🎨 DSL 组件工厂 ========== */
function createText(text, options = {}) {
  const sizes = { title:28, headline:22, body:17, subhead:15, caption:12, tiny:10, callout:16, footnote:13 };
  return {
    type: 'text',
    text,
    font: { size: sizes[options.size] || 14, weight: options.weight || 'regular' },
    textColor: options.color || { light: '#1D1D1F', dark: '#F5F5F7' },
    textAlign: options.align || 'left',
    maxLines: options.maxLines || 1
  };
}

function createStack(children, options = {}) {
  return {
    type: 'stack',
    direction: options.direction || 'column',
    alignItems: options.align || 'start',
    gap: options.gap || 8,
    children: children.filter(Boolean)
  };
}

function createImage(src, options = {}) {
  const size = options.size || 20;
  const iconSrc = src.startsWith('sf:') ? src.replace('sf:', 'sf-symbol:') : `sf-symbol:${src}`;
  return {
    type: 'image',
    src: iconSrc,
    width: size,
    height: size,
    color: options.color || { light: '#666', dark: '#AAA' }
  };
}

/* ========== 🎨 主题配置 ========== */
const THEMES = {
  orange: { bg: ['#FFF9E6', '#FFEBCC'], accent: '#FF9500' },
  red: { bg: ['#FFF0F0', '#FFE0E0'], accent: '#FF3B30' },
  blue: { bg: ['#E6F3FF', '#CCE7FF'], accent: '#007AFF' },
  green: { bg: ['#E8F5E9', '#C8E6C9'], accent: '#34C759' },
  purple: { bg: ['#F3E5F5', '#E1BEE7'], accent: '#AF52DE' }
};

/* ========== 🧩 主入口函数 ========== */
export default async function(ctx) {
  const env = ctx.env || {};
  const size = env.WIDGET_SIZE || 'medium';
  const family = ctx.widgetFamily || 'systemMedium';
  
  const showLunar = env.SHOW_LUNAR !== 'false';
  const showTerms = env.SHOW_TERMS !== 'false';
  const showFestivals = env.SHOW_FESTIVALS !== 'false';
  const showYiJi = env.SHOW_YIJI !== 'false';
  const themeKey = env.THEME || 'orange';
  
  const theme = THEMES[themeKey] || THEMES.orange;
  const now = new Date();
  const solarMonth = now.getMonth() + 1;
  const solarDay = now.getDate();
  const solarStr = `${solarMonth}月${solarDay}日`;
  const weekday = `周${['日','一','二','三','四','五','六'][now.getDay()]}`;
  
  // 🌙 农历信息
  const lunar = Lunar.getLunarDate(now);
  const lunarStr = `${lunar.monthStr}月${lunar.dayStr}`;
  
  // 🎋 节气/节日
  const todayTerm = Lunar.getTodayTerm(now);
  const festKey = `${String(solarMonth).padStart(2, '0')}-${String(solarDay).padStart(2, '0')}`;
  const todayFestival = FESTIVALS[festKey];
  const lunarFestKey = `${lunar.month}-${lunar.day}`;
  const lunarFestival = LUNAR_FESTIVALS[lunarFestKey];
  
  // 🧧 宜忌
  const yiji = showYiJi ? getYiJi(now) : null;
  
  // 🎨 颜色配置
  const bgColor = { light: '#F8F9FA', dark: '#1C1C1E' };
  const subColor = { light: '#666666', dark: '#AAAAAA' };
  const festColor = { light: '#FF3B30', dark: '#FF6B6B' };
  const yiColor = { light: '#34C759', dark: '#30D158' };
  const jiColor = { light: '#FF3B30', dark: '#FF6B6B' };
  
  // 🔸 灵动岛/锁屏极简模式
  if (size === 'accessory' || family.includes('accessory')) {
    return {
      type: 'widget',
      backgroundColor: bgColor,
      padding: 6,
      children: [
        createStack([
          createImage('calendar', { size: 14, color: theme.accent }),
          createText(`${solarStr} ${weekday}`, { size: 'tiny', weight: 'medium' }),
          showLunar && createText(`· ${lunarStr}`, { size: 'tiny', color: subColor })
        ].filter(Boolean), { direction: 'row', gap: 4, align: 'center' })
      ]
    };
  }
  
  // 🔸 小尺寸
  if (size === 'small' || family === 'systemSmall') {
    return {
      type: 'widget',
      backgroundColor: bgColor,
      padding: 12,
      children: [
        createStack([
          createImage('calendar', { size: 18, color: theme.accent }),
          createText(solarStr, { size: 'headline', weight: 'bold' }),
          createText(weekday, { size: 'subhead', color: subColor })
        ], { direction: 'row', gap: 6, align: 'center' }),
        
        showLunar && createText(`🌙 ${lunarStr} · ${lunar.animal}年`, { size: 'caption', color: subColor }),
        (showTerms && todayTerm) && createText(`🍂 ${todayTerm}`, { size: 'caption', color: theme.accent }),
        (showFestivals && (todayFestival || lunarFestival)) && createText(
          `🎉 ${todayFestival || lunarFestival}`, 
          { size: 'caption', color: festColor }
        )
      ].filter(Boolean)
    };
  }
  
  // 🔸 标准/大尺寸 - 完整布局
  const blessing = todayFestival 
    ? `✨ ${todayFestival}安康` 
    : lunarFestival 
      ? `🎋 ${lunarFestival}吉祥` 
      : '✨ 诸事顺遂';
  
  return {
    type: 'widget',
    backgroundGradient: {
      type: 'linear',
      colors: theme.bg,
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    padding: 16,
    children: [
      // 📅 日期头部
      createStack([
        createStack([
          createImage('calendar', { size: 24, color: theme.accent }),
          createText(solarStr, { size: 'title', weight: 'bold' })
        ], { direction: 'row', gap: 8, align: 'center' }),
        createText(`${weekday} · ${lunarStr}`, { size: 'body', color: subColor }),
        showLunar && createText(`🐉 ${lunar.animal}年 ${lunar.ganZhi}`, { size: 'caption', color: subColor })
      ].filter(Boolean), { gap: 2 }),
      
      // 🧧 祝福语
      createText(blessing, { size: 'callout', weight: 'semibold', color: theme.accent, align: 'center' }),
      
      // 📋 信息区
      createStack([
        // 节气
        (showTerms && todayTerm) && createStack([
          createText('🍂 节气', { size: 'footnote', weight: 'bold' }),
          createText(`· 今天：${todayTerm}`, { size: 'caption', color: subColor })
        ], { gap: 4 }),
        
        // 节日
        (showFestivals && (todayFestival || lunarFestival)) && createStack([
          createText('🎉 节日', { size: 'footnote', weight: 'bold' }),
          createText(`· ${todayFestival || lunarFestival}`, { size: 'caption', color: festColor })
        ], { gap: 4 }),
        
        // 宜忌
        (showYiJi && yiji) && createStack([
          createStack([
            createText('✅ 宜', { size: 'footnote', weight: 'bold', color: yiColor }),
            createText(yiji.yi.join('·'), { size: 'caption', color: subColor, maxLines: 1 })
          ], { direction: 'row', gap: 4, align: 'center' }),
          createStack([
            createText('❌ 忌', { size: 'footnote', weight: 'bold', color: jiColor }),
            createText(yiji.ji.join('·'), { size: 'caption', color: subColor, maxLines: 1 })
          ], { direction: 'row', gap: 4, align: 'center' })
        ], { gap: 6 })
      ].filter(Boolean), { gap: 10 }),
      
      // ⬇️ 弹性间距
      { type: 'spacer' },
      
      // 🔚 页脚
      createText('🔄 本地计算 · 无需网络', { size: 'tiny', color: subColor, align: 'right' })
    ]
  };
}

