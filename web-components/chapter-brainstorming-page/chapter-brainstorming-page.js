import {parseURL,getBasePath} from "../../utils/index.js"
//import {Chapter} from "../../../../../../wallet/imports.js";
export class ChapterBrainstormingPage {
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId;
        [documentId,chapterId] = parseURL();
        this._document = system.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._document.observeChange(this._document.getNotificationId() + ":chapter-brainstorming-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.docTitle=this._document.title;
        this.chapterNr=this._document.getChapterIndex(this._chapter.id)+1;
        this.chapterTitle=this._chapter.title;
        this.chapterContent="";
        this.alternativeChapters = "";
        let alternativeChapterText = "";
        let number = 0;
        this._chapter.paragraphs.forEach((item) => {
            number++;
            this.chapterContent += `<reduced-paragraph-unit data-local-action="openParagraphBrainstormingPage" data-id="${item.id}" data-local-action="editAction"
            data-nr="${number}" data-text="${item.text}"></reduced-paragraph-unit>`;
        });
        this._chapter.alternativeChapters.forEach((item) => {
            alternativeChapterText = "";
            item.paragraphs.forEach((paragraph) => {
                alternativeChapterText+=paragraph.text;
            })
            this.alternativeChapters += `<alternative-chapter data-text="${alternativeChapterText}" data-id="${item.id}"></alternative-chapter>`;
        });
    }

    async enterEditMode(_target) {
        let title = system.UI.reverseQuerySelector(_target, ".main-idea-title");
        title.setAttribute("contenteditable", "true");
        title.focus();
        const controller = new AbortController();
        document.addEventListener("click", this.exitEditMode.bind(this, title, controller), {signal:controller.signal});
    }
    async exitEditMode (title, controller, event) {
        if (title.getAttribute("contenteditable") === "true" && title !== event.target && !title.contains(event.target)) {
            title.setAttribute("contenteditable", "false");
            let flowId = system.space.getFlowIdByName("UpdateChapterTitle");
            let context = {
                documentId: this._document.id,
                chapterId: this._chapter.id,
                title: title.innerText
            }
            await system.services.callFlow(flowId, context);
            title.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
            data-message="Saved!" data-left="${title.offsetWidth/2}"></confirmation-popup>`);
            controller.abort();
        }
    }

    async suggestParagraph(){
        await system.UI.showModal( "suggest-paragraph-modal", { presenter: "suggest-paragraph-modal"});
    }

    async openDocumentsPage() {
        await system.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await system.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }

    async openChapterEditorPage(){
        await system.UI.changeToDynamicPage("chapter-editor-page", `${getBasePath()}/chapter-editor-page/${this._document.id}/chapters/${this._chapter.id}`);

    }
    async openChapterBrainstormingPage(){
        await system.UI.changeToDynamicPage("chapter-brainstorming-page", `${getBasePath()}/chapter-brainstorming-page/${this._document.id}/chapters/${this._chapter.id}`);

    }
    async openChapterProofreadPage(){
    }
    async suggestChapter(){
        let flowId = system.space.getFlowIdByName("SuggestChapter");
        let result = await system.services.callFlow(flowId, JSON.stringify(this._chapter.mainIdeas));
        let chapterObj=result.responseJson;
        let flowId2 = system.space.getFlowIdByName("AddAlternativeChapter");
        let context = {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            alternativeChapter: chapterObj
        }
        await system.services.callFlow(flowId2, context);
        this.invalidate();
    }
    async openCloneChapterModal(){
        await system.UI.showModal( "clone-chapter-modal", { presenter: "clone-chapter-modal"});

    }
    async openParagraphBrainstormingPage(_target) {
        system.space.currentParagraphId = system.UI.reverseQuerySelector(_target, "reduced-paragraph-unit").getAttribute("data-id");
        await system.UI.changeToDynamicPage("paragraph-brainstorming-page",
            `${getBasePath()}/paragraph-brainstorming-page/${this._document.id}/chapters/${this._chapter.id}/paragraphs/${system.space.currentParagraphId}`);
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await system.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async editAction(_target){
        await this.openParagraphBrainstormingPage(_target);
    }
    async deleteAction(_target){
        let paragraph = system.UI.reverseQuerySelector(_target, "reduced-paragraph-unit");
        let paragraphId = paragraph.getAttribute("data-id");
        let flowId = system.space.getFlowIdByName("DeleteParagraph");
        let context = {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            paragraphId: paragraphId
        }
        await system.services.callFlow(flowId, context);
        this.invalidate();
    }
    async delete(_target){
        let alternativeChapter = system.UI.reverseQuerySelector(_target, "alternative-chapter");
        let alternativeChapterId = alternativeChapter.getAttribute("data-id");
        let flowId = system.space.getFlowIdByName("DeleteAlternativeChapter");
        await system.services.callFlow(flowId, this._document.id, this._chapter.id, alternativeChapterId);
        this.invalidate();
    }
    async select(_target){
        let alternativeChapter = system.UI.reverseQuerySelector(_target, "alternative-chapter");
        let alternativeChapterId = alternativeChapter.getAttribute("data-id");
        let flowId = system.space.getFlowIdByName("SelectAlternativeChapter");
        await system.services.callFlow(flowId, this._document.id, this._chapter.id, alternativeChapterId);
        system.UI.removeActionBox(this.actionBox, this);
        system.space.currentChapterId = alternativeChapterId;
        await system.UI.changeToDynamicPage("chapter-brainstorming-page", `${getBasePath()}/chapter-brainstorming-page/${this._document.id}/chapters/${alternativeChapterId}`);
    }
}