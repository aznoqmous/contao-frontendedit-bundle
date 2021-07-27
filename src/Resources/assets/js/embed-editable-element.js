import FrontendEdit from "./frontend-edit";

export default class EmbedEditableElement {
    constructor(element) {
        this.element = element
        this.type = this.getType()
        this.id = this.getId()
        this.settingsPane = null
        this.bindElement()
    }

    setSettingsPane(element) {
        this.settingsPane = element
    }

    getId() {
        let match = this.element.className.match(/ce_(\d{1,})/)
        return match ? match[1] : null
    }

    getType() {
        let type = null
        if (this.element.className.match(/ce_/)) type = 'tl_content'
        if (this.element.className.match(/mod_/)) type = 'tl_module'
        return type
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
        this.element.addEventListener('mouseenter', (e) => {
            FrontendEdit.getAllElements().map(el => el.classList.remove('hover'))
            this.element.classList.add('hover')
        })
        this.element.addEventListener('mouseleave', (e) => {
            this.element.classList.remove('hover')
        })
        this.element.addEventListener('click', (e) => {
            if (this.element !== e.currentTarget) return null;
            FrontendEdit.getAllElements().map(el => el.classList.remove('active'))
            this.element.classList.add('active')
            this.openSettingsPane(this)
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

    updateElement(data) {
        return this.fetchContentElementHtml(data)
            .then(res => {
                this.updateContent(res)
                this.bindElement()
                this.element.classList.remove('unsaved')
            })
    }

    updateContent(html, saved = false) {
        let div = document.createElement('div')
        div.innerHTML = html
        let updatedElement = div.querySelector('*')
        updatedElement.classList.add('editable')
        updatedElement.classList.add('active')
        if (!saved) updatedElement.classList.add('unsaved')
        updatedElement.classList.add(`ce_${this.id}`)
        this.element.parentElement.insertBefore(updatedElement, this.element)
        this.element.remove()
        this.element = updatedElement
        return updatedElement
    }

    createSettingsPane() {
        if (!this.settingsPane) {
            this.settingsPane = document.createElement('iframe')
            this.settingsPane.style.height = "100vh"
            this.settingsPane.style.width = "100%"
            FrontendEdit.settingsColumn.appendChild(this.settingsPane)
            this.updateSettingsPane()
            this.settingsPane.onload = () => {
                this.bindSettingsPane()
            }
        }
    }

    getContentPopupUrl() {
        if (this.type === 'tl_content') return `/contao?do=article&table=tl_content&id=${this.id}&popup=1&act=edit&rt=${FrontendEdit.rt}`
        return null
    }

    getAPIContentPopupUrl() {
        if (this.type === 'tl_content') return `/api/frontendedit/form/${this.id}`
        return null
    }

    bindSettingsPane() {
        let sfToolBar = this.settingsPane.contentDocument.querySelector('.sf-toolbar')
        if(sfToolBar) sfToolBar.remove()
        let splitButtons = this.settingsPane.contentDocument.querySelector('.split-button')
        if(splitButtons) splitButtons.parentElement.removeChild(splitButtons)
        let tlBoxes = [...this.settingsPane.contentDocument.querySelectorAll('tl_box')]
        tlBoxes.map(b => b.classList.add('collapsed'))
        this.bindIframe(this.settingsPane)
    }

    bindIframe(iframe) {
        let forms = [...iframe.contentDocument.querySelectorAll('form')]
        forms.map(form => {
            this.updateElement(new FormData(this.getSettingsForm()), false)
            let fields = [...form.querySelectorAll('input,select,textarea,checkbox,radio')]
            fields.map(f => f.addEventListener('change', () => {
                let data = new FormData(this.getSettingsForm())
                this.updateElement(data, false)
                this.bindSettingsPane()
            }))
        })
    }

    updateSettingsPane(data = new FormData()) {
        this.settingsPane.src = this.getContentPopupUrl()
    }

    openSettingsPane() {
        if (!this.settingsPane) this.createSettingsPane()
        FrontendEdit.closeAllSettingsPane()
        this.settingsPane.style.display = 'block'
    }

    getSettingsForm() {
        return this.settingsPane ? this.settingsPane.contentDocument.querySelector('form#tl_content') : null
    }
}
