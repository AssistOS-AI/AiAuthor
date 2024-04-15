import {parseURL,getBasePath} from "../../utils/index.js"
export class GenerateChaptersPage {
    constructor(element, invalidate) {
        this.element = element;
        this._document = assistOS.space.getDocument(parseURL());
        this.invalidate = invalidate;
        this.invalidate();
        this.ideas = [];
    }

    beforeRender() {
        this.docTitle=this._document.title;
        let stringHMTL = "";
        let i = 0;
        for(let idea of this.ideas){
            i++;
            if(i === this.ideas.length){
                stringHMTL+=`<div class="generated-idea" data-id="${i+idea}">
                <div class="idea-container">
                  <span class="alt-title-span">${i}.</span>
                  <label for="${i+idea}" class="alt-title-label">${idea}</label>
                </div>
                <input type="checkbox" id="${i+idea}" name="${i+idea}" value="${idea}" data-condition="verifyCheckedIdeas">
            </div>
            <hr class="generated-ideas-hr">`;
            }else {
                stringHMTL+=`<div class="generated-idea" data-id="${i}">
                <div class="idea-container">
                  <span class="alt-title-span">${i}.</span>
                  <label for="${i}" class="alt-title-label">${idea}</label>
                </div>
                <input type="checkbox" id="${i}" name="${idea}" value="${idea}">
            </div>
            <hr class="generated-ideas-hr">`;
            }
        }
        this.chaptersIdeas = stringHMTL;
    }

    preventRefreshOnEnter(event){
        if(event.key === "Enter"){
            event.preventDefault();
            this.element.querySelector(".generate-ideas-btn").click();
        }
    }
    afterRender(){
        if(this.ideas.length !== 0){
            let ideasListContainer = this.element.querySelector(".ideas-list-container");
            ideasListContainer.style.display = "block";
        }
        this.ideaInput = this.element.querySelector("#idea");
        let boundFn = this.preventRefreshOnEnter.bind(this);
        this.ideaInput.removeEventListener("keypress", boundFn);
        this.ideaInput.addEventListener("keypress", boundFn);
    }

    async generateIdeas(){
        let form = this.element.querySelector(".generate-ideas-form");
        let formInfo = await assistOS.UI.extractFormInformation(form);
        if(formInfo.isValid) {
            this.ideas = await assistOS.callFlow("GenerateIdeas", {
                topic: formInfo.data.idea,
                variants: formInfo.data.nr,
                maxTokens: ""
            });
            this.invalidate();
        }

    }

    async generateEmptyChapters(_target){
        const conditions = {"verifyCheckedIdeas": {fn:this.verifyCheckedIdeas, errorMessage:"Select at least one idea!"} };
        let formInfo = await assistOS.UI.extractFormInformation(_target, conditions);
        if(formInfo.isValid){
            let selectedIdeas = [];
            for (const [key, value] of Object.entries(formInfo.elements)) {
                if(value.element.checked) {
                    selectedIdeas.push(value.element.value);
                }
            }
            let result = await assistOS.callFlow("GenerateEmptyChapters", {
                documentId: this._document.id,
                prompt: formInfo.data.prompt,
                ideas: selectedIdeas,
                chapterNr: selectedIdeas.length
            });
            if(result){
                await assistOS.UI.changeToDynamicPage("manage-chapters-page", `${getBasePath()}/manage-chapters-page/${this._document.id}`);
            }
        }
    }

    verifyCheckedIdeas(element, formData) {
        let checkedIdeas = [];
        for (const [key, value] of Object.entries(formData.elements)) {
            if(value.element.checked) {
                checkedIdeas.push(value.element.value);
            }
        }
        if(element.checked){
            checkedIdeas.push(element.value);
        }
        return checkedIdeas.length !== 0;
    }
    async generateChapters(_target){
        const conditions = {"verifyCheckedIdeas": {fn:this.verifyCheckedIdeas, errorMessage:"Select at least one idea!"} };
        let formInfo = await assistOS.UI.extractFormInformation(_target, conditions);
        if(formInfo.isValid){
            let selectedIdeas = [];
            for (const [key, value] of Object.entries(formInfo.elements)) {
                if(value.element.checked) {
                    selectedIdeas.push(value.element.value);
                }
            }
            let result = await assistOS.callFlow("GenerateChapters", {
                documentId: this._document.id,
                prompt: formInfo.data.prompt,
                ideas: selectedIdeas,
                chapterNr: selectedIdeas.length
            });
            if(result){
                await assistOS.UI.changeToDynamicPage("manage-chapters-page", `${getBasePath()}/manage-chapters-page/${this._document.id}`);
            }
        }
    }

    async openMangeChaptersPage() {
        await assistOS.UI.changeToDynamicPage("manage-chapters-page", `${getBasePath()}/manage-chapters-page/${this._document.id}`);
    }
    async openDocumentsPage() {
        await assistOS.UI.changeToDynamicPage("documents-page", `${getBasePath()}/documents-page`);
    }
    async openDocumentViewPage() {
        await assistOS.UI.changeToDynamicPage("document-view-page", `${getBasePath()}/document-view-page/${this._document.id}`);
    }
    async openGenerateChaptersPage(){
        await assistOS.UI.changeToDynamicPage("generate-chapters-page", `${getBasePath()}/generate-chapters-page/${this._document.id}`);
    }
}