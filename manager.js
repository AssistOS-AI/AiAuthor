import {routingService} from "./services/routingService.js";
import {utilsService} from "./services/utilsService.js"

export class Manager {
    constructor() {
        this.appName = "AiAuthor";
        this.services = new Set();
        this.services.routingService = new routingService();
        this.services.utilsService =  new utilsService();
    }

    async navigateToLocation(location) {
        this.services.routingService.navigateToLocation(location, this.appName);
    }
    getAppName(){
        return this.appName;
    }
    getBasePath(){
        return `${webSkel.currentUser.space.id}`+`/`+`${getAppName()}`;
    }
    parseURL(url){
        return this.services.utilsService.parseURL(url);
    }
}