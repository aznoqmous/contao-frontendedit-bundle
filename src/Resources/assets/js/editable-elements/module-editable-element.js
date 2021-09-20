import EmbedEditableElement from "./embed-editable-element";

export default class ModuleEditableElement extends EmbedEditableElement {
    constructor(element, newContent=false) {
        super(element, newContent=false);
    }
    updateElement(data, saved = false) {
        return super.updateElement(data, saved)
            .then(()=>{
                this.element.setAttribute('data-name', data.get('name'))
                this.refreshFloatingSettings()
            });
    }
}
