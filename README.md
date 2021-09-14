# contao-frontend-edit-bundle

## How to
Connect to your Contao administration page via ``/contao``  
Allow your user to use frontend edition inside Contao ``Users`` settings  
Come back to the frontend view of your website, you're good to go !

## Compatible elements
- Contao\Articles
- Contao\ContentElements

To make a custom element from the list above compatible with frontend edition, you must at least include
``class="<?= $this->class ?>"`` and ``<?= $this->cssID ?>`` inside your element template.

## How does it works ?
Under the hood, FrontendEdit uses ``parseFrontendTemplate`` hook to tag every element with useful information such as its `type` and `id`.  
Those elements are then bound via javascript to their respective Contao edition page