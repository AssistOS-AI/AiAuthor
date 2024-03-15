import {getBasePath} from "../../utils/index.js"
export class DocumentsPage {
    constructor(element, invalidate) {
        this.userRights = window.location.hash.split("/")[3];
        this.notificationId = "docs"
        documentFactory.observeChange(this.notificationId, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if(webSkel.currentUser.space.documents.length > 0) {
            webSkel.currentUser.space.documents.forEach((document) => {
                this.tableRows += `<document-unit data-name="${webSkel.sanitize(document.title)}" 
                data-id="${document.id}" data-local-action="editAction" data-hide-actions="${this.userRights}"></document-unit>`;
            });
        }
        else {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await webSkel.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getDocumentId(_target){
        return webSkel.reverseQuerySelector(_target, "document-unit").getAttribute("data-id");
    }
    async showAddDocumentModal() {
        await webSkel.showModal( "add-document-modal", { presenter: "add-document-modal"});
    }
    async showGenerateDocumentModal() {
        await webSkel.showModal( "generate-document-modal", { presenter: "generate-document-modal"});
    }
    async editAction(_target) {
        webSkel.currentUser.space.currentDocumentId = this.getDocumentId(_target);
        if(this.userRights === "readonly"){
            await webSkel.changeToDynamicPage("space-configs-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/document-view-page/${webSkel.currentUser.space.currentDocumentId}`);
        }else {
            await webSkel.changeToDynamicPage("document-view-page",`${getBasePath()}/document-view-page/${webSkel.currentUser.space.currentDocumentId}`);
        }
    }
    async cloneAction(_target){
        webSkel.currentUser.space.currentDocumentId = this.getDocumentId(_target);
        await webSkel.showModal( "clone-document-modal", { presenter: "clone-document-modal"});
    }
    async deleteAction(_target){
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteDocument");
        await webSkel.appServices.callFlow(flowId, this.getDocumentId(_target));
        documentFactory.notifyObservers("docs");
    }
}