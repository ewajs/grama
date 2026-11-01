/** Observes visible, interactive play, including native dialogs' closing transitions. */
export function watchActivity(update: (active: boolean) => void): () => void {
  let visible = document.visibilityState === 'visible';
  const refresh = () => update(visible && document.querySelector('dialog[open]') === null);
  const visibility = () => {
    visible = document.visibilityState === 'visible';
    refresh();
  };
  const hide = () => {
    visible = false;
    refresh();
  };
  const observer = new MutationObserver(refresh);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['open'],
  });
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', hide);
  window.addEventListener('pageshow', visibility);
  refresh();
  return () => {
    observer.disconnect();
    document.removeEventListener('visibilitychange', visibility);
    window.removeEventListener('pagehide', hide);
    window.removeEventListener('pageshow', visibility);
  };
}
