import {getBasePath} from "../../utils/index.js"
export class DocumentsPage {
    constructor(element, invalidate) {
        this.notificationId = "docs"
        assistOS.space.observeChange(this.notificationId, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.tableRows = "";
        if(assistOS.space.documents.length > 0) {
            assistOS.space.documents.forEach((document) => {
                this.tableRows += `<document-unit data-name="${assistOS.UI.sanitize(document.title)}" 
                data-id="${document.id}" data-local-action="editAction"></document-unit>`;
            });
        }
        else {
            this.tableRows = `<div> There are no documents yet </div>`;
        }
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    getDocumentId(_target){
        return assistOS.UI.reverseQuerySelector(_target, "document-unit").getAttribute("data-id");
    }
    async showAddDocumentModal() {
        await assistOS.UI.showModal( "add-document-modal", { presenter: "add-document-modal"});
    }
    async showGenerateDocumentModal() {
        await assistOS.UI.showModal( "generate-document-modal", { presenter: "generate-document-modal"});
    }
    async editAction(_target) {
        assistOS.space.currentDocumentId = this.getDocumentId(_target);
        await assistOS.UI.changeToDynamicPage("document-view-page",`${getBasePath()}/document-view-page/${assistOS.space.currentDocumentId}`);
    }
    async cloneAction(_target){
        assistOS.space.currentDocumentId = this.getDocumentId(_target);
        await assistOS.UI.showModal( "clone-document-modal", { presenter: "clone-document-modal"});
    }
    async deleteAction(_target){
        await assistOS.callFlow("DeleteDocument", {
            documentId: this.getDocumentId(_target)
        });
        assistOS.factories.notifyObservers("docs");
    }
}