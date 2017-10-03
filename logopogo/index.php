<?php
namespace TypeNetwork\TypeTools;
require_once("{$_SERVER['DOCUMENT_ROOT']}/tools.inc");

$tools = new TypeTools();

print $tools->pageHead('Logo Pogo')
?>
		<form id='controls'>
			<?= $tools->selectFont() ?>
			<?= $tools->sizeLeadingColor(72, 72, 12, 288); ?>
			<ul id='axis-inputs'>
			</ul>
			<?= $tools->metaLinks() ?>
		</form>
		<h1>Logo Pogo</h1>
		<figure id='pogologo' contenteditable spellcheck="false" data-style="Settings">
			Brand Name
		</figure>
		<div id='save-buttons'>
<!-- 			<h3>Save as:</h3> -->
			<button class="button_default" id='save-svg'>Download SVG</button>
<!--
			<button class="button_default" id='save-pdf'>PDF</button>
			<button class="button_default" id='save-ttf'>TTF</button>
-->
		</div>
		<div id='css-output'></div>
	</body>
</html>
