<?php
namespace TypeNetwork\TypeTools;

class TypeTools {
	public $fontinfo;
	private $slidercount = 0;
	
	private $customSettings = array(
		'Amstelvar' => array(
			'order' => array('opsz', 'wght', 'wdth', 'GRAD', 'XOPQ', 'XTRA', 'YOPQ', 'YTLC', 'YTSE'),
			'composites' => array(
				'opsz' => array(
					'10' => array(
						'XOPQ' => 110,
						'YOPQ' => 75,
						'YTLC' => 525,
					),
					'14' => array(),
					'72' => array(
						'XTRA' => 300,
						'YOPQ' => 12,
						'YTLC' => 475,
					),
				),
				'wdth' => array(
					'60' => array(
						'XTRA' => 42,
						'XOPQ' => 70,
						'YOPQ' => 45,
					),
					'402' => array(),
				),
				'wght' => array(
					'38' => array(
						'XOPQ' => 38,
						'YOPQ' => 25,
						'XTRA' => 375,
						'YTSE' => 8,
					),
					'88' => array(),
					'250' => array(
						'XOPQ' => 250,
						'XTRA' => 250,
						'YTLC' => 525,
					),
				),
			),
		),
	);
	
	public static function requireLogin($user, $password) {
		if (!isset($_SERVER['PHP_AUTH_USER']) || $_SERVER['PHP_AUTH_USER'] !== $user || $_SERVER['PHP_AUTH_PW'] !== $password) {
			header('HTTP/1.1 401 Unauthorized');
			header('WWW-Authenticate: Basic realm="TN Type Tools"');
			echo 'Varfontnügen';
			exit;
		}	
	}

	function __construct() {
		$this->fontinfo = json_decode(file_get_contents("{$_SERVER['DOCUMENT_ROOT']}/fonts/axes.json"));
		$this->fontinfo = get_object_vars($this->fontinfo);
		ksort($this->fontinfo);
			
		$specific_font = false;
		if (preg_match('/^(.+)-var\./', $_SERVER['HTTP_HOST'], $matches)) {
			$specific_font = strtolower($matches[1]);
		}
	
		foreach ($this->fontinfo as $filebase => $axes) {
			if ($specific_font) {
				if (strpos(strtolower($filebase), $specific_font) !== 0) {
					unset($this->fontinfo[$filebase]);
					continue;
				}
			} else if (!preg_match('/^(Amstelvar|Escrow|Gimlet|Dunbar|Decovar|Input|Momentum)/', $filebase)) {
				unset($this->fontinfo[$filebase]);
				continue;
			}
			
/*
			if (!isset($axes->wght) || !isset($axes->wdth)) {
				unset($this->fontinfo[$filebase]);
				continue;
			}
*/
	
			#take off dev stuff from the end of the filename
			$fontname = preg_replace('/(?:[Vv]\d+|[Aa]lpha|[Bb]eta)?-VF$/', '', $filebase);
			
			#separate into words
			$fontname = preg_replace('/(?<=[a-z])[_-]?(?=[A-Z])/', ' ', $fontname);

			//figure out axis order
			$order = array();
			if (isset($this->customSettings[$fontname]['order'])) {
				$order = $this->customSettings[$fontname]['order'];
			}
			if (isset($axes->order)) {
				if (!$order) {
					$order = $axes->order;
					sort($order);
				}
				unset($axes->order);
			}
			if (!$order) {
				$order = array_keys(get_object_vars($axes));
			}


			$this->fontinfo[$filebase] = (object)array(
				'name' => $fontname,
				'axes' => $axes,
				'axisOrder' => $order,
				'composites' => isset($this->customSettings[$fontname]['composites']) ? $this->customSettings[$fontname]['composites'] : array(),
			);
		}
	}

	public function pageHead($title) {
		$whichtool = basename(dirname($_SERVER['SCRIPT_FILENAME']));
	?>
<!DOCTYPE html>
<html lang="en" id="<?= $whichtool ?>">
	<head>
		<meta charset="utf-8">
		<title><?= $title ?></title>
		<meta name="viewport" content="initial-scale=1,shrink-to-fit=no">
		<link rel="stylesheet" href="https://store.typenetwork.com/css/tn.css">
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
		<style>
<?php foreach ($this->fontinfo as $filebase => $info): ?>
			@font-face {
				font-family: "<?= $info->name ?> Demo";
				src: url("/fonts/<?= $filebase ?>.woff") format("woff");
			}
<?php endforeach; ?>
		</style>
		<link rel="stylesheet" href="/tools.css">
		<link rel="stylesheet" href="<?= $whichtool ?>.css">
		<script>
			var fontInfo = <?= json_encode($this->fontinfo) ?>;
		</script>
		<script src="/tools.js"></script>
		<script src="<?= $whichtool ?>.js"></script>
	</head>
	<body>
		<h1><img src="/images/typenetwork-logo.svg" alt="Type Network"></h1>
<?php
		return "";
	}
	
	public function selectFont($label="Font") {
	?>
			<label for="select-font"><?= $label ?></label>
			<select name="font" id='select-font'>
<?php foreach ($this->fontinfo as $filebase => $info): ?>
				<option value="<?= $filebase ?>"<?php if ($info->name==='Amstelvar') print " selected"; ?>><?= $info->name ?></option>
<?php endforeach ?>
			</select>
	<?php
		return "";
	}
	
	public function slider($options=array()) {
		if (!is_array($options)) {
			$options = array(
				'id' => $options,
				'name' => $options,
			);
		}
		++$this->slidercount;
		if (empty($options['id'])) {
			$options['id'] = "slider-{$this->slidercount}";
		}
		if (empty($options['name'])) {
			$options['name'] = "slider-{$this->slidercount}";
		}
		if (empty($options['label'])) {
			$options['label'] = ucfirst($options['name']);
		}
	?>
		<div class='slider'>
			<label for="input-<?= $options['id'] ?>"><?= $options['label'] ?></label>
			<label for="edit-<?= $options['id'] ?>"><?= $options['unit'] ?></label>
			<input type='number' id="edit-<?= $options['id'] ?>" name='<?= $options['name'] ?>' min='<?= isset($options['min']) ? $options['min'] : 1 ?>' max='<?= isset($options['max']) ? $options['max'] : 1000 ?>' value='<?= isset($options['default']) ? $options['default'] : 500 ?>'>
			<input type='range' id="input-<?= $options['id'] ?>" name='<?= $options['name'] ?>' min='<?= isset($options['min']) ? $options['min'] : 1 ?>' max='<?= isset($options['max']) ? $options['max'] : 1000 ?>' value='<?= isset($options['default']) ? $options['default'] : 500 ?>' step='<?= isset($options['step']) ? $options['step'] : 1 ?>'>
		</div>
	<?php
		return "";
	}
}