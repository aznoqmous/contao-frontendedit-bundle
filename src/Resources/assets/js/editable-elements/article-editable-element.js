import EmbedEditableElement from "./embed-editable-element";
import FrontendEdit from "../frontend-edit";
import ElementManager from "../element-manager";

export default class ArticleEditableElement extends EmbedEditableElement {
    constructor(element, newContent = false) {
        super(element, newContent = false);
        this.bindInsertElementButton()
    }

    onSettingsPaneSubmit() {
        this.updateElement(null, true)
            .then(() => {
                this.newContent = false
                this.refreshSiblingElementsHtml()
                this.bindInsertElementButton()
            })
        super.onSettingsPaneSubmit()
    }

    bindInsertElementButton() {
        let button = this.element.querySelector('.frontendedit-insert-element-button')
        button.addEventListener('click', () => {
            let contentElement = document.createElement('div')
            contentElement.className = 'editable'
            let editableChildren = this.element.querySelector('.editable')
            if (editableChildren) this.element.insertBefore(contentElement, editableChildren)
            else this.element.appendChild(contentElement)
            return fetch(`/contao?do=article&table=tl_content&act=create&mode=2&pid=${this.id}&rt=${FrontendEdit.rt}`)
                .then((res) => {
                    let url = new URL(res.url)
                    let id = url.searchParams.get('id')
                    contentElement.classList.add(`ce_${id}`)
                    let newEditableElement = new EmbedEditableElement(contentElement, true)
                    ElementManager.elements.push(newEditableElement)
                    ElementManager.elements.map(e => e.setUnactive())
                    newEditableElement.setActive()
                    newEditableElement.setUnsaved()
                    newEditableElement.updateFirstLastElementClasses()
                    newEditableElement.refreshFloatingSettings()
                })
        })
    }
}
