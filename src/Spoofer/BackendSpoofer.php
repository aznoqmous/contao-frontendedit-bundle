<?php

namespace  Addictic\ContaoFrontendEditBundle\Spoofer;

use Symfony\Component\HttpClient\HttpClient;

class BackendSpoofer {
    public static function getBackendScripts(){
        $url = $_SERVER['https'] ? 'https://' : 'http://';
        $url .= $_SERVER['SERVER_NAME'];
        $url .= "/contao";

        $client = HttpClient::create();
        $response = $client->request("GET", $url);
        $html = $response->getContent();
        preg_match_all("/\<script src=[\"\'](.*?)[\"\']\>/", $html, $matches);
    }
}