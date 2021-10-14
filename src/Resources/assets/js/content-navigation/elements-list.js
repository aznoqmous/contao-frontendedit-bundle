import FrontendEdit from "../frontend-edit";
import ElementManager from "../element-manager";
import {list} from "postcss";

export default class ElementsList {
    constructor(container) {
        this.container = container
        this.listElement = this.container.querySelector('.elements')
        this.iframe = FrontendEdit.pageIframe

        this.bind()

        this.elements = []
    }

    clear(){
        this.elements = []
        this.listElement.innerHTML = ''
    }

    bind(){
        this.iframe.addEventListener('loadend', ()=>{
            this.clear()
        })
        ElementManager.onAddElement((element)=>{
            this.createElementListItem(element)
        })
    }

    get listItems(){
        return [...this.listElement.querySelectorAll('li')]
    }

    createElementListItem(element){
        let parent = this.listElement
        if(element.getParent()) {
            parent = this.elements[element.getParent().getUniqueId()]
        }

        let listItem = document.createElement('li')
        let listItemName = document.createElement('span')
        listItemName.innerHTML = element.name
        listItem.className = element.element.className
        element.navigationItem = listItem
        listItem.appendChild(listItemName)

        let nextElement = element.getNextEditableElement()
            let previousElement = element.getPreviousEditableElement()
        if(nextElement && nextElement.navigationItem && previousElement.navigationItem){
            parent.insertBefore(previousElement.navigationItem, listItem)
        }
        listItemName.addEventListener('click', (e)=>{
            ElementManager.elements.map(e => e.setUnactive())
            element.setActive()
        })
        element.addEventListener('updateElement', ()=>{
            listItemName.innerHTML = element.name
            listItem.className = element.element.className
        })
        element.addEventListener('move', ()=>{
            let previousElement = element.getPreviousEditableElement()
            parent.insertBefore(previousElement.navigationItem, listItem)
        })
        element.addEventListener('active', ()=>{
            listItem.classList.add('active')
        })
        element.addEventListener('unactive', ()=>{
            listItem.classList.remove('active')
        })
        parent.appendChild(listItem)

        let childContainer = document.createElement('ul')
        listItem.appendChild(childContainer)
        this.elements[element.getUniqueId()] = childContainer
    }
}
