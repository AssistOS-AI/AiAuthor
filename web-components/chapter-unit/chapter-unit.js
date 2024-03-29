import {parseURL} from "../../utils/index.js"
export class ChapterUnit {
    constructor(element, invalidate) {
        this.element = element;
        this._document = system.space.getDocument(parseURL());
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${chapterId}`, invalidate);
        this.invalidate = invalidate;
        this.invalidate();
        this.addParagraphOnCtrlEnter = this.addParagraphOnCtrlEnter.bind(this);
        this.element.removeEventListener('keydown', this.addParagraphOnCtrlEnter);
        this.element.addEventListener('keydown', this.addParagraphOnCtrlEnter);
    }

    beforeRender() {
        let chapterId = this.element.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(chapterId);
        this.chapterTitle=this.chapter.title;
        this.chapterContent = "";
        if (this.chapter) {
            if (this.chapter.visibility === "hide") {
                if (this.element.querySelector(".chapter-paragraphs")) {
                    this.element.querySelector(".chapter-paragraphs").classList.add("hidden");
                }
            }
        }
        this.chapter.paragraphs.forEach((paragraph) => {
            this.chapterContent += `<paragraph-unit data-paragraph-content="${paragraph.text}" data-paragraph-id="${paragraph.id}"></paragraph-unit>`;
        });
    }

    afterRender() {
        this.chapterUnit = this.element.querySelector(".chapter-unit");
        let selectedParagraphs = this.element.querySelectorAll(".paragraph-text");
        let currentParagraph = "";
        for(let paragraph of selectedParagraphs){
            if (system.UI.reverseQuerySelector(paragraph, '[data-paragraph-id]').getAttribute("data-paragraph-id") === system.space.currentParagraphId) {
                currentParagraph = paragraph;
                currentParagraph.click();
                system.UI.moveCursorToEnd(currentParagraph);
                //currentParagraph.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
                break;
            }
        }
        if (this.chapter.id === system.space.currentChapterId&&!currentParagraph) {
            this.chapterUnit.click();
            //this.element.scrollIntoView({behavior: "smooth", block: "center", inline: "nearest"});
        }
        if(this.chapter.visibility === "hide"){
            let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
            paragraphsContainer.classList.toggle('hidden');
            let arrow = this.element.querySelector(".arrow");
            arrow.classList.toggle('rotate');
        }
    }

    async addParagraphOnCtrlEnter(event) {
        if (!event.ctrlKey || event.key !== 'Enter') {
            return;
        }
        const fromParagraph = system.UI.reverseQuerySelector(event.target, '[data-paragraph-id]','chapter-unit');
        const fromChapter = system.UI.reverseQuerySelector(event.target, '.chapter-unit');

        if (!fromParagraph && !fromChapter) {
            return;
        }
        let flowId = system.space.getFlowIdByName("AddParagraph");
        let context = {
            documentId: this._document.id,
            chapterId: this.chapter.id
        }
        await system.services.callFlow(flowId, context);
        this.invalidate();
    }

    async editChapterTitle(title) {
        title.setAttribute("contenteditable", "true");

        const titleEnterHandler = async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        };
        title.addEventListener('keydown', titleEnterHandler);
        title.focus();

        let timer = system.services.SaveElementTimer(async () => {
            let titleText = system.UI.sanitize(system.UI.customTrim(title.innerText))
            if (titleText !== this.chapter.title && titleText !== "") {
                let flowId = system.space.getFlowIdByName("UpdateChapterTitle");
                let context = {
                    documentId: this._document.id,
                    chapterId: this.chapter.id,
                    newTitle: titleText
                }
                await system.services.callFlow(flowId, context);
            }
        }, 3000);
        /* NO chapter Title */
        /* constants for page names */
        /* save button hidden */
        title.addEventListener("blur", async () => {
            title.innerText = system.UI.customTrim(title.innerText)||system.UI.unsanitize(this.chapter.title);
            await timer.stop(true);
            title.removeAttribute("contenteditable");
            title.removeEventListener('keydown', titleEnterHandler);
            title.removeEventListener("keydown", resetTimer);
        }, {once: true});
        const resetTimer = async () => {
            await timer.reset(1000);
        };
        title.addEventListener("keydown", resetTimer);
    }
    async moveParagraph(_target, direction) {
        let chapter = this._document.getChapter(system.space.currentChapterId);
        const currentParagraph = system.UI.reverseQuerySelector(_target, "paragraph-unit");
        const currentParagraphId = currentParagraph.getAttribute('data-paragraph-id');
        const currentParagraphIndex = chapter.getParagraphIndex(currentParagraphId);

        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };
        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, chapter.paragraphs);
        const chapterId = system.UI.reverseQuerySelector(_target, "chapter-unit").getAttribute('data-chapter-id');
        if (chapter.swapParagraphs(currentParagraphId, adjacentParagraphId)) {
            await system.factories.updateDocument(system.space.id, this._document);
            system.space.currentParagraphId = currentParagraphId;
            system.UI.refreshElement(system.UI.getClosestParentWithPresenter(_target, "chapter-unit"));
        } else {
            console.error(`Unable to swap paragraphs. ${currentParagraphId}, ${adjacentParagraphId}, Chapter: ${chapterId}`);
        }
    }

    highlightChapter(){
        this.chapterUnit.setAttribute("id", "highlighted-chapter");
        system.space.currentChapterId = this.chapter.id;
        if(this._document.chapters.length===1){
            return;
        }
        let foundElement = this.chapterUnit.querySelector('.chapter-arrows');
        foundElement.style.display = "flex";

    }
    changeChapterDisplay(_target) {
        this.chapter.visibility === "hide" ? this.chapter.visibility = "show" : this.chapter.visibility = "hide";
        let paragraphsContainer = this.element.querySelector(".chapter-paragraphs");
        paragraphsContainer.classList.toggle('hidden');
        _target.classList.toggle('rotate');
    }
}



