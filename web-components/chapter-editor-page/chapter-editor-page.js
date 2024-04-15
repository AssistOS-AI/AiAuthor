import {parseURL,getBasePath} from "../../utils/index.js"
export class ChapterEditorPage{
    constructor(element, invalidate) {
        this.element = element;
        let documentId, chapterId;
        [documentId, chapterId] = parseURL();
        assistOS.space.currentDocumentId = documentId;
        assistOS.space.currentChapterId = chapterId;
        this._document = assistOS.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this.element.addEventListener('keydown', (event) => this.addParagraphOnCtrlEnter(event));
        let controller = new AbortController();
        document.addEventListener("click",this.checkParagraphClick.bind(this, controller), {signal:controller.signal});

        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.docTitle=this._document.title;
        this.chapterTitle= this._chapter.title;
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.chapterId= this._chapter.id;
        this.chapterContent = "";
        this._chapter.paragraphs.forEach((paragraph) => {
            this.chapterContent += `<paragraph-unit data-paragraph-content="${paragraph.text}" data-paragraph-id="${paragraph.id}"></paragraph-unit>`;
        });

    }

    afterRender() {
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        let currentParagraph = null;
        selectedParagraphs.forEach(paragraph => {
            if (assistOS.UI.reverseQuerySelector(paragraph, '[data-paragraph-id]').getAttribute("data-paragraph-id") === assistOS.space.currentParagraphId) {
                this.currentParagraph = paragraph;
            }
        });
        if(this.currentParagraph){
            this.currentParagraph.click();
            this.currentParagraph.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
        }
    }
    async editChapterTitle(title){
        title.setAttribute("contenteditable", "true");
        title.focus();
        let timer = assistOS.services.SaveElementTimer(async () => {
            if (title.innerText !== this._chapter.title) {
                await assistOS.callFlow("UpdateChapterTitle", {
                    documentId: this._document.id,
                    chapterId: this._chapter.id,
                    title: title.innerText
                });
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
    checkParagraphClick(controller,event){
        this.paragraphUnit = assistOS.UI.getClosestParentElement(event.target, "paragraph-unit");
        if(this.paragraphUnit){
            if(this.currentParagraph!==this.paragraphUnit) {
                this.deselectPreviousParagraph();
                this.currentParagraph = this.paragraphUnit;
                assistOS.space.currentParagraphId = this.paragraphUnit.getAttribute("data-paragraph-id");
                this.switchParagraphArrowsDisplay(this.paragraphUnit, "on");
            }
        } else {
            let rightSideBarItem = assistOS.UI.getClosestParentElement(event.target, ".sidebar-item");
            let leftSideBarItem = assistOS.UI.getClosestParentElement(event.target, ".feature");
            if(rightSideBarItem || leftSideBarItem){
                  controller.abort();
              }
              else{
                  this.deselectPreviousParagraph();
              }
        }
    }
    async addParagraphOnCtrlEnter(event) {
        if (!event.ctrlKey || event.key !== 'Enter') {
            return;
        }
        debugger;
        const fromParagraph = assistOS.UI.reverseQuerySelector(event.target, '[data-paragraph-id]', 'chapter-unit');
        const fromChapter = assistOS.UI.reverseQuerySelector(event.target, 'chapter-editor-page');

        if (!fromParagraph && !fromChapter) {
            return;
        }
        await this.addParagraph(event.target);
    }
    async addParagraph(_target){
        await assistOS.callFlow("AddParagraph", {
            documentId: this._document.id,
            chapterId: this.chapterId
        });
        let controller = new AbortController();
        document.addEventListener("click",this.checkParagraphClick.bind(this, controller), {signal:controller.signal});
        this.invalidate();
    }
    switchParagraphArrowsDisplay(target, mode) {
        let chapter = this._document.getChapter(this.chapterId);
        if(chapter.paragraphs.length===1){
            return;
        }
        const arrowsSelector ='.paragraph-arrows';
        let foundElement = target.querySelector(arrowsSelector);
        if (!foundElement) {
            let nextSibling = target.nextElementSibling;
            while (nextSibling) {
                if (nextSibling.matches(arrowsSelector)) {
                    foundElement = nextSibling;
                    break;
                }
                nextSibling = nextSibling.nextElementSibling;
            }
        }
        if(mode === "on"){
            foundElement.style.display = "flex";
        }else{
            foundElement.style.display = "none";
        }
    }

    editParagraph(paragraph) {
        if(this.currentParagraph){
            this.switchParagraphArrowsDisplay(this.currentParagraph,"off");
            delete this.currentParagraph;
        }
        this.switchParagraphArrowsDisplay(paragraph,"on");
        if (paragraph.getAttribute("contenteditable") === "false") {
            paragraph.setAttribute("contenteditable", "true");
            let paragraphUnit = assistOS.UI.reverseQuerySelector(paragraph, ".paragraph-unit");
            paragraph.focus();
            this.currentParagraph=paragraph;
            let currentParagraphId = paragraphUnit.getAttribute("data-paragraph-id");
            assistOS.space.currentParagraphId = currentParagraphId;
            let currentParagraph = this._chapter.getParagraph(currentParagraphId);
            let timer = assistOS.services.SaveElementTimer(async () => {
                if (!currentParagraph) {
                    await timer.stop();
                    return;
                }
                let updatedText = paragraph.innerText;
                if (updatedText !== currentParagraph.text) {
                    await assistOS.callFlow("UpdateParagraphText", {
                        documentId: this._document.id,
                        chapterId: this._chapter.id,
                        paragraphId: currentParagraph.id,
                        text: updatedText
                    });
                }
            }, 1000);
            paragraph.addEventListener("blur", async () => {
                paragraph.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                paragraph.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async (event) => {
                if (paragraph.innerText.trim() === "" && event.key === "Backspace") {
                    if (currentParagraph) {
                        await assistOS.callFlow("DeleteParagraph", {
                            documentId: this._document.id,
                            chapterId: this._chapter.id,
                            paragraphId: currentParagraph.id
                        });
                        this.invalidate();
                    }
                    await timer.stop();
                } else {
                    await timer.reset(1000);
                }
            };
            paragraph.addEventListener("keydown", resetTimer);
        }
    }
    deselectPreviousParagraph(){
        if(this.currentParagraph){
            assistOS.space.currentParagraphId = null;
            this.switchParagraphArrowsDisplay(this.currentParagraph, "off");
            delete this.currentParagraph;
        }
    }
    async moveParagraph(_target, direction) {
        this.switchParagraphArrowsDisplay(this.currentParagraph,"off");
        const currentParagraph = assistOS.UI.reverseQuerySelector(_target, "paragraph-unit");
        const currentParagraphId = currentParagraph.getAttribute('data-paragraph-id');
        const currentParagraphIndex = this._chapter.getParagraphIndex(currentParagraphId);

        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };

        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, this._chapter.paragraphs);
        await assistOS.callFlow("SwapParagraphs", {
            documentId: this._document.id,
            chapterId: this._chapter.id,
            paragraphId1: currentParagraphId,
            paragraphId2: adjacentParagraphId
        });
        this.invalidate();
    }
    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await assistOS.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }

    async openChapterEditPage(){
        await assistOS.UI.changeToDynamicPage("chapter-edit-page", `${getBasePath()}/chapter-edit-page/${this._document.id}/chapters/${this._chapter.id}`);
    }
    async openChapterEditor(){
        await assistOS.UI.changeToDynamicPage("chapter-editor-page", `${getBasePath()}/chapter-editor-page/${this._document.id}/chapters/${this.chapterId}`);
    }
    async openEditChapterTitlePage() {
        await assistOS.UI.changeToDynamicPage("chapter-title-page",
            `${getBasePath()}/chapter-title-page/${this._document.id}/chapters/${this.chapterId}`);
    }
    async openChapterBrainstormingPage() {
        await assistOS.UI.changeToDynamicPage("chapter-brainstorming-page",
            `${getBasePath()}/chapter-brainstorming-page/${this._document.id}/chapters/${this.chapterId}`);

    }
    async openManageParagraphsPage() {
        await assistOS.UI.changeToDynamicPage("manage-paragraphs-page",
            `${getBasePath()}/manage-paragraphs-page/${this._document.id}/chapters/${this.chapterId}`);
    }
    async generateParagraphs(){
        await assistOS.UI.changeToDynamicPage("generate-paragraphs-page", `${getBasePath()}/generate-paragraphs-page/${this._document.id}/chapters/${this._chapter.id}`);
    }
}