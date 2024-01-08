export class utilsService{
    constructor(){}
    parseURL(url) {
        let splitUrl=url.split('/');
        let documentId = splitUrl[3];
        let chapterId = splitUrl[5];
        let paragraphId = splitUrl[7];
        if (chapterId) {
            return [documentId, chapterId, paragraphId];
        } else {
            return documentId;
        }
    }
}
