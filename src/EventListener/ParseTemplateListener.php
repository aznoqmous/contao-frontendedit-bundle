<?php

namespace Addictic\ContaoFrontendEditBundle\EventListener;

use Addictic\ContaoFrontendEditBundle\Utils\FrontendEditUtils;
use Contao\CoreBundle\ServiceAnnotation\Hook;
use Contao\FrontendTemplate;
use Contao\Template;

/**
 * @Hook("parseTemplate")
 */
class ParseTemplateListener
{
    public function __invoke($template): void
    {
        if(!FrontendEditUtils::isFrontendEditActiveForCurrentUser() || $template->hookModified) return;
        if(
            $template->typePrefix == 'ce_'
            && $template->type
        ) {

            $template->class .= " editable ce_{$template->id}";
            $template->hookModified = true;
        }
        if($template->type == 'article'){
            $template->class .= " editable article_{$template->id}";
            $template->cssId .= "data-name=\"$template->title\"";
            $template->hookModified = true;
            $articleSettings = new FrontendTemplate("frontend_edit_article_settings");
            $insertContentElement = new FrontendTemplate("frontend_edit_insert_content_element");
            foreach(["title", "id"] as $key) {
                $articleSettings->{$key} = $template->{$key};
            }
            if($template->frontendeditUpdate) $template->elements = [];
            $template->elements = array_merge(
                [$articleSettings->parse(), $insertContentElement->parse()],
                $template->elements
            );
        }
    }
}
