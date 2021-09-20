import PageEditableElement from "./editable-elements/page-editable-element";
import Cookies from "cookies";
import Layouts from './layouts.json'
import ElementManager from "./element-manager";
import ArticleEditableElement from "./editable-elements/article-editable-element";
import ContentElementEditableElement from "./editable-elements/content-element-editable-element";
import Lang from "./lang";
import BackendElement from "./editable-elements/backend-element";
import ModuleEditableElement from "./editable-elements/module-editable-element";

export default class FrontendEdit {

    constructor() {
        if (window.parent !== window) return null
        this.edit = Cookies.get('frontendedit')
        this.rt = null
        this.pageIframe = null
        this.contentPane = null

        this.iframeLoadT = Date.now()

        this.elementManager = new ElementManager({
            article: ArticleEditableElement,
            page: PageEditableElement,
            content_element: ContentElementEditableElement,
            module: ModuleEditableElement,
        })

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

        this.buildPageIframe()
        this.buildLayoutSettings()

        this.contentPane = document.querySelector('.frontendedit-content-pane')

        this.colResize = document.querySelector('.frontendedit-col-resize > span')
        this.colResize.addEventListener('mousedown', ()=>{
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
        this.toggleMode.querySelector('.view').innerHTML = Lang.get('view')
        this.toggleMode.querySelector('.edit').innerHTML = Lang.get('edit')
        if(this.edit) this.toggleMode.classList.add('frontendedit-active')
        this.toggleMode.addEventListener('click', ()=>{
            Cookies.set('frontendedit', !this.edit)
            window.location.reload()
        })

        this.saveButton = this.settingsBar.querySelector('.save')
        this.saveButton.children[0].innerHTML = Lang.get('save')
        this.saveButton.addEventListener('click', ()=>{
            ElementManager.elements
                .filter(e => !e.saved)
                .map(e => e.save())
            FrontendEdit.updateButtons()
        })
        this.cancelButton = this.settingsBar.querySelector('.cancel')
        this.cancelButton.innerHTML = Lang.get('cancel')
        this.cancelButton.addEventListener('click', ()=>{
            ElementManager.elements
                .filter(e => !e.saved)
                .map(e => e.cancel())
            FrontendEdit.updateButtons()
        })

        new BackendElement(this.settingsBar.querySelector('.user-settings'))
    }

    buildPageIframe(){
        this.pageIframeContainer = document.querySelector('.frontendedit-page-iframe-container')
        this.pageIframe = document.querySelector('.frontendedit-page-iframe')

        this.reloadIframeButton = this.settingsBar.querySelector('.reload-iframe')
        this.reloadIframeButton.addEventListener('click', ()=>{
            FrontendEdit.reloadIframe()
        })
        this.reloadIframeButton.classList.add('loading')

        this.pageIframe.onload = () => {
            let loadTime = this.settingsBar.querySelector('.reload-iframe .loading-time')
            loadTime.innerHTML = Math.floor((Date.now() - this.iframeLoadT) / 1000 * 10)/10 + "s"

            this.bindIframe()
            this.pageIframe.classList.add('frontendedit-active')
            this.reloadIframeButton.classList.remove('loading')

            if(FrontendEdit.hideScrollbarCheckbox.checked) FrontendEdit.hideIframeScrollBar()
            if(FrontendEdit.hideSymfonyDebugToolbarCheckbox.checked) FrontendEdit.hideIframeSymfonyDebugToolbar()

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
                ElementManager.elements
                    .filter(e => e.floatingSettings.classList.contains('frontendedit-active'))
                    .map(e => {
                        e.refreshFloatingSettings()
                    })
            })
            this.pageIframe.contentWindow.addEventListener('resize', ()=>{
                ElementManager.elements
                    .filter(e => e.floatingSettings.classList.contains('frontendedit-active'))
                    .map(e => {
                        e.refreshFloatingSettings()
                    })
            })
            ElementManager.elements.map(e => {
                if(e.settingsPane) e.settingsPane.remove()
            })
        }

        this.iframeLoadT = Date.now()
        this.pageIframe.src = this.pageIframe.getAttribute('data-src')
    }

    buildLayoutSettings(){
        window.addEventListener('resize', ()=>{
            FrontendEdit.resize()
        })
        this.layoutSelect = this.settingsBar.querySelector('.page-iframe-resize [name="layouts"]')
        let options = [...this.layoutSelect.querySelectorAll('option')]
        options.map(o => {
            o.innerHTML = Lang.get(o.value)
        })
        this.layoutWidth = this.settingsBar.querySelector('[name="width"]')
        this.layoutHeight = this.settingsBar.querySelector('[name="height"]')

        this.layoutSelect.add(new Option(`${Lang.get('device')} (${window.screen.availWidth}x${window.screen.availHeight})`, 'device'))

        Layouts.map(l => {
            this.layoutSelect.add(new Option(`${l.name} (${l.width}x${l.height})`, l.name))
        })

        this.layoutSelect.addEventListener('change', ()=>{
            let selectedLayout = FrontendEdit.getLayoutByName(this.layoutSelect.selectedOptions[0].value)
            if(selectedLayout) FrontendEdit.applyLayout(selectedLayout)
            FrontendEdit.resizePageIframe()
        })

        let resizeFromValues = ()=>{
            this.layoutSelect.value = 'custom'
            FrontendEdit.resizePageIframe(this.layoutWidth.value, this.layoutHeight.value)
        }
        this.layoutWidth.addEventListener('change', resizeFromValues.bind(this))
        this.layoutHeight.addEventListener('change', resizeFromValues.bind(this))

        this.hideScrollbarCheckbox = this.settingsBar.querySelector('[name="hideScrollbar"]')
        let hideScrollbarLabel = this.hideScrollbarCheckbox.parentElement.querySelector('label')
        hideScrollbarLabel.innerHTML = Lang.get('hideScrollbar')
        this.hideScrollbarCheckbox.addEventListener('change', ()=>{
            if(this.hideScrollbarCheckbox.checked) FrontendEdit.hideIframeScrollBar()
            else FrontendEdit.showIframeScrollBar()
        })
        this.hideSymfonyDebugToolbarCheckbox = this.settingsBar.querySelector('[name="hideSymfonyDebugToolbar"]')
        let hideSymfonyDebugToolbarLabel = this.hideSymfonyDebugToolbarCheckbox.parentElement.querySelector('label')
        hideSymfonyDebugToolbarLabel.innerHTML = Lang.get('hideSymfonyDebugToolbar')
        this.hideSymfonyDebugToolbarCheckbox.addEventListener('change', ()=>{
            if(this.hideSymfonyDebugToolbarCheckbox.checked) FrontendEdit.hideIframeSymfonyDebugToolbar()
            else FrontendEdit.showIframeSymfonyDebugToolbar()
        })

        FrontendEdit.loadLayout()
    }

    static applyLayout(layout){
        FrontendEdit.layoutWidth.value = layout.width
        FrontendEdit.layoutHeight.value = layout.height
        if(layout.hideScrollbar) FrontendEdit.hideIframeScrollBar()
        else FrontendEdit.showIframeScrollBar()
    }

    static saveLayout(){
        Cookies.set('layout', this.layoutSelect.value)
        Cookies.set('layoutWidth', this.layoutWidth.value)
        Cookies.set('layoutHeight', this.layoutHeight.value)
    }

    static loadLayout(){
        let savedLayout = Cookies.get('layout')
        let hideScrollbar = Cookies.get('hideScrollbar')
        let hideSymfonyDebugToolbar = Cookies.get('hideSymfonyDebugToolbar')
        if(hideSymfonyDebugToolbar) this.hideSymfonyDebugToolbarCheckbox.checked = true

        if(savedLayout) {
            this.layoutSelect.value = savedLayout
            if(savedLayout === 'custom'){
                this.layoutWidth.value = Cookies.get('layoutWidth')
                this.layoutHeight.value = Cookies.get('layoutHeight')
                if(hideScrollbar) FrontendEdit.hideIframeScrollBar()
                if(hideSymfonyDebugToolbar) FrontendEdit.hideIframeSymfonyDebugToolbar()
            }
            let layout = FrontendEdit.getLayoutByName(savedLayout)
            if(layout) FrontendEdit.applyLayout(layout)
        }

        FrontendEdit.resizePageIframe()
    }

    static getLayoutByName(name){
        let selectedLayout = Layouts.filter(l => l.name === this.layoutSelect.selectedOptions[0].value)
        return selectedLayout.length ? selectedLayout[0] : null
    }

    static getCurrentLayout(){
        return FrontendEdit.getLayoutByName(FrontendEdit.layoutSelect.value)
    }

    static hideIframeScrollBar(){
        FrontendEdit.pageIframe.contentDocument.body.classList.add('hide-scrollbar')
        FrontendEdit.hideScrollbarCheckbox.checked = true
        Cookies.set('hideScrollbar', true)
    }

    static showIframeScrollBar(){
        FrontendEdit.pageIframe.contentDocument.body.classList.remove('hide-scrollbar')
        FrontendEdit.hideScrollbarCheckbox.checked = false
        Cookies.set('hideScrollbar', false)
    }

    static hideIframeSymfonyDebugToolbar(){
        let sfToolbar = FrontendEdit.pageIframe.contentDocument.querySelector('.sf-toolbar')
        if(sfToolbar) sfToolbar.style.display = 'none'
        FrontendEdit.hideSymfonyDebugToolbarCheckbox.checked = true
        Cookies.set('hideSymfonyDebugToolbar', true)

        // iframe load quickfix
        setTimeout(()=>{
            if(!FrontendEdit.hideSymfonyDebugToolbarCheckbox.checked) return null
            let sfToolbar = FrontendEdit.pageIframe.contentDocument.querySelector('.sf-toolbar')
            if(sfToolbar) sfToolbar.style.display = 'none'
        }, 1000)
    }
    static showIframeSymfonyDebugToolbar(){
        let sfToolbar = FrontendEdit.pageIframe.contentDocument.querySelector('.sf-toolbar')
        if(sfToolbar) sfToolbar.style.display = 'block'
        FrontendEdit.hideSymfonyDebugToolbarCheckbox.checked = false
        Cookies.set('hideSymfonyDebugToolbar', false)
    }

    /**
     * Column resize between pageIframe and content edition pane
     */
    static resize(pageIframeRatio=null){
        if(!pageIframeRatio) pageIframeRatio = Cookies.get('resizedPageIframeRatio')
        else Cookies.set('resizedPageIframeRatio', pageIframeRatio)
        if(!pageIframeRatio) return null
        if(!this.contentPane.getBoundingClientRect().width) return null;
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

        if(FrontendEdit.layoutSelect.value === 'device'){
            this.layoutWidth.value = window.screen.availWidth
            this.layoutHeight.value = window.screen.availHeight
        }

        if(!width) width = FrontendEdit.layoutWidth.value
        if(!height) height = FrontendEdit.layoutHeight.value

        FrontendEdit.pageIframe.style.width = width + 'px'
        FrontendEdit.pageIframe.style.height = height + 'px'
        let pageIframeContainerRatio = pageIframeContainerBox.width / pageIframeContainerBox.height
        let pageIframeRatio = width/height
        let maxContainerWidth = pageIframeContainerBox.width < width ? pageIframeContainerBox.width - 32 : width
        let maxContainerHeight = pageIframeContainerBox.height < height ? pageIframeContainerBox.height - 32 : height
        let widthScale = maxContainerWidth / width
        let heightScale =  maxContainerHeight / height
        let scale = pageIframeRatio > pageIframeContainerRatio ? widthScale : heightScale
        FrontendEdit.pageIframe.style.transform = `scale(${scale})`
        FrontendEdit.saveLayout()
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

        if(this.edit) ElementManager.addElements(this.getIframeEditableElements())
    }

    static updateButtons(){
        let unsaved = ElementManager.elements.filter(e => !e.saved).length
        let saveButton = FrontendEdit.settingsBar.querySelector('.save')
        let cancelButton = FrontendEdit.settingsBar.querySelector('.cancel')
        if(unsaved) {
            saveButton.classList.add('frontendedit-active')
            saveButton.querySelector('.count').innerHTML = `(${unsaved})`
            cancelButton.classList.add('frontendedit-active')
        }
        else {
            saveButton.classList.remove('frontendedit-active')
            saveButton.querySelector('.count').innerHTML = ""
            cancelButton.classList.remove('frontendedit-active')
        }
    }

    static removeElement(editableElement){
        ElementManager.elements = ElementManager.elements.filter(el => el !== editableElement)
        FrontendEdit.updateButtons()
    }

    static hideSettingsPane(){
        FrontendEdit.closeAllSettingsPane()
        FrontendEdit.pageIframeContainer.style.width = null
        FrontendEdit.contentPane.style.width = null
        FrontendEdit.resizePageIframe()
    }

    static closeAllSettingsPane() {
        [...FrontendEdit.contentPane.querySelectorAll('.settings-pane')].map(el => el.style.display = 'none')
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

    static reloadIframe(){
        this.iframeLoadT = Date.now()
        FrontendEdit.reloadIframeButton.classList.add('loading')
        FrontendEdit.pageIframe.src = FrontendEdit.pageIframe.src
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

    static get hideScrollbarCheckbox() {
        return window._hideScrollbarCheckbox
    }

    static set hideScrollbarCheckbox(value) {
        window._hideScrollbarCheckbox = value
    }

    get hideScrollbarCheckbox() {
        return window._hideScrollbarCheckbox
    }

    set hideScrollbarCheckbox(value) {
        window._hideScrollbarCheckbox = value
    }

    static get hideSymfonyDebugToolbarCheckbox() {
        return window._hideSymfonyDebugToolbarCheckbox
    }

    static set hideSymfonyDebugToolbarCheckbox(value) {
        window._hideSymfonyDebugToolbarCheckbox = value
    }

    get hideSymfonyDebugToolbarCheckbox() {
        return window._hideSymfonyDebugToolbarCheckbox
    }

    set hideSymfonyDebugToolbarCheckbox(value) {
        window._hideSymfonyDebugToolbarCheckbox = value
    }

    static get reloadIframeButton() {
        return window._reloadIframeButton
    }

    static set reloadIframeButton(value) {
        window._reloadIframeButton = value
    }

    get reloadIframeButton() {
        return window._reloadIframeButton
    }

    set reloadIframeButton(value) {
        window._reloadIframeButton = value
    }

    static get iframeLoadT() {
        return window._iframeLoadT
    }

    static set iframeLoadT(value) {
        window._iframeLoadT = value
    }

    get iframeLoadT() {
        return window._iframeLoadT
    }

    set iframeLoadT(value) {
        window._iframeLoadT = value
    }
}
