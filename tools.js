(function() {
	"use strict";

	var registeredAxes = ['wdth', 'wght', 'grad', 'GRAD', 'opsz'];

	function tnTypeTools() {
		return {
			'clone': function(obj) { return JSON.parse(JSON.stringify(obj)); },
			'isRegisteredAxis': function(axis) { return registeredAxes.indexOf(axis) >= 0; },
		};
	}
	
	window.TNTools = tnTypeTools();
})();