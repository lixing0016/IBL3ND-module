export default async function (ctx) {
  const env = ctx.env || {};
  const refreshMin = parseInt(env.REFRESH_MIN || "30", 10);

  // 获取今天日期 YYYY-MM-DD
  const now = new Date();
  const today = now.toISOString().split('T')[0];  // 2026-03-12

  let data = {};
  let error = null;

  try {
    const url = `https://www.36jxs.com/api/Commonweal/almanac?sun=${today}`;
    const resp = await ctx.http.get(url, { timeout: 8000 });
    if (resp.status !== 200) throw new Error(`HTTP ${resp.status}`);

    const json = await resp.json();
    if (json.code !== 1 || !json.data) throw new Error("API 返回异常");

    data = json.data;
  } catch (e) {
    error = e.message || "加载失败";
    console.error(e);
  }

  // 适配不同尺寸
  const isSmall   = ctx.widgetFamily === 'systemSmall' || ctx.widgetFamily === 'accessoryCircular' || ctx.widgetFamily === 'accessoryInline';
  const isRect    = ctx.widgetFamily === 'accessoryRectangular';
  const isMedium  = ctx.widgetFamily === 'systemMedium';
  const isLarge   = ctx.widgetFamily === 'systemLarge' || ctx.widgetFamily === 'systemExtraLarge';

  // 颜色适配深浅模式
  const bgColor = {
    light: env.BG_COLOR_LIGHT || "#FFF8E1",
    dark:  env.BG_COLOR_DARK  || "#2D1B0F"
  };

  const textColor = { light: "#5D4037", dark: "#F5E8C7" };
  const accentColor = { light: "#D32F2F", dark: "#FFCDD2" };  // 红色调 用于宜/忌标题

  // 构建 DSL
  const root = {
    type: "widget",
    padding: isSmall ? 12 : 16,
    gap: isSmall ? 4 : 8,
    backgroundGradient: {
      type: "linear",
      colors: [bgColor.light, bgColor.dark],  // 渐变兼容深浅
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 }
    },
    refreshAfter: new Date(now.getTime() + refreshMin * 60 * 1000).toISOString(),  // 下次刷新时间
    children: []
  };

  // 标题行：公历 + 农历
  root.children.push({
    type: "stack",
    direction: "row",
    alignItems: "center",
    gap: 6,
    children: [
      { type: "image", src: "sf-symbol:calendar", width: 18, height: 18, color: textColor },
      {
        type: "text",
        text: error ? "加载失败" : `${data.GregorianDateTime || today}  ${data.LunarDateTime || ''}`,
        font: { size: isSmall ? "subheadline" : "headline", weight: "semibold" },
        textColor: textColor,
        minScale: 0.8
      }
    ]
  });

  // 生肖 + 值神 + 冲煞（小尺寸简化）
  if (!isSmall || isRect) {
    let infoText = "";
    if (data.LYear) infoText += `${data.LYear} `;
    if (data.JianShen) infoText += `值神${data.JianShen} `;
    if (data.Chong) infoText += data.Chong;

    root.children.push({
      type: "text",
      text: infoText.trim() || "—",
      font: { size: "subheadline" },
      textColor: { light: "#757575", dark: "#B0BEC5" },
      textAlign: "center"
    });
  }

  // 宜 忌（重点）
  if (!error) {
    root.children.push({
      type: "stack",
      direction: isSmall ? "column" : "row",
      gap: 4,
      alignItems: "start",
      flex: 1,
      children: [
        {
          type: "stack",
          direction: "row",
          gap: 6,
          children: [
            { type: "text", text: "宜", font: { size: "body", weight: "bold" }, textColor: accentColor },
            { type: "text", text: data.Yi || "—", font: { size: "body" }, textColor: textColor, flex: 1, minScale: 0.85 }
          ]
        },
        {
          type: "stack",
          direction: "row",
          gap: 6,
          children: [
            { type: "text", text: "忌", font: { size: "body", weight: "bold" }, textColor: accentColor },
            { type: "text", text: data.Ji || "—", font: { size: "body" }, textColor: textColor, flex: 1, minScale: 0.85 }
          ]
        }
      ]
    });
  } else {
    root.children.push({
      type: "text",
      text: error,
      textColor: "#EF5350",
      font: { size: "footnote" },
      textAlign: "center"
    });
  }

  // 彭祖 / 其他（大尺寸显示更多）
  if (isLarge && data.PengZu) {
    root.children.push({
      type: "text",
      text: `彭祖百忌：${data.PengZu}`,
      font: { size: "caption1" },
      textColor: { light: "#616161", dark: "#90A4AE" },
      maxLines: 2,
      minScale: 0.7
    });
  }

  // 底部更新时间
  root.children.push({
    type: "date",
    date: now.toISOString(),
    format: "relative",
    font: { size: "caption2" },
    textColor: { light: "#9E9E9E", dark: "#757575" },
    textAlign: "center"
  });

  return root;
}