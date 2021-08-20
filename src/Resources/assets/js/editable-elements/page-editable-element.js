import FrontendEdit from "../frontend-edit";
import EditableElement from "./editable-element";

export default class PageEditableElement extends EditableElement {

    constructor(element) {
        super(element)
        this.alias = null
        this.title = element.querySelector('.page-title').innerHTML
    }

    getContentPopupUrl(){
        return `/contao?do=page&popup=1&act=edit&id=${this.id}&rt=${FrontendEdit.rt}`
    }

    onSettingsPaneSubmit(){
        let data = new FormData(this.getSettingsForm())
        this.alias = data.get('alias')
        this.title = data.get('title')
        FrontendEdit.setIframeUrl(this.alias)
        this.updateElement()
        this.preventSettingsPaneUpdate = true
    }

    updateSettingsPane() {
        if(this.preventSettingsPaneUpdate) return this.preventSettingsPaneUpdate = false
        super.updateSettingsPane();
    }

    updateElement(opts={}){
        for(let key in opts) this[key] = opts[key]
        this.element.querySelector('.page-title').innerHTML = this.title
        document.title = this.title
    }
}
