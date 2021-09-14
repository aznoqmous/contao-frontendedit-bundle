import EditableElement from "./editable-element";

export default class BackendElement extends EditableElement {
    getContentPopupUrl(){
        return "/contao"
    }
    getType(){
        return null
    }
    getId(){
        return null
    }
    buildSettingsPaneActions() {
        return null
    }
}
