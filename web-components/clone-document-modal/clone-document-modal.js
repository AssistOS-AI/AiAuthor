export class CloneDocumentModal {
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        let stringHTML = `<option value="copy" selected>Copy</option>`;
        for (let personality of webSkel.currentUser.space.personalities) {
            stringHTML += `<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
        this.currentDocumentTitle = `[Clone] ${webSkel.currentUser.space.getDocument(webSkel.currentUser.space.currentDocumentId).title}`;
    }

    closeModal(_target) {
        webSkel.closeModal(_target);
    }

    async generateDocument(_target) {
        let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateDocument");
        let result = await webSkel.appServices.callFlow(flowId,
            formData.data.documentTitle, formData.data.documentTopic, formData.data.chaptersCount);
        let docData = result.responseJson;
        webSkel.closeModal(_target);
    }

    async cloneDocument(_target) {
        let formData = await webSkel.extractFormInformation(_target);
        let proofread = formData.data.proofread === "on";
        let flowId = webSkel.currentUser.space.getFlowIdByName("CloneDocument");
        await webSkel.appServices.callFlow(flowId, webSkel.currentUser.space.currentDocumentId, formData.data.documentPersonality, formData.data.documentTitle, proofread);
        await documentFactory.notifyObservers("docs");
        webSkel.closeModal(_target);
    }
}
