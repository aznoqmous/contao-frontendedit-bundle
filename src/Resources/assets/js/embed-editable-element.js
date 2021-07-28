import FrontendEdit from "./frontend-edit";
import Types from "./types.json"
import EditableElement from "./editable-element";

export default class EmbedEditableElement extends EditableElement {

    constructor(element) {
        super(element)
        this.isParent = this.getIsParent()
    }

    getIsParent(){
        return Types.some(type => this.element.querySelector(`[class*="${type.prefix}"`))
    }

    getChildren(){
        let children = []
        Types.map(type => {
            let newFounds = [...this.element.querySelectorAll(`[class*="${type.prefix}"`)]
            if(newFounds) children = children.concat(newFounds)
        })
        return children
    }

    save() {
        let data = new FormData(this.getSettingsForm())
        fetch(this.getContentPopupUrl(), {
            method: 'POST',
            body: data
        })
            .then(res => {
                this.updateSettingsPane(data)
            })
        this.updateElement(data, true)
    }

    bindElement() {
        this.element.addEventListener('click', (e) => {
            if (!this.isEventTarget(e)) return null;
            FrontendEdit.getAllElements().map(el => el.classList.remove('active'))
            this.element.classList.add('active')
            this.openSettingsPane(this)
        })
        this.element.addEventListener('mousemove', (e) => {
            if (!this.isEventTarget(e)) return null
            FrontendEdit.getAllElements().map(el => el.classList.remove('hover'))
            this.element.classList.add('hover')
            if(!this.settingsPane) this.createSettingsPane()
        })
        this.element.addEventListener('mouseleave', (e) => {
            this.element.classList.remove('hover')
        })
        let links = [...this.element.querySelectorAll('a[href]')]
        links.map(l => {
            l.addEventListener('click', (e) => {
                e.preventDefault()
                window.location.href = l.href
            })
        })
    }

    fetchContentElementHtml(formData) {
        return fetch(`/api/frontendedit/render/${this.id}`, {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
    }

    updateElement(data, saved=false) {
        return this.fetchContentElementHtml(data)
            .then(res => {
                this.updateContent(res, saved)
                this.bindElement()
                this.element.classList.remove('unsaved')
            })
    }

    updateContent(html, saved = false) {
        let div = document.createElement('div')
        div.innerHTML = html
        let updatedElement = div.querySelector('*')
        if (!saved) updatedElement.classList.add('unsaved')
        if(this.element.classList.contains('active')) updatedElement.classList.add('active')
        updatedElement.classList.add('editable')
        if(this.isParent) this.getChildren().map(child => updatedElement.appendChild(child))
        this.element.parentElement.insertBefore(updatedElement, this.element)
        this.element.remove()
        this.element = updatedElement
        return updatedElement
    }

    getContentPopupUrl() {
        if (this.type.name === 'content_element') return `/contao?do=article&table=tl_content&id=${this.id}&popup=1&act=edit&rt=${FrontendEdit.rt}`
        if (this.type.name === 'module') return `/contao?do=themes&table=tl_module&act=edit&id=${this.id}&popup=1&nb=1&rt=${FrontendEdit.rt}`
        return null
    }

    bindSettingsPane() {
        super.bindSettingsPane();
        this.bindIframe(this.settingsPane)
    }

    bindIframe(iframe) {
        let forms = [...iframe.contentDocument.querySelectorAll('form')]
        forms.map(form => {
            if(form._frontendeditBound) return null
            this.updateElement(new FormData(this.getSettingsForm()), false)
            let fields = [...form.querySelectorAll('input,select,textarea,checkbox,radio')]
            fields.map(f => f.addEventListener('change', () => {
                let data = new FormData(this.getSettingsForm())
                this.updateElement(data, false)
                this.bindSettingsPane()
            }))
            form._frontendeditBound = true
        })
    }

    isEventTarget(e){
        if(!this.isParent) return true
        let children = this.getChildren()
        let currentElement = e.target
        while(currentElement !== this.element){
            if(children.includes(currentElement)) return false
            currentElement = currentElement.parentElement
        }
        return true
    }

}
