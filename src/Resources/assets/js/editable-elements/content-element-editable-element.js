import EmbedEditableElement from "./embed-editable-element";
import Lang from "../lang";

export default class ContentElementEditableElement extends EmbedEditableElement {
    constructor(element, newContent=false) {
        super(element, newContent=false);
    }
    buildFloatingSettings() {
        super.buildFloatingSettings();
        this.floatingName = document.createElement('div')
        this.floatingName.classList.add('floating-name')
        this.floatingSettings.appendChild(this.floatingName)
        this.refreshFloatingSettings()
    }
    refreshFloatingSettings() {
        super.refreshFloatingSettings();
        this.floatingName.innerHTML = `${Lang.get(this.type.name)} : ${this.id}`
    }
}
