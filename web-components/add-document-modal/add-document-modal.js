export class addDocumentModal {
    constructor(element,invalidate) {
       this.invalidate=invalidate;
       this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        webSkel.UtilsService.closeModal(_target);
    }

    async addDocument(_target) {
        let formData = await webSkel.UtilsService.extractFormInformation(_target);
        if(formData.isValid) {
            let flowId = webSkel.currentUser.space.getFlowIdByName("AddDocument");
            let docId = await webSkel.getService("LlmsService").callFlow(flowId, formData.data.documentTitle, formData.data.documentTopic);
            webSkel.UtilsService.closeModal(_target);
            await webSkel.changeToDynamicPage(`document-view-page`, `documents/${docId}/document-view-page`);
        }
    }
}