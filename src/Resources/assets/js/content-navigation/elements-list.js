import FrontendEdit from "../frontend-edit";
import ElementManager from "../element-manager";

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

    createElementListItem(element){
        let parent = this.listElement
        if(element.getParent()) {
            parent = this.elements[element.getParent().getUniqueId()]
        }

        let listItem = document.createElement('li')
        listItem.innerHTML = element.name
        parent.appendChild(listItem)

        let childContainer = document.createElement('ul')
        listItem.appendChild(childContainer)
        this.elements[element.getUniqueId()] = childContainer
    }
}
