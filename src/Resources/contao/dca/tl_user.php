<?php

$GLOBALS['TL_DCA']['tl_user']['fields']['frontendedit'] = [
    'inputType' => 'checkbox',
    'sql' => ['type' => 'string', 'notnull' => true, 'default' => '', 'length' => 1, 'fixed' => true]
];

\Contao\CoreBundle\DataContainer\PaletteManipulator::create()
    ->addField('frontendedit', 'admin_legend', \Contao\CoreBundle\DataContainer\PaletteManipulator::POSITION_APPEND)
    ->applyToPalette('admin', 'tl_user');