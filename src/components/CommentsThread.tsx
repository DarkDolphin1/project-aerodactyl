import { useEffect, useRef, useState } from 'react'
import type { CommentsConfig } from '../data/types'

type CommentsThreadProps = {
  config: CommentsConfig
  term: string
  title: string
}

export function CommentsThread({ config, term, title }: CommentsThreadProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const container = ref.current

    if (!open || !container || !config.enabled) {
      return
    }

    container.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-repo', config.repo)
    script.setAttribute('data-repo-id', config.repoId)
    script.setAttribute('data-category', config.category)
    script.setAttribute('data-category-id', config.categoryId)
    script.setAttribute('data-mapping', config.mapping)
    script.setAttribute('data-term', term)
    script.setAttribute('data-strict', '1')
    script.setAttribute('data-reactions-enabled', '1')
    script.setAttribute('data-emit-metadata', '0')
    script.setAttribute('data-input-position', 'top')
    script.setAttribute('data-theme', config.theme)
    script.setAttribute('data-lang', config.lang)

    container.appendChild(script)

    return () => {
      container.innerHTML = ''
    }
  }, [config, open, term])

  if (!config.enabled) {
    return null
  }

  return (
    <details className="comments-thread" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{title}</summary>
      <div className="comments-shell" ref={ref} />
    </details>
  )
}
