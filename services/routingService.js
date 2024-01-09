export class routingService {
    constructor() {}
    async navigateToLocation(locationArray = [], appName) {
        const DOCUMENTS_PAGE = "documents-page";

        if (locationArray.length === 0 || locationArray[0] === DOCUMENTS_PAGE) {
            const pageUrl = `${webSkel.currentUser.space.id}/${appName}/${DOCUMENTS_PAGE}`;
            await webSkel.changeToDynamicPage(DOCUMENTS_PAGE, pageUrl);
            return;
        }

        if (locationArray[0] !== "documents") {
            console.error("Invalid URL: URL must start with 'documents' or 'documents-page'");
            return;
        }
        
        const webComponentName = locationArray[locationArray.length - 1];
        const pageUrl = `${webSkel.currentUser.space.id}/${appName}/${locationArray.join("/")}`;
        await webSkel.changeToDynamicPage(webComponentName, pageUrl);
    }
}
