import FrontendEdit from "./frontend-edit";
import EditableElement from "./editable-element";

export default class EmbedEditableElement extends EditableElement {

    constructor(element) {
        super(element)
        this.isParent = this.getIsParent()

        this.updateController = new AbortController()
        this.timeout = 100
        this.lastT = Date.now()
    }

    getIsParent(){
        return (this.getChildren().length)
    }

    getChildren(){
        return  [...this.element.querySelectorAll(".editable")]
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
        if(Date.now() - this.lastT < this.timeout) {
            this.updateController.abort()
            this.updateController = new AbortController()
        }
        this.lastT = Date.now()
        return fetch(`/api/frontendedit/render/${this.id}`, {
            method: 'POST',
            body: formData,
            signal: this.updateController.signal
        })
            .then(res => res.json())
            .catch(e => {/* no abort exception */})
    }


    onSettingsPaneSubmit() {
        this.updateElement(null, true)
        super.onSettingsPaneSubmit()
    }
    onSettingsPaneReload() {
        this.updateElement(new FormData(this.getSettingsForm()), false)
    }

    updateElement(data, saved=false) {
        return this.fetchContentElementHtml(data)
            .then(res => {
                this.updateContent(res, saved)
                this.bindElement()
            })
    }

    updateContent(html, saved = false) {
        let div = document.createElement('div')
        div.innerHTML = html
        let updatedElement = div.querySelector('*')
        if(!updatedElement) return false
        if(this.element.classList.contains('active')) updatedElement.classList.add('active')
        updatedElement.classList.add('editable')
        if(this.isParent) this.getChildren().map(child => updatedElement.appendChild(child))
        this.element.parentElement.insertBefore(updatedElement, this.element)
        this.element.remove()
        this.element = updatedElement
        if (!saved) this.setUnsaved()
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
            let fields = [...form.querySelectorAll('input,select,textarea,checkbox,radio')]

            fields.map(f => f.addEventListener('change', () => {
                this.updateElement(new FormData(this.getSettingsForm()))
            }))
            fields.map(f => f.addEventListener('keyup', () => {
                this.updateElement(new FormData(this.getSettingsForm()))
            }))

            this.bindTinyMCE(iframe)
            form._frontendeditBound = true
        })
    }

    bindTinyMCE(iframe){
        if(!iframe.contentWindow.tinymce) return null
        Object.keys(iframe.contentWindow.tinymce.editors).map(k => {
            if(!k) return null;
            let editor = iframe.contentWindow.tinymce.editors[k]
            if(editor._frontendeditBound) return null
            editor._frontendeditBound = true
            let textarea = editor.targetElm
            let tinyIframe = editor.editorContainer.querySelector('iframe');
            setTimeout(()=>{
                (new MutationObserver((mutations)=>{
                    textarea.value = tinyIframe.contentDocument.body.innerHTML
                    this.updateElement(new FormData(this.getSettingsForm()))
                })).observe(tinyIframe.contentDocument.body, {childList: true, subtree: true, characterData: true})
            }, 1000)
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
