<?php
	$rows = 5;
	$cols = 5;
?>
<div id='griddd' data-style="Settings" class="variable-demo-target">
	<table>
	<?php for ($r=0; $r < $rows; $r++) :?>
		<tr>
		<?php for ($c=0; $c < $cols; $c++) :?>
			<td contenteditable="true">H</td>
		<?php endfor; ?>
	<?php endfor; ?>
	</table>
	<button type='button' id='remove-row' title="Remove a row">-</button>
	<button type='button' id='add-row' title="Add a row">+</button>
	<button type='button' id='remove-column' title="Remove a column">-</button>
	<button type='button' id='add-column' title="Add a column">+</button>
</div>