$(function() {
	"use strict";

	var temp; //general use
	
	var controls = $('#controls');
	var waterfall = $('#waterfallll');
	
	TNTools.register('modeChange', function(evt) {
		if (this.value === 'waterfall') {
			$('input[name=size]').val(8).trigger('change');
			$('input[name="to-size"]').val(144).trigger('change');
		}
	});
	
	TNTools.register('sliderChange', function(evt) {
		var size = $('#edit-size');
		var toSize = $('#edit-to-size');
		if (evt.type !== 'change') {
			//don't update for keystrokes
			return;
		}
		if (this.name === 'size') {
			if (parseInt(size.val()) > parseInt(toSize.val())) {
				toSize.val(size.val()).trigger('change');
				return;
			}
		} else if (this.name === 'to-size') {
			if (parseInt(size.val()) > parseInt(toSize.val())) {
				size.val(toSize.val()).trigger('change');
				return;
			}
		} else {
			return;
		}
		
		var sentence = waterfall.children('li').first().text() || 'Type designers just love a-z idioms like “the quick brown fox…”';
		
		waterfall.empty();
		
		var i, l, li;
		var fvs = waterfall.css('font-variation-settings');
		var opsz = /["']opsz['"]\s+(?:\d+)/g;
		for (i=parseInt(size.val()), l=parseInt(toSize.val()); i<=l; i++) {
			li = document.createElement('li');
			li.textContent = sentence;
			li.style.fontSize = i + 'px';
			if (fvs) {
				li.style.fontVariationSettings = fvs.replace(opsz, '"opsz" ' + i);
			}
			li.setAttribute('data-size', i);
			li.contentEditable = 'true';
			waterfall.append(li);
		}
	});
	
	waterfall.on('keyup', function(evt) {
		var li = $(evt.target).closest('li');
		waterfall.find('li').not(li).text(li.text());
	});
});