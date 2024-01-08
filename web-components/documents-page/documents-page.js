

export class documentsPage {
    constructor(element, invalidate) {
        this.notificationId = "docs"
        documentFactory.observeChange(this.notificationId, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if(webSkel.currentUser.space.documents.length > 0) {
            webSkel.currentUser.space.documents.forEach((document) => {
                this.tableRows += `<document-unit data-name="${webSkel.UtilsService.sanitize(document.title)}" 
                data-id="${document.id}" data-local-action="editAction"></document-unit>`;
            });
        }
        else {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await webSkel.UtilsService.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getDocumentId(_target){
        return webSkel.UtilsService.reverseQuerySelector(_target, "document-unit").getAttribute("data-id");
    }
    async showAddDocumentModal() {
        await webSkel.UtilsService.showModal(document.querySelector("body"), "add-document-modal", { presenter: "add-document-modal"});
    }
    async showGenerateDocumentModal() {
        await webSkel.UtilsService.showModal(document.querySelector("body"), "generate-document-modal", { presenter: "generate-document-modal"});
    }
    async editAction(_target) {
        webSkel.currentUser.space.currentDocumentId = this.getDocumentId(_target);
        await webSkel.changeToDynamicPage("document-view-page",`${getBasePath()}/documents/${webSkel.currentUser.space.currentDocumentId}/document-view-page`);
    }
    async cloneAction(_target){
        webSkel.currentUser.space.currentDocumentId = this.getDocumentId(_target);
        await webSkel.UtilsService.showModal(document.querySelector("body"), "clone-document-modal", { presenter: "clone-document-modal"});
    }
    async deleteAction(_target){
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteDocument");
        await webSkel.getService("LlmsService").callFlow(flowId, this.getDocumentId(_target));
        documentFactory.notifyObservers("docs");
    }
}