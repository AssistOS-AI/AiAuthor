import {RoutingService} from "./services/RoutingService.js";

export class Manager {
    constructor() {
        this.appName = "AiAuthor";
        this.services = new Map();
        this.services.set('RoutingService', new RoutingService());
    }
    async navigateToLocation(location, isReadOnly) {
        this.services.get('RoutingService').navigateToLocation(location, this.appName, isReadOnly);
    }
}