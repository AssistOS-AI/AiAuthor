import {parseURL,getBasePath} from "../../utils/index.js"
export class ChapterTitlePage {
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId;
        [documentId,chapterId] = parseURL();
        this._document = system.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._document.observeChange(this._document.getNotificationId() + "chapter-title-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.title = this._chapter.title;
        this.docTitle=this._document.title;
        this.chapterNr = this._document.getChapterIndex(this._chapter.id) + 1;
        this.alternativeTitles = "";
        if (this._chapter.alternativeTitles) {
            for (let i = 0; i < this._chapter.alternativeTitles.length; i++) {
                this.alternativeTitles += `<alternative-title data-nr="${i + 1}" data-title="${this._chapter.alternativeTitles[i].title}" 
                data-id="${this._chapter.alternativeTitles[i].id}"></alternative-title>`;
            }
        }
    }

    async saveTitle(_target) {
        const formInfo = await system.UI.extractFormInformation(_target);
        if(formInfo.isValid) {
            const documentIndex = system.space.documents.findIndex(doc => doc.id === this.docId);
            const chapterIndex = this._document.getChapterIndex(this.chapterId);
            if (documentIndex !== -1 && chapterIndex !== -1 && formInfo.data.title !== this._document.getChapterTitle(this.chapterId)) {
                let flowId = system.space.getFlowIdByName("UpdateChapterTitle");
                await system.services.callFlow(flowId, this._document.id, this._chapter.id, formInfo.data.title);
            }
        }
    }

    async editTitle(button) {
        let title = this.element.querySelector(".chapter-title");
        if (title.getAttribute("contenteditable") === "false") {
            title.setAttribute("contenteditable", "true");
            title.focus();
            let timer = system.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = system.UI.sanitize(title.innerText);
                if (sanitizedText !== this._chapter.title && !confirmationPopup) {
                    let flowId = system.space.getFlowIdByName("UpdateChapterTitle");
                    await system.services.callFlow(flowId, this._document.id, this._chapter.id, sanitizedText);
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

    async edit(_target) {
        let component = system.UI.reverseQuerySelector(_target, "alternative-title");
        let newTitle = component.querySelector(".suggested-title");

        if(this.actionBox){
            system.UI.removeActionBox(this.actionBox, this);
        }
        if (newTitle.getAttribute("contenteditable") === "false") {

            let altTitleObj = this._chapter.getAlternativeTitle(component.getAttribute("data-id"));
            newTitle.setAttribute("contenteditable", "true");
            newTitle.focus();
            let flowId = system.space.getFlowIdByName("UpdateAlternativeChapterTitle");
            let timer = system.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = system.UI.sanitize(newTitle.innerText);
                if (sanitizedText !== altTitleObj.title && !confirmationPopup) {
                    await system.services.callFlow(flowId, this._document.id, this._chapter.id, altTitleObj.id, sanitizedText);
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
        let flowId = system.space.getFlowIdByName("DeleteAlternativeChapterTitle");
        await system.services.callFlow(flowId, this._document.id, this._chapter.id, alternativeTitle.getAttribute("data-id"));
        this.invalidate();
    }
    async select(_target){
        let suggestedTitle = system.UI.reverseQuerySelector(_target, "alternative-title");
        let suggestedTitleId = suggestedTitle.getAttribute("data-id");
        let flowId = system.space.getFlowIdByName("SelectAlternativeChapterTitle");
        await system.services.callFlow(flowId, this._document.id, this._chapter.id, suggestedTitleId);
        this.invalidate();
    }
    async openDocumentsPage() {
        await system.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await system.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }
    async openChapterTitlePage() {
        await system.UI.changeToDynamicPage("chapter-title-page",
            `${getBasePath()}/chapter-title-page/${this._document.id}/chapters/${this._chapter.id}`);

    }
    async openChapterEditorPage(){
        await system.UI.changeToDynamicPage("chapter-editor-page",
            `${getBasePath()}/chapter-editor-page/${this._document.id}/chapters/${this._chapter.id}`);
    }
    
    closeModal(_target) {
        system.UI.closeModal(_target);
    }

    async showSuggestChapterTitlesModal() {
        await system.UI.showModal( "suggest-chapter-titles-modal", { presenter: "suggest-chapter-titles-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await system.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}