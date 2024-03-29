import {parseURL,getBasePath} from "../../utils/index.js"
export class ParagraphBrainstormingPage {
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId, paragraphId;
        [documentId, chapterId, paragraphId] = parseURL();
        this._document = system.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._paragraph = this._chapter.getParagraph(paragraphId);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.docTitle=this._document.title;
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.paragraphNr = this._chapter.paragraphs.findIndex(paragraph => paragraph.id === this._paragraph.id) + 1;
        this.paragraphText = this._paragraph.text;
        this.paragraphMainIdea = this._paragraph.getMainIdea();

        this.alternativeParagraphs= "";
        let number = 0;
        this._paragraph.alternativeParagraphs.forEach((item) => {
            number++;
            this.alternativeParagraphs += `<alternative-paragraph data-id="${item.id}"
            data-nr="${number}" data-text="${item.text}"></alternative-paragraph>`;
        });
    }

    limitMainIdeaText(event){
        let maxLength = 80;
        if (event.target.innerText.length > maxLength) {
            const selection = window.getSelection();
            const range = document.createRange();

            // Truncate the text and update the element
            event.target.innerText = event.target.innerText.substring(0, maxLength);

            // Restore the cursor position to the end of the text
            range.setStart(event.target.firstChild, event.target.innerText.length);
            range.setEnd(event.target.firstChild, event.target.innerText.length);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
    async editItem(_target, itemName) {
        let item;
        if(itemName === "mainIdea"){
            item = this.element.querySelector(".main-idea-content");
            item.addEventListener("input", this.limitMainIdeaText);
        }else {
            item = this.element.querySelector(".paragraph-content");
        }
        if (item.getAttribute("contenteditable") === "false") {
            item.setAttribute("contenteditable", "true");
            item.focus();
            let flowId = system.space.getFlowIdByName("UpdateParagraphMainIdea");
            let timer = system.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = system.UI.sanitize(item.innerText);
                if(itemName === "mainIdea"){
                    if (sanitizedText !== this._paragraph.mainIdea && !confirmationPopup) {
                        let context = {
                            documentId: this._document.id,
                            chapterId: this._chapter.id,
                            paragraphId: this._paragraph.id,
                            idea: sanitizedText
                        }
                        await system.services.callFlow(flowId, context);
                        item.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                        data-message="Saved!" data-left="${item.offsetWidth/2}"></confirmation-popup>`);
                    }
                }else {
                    if(sanitizedText !== this._paragraph.text && !confirmationPopup){
                        let flowId = system.space.getFlowIdByName("UpdateParagraphText");
                        let context = {
                            documentId: this._document.id,
                            chapterId: this._chapter.id,
                            paragraphId: this._paragraph.id,
                            text: sanitizedText
                        }
                        await system.services.callFlow(flowId, context);
                        item.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                        data-message="Saved!" data-left="${item.offsetWidth/2}"></confirmation-popup>`);
                    }
                }

            }, 1000);
            item.addEventListener("blur", async () => {
                item.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                item.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            item.addEventListener("keydown", resetTimer);
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

    async openChapterBrainStormingPage(){
        await system.UI.changeToDynamicPage("chapter-brainstorming-page", `${getBasePath()}/chapter-brainstorming-page/${this._document.id}/chapters/${this._chapter.id}`);
    }

    async openParagraphProofreadPage(){
        await system.UI.changeToDynamicPage("paragraph-proofread-page", `${getBasePath()}/paragraph-proofread-page/${this._document.id}/chapters/${this._chapter.id}/paragraphs/${this._paragraph.id}`);
    }
    async openChapterEditorPage() {
        await system.UI.changeToDynamicPage("chapter-editor-page", `${getBasePath()}/chapter-editor-page/${this._document.id}/chapters/${this._chapter.id}`);
    }

    async summarize(){
        await system.UI.showModal( "summarize-paragraph-modal", { presenter: "summarize-paragraph-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await system.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async edit(_target){
        let component = system.UI.reverseQuerySelector(_target, "alternative-paragraph");
        let paragraph = component.querySelector(".content");
        if(this.actionBox){
            system.UI.removeActionBox(this.actionBox, this);
        }
        if (paragraph.getAttribute("contenteditable") === "false") {
            let paragraphId = component.getAttribute("data-id");
            let currentAltParagraph = this._paragraph.getAlternativeParagraph(paragraphId);
            paragraph.setAttribute("contenteditable", "true");
            paragraph.focus();
            let timer = system.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = system.UI.sanitize(paragraph.innerText);
                if (sanitizedText !== currentAltParagraph.text && !confirmationPopup) {
                    let flowId = system.space.getFlowIdByName("UpdateAlternativeParagraph");
                    let context = {
                        documentId: this._document.id,
                        chapterId: this._chapter.id,
                        paragraphId: this._paragraph.id,
                        alternativeParagraphId: currentAltParagraph.id,
                        text: sanitizedText
                    }
                    await system.services.callFlow(flowId, context);
                    paragraph.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${paragraph.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            paragraph.addEventListener("blur", async () => {
                paragraph.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                paragraph.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            paragraph.addEventListener("keydown", resetTimer);
        }
    }
    async delete(_target){
        let paragraph = system.UI.reverseQuerySelector(_target, "alternative-paragraph");
        let paragraphId = paragraph.getAttribute("data-id");
        let flowId = system.space.getFlowIdByName("DeleteAlternativeParagraph");
        let context = {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            paragraphId: this._paragraph.id,
            alternativeParagraphId: paragraphId
        }
        await system.services.callFlow(flowId, context);
        this.invalidate();
    }

    async select(_target){
        let paragraphElement = system.UI.reverseQuerySelector(_target,"alternative-paragraph");
        let alternativeParagraphId = paragraphElement.getAttribute("data-id");
        let flowId = system.space.getFlowIdByName("SelectAlternativeParagraph");
        let context = {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            paragraphId: this._paragraph.id,
            alternativeParagraphId: alternativeParagraphId
        }
        await system.services.callFlow(flowId, context);
        this.invalidate();
        system.UI.removeActionBox(this.actionBox, this);

    }
}