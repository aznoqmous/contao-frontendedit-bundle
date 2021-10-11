<?php

use Addictic\ContaoFrontendEditBundle\Utils\FrontendEditUtils;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\Response;

if (TL_MODE == 'FE' && FrontendEditUtils::isFrontendEditActiveForCurrentUser()) {
    $GLOBALS['TL_JAVASCRIPT']['addicticcontaofrontendedit'] = "bundles/addicticcontaofrontendedit/frontend.min.js|static";
    $GLOBALS['TL_CSS']['addicticcontaofrontendedit'] = "bundles/addicticcontaofrontendedit/frontend.min.css|static";

    $GLOBALS['TL_LANG']['MOD']['elements'] = ['Eléments de contenu', ""];

    \Addictic\ContaoFrontendEditBundle\FrontendEdit\FrontendEdit::addContentNavigationItem("elements", "frontend_edit_content_navigation_elements", "icon-list");
    \Addictic\ContaoFrontendEditBundle\FrontendEdit\FrontendEdit::addContentavigationItemTable("page", "icon-tree");
    \Addictic\ContaoFrontendEditBundle\FrontendEdit\FrontendEdit::addContentavigationItemTable("files", "icon-folder");
    \Addictic\ContaoFrontendEditBundle\FrontendEdit\FrontendEdit::addContentavigationItemTable("settings", "icon-equalizer");
}

if(TL_MODE == "BE" && $_GET['contao-iframe-theme']){
    $GLOBALS['TL_CSS']['addicticcontaofrontendedit'] = "bundles/addicticcontaofrontendedit/contao-iframe-theme.min.css";
}

