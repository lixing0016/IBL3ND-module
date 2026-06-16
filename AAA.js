let obj = JSON.parse($response.body);

if (obj.data) {
    obj.data.title = "iBL3ND";
    obj.data.city_name = "iBL3ND";
    obj.data.distance = 0;
}

$done({
    body: JSON.stringify(obj)
});