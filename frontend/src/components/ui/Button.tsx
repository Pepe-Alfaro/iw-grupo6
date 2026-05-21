import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Kind =
  | 'primary'
  | 'amber'
  | 'danger'
  | 'success'
  | 'ghost'
  | 'outline'
  | 'outlineBrand'
  | 'outlineSuccess'
  | 'outlineDanger'
  | 'dark'

type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: Kind
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
}

const KINDS: Record<Kind, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-sm',
  amber: 'bg-amber500 text-white hover:brightness-95 shadow-sm',
  danger: 'bg-danger text-white hover:brightness-95 shadow-sm',
  success: 'bg-success text-white hover:brightness-95',
  ghost: 'bg-transparent text-brand hover:bg-brand-tint',
  outline: 'border border-ink-200 bg-white text-ink-900 hover:bg-ink-50',
  outlineBrand: 'border border-brand text-brand bg-white hover:bg-brand-tint',
  outlineSuccess: 'border border-success text-success bg-white hover:bg-emerald-50',
  outlineDanger: 'border border-danger text-danger bg-white hover:bg-rose-50',
  dark: 'bg-ink-900 text-white hover:brightness-110',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-[14px] gap-2',
  lg: 'h-12 px-6 text-[15px] gap-2',
  xl: 'h-[52px] px-6 text-[16px] gap-2',
}

export function Button({
  kind = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-ring ${SIZES[size]} ${KINDS[kind]} ${className}`}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <>
          {icon}
          {children}
          {iconRight}
        </>
      )}
    </button>
  )
}
