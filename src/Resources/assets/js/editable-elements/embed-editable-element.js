import FrontendEdit from "../frontend-edit";
import EditableElement from "./editable-element";
import RifleRequest from "../rifle-request";
import ElementManager from "../element-manager";
import Lang from "../lang";
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
        if(newContent) {
            this.element.classList.add('new')
            this.element.classList.add(this.type.default_css_class)
            this.updateFirstLastElementClasses()
        }
        this.buildFloatingSettings()
        this.buildHierarchy()
    }

    get isParent(){
        return this.type.name === 'article' || (this.getChildren().length)
    }

    bindElement() {
        this.element.addEventListener('click', (e) => {
            if (!this.isEventTarget(e)) return null;
            ElementManager.elements.map(el => {
                el.setUnactive()
            })
            this.setActive()
            this.openSettingsPane(this)
        })

        this.element.addEventListener('mousemove', (e) => {
            if (!this.isEventTarget(e)) {
                if(!this.element.classList.contains('frontendedit-active')) this.floatingSettings.classList.remove('frontendedit-active')
                return null
            }
            FrontendEdit.getAllElements().map(el => el.classList.remove('frontendedit-hover'))
            this.element.classList.add('frontendedit-hover')
            this.floatingSettings.classList.add('frontendedit-active')
            this.refreshFloatingSettings()
            if(!this.settingsPane) this.buildSettingsPane()
        })
        this.element.addEventListener('mouseleave', (e) => {
            this.element.classList.remove('frontendedit-hover')
            if(!this.element.classList.contains('frontendedit-active')) this.floatingSettings.classList.remove('frontendedit-active')
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
        this.updateElement(this.getSettingsFormData(), true)
            .then(()=>{
                this.newContent = false
                this.refreshSiblingElementsHtml()
            })
        super.onSettingsPaneSubmit()
    }
    onSettingsPaneReload() {
        this.updateElement(this.getSettingsFormData(), false)
    }

    updateElement(data, saved=false) {
        return this.fetchContentElementHtml(data)
            .then(res => {
                if(!res) return null
                this.updateContent(res, saved)
                this.bindElement()
                this.refreshElementHtml()
                this.dispatchEvent('updateElement')
            })
    }

    updateContent(html, saved = false) {
        let div = document.createElement('div')
        div.innerHTML = html
        let updatedElement = div.querySelector('*')
        if(!updatedElement) return false
        if(this.element.classList.contains('frontendedit-active')) updatedElement.classList.add('frontendedit-active')
        updatedElement.classList.add('editable')
        if(this.isParent) this.getChildren().map(child => updatedElement.appendChild(child))
        this.element.parentElement.insertBefore(updatedElement, this.element)
        this.element.remove()
        this.element = updatedElement
        if (!saved) this.setUnsaved()
        return updatedElement
    }

    getContentPopupUrl() {
        return `/contao?do=${this.type.do}&table=${this.type.table}&id=${this.id}&popup=1&act=edit&rt=${FrontendEdit.rt}`
    }


    buildSettingsPaneActions() {
        super.buildSettingsPaneActions();
        this.settingsPaneDeleteAction = document.createElement('div')
        this.settingsPaneDeleteAction.classList.add('delete')
        this.settingsPaneDeleteAction.innerHTML = Lang.get('delete')
        this.settingsPaneActions.appendChild(this.settingsPaneDeleteAction)
        this.settingsPaneDeleteAction.addEventListener('click', ()=>{
            if(confirm(`Voulez-vous vraiment supprimer l'élément ID ${this.id} ?`)) this.deleteElement()
        })
        this.settingsPaneActions.insertBefore(this.settingsPaneDeleteAction, this.settingsPaneCloseAction)
    }
    bindSettingsPane() {
        super.bindSettingsPane();
        this.bindIframe(this.settingsIframe)
    }

    bindIframe(iframe) {
        let forms = [...iframe.contentDocument.querySelectorAll('form')]
        forms.map(form => {
            let fields = [...form.querySelectorAll('input,select,textarea,checkbox,radio')]
            fields
                .filter(f => !f._frontendeditBound)
                .map(f => {
                f.addEventListener('change', () => {
                    this.updateElement(this.getSettingsFormData())
                })
                f.addEventListener('keyup', () => {
                    this.updateElement(this.getSettingsFormData())
                })
                f._frontendeditBound = true
            })
            this.bindTinyMCE(iframe)
            this.bindListWizard(iframe)
        })
    }
    bindTinyMCE(iframe){
        if(!iframe.contentWindow.tinymce || iframe.contentWindow.tinymce._frontendeditBound) return null
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
                    this.updateElement(this.getSettingsFormData())
                })).observe(tinyIframe.contentDocument.body, {childList: true, subtree: true, characterData: true})
            }, 1000)
        })
        iframe.contentWindow.tinymce._frontendeditBound = true
    }
    bindListWizard(iframe){
        let copyButtons = [...iframe.contentDocument.querySelectorAll('[data-command="copy"]')]
        copyButtons
            .filter(b => !b._frontendeditBound)
            .map(b => {
            b.addEventListener('click', ()=>{
                this.updateElement(this.getSettingsFormData())
                this.bindIframe(iframe)
            })
            b._frontendeditBound = true
        })
        let deleteButtons = [...iframe.contentDocument.querySelectorAll('[data-command="delete"]')]
        deleteButtons
            .filter(b => !b._frontendeditBound)
            .map(b => {
                b.addEventListener('click', ()=>{
                    this.updateElement(this.getSettingsFormData())
                })
                b._frontendeditBound = true
            })
        let dragButtons = [...iframe.contentDocument.querySelectorAll('.drag-handle')]
        dragButtons
            .filter(b => !b._frontendeditBound)
            .map(b => {
                let updateOnRelease = ()=>{
                    iframe.contentDocument.removeEventListener('mouseup', updateOnRelease)
                    this.updateElement(this.getSettingsFormData())
                }
                b.addEventListener('mousedown', ()=>{
                    iframe.contentDocument.addEventListener('mouseup', updateOnRelease)
                })
                b._frontendeditBound = true
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

        /*
         * Buttons
         */
        this.floatingSettings.deleteButton = document.createElement('button')
        this.floatingSettings.deleteButton.classList.add('delete')
        this.floatingSettings.deleteButton.title = Lang.get('delete')
        this.floatingSettings.deleteButton.onclick = ()=>{
            if(confirm(`Voulez-vous vraiment supprimer l'élément ID ${this.id} ?`)) this.deleteElement()
        }

        this.floatingSettings.moveUpButton = document.createElement('button')
        this.floatingSettings.moveUpButton.classList.add('move-up')
        this.floatingSettings.moveUpButton.title = Lang.get('moveUp')
        this.floatingSettings.moveUpButton.addEventListener('click', ()=>{this.moveElementUp()})

        this.floatingSettings.moveDownButton = document.createElement('button')
        this.floatingSettings.moveDownButton.classList.add('move-down')
        this.floatingSettings.moveDownButton.title = Lang.get('moveDown')
        this.floatingSettings.moveDownButton.addEventListener('click', ()=>{this.moveElementDown()})

        this.floatingSettings.insertAfterButton = document.createElement('button')
        this.floatingSettings.insertAfterButton.classList.add('insert-after')
        this.floatingSettings.insertAfterButton.title = Lang.get('insertAfter')
        this.floatingSettings.insertAfterButton.addEventListener('click', ()=>{this.insertAfter()})

        this.floatingSettings.appendChild(this.floatingSettings.moveUpButton)
        this.floatingSettings.appendChild(this.floatingSettings.moveDownButton)
        this.floatingSettings.appendChild(this.floatingSettings.deleteButton)
        this.floatingSettings.appendChild(this.floatingSettings.insertAfterButton)

        /*
         * Informations
         */
        this.floatingInformations =  document.createElement('div')
        this.floatingInformations.classList.add('floating-infos')
        this.floatingSettings.appendChild(this.floatingInformations)

        this.floatingName = document.createElement('div')
        this.floatingName.classList.add('floating-name')
        this.floatingInformations.appendChild(this.floatingName)

        this.floatingCssClasses = document.createElement('div')
        this.floatingCssClasses.classList.add('floating-css')
        this.floatingCssClasses.innerHTML = this.getCSSClasses()
        this.floatingInformations.appendChild(this.floatingCssClasses)

        idocument.body.appendChild(this.floatingSettings)
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

        this.floatingName.innerHTML = Lang.get(this.type.name)
        this.floatingName.innerHTML = `${Lang.get(this.type.name)} : ${this.name}`
        this.floatingCssClasses.innerHTML = this.getCSSClasses()
    }
    buildHierarchy(){
        this.hierarchyEl = document.createElement('ul')
        this.hierarchyEl.className = "frontendedit-hierarchy"
        FrontendEdit.pageIframe.contentDocument.body.appendChild(this.hierarchyEl)
    }
    refreshHierarchy(){
        this.hierarchyEl.innerHTML = ""
        this.getParents().map(editable => {
            let item = document.createElement('li')
            item.innerHTML = `<span>${Lang.get(editable.type.name)} : ${editable.name}</span>`
            this.hierarchyEl.appendChild(item)
            item.addEventListener('click', ()=>{
                editable.setActive()
                editable.element.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                })
                this.setUnactive()
            })
        })
        let item = document.createElement('li')
        item.innerHTML = `<strong>${Lang.get(this.type.name)} : ${this.name}</strong>`
        this.hierarchyEl.appendChild(item)
    }

    /*
     * Floating actions
     */
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
        this.dispatchEvent('move')
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
                let newEditableElement = ElementManager.addElement(contentElement, true)
                ElementManager.elements.map(e => e.setUnactive())
                newEditableElement.setActive()
                newEditableElement.setUnsaved()
                newEditableElement.updateFirstLastElementClasses()
                newEditableElement.refreshFloatingSettings()
            })
    }

    /*
     * Utils
     */
    getPreviousEditableElement(index=1, dodgeNewContent=true){
        let sameTypeElements = this.getSameTypeElements(dodgeNewContent)
        let previousElement = sameTypeElements ? sameTypeElements[sameTypeElements.indexOf(this.element) - index] : null
        return previousElement ? previousElement.editable : null
    }
    getNextEditableElement(index=1, dodgeNewContent=true){
        let sameTypeElements = this.getSameTypeElements(dodgeNewContent)
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

    getSameTypeElements(dodgeNewContent=true){
        let elements = FrontendEdit.getAllElements()
        return elements ? elements.filter(e =>
            e.editable
            && !(dodgeNewContent && e.editable.newContent)
            && e.editable.type.name === this.type.name
            && e.parentElement === this.element.parentElement
        ) : null
    }

    getCSSClasses() {
        let cssClasses = this.element.className
            .split(' ')
            .filter(cssClass => ![
                    'new',
                    'unsaved',
                    'editable',
                    'frontendedit',
                    this.type.prefix + '\\d'
                ]
                    .some(bannedClass => cssClass.match(new RegExp(bannedClass)))
            )
            .join('.')
        return cssClasses ? `.${cssClasses}` : ''
    }

    setActive() {
        super.setActive();
        this.refreshFloatingSettings()
        this.refreshHierarchy()
        this.floatingSettings.classList.add('frontendedit-active')
        this.hierarchyEl.classList.add('frontendedit-active')
    }
    setUnactive() {
        super.setUnactive();
        this.floatingSettings.classList.remove('frontendedit-active')
        this.hierarchyEl.classList.remove('frontendedit-active')
    }

    remove(){
        this.settingsPane.remove()
        this.element.remove()
        ElementManager.elements.splice(ElementManager.elements.indexOf(this), 1)
        if(this.active) FrontendEdit.closeAllSettingsPane()
    }

    updateFirstLastElementClasses() {
        if(!this.getPreviousEditableElement(1, false)) this.element.classList.add('first')
        else this.element.classList.remove('first')
        if(!this.getNextEditableElement(1, false)) this.element.classList.add('last')
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
