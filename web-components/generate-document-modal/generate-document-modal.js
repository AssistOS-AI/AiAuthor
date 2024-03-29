export class GenerateDocumentModal{
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){
        let stringHTML = "";
        for(let personality of system.space.personalities){
            stringHTML+=`<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
    }
    closeModal(_target) {
        system.UI.closeModal(_target);
    }
    async generateDocument(_target) {
        let formData = await system.UI.extractFormInformation(_target);
        if(formData.isValid) {
            let flowId = system.space.getFlowIdByName("GenerateDocument");
            system.UI.closeModal(_target);
            let context = {
                title: formData.data.documentTitle,
                topic: formData.data.documentTopic,
                chaptersCount: formData.data.chaptersCount,
            }
            await system.services.callFlow(flowId, context, formData.data.documentPersonality);
        }
        system.factories.notifyObservers("docs");
    }
}
