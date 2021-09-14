<?php

namespace Addictic\ContaoFrontendEditBundle\EventListener;

use Addictic\ContaoFrontendEditBundle\Utils\FrontendEditUtils;
use Contao\Controller;
use Contao\CoreBundle\ServiceAnnotation\Hook;
use Contao\FrontendTemplate;
use Contao\Module;
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
            $this->handleContentElement($template);
        }

        if($template->type == 'article' && !$template->hookModified){
            $this->handleArticle($template);
        }
        if($template->typePrefix == 'mod_' && !$template->hookModified){
            $this->handleModule($template);
        }

        $template->hookModified = true;
    }

    public function handleContentElement($template){
        Controller::loadLanguageFile('default');
        $template->class .= " editable ce_{$template->id}";
        $template->cssID .= "data-name=\"{$GLOBALS['TL_LANG']['CTE'][$template->type][0]}\"";
    }
    public function handleArticle($template){
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

    public function handleModule($template){
        $template->class .= " editable mod_{$template->id}";
        $template->cssID .= "data-name=\"$template->name\"";
    }
}
