<?php

namespace Addictic\ContaoFrontendEditBundle\FrontendEdit;

use Contao\Controller;
use Contao\FrontendTemplate;

class ContentNavigationItem {

    public $key;
    public $strTemplate = "frontend_edit_content_navigation_item_content";
    public $strClass = null;

    public $title = null;

    public function __construct($key, $strTemplate=null, $strClass=null)
    {
        $this->key = $key;
        if($strTemplate) $this->strTemplate = $strTemplate;
        if($strClass) $this->strClass = $strClass;

        $this->listItemTemplate = new FrontendTemplate("frontend_edit_content_navigation_list_item");
        $this->itemContentTemplate = new FrontendTemplate($this->strTemplate);

        Controller::loadLanguageFile('modules');
        $this->title = $GLOBALS["TL_LANG"]['MOD'][$key][0];
    }

    public function renderListItem(){
        $this->listItemTemplate->setData((array) $this);
        return $this->listItemTemplate->parse();
    }

    public function renderContent(){
        $this->itemContentTemplate->setData((array) $this);
        return $this->itemContentTemplate->parse();
    }
}