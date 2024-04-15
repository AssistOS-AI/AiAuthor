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

    async cloneDocument(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        let proofread = formData.data.proofread === "on";
        await assistOS.callFlow("CloneDocument", {
            documentId: assistOS.space.currentDocumentId,
            personalityId: formData.data.documentPersonality,
            title: formData.data.documentTitle,
            proofread: proofread
        });
        await assistOS.factories.notifyObservers("docs");
        assistOS.UI.closeModal(_target);
    }
}
