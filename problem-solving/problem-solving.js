$(function() {
	"use strict";

	var win = $(window);
	var doc = $(document);
	var temp; //general use
	
	var controls = $('#controls');
	var justification = $('#justification');
	
	if (!$('#style-problem').length) {
		$('head').append("<style id='style-problem'></style>");
	}
	
	var minReport = $('#min-space-width');
	var medReport = $('#med-space-width');
	var avgReport = $('#avg-space-width');
	var maxReport = $('#max-space-width');

	function measureSpaces() {
		var fontSize = parseFloat(fig.css('font-size'));
		var allSpaces = [], totalSpace = 0.0;
		justification.find('span.sp').each(function() {
			var w = this.getBoundingClientRect().width / fontSize;
			if (w > 0) {
				allSpaces.push(w);
				totalSpace += w;
			}
		});
		allSpaces.sort(function(a, b) { return a - b; });
		minReport.text(Math.round(100*allSpaces[0])/100);
		maxReport.text(Math.round(100*allSpaces[allSpaces.length-1])/100);
		avgReport.text(Math.round(100*totalSpace / allSpaces.length)/100);
		medReport.text(Math.round(100*allSpaces[Math.floor(allSpaces.length/2)])/100);
	}

	function slidersToElement() {
		TNTools.slidersToElement({
			'selector': '#justification figure',
			'styleElement': $('#style-problem'),
			//'paramsElement': justification.find('figure')
		});
		setTimeout(measureSpaces);
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
	
	//font change triggers a lot of updates
	$('#select-font').on('change', function() {
		var font = $(this).val();
		TNTools.handleFontChange(font);
		$('#edit-size').trigger('change');
	}).trigger('change');

	$('#reset').on('click', function() {
		$('#select-font').trigger('change');
		return false;
	});
	
	var dragstart = null;
	var fig = $('#justification figure');
	
	fig.on('mousedown', function(evt) {
		var mx = evt.clientX + win.scrollLeft();
		if (Math.abs(mx - (fig.offset().left + fig.outerWidth())) < 10) {
			dragstart = evt.clientX;
			doc.on('mousemove', function(evt) {
				var mx = evt.clientX + win.scrollLeft();
				fig.css({
					width: (mx - fig.offset().left) + 'px'
				});
				setTimeout(measureSpaces);
				return false;
			}).on('mouseup', function() {
				dragstart = null;
				doc.off('mousemove mouseup');
				return false;
			});
			return false;
		}
	});
	
	var paragraphs = fig.children('p');
	if (!paragraphs.length) {
		figure.wrapInner(document.createElement('p'));
	}
	paragraphs.each(function() {
		var para = $(this);
		var words = this.textContent.trim().split(/\s+/);
		var newPara = $('<p></p>');
		words.forEach(function(word, i) {
			if (i > 0) {
				newPara.append("<span class='sp'> </span>");
			}
			newPara.append('<span>' + word + '</span>');
		});
		para.replaceWith(newPara);
	});
	
	justification.find('input[name="highlight-spaces"]').on('change', function() {
		fig[this.checked ? 'addClass' : 'removeClass']('highlight-spaces');
	});
	
	justification.find('input[name="lock-lines"]').on('change', function() {
		if (this.checked) {
			
		} else {
			
		}
	});
});