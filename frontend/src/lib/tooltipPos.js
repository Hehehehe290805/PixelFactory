/**
 * Returns {x, y} for a tooltip so it stays fully within the viewport.
 * Prefers right→left→bottom→top of the cursor, picking the first that fits.
 */
export function tooltipPos(mouseX, mouseY, tipW, tipH, margin = 12) {
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Try right
  if (mouseX + margin + tipW <= vw && mouseY - tipH / 2 >= 0 && mouseY + tipH / 2 <= vh) {
    return { x: mouseX + margin, y: Math.max(8, Math.min(mouseY - tipH / 2, vh - tipH - 8)) }
  }
  // Try left
  if (mouseX - margin - tipW >= 0 && mouseY - tipH / 2 >= 0 && mouseY + tipH / 2 <= vh) {
    return { x: mouseX - margin - tipW, y: Math.max(8, Math.min(mouseY - tipH / 2, vh - tipH - 8)) }
  }
  // Try above
  if (mouseY - margin - tipH >= 0) {
    return { x: Math.max(8, Math.min(mouseX - tipW / 2, vw - tipW - 8)), y: mouseY - margin - tipH }
  }
  // Fallback: below
  return { x: Math.max(8, Math.min(mouseX - tipW / 2, vw - tipW - 8)), y: mouseY + margin }
}
