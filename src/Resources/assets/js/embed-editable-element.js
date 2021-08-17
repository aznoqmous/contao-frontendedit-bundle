import FrontendEdit from "./frontend-edit";
import EditableElement from "./editable-element";
import RifleRequest from "./rifle-request";

export default class EmbedEditableElement extends EditableElement {

    constructor(element, newContent=false) {
        super(element)
        this.newContent = newContent
        if(this.newContent) this.element.classList.add('new')

        this.updateController = new AbortController()
        this.timeout = 100
        this.lastT = Date.now()
        this.active = false

        this.requester = new RifleRequest()

        this.buildFloatingSettings()
    }

    get isParent(){
        return this.type.name === 'article' || (this.getChildren().length)
    }

    getChildren(){
        return  [...this.element.querySelectorAll(".editable")]
    }

    bindElement() {
        this.element.addEventListener('click', (e) => {
            if (!this.isEventTarget(e)) return null;
            FrontendEdit.editables.map(el => {
                el.setUnactive()
            })
            this.setActive()
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
            l.title = `${l.title ? l.title + " ( " + l.href + " )" : l.href}`
            l.removeAttribute('href')
                l.addEventListener('click', (e)=>{
                    e.preventDefault()
                })
        })
    }

    fetchContentElementHtml(formData) {
        return this.requester.fetch(`/api/frontendedit/render/${this.type.name}/${this.id}`, {
            method: 'POST',
            body: formData,
            signal: this.updateController.signal
        })
            .then(res => res.json())
            .catch(e => {/* no abort exception */})
    }

    onSettingsPaneSubmit() {
        this.updateElement(null, true)
            .then(()=>{
                this.newContent = false
                this.refreshSiblingElementsHtml()
                if(this.type.name === 'article') {
                    FrontendEdit.bindInsertElementButton(this.element.querySelector('.frontendedit-insert-element-button'))
                }
            })
        super.onSettingsPaneSubmit()
    }
    onSettingsPaneReload() {
        this.updateElement(new FormData(this.getSettingsForm()), false)
    }

    updateElement(data, saved=false) {
        return this.fetchContentElementHtml(data)
            .then(res => {
                if(!res) return null
                this.updateContent(res, saved)
                this.bindElement()
                this.refreshElementHtml()
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
        if(this.newContent) this.element.classList.add('new')
        return updatedElement
    }

    getContentPopupUrl() {
        return `/contao?do=${this.type.do}&table=${this.type.table}&id=${this.id}&popup=1&act=edit&rt=${FrontendEdit.rt}`
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

    buildFloatingSettings(){
        let idocument = FrontendEdit.pageIframe.contentDocument
        this.floatingSettings = idocument.createElement('div')
        this.floatingSettings.classList.add('floating-settings')

        this.floatingSettings.deleteButton = document.createElement('button')
        this.floatingSettings.deleteButton.innerHTML = '✖'
        this.floatingSettings.deleteButton.onclick = ()=>{
            if(confirm(`Voulez-vous vraiment supprimer l'élément ID ${this.id} ?`)) this.deleteElement()
        }

        this.floatingSettings.moveUpButton = document.createElement('button')
        this.floatingSettings.moveUpButton.innerHTML = '⯅'
        this.floatingSettings.moveUpButton.addEventListener('click', ()=>{this.moveElementUp()})
        this.floatingSettings.moveDownButton = document.createElement('button')
        this.floatingSettings.moveDownButton.innerHTML = '⯆'
        this.floatingSettings.moveDownButton.addEventListener('click', ()=>{this.moveElementDown()})

        this.floatingSettings.insertAfterButton = document.createElement('button')
        this.floatingSettings.insertAfterButton.innerHTML = '✚'
        this.floatingSettings.insertAfterButton.addEventListener('click', ()=>{this.insertAfter()})

        this.floatingSettings.appendChild(this.floatingSettings.moveUpButton)
        this.floatingSettings.appendChild(this.floatingSettings.moveDownButton)
        this.floatingSettings.appendChild(this.floatingSettings.deleteButton)
        this.floatingSettings.appendChild(this.floatingSettings.insertAfterButton)

        idocument.body.appendChild(this.floatingSettings)
    }

    deleteElement(){
        fetch(`/contao?do=${this.type.do}&table=${this.type.table}&id=${this.id}&act=delete&rt=${FrontendEdit.rt}`)
        this.setUnactive()
        this.element.remove()
        this.settingsPane.remove()
        FrontendEdit.removeElement(this)
    }

    moveElementUp(){
        let previousElement = this.getPreviousEditableElement()
        if(!previousElement) return false
        previousElement.moveElementDown()
        this.refreshFloatingSettings()
        this.updateFirstLastElementClasses()
    }
    moveElementDown(){
        let nextElement = this.getNextEditableElement()
        if(!nextElement) return false
        this.element.parentElement.insertBefore(nextElement.element, this.element)
        this.refreshFloatingSettings()
        this.updateFirstLastElementClasses()
        let previousElement = this.getPreviousEditableElement()
        if(previousElement) previousElement.updateFirstLastElementClasses()
        return fetch(`/contao?do=${this.type.do}&table=${this.type.table}&id=${this.id}&act=cut&mode=1&pid=${nextElement.id}&rt=${FrontendEdit.rt}`)
    }

    insertAfter(){
        let contentElement = document.createElement('div')
        contentElement.className = 'editable'
        let nextElement = this.getNextElement()
        if(nextElement) this.element.parentElement.insertBefore(contentElement, nextElement)
        else this.element.parentElement.appendChild(contentElement)
        this.refreshFloatingSettings()
        this.updateFirstLastElementClasses()
        return fetch(`/contao?do=${this.type.do}&table=${this.type.table}&act=create&mode=1&pid=${this.id}&rt=${FrontendEdit.rt}`)
            .then((res)=>{
                let url = new URL(res.url)
                let id = url.searchParams.get('id')
                contentElement.classList.add(`${this.type.prefix}${id}`)
                let newEditableElement = new EmbedEditableElement(contentElement, true)
                FrontendEdit.editables.push(newEditableElement)
                FrontendEdit.editables.map(e => e.setUnactive())
                newEditableElement.setActive()
                newEditableElement.setUnsaved()
                newEditableElement.updateFirstLastElementClasses()
                newEditableElement.refreshFloatingSettings()
            })
    }

    getPreviousEditableElement(index=1){
        let sameTypeElements = this.getSameTypeElements()
        let previousElement = sameTypeElements ? sameTypeElements[sameTypeElements.indexOf(this.element) - index] : null
        return previousElement ? previousElement.editable : null
    }
    getNextEditableElement(index=1){
        let sameTypeElements = this.getSameTypeElements()
        let nextElement = sameTypeElements ? sameTypeElements[sameTypeElements.indexOf(this.element) + index] : null
        return nextElement ? nextElement.editable : null
    }
    getPreviousElement(){
        let children = [... this.element.parentElement.children]
        return children[children.indexOf(this.element)-1]
    }
    getNextElement(){
        let children = [... this.element.parentElement.children]
        return children[children.indexOf(this.element)+1]
    }

    getSameTypeElements(){
        let elements = FrontendEdit.getAllElements()
        return elements ? elements.filter(e =>
            (e.editable && !e.editable.newContent)
            && (e.editable && e.editable.type.name === this.type.name )
            && e.parentElement === this.element.parentElement
        ) : null
    }

    refreshFloatingSettings(){
        setTimeout(()=>{
            let box = this.element.getBoundingClientRect()
            let fbox = this.floatingSettings.getBoundingClientRect()
            let left = box.left - fbox.width
            left = left > 0 ? left : 0
            this.floatingSettings.style.left = left + 'px'
            this.floatingSettings.style.top = box.top + 'px'
        }, 10)
        if(this.newContent || !this.getPreviousEditableElement()) this.floatingSettings.moveUpButton.style.display = 'none'
        else this.floatingSettings.moveUpButton.style.display = 'block'
        if(this.newContent || !this.getNextEditableElement()) this.floatingSettings.moveDownButton.style.display = 'none'
        else this.floatingSettings.moveDownButton.style.display = 'block'
    }

    setActive() {
        super.setActive();
        this.refreshFloatingSettings()
        this.floatingSettings.classList.add('active')
    }

    setUnactive() {
        super.setUnactive();
        this.floatingSettings.classList.remove('active')
    }

    remove(){
        this.settingsPane.remove()
        this.element.remove()
        FrontendEdit.editables.splice(FrontendEdit.editables.indexOf(this), 1)
    }

    updateFirstLastElementClasses() {
        if(!this.getPreviousEditableElement()) this.element.classList.add('first')
        else this.element.classList.remove('first')
        if(!this.getNextEditableElement()) this.element.classList.add('last')
        else this.element.classList.remove('last')
    }

    refreshElementHtml(){
        this.updateFirstLastElementClasses()
        this.refreshFloatingSettings()
    }
    refreshSiblingElementsHtml(){
        let previousElement = this.getPreviousEditableElement()
        if(previousElement) previousElement.refreshElementHtml()
        let nextElement = this.getNextEditableElement()
        if(nextElement) nextElement.refreshElementHtml()
    }
}
