(function () {
	
	var Layout = function () {
		this._jwindow 	= $(window);
		this._jheader		= $('#header')
		this._jcontent 	= $('#content');
		this._jloader 	= $('#loader');
		this._jmap 			= $('#map');
		
		this._cluster();
		this._position();
		this._bind(this);
		this._hideLoading(this);
	};
	
	Layout.prototype = {		
		_events: {
			'btnDebug'					: '_setDebugOn',
			'btnUndebug'				: '_setDebugOff',
			'btnHideTextOn'			: '_setHideTextOn',
			'btnHideTextOff'		: '_setHideTextOff',
			'btnChangeGridSize'	: '_changeGridSize',
			'btnResetGridSize'	: '_resetGridSize'
		},
		
		_cluster: function () {
			var map = new Microsoft.Maps.Map(document.getElementById('map'), {
						credentials: 'AkA5N0re9Y6eNV2XYLEjavUbXvB98UwCO5MzvCMBN2QJfgdmF-hTgNyZPNom2I95' 
					}),
					uk = new Microsoft.Maps.Location(53.800651, -4.064941);
			map.setView({ center: uk, zoom: 5 });
			this._pinClusterer = new PinClusterer(map);
			this._pinClusterer.cluster(data);
		},
		
		_setDebugOn: function () {
			this._pinClusterer.setOptions({ debug: true });
			this._pinClusterer.cluster();
		},
		
		_setDebugOff: function () {
			this._pinClusterer.setOptions({ debug: false });
			this._pinClusterer.cluster();
		},
		
		_setHideTextOn: function () {
			this._pinClusterer.setOptions({
	    	onClusterToMap: function (center) {
		    	center.setOptions({ text: '' });
		    }
	    });
	    this._pinClusterer.cluster();
		},
		
		_setHideTextOff: function () {
			this._pinClusterer.setOptions({
	    	onClusterToMap: null
	    });
	    this._pinClusterer.cluster();
		},
		
		_changeGridSize: function () {
			this._changeGridSizeBy(40);
		},
		
		_resetGridSize: function () {
			this._changeGridSizeBy(60);
		},		
		
		_changeGridSizeBy: function (size) {
			this._pinClusterer.setOptions({ gridSize: size });
			this._pinClusterer.cluster();
		},
				
		_position: function () {
			if (!this._headerHeight) this._headerHeight = this._jheader.outerHeight();
			var contentHeight	= this._jwindow.height() - this._headerHeight,
				mapWidth 				= this._jwindow.width() - this._jcontent.width() - 3;
			this._jcontent.height(contentHeight);
			this._jmap
				.height(contentHeight)
				.width(mapWidth);
		},
		
		_hideLoading: function (self) {
			setTimeout(function () {
				self._jloader.slideUp('fast');
			}, 100);
		},
		
		_bind: function (self) {
			this._jwindow.resize(function () { self._position(); });
			
			this._jcontent.find('a').click(function (e) {
				var handler = self._events[this.id];
				if (handler && self[handler]) {
					e.preventDefault();
					self[handler].apply(self, [e]);
				}
			});
		}
	};
	
	
	$(function () {
		window.prettyPrint && prettyPrint();
		new Layout();
	})
	
})();