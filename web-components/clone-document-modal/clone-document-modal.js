export class CloneDocumentModal {
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        let stringHTML = `<option value="copy" selected>Copy</option>`;
        for (let personality of assistOS.space.personalities) {
            stringHTML += `<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
        this.currentDocumentTitle = `[Clone] ${assistOS.space.getDocument(assistOS.space.currentDocumentId).title}`;
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async generateDocument(_target) {
        let flowId = assistOS.space.getFlowIdByName("GenerateDocument");
        let context = {
            title: formData.data.documentTitle,
            topic: formData.data.documentTopic,
            chaptersCount: formData.data.chaptersCount
        }
        await assistOS.services.callFlow(flowId, context);
        assistOS.UI.closeModal(_target);
    }

    async cloneDocument(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        let proofread = formData.data.proofread === "on";
        let flowId = assistOS.space.getFlowIdByName("CloneDocument");
        let context = {
            documentId: assistOS.space.currentDocumentId,
            personalityId: formData.data.documentPersonality,
            title: formData.data.documentTitle,
            proofread: proofread
        };
        await assistOS.services.callFlow(flowId, context);
        await assistOS.factories.notifyObservers("docs");
        assistOS.UI.closeModal(_target);
    }
}
