import {parseURL,getBasePath} from "../../utils/index.js"
export class EditAbstractPage {
    constructor(element, invalidate) {
        this.element=element;
        this._document = webSkel.currentUser.space.getDocument(parseURL());
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
            data-title="${ webSkel.sanitize(abstract.content)}" ></alternative-abstract>`;
            i++;
        });
    }



    async editAbstract(_target) {
        let abstract = this.element.querySelector(".abstract-content");
        if (abstract.getAttribute("contenteditable") === "false") {
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateAbstract");
            let timer = webSkel.appServices.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText =  webSkel.sanitize(abstract.innerText);
                if (sanitizedText !== this._document.abstract && !confirmationPopup) {
                    await webSkel.appServices.callFlow(flowId, this._document.id, sanitizedText);
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
        this.actionBox = await  webSkel.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    closeModal(_target) {
        webSkel.closeModal(_target);
    }

    async suggestAbstract(_target){
        await  webSkel.showModal("suggest-abstract-modal", { presenter: "suggest-abstract-modal"});
    }

    async select(_target){
        let suggestedAbstract= webSkel.reverseQuerySelector(_target,"alternative-abstract");
        let suggestedAbstractId = suggestedAbstract.getAttribute("data-id");
        let flowId = webSkel.currentUser.space.getFlowIdByName("SelectAlternativeAbstract");
        await webSkel.appServices.callFlow(flowId, this._document.id, suggestedAbstractId);
        webSkel.removeActionBox(this.actionBox, this);
        this.invalidate();
    }
    async edit(_target) {
        let component =  webSkel.reverseQuerySelector(_target, "alternative-abstract");
        let abstractText = component.querySelector(".content");
        if(this.actionBox){
            webSkel.removeActionBox(this.actionBox, this);
        }
        if (abstractText.getAttribute("contenteditable") === "false") {
            let alternativeAbstractId = component.getAttribute("data-id");
            let abstract = this._document.getAlternativeAbstract(alternativeAbstractId);
            abstractText.setAttribute("contenteditable", "true");
            abstractText.focus();
            let timer =webSkel.appServices.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText =  webSkel.sanitize(abstractText.innerText);
                let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateAlternativeAbstract");
                if (sanitizedText !== abstract.content && !confirmationPopup) {
                    await webSkel.appServices.callFlow(flowId, this._document.id, abstract.id, sanitizedText);
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
        let abstract = webSkel.reverseQuerySelector(_target, "alternative-abstract");
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteAlternativeAbstract");
        await webSkel.appServices.callFlow(flowId, this._document.id, abstract.getAttribute("data-id"));
        await documentFactory.updateDocument(webSkel.currentUser.space.id, this._document);
        this.invalidate();
    }
    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `${getBasePath()}/documents/${this._document.id}/edit-abstract-page`);
    }
    async openDocumentsPage() {
        await webSkel.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `${getBasePath()}/documents/${this._document.id}/document-view-page`);
    }
    async proofreadAbstract(){
        await webSkel.changeToDynamicPage("abstract-proofread-page", `${getBasePath()}/documents/${this._document.id}/abstract-proofread-page`);
    }
}

