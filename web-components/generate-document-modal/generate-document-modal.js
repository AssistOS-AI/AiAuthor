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
            assistOS.UI.closeModal(_target);
            await assistOS.callFlow("GenerateDocument", {
                title: formData.data.documentTitle,
                topic: formData.data.documentTopic,
                chaptersCount: formData.data.chaptersCount,
            }, formData.data.documentPersonality);
        }
        assistOS.factories.notifyObservers("docs");
    }
}
