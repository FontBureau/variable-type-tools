$(function() {
	"use strict";

	var head = document.getElementsByTagName('head')[0];
	var script;

	var temp; //general use
	
	var controls = $('#controls');
	var proof = $('#proof-grid');
	
	if (!$('#style-proof').length) {
		$('head').append("<style id='style-proof'></style>");
	}
	
	function slidersToElement() {
		TNTools.slidersToElement({
			'selector': '#proof-grid',
			'styleElement': $('#style-proof'),
			'paramsElement': proof
		});
	}

	controls.on('change input', 'input[type=range], input[type=number]', function(evt) {
		var constrained = Math.max(this.min || -Infinity, Math.min(this.max || Infinity, this.value));
		if (this.type === 'range' && this.name === 'size') {
			var leading = parseFloat($('#edit-leading').val());
			var oldval = parseFloat($(this).data('oldval'));
		}
		TNTools.handleSliderChange(evt);
		slidersToElement();
	});
	
	$("input[type=radio]").on('change', slidersToElement);
	$('#foreground, #background').on('move.spectrum change.spectrum hide.spectrum', slidersToElement);
	
	function populateGrid(font) {
		var gid;
		for (gid in font.tables.cmap.glyphIndexMap) {
			proof.append('<span>' + String.fromCodePoint(gid) + '</span>');
		}
	}
	
	//font change triggers a lot of updates
	$('#select-font').on('change', function() {
		proof.empty();
		var font = $(this).val();
		TNTools.handleFontChange(font);
		$('#edit-size').trigger('change');

		var datauri = this.result;
		window.opentype.load('/fonts/' + font + '.woff', function (err, font) {
			if (err) {
				alert(err);
				return;
			}
			window.font = font;
			populateGrid(font);
		});
	}).trigger('change');

	$('#reset').on('click', function() {
		$('#select-font').trigger('change');
		return false;
	});
});