<?php

if(TL_MODE == 'FE' && (BackendUser::getInstance())->id ){
    $GLOBALS['TL_JAVASCRIPT']['addicticcontaofrontendedit'] = "bundles/addicticcontaofrontendedit/frontend.min.js|static";
    $GLOBALS['TL_CSS']['addicticcontaofrontendedit'] = "bundles/addicticcontaofrontendedit/frontend.min.css|static";
}

if(TL_MODE == 'BE'){
    $GLOBALS['TL_JAVASCRIPT']['addicticcontaofrontendedit_be'] = "bundles/addicticcontaofrontendedit/backend.min.js|static";
}
