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
	
	var articleStyles = {
		'font-family': '',
		'font-size': '',
		'max-width': ''
	};
	
	//these get updated whenever the font changes
	var composites = {};
	var axisDeltas = {};
	var axisDefaults = {};
	
	var axisInputs = $('#axis-inputs');
	var axisSliders = axisInputs.find('input[type=range]');
	
	if (temp=window.location.search.match(/show=([^&]+)/)) {
		show = decodeURIComponent(temp[1]);
		$('input[name=show][value="' +show+ '"]').prop('checked', true);
	}

/*
	function realUpdateURL() {
			$('#bookmark').attr('href', '?settings=' + encodeURIComponent(JSON.stringify(currentStyles)) + '&show=' + show);
	}
	
	var urltimeout;
	function updateURL() {
		urltimeout && clearTimeout(urltimeout);
		urltimeout = setTimeout(realUpdateURL, 500);
	}

	function makeId(str) {
		return 'style-' + str.replace(/[\W-]+/g, '-') + '-style';
	}
*/

	//composite axis and value
	window.c2p = compositeToParametric;
	function compositeToParametric(caxis, cvalue) {
		cvalue = parseFloat(cvalue);
		
		if (!(caxis in composites)) {
			var temp = {};
			temp[caxis] = cvalue;
			return temp;
		}
	
		//maintain a list of all axes mentioned in the composite, so we can reset them all
		var allAxes = {};	
		
		var lowerPivot, upperPivot;
		var lowerAxes, upperAxes;
		//pivot value and axes
		$.each(composites[caxis], function(pivot, paxes) {
			pivot = parseFloat(pivot);
			
			//add any new axes to the list
			$.each(paxes, function(paxis, pval) {
				if (!(paxis in allAxes)) {
					allAxes[paxis] = axisDefaults[paxis].default;
				}
			});
			
			if (pivot >= cvalue) {
				//first time this happens we can stop
				if (!upperPivot) {
					upperPivot = pivot;
					upperAxes = paxes;
				}
			}
			
			if (!lowerPivot || !upperPivot) {
				//first runthru OR we still haven't found the top of the range
				lowerPivot = pivot;
				lowerAxes = paxes;
			}
		});
	
		var result = {};
		if (!upperPivot) {
			upperPivot = lowerPivot;
			upperAxes = lowerAxes;
		} else if (!lowerPivot) {
			lowerPivot = upperPivot;
			lowerAxes = upperAxes;
		}
		$.each(allAxes, function(axis, dflt) {
			var u = axis in upperAxes ? upperAxes[axis] : dflt;
			var l = axis in lowerAxes ? lowerAxes[axis] : dflt;
			var r = upperPivot === lowerPivot ? 0.0 : (cvalue-lowerPivot)/(upperPivot-lowerPivot);
			result[axis] = l + r*(u-l);
			if (axisDefaults[axis].max - axisDefaults[axis].min > 50) {
				result[axis] = Math.round(result[axis]);
				if (!(axis in axisDeltas)) {
					axisDeltas[axis] = {};
				}
				axisDeltas[axis][caxis] = result[axis] - dflt;
				//and zero out any manual axis adjustments that may have been made
				axisDeltas[axis][axis] = 0;
			}
		});

		return result;
	}

	function updateArticleStyle(name, value) {
		articleStyles[name] = value;
		var css = "\narticle {";
		$.each(articleStyles, function(k, v) {
			css += "\n\t" + k + ": " + v + ';';
		});
		css += "\n}\n";
		
		$('#style-article').text(css);
	}

	function updateCSSOutput() {
		//update CSS output
		var styletext = "";
		$('head style[id^="style-"]').each(function() { 
			styletext += $(this).text();
		});
		$('#css-output').text(styletext.trim());
	}

	function slidersToElement() {
//		updateURL();
		
		var rules = [];

/*
		var font = controls.find('select[name=font]').val();
		if (activeStyle === 'T2') {
			$('#style-article').text('\narticle {\n\tfont-family: "' + fontInfo[font].name + ' Demo";\n}\n');
		} else {
			rules['font-family'] = '"' + fontInfo[font].name + ' Demo"';
		}
*/

		rules.push("font-size: " + $('#input-size').val() + 'px');
		rules.push("line-height: " + $('#input-leading').val() + 'px');
		rules.push("text-align: " + $('input[name=alignment]:checked').val() || 'left');

		//turn sliders into font-variation-settings
		var fvs = {};
		//fvs['opsz'] = $('#input-size').val();
		$.each(axisSliders, function() {
			if (this.name in composites) {
				//composite axes get left at default, but let's but in a fake helper string to remember the value
				fvs[this.name.toUpperCase()] = this.value; //axisDefaults[this.name].default;
			} else if (this.name in axisDeltas) {
				var sum = 0;
				$.each(axisDeltas[this.name], function(caxis, cdelta) {
					sum += cdelta;
				});
				fvs[this.name] = axisDefaults[this.name].default + sum;
				$('input[name="' + this.name + '"]').val(fvs[this.name]);
			} else {
				//if it's already been added by a composite, only override if value is not default
				if (!(this.name in fvs) || this.value !== axisDefaults[this.name].default) {
					fvs[this.name] = this.value;
				}
			}
		});
		var fvsa = [];
		$.each(fvs, function(k,v) {
			fvsa.push('"' + k + '" ' + v);
		})		
		var fvss = fvsa.join(', ');
		rules.push('font-variation-settings: ' + fvss);

		var rows = $('article .row.' + activeStyle);
		
		// update the actual CSS
		$('#style-' + activeStyle).text('\narticle ' + style2class[activeStyle] + ' {\n\t' + rules.join(';\n\t') + ';\n}\n');

		// update colophon output
		var contentcell = rows.find(style2class[activeStyle]);
		if (contentcell.parent('.container').length) {
			contentcell = contentcell.parent('.container');
		}
		
		contentcell.attr({
			'data-style': activeStyle,
			'data-size-leading': parseInt($('#input-size').val()) + '/' + parseInt($('#input-leading').val()),
			'data-axes': fvss.replace(/"\s+/g, ' ').replace(/"/g, '')
		});
		
		updateCSSOutput();
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

		var axes = {};
		var fvs = (testEl.css('font-variation-settings') || '').split(/, */);
		
		var align;
		
		switch (testEl.css('text-align')) {
			case 'start': case 'left':
				align='left';
				break;
			case 'end': case 'right':
				align='right';
				break;
			case 'justify': case 'justify-all':
				align='justify';
				break;
			case 'center':
				align='center';
				break;
			default:
				align='left';
				break;
		}
				
		controls.find('input[name=size], input[name=opsz]').val(parseInt(testEl.css('font-size')));
		controls.find('input[name=leading]').val(parseInt(testEl.css('line-height')));
		controls.find('input[name=alignment][value="' + align + '"]').prop('checked', true);

		$.each(fvs, function(i, setting) {
			var k, v;
			if (temp = setting.match(/["']\[?(\w{4})\]?['"]\s+([\-\d\.]+)/)) {
				k = temp[1];
				if (k.toLowerCase() in composites) {
					//this is a faked composite slider value stored in CAPS
					k = k.toLowerCase();
				}
				v = parseFloat(temp[2]);
				axes[k] = v;
				axisDeltas[k] = {};
				axisDeltas[k][k] = v - axisDefaults[k].default;
			}
		});

		$.each(axisDefaults, function(k, v) {
			controls.find('input[name="' + k + '"]').val(k in axes ? axes[k] : v.default);
		});
		
		$('#input-size').trigger('change'); // does optical size magic
	}

	controls.on('change input', 'input[type=range], input[type=number]', function(evt) {
		var constrained = Math.max(this.min || -Infinity, Math.min(this.max || Infinity, this.value));

		//make sure manually entered numbers stay within okay range
		if (constrained !== this.value) {
			$(this).on('blur', function() {
				this.value = constrained;
				$(this).off('blur');
			});
		}

		//match up sliders with text inputs
		$(this).siblings('input[name="' + this.name + '"]').val(this.value);
		
		switch (this.name) {
		case 'size':
			if (evt.type === 'input') {
				//auto-match leading
				var leading = parseFloat($('#input-leading').val());
				var oldval = parseFloat($('#input-size').data('oldval'));
				if (activeStyle === 'T2') {
					$('input[name="column-width"]').val(parseFloat(articleStyles['max-width'])*oldval/constrained).trigger(evt.type);
				}
				$('input[name="leading"]').val(leading + constrained - oldval).trigger(evt.type);
			}
			
			$('#input-size').data('oldval', constrained);
			
			//auto-match optical size
			$('input[name="opsz"]').val(this.value).trigger(evt.type);

			if (activeStyle === 'T2') {
				updateArticleStyle('font-size', constrained + 'px');
			}

			break;
		case 'column-width':
			updateArticleStyle('max-width', this.value + 'em');
			var lh = Math.max(1.3, Math.min(2.0, this.value/27.0));
			$('#style-T1').text($('#style-T1').text().replace(/line-height: [\w\.]+/, 'line-height: ' + lh));
			$('#style-T2').text($('#style-T2').text().replace(/line-height: [\w\.]+/, 'line-height: ' + lh));
			if (activeStyle === 'T1' || activeStyle === 'T2') {
				$('input[name=leading]').val(lh * $('#input-size').val());
			}
			updateCSSOutput();
			break;
		
		default:
			//calculate composite axes into their individual parameters
			if (this.name in composites) {
				compositeToParametric(this.name, this.value);
			} else if (this.name in axisDeltas) {
				axisDeltas[this.name] = {};
				axisDeltas[this.name][this.name] = this.value - axisDefaults[this.name].default;
			}
			slidersToElement();
		}
	});
	
	$("input[type=radio]").on('change', slidersToElement);
	
	$('#everybox').on('change', function () {
		if (this.checked) {
			show = this.value;
			$('#axis-inputs .hidden-by-default').show();
		} else {
			show = '';
			$('#axis-inputs .hidden-by-default').hide();
		}
		slidersToElement();
	});
	
	$('#show-parameters').on('change', function() {
		$('article')[this.checked ? 'addClass' : 'removeClass']('show-parameters');
	}).trigger('change');

	$('#show-css').on('change', function() {
		$('#css-output')[this.checked ? 'show' : 'hide']();
	}).trigger('change');

	//font change triggers a lot of updates
	$('#select-font').on('change', function() {
		var font = $(this).val();

		if ($('#style-article').length === 0) {
			$('head').append("<style id='style-article'></style>");
		}
		
		$('head style[id^="style-"]').empty();
		$('input[type=checkbox]').prop('checked',false).trigger('change');
		$('#align-left').prop('checked',true);

/*
		$('#input-size').trigger('change');
		$('#input-column-width').val($('#input-column-width').data('original-value')).trigger('change');
		$('#input-leading').val($('#input-leading').data('original-value')).trigger('change');
*/


		var realColumnWidth = parseInt($('article').css('max-width'));
		var realFontSize = parseInt($('article ' + style2class.T2).css('font-size'));
		var cwEm = (Math.round(realColumnWidth/realFontSize*100)/100).toString().replace(/(\.\d\d).*$/, '$1');

		updateArticleStyle('font-family', '"' + fontInfo[font].name + ' Demo"');
		updateArticleStyle('font-size', realFontSize + 'px');
		updateArticleStyle('max-width', cwEm + 'em');

		$('input[name="column-width"]').val(cwEm);

		//populate axis sliders with font defaults
		axisInputs.empty();

		composites = fontInfo[font].composites;
		axisDefaults = fontInfo[font].axes;
		axisDeltas = {};
		
		$.each(fontInfo[font].axisOrder, function(i, axis) {
			var values = fontInfo[font].axes[axis];

			var li = document.createElement('li');
			li.className = 'slider ' + axis;
			
			if (!TNTools.isRegisteredAxis(axis)) {
				li.className += ' hidden-by-default';
				if (show !== 'everything') {
					li.style.display = 'none';
				}
			}

			var label = document.createElement('label');
			var slider = document.createElement('input');
			var editlabel = document.createElement('label');
			var editvalue = document.createElement('input');
			
			label.for = slider.id = "input-" + axis;				
			label.textContent = values.name || axis;

			editlabel.for = editvalue.id = "edit-" + axis;
			editlabel.textContent = axis;
			
			editvalue.type = 'number';
			slider.type = 'range';

			editvalue.name = slider.name = axis;
			editvalue.min = slider.min = values.min;
			editvalue.max = slider.max = values.max;
			editvalue.step = slider.step = values.max-values.min > 50 ? 1 : (values.max-values.min)/100;
			editvalue.value = slider.value = values.default;

			li.appendChild(label);
			li.appendChild(editlabel);
			li.appendChild(editvalue);
			li.appendChild(slider);
			axisInputs.append(li);
		});

		axisSliders = axisInputs.find('input[type=range]');

		if (pageLoaded) {
			$.each(style2class, function(k, v) {
				activeStyle = k;
				var testEl = styleElements.filter('.' + activeStyle).find(style2class[k]);
				var fontsize = parseInt(testEl.css('font-size'));
				var leading = parseInt(testEl.css('line-height'));
				$('#input-leading').val(leading);
				$('#input-size').val(fontsize).data('oldval', fontsize);
				$('input[name="opsz"]').val(fontsize).trigger('change');
				slidersToElement();
			});
			styleElements.filter('.H1').trigger('click');
		}
	}).trigger('change');

	$('#screen-size').on('change', function() {
		var wh = $(this).val().split('x');
		$('#fake-screen').width(wh[0]).height(wh[1]);
	}).trigger('change');

	$('#reset').on('click', function() {
		$('#select-font').trigger('change');
		return false;
	});
	
	var toSlidersAndBack = function() {
		selectElement(this);
		elementToSliders(this);
	};

	styleElements.each(toSlidersAndBack).on('click', toSlidersAndBack);

	styleElements.filter('.H1').trigger('click');
	
	pageLoaded = true;
});