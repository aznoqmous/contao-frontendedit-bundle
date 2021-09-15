<?php

use Addictic\ContaoFrontendEditBundle\Utils\FrontendEditUtils;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\Response;

if (TL_MODE == 'FE' && FrontendEditUtils::isFrontendEditActiveForCurrentUser()) {
    $GLOBALS['TL_JAVASCRIPT']['addicticcontaofrontendedit'] = "bundles/addicticcontaofrontendedit/frontend.min.js|static";
    $GLOBALS['TL_CSS']['addicticcontaofrontendedit'] = "bundles/addicticcontaofrontendedit/frontend.min.css|static";
}

