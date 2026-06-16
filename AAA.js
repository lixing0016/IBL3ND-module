const url = $request.url;

if (!$response.body) {
  $done({});
}

let obj = JSON.parse($response.body);

if (url.includes("/api/sns/v1/localfeed/header")) {
  if (obj?.data) {
    obj.data.title = "东京";
    obj.data.city_name = "东京";
    obj.data.distance = 0;
  }
}

$done({
  body: JSON.stringify(obj)
});