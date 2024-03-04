export class GenerateDocumentModal{
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){
        let stringHTML = "";
        for(let personality of webSkel.currentUser.space.personalities){
            stringHTML+=`<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
    }
    closeModal(_target) {
        webSkel.closeModal(_target);
    }
    async generateDocument(_target) {
        let formData = await webSkel.extractFormInformation(_target);
        if(formData.isValid) {
            let flowId = webSkel.currentUser.space.getFlowIdByName("GenerateDocument");
            webSkel.closeModal(_target);
            let result = await  webSkel.appServices.callFlow(flowId, formData.data.documentTitle,
                formData.data.documentTopic, formData.data.chaptersCount, formData.data.documentPersonality, "");
        }
        webSkel.refreshElement(webSkel.getClosestParentWithPresenter(_target,"documents-page"));
    }
}
