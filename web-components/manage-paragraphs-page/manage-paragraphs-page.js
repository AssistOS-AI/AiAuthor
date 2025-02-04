import {parseURL,getBasePath} from "../../utils/index.js"
export class ManageParagraphsPage {
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId;
        [documentId, chapterId] = parseURL();
        this._document = assistOS.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._document.observeChange(this._document.getNotificationId() + ":manage-paragraphs-page", invalidate);
        this.invalidate = invalidate;
        this.invalidate();

    }

    beforeRender() {
        this.docTitle=this._document.title;
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.chapterMainIdeas = "";
        this.mainIdeas = this._chapter.getMainIdeas();
        for(let idea of this.mainIdeas){
            this.chapterMainIdeas += `<li>${idea}</li>`;
        }

        this.paragraphs= "";
        let number = 0;
        this._chapter.paragraphs.forEach((item) => {
            number++;
            this.paragraphs += `<reduced-paragraph-unit data-id="${item.id}" data-local-action="editAction"
            data-nr="${number}" data-text="${item.text}"></reduced-paragraph-unit>`;
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
                let currentIdeas = this._chapter.mainIdeas.join("");
                if (!confirmationPopup && ideasString !== currentIdeas) {
                    await assistOS.callFlow("UpdateChapterMainIdeas", {
                        documentId: this._document.id,
                        chapterId: this._chapter.id,
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

    async openChapterEditPage(){
        await assistOS.UI.changeToDynamicPage("chapter-editor-page", `${getBasePath()}/chapter-editor-page/${this._document.id}/chapters/${this._chapter.id}`);
    }
    async openManageParagraphsPage(){
        await assistOS.UI.changeToDynamicPage("manage-paragraphs-page", `${getBasePath()}/manage-paragraphs-page/${this._document.id}/chapters/${this._chapter.id}`);
    }
    async addParagraph(){
        await assistOS.callFlow("AddParagraph",  {
            documentId: this._document.id,
            chapterId: this._chapter.id
        });
        this.invalidate();
    }
    async summarize(){
        await assistOS.UI.showModal( "summarize-chapter-modal", { presenter: "summarize-chapter-modal"});
    }

    async generateParagraphs(){
        await assistOS.UI.changeToDynamicPage("generate-paragraphs-page", `${getBasePath()}/generate-paragraphs-page/${this._document.id}/chapters/${this._chapter.id}`);
    }
    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }

    async editAction(_target){
        let paragraph = assistOS.UI.reverseQuerySelector(_target, "reduced-paragraph-unit");
        let paragraphId = paragraph.getAttribute("data-id");
        await assistOS.UI.changeToDynamicPage("paragraph-brainstorming-page",
            `${getBasePath()}/paragraph-brainstorming-page/${this._document.id}/chapters/${this._chapter.id}/paragraphs/${paragraphId}`);
    }
    async deleteAction(_target){
        let paragraph = assistOS.UI.reverseQuerySelector(_target, "reduced-paragraph-unit");
        let paragraphId = paragraph.getAttribute("data-id");
        await assistOS.callFlow("DeleteParagraph", {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            paragraphId: paragraphId
        });
        this.invalidate();
    }
}