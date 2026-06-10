/**
 * Xử lý DOM element creation an toàn
 */
export const createElement = (tag, className = '', innerHTML = '') => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
};

/**
 * Render component vào một DOM node
 */
export const renderComponent = async (rootId, renderFunction) => {
  const root = document.getElementById(rootId);
  if (root) {
    const content = await renderFunction();
    root.innerHTML = content;
  }
};
