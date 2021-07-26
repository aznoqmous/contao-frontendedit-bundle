<?php

namespace Addictic\ContaoFrontendEditBundle\Controller;

use Contao\BackendUser;
use Contao\ContentElement;
use Contao\ContentModel;
use Contao\Controller;
use Contao\CoreBundle\Controller\AbstractController;
use Contao\Database;
use Contao\FrontendTemplate;
use Contao\RequestToken;
use Contao\System;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Class RelationController
 * @Route("/api/frontendedit", defaults={"_scope" = "frontend", "_token_check" = false}, name="api_frontendedit_")
 * @package Addictic\ContaoRelationWizardBundle\Controller
 */
class FrontendEditController extends AbstractController
{
    /**
     * @Route("/render/{id}", name="render")
     */
    function renderContentElement($id){
        $request = Request::createFromGlobals();
        $params = $request->request->all();
        $contentElement = ContentModel::findById($id);
        foreach($contentElement->row() as $key => $value){
            if(array_key_exists($key, $params)) $contentElement->{$key} = $params[$key];
        }
        $strClass = ContentElement::findClass($contentElement->type);
        $objClass = new $strClass($contentElement, "main");
        return $this->json($objClass->generate());
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
