export class routingService{
    constructor(){}
    async navigateToApplication(location){
        const locationFragments=location.split('/');
        let documentIdURL = locationFragments[0];
        let presenterName = locationFragments[1];
        let chapterIdURL = locationFragments[2];
        let paragraphIdURL = locationFragments[3];
        if (await storageManager.loadObject(webSkel.currentUser.space.id, "documents", documentIdURL) !== null) {
            webSkel.currentUser.space.currentDocumentId = documentIdURL;
            webSkel.currentUser.space.currentChapterId = chapterIdURL;
            webSkel.currentUser.space.currentParagraphId = paragraphIdURL;
        }
        await webSkel.changeToDynamicPage(presenterName, location.slice(1));
    }
}