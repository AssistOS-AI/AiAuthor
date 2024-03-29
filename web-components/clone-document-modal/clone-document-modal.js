export class CloneDocumentModal {
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        let stringHTML = `<option value="copy" selected>Copy</option>`;
        for (let personality of system.space.personalities) {
            stringHTML += `<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
        this.currentDocumentTitle = `[Clone] ${system.space.getDocument(system.space.currentDocumentId).title}`;
    }

    closeModal(_target) {
        system.UI.closeModal(_target);
    }

    async generateDocument(_target) {
        let flowId = system.space.getFlowIdByName("GenerateDocument");
        let context = {
            title: formData.data.documentTitle,
            topic: formData.data.documentTopic,
            chaptersCount: formData.data.chaptersCount
        }
        await system.services.callFlow(flowId, context);
        system.UI.closeModal(_target);
    }

    async cloneDocument(_target) {
        let formData = await system.UI.extractFormInformation(_target);
        let proofread = formData.data.proofread === "on";
        let flowId = system.space.getFlowIdByName("CloneDocument");
        let context = {
            documentId: system.space.currentDocumentId,
            personalityId: formData.data.documentPersonality,
            title: formData.data.documentTitle,
            proofread: proofread
        };
        await system.services.callFlow(flowId, context);
        await system.factories.notifyObservers("docs");
        system.UI.closeModal(_target);
    }
}
