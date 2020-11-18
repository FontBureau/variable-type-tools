(function() {
	"use strict";

	var temp;
	
	var registeredAxes = ['opsz', 'wght', 'wdth', 'ital', 'slnt', 'grad', 'GRAD'];

	//these get updated whenever the font changes
	var composites = {};
	var axisDeltas = {};
	var axisDefaults = {};
	
	var controls, axisInputs, axisSliders;
	
	var events = {};

	function register(event, callback) {
		if (!(event in events)) {
			events[event] = [];
		}
		events[event].push(callback);
	}
	
	function fire(event) {
		var i, l;
		var args = [];
		for (i=1, l=arguments.length; i<l; i++) {
			args.push(arguments[i]);
		}
		if (event in events) {
			for (i in events[event]) {
				events[event][i].apply(this, args);
			} 
		}
	}
/*
-                       'composites' => array(
-                               'opsz' => array(
-                                       '10' => array(
-                                               'XOPQ' => 110,
-                                               'YOPQ' => 75,
-                                               'YTLC' => 525,
-                                       ),
-                                       '14' => array(),
-                                       '72' => array(
-                                               'XTRA' => 300,
-                                               'YOPQ' => 12,
-                                               'YTLC' => 475,
-                                       ),
-                               ),
*/
	
	//load composites / paramaroundups
	$.each(window.fontInfo, function(fontfile) {
		var fontAxes = window.fontInfo[fontfile].axes;
		// <axis name="opsz">
		//   <location value="8">
		//   	<dimension name="XTRA" xvalue="402"/>
		//     <dimension name="XOPQ" xvalue="110"/>
		//     <dimension name="YOPQ" xvalue="87"/>
		//   </location>

		$.ajax("fonts/" + fontfile + ".truevalues", {
			dataType: "xml",
			success: function(xml) {
				if (!(xml instanceof Document)) {
					return;
				}
				var composites = {};
				$(xml).find('axis').each(function() {
					var compAxis = $(this);
					var ctag = compAxis.attr('name');
					composites[ctag] = {};
					compAxis.find('location').each(function() {
						var location = $(this);
						var compValue = parseFloat(location.attr('value'));
						
						//insert default value with empty sub-axes
						if (compValue > fontAxes[ctag].default) {
							composites[ctag][fontAxes[ctag].default] = {};
						}
						
						composites[ctag][compValue] = {};
						location.find('dimension').each(function() {
							var dim = $(this);
							composites[ctag][compValue][dim.attr('name')] = parseFloat(dim.attr('xvalue'));
						});
					});
				});
				window.fontInfo[fontfile].composites = composites;
			}
		});
	});

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
			if (temp = setting.match(/["'](....)['"]\s+([\-\d\.]+)/)) {
				k = temp[1];
				v = parseFloat(temp[2]);
				axes[k] = v;
				delete axisDeltas[k];
			}
		});
		$.each(axisDefaults, function(axis, dv) {
			if (!(axis in axes)) {
				axes[axis] = dv.default;
			}
		});
		return axes;
	}

	function fvsToSliders(fvs, styleEl) {
		var savedDeltas, sliderVals;
		
		try {
			savedDeltas = JSON.parse(styleEl.attr('data-axis-deltas'));
		} catch (e) {
			savedDeltas = null;
		}
		
		try {
			sliderVals = JSON.parse(styleEl.attr('data-slider-values') || '{}');
		} catch (e) {
			sliderVals = {};
		}

		var axes = fvsToAxes(fvs);

		//convert fake CAPS values into their real versions
		$.each(axes, function(k, v) {
			controls.find('input[name="' + k + '"]').val(k in sliderVals ? sliderVals[k] : v);
			compositeToParametric(k, v);
		});

		//after everything, restore deltas to their previous values
		if (savedDeltas) {
			axisDeltas = savedDeltas;
		}
	}
		

	function updateCSSOutput() {
		//update CSS output
		var styletext = "";
		$('head style[id^="style-"]').each(function() { 
			styletext += this.textContent;
		});
		$('#css-output').text(styletext.trim());
	}

	//override Amstelvar Parametric sliders
	function fake64() {
		if ($('#select-font').val() === 'Amstelvar-Roman-parametric-VF' && $('#edit-size').val() == 64) {
			$.each({
				'XOPQ': 85, 
				'XTRA': 365, 
				'YOPQ': 46, 
				'YTLC': 484, 
				'YTUC': 750, 
				'YTFG': 750, 
				'YTDE': -240, 
				'YTAS': 750, 
				'YTSE': 18, 
				'PWHT': 85, 
				'PWTH': 465
			}, function(a, v) {
				$("input[name=" + a + "]").val(v);
			});
			$('input[type=range][name=XOPQ]').trigger('change');
		}
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
			var editvalue = document.createElement('input');
			
			label.for = slider.id = "input-" + axis;				
			label.innerHTML = values.name ? values.name + ' <abbr>' + axis + '</abbr>' : axis;

			editvalue.id = "edit-" + axis;
			
			editvalue.type = 'number';
			slider.type = 'range';

			editvalue.name = slider.name = axis;
			editvalue.min = slider.min = values.min;
			editvalue.max = slider.max = values.max;
			editvalue.step = slider.step = values.max-values.min > 50 ? 1 : (values.max-values.min)/100;
			editvalue.value = slider.value = values.default;
			
			li.appendChild(label);
			li.appendChild(editvalue);
			li.appendChild(slider);
			
			if (axis === 'opsz') {
				//add option to disconnect size adjustments from opsz
				var extraLabel = document.createElement('label');
				extraLabel.innerHTML = "<input type='checkbox' id='match-opsz' checked> Mirror size changes";
				li.appendChild(extraLabel);
			}
			
			axisInputs.append(li);
		});
		
		fake64();
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
				var leading = parseFloat($('#edit-leading').val());
				var oldval = parseFloat($('#edit-size').data('oldval')) || el.value;
				$('input[name="leading"]').val(leading + constrained - oldval).trigger(evt.type);
			}
			
			$('#edit-size').data('oldval', constrained);

			//auto-match optical size
			try {
				if (document.getElementById('match-opsz').checked) {
					setTimeout(function() { $('input[name="opsz"]').val(el.value).trigger(evt.type); });
				}
			} catch (e) {} 
		}

		if (el.name in composites) {
			//calculate composite axes into their individual parameters
			TNTools.compositeToParametric(el.name, constrained);
		} else if (el.name in axisDeltas) {
			//when adjusting parametric axes, reset composites to their defaults
			console.log(axisDefaults);
			console.log(axisDeltas);
			$.each(axisDeltas[el.name], function(caxis, cdelta) {
				$('input[name="' + caxis + '"]').val(axisDefaults[caxis].default);
			})
			axisDeltas = {};
//			delete axisDeltas[el.name];
		}
	}

	function updateParameters(el) {
		el = $(el);
		var size = Math.round($('#edit-size').val());
		var leading = Math.round($('#edit-leading').val());
		var fvs = el.css('font-variation-settings') || '';

		var paramText = fvs.replace(/['"]\s+/g, ' ').replace(/['"]/g, '');

		el.attr('data-axes', paramText);
		el.attr('data-size-leading', size + '/' + leading);

		var paramEl = el.children('.blue-params');
		if (paramEl.text() !== paramText) {
			if (!paramEl.length) {
				paramEl = $('<div class="blue-params"></div>');
				el.append(paramEl);
			}
			paramEl.text(el.attr('data-axes'));
		}
	}

	function slidersToElement(options) {
		/* options: only selector is required
			-selector: the actual CSS selector to apply the styles to
			-styleElement: <style> to add CSS text to
		*/
			
//		updateURL();

		if (typeof options !== 'object') {
			options = {};
		}

		//if called with non-standard options, run it with standard options too, to update general styles
		if (options.styleElement || options.selector) {
			slidersToElement();
		}

		roundInputs();

		var styleEl = $(options.styleElement || '#style-general');
		var selector = options.selector || '.variable-demo-target';
		
		var rules = [];
		var vrules = [];
		
		var size = Math.round($('#edit-size').val());
		var leading = Math.round($('#edit-leading').val());
		var foreground = $('#foreground').length && $('#foreground').spectrum('get').toString();
		var background = $('#background').length && $('#background').spectrum('get').toString();

		rules.push('font-family: "' + fontInfo[$('#select-font').val()].name + ' Demo", "Adobe Blank", "Comic Sans MS"');
		
		if (size) {
			rules.push("font-size: " + size + 'pt');
		}
		
		if (leading) {
			rules.push("line-height: " + leading + 'pt');
		}
		
		if (background) {
			rules.push('background-color: ' + background);
		}

		if (foreground) {
			rules.push('color: ' + foreground);
		}
		
		if ((temp=$('input[name=alignment]')).length) {
			rules.push("text-align: " + (temp.filter(':checked').val() || 'left'));
		}

		//turn sliders into font-variation-settings
		var fvs = {};
		var fvsv = {};

		//fvs['opsz'] = $('#edit-size').val();
		var sliderVals = {};
		$.each($('#axis-inputs input[type=range]'), function() {
			if (this.name in composites) {
				// we use the real value of the composite and leave parametrics at default
				fvs[this.name] = fvsv[this.name] = this.value;
			} else if (this.name in axisDeltas) {
				//parametric axes get left at default, but let's but in a fake helper string to remember the value
				var sum = 0;
				$.each(axisDeltas[this.name], function(caxis, cdelta) {
					sum += cdelta;
				});
				var theoreticalValue = sliderVals[this.name] = axisDefaults[this.name].default + sum;
				fvs[this.name] = fvsv[this.name] = axisDefaults[this.name].default;
				$('input[name="' + this.name + '"]').val(theoreticalValue);
			} else {
				// iOS 11 Safari has a bug that treats unspecified axes as the minimum instead of the default
				// so always specify everything
				if (!(this.name in fvs)) { 
					fvsv[this.name] = this.value;
					if (this.value != axisDefaults[this.name].default) {
						fvs[this.name] = this.value;
					}
				}
			}
		});

		//SAFARI BUG: if default opsz is specified on font-variation-settings, the browser sets it to match the font size
		if ('opsz' in fvs && 'opsz' in axisDefaults && fvs.opsz == axisDefaults.opsz.default) {
			fvs.opsz = parseFloat(fvs.opsz) + 0.01;
		}
		if ('opsz' in fvsv && 'opsz' in axisDefaults && fvsv.opsz == axisDefaults.opsz.default) {
			fvsv.opsz = parseFloat(fvsv.opsz) + 0.01;
		}

		var fvsa = [];
		$.each(fvs, function(k,v) {
			fvsa.push('"' + k + '" ' + v);
		})		
		var fvss = fvsa.join(', ');

		var fvsva = [];
		$.each(fvsv, function(k,v) {
			fvsva.push('"' + k + '" ' + v);
		})		
		var fvsvs = fvsva.join(', ');
		
		if (fvsa.length) {
			rules.push('font-variation-settings: ' + fvss);
		}

		if (fvsva.length) {
			vrules.push('font-variation-settings: ' + fvsvs);
		}

		// update the actual CSS
		styleEl.text('\n' 
			+ selector + ' {\n\t' + rules.join(';\n\t') + ';\n}\n'
			+ '\n.verbose-fvs ' + selector + ' {\n\t' + vrules.join(';\n\t') + ';\n}\n'
		);
		
		//record parametric ghosts
		styleEl.attr({
			'data-axis-deltas': JSON.stringify(axisDeltas),
			'data-slider-values': JSON.stringify(sliderVals)
		});

		// update colophon output
		updateParameters(selector);
		updateCSSOutput();
	}
	
	function roundInputs() {
		controls.find('#edit-size, #edit-to-size, #edit-leading').each(function() {
			this.value = Math.round(parseFloat(this.value) * 1000) / 1000;
		});
	}
	
	function elementToSliders(testEl) {
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
		
		controls.find('input[name=size], input[name=opsz]').val(parseFloat(testEl.css('font-size'))*3/4);
		$('#edit-size').data('oldval', parseFloat(testEl.css('font-size'))*3/4);
		controls.find('input[name=leading]').val(parseFloat(testEl.css('line-height'))*3/4);
		controls.find('input[name=alignment][value="' + align + '"]').prop('checked', true);

		fake64();
		
		$('#foreground').spectrum('set', testEl.css('color'));

		var temp = testEl.css('background-color');
		$('#background').spectrum('set', (temp === 'transparent' || temp.match(/rgba\(.+,\s*0(\.0)?/)) ? 'white' : temp);
		
		roundInputs();
	}
	
	function handleFontChange(font) {
		//populate axis sliders with font defaults
		axisInputs.empty();
		
		var spectropts = {
			'showInput': true,
			'showAlpha': true,
			'showPalette': true,
			'showSelectionPalette': true,
			'localStorageKey': 'spectrum',
			'showInitial': true,
			'chooseText': 'OK',
			'cancelText': 'Cancel',
			'preferredFormat': 'hex'
		};
		
		spectropts.color = $('#foreground').attr('value');
		$('#foreground').spectrum(spectropts);

		spectropts.color = $('#background').attr('value');
		$('#background').spectrum(spectropts);
		
		composites = fontInfo[font].composites || {};
		axisDefaults = fontInfo[font].axes;
		axisDeltas = {};
		
		$('style[data-axis-deltas][data-slider-values]').attr({
			'data-axis-deltas': '{}',
			'data-slider-values': '{}'
		});

		
		$('head style[id^="style-"]').empty().removeData();
		$('input[type=checkbox]').each(function() {
			this.checked = this.hasAttribute('checked');
			$(this).trigger('change');
		});
		$('#align-left').prop('checked',true);

		TNTools.populateAxisSliders(font);
		
		axisSliders = axisInputs.find('input[type=range]');

		//populate named instances selector
		var selectInstance = $('#select-instance').empty();
		var instances = fontInfo[font].instances || [];
		if (instances.length) {
			var foundDefault = false;
			$.each(instances, function(i, instance) {
				var isDefault = true;
				var option = $('<option></option>');
				option.val(i);
				option.text(instance.name);
				option.data('axes', instance.axes);
				$.each(instance.axes, function(k, v) {
					if (!(k in axisDefaults) || axisDefaults[k].default != v) {
						isDefault = false;
						return false;
					}
				});
				if (isDefault) {
					foundDefault = true;
					option.attr('selected', true);
				}
				selectInstance.append(option);
			});
			if (!foundDefault) {
				selectInstance.prepend("<option></option>");
			}
		} else {
			selectInstance.append("<option>No named instances</option>");
		}
		
		$(document).trigger('typetools:fontChange');
	}

	function handleInstanceChange() {
		var instance = $('#select-instance option:selected');
		if (!instance.length) return;
		var axes = instance.data('axes');
		if (!axes) return;
		$.each(axes, function(k, v) {
			var inputs = $('#controls input[name="' + k + '"]');
			inputs.val(v);
			inputs.filter('[type=range]').trigger('change');
		});
		
	}
	
	function addCustomFont(fonttag, url, format, font) {
		var info = {
			'name': font.getEnglishName('fontFamily'),
			'axes': {},
			'instances': [],
			'axisOrder': [],
			'composites': [],
			'fontobj': font
		};
		if ('fvar' in font.tables && 'axes' in font.tables.fvar) {
			$.each(font.tables.fvar.axes, function(i, axis) {
				info.axes[axis.tag] = {
					'name': 'name' in axis ? axis.name.en : axis.tag,
					'min': axis.minValue,
					'max': axis.maxValue,
					'default': axis.defaultValue
				};
				info.axisOrder.push(axis.tag);
			});
		}
		if ('fvar' in font.tables && 'instances' in font.tables.fvar) {
			$.each(font.tables.fvar.instances, function(i, instance) {
				info.instances.push({
					'name': instance.name.en || instance.name,
					'axes': instance.coordinates
				});
			});
		}
		
		window.font = font;

		$('head').append('<style>@font-face { font-family:"' + info.name + ' Demo"; src: url("' + url + '") format("' + format + '"); }</style>');

		window.fontInfo[fonttag] = info;
		var optgroup = $('#custom-optgroup');
		var option = document.createElement('option');
		option.value = fonttag;
		option.innerHTML = info.name;
		option.selected = true;
		if (!optgroup.length) {
			$('#select-font').wrapInner('<optgroup label="Defaults"></optgroup>');
			optgroup = $('<optgroup id="custom-optgroup" label="Your fonts"></optgroup>').prependTo($('#select-font'));
		}
		optgroup.append(option);

		setTimeout(function() { $('#select-font').trigger('change') });
	}

	function addCustomFonts(files) {
		$.each(files, function(i, file) {
			var reader = new FileReader();
			var mimetype, format;
			if (file.name.match(/\.[ot]tf$/)) {
				mimetype = "application/font-sfnt";
				format = "opentype";
			} else if (file.name.match(/\.(woff2?)$/)) {
				mimetype = "application/font-woff";
				format = RegExp.$1;
			} else {
				alert(file.name + " not a supported file type");
				return;
			}
			var blob = new Blob([file], {'type': mimetype});
			reader.addEventListener('load', function() {
				var datauri = this.result;
				window.opentype.load(datauri, function(err, font) {
					if (err) {
						console.log(err);
						return;
					}
					var fonttag = 'custom-' + file.name.replace(/(-VF)?\.\w+$/, '');
					addCustomFont(fonttag, datauri, format, font);
				});
			});
			reader.readAsDataURL(blob);
		});
	}
	

	function tnTypeTools() {
		return {
			'register': register,
			'fire': fire,
			'customFonts': {},
			'clone': function(obj) { return JSON.parse(JSON.stringify(obj)); },
			'isRegisteredAxis': function(axis) { return registeredAxes.indexOf(axis) >= 0; },
			'populateAxisSliders': populateAxisSliders,
			'slidersToElement': slidersToElement,
			'elementToSliders': elementToSliders,
			'updateParameters': updateParameters,
			'updateCSSOutput': updateCSSOutput,
			'handleSliderChange': handleSlider,
			'handleFontChange': handleFontChange,
			'handleInstanceChange': handleInstanceChange,
			'fvsToAxes': fvsToAxes,
			'fvsToSliders': fvsToSliders,
			'compositeToParametric': compositeToParametric,
			'addCustomFonts': addCustomFonts,
			'addCustomFont': addCustomFont
		};
	}
	
	$(function() {
		controls = $('#controls');
		axisInputs = $('#axis-inputs');
		axisSliders = axisInputs.find('input[type=range]');

		if (/[\?&]css=([^&]+)/.test(window.location.search)) {
			var originalStyle = decodeURIComponent(RegExp.$1);
			var osEl = document.createElement('style');
			osEl.id = 'bookmarked-style';
			osEl.textContent = originalStyle;
			$('head').append(osEl);
		}

		if (/[\?&]composites=([^&]+)/.test(window.location.search)) {
			window.bookmarkedComposites = JSON.parse(decodeURIComponent(RegExp.$1));
		}

		$('head').append("<style id='style-general'></style>");
		$('#mode-sections > sections').each(function() {
			var styleid = 'style-' + this.id;
			if ($('#' + styleid).length === 0) {
				$('head').append("<style id='" + styleid + "'></style>");
			}
		});

		$('#select-mode').on('change', function(evt) {
			$('#mode-sections > section').hide();
			$('#mode-sections > #' + this.value).show();
			$('label[for="edit-to-size"], #edit-to-size')[this.value === 'waterfall' ? 'show' : 'hide']();
			$('#column-width-container')[this.value === 'typespec' ? 'show' : 'hide']();
			fire.call(this, 'modeChange', evt);
		});

		$('#select-font').on('change', function(evt) {
			if (TNTools.handleFontChange($(this).val()) === false) {
				return;
			}

			fire.call(this, 'fontChange', $(this).val());
		});

		$('#select-instance').on('change', handleInstanceChange);

		controls.on('change input', 'input[type=range], input[type=number]', function(evt) {
			var constrained = Math.max(this.min || -Infinity, Math.min(this.max || Infinity, this.value));
			if (this.type === 'range' && this.name === 'size') {
				var leading = parseFloat($('#edit-leading').val());
				var oldval = parseFloat($(this).data('oldval'));
			}

			fire.call(this, 'sliderChange', evt);
			handleSlider(evt);
			fire('slidersToElement');
		});

		$("input[type=radio]").on('change', function() { TNTools.fire('slidersToElement'); });
		$('#foreground, #background').on('move.spectrum change.spectrum hide.spectrum', function() { TNTools.fire('slidersToElement'); });

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
	
		$('#verbose-fvs').on('change', function() {
			$('html')[this.checked ? 'addClass' : 'removeClass']('verbose-fvs');
			$('*[data-axes]').each(function() {
				TNTools.updateParameters(this);
			});
		});
	
		$('#show-css').on('change', function() {
			$('#css-output')[this.checked ? 'show' : 'hide']();
		}).trigger('change');
	
		$('#reset').on('click', function() {
			$('#select-font').trigger('change');
			return false;
		});
		
		$('#grab-new-fonts').on('click', function() {
			var clocks = ['🕛','🕧','🕐','🕜','🕑','🕝','🕒','🕞','🕓','🕟','🕔','🕠','🕕','🕢','🕖','🕢','🕗','🕣','🕘','🕤','🕙','🕥','🕚','🕦'];
			var start = Date.now();
			$(this).next('span').remove();
			var spinner = $("<span style='padding-left: 0.33em'>" + clocks[0] + "</span>").insertAfter(this);
			var interval = setInterval(function() {
				var sec = (Date.now() - start) / 1000;
				spinner.text(clocks[Math.floor(sec*2)%24]);
			}, 500);
			$.ajax(this.href, {
				'complete': function(xhr) {
					clearInterval(interval);
					if (xhr.status === 200) {
						spinner.text("✅ reloading…").attr('title', xhr.responseText);
						setTimeout(function() { window.location.reload(); }, 1000);
					} else {
						spinner.text("❌").attr('title', xhr.statusText + " — call chris!");
					}
				}
			});
			return false;
		});

		$('#add-your-own-button').on('click', function(evt) {
			$('#custom-fonts')[0].click();
			return false;
		});
		
		var addYourOwnTooltip;
		$('#add-your-own-container .tooltip-container button').on('click', function(evt) {
			if (!addYourOwnTooltip) {
				addYourOwnTooltip = document.createElement('span');
				addYourOwnTooltip.className = 'tooltip-content';
				addYourOwnTooltip.id = 'tooltip-' + Math.floor(Math.random() * 1000000) + '-' + Date.now();
				addYourOwnTooltip.textContent = this.getAttribute('data-tooltip');
				addYourOwnTooltip.setAttribute('role', 'tooltip');
				addYourOwnTooltip.style.top = evt.clientY + 'px';
				addYourOwnTooltip.style.left = (evt.clientX + this.getBoundingClientRect().width) + 'px';
				this.setAttribute('aria-labelledby', addYourOwnTooltip.id);
				document.body.appendChild(addYourOwnTooltip);
				$(document).on('click.tooltip', function() {
					addYourOwnTooltip.remove();
					addYourOwnTooltip = null;
					$(document).off('.tooltip');
				});
				return false;
			}
		});

		$('#custom-fonts').on('change', function() {
			addCustomFonts(this.files);
		});
		
		$('#foreground, #background').on('click', function() {
			//clicking color labels fires the real control and not the spectrum picker
			$(this).spectrum('toggle');
			return false;
		});
		
		$('#fg-bg-invert').on('click', function() {
			var fg = $('#foreground');
			var bg = $('#background');
			var fgcolor = fg.spectrum('get');
			var bgcolor = bg.spectrum('get');
			fg.spectrum('set', bgcolor);
			bg.spectrum('set', fgcolor);
			fg.trigger('change');
			bg.trigger('change');
// 			updateURL();
		});

		$('#bookmark').on('click', function() {
			var data = {};
			$('style[id^="style-"]').each(function() {
				data[this.id] = $(this).data();
			});
			var css = $('#css-output').text();
			css = css.replace(/\s*([\n:;\{\}])\s*/g, '$1');
			css = css.replace(/\n/g, '');
			window.history.replaceState({}, '', '?css=' + encodeURIComponent(css) + '&composites=' + encodeURIComponent(JSON.stringify(data)));
			return false;
		});
				
		var dragging = false;
		$('body').on('dragover', function(evt) {
			if (dragging) return false;
			dragging = true;
			evt.originalEvent.dataTransfer.dropEffect = 'copy';
			$('body').addClass('dropzone');
			return false;
		}).on('dragleave', function(evt) {
			if (evt.target !== document.body) {
				return;
			}
			dragging = false;
			$('body').removeClass('dropzone');
			return false;
		}).on('dragend', function(evt) {
			$('body').removeClass('dropzone');
			dragging = false;
			return false;
		}).on('drop', function(evt) {
			addCustomFonts(evt.originalEvent.dataTransfer.files);
			$(this).trigger('dragend');
			return false;
		});
	});
	
	window.TNTools = tnTypeTools();
	
	$(window).on('load', function() {
		var showSidebar = $('a.content-options-show-filters');
		if (showSidebar.is(':visible')) {
			showSidebar.click();
		}
		$('#select-font').trigger('change');
	});
})();
