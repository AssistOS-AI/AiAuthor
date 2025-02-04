import {parseURL} from "../../utils/index.js"
export class SummarizeParagraphModal{
    constructor(element,invalidate){
        [this.documentId,this.chapterId,this.paragraphId]=parseURL();
        this._document = assistOS.space.getDocument(this.documentId);
        this._chapter=this._document.getChapter(this.chapterId);
        this._paragraph=this._chapter.getParagraph(this.paragraphId);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
    }
    beforeRender(){}
    afterRender(){
        this.suggestedIdeaForm = this.element.querySelector(".suggested-idea-form");
        if(!this.paragraphMainIdea){
            this.suggestedIdeaForm.style.display = "none";
        }
        let textBox = this.element.querySelector("#prompt");
        if(this.prompt){
            textBox.value = this.prompt;
        }
    }
    async generate(_target){
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        this.paragraphMainIdea = await assistOS.callFlow("SummarizeParagraph", {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            paragraphId: this._paragraph.id,
            prompt: this.prompt,
            maxTokens: ""
        });
        this.invalidate();
    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
    async addSelectedMainIdea(_target) {
        await assistOS.callFlow("AcceptParagraphIdea", {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            paragraphId: this._paragraph.id,
            idea: this.paragraphMainIdea
        });
        this._document.notifyObservers(this._document.getNotificationId());
        assistOS.UI.closeModal(_target);
    }
}