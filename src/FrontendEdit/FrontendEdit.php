<?php

namespace Addictic\ContaoFrontendEditBundle\FrontendEdit;

use Contao\BackendTemplate;
use Contao\Controller;

class FrontendEdit
{

    public static function addContentavigationItemTable($beModKey, $strClass=null)
    {
        $GLOBALS['FRONTENDEDIT_CONTENT_NAVIGATION_ITEMS'][$beModKey] = new ContentNavigationItemTable($beModKey, $strClass);
    }

    public static function addContentNavigationItem(string $key, string $strTemplate=null, string $strClass=null)
    {
        $GLOBALS['FRONTENDEDIT_CONTENT_NAVIGATION_ITEMS'][$key] = new ContentNavigationItem($key, $strTemplate, $strClass);
    }

    public static function getContentNavigationItems()
    {
        return $GLOBALS['FRONTENDEDIT_CONTENT_NAVIGATION_ITEMS'];
    }
}