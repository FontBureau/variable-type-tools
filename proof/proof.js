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
	
	TNTools.register('slidersToElement', function() {
		TNTools.slidersToElement({
			'selector': '#proof-grid',
			'styleElement': $('#style-proof'),
			'paramsElement': proof
		});
	});

	function populateGrid(font) {
		var gid;
		for (gid in font.tables.cmap.glyphIndexMap) {
			proof.append('<span>' + String.fromCodePoint(gid) + '</span>');
		}
	}
	
	TNTools.register('fontChange', function() {
		var font = $(this).val();
		proof.empty();

		if (font.match(/^custom-/) && window.fontInfo[font] && window.fontInfo[font].fontobj) {
			populateGrid(window.fontInfo[font].fontobj);
		} else {
			var url = '/fonts/' + font + '.woff';
			window.opentype.load(url, function (err, font) {
				if (err) {
					alert(err);
					return;
				}
				populateGrid(font);
			});
		}
	});
});