import {parseURL,getBasePath} from "../../utils/index.js"
export class AbstractProofreadPage {
    constructor(element, invalidate) {
        this.element=element;
        this._document = assistOS.space.getDocument(parseURL());
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {
        this.abstractText = this._document.abstract;
        this.docTitle=this._document.title;
        if(!this.personality){
            this.selectedPersonality = `<option value="" disabled selected hidden>Select personality</option>`;
        }else {
            this.selectedPersonality = `<option value="${this.personality.id}" selected>${this.personality.name}</option>`
        }
        let stringHTML = "";
        for(let personality of assistOS.space.personalities){
            stringHTML+=`<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
    }
    afterRender(){
        if(this.improvedAbstract){
            let improvedAbstractSection = this.element.querySelector(".improved-abstract-container");
            improvedAbstractSection.style.display = "block";
        }
        let detailsElement = this.element.querySelector("#details");
        if(this.details){
            detailsElement.value = this.details;
        }
    }

    async executeProofRead() {
        let form = this.element.querySelector(".proofread-form");
        const formData = await assistOS.UI.extractFormInformation(form);

        this.text = formData.data.text;
        if(formData.data.personality){
            this.personality = assistOS.space.getPersonality(formData.data.personality);
        }
        this.details = formData.data.details;
        let result = await assistOS.callFlow("Proofread", {
            text: assistOS.UI.unsanitize(this.abstractText),
            prompt: formData.data.details
        }, formData.data.personality);
        this.observations = assistOS.UI.sanitize(result.observations);
        this.improvedAbstract = assistOS.UI.sanitize(result.improvedText);
        this.invalidate();
    }

    editCurrentAbstract(){
        let abstract = this.element.querySelector(".abstract-content");
        if (abstract.getAttribute("contenteditable") === "false") {
            abstract.setAttribute("contenteditable", "true");
            abstract.focus();
            let timer = assistOS.services.SaveElementTimer(async () => {
                let confirmationPopup = this.element.querySelector("confirmation-popup");
                let sanitizedText = assistOS.UI.sanitize(abstract.innerText);
                if (sanitizedText !== this._document.abstract && !confirmationPopup) {
                    await assistOS.callFlow("UpdateAbstract", {
                        documentId: this._document.id,
                        text: sanitizedText
                    });
                    abstract.insertAdjacentHTML("afterbegin", `<confirmation-popup data-presenter="confirmation-popup" 
                    data-message="Saved!" data-left="${abstract.offsetWidth/2}"></confirmation-popup>`);
                }
            }, 1000);
            abstract.addEventListener("blur", async () => {
                abstract.removeEventListener("keydown", resetTimer);
                await timer.stop(true);
                abstract.setAttribute("contenteditable", "false");
            }, {once: true});
            const resetTimer = async () => {
                await timer.reset(1000);
            };
            abstract.addEventListener("keydown", resetTimer);
        }
    }
    async enterEditMode(_target) {
        let confirmationPopup = this.element.querySelector("confirmation-popup");
        if(confirmationPopup){
            confirmationPopup.remove();
        }
        let abstract = this.element.querySelector(".improved-abstract");
        const controller = new AbortController();
        document.addEventListener("click", this.exitEditMode.bind(this, abstract, controller), {signal:controller.signal});
        abstract.setAttribute("contenteditable", "true");
        abstract.focus();
    }

    async exitEditMode (abstract, controller, event) {
        if (abstract.getAttribute("contenteditable") === "true" && abstract !== event.target && !abstract.contains(event.target)) {
            abstract.setAttribute("contenteditable", "false");
            this.improvedAbstract = abstract.innerText;
            controller.abort();
        }
    }


    async acceptImprovements(_target) {
        let abstract = this.element.querySelector(".improved-abstract").innerText;
        if(abstract !== this._document.abstract) {
            await assistOS.callFlow("UpdateAbstract", {
                documentId: this._document.id,
                text: abstract
            });
            this.invalidate();
        }
    }
    async openAbstractProofreadPage(){
        await assistOS.UI.changeToDynamicPage("abstract-proofread-page", `${getBasePath()}/abstract-proofread-page/${this._document.id}`);
    }
    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await assistOS.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }
    async openAbstractEditorPage(){
        await assistOS.UI.changeToDynamicPage("edit-abstract-page", `${getBasePath()}/edit-abstract-page/${this._document.id}`);

    }
}

