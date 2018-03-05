(function() {
	"use strict";

	var temp;
	
	var registeredAxes = ['opsz', 'wght', 'wdth', 'ital', 'slnt', 'grad', 'GRAD'];

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
		var axes = fvsToAxes(fvs);
		//convert fake CAPS values into their real versions
		$.each(axes, function(k, v) {
			var override = parseFloat(styleEl.data(k));
			var val = isNaN(override) ? v : override;
			controls.find('input[name="' + k + '"]').val(val);
			compositeToParametric(k, val);
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
				var leading = parseFloat($('#edit-leading').val());
				var oldval = parseFloat($('#edit-size').data('oldval')) || el.value;
				$('input[name="leading"]').val(leading + constrained - oldval).trigger(evt.type);
			}
			
			$('#edit-size').data('oldval', constrained);

			//auto-match optical size
			setTimeout(function() { $('input[name="opsz"]').val(el.value).trigger(evt.type); });
		}

		if (el.name in composites) {
			//calculate composite axes into their individual parameters
			TNTools.compositeToParametric(el.name, constrained);
		} else if (el.name in axisDeltas) {
			//when adjusting parametric axes, reset composites to their defaults
			$.each(axisDeltas[el.name], function(caxis, cdelta) {
				$('input[name="' + caxis + '"]').val(axisDefaults[caxis].default);
			})
			axisDeltas = {};
//			delete axisDeltas[el.name];
		}
	}

	function updateParameters(el) {
		el = $(el);
		var size = parseInt($('#edit-size').val());
		var leading = parseInt($('#edit-leading').val());
		var fvs = el.css('font-variation-settings') || '';

		el.attr('data-axes', fvs.replace(/['"]\s+/g, ' ').replace(/['"]/g, ''));
		el.attr('data-size-leading', size + '/' + leading);
	}

	function slidersToElement(options) {
		/* options: only selector is required
			-selector: the actual CSS selector to apply the styles to
			-styleElement: <style> to add CSS text to
		*/
			
//		updateURL();
		
		var styleEl = $(options.styleElement);
		
		var rules = [];
		var vrules = [];
		
		var size = parseInt($('#edit-size').val());
		var leading = parseInt($('#edit-leading').val());
		var foreground = $('#foreground').length && $('#foreground').spectrum('get').toString();
		var background = $('#background').length && $('#background').spectrum('get').toString();

		rules.push('font-family: "' + fontInfo[$('#select-font').val()].name + ' Demo"');
		
		if (size) {
			rules.push("font-size: " + size + 'px');
		}
		
		if (leading) {
			rules.push("line-height: " + leading + 'px');
		}
		
		if (background) {
			rules.push('background-color: ' + background);
			//update background of paragraph container
			if (options.paramsElement && options.selector && !(options.paramsElement).is(options.selector)) {
    			$(options.paramsElement).css('background-color', background);
			}
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
				var theoreticalValue = axisDefaults[this.name].default + sum;
				styleEl.data(this.name, theoreticalValue);
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
			+ options.selector + ' {\n\t' + rules.join(';\n\t') + ';\n}\n'
			+ '\n.verbose-fvs ' + options.selector + ' {\n\t' + vrules.join(';\n\t') + ';\n}\n'
		);

		// update colophon output
		updateParameters(options.paramsElement);
		updateCSSOutput();
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
				
		controls.find('input[name=size], input[name=opsz]').val(parseInt(testEl.css('font-size')));
		$('#edit-size').data('oldval', parseInt(testEl.css('font-size')));
		controls.find('input[name=leading]').val(parseInt(testEl.css('line-height')));
		controls.find('input[name=alignment][value="' + align + '"]').prop('checked', true);
		
		$('#foreground').spectrum('set', testEl.css('color'));

		var temp = testEl.css('background-color');
		$('#background').spectrum('set', temp === 'transparent' || temp.match(/rgba\(.+,\s*0(\.0)?/) ? 'white' : temp);
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
		
		composites = fontInfo[font].composites;
		axisDefaults = fontInfo[font].axes;
		axisDeltas = {};
		
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
			selectInstance.append("<option	>No named instances</option>");
		}
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
			'name': font.getEnglishName('fullName'),
			'axes': {},
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
		//for some reason the new selection doesn't register for a moment
		setTimeout(function() { $('#select-font').trigger('change') }, 100);
	}
	

	function tnTypeTools() {
		return {
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

		$('#select-instance').on('change', handleInstanceChange);

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

		$('#custom-fonts-fakeout').on('click', function() {
			$('#custom-fonts')[0].click();
			return false;
		})

		$('#custom-fonts').on('change', function() {
			addCustomFonts(this.files);
		});
		
		$('#foreground, #background').on('click', function() {
			//clicking color labels fires the real control and not the spectrum picker
			$(this).spectrum('toggle');
			return false;
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
})();