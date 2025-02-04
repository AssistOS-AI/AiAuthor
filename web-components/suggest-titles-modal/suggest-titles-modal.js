import {parseURL} from "../../utils/index.js"
export class SuggestTitlesModal {
    constructor(element, invalidate) {
        this.id = parseURL();
        this._document = assistOS.space.getDocument(this.id);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
        this.suggestedTitles = [];
    }

    async generate(_target){
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        this.titlesNr = formInfo.data.nr;
        let result = await assistOS.callFlow("SuggestDocumentTitles", {
            documentId: this._document.id,
            prompt: this.prompt,
            titlesNr: this.titlesNr,
            maxTokens: ""
        });
        if(result){
            this.suggestedTitles = result;
            this.invalidate();
        }else {
            assistOS.UI.closeModal(this.element);
            await showApplicationError("Titles invalid format", "", "");
        }
    }
    beforeRender() {
        let stringHTML = "";
        let i = 0;
        for(let altTitle of this.suggestedTitles) {
            i++;
            altTitle = assistOS.UI.sanitize(altTitle);
            let id = assistOS.services.generateId();
            stringHTML += `
            <div class="alt-title-row">
                <span class="alt-title-span">${i}.</span>
                <label for="${id}" class="alt-title-label">${altTitle}</label>
                <input type="checkbox" id="${id}" name="${i+altTitle}" data-id="${id}" value="${altTitle}">
                
            </div>
            <hr class="suggest-titles-modal-hr">`;
        }
        this.suggestedTitles = stringHTML;
    }
    afterRender(){
        this.suggestedTitlesForm = this.element.querySelector(".suggested-titles-form");
        if(!this.suggestedTitles){
            this.suggestedTitlesForm.style.display = "none";
        }
        let textBox = this.element.querySelector("#prompt");
        if(this.prompt){
            textBox.value = this.prompt;
        }
        let inputNr = this.element.querySelector("#nr");
        if(this.titlesNr){
            inputNr.value = this.titlesNr;
        }
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async addAlternativeTitles(_target){
        let formInfo = await assistOS.UI.extractFormInformation(_target);
        let selectedTitles = [];
        for (const [key, value] of Object.entries(formInfo.elements)) {
            if(value.element.checked) {
                selectedTitles.push({title:assistOS.UI.sanitize(value.element.value)});
            }
        }
        await assistOS.callFlow("AddAlternativeDocumentTitles",  {
            documentId: this._document.id,
            selectedTitles: selectedTitles
        });
        this._document.notifyObservers(this._document.getNotificationId());
        assistOS.UI.closeModal(_target);
    }
}