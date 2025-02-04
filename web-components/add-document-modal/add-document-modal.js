import {getBasePath} from "../../utils/index.js"

export class AddDocumentModal {
    constructor(element,invalidate) {
       this.invalidate=invalidate;
       this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    async addDocument(_target) {
        let formData = await assistOS.UI.extractFormInformation(_target);
        if(formData.isValid) {
            let docId = await assistOS.callFlow("AddDocument", {
                title: formData.data.documentTitle,
                topic: formData.data.documentTopic
            });
            docId? docId = docId : docId = docId;
            assistOS.UI.closeModal(_target);
            await assistOS.UI.changeToDynamicPage(`document-view-page`, `${getBasePath()}/document-view-page/${docId}`);
        }
    }
}
