$(function() {
	"use strict";

	var temp; //general use
	
	var controls = $('#controls');
	var grid = $('#griddd');
	
	var wghtMin, wghtMax, wdthMin, wdthMax;
	var wwre = /["'](?:wght|wdth)['"]\s+(?:[\+\-\d\.]+)/g;

	function updateCells() {
		var fvs = grid.css('font-variation-settings') || "";

		var rows = grid.find('tr');
		rows.each(function(r) {
			var cols = $(this).children('td');
			var wght = wghtMin + r*(wghtMax - wghtMin)/(rows.length-1);
			cols.each(function(c) {
				var wdth = wdthMin + c*(wdthMax - wdthMin)/(cols.length-1);
				this.style.fontVariationSettings = fvs.replace(wwre, '"wght" ' + wght + ', "wdth" ' + wdth);
				this.title = '"wght" ' + wght + ', "wdth" ' + wdth;
			});
		});
	}
	
	TNTools.register('fontChange', function(font) {
		var axes = window.fontInfo[font].axes;
		wghtMin = axes.wght ? axes.wght.min : 400;
		wghtMax = axes.wght ? axes.wght.max : 400;
		wdthMin = axes.wdth ? axes.wdth.min : 400;
		wdthMax = axes.wdth ? axes.wdth.max : 400;
		
		updateCells();
	});

	TNTools.register('sliderChange', updateCells);
	
	grid.on('keyup', 'td', function(evt) {
		var td = $(evt.target).closest('td');
		grid.find('td').not(td).text(td.text());
	});
	
	$('#remove-row').on('click', function() {
		var rows = grid.find('tr');
		if (rows.length > 1) {
			rows.last().remove();
			updateCells();
		}
	});

	$('#remove-column').on('click', function() {
		var cols = grid.find('tr').first().children('td');
		if (cols.length > 1) {
			grid.find('tr td:last-child').remove();
			updateCells();
		}
	});

	$('#add-row').on('click', function() {
		var lastrow = grid.find('tr').last();
		lastrow.after(lastrow.clone());
		updateCells();
	});

	$('#add-column').on('click', function() {
		var lastcol = grid.find('tr td:last-child');
		lastcol.each(function() {
			var col = $(this);
			col.after(col.clone());
		});
		updateCells();
	});

});