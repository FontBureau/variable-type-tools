(function() {
	"use strict";

	var temp;
	
	var registeredAxes = ['opsz', 'wght', 'wdth', 'ital', 'slnt'];
	
	function updateCSSOutput() {
		//update CSS output
		var styletext = "";
		$('head style[id^="style-"]').each(function() { 
			styletext += $(this).text();
		});
		$('#css-output').text(styletext.trim());
	}

	function axesToFontVariationSettings(axes) {
		
	}

	function handleSlider(evt) {
		var el = evt.target;
		var $el = $(el);
		var constrained = Math.max(el.min || -Infinity, Math.min(el.max || Infinity, el.value));

		//make sure manually entered numbers stay within okay range
		if (constrained !== el.value) {
			$el.on('blur', function() {
				el.value = constrained;
				$el.off('blur');
			});
		}

		//match up sliders with text inputs
		$el.siblings('input[name="' + el.name + '"]').val(el.value);
		
		if (el.name === 'size') {
			if (evt.type === 'input') {
				//auto-match leading
				var leading = parseFloat($('#input-leading').val());
				var oldval = parseFloat($('#input-size').data('oldval')) || el.value;
				$('input[name="leading"]').val(leading + constrained - oldval).trigger(evt.type);
			}
			
			$('#input-size').data('oldval', constrained);
			
			//auto-match optical size
			$('input[name="opsz"]').val(el.value).trigger(evt.type);
		}
	}

	function slidersToElement(options) {
		/* options: only selector is required
			-selector: the actual CSS selector to apply the styles to
			-styleElement: <style> to add CSS text to
			-paramsElement: element that will show colophon output
			-composites: composite axes info
			-deltas: parametric axis deltas
		*/
			
//		updateURL();
		
		var rules = [];
		
		var size = parseInt($('#input-size').val());
		var leading = parseInt($('#input-leading').val());
		
		if (size) {
			rules.push("font-size: " + size + 'px');
		}
		
		if (leading) {
			rules.push("line-height: " + leading + 'px');
		}
		
		if ((temp=$('input[name=alignment]')).length) {
			rules.push("text-align: " + (temp.filter(':checked').val() || 'left'));
		}

		//turn sliders into font-variation-settings
		var fvs = {};
		//fvs['opsz'] = $('#input-size').val();
		$.each($('#axis-inputs input[type=range]'), function() {
			var defaultVal = this.getAttribute('data-default');
			defaultVal = window[defaultVal.indexOf('.') >= 0 ? 'parseFloat' : 'parseInt'](defaultVal);

			if (options.composites && this.name in options.composites) {
				//composite axes get left at default, but let's but in a fake helper string to remember the value
				fvs[this.name.toUpperCase()] = this.value; //axisDefaults[this.name].default;
			} else if (options.deltas && this.name in options.deltas) {
				var sum = 0;
				$.each(options.deltas[this.name], function(caxis, cdelta) {
					sum += cdelta;
				});
				fvs[this.name] = defaultVal + sum;
				$('input[name="' + this.name + '"]').val(fvs[this.name]);
			} else {
				if (!(this.name in fvs) && this.value != defaultVal) {
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

		// update the actual CSS
		if (options.styleElement) {
			$(options.styleElement).text('\n' + options.selector + ' {\n\t' + rules.join(';\n\t') + ';\n}\n');
		}

		// update colophon output
		if (options.paramsElement) {
			$(options.paramsElement).attr('data-axes', fvss.replace(/"\s+/g, ' ').replace(/"/g, ''));
	
			if (size && leading) {
				$(options.paramsElement).attr('data-size-leading', size + '/' + leading);
			}
		}
		
		updateCSSOutput();
	}

	function tnTypeTools() {
		return {
			'clone': function(obj) { return JSON.parse(JSON.stringify(obj)); },
			'isRegisteredAxis': function(axis) { return registeredAxes.indexOf(axis) >= 0; },
			'slidersToElement': slidersToElement,
			'updateCSSOutput': updateCSSOutput,
			'handleSliderChange': handleSlider
		};
	}
	
	window.TNTools = tnTypeTools();
})();