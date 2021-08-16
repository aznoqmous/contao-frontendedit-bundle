import EmbedEditableElement from "./embed-editable-element";
import Cookies from "cookies";
import PageEditableElement from "./page-editable-element";
import Layouts from './layouts.json'

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

        this.editionContainer = document.querySelector('.frontendedit-content-edition')
        this.pageIframeContainer = document.querySelector('.frontendedit-page-iframe-container')
        this.pageIframe = document.querySelector('.frontendedit-page-iframe')

        this.buildLayoutSelect()

        this.pageIframe.onload = () => {
            this.bindIframe()
            this.pageIframe.classList.add('active')
            /**
             * Page element
             */
            this.pageElement.updateElement(
                JSON.parse(
                    this.pageIframe
                        .contentDocument
                        .querySelector('meta[name="frontend-edit-page-info"]')
                        .content
                )
            )
            this.pageElement.updateSettingsPane()

            /**
             * Editables
             */
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
            this.editables.map(e => {
                if(e.settingsPane) e.settingsPane.remove()
            })
            if(this.edit) this.buildArticleButton()
        }

        this.pageIframe.src = this.pageIframe.getAttribute('data-src')
        this.contentPane = document.querySelector('.frontendedit-content-pane')

        this.resizing = false
        this.colResize = document.querySelector('.frontendedit-col-resize > hr')
        this.colResize.addEventListener('mousedown', ()=>{
            this.resizing = true
            this.editionContainer.classList.add('resizing')
            let resize = (e)=>{
                FrontendEdit.resize(e.clientX / window.innerWidth)
            }
            document.addEventListener('mousemove', resize)
            document.addEventListener('mouseup', ()=>{
                document.removeEventListener('mousemove', resize)
                this.editionContainer.classList.remove('resizing')
            })
        })

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

    buildLayoutSelect(){
        window.addEventListener('resize', ()=>{
            FrontendEdit.resize()
        })
        this.layoutSelect = this.settingsBar.querySelector('.page-iframe-resize [name="layouts"]')
        this.layoutWidth = this.settingsBar.querySelector('[name="width"]')
        this.layoutHeight = this.settingsBar.querySelector('[name="height"]')
        Layouts.map(l => {
            this.layoutSelect.add(new Option(`${l.name} (${l.width}x${l.height})`, l.name))
        })
        this.layoutSelect.addEventListener('change', ()=>{
            let selectedLayout = Layouts.filter(l => l.name === this.layoutSelect.selectedOptions[0].value)
            this.pageIframe.contentDocument.body.classList.remove('hide-scrollbar')
            if(selectedLayout.length) {
                selectedLayout = selectedLayout[0]
                this.layoutWidth.value = selectedLayout.width
                this.layoutHeight.value = selectedLayout.height
                if(selectedLayout.hideScrollbar){
                    this.pageIframe.contentDocument.body.classList.add('hide-scrollbar')
                }
            }
            FrontendEdit.resizePageIframe()
        })

        let resizeFromValues = ()=>{
            this.layoutSelect.value = 'custom'
            FrontendEdit.resizePageIframe(this.layoutWidth.value, this.layoutHeight.value)
        }
        this.layoutWidth.addEventListener('change', resizeFromValues.bind(this))
        this.layoutHeight.addEventListener('change', resizeFromValues.bind(this))
        FrontendEdit.loadLayout()
    }

    static saveLayout(){
        Cookies.set('layout', this.layoutSelect.value)
        Cookies.set('layoutWidth', this.layoutWidth.value)
        Cookies.set('layoutHeight', this.layoutHeight.value)
    }

    static loadLayout(){
        let savedLayout = Cookies.get('layout')
        if(savedLayout) {
            this.layoutSelect.value = savedLayout
            if(savedLayout !== 'screen'){
                this.layoutWidth.value = Cookies.get('layoutWidth')
                this.layoutHeight.value = Cookies.get('layoutHeight')
            }
        }
        FrontendEdit.resizePageIframe()
    }

    /**
     * Column resize between pageIframe and content edition pane
     */
    static resize(pageIframeRatio=null){
        if(!pageIframeRatio) pageIframeRatio = Cookies.get('resizedPageIframeRatio')
        else Cookies.set('resizedPageIframeRatio', pageIframeRatio)
        if(!pageIframeRatio) return null
        this.pageIframeContainer.style.width = pageIframeRatio * 100 + '%'
        this.contentPane.style.width = (1 - pageIframeRatio) * 100 + '%'
        this.contentPane.classList.add('resized')
        FrontendEdit.resizePageIframe()
    }

    /**
     * Resize pageIframe to specific width/height
     */
    static resizePageIframe(width=null, height=null){
        let pageIframeContainerBox = this.pageIframeContainer.getBoundingClientRect()

        if(FrontendEdit.layoutSelect.value === 'screen'){
            FrontendEdit.pageIframe.removeAttribute('style')
            FrontendEdit.pageIframe.style.width = pageIframeContainerBox.width + 'px'
            FrontendEdit.pageIframe.style.height = pageIframeContainerBox.height + 'px'
            FrontendEdit.layoutWidth.value = Math.floor(pageIframeContainerBox.width)
            FrontendEdit.layoutHeight.value = Math.floor(pageIframeContainerBox.height)
            FrontendEdit.saveLayout()
            return null
        }

        if(!width) width = FrontendEdit.layoutWidth.value
        if(!height) height = FrontendEdit.layoutHeight.value

        FrontendEdit.pageIframe.style.width = width + 'px'
        FrontendEdit.pageIframe.style.height = height + 'px'
        let pageIframeContainerRatio = pageIframeContainerBox.width / pageIframeContainerBox.height
        let pageIframeRatio = width/height
        let widthScale = (pageIframeContainerBox.width - 32) / width
        let heightScale =  (pageIframeContainerBox.height - 32) / height
        let scale = pageIframeRatio > pageIframeContainerRatio ? widthScale : heightScale
        FrontendEdit.pageIframe.style.transform = `scale(${scale})`

        FrontendEdit.saveLayout()
    }

    buildArticleButton(){
        let articles = [...this.pageIframe.contentDocument.querySelectorAll('.mod_article')]
        articles
            .filter(article => article.id.match(/article-/))
            .map(article => {
                let articleId = article.id.replace(/article-/, '')
                let button = document.createElement('button')
                button.className = "frontendedit-insert-button"
                button.innerHTML = "✚ Insérer un élément"
                if( article.children[0]) article.insertBefore(button, article.children[0])
                else article.appendChild(button)

                button.addEventListener('click', ()=>{
                    let contentElement = document.createElement('div')
                    contentElement.className = 'editable'
                    if( article.children[1]) article.insertBefore(contentElement, article.children[1])
                    else article.appendChild(contentElement)

                    return fetch(`/contao?do=article&table=tl_content&act=create&mode=2&pid=${articleId}&rt=${FrontendEdit.rt}`)
                        .then((res)=>{
                            let url = new URL(res.url)
                            let id = url.searchParams.get('id')
                            contentElement.classList.add(`ce_${id}`)
                            let newEditableElement = new EmbedEditableElement(contentElement)
                            FrontendEdit.editables.push(newEditableElement)
                            FrontendEdit.editables.map(e => e.setUnactive())
                            newEditableElement.setActive()
                            newEditableElement.setUnsaved()
                        })
                })

            })
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
                if(!l.href.length) return null
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
        [...FrontendEdit.contentPane.querySelectorAll('iframe')].map(el => el.style.display = 'none')
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

    static get pageIframeContainer() {
        return window._pageIframeContainer
    }

    static set pageIframeContainer(value) {
        window._pageIframeContainer = value
    }

    get pageIframeContainer() {
        return window._pageIframeContainer
    }

    set pageIframeContainer(value) {
        window._pageIframeContainer = value
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

    static get layoutSelect() {
        return window._layoutSelect
    }

    static set layoutSelect(value) {
        window._layoutSelect = value
    }

    get layoutSelect() {
        return window._layoutSelect
    }

    set layoutSelect(value) {
        window._layoutSelect = value
    }

    static get layoutWidth() {
        return window._layoutWidth
    }

    static set layoutWidth(value) {
        window._layoutWidth = value
    }

    get layoutWidth() {
        return window._layoutWidth
    }

    set layoutWidth(value) {
        window._layoutWidth = value
    }

    static get layoutHeight() {
        return window._layoutHeight
    }

    static set layoutHeight(value) {
        window._layoutHeight = value
    }

    get layoutHeight() {
        return window._layoutHeight
    }

    set layoutHeight(value) {
        window._layoutHeight = value
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
