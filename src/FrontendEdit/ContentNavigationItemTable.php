<?php

namespace Addictic\ContaoFrontendEditBundle\FrontendEdit;

use Contao\FrontendTemplate;

class ContentNavigationItemTable extends ContentNavigationItem {
    public function __construct($key, $strClass=null)
    {
        parent::__construct($key, "frontend_edit_content_navigation_item_content_table", $strClass);
    }
}