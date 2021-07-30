<?php

namespace Addictic\ContaoFrontendEditBundle\EventListener;

use Contao\CoreBundle\ServiceAnnotation\Hook;
use Contao\Template;

/**
 * @Hook("parseTemplate")
 */
class ParseTemplateListener
{
    public function __invoke($template): void
    {
        if($template->hookModified) return;
        if(
            $template->typePrefix == 'ce_'
            && $template->type
        ) {

            $template->class .= " editable ce_{$template->id}";
            $template->hookModified = true;
        }
//        if($template->typePrefix == 'mod_') {
//            $template->class .= " editable mod_{$template->id}";
//            $template->hookModified = true;
//        }
    }
}
