(function () {
	
	var _defaults = {
			debug							: false,
			pinTypeName				: 'pin_clusterer pin',
			clusterTypeName		: 'pin_clusterer cluster',
			pinSize						: 16,
			extendMapBoundsBy	: 2,
			gridSize					: 60,
			maxZoom						: 16,
			clickToZoom				: true,
			onClusterToMap		: null
		},

		// Minimum zoom level before bounds dissappear
		MIN_ZOOM = 2,
		
		// Alias for Microsoft.Maps
		mm = null;
		
	/*
	 * 	@param { Microsoft.Maps.Map } map: the map to be show the clusters on
	 * 	@param { Object } options: support the following options:
	 * 		gridSize			: (number) The grid size of a cluster in pixels.
	 *  	maxZoom				: (number) The maximum zoom level that a pin can be part of a cluster.
	 *		onClusterToMap: a function that accepts a parameter pointing at the center of each cluster.
	 *  		It gets called before the cluster is added to the map, so you can change the all options
	 *			by calling center.setOptions(Microsoft.Maps.PushpinOptions) 
	 *			where center is an instance of Microsoft.Maps.Pushpin
	 *
	 * 	@properties:
	 *		layer			: (Microsoft.Maps.Layer) the layer holding the clusters
	 * 		options		: (Array) 	a copy of the options passed
	 *		gridSize	: (number) 	the actual grid size used
	 *		maxZoom		: (number)	the actual maximum zoom used
	 *		
	 */
	
	var PinClusterer = window.PinClusterer = function (map, options) {
		this.map			 = map;
		this.options 	 = options;
		this.layer 		 = null;
		
		this.setOptions(this.options);
		this.doClickToZoom = _defaults.clickToZoom;
		
		if (Microsoft && Microsoft.Maps && (map instanceof Microsoft.Maps.Map))	{

			// Create a shortcut
			mm = Microsoft.Maps;

			this.layer = new mm.EntityCollection();
			this.map.entities.push(this.layer);
			this.loaded = true;
		}
	};
	
	PinClusterer.prototype = {
		
		cluster: function (latlongs) {
			if (!this.loaded) return;
			if (!latlongs) {
				if (!this._latlongs) return;
			} else {
				this._latlongs = latlongs;				
			}
			var self = this;
			if (this._viewchangeendHandler) {
				this._redraw();
			} else {
				this._viewchangeendHandler = mm.Events.addHandler(this.map, 'viewchangeend', function() { self._redraw(); });
			}
		},
		
		_redraw: function () {
			if (_defaults.debug) var started = new Date();
			if (!this._latlongs) return;
			this._metersPerPixel  = this.map.getMetersPerPixel();
			this._bounds 					= this.getExpandedBounds(this.map.getBounds(), _defaults.extendMapBoundsBy);
			this._zoom 						= this.map.getZoom();
			this._clusters 				= [];
			this.doClickToZoom 		= true;
			this.layer.clear();	
			this.each(this._latlongs, this._addToClosestCluster);
			this.toMap();
			if (_defaults.debug && started) _log((new Date()) - started);
		},
		
		_addToClosestCluster: function (latlong) {
			var distance 			= 40000,
				location 				= new mm.Location(latlong.latitude, latlong.longitude),
				clusterToAddTo 	= null,
				d;
			if (this._zoom > MIN_ZOOM && !this._bounds.contains(location)) return;
			
			if (this._zoom >= _defaults.maxZoom) {
				this.doClickToZoom = false;
				this._createCluster(location);
				return;
			}
			
			this.each(this._clusters, function (cluster) {
				d = this._distanceToPixel(cluster.center.location, location);
				if (d < distance) {
					distance = d;
					clusterToAddTo = cluster;
				}
			});

			if (clusterToAddTo && clusterToAddTo.containsWithinBorders(location)) {
				clusterToAddTo.add(location);
			} else {
				this._createCluster(location);
			}
		},
		
		_createCluster: function (location) {
			var cluster = new Cluster(this);
			cluster.add(location);
			this._clusters.push(cluster);
		},
		
		setOptions: function (options) {
			for (var opt in options)
				if (typeof _defaults[opt] !== 'undefined') _defaults[opt] = options[opt]; 
		},
		
		toMap: function () {
			this.each(this._clusters, function (cluster) {
				cluster.toMap();
			});
		},
		
		getExpandedBounds: function (bounds, gridFactor) {
			var northWest = this.map.tryLocationToPixel(bounds.getNorthwest()),
				southEast		= this.map.tryLocationToPixel(bounds.getSoutheast()),
				size 				= gridFactor ? _defaults.gridSize * gridFactor : _defaults.gridSize / 2;
			if (northWest && southEast) {
				northWest = this.map.tryPixelToLocation(new mm.Point(northWest.x - size, northWest.y - size));
				southEast = this.map.tryPixelToLocation(new mm.Point(southEast.x + size, southEast.y + size));
				if (northWest && southEast) {
					bounds = mm.LocationRect.fromCorners(northWest, southEast);
				}
			}
			return bounds;
		},
		
		_distanceToPixel: function (l1, l2) {
			return PinClusterer.distance(l1, l2) * 1000 / this._metersPerPixel;
		},
		
		each: function (items, fn) {
			if (!items.length) return;
			for (var i = 0, item; item = items[i]; i++) {
				var rslt = fn.apply(this, [item, i]);
				if (rslt === false) break;
			}
		}
		
	};
	
	PinClusterer.distance = function(p1, p2) {
	  if (!p1 || !p2) return 0;
	  var R  	= 6371, // Radius of the Earth in km
			pi180 = Math.PI / 180;
	  	dLat 	= (p2.latitude - p1.latitude) * pi180,
	  	dLon 	= (p2.longitude - p1.longitude) * pi180,
	  	a 	 	= Math.sin(dLat / 2) * Math.sin(dLat / 2) 
							 + Math.cos(p1.latitude * pi180) * Math.cos(p2.latitude * pi180) *
				    	 Math.sin(dLon / 2) * Math.sin(dLon / 2),
	  	c 		= 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
	  	d 		= R * c;
	  return d;
	};
	
	var Cluster = function (pinClusterer) {
		this._pinClusterer 	= pinClusterer;
		this.locations 			= [];
		this.center					= null;
		this._bounds				= null;
		this.length					= 0;
		this.doClickToZoom	= this._pinClusterer.doClickToZoom;
	};
	
	Cluster.prototype = {
		add: function (location) {
		  if (this._alreadyAdded(location)) return;
			this.locations.push(location);
			this.length += 1;
			if (!this.center) {
				this.center = new Pin(location, this);
				this._calculateBounds();
			}
		},
		
		containsWithinBorders: function (location) {
			if (this._bounds) return this._bounds.contains(location);
			return false;
		},
		
		zoom: function () {
			this._pinClusterer.map.setView({ center: this.center.location, zoom: _defaults.maxZoom });
		},
		
		_alreadyAdded: function (location) {
			if (this.locations.indexOf) {
				return this.locations.indexOf(location) > -1;
			} else {
				for (var i = 0, l; l = this.locations[i]; i++) {
					if (l === location) return true;
				}
			}
			return false;
		},
		
		_calculateBounds: function () {
			var bounds = mm.LocationRect.fromLocations(this.center.location);
			this._bounds = this._pinClusterer.getExpandedBounds(bounds);
		},
		
		toMap: function () {
			this._updateCenter();
			this.center.toMap(this._pinClusterer.layer);
			if (!_defaults.debug) return;
			var north = this._bounds.getNorth(),
				east		= this._bounds.getEast(),
				west		= this._bounds.getWest(),
				south		= this._bounds.getSouth(),
				nw 			= new mm.Location(north, west),
				se 			= new mm.Location(south, east),
				ne 			= new mm.Location(north, east)
				sw 			= new mm.Location(south, west),
				color 	= new mm.Color(100, 100, 0, 100),
				poly 		= new mm.Polygon([nw, ne, se, sw], { fillColor: color, strokeColor: color, strokeThickness: 1 });
			this._pinClusterer.layer.push(poly);
		},
		
		_updateCenter: function () {
			var count 	= this.locations.length,
				text 			= '',
				typeName 	= _defaults.pinTypeName;
			if (count > 1) {
				text += count;
				typeName = _defaults.clusterTypeName;
			}
			this.center.pushpin.setOptions({
				text			: text,
				typeName	: typeName
			});
			if (_defaults.onClusterToMap) {
				_defaults.onClusterToMap.apply(this._pinClusterer, [this.center.pushpin, this]);
			}
		}
	};
	
	var Pin = function (location, cluster, options) {
		this.location = location;
		this._cluster = cluster;
		
		// The default options of the pushpin showing at the centre of the cluster
		// Override within onClusterToMap function
		
		this._options 						= options || {};
		this._options.typeName 		= this._options.typeName || _defaults.pinTypeName;
		this._options.height 			= _defaults.pinSize;
		this._options.width 			= _defaults.pinSize;
		this._options.anchor 			= new mm.Point(_defaults.pinSize / 2, _defaults.pinSize / 2);
		this._options.textOffset 	= new mm.Point(0, 2);
		this._create();
	};
	
	Pin.prototype = {
		_create: function () {
			this.pushpin  = new mm.Pushpin(this.location, this._options);
			if (this._cluster.doClickToZoom) {
				var self = this;
				mm.Events.addHandler(this.pushpin, 'mouseup', function () { self._cluster.zoom(); });
			}
		},
		
		toMap: function (layer) {
			layer.push(this.pushpin);
		}
	};
	
	
	var _log = function (msg) {
		if (console && console.log) console.log(msg);
	};

})();