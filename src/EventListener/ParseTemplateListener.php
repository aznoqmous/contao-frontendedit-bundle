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
        if($template->typePrefix == 'ce_' && !$template->hookModified) {
            $template->class .= " editable ce_{$template->id}";
            $template->hookModified = true;
        }
    }
}
