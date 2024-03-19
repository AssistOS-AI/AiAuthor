import {parseURL,getBasePath} from "../../utils/index.js"
export class EditAbstractPage {
    constructor(element, invalidate) {
        this.element=element;
        this._document = system.space.getDocument(parseURL());
        this._document.observeChange(this._document.getNotificationId()+ ":edit-abstract-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();

    }

    beforeRender() {
        this.abstractText=this._document.abstract;
        this.docTitle=this._document.title;
        this.alternativeAbstracts = "";
        let i = 1;
        this._document.alternativeAbstracts.forEach((abstract)=>{
            this.alternativeAbstracts += `<alternative-abstract data-nr="${i}" data-id="${abstract.id}" 
            data-title="${ system.UI.sanitize(abstract.content)}" ></alternative-abstract>`;
            i++;
        });
    }



    async editAbstract(_target) {
        let abstract = this.element.querySelector(".abstract-content");
        if (abstract.getAttribute("contenteditable") === "false") {
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            let flowId = system.space.getFlowIdByName("UpdateAbstract");
            let timer = system.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText =  system.UI.sanitize(abstract.innerText);
                if (sanitizedText !== this._document.abstract && !confirmationPopup) {
                    await system.services.callFlow(flowId, this._document.id, sanitizedText);
                    abstract.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${abstract.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            abstract.addEventListener("blur", async () => {
                abstract.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                abstract.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            abstract.addEventListener("keydown", resetTimer);
        }
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await  system.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    closeModal(_target) {
        system.UI.closeModal(_target);
    }

    async suggestAbstract(_target){
        await  system.UI.showModal("suggest-abstract-modal", { presenter: "suggest-abstract-modal"});
    }

    async select(_target){
        let suggestedAbstract= system.UI.reverseQuerySelector(_target,"alternative-abstract");
        let suggestedAbstractId = suggestedAbstract.getAttribute("data-id");
        let flowId = system.space.getFlowIdByName("SelectAlternativeAbstract");
        await system.services.callFlow(flowId, this._document.id, suggestedAbstractId);
        system.UI.removeActionBox(this.actionBox, this);
        this.invalidate();
    }
    async edit(_target) {
        let component =  system.UI.reverseQuerySelector(_target, "alternative-abstract");
        let abstractText = component.querySelector(".content");
        if(this.actionBox){
            system.UI.removeActionBox(this.actionBox, this);
        }
        if (abstractText.getAttribute("contenteditable") === "false") {
            let alternativeAbstractId = component.getAttribute("data-id");
            let abstract = this._document.getAlternativeAbstract(alternativeAbstractId);
            abstractText.setAttribute("contenteditable", "true");
            abstractText.focus();
            let timer =system.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText =  system.UI.sanitize(abstractText.innerText);
                let flowId = system.space.getFlowIdByName("UpdateAlternativeAbstract");
                if (sanitizedText !== abstract.content && !confirmationPopup) {
                    await system.services.callFlow(flowId, this._document.id, abstract.id, sanitizedText);
                    abstractText.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${abstractText.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            abstractText.addEventListener("blur", async () => {
                abstractText.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                abstractText.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            abstractText.addEventListener("keydown", resetTimer);
        }
    }

    async delete(_target) {
        let abstract = system.UI.reverseQuerySelector(_target, "alternative-abstract");
        let flowId = system.space.getFlowIdByName("DeleteAlternativeAbstract");
        await system.services.callFlow(flowId, this._document.id, abstract.getAttribute("data-id"));
        await system.factories.updateDocument(system.space.id, this._document);
        this.invalidate();
    }
    async openEditAbstractPage() {
        await system.UI.changeToDynamicPage("edit-abstract-page", `${getBasePath()}/edit-abstract-page/${this._document.id}`);
    }
    async openDocumentsPage() {
        await system.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await system.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }
    async proofreadAbstract(){
        await system.UI.changeToDynamicPage("abstract-proofread-page", `${getBasePath()}/abstract-proofread-page/${this._document.id}`);
    }
}

