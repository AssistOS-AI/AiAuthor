import {parseURL} from "../../utils/index.js"
export class SuggestParagraphModal {
    constructor(element, invalidate) {
        let documentId, chapterId, paragraphId;
        [documentId, chapterId, paragraphId] = parseURL();
        this._document = assistOS.space.getDocument(documentId);
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
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        let result = await assistOS.callFlow("SuggestParagraph", {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            prompt: this.prompt,
        });
        this.suggestedParagraph = result.text;
        this.suggestedParagraphIdea = result.mainIdea;
        this.invalidate();
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async addSelectedParagraph(_target) {
        let altParagraphData = {
            text:assistOS.UI.sanitize(this.suggestedParagraph),
            id:assistOS.services.generateId(),
            mainIdea:assistOS.UI.sanitize(this.suggestedParagraphIdea)
        };
        await assistOS.callFlow("AcceptSuggestedParagraph",{
            documentId: this._document.id,
            chapterId: this._chapter.id,
            paragraphId: this._paragraph.id,
            alternativeParagraph: altParagraphData
             });
        this._document.notifyObservers(this._document.getNotificationId());
        assistOS.UI.closeModal(_target);
    }
}