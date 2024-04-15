import {parseURL} from "../../utils/index.js"
export class SummarizeChapterModal{
    constructor(element,invalidate){
        [this.documentId,this.chapterId,this.paragraphId]=parseURL();
        this._document = assistOS.space.getDocument(this.documentId);
        this._chapter=this._document.getChapter(this.chapterId);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
        this.chapterMainIdeas = [];
    }
    beforeRender(){
        let string = "";
        for(let idea of this.chapterMainIdeas){
            string += `<li>${assistOS.UI.sanitize(idea)}</li>`;
        }
        this.mainIdeas = string;
    }
    afterRender(){
        this.suggestedIdeasForm = this.element.querySelector(".suggested-ideas-form");
        if(this.chapterMainIdeas.length === 0){
            this.suggestedIdeasForm.style.display = "none";
        }
        let textBox = this.element.querySelector("#prompt");
        if(this.prompt){
            textBox.value = this.prompt;
        }
    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async generate(_target){
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        this.chapterMainIdeas = await assistOS.callFlow("SummarizeChapter", {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            prompt: this.prompt,
            maxTokens: ""
        });
        this.invalidate();
    }
    async addSelectedIdeas(_target) {
        await assistOS.callFlow("AcceptChapterIdeas", {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            ideas: this.chapterMainIdeas
        });
        this._document.notifyObservers(this._document.getNotificationId()+":manage-paragraphs-page");
        assistOS.UI.closeModal(_target);
    }
}