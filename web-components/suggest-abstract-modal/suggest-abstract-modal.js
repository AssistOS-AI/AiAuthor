
import {parseURL} from "../../utils/index.js"
export class SuggestAbstractModal {
    constructor(element, invalidate) {
        this.id = parseURL();
        this._document = assistOS.space.getDocument(this.id);
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
        assistOS.UI.closeModal(_target);
    }

    async generate(_target){
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        this.suggestedAbstract = await assistOS.callFlow("SuggestAbstract", {
            documentId: this._document.id,
            prompt: this.prompt,
            maxTokens: ""
        });
        this.invalidate();
    }
    async addSelectedAbstract(_target) {
        await assistOS.callFlow("AcceptSuggestedAbstract",  {
            documentId: this._document.id,
            abstract: this.suggestedAbstract
        });
        this._document.notifyObservers(this._document.getNotificationId());
        assistOS.UI.closeModal(_target);
    }
}