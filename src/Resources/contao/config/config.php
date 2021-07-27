<?php

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\Response;

if(TL_MODE == 'FE' && (BackendUser::getInstance())->id ){
    $GLOBALS['TL_JAVASCRIPT']['addicticcontaofrontendedit'] = "bundles/addicticcontaofrontendedit/frontend.min.js|static";
    $GLOBALS['TL_CSS']['addicticcontaofrontendedit'] = "bundles/addicticcontaofrontendedit/frontend.min.css|static";
//    if(!$_GET['frontendedit']){
//        \Addictic\ContaoFrontendEditBundle\Spoofer\BackendSpoofer::getBackendScripts();
//    }
}
