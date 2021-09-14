<?php

use Addictic\ContaoFrontendEditBundle\Utils\FrontendEditUtils;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\Response;

if(TL_MODE == 'FE' && FrontendEditUtils::isFrontendEditActiveForCurrentUser() ){
    $GLOBALS['TL_JAVASCRIPT']['addicticcontaofrontendedit'] = "bundles/addicticcontaofrontendedit/frontend.min.js|static";
    $GLOBALS['TL_CSS']['addicticcontaofrontendedit'] = "bundles/addicticcontaofrontendedit/frontend.min.css|static";

    FrontendEditUtils::addBackendModuleToFrontend("form", "content");

    FrontendEditUtils::addBackendModuleToFrontend("themes", "design");
    FrontendEditUtils::addBackendModuleToFrontend("page", "design");

    FrontendEditUtils::addBackendModuleToFrontend("member", "accounts");
    FrontendEditUtils::addBackendModuleToFrontend("mgroup", "accounts");
    FrontendEditUtils::addBackendModuleToFrontend("user", "accounts");
    FrontendEditUtils::addBackendModuleToFrontend("group", "accounts");

    FrontendEditUtils::addBackendModuleToFrontend("files", "system");
    FrontendEditUtils::addBackendModuleToFrontend("settings", "system");
    FrontendEditUtils::addBackendModuleToFrontend("maintenance", "system");
    FrontendEditUtils::addBackendModuleToFrontend("log", "system");
}

