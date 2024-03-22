import {parseURL} from "../../utils/index.js"
export class CloneChapterModal {
    constructor(element, invalidate) {
        [this.documentId,this.chapterId]=parseURL();
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        let stringHTML = `<option value="copy" selected>Copy</option>`;
        for (let personality of system.space.personalities) {
            stringHTML += `<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
        this.currentChapterTitle = `[Clone] ${system.space.getDocument(this.documentId).getChapter(this.chapterId).title}`;
    }

    closeModal(_target) {
        system.UI.closeModal(_target);
    }

    async cloneChapter(_target) {
        let formData = await system.UI.extractFormInformation(_target);
        let proofread = formData.data.proofread === "on";
        let flowId = system.space.getFlowIdByName("CloneChapter");
        let context = {
            documentId: this.documentId,
            chapterId: this.chapterId,
            personalityId: formData.data.chapterPersonality,
            title: formData.data.chapterTitle,
            proofread: proofread
        };
        await system.services.callFlow(flowId, context);
        system.space.getDocument(this.documentId).notifyObservers("doc:chapter-brainstorming-page");
        system.UI.closeModal(_target);
    }
}
