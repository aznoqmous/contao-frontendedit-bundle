import EmbedEditableElement from "./embed-editable-element";
import Cookies from "cookies";
import PageEditableElement from "./page-editable-element";

export default class FrontendEdit {

    constructor() {
        if (window.parent !== window) return null
        this.edit = Cookies.get('frontendedit')

        this.rt = null
        this.pageIframe = null
        this.contentPane = null
        this.editables = []

        this.getToken()
            .then(res => {
                if (!res) return null
                this.build()
            })
    }

    build() {
        this.removeAssets()
        this.removeSymfonyDebugToolbar()

        this.settingsBar = document.querySelector('.frontendedit-settings')
        this.pageElement = new PageEditableElement(this.settingsBar.querySelector('.page-settings'))

        this.pageIframe = document.querySelector('.frontendedit-page-iframe')
        this.pageIframe.onload = () => {
            this.bindIframe()
            this.pageIframe.classList.add('active')
            this.editables.map(e => {
                if(e.settingsPane) e.settingsPane.remove()
            })

            this.pageElement.updateElement(
                JSON.parse(
                    this.pageIframe
                        .contentDocument
                        .querySelector('meta[name="frontend-edit-page-info"]')
                        .content
                )
            )

            this.pageElement.updateSettingsPane()

            this.pageIframe.contentWindow.addEventListener('scroll', ()=>{
                this.editables
                    .filter(e => e.active)
                    .map(e => {
                        e.refreshFloatingSettings()
                    })
            })
            this.pageIframe.contentWindow.addEventListener('resize', ()=>{
                this.editables
                    .filter(e => e.active)
                    .map(e => {
                        e.refreshFloatingSettings()
                    })
            })
        }
        this.pageIframe.src = this.pageIframe.getAttribute('data-src')


        this.contentPane = document.querySelector('.frontendedit-content-pane')


        this.toggleMode = this.settingsBar.querySelector('.toggle-edit-mode')
        if(this.edit) this.toggleMode.classList.add('active')
        this.toggleMode.addEventListener('click', ()=>{
            Cookies.set('frontendedit', !this.edit)
            window.location.reload()
        })

        this.saveButton = this.settingsBar.querySelector('.save')
        this.saveButton.addEventListener('click', ()=>{
            this.editables
                .filter(e => !e.saved)
                .map(e => e.save())
            FrontendEdit.updateButtons()
        })
        this.cancelButton = this.settingsBar.querySelector('.cancel')
    }

    removeSymfonyDebugToolbar(){
        let sfToolbar = document.querySelector('.sf-toolbar')
        if(sfToolbar) sfToolbar.remove()
    }
    removeAssets() {
        let assets = [...document.querySelectorAll('link[href],style,script')]
        assets.map(s => {
            if(s.href && !s.href.match(/frontendedit/)) s.remove()
            if(s.src && !s.src.match(/frontendedit/)) s.remove()
        })
    }

    getToken() {
        return fetch("/api/frontendedit/token")
            .then(res => res.json())
            .then(token => {
                if (!token) return false
                this.rt = token
                return true
            })
    }

    getIframeEditableElements() {
        return [...this.pageIframe.contentDocument.body.querySelectorAll('.editable')]
    }

    bindIframe() {
        let links = [...this.pageIframe.contentDocument.querySelectorAll('a[href]')]
        links.map(l => {
            l.addEventListener('click', (e) => {
                e.preventDefault()
                FrontendEdit.setIframeUrl(l.href)
            })
        })

        if(this.edit) this.getIframeEditableElements().map(el => {
            let editable = new EmbedEditableElement(el)
            this.editables.push(editable)
        })
    }

    static updateButtons(){
        let unsaved = FrontendEdit.editables.filter(e => !e.saved).length
        let saveButton = FrontendEdit.settingsBar.querySelector('.save')
        let cancelButton = FrontendEdit.settingsBar.querySelector('.cancel')
        if(unsaved) {
            saveButton.classList.add('active')
            saveButton.querySelector('.count').innerHTML = `(${unsaved})`
            cancelButton.classList.add('active')
        }
        else {
            saveButton.classList.remove('active')
            saveButton.querySelector('.count').innerHTML = ""
            cancelButton.classList.remove('active')
        }
    }

    static closeAllSettingsPane() {
        [...FrontendEdit.contentPane.children].map(el => el.style.display = 'none')
    }

    static clearSettingsPage(){
        FrontendEdit.contentPane.innerHTML = ''
    }

    static getAllElements() {
        return [...this.pageIframe.contentDocument.querySelectorAll('.editable')]
    }

    static setIframeUrl(url){
        FrontendEdit.pageIframe.src = url + '?frontendedit'
        window.history.pushState('', '', url)
    }

    static get rt() {
        return window._rt
    }

    static set rt(value) {
        window._rt = value
    }

    get rt() {
        return window._rt
    }

    set rt(value) {
        window._rt = value
    }

    static get pageIframe() {
        return window._pageIframe
    }

    static set pageIframe(value) {
        window._pageIframe = value
    }

    get pageIframe() {
        return window._pageIframe
    }

    set pageIframe(value) {
        window._pageIframe = value
    }

    static get contentPane() {
        return window._contentPane
    }

    static set contentPane(value) {
        window._contentPane = value
    }

    get contentPane() {
        return window._contentPane
    }

    set contentPane(value) {
        window._contentPane = value
    }

    static get settingsBar() {
        return window._settingsBar
    }

    static set settingsBar(value) {
        window._settingsBar = value
    }

    get settingsBar() {
        return window._settingsBar
    }

    set settingsBar(value) {
        window._settingsBar = value
    }

    static get editables() {
        return window._editables
    }

    static set editables(value) {
        window._editables = value
    }

    get editables() {
        return window._editables
    }

    set editables(value) {
        window._editables = value
    }
}
