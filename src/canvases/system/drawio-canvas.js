// Shared by both System/Integration and Interaction canvases (ADR-0003 —
// "one integration... covers two canvases"). Hand-rolled against draw.io's
// documented embed postMessage protocol (no maintained vanilla-JS wrapper
// exists on npm worth depending on): the iframe sends {event:'init'} once
// ready, we reply with a 'load' action carrying the XML, and it sends
// {event:'autosave', xml} on every subsequent change.

const DRAWIO_ORIGIN = 'https://embed.diagrams.net';

export function mountDrawioCanvas(container, viewObj, onChange) {
  const iframe = document.createElement('iframe');
  iframe.src = `${DRAWIO_ORIGIN}/?embed=1&proto=json&spin=1`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  container.appendChild(iframe);

  function handleMessage(event) {
    if (event.origin !== DRAWIO_ORIGIN || event.source !== iframe.contentWindow) return;

    let message;
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      return; // not a JSON message from draw.io — ignore
    }

    if (message.event === 'init') {
      iframe.contentWindow.postMessage(
        JSON.stringify({ action: 'load', xml: viewObj.content || '', autosave: 1 }),
        DRAWIO_ORIGIN
      );
    } else if (message.event === 'autosave' || message.event === 'save') {
      if (typeof message.xml === 'string') onChange(message.xml);
    }
  }

  window.addEventListener('message', handleMessage);

  return {
    destroy() {
      window.removeEventListener('message', handleMessage);
      iframe.remove();
    },
  };
}
