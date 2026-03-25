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

    if (prefersReducedMotion.matches) {
      node.style.setProperty('--pointer-x', '50%')
      node.style.setProperty('--pointer-y', '30%')
      node.style.setProperty('--trail-x', '50%')
      node.style.setProperty('--trail-y', '30%')
      node.style.setProperty('--scene-shift-x', '0px')
      node.style.setProperty('--scene-shift-y', '0px')
      node.style.setProperty('--scene-tilt', '0deg')
      node.style.setProperty('--scroll-progress', '0')
      return
    }

    const target = { x: 0.5, y: 0.28, scroll: 0 }
    const current = { x: 0.5, y: 0.28, scroll: 0 }
    const trail = { x: 0.5, y: 0.28 }
    let frame: number | null = null
    let touchActive = false
    const isCoarsePointer = () => prefersCoarsePointer.matches

    const setPointer = (x: number, y: number) => {
      node.style.setProperty('--pointer-x', `${(x * 100).toFixed(2)}%`)
      node.style.setProperty('--pointer-y', `${(y * 100).toFixed(2)}%`)
    }

    const updateTarget = (clientX: number, clientY: number) => {
      target.x = Math.max(0, Math.min(1, clientX / window.innerWidth))
      target.y = Math.max(0, Math.min(1, clientY / window.innerHeight))
      setPointer(target.x, target.y)
      scheduleUpdate()
    }

    const updateStyles = () => {
      const pointerEase = isCoarsePointer() ? 0.28 : 0.2
      const trailEase = isCoarsePointer() ? 0.22 : 0.18
      const scrollEase = isCoarsePointer() ? 0.1 : 0.14

      current.x += (target.x - current.x) * pointerEase
      current.y += (target.y - current.y) * pointerEase
      current.scroll += (target.scroll - current.scroll) * scrollEase
      trail.x += (target.x - trail.x) * trailEase
      trail.y += (target.y - trail.y) * trailEase

      const shiftX = (current.x - 0.5) * (isCoarsePointer() ? 14 : 44)
      const shiftY = (current.y - 0.5) * (isCoarsePointer() ? 12 : 32)
      const tilt = (current.x - 0.5) * (isCoarsePointer() ? 0 : 2.4)

      node.style.setProperty('--trail-x', `${(trail.x * 100).toFixed(2)}%`)
      node.style.setProperty('--trail-y', `${(trail.y * 100).toFixed(2)}%`)
      node.style.setProperty('--scene-shift-x', `${shiftX.toFixed(2)}px`)
      node.style.setProperty('--scene-shift-y', `${shiftY.toFixed(2)}px`)
      node.style.setProperty('--scene-tilt', `${tilt.toFixed(2)}deg`)
      node.style.setProperty('--scroll-progress', current.scroll.toFixed(4))

      const settled =
        Math.abs(target.x - current.x) < 0.0015 &&
        Math.abs(target.y - current.y) < 0.0015 &&
        Math.abs(target.scroll - current.scroll) < 0.0015 &&
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
      if (isCoarsePointer() && event.pointerType !== 'touch') {
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
      setPointer(target.x, target.y)
      scheduleUpdate()
    }

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0]

      if (!touch) {
        return
      }

      touchActive = true
      updateTarget(touch.clientX, touch.clientY)
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]

      if (!touch) {
        return
      }

      touchActive = true
      updateTarget(touch.clientX, touch.clientY)
    }

    const handleTouchEnd = () => {
      touchActive = false
      target.x = 0.5
      target.y = 0.3
      setPointer(target.x, target.y)
      scheduleUpdate()
    }

    const handleScroll = () => {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      target.scroll = window.scrollY / maxScroll

      if (isCoarsePointer() && !touchActive) {
        target.x = 0.5
        target.y = 0.3
        setPointer(target.x, target.y)
      }

      scheduleUpdate()
    }

    setPointer(target.x, target.y)
    node.style.setProperty('--trail-x', `${(trail.x * 100).toFixed(2)}%`)
    node.style.setProperty('--trail-y', `${(trail.y * 100).toFixed(2)}%`)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave)
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
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
    }
  }, [])

  return ref
}
