
import {parseURL} from "../../utils/index.js"
export class SuggestAbstractModal {
    constructor(element, invalidate) {
        this.id = parseURL();
        this._document = system.space.getDocument(this.id);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
    }

    beforeRender() {}
    afterRender(){
        this.suggestedAbstractForm = this.element.querySelector(".suggested-abstract-form");
        if(!this.suggestedAbstract){
            this.suggestedAbstractForm.style.display = "none";
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
        let flowId = system.space.getFlowIdByName("SuggestAbstract");
        let context = {
            documentId: this._document.id,
            prompt: this.prompt,
            maxTokens: ""
        }
        let result = await system.services.callFlow(flowId, context);
        this.suggestedAbstract = result;
        this.invalidate();
    }
    async addSelectedAbstract(_target) {
        let flowId = system.space.getFlowIdByName("AcceptSuggestedAbstract");
        let context = {
            documentId: this._document.id,
            abstract: this.suggestedAbstract
        }
        await system.services.callFlow(flowId, context);
        this._document.notifyObservers(this._document.getNotificationId());
        system.UI.closeModal(_target);
    }
}