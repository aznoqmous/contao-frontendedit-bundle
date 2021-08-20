/**
 * Utility to handle lots of concurrent fetches (eg: EmbedEditableElement.fetchContentElement)
 */
export default class RifleRequest {
    constructor() {
        this.requests = []
        this.timeout = 200
        this.lastT = Date.now()
    }

    fetch(url, params={}){
        return new Promise((resolve, reject)=>{
            let request = this.addRequest(url, params)
            return setTimeout(()=>{
                if(this.getLastRequest().time === request.time)
                {
                    fetch(request.url, request.params)
                        .then(res => {
                            resolve(res)
                        })
                }
                else return reject()
            }, this.timeout)
        })
    }

    addRequest(url, params){
        let request = {
            url, params,
            time: Date.now()
        }
        this.requests.push(request)
        return request
    }

    getLastRequest(){
        return this.requests[this.requests.length-1]
    }
}
