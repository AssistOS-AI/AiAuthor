export class manageChaptersPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = webSkel.currentUser.space.getDocument(webSkel.getService("UtilsService").parseURL());
        this.invalidate = invalidate;
        this.invalidate();
        this._document.observeChange(this._document.getNotificationId() + ":manage-chapters-page", invalidate);
        this.mainIdeas = this._document.getMainIdeas();
    }

    beforeRender() {
        if(this.mainIdeas.length === 0) {
            this.summarizeButtonName = "Summarize";
        } else {
            this.summarizeButtonName = "Recreate Summary";
            this.docMainIdeas = "";
            for(let idea of this.mainIdeas){
                this.docMainIdeas += `<li>${idea}</li>`;
            }
        }
        this.chaptersDiv= "";
        let number = 0;
        this._document.chapters.forEach((item) => {
            number++;
            this.chaptersDiv += `<reduced-chapter-unit nr="${number}." title="${webSkel.UtilsService.sanitize(item.title)}" 
            data-id="${item.id}" data-local-action="editAction"></reduced-chapter-unit>`;
        });
    }
    afterRender(){
        let mainIdeas = this.element.querySelector(".main-ideas-list");
        mainIdeas.removeEventListener("input", this.manageList);
        mainIdeas.addEventListener("input", this.manageList);
    }

    manageList(event){
        const maxLength = 80;
        for(let child of event.target.children){
            if(event.target.children.length === 1 && event.target.firstChild.innerText === ""){
                event.target.firstChild.textContent = `<li>${event.target.firstChild.innerText}</li>`;
            }
            if(child.innerHTML === "<br>"){
                child.innerHTML = "";
            }
            if (child.innerText.length > maxLength) {
                const selection = window.getSelection();
                const range = document.createRange();

                // Truncate the text and update the element
                child.innerText = child.innerText.substring(0, maxLength);

                // Restore the cursor position to the end of the text
                range.setStart(child.firstChild, child.innerText.length);
                range.setEnd(child.firstChild, child.innerText.length);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }
    async editMainIdeas(_target) {
        let mainIdeas = this.element.querySelector(".main-ideas-list");
        if (mainIdeas.getAttribute("contenteditable") === "false") {
            mainIdeas.setAttribute("contenteditable", "true");
            mainIdeas.focus();
            let timer = webSkel.getService("UtilsService").SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let ideas = mainIdeas.innerText.split("\n");
                let ideasString = ideas.join("");
                let currentIdeas = this._document.mainIdeas.join("");
                let flowId = webSkel.currentUser.space.getFlowIdByName("UpdateDocumentMainIdeas");
                if (!confirmationPopup && ideasString !== currentIdeas) {
                    await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, ideas);
                    mainIdeas.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${mainIdeas.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            mainIdeas.addEventListener("blur", async () => {
                mainIdeas.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                mainIdeas.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            mainIdeas.addEventListener("keydown", resetTimer);
        }
    }


    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }
    async addChapter(){
        let flowId = webSkel.currentUser.space.getFlowIdByName("AddChapter");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, "");
        this.invalidate();
    }
    async summarize(){
        await webSkel.UtilsService.showModal(document.querySelector("body"), "summarize-document-modal", { presenter: "summarize-document-modal"});
    }

    async generateChapters(){
        await webSkel.changeToDynamicPage("generate-chapters-page", `documents/${this._document.id}/generate-chapters-page`);
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await webSkel.UtilsService.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async editAction(_target){
        let chapter = webSkel.UtilsService.reverseQuerySelector(_target, "reduced-chapter-unit");
        let chapterId = chapter.getAttribute("data-id");
        await webSkel.changeToDynamicPage("chapter-brainstorming-page",
            `documents/${this._document.id}/chapter-brainstorming-page/${chapterId}`);
    }
    async deleteAction(_target){
        let chapter = webSkel.UtilsService.reverseQuerySelector(_target, "reduced-chapter-unit");
        let chapterId = chapter.getAttribute("data-id");
        let flowId = webSkel.currentUser.space.getFlowIdByName("DeleteChapter");
        await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, chapterId);
        this.invalidate();
    }
}