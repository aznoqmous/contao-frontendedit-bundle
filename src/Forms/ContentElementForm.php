<?php
namespace Addictic\ContaoFrontendEditBundle\Forms;

use Contao\Backend;
use Contao\BackendTemplate;
use Contao\Config;
use Contao\Controller;
use Contao\CoreBundle\Exception\InternalServerErrorException;
use Contao\CoreBundle\Exception\ResponseException;
use Contao\Environment;
use Contao\Image;
use Contao\Input;
use Contao\Message;
use Contao\StringUtil;
use Contao\System;
use Contao\Template;
use Contao\Versions;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

class ContentElementForm extends \Contao\DC_Table
{
    static $strPTable = 'tl_article';
    protected $strTable = 'tl_content';

    public function __construct($contentElement)
    {
        $this->objRow = $contentElement;

        foreach($GLOBALS['TL_DCA'][$this->strTable]['fields'] as &$field){
            $field['exclude'] = false;
        }

        parent::__construct('tl_content', [
            [ 'tl_article', 'tl_content' ]
        ]);
    }

    public function getObjRow(){
        return $this->objRow;
    }

    public function edit($intId=null, $ajaxId=null)
    {
        // Get the current record
        $objRow = $this->getObjRow();
        $this->intId = $objRow->id;

        $this->objActiveRecord = $objRow;

        $return = '';
        $this->values[] = $this->intId;
        $this->procedure[] = 'id=?';

        $this->blnCreateNewVersion = false;

        // Build an array from boxes and rows
        $this->strPalette = $this->getPalette();

        $boxes = StringUtil::trimsplit(';', $this->strPalette);
        $legends = array();
        if (!empty($boxes))
        {
            foreach ($boxes as $k=>$v)
            {
                $eCount = 1;
                $boxes[$k] = StringUtil::trimsplit(',', $v);
                foreach ($boxes[$k] as $kk=>$vv)
                {
                    if (preg_match('/^\[.*]$/', $vv))
                    {
                        ++$eCount;
                        continue;
                    }

                    if (preg_match('/^{.*}$/', $vv))
                    {
                        $legends[$k] = substr($vv, 1, -1);
                        unset($boxes[$k][$kk]);
                    }
                    elseif (!\is_array($GLOBALS['TL_DCA'][$this->strTable]['fields'][$vv]) || $GLOBALS['TL_DCA'][$this->strTable]['fields'][$vv]['exclude'])
                    {
                        unset($boxes[$k][$kk]);
                    }
                }

                // Unset a box if it does not contain any fields
                if (\count($boxes[$k]) < $eCount)
                {
                    unset($boxes[$k]);
                }
            }

            /** @var Session $objSessionBag */
            $objSessionBag = System::getContainer()->get('session')->getBag('contao_backend');

            $class = 'tl_tbox';
            $fs = $objSessionBag->get('fieldset_states');
            // Render boxes
            foreach ($boxes as $k=>$v)
            {
                $arrAjax = array();
                $blnAjax = false;
                $key = '';
                $cls = '';
                $legend = '';

                if (isset($legends[$k]))
                {
                    list($key, $cls) = explode(':', $legends[$k]);
                    $legend = "\n" . '<legend onclick="AjaxRequest.toggleFieldset(this,\'' . $key . '\',\'' . $this->strTable . '\')">' . ($GLOBALS['TL_LANG'][$this->strTable][$key] ?? $key) . '</legend>';
                }

                if (isset($fs[$this->strTable][$key]))
                {
                    $class .= ($fs[$this->strTable][$key] ? '' : ' collapsed');
                }
                else
                {
                    $class .= (($cls && $legend) ? ' ' . $cls : '');
                }

                $return .= "\n\n" . '<fieldset' . ($key ? ' id="pal_' . $key . '"' : '') . ' class="' . $class . ($legend ? '' : ' nolegend') . '">' . $legend;
                $thisId = '';

                // Build rows of the current box
                foreach ($v as $vv)
                {
                    if ($vv == '[EOF]')
                    {
                        if ($blnAjax && Environment::get('isAjaxRequest'))
                        {
                            if ($ajaxId == $thisId)
                            {
                                return $arrAjax[$thisId] . '<input type="hidden" name="FORM_FIELDS[]" value="' . StringUtil::specialchars($this->strPalette) . '">';
                            }

                            if (\count($arrAjax) > 1)
                            {
                                $current = "\n" . '<div id="' . $thisId . '" class="subpal cf">' . $arrAjax[$thisId] . '</div>';
                                unset($arrAjax[$thisId]);
                                end($arrAjax);
                                $thisId = key($arrAjax);
                                $arrAjax[$thisId] .= $current;
                            }
                        }

                        $return .= "\n" . '</div>';

                        continue;
                    }

                    if (preg_match('/^\[.*]$/', $vv))
                    {
                        $thisId = 'sub_' . substr($vv, 1, -1);
                        $arrAjax[$thisId] = '';
                        $blnAjax = ($ajaxId == $thisId && Environment::get('isAjaxRequest')) ? true : $blnAjax;
                        $return .= "\n" . '<div id="' . $thisId . '" class="subpal cf">';

                        continue;
                    }

                    $this->strField = $vv;
                    $this->strInputName = $vv;
                    $this->varValue = $objRow->$vv;

                    // Convert CSV fields (see #2890)
                    if ($GLOBALS['TL_DCA'][$this->strTable]['fields'][$this->strField]['eval']['multiple'] && isset($GLOBALS['TL_DCA'][$this->strTable]['fields'][$this->strField]['eval']['csv']))
                    {
                        $this->varValue = StringUtil::trimsplit($GLOBALS['TL_DCA'][$this->strTable]['fields'][$this->strField]['eval']['csv'], $this->varValue);
                    }

                    // Call load_callback
                    if (\is_array($GLOBALS['TL_DCA'][$this->strTable]['fields'][$this->strField]['load_callback']))
                    {
                        foreach ($GLOBALS['TL_DCA'][$this->strTable]['fields'][$this->strField]['load_callback'] as $callback)
                        {
                            if (\is_array($callback))
                            {
                                $this->import($callback[0]);
                                $this->varValue = $this->{$callback[0]}->{$callback[1]}($this->varValue, $this);
                            }
                            elseif (\is_callable($callback))
                            {
                                $this->varValue = $callback($this->varValue, $this);
                            }
                        }
                    }

                    // Re-set the current value
                    $this->objActiveRecord->{$this->strField} = $this->varValue;

                    // Build the row and pass the current palette string (thanks to Tristan Lins)
                    $blnAjax ? $arrAjax[$thisId] .= $this->row($this->strPalette) : $return .= $this->row($this->strPalette);
                }

                $class = 'tl_box';
                $return .= "\n" . '</fieldset>';
            }
        }

        // Versions overview
        $version = '';

        // Submit buttons
        $arrButtons = array();
        $arrButtons['save'] = '<button type="submit" name="save" id="save" class="tl_submit" accesskey="s">' . $GLOBALS['TL_LANG']['MSC']['save'] . '</button>';

        if (!Input::get('nb'))
        {
            $arrButtons['saveNclose'] = '<button type="submit" name="saveNclose" id="saveNclose" class="tl_submit" accesskey="c">' . $GLOBALS['TL_LANG']['MSC']['saveNclose'] . '</button>';

            if (!Input::get('nc'))
            {
                if (!$GLOBALS['TL_DCA'][$this->strTable]['config']['closed'] && !$GLOBALS['TL_DCA'][$this->strTable]['config']['notCreatable'])
                {
                    $arrButtons['saveNcreate'] = '<button type="submit" name="saveNcreate" id="saveNcreate" class="tl_submit" accesskey="n">' . $GLOBALS['TL_LANG']['MSC']['saveNcreate'] . '</button>';

                    if (!$GLOBALS['TL_DCA'][$this->strTable]['config']['notCopyable'])
                    {
                        $arrButtons['saveNduplicate'] = '<button type="submit" name="saveNduplicate" id="saveNduplicate" class="tl_submit" accesskey="d">' . $GLOBALS['TL_LANG']['MSC']['saveNduplicate'] . '</button>';
                    }
                }

                if ($GLOBALS['TL_DCA'][$this->strTable]['config']['switchToEdit'])
                {
                    $arrButtons['saveNedit'] = '<button type="submit" name="saveNedit" id="saveNedit" class="tl_submit" accesskey="e">' . $GLOBALS['TL_LANG']['MSC']['saveNedit'] . '</button>';
                }

                if ($this->ptable || $GLOBALS['TL_DCA'][$this->strTable]['config']['switchToEdit'] || $GLOBALS['TL_DCA'][$this->strTable]['list']['sorting']['mode'] == 4)
                {
                    $arrButtons['saveNback'] = '<button type="submit" name="saveNback" id="saveNback" class="tl_submit" accesskey="g">' . $GLOBALS['TL_LANG']['MSC']['saveNback'] . '</button>';
                }
            }
        }

        // Call the buttons_callback (see #4691)
        if (\is_array($GLOBALS['TL_DCA'][$this->strTable]['edit']['buttons_callback']))
        {
            foreach ($GLOBALS['TL_DCA'][$this->strTable]['edit']['buttons_callback'] as $callback)
            {
                if (\is_array($callback))
                {
                    $this->import($callback[0]);
                    $arrButtons = $this->{$callback[0]}->{$callback[1]}($arrButtons, $this);
                }
                elseif (\is_callable($callback))
                {
                    $arrButtons = $callback($arrButtons, $this);
                }
            }
        }

        if (\count($arrButtons) < 3)
        {
            $strButtons = implode(' ', $arrButtons);
        }
        else
        {
            $strButtons = array_shift($arrButtons) . ' ';
            $strButtons .= '<div class="split-button">';
            $strButtons .= array_shift($arrButtons) . '<button type="button" id="sbtog">' . Image::getHtml('navcol.svg') . '</button> <ul class="invisible">';

            foreach ($arrButtons as $strButton)
            {
                $strButtons .= '<li>' . $strButton . '</li>';
            }

            $strButtons .= '</ul></div>';
        }

        // Add the buttons and end the form
        $return .= '
</div>
<div class="tl_formbody_submit">
<div class="tl_submit_container">
  ' . $strButtons . '
</div>
</div>
</form>';

        $strVersionField = '';

        // Begin the form (-> DO NOT CHANGE THIS ORDER -> this way the onsubmit attribute of the form can be changed by a field)
        $return = $version . Message::generate() . ($this->noReload ? '
<p class="tl_error">' . $GLOBALS['TL_LANG']['ERR']['general'] . '</p>' : '') . '
<div id="tl_buttons">' . (Input::get('nb') ? '&nbsp;' : '
<a href="' . $this->getReferer(true) . '" class="header_back" title="' . StringUtil::specialchars($GLOBALS['TL_LANG']['MSC']['backBTTitle']) . '" accesskey="b" onclick="Backend.getScrollOffset()">' . $GLOBALS['TL_LANG']['MSC']['backBT'] . '</a>') . '
</div>
<form id="' . $this->strTable . '" class="tl_form tl_edit_form" method="post" enctype="' . ($this->blnUploadable ? 'multipart/form-data' : 'application/x-www-form-urlencoded') . '"' . (!empty($this->onsubmit) ? ' onsubmit="' . implode(' ', $this->onsubmit) . '"' : '') . '>
<div class="tl_formbody_edit">
<input type="hidden" name="FORM_SUBMIT" value="' . $this->strTable . '">
<input type="hidden" name="REQUEST_TOKEN" value="' . REQUEST_TOKEN . '">' . $strVersionField . '
<input type="hidden" name="FORM_FIELDS[]" value="' . StringUtil::specialchars($this->strPalette) . '">' . $return;

        // Reload the page to prevent _POST variables from being sent twice
        if (!$this->noReload && Input::post('FORM_SUBMIT') == $this->strTable)
        {
            $arrValues = $this->values;
            array_unshift($arrValues, time());

            // Trigger the onsubmit_callback
            if (\is_array($GLOBALS['TL_DCA'][$this->strTable]['config']['onsubmit_callback']))
            {
                foreach ($GLOBALS['TL_DCA'][$this->strTable]['config']['onsubmit_callback'] as $callback)
                {
                    if (\is_array($callback))
                    {
                        $this->import($callback[0]);
                        $this->{$callback[0]}->{$callback[1]}($this);
                    }
                    elseif (\is_callable($callback))
                    {
                        $callback($this);
                    }
                }
            }

            // Set the current timestamp before adding a new version
            if ($GLOBALS['TL_DCA'][$this->strTable]['config']['dynamicPtable'])
            {
                $this->Database->prepare("UPDATE " . $this->strTable . " SET ptable=?, tstamp=? WHERE id=?")
                    ->execute($this->ptable, time(), $this->intId);
            }
            else
            {
                $this->Database->prepare("UPDATE " . $this->strTable . " SET tstamp=? WHERE id=?")
                    ->execute(time(), $this->intId);
            }

            $this->invalidateCacheTags();
            //$this->reload();
        }

        // Set the focus if there is an error
        if ($this->noReload)
        {
            $return .= '
<script>
  window.addEvent(\'domready\', function() {
    Backend.vScrollTo(($(\'' . $this->strTable . '\').getElement(\'label.error\').getPosition().y - 20));
  });
</script>';
        }

        return $return;
    }
}