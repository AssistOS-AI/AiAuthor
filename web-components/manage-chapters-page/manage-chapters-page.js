import {parseURL,getBasePath} from "../../utils/index.js"
export class ManageChaptersPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = assistOS.space.getDocument(parseURL());
        this.invalidate = invalidate;
        this.invalidate();
        this._document.observeChange(this._document.getNotificationId() + ":manage-chapters-page", invalidate);
        this.mainIdeas = this._document.getMainIdeas();
    }

    beforeRender() {
        this.docTitle=this._document.title;
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
            this.chaptersDiv += `<reduced-chapter-unit nr="${number}." title="${assistOS.UI.sanitize(item.title)}" 
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
            let timer = assistOS.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let ideas = mainIdeas.innerText.split("\n");
                let ideasString = ideas.join("");
                let currentIdeas = this._document.mainIdeas.join("");
                if (!confirmationPopup && ideasString !== currentIdeas) {
                    await assistOS.callFlow("UpdateDocumentMainIdeas",  {
                        documentId: this._document.id,
                        mainIdeas: ideas
                    });
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


    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await assistOS.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }
    async openManageChaptersPage(){
        await assistOS.UI.changeToDynamicPage("manage-chapters-page", `${getBasePath()}/manage-chapters-page/${this._document.id}`);
    }
    async addChapter(){
        await assistOS.callFlow("AddChapter", {
            documentId: this._document.id
        });
        this.invalidate();
    }
    async summarize(){
        await assistOS.UI.showModal( "summarize-document-modal", { presenter: "summarize-document-modal"});
    }

    async generateChapters(){
        await assistOS.UI.changeToDynamicPage("generate-chapters-page", `${getBasePath()}/generate-chapters-page/${this._document.id}`);
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async editAction(_target){
        let chapter = assistOS.UI.reverseQuerySelector(_target, "reduced-chapter-unit");
        let chapterId = chapter.getAttribute("data-id");
        await assistOS.UI.changeToDynamicPage("chapter-brainstorming-page",
            `${getBasePath()}/chapter-brainstorming-page/${this._document.id}/chapters/${chapterId}`);
    }
    async deleteAction(_target){
        let chapter = assistOS.UI.reverseQuerySelector(_target, "reduced-chapter-unit");
        let chapterId = chapter.getAttribute("data-id");
        await assistOS.callFlow("DeleteChapter", {
            documentId: this._document.id,
            chapterId: chapterId
        });
        this.invalidate();
    }
}