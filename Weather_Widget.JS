/**
 * 🌤️ 和风天气 - Egern 小组件（最终修复版）
 * 
 * ⚠️ 重要提示：LOCATION 请填写【城市名】，不要填省份名！
 * 
 * ✅ 正确示例：北京、上海、广州、深圳、杭州
 * ❌ 错误示例：广东、浙江、江苏（会返回省会城市）
 * 
 * ⚠️ 重要提示
 * 1.	公共域名已停用： devapi.qweather.com 、 api.qweather.com  等将从2026年起逐步停止服务
 * 2.	必须使用个人API Host：每个开发者账号都有独立的API Host
 * 3.	从控制台复制：登录 https://console.qweather.com/ → 设置 → 复制API Host

 * 环境变量：
 * KEY: 和风天气 API Key（必填）
 * LOCATION: 城市名，如"北京"
 * API_HOST: 你的专属 API 域名，如"xxx.re.qweatherapi.com"（必填！）
 */

export default async function(ctx) {
 const env = ctx.env || {};
 const widgetFamily = ctx.widgetFamily || 'systemMedium';
 const apiKey = env.KEY;
 const location = env.LOCATION || 'auto';
 const apiHost = env.API_HOST;

 if (!apiKey) {
 return renderError('⚠️ 请配置 KEY 环境变量');
 }
 
 if (!apiHost) {
 return renderError('⚠️ 请配置 API_HOST 环境变量\n\n获取方式：\n1. 登录和风天气控制台\n2. 找到你的专属域名\n3. 格式如：xxx.re.qweatherapi.com');
 }

 try {
 const { lon, lat, city } = await getLocation(ctx, location, apiKey);
 
 // 🔍 调试：输出获取到的坐标和实际城市
 console.log(`📍 输入：${location}, 实际：${city}, 经度：${lon}, 纬度：${lat}`);
 
 const now = await fetchWeatherNow(ctx, apiKey, lon, lat, apiHost);

 let air = null;
 if (widgetFamily !== 'systemSmall') {
 air = await fetchAirNow(ctx, apiKey, lon, lat, apiHost);
 }

 if (widgetFamily === 'systemSmall') {
 return renderSmall(now, city);
 } else {
 return renderMedium(now, air, city);
 }

 } catch (e) {
 return renderError(`❌ ${e.message}`);
 }
}

// 🔧 获取位置 - 使用和风官方地理 API 域名
async function getLocation(ctx, location, apiKey) {
 const cityName = location && location !== 'auto' ? location : '北京';
 
 try {
 // ✅ 地理 API 使用官方域名 geoapi.qweather.com
 const geoUrl = `https://geoapi.qweather.com/v2/city/lookup?location=${encodeURIComponent(cityName)}&key=${apiKey}&number=1&lang=zh`;
 const geoResp = await ctx.http.get(geoUrl, { timeout: 5000 });
 const geoData = await geoResp.json();
 
 console.log('🔍 地理 API 返回:', JSON.stringify(geoData));
 
 if (geoData.code === '200' && geoData.location?.[0]) {
 const loc = geoData.location[0];
 
 // ⚠️ 检查是否匹配到省会（用户输入省份名时）
 const inputIsProvince = ['广东', '浙江', '江苏', '山东', '四川', '湖南', '湖北', '河南', '河北', '福建', '安徽', '辽宁', '陕西', '山西', '江西', '云南', '贵州', '甘肃', '青海', '台湾', '海南', '吉林', '黑龙江'].includes(cityName);
 const returnedIsCapital = ['广州', '杭州', '南京', '济南', '成都', '长沙', '武汉', '郑州', '石家庄', '福州', '合肥', '沈阳', '西安', '太原', '南昌', '昆明', '贵阳', '兰州', '西宁', '台北', '海口', '长春', '哈尔滨'].includes(loc.name);
 
 if (inputIsProvince && returnedIsCapital) {
 console.log(`⚠️ 警告：输入省份名"${cityName}"，实际返回省会"${loc.name}"`);
 }
 
 console.log(`✅ 找到城市：${loc.name}, 坐标：${loc.lat},${loc.lon}`);
 return {
 lon: loc.lon,
 lat: loc.lat,
 city: loc.name // 使用官方返回的标准城市名
 };
 } else {
 console.log(`⚠️ 未找到城市 "${cityName}", 代码：${geoData.code}`);
 }
 } catch (e) {
 console.log(`❌ 城市 "${cityName}" 查询失败：${e.message}`);
 }
 
 // 兜底：返回北京坐标
 return { lon: '116.4074', lat: '39.9042', city: cityName };
}

// 🔧 获取实时天气 - 使用专属域名 + 中文
async function fetchWeatherNow(ctx, key, lon, lat, apiHost) {
 const url = `https://${apiHost}/v7/weather/now?location=${lon},${lat}&key=${key}&lang=zh`;
 const resp = await ctx.http.get(url, { timeout: 8000 });
 const data = await resp.json();

 if (data.code !== '200') {
 throw new Error(data.msg || '天气获取失败');
 }

 const now = data.now;
 return {
 temp: now.temp,
 text: now.text,
 icon: now.icon,
 humidity: now.humidity,
 windDir: now.windDir,
 windScale: now.windScale,
 windSpeed: now.windSpeed
 };
}

// 🔧 获取空气质量 - V1 接口 + 中国标准 + 中文
async function fetchAirNow(ctx, key, lon, lat, apiHost) {
 try {
 const url = `https://${apiHost}/airquality/v1/current/${lat}/${lon}?key=${key}&lang=zh`;
 const resp = await ctx.http.get(url, { timeout: 8000 });
 const data = await resp.json();
 
 let chinaIndex = null;
 
 if (data.indexes && Array.isArray(data.indexes)) {
 chinaIndex = data.indexes.find(idx => idx.code === 'cn-mee');
 
 if (!chinaIndex) {
 chinaIndex = data.indexes.find(idx => idx.code === 'cn-mee-1h');
 }
 
 if (!chinaIndex) {
 chinaIndex = data.indexes.find(idx => idx.aqi !== undefined && idx.aqi !== null);
 }
 }
 
 const aqiValue = chinaIndex?.aqi;
 
 return {
 aqi: aqiValue !== undefined && aqiValue !== null ? Math.round(aqiValue) : '--',
 category: getAQICategory(aqiValue)
 };
 
 } catch (e) {
 console.log('❌ AQI 请求失败:', e.message);
 return { aqi: '--', category: getAQICategory(null) };
 }
}

// 🔧 AQI 等级（0-300 绿色，301-500 红色）
function getAQICategory(aqi) {
 const num = parseInt(aqi);
 if (!num || isNaN(num)) return { text: '--', color: { light: '#999999', dark: '#888888' } };
 if (num <= 300) return { text: '良好', color: { light: '#30D158', dark: '#34C759' } };
 return { text: '污染', color: { light: '#FF3B30', dark: '#FF453A' } };
}

// 图标映射
function getWeatherIcon(iconCode) {
 const map = {
 '100': 'sun.max.fill', '101': 'cloud.sun.fill', '102': 'cloud.fill',
 '103': 'cloud.sun.fill', '104': 'cloud.fill',
 '300': 'cloud.bolt.rain.fill', '301': 'cloud.rain.fill', '302': 'cloud.rain.fill',
 '303': 'cloud.heavyrain.fill', '304': 'cloud.heavyrain.fill',
 '305': 'cloud.rain.fill', '306': 'cloud.rain.fill', '307': 'cloud.heavyrain.fill',
 '308': 'cloud.heavyrain.fill', '309': 'cloud.rain.fill', '310': 'cloud.heavyrain.fill',
 '311': 'cloud.heavyrain.fill', '312': 'cloud.heavyrain.fill', '313': 'cloud.bolt.rain.fill',
 '314': 'cloud.rain.fill', '315': 'cloud.heavyrain.fill', '316': 'cloud.heavyrain.fill',
 '317': 'cloud.heavyrain.fill', '318': 'cloud.heavyrain.fill', '350': 'cloud.bolt.rain.fill',
 '351': 'cloud.bolt.rain.fill', '399': 'cloud.rain.fill',
 '400': 'cloud.snow.fill', '401': 'cloud.snow.fill', '402': 'cloud.snow.fill',
 '403': 'cloud.snow.fill', '404': 'cloud.sleet.fill', '405': 'cloud.sleet.fill',
 '406': 'cloud.sleet.fill', '407': 'cloud.sleet.fill', '408': 'cloud.snow.fill',
 '409': 'cloud.snow.fill', '410': 'cloud.snow.fill', '456': 'cloud.sleet.fill',
 '457': 'cloud.sleet.fill', '499': 'cloud.drizzle.fill',
 '500': 'cloud.fog.fill', '501': 'cloud.fog.fill', '502': 'cloud.fog.fill',
 '503': 'cloud.fog.fill', '504': 'cloud.fog.fill', '505': 'cloud.fog.fill',
 '506': 'cloud.fog.fill', '507': 'cloud.fog.fill', '508': 'cloud.fog.fill',
 '509': 'cloud.fog.fill', '510': 'cloud.fog.fill', '511': 'cloud.fog.fill',
 '512': 'cloud.fog.fill', '513': 'cloud.fog.fill', '514': 'cloud.fog.fill',
 '515': 'cloud.fog.fill',
 '800': 'wind', '801': 'wind', '802': 'wind', '803': 'wind',
 '804': 'wind', '805': 'wind', '806': 'wind', '807': 'wind',
 '900': 'thermometer.sun.fill', '901': 'cloud.bolt.fill',
 '999': 'exclamationmark.triangle.fill'
 };
 return map[iconCode] || 'cloud.fill';
}

// 天气颜色
function getWeatherColor(iconCode) {
 const code = parseInt(iconCode);
 if (code >= 100 && code <= 104) return { light: '#FF9F0A', dark: '#FFB347' };
 if (code >= 300 && code <= 399) return { light: '#007AFF', dark: '#0A84FF' };
 if (code >= 400 && code <= 499) return { light: '#5856D6', dark: '#5E5CE6' };
 if (code >= 500 && code <= 515) return { light: '#8E8E93', dark: '#98989D' };
 if (code >= 800 && code <= 807) return { light: '#5856D6', dark: '#5E5CE6' };
 return { light: '#FF9F0A', dark: '#FFB347' };
}

// 小尺寸渲染
function renderSmall(now, city) {
 const icon = getWeatherIcon(now.icon);
 const color = getWeatherColor(now.icon);
 const nowTime = new Date();
 const timeStr = `${nowTime.getHours()}:${String(nowTime.getMinutes()).padStart(2, '0')}`;

 return {
 type: 'widget',
 padding: [14, 14, 14, 14],
 gap: 8,
 backgroundColor: { light: '#FFFFFF', dark: '#1C1C1E' },
 children: [
 {
 type: 'stack',
 direction: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 children: [
 {
 type: 'text',
 text: `📍 ${city}`,
 font: { size: 'caption1', weight: 'bold' },
 textColor: { light: '#1A1A1A', dark: '#FFFFFF' }
 },
 {
 type: 'text',
 text: timeStr,
 font: { size: 'caption2' },
 textColor: { light: '#999999', dark: '#888888' }
 }
 ]
 },
 {
 type: 'stack',
 direction: 'row',
 alignItems: 'center',
 gap: 10,
 children: [
 {
 type: 'image',
 src: `sf-symbol:${icon}`,
 width: 42,
 height: 42,
 color: color
 },
 {
 type: 'stack',
 direction: 'column',
 children: [
 {
 type: 'text',
 text: `${now.temp}°`,
 font: { size: 'title', weight: 'bold' },
 textColor: { light: '#1A1A1A', dark: '#FFFFFF' }
 },
 {
 type: 'text',
 text: now.text,
 font: { size: 'caption1' },
 textColor: { light: '#666666', dark: '#CCCCCC' }
 }
 ]
 }
 ]
 },
 {
 type: 'stack',
 direction: 'row',
 gap: 12,
 children: [
 {
 type: 'stack',
 direction: 'row',
 alignItems: 'center',
 gap: 4,
 children: [
 {
 type: 'image',
 src: 'sf-symbol:drop.fill',
 width: 12,
 height: 12,
 color: { light: '#007AFF', dark: '#0A84FF' }
 },
 {
 type: 'text',
 text: `${now.humidity}%`,
 font: { size: 'caption2', weight: 'medium' },
 textColor: { light: '#666666', dark: '#CCCCCC' }
 }
 ]
 },
 {
 type: 'stack',
 direction: 'row',
 alignItems: 'center',
 gap: 4,
 children: [
 {
 type: 'image',
 src: 'sf-symbol:wind',
 width: 12,
 height: 12,
 color: { light: '#5856D6', dark: '#5E5CE6' }
 },
 {
 type: 'text',
 text: `${now.windDir} ${now.windScale}级`,
 font: { size: 'caption2', weight: 'medium' },
 textColor: { light: '#666666', dark: '#CCCCCC' }
 }
 ]
 }
 ]
 }
 ]
 };
}

// 中尺寸渲染
function renderMedium(now, air, city) {
 const icon = getWeatherIcon(now.icon);
 const color = getWeatherColor(now.icon);
 const aqiColor = air ? getAQICategory(air.aqi).color : { light: '#999999', dark: '#888888' };
 const aqiText = air ? air.category.text : '--';
 const nowTime = new Date();
 const timeStr = `${nowTime.getMonth()+1}/${nowTime.getDate()} ${nowTime.getHours()}:${String(nowTime.getMinutes()).padStart(2, '0')}`;

 return {
 type: 'widget',
 padding: [16, 16, 16, 16],
 gap: 10,
 backgroundColor: { light: '#FFFFFF', dark: '#1C1C1E' },
 children: [
 {
 type: 'stack',
 direction: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 children: [
 {
 type: 'stack',
 direction: 'row',
 alignItems: 'center',
 gap: 6,
 children: [
 {
 type: 'image',
 src: 'sf-symbol:location.fill',
 width: 14,
 height: 14,
 color: { light: '#FF3B30', dark: '#FF453A' }
 },
 {
 type: 'text',
 text: city,
 font: { size: 'title3', weight: 'bold' },
 textColor: { light: '#1A1A1A', dark: '#FFFFFF' }
 }
 ]
 },
 {
 type: 'stack',
 direction: 'row',
 alignItems: 'center',
 gap: 8,
 children: [
 {
 type: 'text',
 text: `AQI ${air?.aqi || '--'}`,
 font: { size: 'caption1', weight: 'semibold' },
 textColor: aqiColor
 },
 {
 type: 'text',
 text: timeStr,
 font: { size: 'caption2' },
 textColor: { light: '#999999', dark: '#888888' }
 }
 ]
 }
 ]
 },
 {
 type: 'stack',
 direction: 'row',
 alignItems: 'center',
 gap: 12,
 children: [
 {
 type: 'image',
 src: `sf-symbol:${icon}`,
 width: 56,
 height: 56,
 color: color
 },
 {
 type: 'stack',
 direction: 'column',
 flex: 1,
 children: [
 {
 type: 'text',
 text: `${now.temp}°C`,
 font: { size: 'largeTitle', weight: 'bold' },
 textColor: { light: '#1A1A1A', dark: '#FFFFFF' }
 },
 {
 type: 'text',
 text: now.text,
 font: { size: 'title3', weight: 'medium' },
 textColor: { light: '#666666', dark: '#CCCCCC' }
 }
 ]
 },
 {
 type: 'stack',
 direction: 'column',
 alignItems: 'center',
 justifyContent: 'center',
 children: [
 {
 type: 'text',
 text: '空气质量',
 font: { size: 'caption2' },
 textColor: { light: '#666666', dark: '#CCCCCC' }
 },
 {
 type: 'text',
 text: aqiText,
 font: { size: 'title3', weight: 'bold' },
 textColor: aqiColor
 }
 ]
 }
 ]
 },
 {
 type: 'stack',
 direction: 'row',
 gap: 16,
 children: [
 {
 type: 'stack',
 direction: 'row',
 alignItems: 'center',
 flex: 1,
 gap: 8,
 children: [
 {
 type: 'image',
 src: 'sf-symbol:drop.fill',
 width: 18,
 height: 18,
 color: { light: '#007AFF', dark: '#0A84FF' }
 },
 {
 type: 'stack',
 direction: 'column',
 children: [
 {
 type: 'text',
 text: '湿度',
 font: { size: 'caption2' },
 textColor: { light: '#999999', dark: '#888888' }
 },
 {
 type: 'text',
 text: `${now.humidity}%`,
 font: { size: 'title3', weight: 'semibold' },
 textColor: { light: '#1A1A1A', dark: '#FFFFFF' }
 }
 ]
 }
 ]
 },
 {
 type: 'stack',
 direction: 'row',
 alignItems: 'center',
 flex: 1,
 gap: 8,
 children: [
 {
 type: 'image',
 src: 'sf-symbol:wind',
 width: 18,
 height: 18,
 color: { light: '#5856D6', dark: '#5E5CE6' }
 },
 {
 type: 'stack',
 direction: 'column',
 children: [
 {
 type: 'text',
 text: '风力',
 font: { size: 'caption2' },
 textColor: { light: '#999999', dark: '#888888' }
 },
 {
 type: 'text',
 text: `${now.windDir} ${now.windScale}级`,
 font: { size: 'title3', weight: 'semibold' },
 textColor: { light: '#1A1A1A', dark: '#FFFFFF' }
 }
 ]
 }
 ]
 },
 {
 type: 'stack',
 direction: 'row',
 alignItems: 'center',
 flex: 1,
 gap: 8,
 children: [
 {
 type: 'image',
 src: 'sf-symbol:gauge.medium',
 width: 18,
 height: 18,
 color: { light: '#FF9500', dark: '#FF9F0A' }
 },
 {
 type: 'stack',
 direction: 'column',
 children: [
 {
 type: 'text',
 text: '风速',
 font: { size: 'caption2' },
 textColor: { light: '#999999', dark: '#888888' }
 },
 {
 type: 'text',
 text: `${now.windSpeed}km/h`,
 font: { size: 'title3', weight: 'semibold' },
 textColor: { light: '#1A1A1A', dark: '#FFFFFF' }
 }
 ]
 }
 ]
 }
 ]
 }
 ]
 };
}

// 错误渲染
function renderError(msg) {
 return {
 type: 'widget',
 padding: 16,
 backgroundColor: { light: '#FFFFFF', dark: '#1C1C1E' },
 children: [{
 type: 'stack',
 direction: 'column',
 alignItems: 'center',
 gap: 8,
 children: [
 {
 type: 'image',
 src: 'sf-symbol:exclamationmark.triangle.fill',
 width: 28,
 height: 28,
 color: { light: '#FF3B30', dark: '#FF453A' }
 },
 {
 type: 'text',
 text: msg,
 font: { size: 'body' },
 textColor: { light: '#FF3B30', dark: '#FF453A' },
 textAlign: 'center'
 }
 ]
 }]
 };
}

