<?php
namespace TypeNetwork\TypeTools;
require_once("{$_SERVER['DOCUMENT_ROOT']}/tools.inc");

$tools = new TypeTools();

print $tools->pageHead('Proof')
?>
		<form id='controls'>
			<?= $tools->selectFont() ?>
			<?= $tools->sizeLeadingColor(72, 72, 12, 288); ?>
			<ul id='axis-inputs'>
			</ul>
			<?= $tools->metaLinks() ?>
		</form>
		<h1>Proof</h1>
		<figure id='proof-grid' data-style="Settings">
			
		</figure>
		<div id='css-output'></div>
	</body>
</html>
