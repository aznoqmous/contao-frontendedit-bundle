import EmbedEditableElement from "./embed-editable-element";
import Lang from "../lang";
import FrontendEdit from "../frontend-edit";

export default class ContentElementEditableElement extends EmbedEditableElement {
    constructor(element, newContent=false) {
        super(element, newContent=false);
    }

    moveElementDown() {
        let nextElement = this.getNextEditableElement()
        if(!nextElement) return false
        let nextElementNext = nextElement.getNextEditableElement()

        this.element.parentElement.insertBefore(nextElement.element, this.element)
        this.refreshFloatingSettings()
        this.updateFirstLastElementClasses()
        let previousElement = this.getPreviousEditableElement()
        if(previousElement) previousElement.updateFirstLastElementClasses()
        this.dispatchEvent('move')

        let data = new FormData()
        data.append('moveAfter', nextElement.id)
        data.append('moveAfterNext', nextElementNext ? nextElementNext.id : null)
        data.append('cascade', !(!nextElementNext && this.getParent().type == this.type))
        return fetch(`/api/frontendedit/movedown/content_element/${this.id}`, {
            method: "POST",
            body: data
        })

    }

    _moveElementDown(){
        let nextElement = this.getNextEditableElement()
        if(!nextElement) return false
        this.element.parentElement.insertBefore(nextElement.element, this.element)
        this.refreshFloatingSettings()
        this.updateFirstLastElementClasses()
        let previousElement = this.getPreviousEditableElement()
        if(previousElement) previousElement.updateFirstLastElementClasses()
        this.dispatchEvent('move')
        return fetch(`/contao?do=${this.type.do}&table=${this.type.table}&id=${this.id}&act=cut&mode=1&pid=${nextElement.id}&rt=${FrontendEdit.rt}`)
    }
}
