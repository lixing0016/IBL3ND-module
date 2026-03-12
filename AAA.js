/**
 * Egern 黄历小组件 - 最小可运行版本
 */

// 主入口函数（关键：不使用 export default）
async function render(ctx) {
  const now = new Date();
  const dateStr = `${now.getMonth()+1}月${now.getDate()}日`;
  const week = ['日','一','二','三','四','五','六'][now.getDay()];
  
  // 根据尺寸调整字体
  const fontSize = {
    systemSmall: 'caption2',
    systemMedium: 'caption1',
    systemLarge: 'subheadline'
  }[ctx.widgetFamily] || 'caption1';
  
  // 返回 DSL 对象（严格符合文档）
  return {
    type: 'widget',
    padding: 16,
    backgroundColor: '#FFF9E6',  // 单一颜色，避免兼容问题
    children: [
      {
        type: 'stack',
        direction: 'column',
        gap: 8,
        children: [
          {
            type: 'text',
            text: `公历 ${dateStr} 星期${week}`,
            font: { size: fontSize, weight: 'semibold' },
            textColor: '#1A1A2E'
          },
          {
            type: 'text',
            text: '宜：祭祀 祈福 出行',
            font: { size: 'caption2', weight: 'regular' },
            textColor: '#E63946'
          },
          {
            type: 'text',
            text: '忌：安葬 破土 词讼',
            font: { size: 'caption2', weight: 'regular' },
            textColor: '#1D3557'
          }
        ]
      }
    ]
  };
}

// 关键：正确导出（根据 Egern 环境选择一种）
module.exports = render;
// 如果仍不显示，尝试：
// global.main = render;

