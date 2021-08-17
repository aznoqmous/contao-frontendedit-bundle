<?php

namespace Addictic\ContaoFrontendEditBundle\Utils;

class FrontendEditUtils {
    static function isFrontendEditActiveForCurrentUser(){
        return ((\BackendUser::getInstance())->frontendedit);
    }
}