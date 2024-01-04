export class routingService {
    constructor() {
        this.appName = "AiAuthor";
    }
    async navigateToApplication(locationArray) {
        if (locationArray[0] !== "documents" && locationArray[0] !== "documents-page") {
            console.error("Invalid URL structure.");
            return;
        }

        if (locationArray[0] === "documents-page") {
            const pageComponent = "documents-page";
            const pageUrl = `${webSkel.currentUser.space.id}/${this.appName}/documents-page`;
            await webSkel.changeToDynamicPage(pageComponent, pageUrl);
            return;
        }

        const webComponentName = locationArray[locationArray.length - 1];
        const pageUrl = `${webSkel.currentUser.space.id}/${this.appName}/${locationArray.join("/")}`;
        await webSkel.changeToDynamicPage(webComponentName, pageUrl);
    }
}
