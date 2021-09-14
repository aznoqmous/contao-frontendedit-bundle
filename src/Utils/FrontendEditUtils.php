<?php

namespace Addictic\ContaoFrontendEditBundle\Utils;

class FrontendEditUtils
{
    static function isFrontendEditActiveForCurrentUser()
    {
        return ((\BackendUser::getInstance())->frontendedit);
    }

    static function addBackendModuleToFrontend($key, $parent = null, $customRoute = null)
    {
        if (!$GLOBALS['FRONTENDEDIT_MODULES']) $GLOBALS['FRONTENDEDIT_MODULES'] = [];
        $module = (object)["key" => $key, "route" => $customRoute ? $customRoute : "/contao?do=$key"];
        if ($parent) {
            if (!$GLOBALS['FRONTENDEDIT_MODULES'][$parent]) $GLOBALS['FRONTENDEDIT_MODULES'][$parent] = [];
            $GLOBALS['FRONTENDEDIT_MODULES'][$parent][] = $module;
        } else $GLOBALS['FRONTENDEDIT_MODULES'][] = $module;
    }

    static function getBackendModules()
    {
        return $GLOBALS['FRONTENDEDIT_MODULES'];
    }
}