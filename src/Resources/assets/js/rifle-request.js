/**
 * Utility to handle lots of concurrent fetches (eg: EmbedEditableElement.fetchContentElement)
 */
export default class RifleRequest {
    constructor() {
        this.requests = []
        this.bufferSize = 5
        this.currentBuffer = 0
        this.timeout = 500
        this.lastT = Date.now()
    }

    fetch(url, params={}){
        return new Promise((resolve, reject)=>{
            let request = this.addRequest(url, params)
            if(Date.now() - this.lastT < this.timeout) {
                this.currentBuffer++
                if(this.currentBuffer >= this.bufferSize) {
                    this.currentBuffer = 0
                }
                else {
                    return setTimeout(()=>{
                        if(this.getLastRequest() === request) return this.fetch(request.url, request.params)
                        else return reject()
                    }, this.timeout)
                }
            }
            params = Object.assign({
                signal: request.controller.signal
            }, params)
            this.lastT = Date.now()
            this.abortPreviousRequest(request)
            return fetch(url, params)
                .then(res => {
                    return resolve(res)
                })
        })
    }

    addRequest(url, params){
        let request = {
            url, params,
            time: Date.now(),
            controller: new AbortController()
        }
        this.requests.push(request)
        return request
    }

    abortPreviousRequest(refRequest){
        this.requests
            .filter(request => request.time < refRequest.time)
            .map(request => {
                request.controller.abort()
            })
        this.requests = this.requests.filter(request => request.time > refRequest.time || request === refRequest)
    }

    getLastRequest(){
        return this.requests[this.requests.length-1]
    }
    clearRequests(){
        this.requests.map(r => r.controller.abort())
        this.requests = []
    }
}
