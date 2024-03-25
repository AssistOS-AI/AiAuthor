import {parseURL} from "../../utils/index.js"
export class SummarizeDocumentModal{
    constructor(element,invalidate){
        let documentId = parseURL();
        this._document = system.space.getDocument(documentId);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
        this.documentMainIdeas = [];
    }
    beforeRender(){
        let string = "";
        for(let idea of this.documentMainIdeas){
            string += `<li>${system.UI.sanitize(idea)}</li>`;
        }
        this.mainIdeas = string;
    }
    afterRender(){
        this.suggestedIdeasForm = this.element.querySelector(".suggested-ideas-form");
        if(this.documentMainIdeas.length === 0){
            this.suggestedIdeasForm.style.display = "none";
        }
        let textBox = this.element.querySelector("#prompt");
        if(this.prompt){
            textBox.value = this.prompt;
        }
    }
    async generate(_target){
        let formInfo = await system.UI.extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        let flowId = system.space.getFlowIdByName("SummarizeDocument");
        let context = {
            documentId: this._document.id,
            prompt: this.prompt,
            maxTokens: ""
        }
        let result = await system.services.callFlow(flowId, context);
        this.documentMainIdeas = result;
        this.invalidate();
    }
    closeModal(_target) {
        system.UI.closeModal(_target);
    }
    async addSelectedIdeas(_target) {
        let flowId = system.space.getFlowIdByName("AcceptDocumentIdeas");
        let context = {
            documentId: this._document.id,
            ideas: this.documentMainIdeas
        }
        await system.services.callFlow(flowId, context);
        this._document.notifyObservers(this._document.getNotificationId() + ":manage-chapters-page");
        system.UI.closeModal(_target);
    }
}