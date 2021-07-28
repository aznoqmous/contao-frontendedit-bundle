import "./scss/style.scss"
import FrontendEdit from "./js/frontend-edit";
import Cookies from "cookies";

document.addEventListener('DOMContentLoaded', ()=>{
    if((new URLSearchParams(window.location.search)).get('frontendedit') == null) new FrontendEdit()
    else {
        if(Cookies.get('frontendedit')) document.body.classList.add('frontendedit')
    }
})
