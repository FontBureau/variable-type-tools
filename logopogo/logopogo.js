$(function() {
	"use strict";

	var temp; //general use
	
	var controls = $('#controls');
	var logopogo = $('#pogologo');
	
	if (!$('#style-pogologo').length) {
		$('head').append("<style id='style-pogologo'></style>");
	}
	
	function slidersToElement() {
		TNTools.slidersToElement({
			'selector': '#pogologo',
			'styleElement': $('#style-pogologo'),
			'paramsElement': logopogo
		});
	}

	controls.on('change input', 'input[type=range], input[type=number]', function(evt) {
		var constrained = Math.max(this.min || -Infinity, Math.min(this.max || Infinity, this.value));
		if (this.type === 'range' && this.name === 'size') {
			var leading = parseFloat($('#input-leading').val());
			var oldval = parseFloat($(this).data('oldval'));
		}
		TNTools.handleSliderChange(evt);
		slidersToElement();
	});
	
	$("input[type=radio]").on('change', slidersToElement);
	
	//font change triggers a lot of updates
	$('#select-font').on('change', function() {
		var font = $(this).val();
		TNTools.handleFontChange(font);
		$('#input-size').trigger('change');
		slidersToElement();
	}).trigger('change');

	$('#reset').on('click', function() {
		$('#select-font').trigger('change');
		return false;
	});

	$('#save-svg').on('click', function() {
		var fontURL = "/fonts/" + $('#select-font').val() + ".ttf";
		var text = logopogo.text().trim();
		fontkit.openURL(fontURL, function(err, font) {
			if (err) {
				alert('Failed loading font: ' + err);
			} else {
				var xmlns = "http://www.w3.org/2000/svg";

				try {
					var axes = TNTools.fvsToAxes(logopogo.css('font-variation-settings'));
					window.font = font = font.getVariation(axes);
				} catch (e) {
					alert(e);
					return;
				}

				var glyphrun = window.glyphs = font.layout(text);
				if (glyphrun.glyphs.length <= 0) {
					return;
				}
				var xMin=0, yMin=0, xMax=0, yMax=0;
				var advwidth = 0;
				var paths = [];
				$.each(glyphrun.glyphs, function(i, glyph) {
					paths.push('<path transform="translate(' + advwidth + ',0)" d="' + glyph.path.toSVG() + '"/>');

					xMin = Math.min(xMin, advwidth + glyph.bbox.minX);
					yMin = Math.min(yMin, glyph.bbox.minY);
					xMax = Math.max(xMax, advwidth + glyph.bbox.maxX);
					yMax = Math.max(yMax, glyph.bbox.maxY);
					advwidth += glyph.advanceWidth;
				});
				var viewbox = [xMin, yMin, xMax-xMin, yMax-yMin];

				var svglines = [];
				svglines.push('<?xml version="1.0" standalone="yes" ?>');
				svglines.push('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">');
				svglines.push('<svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="' + viewbox.join(' ') + '" height="' + $('#input-size').val() + 'px" width="' + ($('#input-size').val()*viewbox[2]/viewbox[3]) + '">');
				svglines.push('<g stroke="none" fill="black" transform="translate(0,' + (viewbox[1]+viewbox[3]) +') scale(1,-1) translate(0,' + (-viewbox[1]) + ')">');
				svglines.push(paths.join("\n"));
				svglines.push('</g>');
				svglines.push('</svg>');
				
				var url = 'data:image/svg+xml,' + encodeURIComponent(svglines.join(""));
				var now = new Date();
/*
				var filename = [];
				$.each([now.getFullYear(), now.getMonth()+1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()], function(i,v) {
					filename.push((v < 10 ? '0' : '') + v);
				});
*/
				var filename = ($('#select-font option:selected').text().trim() + '-' + text).replace(/\s+/g, '-') + '.svg';
				var a = document.createElement('a');
				a.style.display='none';
				a.setAttribute('download', filename);
				a.href = url;
				a.target = '_blank';
				a.textContent = "DOWNLOAD ME";
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}
		});
	});
});