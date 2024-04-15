export function parseURL() {
    let url = window.location.hash.split('/');
    let documentId = url[3];
    let chapterId = url[5];
    let paragraphId = url[7];
    if (chapterId) {
        return [documentId, chapterId, paragraphId];
    } else {
        return documentId;
    }
}
export function getAppName(){
    return 'AiAuthor';
}
export function getBasePath(){
    return `${assistOS.space.id}`+`/`+`${getAppName()}`;
}