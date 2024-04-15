export class GenerateDocumentModal{
    constructor(element, invalidate) {
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){
        let stringHTML = "";
        for(let personality of assistOS.space.personalities){
            stringHTML+=`<option value=${personality.id}>${personality.name}</option>`;
        }
        this.personalitiesOptions = stringHTML;
    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
    async generateDocument(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if(formData.isValid) {
            let flowId = assistOS.space.getFlowIdByName("GenerateDocument");
            assistOS.UI.closeModal(_target);
            let context = {
                title: formData.data.documentTitle,
                topic: formData.data.documentTopic,
                chaptersCount: formData.data.chaptersCount,
            }
            await assistOS.services.callFlow(flowId, context, formData.data.documentPersonality);
        }
        assistOS.factories.notifyObservers("docs");
    }
}
