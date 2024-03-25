import {parseURL} from "../../utils/index.js"
export class SuggestParagraphModal {
    constructor(element, invalidate) {
        let documentId, chapterId, paragraphId;
        [documentId, chapterId, paragraphId] = parseURL();
        this._document = system.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._paragraph = this._chapter.getParagraph(paragraphId);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
    }

    beforeRender() {

    }
    afterRender(){
        this.suggestedParagraphForm = this.element.querySelector(".suggested-paragraph-form");
        if(!this.suggestedParagraph){
            this.suggestedParagraphForm.style.display = "none";
        }
        let textBox = this.element.querySelector("#prompt");
        if(this.prompt){
            textBox.value = this.prompt;
        }
    }

    async generate(_target){
        let formInfo = await system.UI.extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        let flowId = system.space.getFlowIdByName("SuggestParagraph");
        let context = {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            prompt: this.prompt,
        }
        let result = await system.services.callFlow(flowId, context);
        this.suggestedParagraph = result.responseJson.text;
        this.suggestedParagraphIdea = result.responseJson.mainIdea;
        this.invalidate();
    }

    closeModal(_target) {
        system.UI.closeModal(_target);
    }

    async addSelectedParagraph(_target) {
        let altParagraphData = {text:system.UI.sanitize(this.suggestedParagraph),
            id:system.services.generateId(), mainIdea:system.UI.sanitize(this.suggestedParagraphIdea) };
        let flowId = system.space.getFlowIdByName("AcceptSuggestedParagraph");
        let context = {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            paragraphId: this._paragraph.id,
            paragraphData: altParagraphData
        }
        await system.services.callFlow(flowId, context);
        this._document.notifyObservers(this._document.getNotificationId());
        system.UI.closeModal(_target);
    }
}