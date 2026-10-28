import { useEffect } from 'react'

export const RouteRobotsGuard = ({ noindex = true, children }) => {
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'robots'
      document.head.appendChild(meta)
    }
    const previous = meta.content
    meta.content = noindex ? 'noindex, nofollow' : 'index, follow'

    return () => {
      meta.content = previous || 'index, follow'
    }
  }, [noindex])

  return children
}
