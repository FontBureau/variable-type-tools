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
				var leading = parseFloat($('#input-leading').val());
				var oldval = parseFloat($('#input-size').data('oldval')) || el.value;
				$('input[name="leading"]').val(leading + constrained - oldval).trigger(evt.type);
			}
			
			$('#input-size').data('oldval', constrained);

			//auto-match optical size
			setTimeout(function() { $('input[name="opsz"]').val(el.value).trigger(evt.type); });
		}

		//calculate composite axes into their individual parameters
		if (el.name in composites) {
			TNTools.compositeToParametric(el.name, constrained);
		} else if (el.name in axisDeltas) {
			delete axisDeltas[el.name];
		}
	}

	function updateParameters(el) {
		el = $(el);
		var size = parseInt($('#input-size').val());
		var leading = parseInt($('#input-leading').val());
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
		var fvsv = {};

		//fvs['opsz'] = $('#input-size').val();
		$.each($('#axis-inputs input[type=range]'), function() {
			if (this.name in composites) {
				//composite axes get left at default, but let's but in a fake helper string to remember the value
				styleEl.data(this.name, this.value); //axisDefaults[this.name].default;
				fvsv[this.name] = axisDefaults[this.name].default;
			} else if (this.name in axisDeltas) {
				var sum = 0;
				$.each(axisDeltas[this.name], function(caxis, cdelta) {
					sum += cdelta;
				});
				if (sum != 0) {
					fvs[this.name] = axisDefaults[this.name].default + sum;
				}
				fvsv[this.name] = axisDefaults[this.name].default + sum;
				$('input[name="' + this.name + '"]').val(fvsv[this.name]);
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
	
	function handleFontChange(font) {
		//populate axis sliders with font defaults
		axisInputs.empty();

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
	}

	function tnTypeTools() {
		return {
			'clone': function(obj) { return JSON.parse(JSON.stringify(obj)); },
			'isRegisteredAxis': function(axis) { return registeredAxes.indexOf(axis) >= 0; },
			'populateAxisSliders': populateAxisSliders,
			'slidersToElement': slidersToElement,
			'updateParameters': updateParameters,
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
					console.log(file.name + " not a supported file type");
					return;
				}
				var blob = new Blob([file], {'type': mimetype});
				reader.addEventListener('load', function() {
					var datauri = this.result;
					window.opentype.load(datauri, function (err, font) {
						if (err) {
							console.log(err);
							return;
						}
						window.font = font;
						var fonttag = 'custom-' + file.name.replace(/(-VF)?\.\w+$/, '');
						var info = {
							'name': font.getEnglishName('fullName'),
							'axes': {},
							'axisOrder': [],
							'composites': []
						};
						if (!font.tables.fvar || !font.tables.fvar.axes) {
							console.log(info.name + " has no fvar table");
							return;
						}
						$.each(font.tables.fvar.axes, function(i, axis) {
							info.axes[axis.tag] = {
								'name': 'name' in axis ? axis.name.en : axis.tag,
								'min': axis.minValue,
								'max': axis.maxValue,
								'default': axis.defaultValue
							};
							info.axisOrder.push(axis.tag);
						});

						$('head').append('<style>@font-face { font-family:"' + info.name + ' Demo"; src: url("' + datauri + '") format("' + format + '"); }</style>');
						window.fontInfo[fonttag] = info;
						var optgroup, option = document.createElement('option');
						option.value = fonttag;
						option.innerHTML = info.name;
						if (!optgroup) {
							option.selected = true;
							$('#select-font').wrapInner('<optgroup label="Defaults"></optgroup>');
							optgroup = $('<optgroup id="custom-optgroup" label="Your fonts"></optgroup>').prependTo($('#select-font'));
						}
						optgroup.append(option);
					});
				});
				reader.readAsDataURL(blob);
			});
			//for some reason the new selection doesn't register for a moment
			setTimeout(function() { $('#select-font').trigger('change') }, 100);
		}
		
		$('#custom-fonts-fakeout').on('click', function() {
			$('#custom-fonts')[0].click();
			return false;
		})

		$('#custom-fonts').on('change', function() {
			addCustomFonts(this.files);
		});
		
		var dragging = false;
		$(document).on('dragover', function(evt) {
			if (dragging) return false;
			dragging = true;
			evt.originalEvent.dataTransfer.dropEffect = 'copy';
			$('body').addClass('dropzone');
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