$(function() {
	"use strict";

	var temp; //general use
	
	var style2class = {
		'H1': 'h1',
		'H2': 'h2',
		'H3': 'h3',
		'T1': 'p.lede',
		'T2': 'p:not(.lede)'
	};
	
	var pageLoaded = false;
	var controls = $('#controls');
	var styleElements = $('article > .row');
	var activeStyle = 'H1';
	var show = "";
	
	if ($('#style-article').length === 0) {
		$('head').append("<style id='style-article'></style>");
	}
	
	var articleStyles = {
		'font-family': '',
		'font-size': '',
		'max-width': ''
	};
	
	function updateArticleStyle(name, value) {
		articleStyles[name] = value;
		var css = "\narticle {";
		$.each(articleStyles, function(k, v) {
			css += "\n\t" + k + ": " + v + ';';
		});
		css += "\n}\n";
		
		$('#style-article').text(css);
	}

	function slidersToElement() {
		var rows = $('article .row.' + activeStyle);
		var contentcell = rows.find(style2class[activeStyle]);
		if (contentcell.parent('.container').length) {
			contentcell = contentcell.parent('.container');
		}

		contentcell.attr('data-style', activeStyle);
		TNTools.slidersToElement({
			'selector': 'article ' + style2class[activeStyle],
			'styleElement': $('#style-' + activeStyle),
			'paramsElement': contentcell
		});
	}

	//add stylesheets for the various styles
	function selectElement(el) {
		var row = $(el);

		$.each(row[0].className.split(/\s+/), function(i, cls) {
			if (cls in style2class) {
				activeStyle = cls;
				if ($('#style-' + activeStyle).length === 0) {
					$('head').append("<style id='style-" + activeStyle + "'></style>");
				}
				return false;
			}
		});
		
		//update sliders
		$('article .current').removeClass('current');
		styleElements.filter('.' + activeStyle).children('label').addClass('current');
		
		$('#currently-editing').text(activeStyle);
	}

	function elementToSliders(el) {
		var row = $(el);
		var testEl = row.find(style2class[activeStyle]);

		if (testEl.length === 0) {
			console.log("Couldn't find any element for " + activeStyle);
			return;
		}

		TNTools.elementToSliders(testEl);
		TNTools.fvsToSliders(testEl.css('font-variation-settings') || '', $('#style-' + activeStyle));

		//$('#input-column-width').trigger('change'); // does optical size magic
	}

	controls.on('change input', 'input[type=range], input[type=number]', function(evt) {
		var constrained = Math.max(this.min || -Infinity, Math.min(this.max || Infinity, this.value));
		if (activeStyle === 'T2') {
			if (this.type === 'range' && this.name === 'size') {
				var leading = parseFloat($('#edit-leading').val());
				var oldval = parseFloat($(this).data('oldval'));
				$('input[name="column-width"]').val(parseFloat(articleStyles['max-width'])*oldval/constrained).trigger(evt.type);
			}
			if (this.name === 'size') {
				updateArticleStyle('font-size', constrained + 'px');
			}
		}

		if (this.name === 'column-width') {
			updateArticleStyle('max-width', constrained + 'em');
			if (evt.originalEvent) {
				var lh = Math.max(1.3, Math.min(2.0, constrained/27.0));
				$('#style-T1').text($('#style-T1').text().replace(/line-height: [\w\.]+/, 'line-height: ' + lh));
				$('#style-T2').text($('#style-T2').text().replace(/line-height: [\w\.]+/, 'line-height: ' + lh));
				if (activeStyle === 'T1' || activeStyle === 'T2') {
					$('input[name=leading]').val(lh * $('#edit-size').val());
				}
			}
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

		var realColumnWidth = parseInt($('article').css('max-width'));
		var realFontSize = parseInt($('article ' + style2class.T2).css('font-size'));
		var cwEm = (Math.round(realColumnWidth/realFontSize*100)/100).toString().replace(/(\.\d\d).*$/, '$1');

		updateArticleStyle('font-family', '"' + fontInfo[font].name + ' Demo"');
		updateArticleStyle('font-size', realFontSize + 'px');
		updateArticleStyle('max-width', cwEm + 'em');

		$('input[name="column-width"]').val(cwEm);

		if (pageLoaded) {
			$.each(style2class, function(k, v) {
				activeStyle = k;
				var testEl = styleElements.filter('.' + activeStyle).find(style2class[k]);
				var fontsize = parseInt(testEl.css('font-size'));
				var leading = parseInt(testEl.css('line-height'));
				$('#edit-leading').val(leading);
				$('#edit-size').val(fontsize).data('oldval', fontsize);
				$('input[name="opsz"]').val(fontsize).trigger('change');
				slidersToElement();
			});
			styleElements.filter('.H1').trigger('click');
		}
	}).trigger('change');

	var toSlidersAndBack = function() {
		selectElement(this);
		elementToSliders(this);
	};

	styleElements.each(toSlidersAndBack).on('click', toSlidersAndBack);

	if (window.bookmarkedComposites) {
		$.each(window.bookmarkedComposites, function(id, data) {
			$('#' + id).data(data);
		});
	}

	styleElements.filter('.H1').trigger('click');

	//$('#bookmarked-style').remove();
	
	pageLoaded = true;
});