// Mothlight — keyboard and mouse input, tracked as a set of held keys
// plus the last click position in canvas coordinates.
export function makeInput(canvas, onClick, onConfirm) {
  const keys = new Set();
  const norm = (k) => k.toLowerCase();

  window.addEventListener('keydown', (e) => {
    const k = norm(e.key);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (k === 'enter' || k === ' ') onConfirm();
    if (!e.repeat) keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(norm(e.key)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    onClick(x, y);
  });
  return keys;
}
