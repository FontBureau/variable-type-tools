<?php
namespace TypeNetwork\TypeTools;
require_once("{$_SERVER['DOCUMENT_ROOT']}/tools.inc");

$tools = new TypeTools();

print $tools->pageHead('TN Type Tools');
print $tools->pageSections();
print $tools->pageFoot();
