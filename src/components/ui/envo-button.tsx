import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'ghost' | 'default'

type CommonProps = {
  variant?: Variant
  /** Render an arrow span after the children (.btn-arrow — animates on hover) */
  arrow?: boolean
  className?: string
  children: React.ReactNode
}

type ButtonAsLink = CommonProps & {
  href: string
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'>

type ButtonAsButton = CommonProps & {
  href?: undefined
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

export type EnvoButtonProps = ButtonAsLink | ButtonAsButton

function classes(variant: Variant, className?: string) {
  return cn(
    'btn',
    variant === 'primary' && 'btn-primary',
    variant === 'ghost' && 'btn-ghost',
    className,
  )
}

export function EnvoButton(props: EnvoButtonProps) {
  const { variant = 'default', arrow, className, children, ...rest } = props

  const content = (
    <>
      {children}
      {arrow ? <span className="btn-arrow">→</span> : null}
    </>
  )

  if ('href' in rest && rest.href !== undefined) {
    const { href, ...anchorProps } = rest as ButtonAsLink
    return (
      <Link href={href} className={classes(variant, className)} {...anchorProps}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={classes(variant, className)}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  )
}
