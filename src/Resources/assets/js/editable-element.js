import FrontendEdit from "./frontend-edit";
import Types from "./types.json";

export default class EditableElement {
    constructor(element) {
        this.element = element
        this.element.editable = this
        this.type = this.getType()
        this.id = this.getId()
        this.settingsPane = null
        this.settingsPaneFirstLoad = true
        this.saved = true
        this.bindElement()
    }

    getId() {
        let match = this.element.className.match(new RegExp(`${this.type.prefix}(\\d{1,})`))
        return match ? match[1] : null
    }

    getType() {
        let thisType = null
        Types.some(type => {
            if (this.element.className.match(type.prefix)) thisType = type
            if(thisType) return true
        })
        return thisType
    }

    bindElement() {
        this.element.addEventListener('click', (e) => {
            this.setActive()
        })
    }

    openSettingsPane() {
        if (!this.settingsPane) this.createSettingsPane()
        FrontendEdit.closeAllSettingsPane()
        this.settingsPane.style.display = 'block'
    }
    getSettingsForm() {
        return this.settingsPane ? this.settingsPane.contentDocument.querySelector('form.tl_edit_form') : null
    }

    createSettingsPane() {
        if (!this.settingsPane) {
            this.settingsPane = document.createElement('iframe')
            this.settingsPane.style.display = 'none'
            FrontendEdit.contentPane.appendChild(this.settingsPane)
            this.updateSettingsPane()
            this.settingsPane.onload = () => {
                if(!this.settingsPaneFirstLoad) {
                    if(this.settingsPaneSubmit){
                        this.settingsPaneSubmit = false
                        this.onSettingsPaneSubmit()
                    }
                    else {
                        this.onSettingsPaneReload()
                    }
                }
                this.bindSettingsPane()
                this.settingsPaneFirstLoad = false
            }
        }
    }
    updateSettingsPane(data = new FormData()) {
        if(!this.settingsPane) this.createSettingsPane()
        this.settingsPane.src = this.getContentPopupUrl()
    }

    bindSettingsPane() {
        let sfToolBar = this.settingsPane.contentDocument.querySelector('.sf-toolbar')
        if(sfToolBar) sfToolBar.remove()
        let splitButtons = this.settingsPane.contentDocument.querySelector('.split-button')
        if(splitButtons) splitButtons.remove()
        let returnButton = this.settingsPane.contentDocument.querySelector('#tl_buttons')
        if(returnButton) returnButton.remove()
        let preview = this.settingsPane.contentDocument.querySelector('#pal_preview_legend')
        if(preview) preview.remove()
        this.getSettingsForm().addEventListener('submit', (e)=>{
            this.settingsPaneSubmit = true
        })
    }

    getContentPopupUrl(){
        return null
    }

    onSettingsPaneReload(){
        return null
    }
    onSettingsPaneSubmit(){
        this.setSaved()
        return null
    }

    save(){
        this.settingsPaneSubmit = true
        this.getSettingsForm().submit()
        this.setSaved()
    }
    setSaved(){
        this.element.classList.remove('unsaved')
        this.saved = true
        FrontendEdit.updateButtons()
    }
    setUnsaved(){
        this.element.classList.add('unsaved')
        this.saved = false
        FrontendEdit.updateButtons()
    }

    setActive(){
        this.element.classList.add('active')
        this.openSettingsPane()
        this.active = true
    }
    setUnactive(){
        this.element.classList.remove('active')
        this.active = false
    }
}
