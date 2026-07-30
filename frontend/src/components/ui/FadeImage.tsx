import { useState, type ImgHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface FadeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  containerClassName?: string
}

/**
 * Drop-in replacement for <img> that fades in smoothly once loaded and
 * shows a shimmering skeleton underneath while waiting - avoids a jarring
 * blank-then-pop-in flash, which matters now that restaurant photos can be
 * real network images (Pexels) instead of instantly-available local SVGs.
 */
export function FadeImage({ containerClassName, className, onLoad, ...props }: FadeImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={cn('relative w-full h-full overflow-hidden', containerClassName)}>
      {!loaded && <div className="absolute inset-0 skeleton" />}
      <img
        {...props}
        loading="lazy"
        onLoad={(e) => { setLoaded(true); onLoad?.(e) }}
        className={cn(className, 'transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0')}
      />
    </div>
  )
}
