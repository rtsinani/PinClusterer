*Pin Clusterer* is a JavaScript layer that groups close pushpins together on a Bing Map.


### Usage

You can instantiate the Clusterer by passing it an instance of the map, and a few options:

```js
var data = [
		{ "latitude": 59.441193, "longitude": 24.729494 },
		{ "latitude": 59.432365, "longitude": 24.742992 },
		{ "latitude": 59.431602, "longitude": 24.757563 },
		{ "latitude": 59.437843, "longitude": 24.765759 },
		{ "latitude": 59.439644, "longitude": 24.779041 },
		{ "latitude": 59.434776, "longitude": 24.756681 }
	];

	map = new Microsoft.Maps.Map(document.getElementById('map'), {
		credentials: 'AkA5N0re9Y6eNV2XYLEjavUbXvB98UwCO5MzvCMBN2QJfgdmF-hTgNyZPNom2I95' 
	}),					

	pinClusterer = new PinClusterer(map);

map.setView({ center: new Microsoft.Maps.Location(data[0].latitude, data[0].longitude), zoom: 12 });
pinClusterer.cluster(data);
```