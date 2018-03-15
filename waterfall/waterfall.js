$(function() {
	"use strict";

	var temp; //general use
	
	var controls = $('#controls');
	var waterfall = $('#waterfallll');
	
	TNTools.register('sliderChange', function(evt) {
		var size, toSize;
		if (this.name === 'size') {
			size = $(this);
			toSize = $('#controls input[name="to-size"]');
			if (toSize.val() < this.value) {
				toSize.val(this.value);
			}
		} else if (this.name === 'to-size') {
			toSize = $(this);
			size = $('#controls input[name="size"]');
			if (size.val() > this.value) {
				size.val(this.value);
			}
		} else {
			return;
		}
		
		var sentence = waterfall.children('li').first().text() || 'Type designers just love a-z idioms like “the quick brown fox…”';
		
		waterfall.empty();
		
		var i, l, li;
		for (i=size.val(), l=toSize.val(); i<=l; i++) {
			li = document.createElement('li');
			li.textContent = sentence;
			li.style.fontSize = i + 'px';
			li.setAttribute('data-size', i);
			waterfall.append(li);
		}
	});
});