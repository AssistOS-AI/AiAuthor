import {parseURL,getBasePath} from "../../utils/index.js"
export class ParagraphProofreadPage {
    constructor(element, invalidate) {
        this.element=element;
        let documentId, chapterId, paragraphId;
        [documentId, chapterId, paragraphId] = parseURL();
        this._document = system.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._paragraph = this._chapter.getParagraph(paragraphId);
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.docTitle=this._document.title;
        this.chapterNr = this._document.chapters.findIndex(chapter => chapter.id === this._chapter.id) + 1;
        this.paragraphNr = this._chapter.paragraphs.findIndex(paragraph => paragraph.id === this._paragraph.id) + 1;
        this.paragraphText = this._paragraph.text;
        if(!this.personality){
            this.selectedPersonality = `<option value="" disabled selected hidden>Select personality</option>`;
        }else {
            this.selectedPersonality = `<option value="${this.personality.id}" selected>${this.personality.name}</option>`
        }
        let stringHTML = "";
        for(let personality of system.space.personalities){
            stringHTML+=`<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
    }
    afterRender(){
        if(this.improvedParagraph){
            let improvedParagraphSection = this.element.querySelector(".improved-paragraph-container");
            improvedParagraphSection.style.display = "block";
        }
        let detailsElement = this.element.querySelector("#details");
        if(this.details){
            detailsElement.value = this.details;
        }
    }

    async openDocumentsPage() {
        await system.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await system.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }
    async openChapterEditorPage() {
        await system.UI.changeToDynamicPage("chapter-editor-page", `${getBasePath()}/chapter-editor-page/${this._document.id}/chapters/${this._chapter.id}`);
    }
    async openParagraphBrainstormingPage() {
        await system.UI.changeToDynamicPage("paragraph-brainstorming-page", `${getBasePath()}/paragraph-brainstorming-page/${this._document.id}/chapters/${this._chapter.id}/paragraphs/${this._paragraph.id}`);
    }
    async openParagraphProofreadPage(){
        await system.UI.changeToDynamicPage("paragraph-proofread-page", `${getBasePath()}/paragraph-proofread-page/${this._document.id}/chapters/${this._chapter.id}/paragraphs/${this._paragraph.id}`);

    }

    async executeProofRead() {
        let form = this.element.querySelector(".proofread-form");
        const formData = await system.UI.extractFormInformation(form);

        this.text = formData.data.text;
        if(formData.data.personality){
            this.personality = system.space.getPersonality(formData.data.personality);
        }
        this.details = formData.data.details;
        let flowId = system.space.getFlowIdByName("Proofread");
        let context = {
            text: system.UI.unsanitize(this.paragraphText),
            prompt: formData.data.details
        }
        let result = await system.services.callFlow(flowId, context, formData.data.personality);
        this.observations = system.UI.sanitize(result.observations);
        this.improvedParagraph = system.UI.sanitize(result.improvedText);
        this.invalidate();
    }

    editCurrentParagraph(){
        let paragraph = this.element.querySelector(".paragraph-content");
        if (paragraph.getAttribute("contenteditable") === "false") {
            paragraph.setAttribute("contenteditable", "true");
            paragraph.focus();
            let timer = system.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = system.UI.sanitize(paragraph.innerText);
                if (sanitizedText !== this._paragraph.text && !confirmationPopup) {
                    let flowId = system.space.getFlowIdByName("UpdateParagraphText");
                    let context = {
                        documentId: this._document.id,
                        chapterId: this._chapter.id,
                        paragraphId: this._paragraph.id,
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
    async enterEditMode(_target) {
        let confirmationPopup = this.element.querySelector("confirmation-popup");
        if(confirmationPopup){
            confirmationPopup.remove();
        }
        let paragraph = this.element.querySelector(".improved-paragraph");
        const controller = new AbortController();
        document.addEventListener("click", this.exitEditMode.bind(this, paragraph, controller), {signal:controller.signal});
        paragraph.setAttribute("contenteditable", "true");
        paragraph.focus();
    }

    async exitEditMode (paragraph, controller, event) {
        if (paragraph.getAttribute("contenteditable") === "true" && paragraph !== event.target && !paragraph.contains(event.target)) {
            paragraph.setAttribute("contenteditable", "false");
            this.improvedParagraph = paragraph.innerText;
            controller.abort();
        }
    }


    async acceptImprovements(_target) {
        let paragraph = this.element.querySelector(".improved-paragraph").innerText;
        if(paragraph !== this._paragraph.text) {
            let flowId = system.space.getFlowIdByName("UpdateParagraphText");
            let context = {
                documentId: this._document.id,
                chapterId: this._chapter.id,
                paragraphId: this._paragraph.id,
                text: paragraph

            }
            await system.services.callFlow(flowId, context);
            this.invalidate();
        }
    }
}

