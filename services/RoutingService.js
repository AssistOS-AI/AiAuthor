export class RoutingService {
    constructor() {}
    async navigateToLocation(locationArray = [], appName) {
        const DOCUMENTS_PAGE = "documents-page";

        if (locationArray.length === 0 || locationArray[0] === DOCUMENTS_PAGE) {
            const pageUrl = `${webSkel.currentUser.space.id}/${appName}/${DOCUMENTS_PAGE}`;
            await webSkel.changeToDynamicPage(DOCUMENTS_PAGE, pageUrl);
            return;
        }
        
        const webComponentName = locationArray[0];
        const pageUrl = `${webSkel.currentUser.space.id}/${appName}/${locationArray.join("/")}`;
        await webSkel.changeToDynamicPage(webComponentName, pageUrl);
    }
}
