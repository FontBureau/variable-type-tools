$(function() {
	"use strict";

	var temp; //general use
	
	var pageLoaded = false;
	var controls = $('#controls');
	var styleElements = $('#typespec article > .row');
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
		var css = "\n#typespec article {";
		$.each(articleStyles, function(k, v) {
			css += "\n\t" + k + ": " + v + ';';
		});
		css += "\n}\n";

		$('#style-article').text(css);
	}

	TNTools.register('slidersToElement', function() {
		var rows = $('#typespec article .row.' + activeStyle);
		var contentcell = rows.find('.' + activeStyle + '-target');

		contentcell.attr('data-style', activeStyle);
		TNTools.slidersToElement({
			'selector': '#typespec article ' + '.' + activeStyle + '-target',
			'styleElement': $('#style-' + activeStyle)
		});
	});

	//add stylesheets for the various styles
	function selectElement(el) {
		var row = $(el);

		$.each(row[0].className.split(/\s+/), function(i, cls) {
			if (cls.match(/^[HT][1-3]$/)) {
				activeStyle = cls;
				if ($('#style-' + activeStyle).length === 0) {
					$('head').append("<style id='style-" + activeStyle + "'></style>");
				}
				return false;
			}
		});
		
		//update sliders
		$('#typespec article .current').removeClass('current');
		styleElements.filter('.' + activeStyle).children('label').addClass('current');
		
		$('#currently-editing').text(activeStyle);
	}

	TNTools.register('elementToSliders', function(el) {
		var row = $(el);
		var testEl = row.find('.' + activeStyle + '-target');

		if (testEl.length === 0) {
			console.log("Couldn't find any element for " + activeStyle);
			return;
		}

		TNTools.elementToSliders(testEl);
		TNTools.fvsToSliders(testEl.css('font-variation-settings') || '', $('#style-' + activeStyle));
	});

	TNTools.register('sliderChange', function(evt) {
		var constrained = Math.max(this.min || -Infinity, Math.min(this.max || Infinity, this.value));
		if (activeStyle === 'T2') {
			if (this.name === 'size') {
				var leading = parseFloat($('#edit-leading').val());
				var oldval = parseFloat($(this).data('oldval'));
				$('input[name="column-width"]').val(parseFloat(articleStyles['max-width'])*oldval/constrained).trigger(evt.type);
			}
			if (this.name === 'size') {
				updateArticleStyle('font-size', constrained + 'pt');
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
	});
	
	//font change triggers a lot of updates
	TNTools.register('fontChange', function(evt) {
		var font = $(this).val();

 		var realColumnWidth = parseInt($('#typespec article').css('max-width'));
		var realFontSize = parseInt($('#typespec article .T2-target').css('font-size'));
		var cwEm = (Math.round(realColumnWidth/realFontSize*100)/100).toString().replace(/(\.\d\d).*$/, '$1');

		updateArticleStyle('font-family', '"' + fontInfo[font].name + ' Demo"');
		updateArticleStyle('font-size', realFontSize + 'px');
		updateArticleStyle('max-width', cwEm + 'em');

		$('input[name="column-width"]').val(cwEm);

		if (pageLoaded) {
			$.each(['H1', 'H2', 'H3', 'T1', 'T2'], function(i, stylename) {
				activeStyle = stylename;
				var testEl = styleElements.filter('.' + activeStyle).find('.' + stylename + '-target');
				var fontsize = parseInt(testEl.css('font-size'))*3/4;
				var leading = parseInt(testEl.css('line-height'))*3/4;
				$('#edit-leading').val(leading);
				$('#edit-size').val(fontsize).data('oldval', fontsize);
				$('input[name="opsz"]').val(fontsize).trigger('change');
			});
			styleElements.filter('.H1').trigger('click');
		}
	});

	var toSlidersAndBack = function() {
		selectElement(this);
		TNTools.fire('elementToSliders', this);
		TNTools.fire('slidersToElement');
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
	
	if (!$('#bookmarked-style').length) {
		$('#select-font').trigger('change');
	}
});