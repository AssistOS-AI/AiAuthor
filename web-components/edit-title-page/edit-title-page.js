import {parseURL,getBasePath} from "../../utils/index.js"
export class EditTitlePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this._document = system.space.getDocument(parseURL());
        this._document.observeChange(this._document.getNotificationId() + ":edit-title-page", this.invalidate);
        this.title = this._document.title;
        this.alternativeTitles = "";
        let i = 1;
        this._document.alternativeTitles.forEach((alternativeTitle) => {
            this.alternativeTitles += `<alternative-title data-nr="${i}" data-title="${system.UI.sanitize(alternativeTitle.title)}" 
            data-id="${alternativeTitle.id}" ></alternative-title>`;
            i++;
        });
    }
    async editTitle(button) {
        let title = this.element.querySelector(".document-title");
        if (title.getAttribute("contenteditable") === "false") {
            title.setAttribute("contenteditable", "true");
            title.focus();
            let flowId = system.space.getFlowIdByName("UpdateDocumentTitle");
            let timer = system.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = system.UI.sanitize(title.innerText);
                if (sanitizedText !== this._document.title && !confirmationPopup) {
                    let context = {
                        documentId: this._document.id,
                        title: sanitizedText
                    }
                    await system.services.callFlow(flowId, context);
                    title.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${title.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            title.addEventListener("blur", async () => {
                title.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                title.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            title.addEventListener("keydown", resetTimer);
        }
    }



    closeModal(_target) {
        system.UI.closeModal(_target);
    }

    async showSuggestTitlesModal() {
        await system.UI.showModal( "suggest-titles-modal", { presenter: "suggest-titles-modal"});
    }

    async edit(_target) {

        let component = system.UI.reverseQuerySelector(_target, "alternative-title");
        let newTitle = component.querySelector(".suggested-title");

        if(this.actionBox){
            system.UI.removeActionBox(this.actionBox, this);
        }
        if (newTitle.getAttribute("contenteditable") === "false") {

            let altTitleObj = this._document.getAlternativeTitle(component.getAttribute("data-id"));
            newTitle.setAttribute("contenteditable", "true");
            newTitle.focus();
            let timer = system.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = system.UI.sanitize(newTitle.innerText);
                if (sanitizedText !== altTitleObj.title && !confirmationPopup) {
                    let flowId = system.space.getFlowIdByName("UpdateAlternativeDocumentTitle");
                    let context = {
                        documentId: this._document.id,
                        alternativeTitleId: altTitleObj.id,
                        text: sanitizedText
                    }
                    await system.services.callFlow(flowId, context);
                    newTitle.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${newTitle.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            newTitle.addEventListener("blur", async () => {
                newTitle.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                newTitle.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            newTitle.addEventListener("keydown", resetTimer);
        }
    }

    async delete(_target) {
        let alternativeTitle = system.UI.reverseQuerySelector(_target, "alternative-title");
        let flowId = system.space.getFlowIdByName("DeleteAlternativeDocumentTitle");
        let context = {
            documentId: this._document.id,
            alternativeTitleId: alternativeTitle.getAttribute("data-id")
        };
        await system.services.callFlow(flowId, context);
        this.invalidate();
    }
    async select(_target){
        let suggestedTitle = system.UI.reverseQuerySelector(_target, "alternative-title");
        let suggestedTitleId = suggestedTitle.getAttribute("data-id");
        let flowId = system.space.getFlowIdByName("SelectAlternativeDocumentTitle");
        let context = {
            documentId: this._document.id,
            alternativeTitleId: suggestedTitleId
        }
        await system.services.callFlow(flowId, context);
        system.UI.removeActionBox(this.actionBox, this);
        this.invalidate();
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await system.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    async openEditTitlePage() {
        await system.UI.changeToDynamicPage("edit-title-page", `${getBasePath()}/edit-title-page/${this._document.id}`);
    }
    async openDocumentsPage() {
        await system.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await system.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }
}