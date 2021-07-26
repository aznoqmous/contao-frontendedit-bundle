document.addEventListener('DOMContentLoaded', () => {
    if ((new URLSearchParams(window.location.search)).get('frontendedit')) {
        document.body.classList.add('frontendedit')
    }
})

