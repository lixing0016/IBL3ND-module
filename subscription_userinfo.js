function bytesToGB(bytes) {
  return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

let airport = $input.arguments.airport;

let name = "";
let url = "";
let reset = "";

if (airport === "A") {
  name = $argument["A名称"];
  url = $argument["A地址"];
  reset = $argument["A重置"];
}

if (airport === "B") {
  name = $argument["B名称"];
  url = $argument["B地址"];
  reset = $argument["B重置"];
}

if (airport === "C") {
  name = $argument["C名称"];
  url = $argument["C地址"];
  reset = $argument["C重置"];
}

if (!url) {
  $done({
    title: name || "机场流量",
    content: "未填写订阅地址"
  });
  return;
}

$httpClient.get(url, function (err, res, data) {

  if (err) {
    $done({
      title: name,
      content: "获取失败"
    });
    return;
  }

  let header = res.headers["subscription-userinfo"];

  if (!header) {
    $done({
      title: name,
      content: "机场未返回流量信息"
    });
    return;
  }

  let upload = 0;
  let download = 0;
  let total = 0;

  header.split(";").forEach(function (item) {
    let parts = item.split("=");

    if (parts.length !== 2) return;

    let key = parts[0].trim();
    let value = parseInt(parts[1]);

    if (key === "upload") upload = value;
    if (key === "download") download = value;
    if (key === "total") total = value;
  });

  let used = upload + download;
  let remain = total - used;

  let usedGB = bytesToGB(used);
  let totalGB = bytesToGB(total);
  let remainGB = bytesToGB(remain);

  let percent = ((used / total) * 100).toFixed(0);

  let content =
    "剩余 " + remainGB + "GB\n" +
    "已用 " + usedGB + "GB / " + totalGB + "GB\n" +
    "使用 " + percent + "%\n" +
    "重置 " + reset + "日";

  $done({
    title: name,
    content: content,
    icon: "antenna.radiowaves.left.and.right"
  });

});
