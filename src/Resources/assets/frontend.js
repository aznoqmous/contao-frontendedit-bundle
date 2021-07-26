import "./scss/style.scss"
import FrontendEdit from "./js/frontend-edit";

document.addEventListener('DOMContentLoaded', ()=>{
    if(!(new URLSearchParams(window.location.search)).get('frontendedit')) new FrontendEdit()
    else document.body.classList.add('frontendedit')
})
