import {parseURL,getBasePath} from "../../utils/index.js"
export class DocumentViewPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = assistOS.space.getDocument(parseURL());
        this._document.observeChange(this._document.getNotificationId() + ":document-view-page", invalidate);
        this._document.observeChange(this._document.getNotificationId() + ":refresh", invalidate);
        this.invalidate = invalidate;
        this.invalidate();
        this.controller = new AbortController();
        this.boundedFn = this.highlightElement.bind(this, this.controller);
        document.removeEventListener("click", this.boundedFn);
        document.addEventListener("click", this.boundedFn, {signal: this.controller.signal});
    }

    beforeRender() {
        this.chaptersContainer = "";
        this.docTitle = this._document.title;
        this.abstractText = this._document.abstract || "No abstract has been set or generated for this document";
        if (this._document.chapters.length > 0) {
            let iterator = 0;
            this._document.chapters.forEach((item) => {
                iterator++;
                this.chaptersContainer += `<chapter-unit data-chapter-number="${iterator}" data-chapter-id="${item.id}" data-presenter="chapter-unit"></chapter-unit>`;
            });
        }
    }

    afterRender() {
        this.chapterSidebar = this.element.querySelector("#chapter-sidebar");
        this.paragraphSidebar = this.element.querySelector("#paragraph-sidebar");
    }

    switchParagraphArrows(target, mode) {
        if (this.chapter.paragraphs.length <= 1) {
            return;
        }
        let foundElement = target.querySelector('.paragraph-arrows');
        if (!foundElement) {
            let nextSibling = target.nextElementSibling;
            while (nextSibling) {
                if (nextSibling.matches('.paragraph-arrows')) {
                    foundElement = nextSibling;
                    break;
                }
                nextSibling = nextSibling.nextElementSibling;
            }
        }
        if (mode === "on") {
            foundElement.style.visibility = "visible";
        } else {
            foundElement.style.visibility = "hidden";
        }
    }

    saveParagraph(paragraph, swapAction) {
        if (!swapAction) {
            assistOS.space.currentParagraph = null;
        }
        paragraph["timer"].stop(true);
        paragraph["paragraph"].removeEventListener("keydown", this.resetTimer);
        paragraph["paragraph"].setAttribute("contenteditable", "false");
    }

    editParagraph(paragraph) {
        if (paragraph.getAttribute("contenteditable") === "false") {
            paragraph.setAttribute("contenteditable", "true");
            let paragraphUnit = assistOS.UI.reverseQuerySelector(paragraph, ".paragraph-unit");
            paragraph.focus();
            this.previouslySelectedParagraph={};
            this.previouslySelectedParagraph["paragraph"] = paragraph;
            this.switchParagraphArrows(paragraphUnit, "on");
            let currentParagraphId = paragraphUnit.getAttribute("data-paragraph-id");
            assistOS.space.currentParagraphId = currentParagraphId;
            let currentParagraph = this.chapter.getParagraph(currentParagraphId);

            let timer = assistOS.services.SaveElementTimer(async () => {
                if (!currentParagraph) {
                    await timer.stop();
                    return;
                }
                let paragraphText = assistOS.UI.sanitize(assistOS.UI.customTrim(paragraph.innerText));
                if (paragraphText !== currentParagraph.text) {
                    await assistOS.callFlow("UpdateParagraphText", {
                        documentId: this._document.id,
                        chapterId: this.chapter.id,
                        paragraphId: currentParagraph.id,
                        text: paragraphText
                    });
                }
            }, 1000);
            this.previouslySelectedParagraph["timer"]=timer;
            this.resetTimer = async (event) => {
                if (paragraph.innerText.trim() === "" && event.key === "Backspace") {
                    if (currentParagraph) {
                        let curentParagraphIndex = this.chapter.getParagraphIndex(currentParagraphId);
                        await assistOS.callFlow("DeleteParagraph", {
                            documentId: this._document.id,
                            chapterId: this.chapter.id,
                            paragraphId: currentParagraphId
                        });
                        if (this.chapter.paragraphs.length > 0) {
                            if (curentParagraphIndex === 0) {
                                assistOS.space.currentParagraphId = this.chapter.paragraphs[0].id;
                            } else {
                                assistOS.space.currentParagraphId = this.chapter.paragraphs[curentParagraphIndex - 1].id;
                            }
                        } else {
                            assistOS.space.currentParagraphId = null;
                        }
                        this.invalidate();
                    }
                    await timer.stop();
                } else {
                    await timer.reset(1000);
                }
            };
            paragraph.addEventListener("keydown", this.resetTimer);
        }
    }

    async highlightElement(controller, event) {
        this.chapterUnit = assistOS.UI.getClosestParentElement(event.target, ".chapter-unit");
        this.paragraphUnit = assistOS.UI.getClosestParentElement(event.target, ".paragraph-text");
        if (this.paragraphUnit) {
            /* clickul e pe un paragraf */
            if (this.chapterUnit.getAttribute("data-id") !== (this.previouslySelectedChapter?.getAttribute("data-id") || "")) {
                /* clickul e pe paragraf si un capitol diferit de cel curent */
                if (this.previouslySelectedParagraph) {
                    this.saveParagraph(this.previouslySelectedParagraph);
                }
                this.deselectPreviousParagraph();
                this.deselectPreviousChapter();
                await this.highlightChapter();
                this.editParagraph(this.paragraphUnit);
                this.displaySidebar("paragraph-sidebar", "on");
            } else {
                /* clickul e pe acelasi capitol dar alt paragraf*/
                if (this.paragraphUnit !== this.previouslySelectedParagraph["paragraph"]) {
                    /* clickul e pe un paragraf diferit de cel curent */
                    if (this.previouslySelectedParagraph) {
                        this.saveParagraph(this.previouslySelectedParagraph);
                    }
                    this.deselectPreviousParagraph();
                    this.editParagraph(this.paragraphUnit);
                } else {
                    /* clickul e pe acelasi paragraf */
                    return;
                }
            }
        } else if (this.chapterUnit) {
            /* clickul e pe un capitol si nu pe un paragraf*/
            if (this.chapterUnit !== this.previouslySelectedChapter) {
                /* clickul e pe un capitol diferit de cel curent si nu e pe un paragraf */
                this.deselectPreviousParagraph();
                this.deselectPreviousChapter();
                this.highlightChapter();
                if (this.paragraphSidebar.style.display === "block") {
                    this.displaySidebar("paragraph-sidebar", "off");
                }
            } else {
                /* clickul e pe acelasi capitol dar nu pe un paragraf*/
                if (assistOS.UI.getClosestParentElement(event.target, ".paragraph-arrows")) {
                    /* clickul e pe un buton de swap */
                    if (this.previouslySelectedParagraph) {
                        this.saveParagraph(this.previouslySelectedParagraph, "swap");
                    }
                    if (assistOS.UI.getClosestParentElement(event.target, ".arrow-up") || assistOS.UI.getClosestParentElement(event.target, ".arrow-up-space")) {
                        await this.moveParagraph(this.previouslySelectedParagraph["paragraph"], "up")
                    } else {
                        await this.moveParagraph(this.previouslySelectedParagraph["paragraph"], "down")
                    }
                } else {
                    if (assistOS.UI.getClosestParentElement(event.target, ".chapter-arrows")) {
                        /* clickul e pe un buton de swap al capitolului */
                        if(this.previouslySelectedParagraph){
                            this.saveParagraph(this.previouslySelectedParagraph);
                        }
                        if (assistOS.UI.getClosestParentElement(event.target, ".arrow-up")) {
                            await this.moveChapter(event.target, "up");
                        }else{
                            await this.moveChapter(event.target, "down");
                        }
                        } else {
                        this.deselectPreviousParagraph();
                        this.displaySidebar("paragraph-sidebar", "off");
                    }
                }
            }
        } else {
            /* clickul e in afara unui capitol si in afara unui paragraf*/
            if (this.paragraphSidebar.style.display === "block") {
                this.displaySidebar("paragraph-sidebar", "off");
            }
            if (this.chapterSidebar.style.display === "block") {
                this.displaySidebar("chapter-sidebar", "off");
            }
            if(this.previouslySelectedParagraph){
                this.saveParagraph(this.previouslySelectedParagraph);
            }
            this.deselectPreviousParagraph();
            this.deselectPreviousChapter();
            let rightSideBarItem = assistOS.UI.getClosestParentElement(event.target, ".sidebar-item");
            let leftSideBarItem = assistOS.UI.getClosestParentElement(event.target, ".feature");
            /* data-keep-page inseamna ca nu schimbam pagina ci doar dam refresh(#Add chapter) -> */
            if (rightSideBarItem) {
                if (!rightSideBarItem.getAttribute("data-keep-page")) {
                    controller.abort();
                }
            } else if (leftSideBarItem) {
                controller.abort();
            } else {
                this.displaySidebar("document-sidebar", "on");
            }
        }
    }

    highlightChapter() {
        this.displaySidebar("chapter-sidebar", "on");
        this.previouslySelectedChapter = this.chapterUnit;
        this.chapterUnit.setAttribute("id", "highlighted-chapter");
        this.switchArrowsDisplay(this.chapterUnit, "chapter", "on");
        assistOS.space.currentChapterId = this.chapterUnit.getAttribute("data-chapter-id");
        this.chapter = this._document.getChapter(assistOS.space.currentChapterId);
    }

    deselectPreviousParagraph() {
        if (this.previouslySelectedParagraph) {
            assistOS.space.currentParagraphId = null;
            this.previouslySelectedParagraph["paragraph"].setAttribute("contenteditable", "false");
            this.switchParagraphArrows(this.previouslySelectedParagraph["paragraph"], "off");
            delete this.previouslySelectedParagraph;
        }
    }

    deselectPreviousChapter() {
        if (this.previouslySelectedChapter) {
            this.switchArrowsDisplay(this.previouslySelectedChapter, "chapter", "off");
            this.previouslySelectedChapter.removeAttribute("id");
            assistOS.space.currentChapterId = null;
            delete this.previouslySelectedChapter;
        }
    }

    switchArrowsDisplay(target, type, mode) {
        if (type === "chapter") {
            if (this._document.chapters.length <= 1) {
                return;
            }
        }
        if (type === "paragraph") {
            let chapter = this._document.getChapter(this.previouslySelectedChapter.getAttribute("data-chapter-id"));
            if (chapter.paragraphs.length <= 1) {
                return;
            }
        }
        const arrowsSelector = type === "chapter" ? '.chapter-arrows' : '.paragraph-arrows';
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
        if (mode === "on") {
            foundElement.style.display = "flex";
        } else {
            foundElement.style.display = "none";
        }
    }

    displaySidebar(sidebarID, mode) {
        if (sidebarID === "paragraph-sidebar") {
            mode === "on" ? this.paragraphSidebar.style.display = "block" : this.paragraphSidebar.style.display = "none";
        } else if (sidebarID === "chapter-sidebar") {
            mode === "on" ? this.chapterSidebar.style.display = "block" : this.chapterSidebar.style.display = "none";
        } else {
            this.paragraphSidebar.style.display = "none";
            this.chapterSidebar.style.display = "none";
        }
    }

    async moveChapter(_target, direction) {
        const currentChapter = assistOS.UI.reverseQuerySelector(_target, "chapter-unit");
        const currentChapterId = currentChapter.getAttribute('data-chapter-id');
        const currentChapterIndex = this._document.getChapterIndex(currentChapterId);

        const getAdjacentChapterId = (index, chapters) => {
            if (direction === "up") {
                return index === 0 ? chapters[chapters.length - 1].id : chapters[index - 1].id;
            }
            return index === chapters.length - 1 ? chapters[0].id : chapters[index + 1].id;
        };

        const adjacentChapterId = getAdjacentChapterId(currentChapterIndex, this._document.chapters);
        await assistOS.callFlow("SwapChapters", {
            documentId: this._document.id,
            chapterId1: currentChapterId,
            chapterId2: adjacentChapterId
        });
        this.invalidate();
    }

    async moveParagraph(_target, direction) {
        let chapter = this._document.getChapter(assistOS.space.currentChapterId);
        const currentParagraph = assistOS.UI.reverseQuerySelector(_target, "paragraph-unit");
        const currentParagraphId = currentParagraph.getAttribute('data-paragraph-id');
        const currentParagraphIndex = chapter.getParagraphIndex(currentParagraphId);

        const getAdjacentParagraphId = (index, paragraphs) => {
            if (direction === "up") {
                return index === 0 ? paragraphs[paragraphs.length - 1].id : paragraphs[index - 1].id;
            }
            return index === paragraphs.length - 1 ? paragraphs[0].id : paragraphs[index + 1].id;
        };
        const adjacentParagraphId = getAdjacentParagraphId(currentParagraphIndex, chapter.paragraphs);
        const chapterId = assistOS.UI.reverseQuerySelector(_target, "chapter-unit").getAttribute('data-chapter-id');
        if (chapter.swapParagraphs(currentParagraphId, adjacentParagraphId)) {
            await assistOS.factories.updateDocument(assistOS.space.id, this._document);
            assistOS.space.currentParagraphId = currentParagraphId;
            assistOS.UI.refreshElement(assistOS.UI.getClosestParentWithPresenter(_target, "chapter-unit"));
        } else {
            console.error(`Unable to swap paragraphs. ${currentParagraphId}, ${adjacentParagraphId}, Chapter: ${chapterId}`);
        }
    }

    editTitle(title) {
        const titleEnterHandler = async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
        };
        if (title.getAttribute("contenteditable") === "false") {
            title.setAttribute("contenteditable", "true");
            title.addEventListener('keydown', titleEnterHandler);
            title.focus();
            title.parentElement.setAttribute("id", "highlighted-chapter");
            let timer = assistOS.services.SaveElementTimer(async () => {
                let titleText = assistOS.UI.sanitize(assistOS.UI.customTrim(title.innerText));
                if (titleText !== this._document.title && titleText !== "") {
                    await assistOS.callFlow("UpdateDocumentTitle", {
                        documentId: this._document.id,
                        title: titleText
                    });
                }
            }, 1000);
            title.addEventListener("blur", async () => {
                title.innerText = assistOS.UI.customTrim(title.innerText) || assistOS.UI.unsanitize(this._document.title);
                await timer.stop(true);
                title.setAttribute("contenteditable", "false");
                title.removeEventListener('keydown', titleEnterHandler);
                title.removeEventListener("keydown", resetTimer);
                title.parentElement.removeAttribute("id");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            title.addEventListener("keydown", resetTimer);
        }
    }

    async editAbstract(abstract) {
        if (abstract.getAttribute("contenteditable") === "false") {
            let abstractSection = assistOS.UI.reverseQuerySelector(abstract, ".abstract-section");
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            abstractSection.setAttribute("id", "highlighted-chapter");
            let timer =  assistOS.services.SaveElementTimer(async () => {
                let abstractText = assistOS.UI.sanitize(assistOS.UI.customTrim(abstract.innerText));
                if (abstractText !== this._document.abstract && abstractText !== "") {
                    await assistOS.callFlow("UpdateAbstract", {
                        documentId: this._document.id,
                        text: abstractText
                    });
                }
            }, 1000);

            abstract.addEventListener("blur", async () => {
                abstract.innerText = assistOS.UI.customTrim(abstract.innerText) || assistOS.UI.unsanitize(this._document.abstract);
                abstract.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                abstract.setAttribute("contenteditable", "false");
                abstractSection.removeAttribute("id");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            abstract.addEventListener("keydown", resetTimer);
        }
    }

    async addChapter() {
        await assistOS.callFlow("AddChapter", {
            documentId: this._document.id
        });
        this.invalidate();
    }

    async addParagraph(_target) {
        await assistOS.callFlow("AddParagraph", {
            documentId: this._document.id,
            chapterId: assistOS.space.currentChapterId
        });
        this._document.notifyObservers(this._document.getNotificationId() + ":document-view-page:" + "chapter:" + `${assistOS.space.currentChapterId}`);
    }

    async openEditTitlePage() {
        await assistOS.UI.changeToDynamicPage("edit-title-page", `${getBasePath()}/edit-title-page/${this._document.id}`);
    }

    async openEditAbstractPage() {
        await assistOS.UI.changeToDynamicPage("edit-abstract-page", `${getBasePath()}/edit-abstract-page/${this._document.id}`);
    }

    async openDocumentSettingsPage() {
        await assistOS.UI.changeToDynamicPage("document-settings-page", `${getBasePath()}/document-settings-page/${this._document.id}`);
    }

    async openManageChaptersPage() {
        await assistOS.UI.changeToDynamicPage("manage-chapters-page", `${getBasePath()}/manage-chapters-page/${this._document.id}`);
    }

    async openChapterBrainstormingPage() {
        await assistOS.UI.changeToDynamicPage("chapter-brainstorming-page",
            `${getBasePath()}/chapter-brainstorming-page/${this._document.id}/chapters/${assistOS.space.currentChapterId}`);

    }

    async openManageParagraphsPage() {
        await assistOS.UI.changeToDynamicPage("manage-paragraphs-page",
            `${getBasePath()}/manage-paragraphs-page/${this._document.id}/chapters/${assistOS.space.currentChapterId}`);
    }

    async openParagraphProofreadPage() {
        await assistOS.UI.changeToDynamicPage("paragraph-proofread-page", `${getBasePath()}/paragraph-proofread-page/${this._document.id}/chapters/${assistOS.space.currentChapterId}/paragraphs/${assistOS.space.currentParagraphId}`);
    }

    async openParagraphBrainstormingPage() {
        await assistOS.UI.changeToDynamicPage("paragraph-brainstorming-page",
            `${getBasePath()}/paragraph-brainstorming-page/${this._document.id}/chapters/${assistOS.space.currentChapterId}/paragraphs/${assistOS.space.currentParagraphId}`);
    }

    async openEditChapterTitlePage() {
        await assistOS.UI.changeToDynamicPage("chapter-title-page",
            `${getBasePath()}/chapter-title-page/${this._document.id}/chapters/${assistOS.space.currentChapterId}`);
    }

    async openDocumentViewPage() {
        await assistOS.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }
    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openChapterEditor() {
        await assistOS.UI.changeToDynamicPage("chapter-editor-page", `${getBasePath()}/chapter-editor-page/${this._document.id}/chapters/${assistOS.space.currentChapterId}`);
    }
}