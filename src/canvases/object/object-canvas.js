import mermaid from 'mermaid';
import { starterDiagram } from './starter-diagram.js';

// securityLevel: 'strict' sanitizes any HTML embedded in diagram labels —
// relevant since the diagram source is arbitrary user input.
mermaid.initialize({ startOnLoad: false, securityLevel: 'strict' });

let renderCounter = 0;

const DEBOUNCE_MS = 400;

export function mountObjectCanvas(container, viewObj, onChange) {
  container.innerHTML = `
    <div class="object-canvas-layout">
      <textarea class="object-canvas-source" spellcheck="false"></textarea>
      <div class="object-canvas-preview"></div>
    </div>
  `;

  const textarea = container.querySelector('.object-canvas-source');
  const preview = container.querySelector('.object-canvas-preview');
  textarea.value = viewObj.content || starterDiagram;

  let debounceTimer = null;

  const renderPreview = async () => {
    const text = textarea.value;
    onChange(text);
    try {
      const id = `mermaid-preview-${renderCounter++}`;
      const { svg } = await mermaid.render(id, text);
      preview.innerHTML = svg;
    } catch (error) {
      // Expected mid-edit while the user types invalid/incomplete syntax —
      // not a bug, just show it rather than leaving a stale preview.
      preview.innerHTML = '<p class="object-canvas-error">Invalid diagram syntax</p>';
    }
  };

  const onInput = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderPreview, DEBOUNCE_MS);
  };

  textarea.addEventListener('input', onInput);
  renderPreview();

  return {
    destroy() {
      clearTimeout(debounceTimer);
      textarea.removeEventListener('input', onInput);
      container.innerHTML = '';
    },
  };
}
