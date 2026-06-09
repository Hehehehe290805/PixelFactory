import { useState, useEffect } from 'react'

// Breakpoints tuned so the 12x12 grid + panels fit within the viewport
// xs  < 480px  → 24px cells (grid = 288px)
// sm  480–639  → 30px cells (grid = 360px)
// md  640–899  → 36px cells (grid = 432px)
// lg  900+     → 48px cells (grid = 576px)
function calcSize() {
  const w = window.innerWidth
  if (w < 480) return 24
  if (w < 640) return 30
  if (w < 900) return 36
  return 48
}

export function useGridCellSize() {
  const [size, setSize] = useState(calcSize)

  useEffect(() => {
    function onResize() { setSize(calcSize()) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return size
}
