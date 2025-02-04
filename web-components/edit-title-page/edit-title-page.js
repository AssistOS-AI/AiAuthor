import {parseURL,getBasePath} from "../../utils/index.js"
export class EditTitlePage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender() {
        this._document = assistOS.space.getDocument(parseURL());
        this._document.observeChange(this._document.getNotificationId() + ":edit-title-page", this.invalidate);
        this.title = this._document.title;
        this.alternativeTitles = "";
        let i = 1;
        this._document.alternativeTitles.forEach((alternativeTitle) => {
            this.alternativeTitles += `<alternative-title data-nr="${i}" data-title="${assistOS.UI.sanitize(alternativeTitle.title)}" 
            data-id="${alternativeTitle.id}" ></alternative-title>`;
            i++;
        });
    }
    async editTitle(button) {
        let title = this.element.querySelector(".document-title");
        if (title.getAttribute("contenteditable") === "false") {
            title.setAttribute("contenteditable", "true");
            title.focus();
            let timer = assistOS.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = assistOS.UI.sanitize(title.innerText);
                if (sanitizedText !== this._document.title && !confirmationPopup) {
                    await assistOS.callFlow("UpdateDocumentTitle",  {
                        documentId: this._document.id,
                        title: sanitizedText
                    });
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
        assistOS.UI.closeModal(_target);
    }

    async showSuggestTitlesModal() {
        await assistOS.UI.showModal( "suggest-titles-modal", { presenter: "suggest-titles-modal"});
    }

    async edit(_target) {

        let component = assistOS.UI.reverseQuerySelector(_target, "alternative-title");
        let newTitle = component.querySelector(".suggested-title");

        if(this.actionBox){
            assistOS.UI.removeActionBox(this.actionBox, this);
        }
        if (newTitle.getAttribute("contenteditable") === "false") {

            let altTitleObj = this._document.getAlternativeTitle(component.getAttribute("data-id"));
            newTitle.setAttribute("contenteditable", "true");
            newTitle.focus();
            let timer = assistOS.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = assistOS.UI.sanitize(newTitle.innerText);
                if (sanitizedText !== altTitleObj.title && !confirmationPopup) {
                    await assistOS.callFlow("UpdateAlternativeDocumentTitle", {
                        documentId: this._document.id,
                        alternativeTitleId: altTitleObj.id,
                        text: sanitizedText
                    });
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
        let alternativeTitle = assistOS.UI.reverseQuerySelector(_target, "alternative-title");
        await assistOS.callFlow("DeleteAlternativeDocumentTitle", {
            documentId: this._document.id,
            alternativeTitleId: alternativeTitle.getAttribute("data-id")
        });
        this.invalidate();
    }
    async select(_target){
        let suggestedTitle = assistOS.UI.reverseQuerySelector(_target, "alternative-title");
        let suggestedTitleId = suggestedTitle.getAttribute("data-id");
        await assistOS.callFlow("SelectAlternativeDocumentTitle", {
            documentId: this._document.id,
            alternativeTitleId: suggestedTitleId
        });
        assistOS.UI.removeActionBox(this.actionBox, this);
        this.invalidate();
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    async openEditTitlePage() {
        await assistOS.UI.changeToDynamicPage("edit-title-page", `${getBasePath()}/edit-title-page/${this._document.id}`);
    }
    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await assistOS.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }
}