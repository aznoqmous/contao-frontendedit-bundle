<?php

namespace Addictic\ContaoFrontendEditBundle\EventListener;

use Addictic\ContaoFrontendEditBundle\Utils\FrontendEditUtils;
use Contao\Controller;
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
        if(!FrontendEditUtils::isFrontendEditActiveForCurrentUser()) return;
        if(
            $template->typePrefix == 'ce_' || preg_match("/^ce_/", $template->class)
            && $template->type
        ) {
            Controller::loadLanguageFile('default');
            $template->class .= " editable ce_{$template->id}";
            $template->cssID .= "data-name=\"{$GLOBALS['TL_LANG']['CTE'][$template->type][0]}\"";
        }
        if($template->type == 'article' && !$template->hookModified){
            $template->class .= " editable article_{$template->id}";
            $template->cssID .= "data-name=\"$template->title\"";
            $articleSettings = new FrontendTemplate("frontend_edit_article_settings");
            foreach(["title", "id"] as $key) {
                $articleSettings->{$key} = $template->{$key};
            }
            if($template->frontendeditUpdate) $template->elements = [];
            $template->elements = array_merge(
                [$articleSettings->parse()],
                $template->elements
            );
        }
        $template->hookModified = true;
    }
}
