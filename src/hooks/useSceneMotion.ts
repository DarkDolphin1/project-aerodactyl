import { useEffect, useRef } from 'react'

export function useSceneMotion() {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current

    if (!node) {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const prefersCoarsePointer = window.matchMedia('(pointer: coarse)')
    const fineCenter = { x: 0.5, y: 0.28 }
    const coarseCenter = { x: 0.5, y: 0.24 }
    const isCoarsePointer = () => prefersCoarsePointer.matches
    const getCenter = () => (isCoarsePointer() ? coarseCenter : fineCenter)
    const applyMode = () => {
      node.dataset.inputMode = isCoarsePointer() ? 'coarse' : 'fine'
    }

    applyMode()

    if (prefersReducedMotion.matches) {
      const center = getCenter()
      node.style.setProperty('--pointer-x', `${(center.x * 100).toFixed(2)}%`)
      node.style.setProperty('--pointer-y', `${(center.y * 100).toFixed(2)}%`)
      node.style.setProperty('--focus-x', `${(center.x * 100).toFixed(2)}%`)
      node.style.setProperty('--focus-y', `${(center.y * 100).toFixed(2)}%`)
      node.style.setProperty('--trail-x', '50%')
      node.style.setProperty('--trail-y', `${(center.y * 100).toFixed(2)}%`)
      node.style.setProperty('--scene-shift-x', '0px')
      node.style.setProperty('--scene-shift-y', '0px')
      node.style.setProperty('--scene-tilt', '0deg')
      node.style.setProperty('--scroll-progress', '0')
      return
    }

    const center = getCenter()
    const target = { x: center.x, y: center.y, scroll: 0 }
    const current = { x: center.x, y: center.y, scroll: 0 }
    const trail = { x: center.x, y: center.y }
    let frame: number | null = null

    const setPointer = (x: number, y: number) => {
      node.style.setProperty('--pointer-x', `${(x * 100).toFixed(2)}%`)
      node.style.setProperty('--pointer-y', `${(y * 100).toFixed(2)}%`)
    }

    const setFocus = (x: number, y: number) => {
      node.style.setProperty('--focus-x', `${(x * 100).toFixed(2)}%`)
      node.style.setProperty('--focus-y', `${(y * 100).toFixed(2)}%`)
    }

    const setTrail = (x: number, y: number) => {
      node.style.setProperty('--trail-x', `${(x * 100).toFixed(2)}%`)
      node.style.setProperty('--trail-y', `${(y * 100).toFixed(2)}%`)
    }

    const updateTarget = (clientX: number, clientY: number) => {
      target.x = Math.max(0, Math.min(1, clientX / window.innerWidth))
      target.y = Math.max(0, Math.min(1, clientY / window.innerHeight))

      if (isCoarsePointer()) {
        current.x = target.x
        current.y = target.y
        trail.x = target.x
        trail.y = target.y
        setPointer(target.x, target.y)
        setFocus(target.x, target.y)
        setTrail(target.x, target.y)
        return
      }

      scheduleUpdate()
    }

    const updateStyles = () => {
      const coarse = isCoarsePointer()
      const pointerEase = coarse ? 0.28 : 0.14
      const trailEase = coarse ? 0.14 : 0.1
      const scrollEase = coarse ? 0 : 0.14
      const focusX = coarse ? target.x : current.x
      const focusY = coarse ? target.y : current.y
      const shiftX = coarse ? 0 : (current.x - 0.5) * 44
      const shiftY = coarse ? 0 : (current.y - 0.5) * 32
      const tilt = coarse ? 0 : (current.x - 0.5) * 2.4

      current.x += (target.x - current.x) * pointerEase
      current.y += (target.y - current.y) * pointerEase
      current.scroll += (target.scroll - current.scroll) * scrollEase
      trail.x += (target.x - trail.x) * trailEase
      trail.y += (target.y - trail.y) * trailEase

      setPointer(focusX, focusY)
      setFocus(focusX, focusY)
      setTrail(trail.x, trail.y)
      node.style.setProperty('--scene-shift-x', `${shiftX.toFixed(2)}px`)
      node.style.setProperty('--scene-shift-y', `${shiftY.toFixed(2)}px`)
      node.style.setProperty('--scene-tilt', `${tilt.toFixed(2)}deg`)
      node.style.setProperty('--scroll-progress', current.scroll.toFixed(4))

      const settled =
        Math.abs(target.x - current.x) < (coarse ? 0.003 : 0.0015) &&
        Math.abs(target.y - current.y) < (coarse ? 0.003 : 0.0015) &&
        Math.abs(target.scroll - current.scroll) < (coarse ? 0.01 : 0.0015) &&
        Math.abs(target.x - trail.x) < 0.002 &&
        Math.abs(target.y - trail.y) < 0.002

      if (settled) {
        frame = null
        return
      }

      frame = window.requestAnimationFrame(updateStyles)
    }

    const scheduleUpdate = () => {
      if (frame !== null) {
        return
      }

      frame = window.requestAnimationFrame(updateStyles)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (isCoarsePointer()) {
        return
      }

      updateTarget(event.clientX, event.clientY)
    }

    const handlePointerLeave = () => {
      if (isCoarsePointer()) {
        return
      }

      target.x = 0.5
      target.y = 0.28
      scheduleUpdate()
    }

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]

      if (!touch) {
        return
      }

      updateTarget(touch.clientX, touch.clientY)
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]

      if (!touch) {
        return
      }

      updateTarget(touch.clientX, touch.clientY)
    }

    const handleTouchEnd = () => {
      const nextCenter = getCenter()
      target.x = nextCenter.x
      target.y = nextCenter.y

      if (isCoarsePointer()) {
        current.x = nextCenter.x
        current.y = nextCenter.y
        trail.x = nextCenter.x
        trail.y = nextCenter.y
        setPointer(nextCenter.x, nextCenter.y)
        setFocus(nextCenter.x, nextCenter.y)
        setTrail(nextCenter.x, nextCenter.y)
        return
      }

      scheduleUpdate()
    }

    const handleScroll = () => {
      if (isCoarsePointer()) {
        return
      }

      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      target.scroll = window.scrollY / maxScroll
      scheduleUpdate()
    }

    const resetScene = () => {
      const nextCenter = getCenter()

      target.x = nextCenter.x
      target.y = nextCenter.y
      target.scroll = 0
      current.x = nextCenter.x
      current.y = nextCenter.y
      current.scroll = 0
      trail.x = nextCenter.x
      trail.y = nextCenter.y
      applyMode()
      setPointer(nextCenter.x, nextCenter.y)
      setFocus(nextCenter.x, nextCenter.y)
      setTrail(nextCenter.x, nextCenter.y)
      node.style.setProperty('--scene-shift-x', '0px')
      node.style.setProperty('--scene-shift-y', '0px')
      node.style.setProperty('--scene-tilt', '0deg')
      node.style.setProperty('--scroll-progress', '0')
    }

    const handleModeChange = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
        frame = null
      }

      resetScene()
    }

    setPointer(target.x, target.y)
    setFocus(current.x, current.y)
    setTrail(trail.x, trail.y)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    prefersCoarsePointer.addEventListener('change', handleModeChange)
    handleScroll()

    return () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame)
      }
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('scroll', handleScroll)
      prefersCoarsePointer.removeEventListener('change', handleModeChange)
    }
  }, [])

  return ref
}
