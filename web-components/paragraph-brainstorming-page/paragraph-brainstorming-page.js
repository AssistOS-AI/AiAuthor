export class paragraphBrainstormingPage {
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId, paragraphId;
        [documentId, chapterId, paragraphId] = webSkel.getService("UtilsService").parseURL();
        this._document = webSkel.currentUser.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._paragraph = this._chapter.getParagraph(paragraphId);
        this._document.observeChange(this._document.getNotificationId(), invalidate);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
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
            let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateParagraphMainIdea");
            let timer = webSkel.getService("UtilsService").SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = webSkel.UtilsService.sanitize(item.innerText);
                if(itemName === "mainIdea"){
                    if (sanitizedText !== this._paragraph.mainIdea && !confirmationPopup) {
                        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, this._paragraph.id, sanitizedText);
                        item.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                        data-message="Saved!" data-left="${item.offsetWidth/2}"></confirmation-popup>`);
                    }
                }else {
                    if(sanitizedText !== this._paragraph.text && !confirmationPopup){
                        let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateParagraphText");
                        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, this._paragraph.id, sanitizedText);
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
        await webSkel.UtilsService.showModal(document.querySelector("body"), "suggest-paragraph-modal", { presenter: "suggest-paragraph-modal"});
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async openChapterBrainStormingPage(){
        await webSkel.changeToDynamicPage("chapter-brainstorming-page", `documents/${this._document.id}/chapter-brainstorming-page/${this._chapter.id}`);
    }

    async openParagraphProofreadPage(){
        await webSkel.changeToDynamicPage("paragraph-proofread-page", `documents/${this._document.id}/paragraph-proofread-page/${this._chapter.id}/${this._paragraph.id}`);
    }

    async summarize(){
        await webSkel.UtilsService.showModal(document.querySelector("body"), "summarize-paragraph-modal", { presenter: "summarize-paragraph-modal"});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        this.actionBox = await webSkel.UtilsService.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async edit(_target){
        let component = webSkel.UtilsService.reverseQuerySelector(_target, "alternative-paragraph");
        let paragraph = component.querySelector(".content");
        if(this.actionBox){
            webSkel.UtilsService.removeActionBox(this.actionBox, this);
        }
        if (paragraph.getAttribute("contenteditable") === "false") {
            let paragraphId = component.getAttribute("data-id");
            let currentAltParagraph = this._paragraph.getAlternativeParagraph(paragraphId);
            paragraph.setAttribute("contenteditable", "true");
            paragraph.focus();
            let timer = webSkel.getService("UtilsService").SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = webSkel.UtilsService.sanitize(paragraph.innerText);
                if (sanitizedText !== currentAltParagraph.text && !confirmationPopup) {
                    let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateAlternativeParagraph");
                    await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, this._paragraph.id, currentAltParagraph.id, sanitizedText);
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
        let paragraph = webSkel.UtilsService.reverseQuerySelector(_target, "alternative-paragraph");
        let paragraphId = paragraph.getAttribute("data-id");
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteAlternativeParagraph");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, this._paragraph.id, paragraphId);
        this.invalidate();
    }

    async select(_target){
        let paragraphElement = webSkel.UtilsService.reverseQuerySelector(_target,"alternative-paragraph");
        let alternativeParagraphId = paragraphElement.getAttribute("data-id");
        let flowId = webSkel.currentUser.space.getFlowIdByName("SelectAlternativeParagraph");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, this._paragraph.id, alternativeParagraphId);
        this.invalidate();
        webSkel.UtilsService.removeActionBox(this.actionBox, this);

    }
}