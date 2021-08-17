<?php

namespace Addictic\ContaoFrontendEditBundle\EventListener;

use Addictic\ContaoFrontendEditBundle\Utils\FrontendEditUtils;
use Contao\BackendUser;
use Contao\CoreBundle\ServiceAnnotation\Hook;
use Contao\FrontendTemplate;

/**
 * @Hook("modifyFrontendPage")
 */
class ModifyFrontendPageListener
{
    public function __invoke(string $buffer, string $template): string
    {
        $beUser = BackendUser::getInstance();
        if(!FrontendEditUtils::isFrontendEditActiveForCurrentUser()) return $buffer;

        if(isset($_GET['frontendedit']) && $template === 'fe_page'){
            global $objPage;
            $tpl = new FrontendTemplate("frontend_edit_page_info");
            $tpl->infos = json_encode([
                "id" => $objPage->id,
                "title" => $objPage->title
            ]);
            $buffer = preg_replace("/<\/title\>/s", "</title>" . $tpl->parse(), $buffer);
            return $buffer;
        }

        if ($template === 'fe_page') {
            global $objPage;
            $tpl = new FrontendTemplate("frontend_edit");
            $tpl->page = $objPage;
            $tpl->user = $beUser;
            $buffer = preg_replace("/\<body.*?\<\/body\>/s", $tpl->parse(), $buffer);
        }

        return $buffer;
    }
}
