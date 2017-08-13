(function() {
	"use strict";

	var temp;
	
	var registeredAxes = ['opsz', 'wght', 'wdth', 'ital', 'slnt', 'grad', 'GRAD'];

	window.loadFontkit = function() {
		// thanks Adam! https://github.com/devongovett/fontkit/issues/41
		window.fontkit.openURL = function(url, callback) {
			var font = null;
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.responseType = 'arraybuffer';
			xhr.onreadystatechange = function () { if (this.readyState === 4) {
				var buffer;
				if (this.status == 200) {
					buffer = new Buffer(this.response);
					font = fontkit.create(buffer);
					callback(null, font);
				} else {
					callback(this.status + ' ' + this.statusText, null);
				}
			}};
			xhr.send();
		}
	};

	//these get updated whenever the font changes
	var composites = {};
	var axisDeltas = {};
	var axisDefaults = {};
	
	var controls, axisInputs, axisSliders;
	
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

	function fvsToAxes(fvs) {
		if (!fvs) {
			return {};
		}
		if (typeof fvs === 'string') {
			fvs = fvs.split(/, */);
		}
		var axes = {};
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
				delete axisDeltas[k];
			}
		});
		return axes;
	}

	function fvsToSliders(fvs) {
		var axes = fvsToAxes(fvs);
		$.each(axisDefaults, function(k, v) {
			controls.find('input[name="' + k + '"]').val(k in axes ? axes[k] : v.default);
		});
	}
		

	function updateCSSOutput() {
		//update CSS output
		var styletext = "";
		$('head style[id^="style-"]').each(function() { 
			styletext += $(this).text();
		});
		$('#css-output').text(styletext.trim());
	}

	function populateAxisSliders(font, registeredOnly) {
		var axisInputs = $('#axis-inputs');
		$.each(fontInfo[font].axisOrder, function(i, axis) {
			if (registeredOnly === false && !TNTools.isRegisteredAxis(axis)) {
				return;
			}
			
			var values = fontInfo[font].axes[axis];

			var li = document.createElement('li');
			li.className = 'slider ' + axis;
			
			if (!TNTools.isRegisteredAxis(axis)) {
				li.className += ' hidden-by-default';
				li.style.display = 'none';
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

		//calculate composite axes into their individual parameters
		if (el.name in composites) {
			TNTools.compositeToParametric(el.name, constrained);
		} else if (el.name in axisDeltas) {
			delete axisDeltas[el.name];
		}
	}

	function slidersToElement(options) {
		/* options: only selector is required
			-selector: the actual CSS selector to apply the styles to
			-styleElement: <style> to add CSS text to
			-paramsElement: element that will show colophon output
		*/
			
//		updateURL();
		
		var rules = [];
		
		var size = parseInt($('#input-size').val());
		var leading = parseInt($('#input-leading').val());
		
		rules.push('font-family: "' + fontInfo[$('#select-font').val()].name + ' Demo"');
		
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
				if (!(this.name in fvs) && this.value != axisDefaults[this.name].default) {
					fvs[this.name] = this.value;
				}
			}
		});

		var fvsa = [];
		$.each(fvs, function(k,v) {
			fvsa.push('"' + k + '" ' + v);
		})		
		var fvss = fvsa.join(', ');
		
		if (fvsa.length) {
			rules.push('font-variation-settings: ' + fvss);
		}

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
	
	function handleFontChange(font) {
		//populate axis sliders with font defaults
		axisInputs.empty();

		composites = fontInfo[font].composites;
		axisDefaults = fontInfo[font].axes;
		axisDeltas = {};
		
		$('head style[id^="style-"]').empty();
		$('input[type=checkbox]').prop('checked',false).trigger('change');
		$('#align-left').prop('checked',true);

		TNTools.populateAxisSliders(font);

		axisSliders = axisInputs.find('input[type=range]');
	}

	function tnTypeTools() {
		return {
			'clone': function(obj) { return JSON.parse(JSON.stringify(obj)); },
			'isRegisteredAxis': function(axis) { return registeredAxes.indexOf(axis) >= 0; },
			'populateAxisSliders': populateAxisSliders,
			'slidersToElement': slidersToElement,
			'updateCSSOutput': updateCSSOutput,
			'handleSliderChange': handleSlider,
			'handleFontChange': handleFontChange,
			'fvsToAxes': fvsToAxes,
			'fvsToSliders': fvsToSliders,
			'compositeToParametric': compositeToParametric
		};
	}
	
	$(function() {
		controls = $('#controls');
		axisInputs = $('#axis-inputs');
		axisSliders = axisInputs.find('input[type=range]');

		$('#everybox').on('change', function () {
			if (this.checked) {
				$('#axis-inputs .hidden-by-default').show();
			} else {
				$('#axis-inputs .hidden-by-default').hide();
			}
		});
		
		$('#show-parameters').on('change', function() {
			$('html')[this.checked ? 'addClass' : 'removeClass']('show-parameters');
		}).trigger('change');
	
		$('#show-css').on('change', function() {
			$('#css-output')[this.checked ? 'show' : 'hide']();
		}).trigger('change');
	
		$('#reset').on('click', function() {
			$('#select-font').trigger('change');
			return false;
		});
	});
	
	window.TNTools = tnTypeTools();
})();