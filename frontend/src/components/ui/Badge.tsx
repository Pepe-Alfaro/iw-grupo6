import type { ReactNode } from 'react'

type Tone =
  | 'neutral'
  | 'brand'
  | 'amber'
  | 'amberSoft'
  | 'danger'
  | 'dangerSoft'
  | 'success'
  | 'successSoft'
  | 'blue'
  | 'white'
  | 'dark'

interface BadgeProps {
  tone?: Tone
  children: ReactNode
  className?: string
  icon?: ReactNode
}

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-900',
  brand: 'bg-brand-tint text-brand-dark',
  amber: 'bg-amber500 text-white',
  amberSoft: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-danger text-white',
  dangerSoft: 'bg-rose-50 text-rose-700 border border-rose-200',
  success: 'bg-success text-white',
  successSoft: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  white: 'bg-white text-ink-900',
  dark: 'bg-ink-900 text-white',
}

export function Badge({ tone = 'neutral', children, className = '', icon }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${TONES[tone]} ${className}`}
    >
      {icon}
      {children}
    </span>
  )
}
