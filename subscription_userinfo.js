function daysUntil(month, day) {

  const now = new Date()
  const year = now.getFullYear()

  let target = new Date(year, month - 1, day)

  if (target < now) {
    target = new Date(year + 1, month - 1, day)
  }

  return Math.ceil((target - now) / 86400000)
}

function secondSundayOfMay(){

  const year = new Date().getFullYear()
  const first = new Date(year,4,1)

  const day = first.getDay()

  const firstSunday = day === 0 ? 1 : 8 - day
  const secondSunday = firstSunday + 7

  const target = new Date(year,4,secondSunday)

  return Math.ceil((target - new Date()) / 86400000)

}

function thirdSundayOfJune(){

  const year = new Date().getFullYear()
  const first = new Date(year,5,1)

  const day = first.getDay()

  const firstSunday = day === 0 ? 1 : 8 - day
  const thirdSunday = firstSunday + 14

  const target = new Date(year,5,thirdSunday)

  return Math.ceil((target - new Date()) / 86400000)

}

async function main() {

  const qingming = daysUntil(4,4)
  const laodong = daysUntil(5,1)
  const duanwu = daysUntil(5,31)

  const chunfen = daysUntil(3,20)
  const guyu = daysUntil(4,20)

  const longtaitou = daysUntil(3,1)
  const qixi = daysUntil(8,29)
  const zhongyuan = daysUntil(9,6)

  const mother = secondSundayOfMay()
  const father = thirdSundayOfJune()
  const halloween = daysUntil(10,31)

  const text =
`清明节${qingming}天 | 劳动节${laodong}天 | 端午节${duanwu}天
春分${chunfen}天 | 清明${qingming}天 | 谷雨${guyu}天
龙抬头${longtaitou}天 | 七夕节${qixi}天 | 中元节${zhongyuan}天
母亲节${mother}天 | 父亲节${father}天 | 万圣节${halloween}天`

  return {
    type: "text",
    text: text,
    align: "left"
  }

}

module.exports = { main }