import {parseURL,getBasePath} from "../../utils/index.js"
export class EditAbstractPage {
    constructor(element, invalidate) {
        this.element=element;
        this._document = assistOS.space.getDocument(parseURL());
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
            data-title="${ assistOS.UI.sanitize(abstract.content)}" ></alternative-abstract>`;
            i++;
        });
    }



    async editAbstract(_target) {
        let abstract = this.element.querySelector(".abstract-content");
        if (abstract.getAttribute("contenteditable") === "false") {
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            let timer = assistOS.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText =  assistOS.UI.sanitize(abstract.innerText);
                if (sanitizedText !== this._document.abstract && !confirmationPopup) {
                    await assistOS.callFlow("UpdateAbstract", {
                        documentId: this._document.id,
                        text: sanitizedText
                    });
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
        this.actionBox = await  assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async suggestAbstract(_target){
        await  assistOS.UI.showModal("suggest-abstract-modal", { presenter: "suggest-abstract-modal"});
    }

    async select(_target){
        let suggestedAbstract= assistOS.UI.reverseQuerySelector(_target,"alternative-abstract");
        let suggestedAbstractId = suggestedAbstract.getAttribute("data-id");
        await assistOS.callFlow("SelectAlternativeAbstract", {
            documentId: this._document.id,
            alternativeAbstractId: suggestedAbstractId
        });
        assistOS.UI.removeActionBox(this.actionBox, this);
        this.invalidate();
    }
    async edit(_target) {
        let component =  assistOS.UI.reverseQuerySelector(_target, "alternative-abstract");
        let abstractText = component.querySelector(".content");
        if(this.actionBox){
            assistOS.UI.removeActionBox(this.actionBox, this);
        }
        if (abstractText.getAttribute("contenteditable") === "false") {
            let alternativeAbstractId = component.getAttribute("data-id");
            let abstract = this._document.getAlternativeAbstract(alternativeAbstractId);
            abstractText.setAttribute("contenteditable", "true");
            abstractText.focus();
            let timer =assistOS.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText =  assistOS.UI.sanitize(abstractText.innerText);
                if (sanitizedText !== abstract.content && !confirmationPopup) {
                    await assistOS.callFlow("UpdateAlternativeAbstract", {
                        documentId: this._document.id,
                        abstractId: abstract.id,
                        text: sanitizedText
                    });
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
        let abstract = assistOS.UI.reverseQuerySelector(_target, "alternative-abstract");
        await assistOS.callFlow("DeleteAlternativeAbstract", {
            documentId: this._document.id,
            alternativeAbstractId: abstract.getAttribute("data-id")
        });
        await assistOS.factories.updateDocument(assistOS.space.id, this._document);
        this.invalidate();
    }
    async openEditAbstractPage() {
        await assistOS.UI.changeToDynamicPage("edit-abstract-page", `${getBasePath()}/edit-abstract-page/${this._document.id}`);
    }
    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await assistOS.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }
    async proofreadAbstract(){
        await assistOS.UI.changeToDynamicPage("abstract-proofread-page", `${getBasePath()}/abstract-proofread-page/${this._document.id}`);
    }
}

