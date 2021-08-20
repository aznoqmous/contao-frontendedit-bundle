import Types from "./types.json";

export default class ElementManager {
    constructor(types) {
        this.types = types
        this.elements = []
    }

    static findTypeFromHtmlElement(htmlElement){
        let elementType = null
        Types.some(type => {
            if (htmlElement.className.match(type.prefix)) elementType = type
            if(elementType) return true
        })
        return elementType
    }

    static findClassFromHtmlElement(htmlElement){
        let type = ElementManager.findTypeFromHtmlElement(htmlElement)
        return ElementManager.types[type.name]
    }

    static addElements(htmlElements){
        htmlElements.map(e => ElementManager.addElement(e))
    }

    static addElement(htmlElement, newContent=false){
        let elementClass = ElementManager.findClassFromHtmlElement(htmlElement)
        console.log(elementClass)
        ElementManager.elements.push(new elementClass(htmlElement, newContent))
    }

    static get elements(){
        return window._elements
    }
    get elements(){
        return window._elements
    }
    static set elements(value){
        window._elements = value
    }
    set elements(value){
        window._elements = value
    }

    static get types(){
        return window._types
    }
    get types(){
        return window._types
    }
    static set types(value){
        window._types = value
    }
    set types(value){
        window._types = value
    }
}
