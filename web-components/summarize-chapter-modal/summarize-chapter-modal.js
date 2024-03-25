import {parseURL} from "../../utils/index.js"
export class SummarizeChapterModal{
    constructor(element,invalidate){
        [this.documentId,this.chapterId,this.paragraphId]=parseURL();
        this._document = system.space.getDocument(this.documentId);
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
            string += `<li>${system.UI.sanitize(idea)}</li>`;
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
        system.UI.closeModal(_target);
    }

    async generate(_target){
        let formInfo = await system.UI.extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        let flowId = system.space.getFlowIdByName("SummarizeChapter");
        let context = {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            prompt: this.prompt,
            maxTokens: ""
        }
        let result = await system.services.callFlow(flowId, context);
        this.chapterMainIdeas = result;
        this.invalidate();
    }
    async addSelectedIdeas(_target) {
        let flowId = system.space.getFlowIdByName("AcceptChapterIdeas");
        let context = {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            ideas: this.chapterMainIdeas
        }
        await system.services.callFlow(flowId, context);
        this._document.notifyObservers(this._document.getNotificationId()+":manage-paragraphs-page");
        system.UI.closeModal(_target);
    }
}