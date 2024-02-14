import {parseURL} from "../../utils/index.js"
export class cloneChapterModal {
    constructor(element, invalidate) {
        [this.documentId,this.chapterId]=parseURL();
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        let stringHTML = `<option value="copy" selected>Copy</option>`;
        for (let personality of webSkel.currentUser.space.personalities) {
            stringHTML += `<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
        this.currentChapterTitle = `[Clone] ${webSkel.currentUser.space.getDocument(this.documentId).getChapter(this.chapterId).title}`;
    }

    closeModal(_target) {
        webSkel.closeModal(_target);
    }

    async cloneChapter(_target) {
        let formData = await webSkel.extractFormInformation(_target);
        let proofread = formData.data.proofread === "on";
        let flowId = webSkel.currentUser.space.getFlowIdByName("CloneChapter");
        await webSkel.appServices.callFlow(flowId, this.documentId, this.chapterId, formData.data.chapterPersonality, formData.data.chapterTitle, proofread);
        webSkel.currentUser.space.getDocument(this.documentId).notifyObservers("doc:chapter-brainstorming-page");
        webSkel.closeModal(_target);
    }
}
