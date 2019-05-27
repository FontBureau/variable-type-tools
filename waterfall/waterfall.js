$(function() {
	"use strict";

	var temp; //general use
	
	var controls = $('#controls');
	var waterfall = $('#waterfallll');
	
	function doOpsz() {
		var fvs = waterfall.css('font-variation-settings');
		var opsz = /["']opsz['"]\s+(?:\d+)/g;
		if (fvs) {
			waterfall.children('li').each(function() {
				this.style.fontVariationSettings = fvs.replace(opsz, '"opsz" ' + parseInt(this.style.fontSize));
			})
		}
	}
	
	TNTools.register('modeChange', function(evt) {
		if (this.value === 'waterfall') {
			$('input[name=size]').val(18).trigger('change');
			$('input[name="to-size"]').val(72).trigger('change');
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
		} else if (this.name !== 'opsz') {
			doOpsz();
			return;
		}
		
		var sentence = waterfall.children('li').first().text() || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
		
		waterfall.empty();
		
		var i, l, li;
		for (i=parseInt(size.val()), l=parseInt(toSize.val()); i<=l; i++) {
			li = document.createElement('li');
			li.textContent = sentence;
			li.style.fontSize = i + 'pt';

			li.setAttribute('data-size', i);
			li.contentEditable = 'true';
			waterfall.append(li);
		}
		
		doOpsz();
	});
	
	waterfall.on('keyup', function(evt) {
		var li = $(evt.target).closest('li');
		waterfall.find('li').not(li).text(li.text());
	});
});
