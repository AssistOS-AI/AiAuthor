import {parseURL} from "../../utils/index.js"
export class suggestParagraphModal {
    constructor(element, invalidate) {
        let documentId, chapterId, paragraphId;
        [documentId, chapterId, paragraphId] = parseURL();
        this._document = webSkel.currentUser.space.getDocument(documentId);
        this._chapter = this._document.getChapter(chapterId);
        this._paragraph = this._chapter.getParagraph(paragraphId);
        this.invalidate = invalidate;
        this.element = element;
        this.invalidate();
    }

    beforeRender() {

    }
    afterRender(){
        this.suggestedParagraphForm = this.element.querySelector(".suggested-paragraph-form");
        if(!this.suggestedParagraph){
            this.suggestedParagraphForm.style.display = "none";
        }
        let textBox = this.element.querySelector("#prompt");
        if(this.prompt){
            textBox.value = this.prompt;
        }
    }

    async generate(_target){
        let formInfo = await webSkel.UtilsService.extractFormInformation(_target);
        this.prompt = formInfo.data.prompt;
        let flowId = webSkel.currentUser.space.getFlowIdByName("SuggestParagraph");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, this._paragraph.id, this.prompt);
        this.suggestedParagraph = result.responseJson.text;
        this.suggestedParagraphIdea = result.responseJson.mainIdea;
        this.invalidate();
    }

    closeModal(_target) {
        webSkel.UtilsService.closeModal(_target);
    }

    async addSelectedParagraph(_target) {
        let altParagraphData = {text:webSkel.UtilsService.sanitize(this.suggestedParagraph),
            id:webSkel.getService("UtilsService").generateId(), mainIdea:webSkel.UtilsService.sanitize(this.suggestedParagraphIdea) };
        let flowId = webSkel.currentUser.space.getFlowIdByName("AcceptSuggestedParagraph");
        let result = await webSkel.getService("LlmsService").callFlow(flowId, this._document.id, this._chapter.id, this._paragraph.id, altParagraphData);
        this._document.notifyObservers(this._document.getNotificationId());
        webSkel.UtilsService.closeModal(_target);
    }
}