export class RoutingService {
    constructor() {}
    async navigateToLocation(locationArray = [], appName) {
        const DOCUMENTS_PAGE = "documents-page";

        if (locationArray.length === 0 || locationArray[0] === DOCUMENTS_PAGE) {
            const pageUrl = `${system.space.id}/${appName}/${DOCUMENTS_PAGE}`;
            await system.UI.changeToDynamicPage(DOCUMENTS_PAGE, pageUrl);
            return;
        }
        
        const webComponentName = locationArray[0];
        const pageUrl = `${system.space.id}/${appName}/${locationArray.join("/")}`;
        await system.UI.changeToDynamicPage(webComponentName, pageUrl);
    }
}
