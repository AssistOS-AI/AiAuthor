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
        await system.services.callFlow(flowId, this.documentId, this.chapterId, formData.data.chapterPersonality, formData.data.chapterTitle, proofread);
        system.space.getDocument(this.documentId).notifyObservers("doc:chapter-brainstorming-page");
        system.UI.closeModal(_target);
    }
}
