import EmbedEditableElement from "./embed-editable-element";
import Cookies from "cookies";

export default class FrontendEdit {
    constructor() {
        if(window.parent !== window) return null
        this.edit = Cookies.get('frontendedit')

        if(!this.edit) return this.buildToggleFrontendEdit()

        this.rt = null
        this.iframe = null
        this.settingsColumn = null
        this.getToken()
            .then(res => {
                console.log(this.rt)
                if (res) this.build()
            })
        this.editables = []
    }

    static get rt(){
        return window._rt
    }

    static set rt(value){
        window._rt = value
    }

    get rt(){
        return window._rt
    }

    set rt(value){
        window._rt = value
    }

    static get settingsColumn(){
        return window._settingsColumn
    }

    static set settingsColumn(value){
        window._settingsColumn = value
    }

    get settingsColumn(){
        return window._settingsColumn
    }

    set settingsColumn(value){
        window._settingsColumn = value
    }

    build() {
        this.iframe = document.createElement('iframe')
        this.iframe.id = 'frontendedit'

        let urlSearch = new URLSearchParams(window.location.search)
        urlSearch.append('frontendedit', 1)

        document.body.innerHTML = ""
        document.body.style.padding = 0
        document.body.style.margin = 0
        document.body.style.display = 'flex'

        this.iframe.src = window.location.origin + "" + window.location.pathname + "?" + urlSearch.toString()
        this.iframe.style.width = '70vw'
        this.iframe.style.height = '100vh'
        document.body.appendChild(this.iframe)

        this.settingsColumn = document.createElement('div')
        this.settingsColumn.style.width = '30vw'
        document.body.appendChild(this.settingsColumn)

        FrontendEdit.addStyleSheets()

        this.iframe.onload = () => {
            this.bindIframe()
        }

        this.buildToggleFrontendEdit()
    }

    buildToggleFrontendEdit(){
        let toggle = document.createElement('div')
        toggle.innerHTML = this.edit ? "View" : "Edit"
        toggle.addEventListener('click', ()=>{
            Cookies.set('frontendedit', !this.edit)
            window.location.reload()
        })
        toggle.style.position = 'fixed'
        toggle.style.left = 0
        toggle.style.top = 0
        toggle.style.padding = "10px"
        toggle.style.background = 'white'
        toggle.style.zIndex = 10000
        toggle.style.cursor = 'pointer'
        document.body.appendChild(toggle)
    }

    static addStyleSheets(){
        let stylesheets = [...document.querySelectorAll('link[href],style')]
        stylesheets.map(s => s.remove())

        let contaoStyleSheets = [
            'system/themes/flexible/basic.min.css'
        ]
        contaoStyleSheets.map(s => {
            let link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = s
            document.head.appendChild(link)
        })
    }

    static reloadBackendScripts(){
        let backendScripts = [...document.head.querySelectorAll('script.be-script')]
        backendScripts.map(script => {
            document.head.appendChild(script);
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

    getIframeContentElements() {
        return [...this.iframe.contentDocument.body.querySelectorAll('.editable')]
    }

    bindIframe() {
        let links = [...this.iframe.contentDocument.querySelectorAll('a[href]')]
        links.map(l => {
            l.addEventListener('click', (e)=>{
                e.preventDefault()
                window.location.href = l.href
            })
        })

        this.getIframeContentElements().map(el => {
            let editable = new EmbedEditableElement(el)
            this.editables.push(editable)
        })
    }

    static closeAllSettingsPane(){
        [...this.settingsColumn.children].map(el => el.style.display = 'none')
    }

    static getAllElements(){
        return [...document.querySelector('#frontendedit').contentDocument.querySelectorAll('.editable')]
    }
}
