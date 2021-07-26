import FrontendEdit from "./frontend-edit";

export default class EmbedEditableElement {
    constructor(element) {
        this.element = element
        this.type = this.getType()
        this.id = this.getId()
        this.settingsPane = null
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

    updateContent(html, saved=false) {
        let div = document.createElement('div')
        div.innerHTML = html
        let updatedElement = div.querySelector('*')
        updatedElement.classList.add('editable')
        updatedElement.classList.add('active')
        if(!saved) updatedElement.classList.add('unsaved')
        updatedElement.classList.add(`ce_${this.id}`)
        this.element.parentElement.insertBefore(updatedElement, this.element)
        this.element.remove()
        this.element = updatedElement
        return updatedElement
    }

    save(){
        let data = new FormData(this.settingsPane.querySelector('form'))
        fetch(this.getContentPopupUrl(), {
            method: 'POST',
            body: data
        })
            .then(res => res.text())
            .then(html => {
                this.updateSettingsColumn(html)
            })
        this.updateElement(data, true)
    }

    getContentPopupUrl(){
        if(this.type === 'tl_content') return `/contao?do=article&table=tl_content&id=${this.id}&popup=1&act=edit&rt=${FrontendEdit.rt}`
        return null
    }

    updateElement(data){
        return this.fetchContentElementHtml(data)
            .then(res => {
                this.updateContent(res)
            })
    }

    fetchContentElementHtml(formData){
        return fetch(`/api/frontendedit/render/${this.id}`, {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
    }

    updateSettingsColumn() {
        return fetch(this.getContentPopupUrl())
            .then(res => res.text())
            .then(html => {
                this.settingsPane.innerHTML = html
                setTimeout(()=>{
                    let splitButtons = this.settingsPane.querySelector('.split-button')
                    splitButtons.parentElement.removeChild(splitButtons)
                    let tlBoxes = [...this.settingsPane.querySelectorAll('tl_box')]
                    tlBoxes.map(b => b.classList.add('collapsed'))
                    let form = this.settingsPane.querySelector('form#tl_content')
                    this.settingsPane.innerHTML = ''
                    this.settingsPane.appendChild(form)
                    form.addEventListener('submit', (e)=>{
                        e.preventDefault()
                        this.save()
                    })
                    let fields = [...form.querySelectorAll('input,select,textarea,checkbox,radio')]
                    fields.map(f => f.addEventListener('change', ()=>{
                        let data = new FormData(form)
                        this.updateElement(data, false)
                    }))
                }, 10)
            })
    }
}
