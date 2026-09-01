import BpmnModeler from 'bpmn-js/lib/Modeler';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import { starterDiagram } from './starter-diagram.js';

let modeler = null;

export async function mountProcessCanvas(canvasEl, propertiesEl, viewObj, onChange) {
  modeler = new BpmnModeler({
    container: canvasEl,
    propertiesPanel: { parent: propertiesEl },
    additionalModules: [BpmnPropertiesPanelModule, BpmnPropertiesProviderModule],
  });

  try {
    await modeler.importXML(viewObj.content || starterDiagram);
  } catch (error) {
    console.error('Failed to import BPMN diagram', error);
  }

  modeler.on('commandStack.changed', async () => {
    if (!modeler) return; // may have been destroyed while saveXML was pending
    try {
      const { xml } = await modeler.saveXML({ format: false });
      onChange(xml);
    } catch (error) {
      console.error('Failed to save BPMN diagram', error);
    }
  });
}

export function unmountProcessCanvas() {
  if (!modeler) return;
  modeler.destroy();
  modeler = null;
}
