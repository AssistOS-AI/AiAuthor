import {parseURL} from "../../utils/index.js"
export class SummarizeDocumentModal{
    constructor(element,invalidate){
        let documentId = parseURL();
        this._document = assistOS.space.getDocument(documentId);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
        this.documentMainIdeas = [];
    }
    beforeRender(){
        let string = "";
        for(let idea of this.documentMainIdeas){
            string += `<li>${assistOS.UI.sanitize(idea)}</li>`;
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
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        this.documentMainIdeas = await assistOS.callFlow("SummarizeDocument", {
            documentId: this._document.id,
            prompt: this.prompt,
            maxTokens: ""
        });
        this.invalidate();
    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
    async addSelectedIdeas(_target) {
        await assistOS.callFlow("AcceptDocumentIdeas", {
            documentId: this._document.id,
            ideas: this.documentMainIdeas
        });
        this._document.notifyObservers(this._document.getNotificationId() + ":manage-chapters-page");
        assistOS.UI.closeModal(_target);
    }
}