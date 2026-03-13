/**
 * ⛽ 油价实时查询小组件
 * 脚本作者 Egern 群友 tg://user?id=5122789128
 * 由Egern二次修改
 * 📚 使用教程
 * ═══════════════════════════════════════════════════
 *
 * 1️⃣ 环境变量配置
 * ─────────────────────────────────────────────────
 * 在 Egern 小组件配置中添加以下环境变量：
 *
 * 名称：城市
 * 值：湖北（或 湖北省，或其他省份名）
 *
 * 名称：SHOW_DIESEL
 * 值：true（显示柴油）或 false（不显示柴油）
 *
 *
 * 2️⃣ 支持的省份/直辖市
 * ─────────────────────────────────────────────────
 * 直辖市：北京、上海、天津、重庆
 *
 * 省份：
 * • 广东、江苏、浙江、山东、河南、河北
 * • 四川、湖北、湖南、安徽、福建、江西
 * • 辽宁、陕西、海南、山西、吉林、黑龙江
 * • 云南、贵州、广西、甘肃、青海、宁夏
 * • 新疆、西藏、内蒙古
 *
 * ═══════════════════════════════════════════════════
 */

export default async function (ctx) {
 const city = (ctx.env.城市 || "上海").trim();
 const SHOW_DIESEL = (ctx.env.SHOW_DIESEL || "true").trim() !== "false";

 const now = new Date();
 const timeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
 const refreshTime = new Date(Date.now() + 6*60*60*1000).toISOString();

 const backgroundColor = { light: "#FFFFFF", dark: "#1C1C1E" };

 const COLORS = {
  primary: { light: "#1A1A1A", dark: "#FFFFFF" },
  secondary: { light: "#666666", dark: "#CCCCCC" },
  tertiary: { light: "#999999", dark: "#888888" },
  card: { light: "#F5F5F7", dark: "#2C2C2E" },
  cardBorder: { light: "#E0E0E0", dark: "#3A3A3C" },
  p92: { light: "#FF9F0A", dark: "#FFB347" },
  p95: { light: "#FF6B35", dark: "#FF8A5C" },
  p98: { light: "#FF3B30", dark: "#FF6B6B" },
  diesel: { light: "#30D158", dark: "#5CD67D" },
 };

 const CACHE_KEY = `autohome_oil_${city}`;
 let prices = {p92:null, p95:null, p98:null, diesel:null};
 let lastUpdate = null;
 let hasCache = false;
 
 try {
  const cached = ctx.storage.getJSON(CACHE_KEY);
  if (cached && cached.prices) {
   prices = cached.prices;
   lastUpdate = cached.lastUpdate || null;
   hasCache = true;
  }
 } catch(_){}

 let fetchError = false;
 let errorMsg = "";

 try {
  const resp = await ctx.http.get("https://www.autohome.com.cn/oil", {
   headers:{ "User-Agent":"Mozilla/5.0" },
   timeout:15000
  });
  const html = await resp.text();

  // 🔧 新匹配逻辑：直接找省份位置，取后面 4 个价格
  const cityVariants = [
   city,
   city.replace("省", ""),
   city + "省",
  ];

  let matchSuccess = false;

  for (const variant of cityVariants) {
   if (matchSuccess) break;
   
   const cityIndex = html.indexOf(variant);
   if (cityIndex >= 0) {
    // 获取省份后面的内容（1000 字符内）
    const content = html.substring(cityIndex, cityIndex + 1000);
    
    // 提取所有价格数字
    const numbers = content.match(/\d+\.\d+/g) || [];
    
    if (numbers.length >= 4) {
     prices.p92 = parseFloat(numbers[0]);
     prices.p95 = parseFloat(numbers[1]);
     prices.p98 = parseFloat(numbers[2]);
     prices.diesel = SHOW_DIESEL ? parseFloat(numbers[3]) : null;
     lastUpdate = new Date().toISOString();
     ctx.storage.setJSON(CACHE_KEY, { prices, lastUpdate });
     matchSuccess = true;
     fetchError = false;
     console.log(`✅ 匹配成功：${variant}`);
    }
   }
  }

  if (!matchSuccess) {
   console.log(`❌ 未匹配到油价数据：${city}`);
   if (!hasCache) {
    fetchError = true;
    errorMsg = "未找到油价数据，请检查省份名";
   }
  }

 } catch (e) {
  console.log("❌ 网络请求失败:", e.message);
  if (!hasCache) {
   fetchError = true;
   errorMsg = e.message || "网络请求失败";
  }
 }

 const rows = [
  {label:"92 号",price:prices.p92,color:COLORS.p92},
  {label:"95 号",price:prices.p95,color:COLORS.p95},
  {label:"98 号",price:prices.p98,color:COLORS.p98},
  ...(SHOW_DIESEL && prices.diesel ? [{label:"柴油",price:prices.diesel,color:COLORS.diesel}]:[])
 ].filter(r => r.price!==null);

 function priceCard(row){
  return {
   type:"stack",
   direction:"column",
   alignItems:"center",
   justifyContent:"center",
   flex:1,
   padding:[8,4,8,4],
   backgroundColor: COLORS.card,
   borderRadius:12,
   borderWidth: 0.5,
   borderColor: COLORS.cardBorder,
   children:[
    {
     type:"stack",
     direction:"row",
     alignItems:"center",
     justifyContent:"center",
     width:44,
     height:22,
     backgroundColor: {
      light: row.color.light + "28",
      dark: row.color.dark + "28"
     },
     borderRadius:6,
     borderWidth:0.5,
     borderColor: {
      light: row.color.light + "55",
      dark: row.color.dark + "55"
     },
     children:[
      {
       type:"text",
       text:row.label,
       font:{size:"caption2",weight:"bold"},
       textColor: row.color,
       textAlign:"center"
      }
     ]
    },
    {
     type:"text",
     text:row.price.toFixed(2),
     font:{size:"title3",weight:"semibold"},
     textColor: COLORS.primary,
     textAlign:"center",
     lineLimit:1,
     minScale:0.7
    }
   ]
  }
 }

 return {
  type:"widget",
  padding:[10,8,10,8],
  gap:5,
  backgroundColor: backgroundColor,
  refreshAfter:refreshTime,
  children:[
   {
    type:"stack",
    direction:"row",
    alignItems:"center",
    gap:4,
    padding:[0,4,0,4],
    children:[
     {type:"image",src:"sf-symbol:fuelpump.fill",width:13,height:13,color:COLORS.p92},
     {type:"text",text:`${city}油价`,font:{size:"caption2",weight:"semibold"},textColor:COLORS.secondary},
     {type:"spacer"},
     fetchError
      ? {type:"text",text:errorMsg,font:{size:"caption2"},textColor:COLORS.p98}
      : null
    ].filter(Boolean)
   },
   rows.length > 0 ? {
    type:"stack",
    direction:"row",
    alignItems:"center",
    justifyContent:"space-between",
    gap:6,
    padding:[6,0,6,0],
    children: rows.map(priceCard)
   } : {
    type:"stack",
    direction:"column",
    alignItems:"center",
    justifyContent:"center",
    padding:[20,10,20,10],
    children:[
     {type:"image",src:"sf-symbol:exclamationmark.triangle.fill",width:24,height:24,color:COLORS.p98},
     {type:"text",text:fetchError?"数据获取失败":"暂无数据",font:{size:"body"},textColor:COLORS.secondary}
    ]
   },
   {
    type:"stack",
    direction:"row",
    alignItems:"center",
    padding:[0,4,0,4],
    children:[
     {type:"text",text:`${timeStr} 更新`,font:{size:"caption2"},textColor:COLORS.tertiary},
     {type:"spacer"},
     {type:"text",text:"元/升",font:{size:"caption2"},textColor:COLORS.tertiary}
    ]
   }
  ]
 }
}

