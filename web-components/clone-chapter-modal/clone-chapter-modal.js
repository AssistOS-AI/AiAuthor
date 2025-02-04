import {parseURL} from "../../utils/index.js"
export class CloneChapterModal {
    constructor(element, invalidate) {
        [this.documentId,this.chapterId]=parseURL();
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        let stringHTML = `<option value="copy" selected>Copy</option>`;
        for (let personality of assistOS.space.personalities) {
            stringHTML += `<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
        this.currentChapterTitle = `[Clone] ${assistOS.space.getDocument(this.documentId).getChapter(this.chapterId).title}`;
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async cloneChapter(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        let proofread = formData.data.proofread === "on";
        await assistOS.callFlow("CloneChapter", {
            documentId: this.documentId,
            chapterId: this.chapterId,
            personalityId: formData.data.chapterPersonality,
            title: formData.data.chapterTitle,
            proofread: proofread
        });
        assistOS.space.getDocument(this.documentId).notifyObservers("doc:chapter-brainstorming-page");
        assistOS.UI.closeModal(_target);
    }
}
