import FrontendEdit from "../frontend-edit";
import Types from "../types.json";
import Lang from "../lang";

export default class EditableElement {
    constructor(element) {
        this.element = element
        this.element.editable = this
        this.type = this.getType()
        this.id = this.getId()
        this.settingsPane = null
        this.settingsPaneFirstLoad = true
        this.saved = true
        this.savedState = null
        this.bindElement()
    }

    get name() {
        return this.element.getAttribute('data-name')
    }

    getId() {
        let match = this.element.className.match(new RegExp(`${this.type.prefix}(\\d{1,})`))
        return match ? match[1] : null
    }

    getChildren() {
        return [...this.element.querySelectorAll(".editable")]
    }

    getParent() {
        let found = null
        let parent = this.element
        while (!found && parent) {
            parent = parent.parentElement
            if (parent && parent.className.match("editable")) found = parent
        }
        return found ? found.editable : null
    }

    getParents() {
        let parents = []
        let current = this
        while (current) {
            current = current.getParent()
            if (current) parents.push(current)
        }
        return parents.reverse()
    }

    getType() {
        let thisType = null
        Types.some(type => {
            if (this.element.className.match(type.prefix)) thisType = type
            if (thisType) return true
        })
        return thisType
    }

    bindElement() {
        this.element.addEventListener('click', (e) => {
            this.setActive()
        })
    }

    openSettingsPane() {
        if (!this.settingsPane) this.buildSettingsPane()
        FrontendEdit.closeAllSettingsPane()
        this.settingsPane.style.display = 'flex'
        FrontendEdit.resize()
    }

    getSettingsForm() {
        return this.settingsIframe ? this.settingsIframe.contentDocument.querySelector('form.tl_edit_form') : null
    }

    getSettingsFormData() {
        return new FormData(this.getSettingsForm())
    }

    buildSettingsPane() {
        if (!this.settingsPane) {
            this.settingsPane = document.createElement('div')
            this.settingsPane.classList.add('settings-pane')
            this.settingsPane.style.display = 'none'


            this.settingsIframe = document.createElement('iframe')
            this.settingsPane.appendChild(this.settingsIframe)
            FrontendEdit.contentPane.appendChild(this.settingsPane)

            this.updateSettingsPane()
            this.settingsIframe.onload = () => {
                this.buildSettingsPaneActions()
                this.bindSettingsPane()
                if (!this.settingsPaneFirstLoad) {
                    if (this.settingsPaneSubmit) {
                        this.settingsPaneSubmit = false
                        this.onSettingsPaneSubmit()
                    } else {
                        this.onSettingsPaneReload()
                    }
                }
                this.saveState()
                this.settingsPaneFirstLoad = false
            }
        }
    }

    buildSettingsPaneActions() {
        if (this.settingsPaneActions) this.settingsPaneActions.remove()
        this.settingsPaneActions = document.createElement('div')
        this.settingsPaneActions.classList.add("settings-pane-actions")

        let buttons = this.settingsIframe.contentDocument.querySelector('#tl_buttons')
        if (buttons) {
            buttons.remove()
            this.settingsPaneSubmitAction = document.createElement('div')
            this.settingsPaneSubmitAction.classList.add('save')
            this.settingsPaneSubmitAction.innerHTML = Lang.get('save')
            this.settingsPaneActions.appendChild(this.settingsPaneSubmitAction)
            this.settingsPaneSubmitAction.addEventListener('click', () => {
                this.save()
            })

            this.settingsPaneCancelAction = document.createElement('div')
            this.settingsPaneCancelAction.classList.add('cancel')
            this.settingsPaneCancelAction.innerHTML = Lang.get('cancel')
            this.settingsPaneActions.appendChild(this.settingsPaneCancelAction)
            this.settingsPaneCancelAction.addEventListener('click', () => {
                this.loadState()
            })
        }

        this.settingsPaneCloseAction = document.createElement('div')
        this.settingsPaneCloseAction.classList.add('close')
        this.settingsPaneCloseAction.innerHTML = '✖'
        this.settingsPaneActions.appendChild(this.settingsPaneCloseAction)
        this.settingsPaneCloseAction.addEventListener('click', () => {
            FrontendEdit.hideSettingsPane()
        })

        if (this.settingsPane.children.length) this.settingsPane.insertBefore(this.settingsPaneActions, this.settingsPane.children[0])
        else this.settingsPane.appendChild(this.settingsPaneActions)

        let submit = this.settingsIframe.contentDocument.querySelector('.tl_formbody_submit')
        if (submit) submit.remove()
        let sfToolBar = this.settingsIframe.contentDocument.querySelector('.sf-toolbar')
        if (sfToolBar) sfToolBar.remove()
        let preview = this.settingsIframe.contentDocument.querySelector('#pal_preview_legend')
        if (preview) preview.remove()
    }

    updateSettingsPane(data = new FormData()) {
        if (!this.settingsPane) this.buildSettingsPane()
        this.settingsIframe.src = this.getContentPopupUrl()
    }

    bindSettingsPane() {
        if (this.getSettingsForm()) this.getSettingsForm().addEventListener('submit', (e) => {
            this.settingsPaneSubmit = true
        })
    }

    getContentPopupUrl() {
        return null
    }

    onSettingsPaneReload() {
        return null
    }

    onSettingsPaneSubmit() {
        this.setSaved()
        return null
    }

    save() {
        this.settingsPaneSubmit = true
        this.getSettingsForm().submit()
        this.saveState()
        this.setSaved()
    }
    cancel(){
        this.loadState()
    }

    setSaved() {
        this.element.classList.remove('unsaved')
        this.saved = true
        FrontendEdit.updateButtons()
    }

    setUnsaved() {
        this.element.classList.add('unsaved')
        this.saved = false
        FrontendEdit.updateButtons()
    }

    saveState() {
        if (!this.getSettingsForm()) return null
        let data = new FormData(this.getSettingsForm())
        this.savedState = [...data.entries()]
        this.savedState = this.savedState.filter(input =>
            input[0] !== 'REQUEST_TOKEN'
            && input[0] !== 'FORM_FIELDS[]'
        )
    }

    loadState() {
        let form = this.getSettingsForm()
        if (!this.savedState) return null
        this.savedState.map(keyValue => {
            let field = form.querySelector(`[name="${keyValue[0]}"]`)
            if (field) field.value = keyValue[1]
            if (field.classList.contains('tl_textarea')) {
                let tinyMce = field.parentElement.parentElement.querySelector('iframe')
                tinyMce.contentDocument.body.innerHTML = field.value
            }
        })
        this.setSaved()
    }

    setActive() {
        this.element.classList.add('frontendedit-active')
        this.openSettingsPane()
        this.active = true
    }

    setUnactive() {
        this.element.classList.remove('frontendedit-active')
        this.active = false
    }
}
