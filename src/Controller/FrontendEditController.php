<?php

namespace Addictic\ContaoFrontendEditBundle\Controller;

use Addictic\ContaoFrontendEditBundle\Forms\ContentElementForm;
use Contao\ArticleModel;
use Contao\BackendUser;
use Contao\ContentElement;
use Contao\ContentHeadline;
use Contao\ContentModel;
use Contao\ContentText;
use Contao\Controller;
use Contao\CoreBundle\Controller\AbstractController;
use Contao\Database;
use Contao\DC_Table;
use Contao\FrontendTemplate;
use Contao\Model;
use Contao\ModuleArticle;
use Contao\ModuleModel;
use Contao\PageModel;
use Contao\PageTree;
use Contao\RequestToken;
use Contao\System;
use Spatie\SchemaOrg\Article;
use Symfony\Cmf\Component\Routing\DynamicRouter;
use Symfony\Cmf\Component\Routing\Tests\Routing\RequestMatcher;
use Symfony\Component\Config\Loader\LoaderResolver;
use Symfony\Component\DependencyInjection\Container;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Routing\RouteCollection;
use Symfony\Component\Routing\Router;

/**
 * Class RelationController
 * @Route("/api/frontendedit", defaults={"_scope" = "frontend", "_token_check" = false}, name="api_frontendedit_")
 * @package Addictic\ContaoFrontendEditBundle\Controller
 */
class FrontendEditController extends AbstractController
{
    /**
     * @Route("/render/content_element/{id}", name="render_content_element")
     */
    function renderContentElement($id){
        $request = Request::createFromGlobals();
        $params = $request->request->all();

        $contentElement = ContentModel::findById($id);
        if(!$contentElement->tstamp) $contentElement->tstamp = time();
        foreach($contentElement->row() as $key => $value){
            if(array_key_exists($key, $params)) $contentElement->{$key} = $params[$key];
        }
        $strClass = ContentElement::findClass($contentElement->type);
        $objClass = new $strClass($contentElement, "main");
        return $this->json($objClass->generate());
    }

    /**
     * @Route("/render/article/{id}", name="render_article")
     */
    function renderArticle($id){
        $request = Request::createFromGlobals();
        $params = $request->request->all();

        $article = ArticleModel::findById($id);
        if(!$article->tstamp) $article->tstamp = time();
        foreach($article->row() as $key => $value){
            if(array_key_exists($key, $params)) $article->{$key} = $params[$key];
        }
        $article->frontendeditUpdate = true;
        $module = new ModuleArticle(new ModuleModel($article->row()), "main");
        return $this->json($module->generate());
    }

    /**
     * @Route("/token", name="token")
     */
    function getToken(){
        $this->initializeContaoFramework();
        $user = BackendUser::getInstance();
        if(!$user->id) return $this->json(false); // no backend user connected
        $container = System::getContainer();
        $rt = $container
            ->get('contao.csrf.token_manager')
            ->getToken($container->getParameter('contao.csrf_token_name'))
            ->getValue();
        return $this->json($rt);
    }

}
