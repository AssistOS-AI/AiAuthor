import {getBasePath} from "../../utils/index.js"
export class DocumentsPage {
    constructor(element, invalidate) {
        this.notificationId = "docs"
        system.factories.observeChange(this.notificationId, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if(system.space.documents.length > 0) {
            system.space.documents.forEach((document) => {
                this.tableRows += `<document-unit data-name="${system.UI.sanitize(document.title)}" 
                data-id="${document.id}" data-local-action="editAction"></document-unit>`;
            });
        }
        else {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await system.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getDocumentId(_target){
        return system.UI.reverseQuerySelector(_target, "document-unit").getAttribute("data-id");
    }
    async showAddDocumentModal() {
        await system.UI.showModal( "add-document-modal", { presenter: "add-document-modal"});
    }
    async showGenerateDocumentModal() {
        await system.UI.showModal( "generate-document-modal", { presenter: "generate-document-modal"});
    }
    async editAction(_target) {
        system.space.currentDocumentId = this.getDocumentId(_target);
        await system.UI.changeToDynamicPage("document-view-page",`${getBasePath()}/document-view-page/${system.space.currentDocumentId}`);
    }
    async cloneAction(_target){
        system.space.currentDocumentId = this.getDocumentId(_target);
        await system.UI.showModal( "clone-document-modal", { presenter: "clone-document-modal"});
    }
    async deleteAction(_target){
        let flowId = system.space.getFlowIdByName("DeleteDocument");
        let context = {
            documentId: this.getDocumentId(_target)
        }
        await system.services.callFlow(flowId, context);
        system.factories.notifyObservers("docs");
    }
}