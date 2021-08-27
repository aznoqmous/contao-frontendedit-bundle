export default class Lang {

    static get defaultLang(){ return "en" }

    static init(){
        var context = require.context('./lang', true)
        var files = {}
        context.keys().forEach((filename)=>{
            let lang = filename.replace(/\.json/, "").replace('./', "")
            files[lang] = context(filename);
        });
        Lang.translations = files[Lang.getLocale()] || {}
        Lang.defaultTranslations = files[Lang.defaultLang]
        Lang.translations = Object.assign(Lang.defaultTranslations, Lang.translations)
    }

    static set defaultTranslations(value){
        window._frontendedit_default_lang = value
    }

    static get defaultTranslations(){
        return window._frontendedit_default_lang
    }

    static set translations(value){
        window._frontendedit_lang = value
    }

    static get translations(){
        return window._frontendedit_lang
    }

    static getLocale(){
        return navigator.language.replace(/-.*?$/, "")
    }

    static get(key=null){
        if(!key) return Lang.translations
        if(!Lang.translations[key]) return Lang.defaultTranslations[key]
        return Lang.translations[key]
    }
}

Lang.init()