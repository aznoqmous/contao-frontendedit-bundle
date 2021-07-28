<?php

namespace Addictic\ContaoFrontendEditBundle\Utils;

use Contao\Config;
use Contao\Environment;
use Contao\Input;
use Contao\PageModel;
use Contao\System;

class PageUtils {

    public static function getPageFromUrl($strRequest)
    {
        $currentRoot = PageModel::findByDns(Environment::get('httpHost'));
        if(!$currentRoot) $currentRoot = PageModel::findByPid(0);
        PageModel::findByAlias($trailingPath);
        return $currentRoot;
    }
}
