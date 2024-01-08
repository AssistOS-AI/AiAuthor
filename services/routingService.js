export class routingService {
    constructor() {}
    async navigateToLocation(locationArray,appName) {
        if (locationArray[0] !== "documents" && locationArray[0] !== "documents-page") {
            console.error("Invalid URL");
            return;
        }
        if (locationArray[0] === "documents-page" || locationArray === null) {
            const pageComponent = "documents-page";
            const pageUrl = `${webSkel.currentUser.space.id}/${appName}/documents-page`;
            await webSkel.changeToDynamicPage(pageComponent, pageUrl);
            return;
        }
        const webComponentName = locationArray[locationArray.length - 1];
        const pageUrl = `${webSkel.currentUser.space.id}/${appName}/${locationArray.join("/")}`;
        await webSkel.changeToDynamicPage(webComponentName, pageUrl);
    }
}
