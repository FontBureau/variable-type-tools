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
</div>