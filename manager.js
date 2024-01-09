import {routingService} from "./services/routingService.js";

export class Manager {
    constructor() {
        this.appName = "AiAuthor";
        this.services = new Set();
        this.services.routingService = new routingService();
    }
    async navigateToLocation(location) {
        this.services.routingService.navigateToLocation(location, this.appName);
    }
}