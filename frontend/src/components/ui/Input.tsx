import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
  iconRight?: ReactNode
  prefix?: string
  suffix?: string
}

export function Input({
  label,
  hint,
  error,
  icon,
  iconRight,
  prefix,
  suffix,
  className = '',
  ...rest
}: InputProps) {
  return (
    <label className={`block ${className}`}>
      {label && <div className="text-[13px] font-medium text-ink-900 mb-1.5">{label}</div>}
      <div
        className={`relative flex items-center bg-white border rounded-lg transition-colors ${error ? 'border-danger' : 'border-ink-200 focus-within:border-brand'}`}
      >
        {icon && <span className="pl-3 text-ink-400 flex">{icon}</span>}
        {prefix && <span className="pl-3 text-ink-600 text-[14px] font-medium">{prefix}</span>}
        <input
          {...rest}
          className={`flex-1 bg-transparent h-11 px-3 outline-none text-[14px] placeholder:text-ink-400 ${icon ? 'pl-2' : ''}`}
        />
        {suffix && <span className="pr-3 text-ink-600 text-[14px] font-medium">{suffix}</span>}
        {iconRight && <span className="pr-3 text-ink-400 flex">{iconRight}</span>}
      </div>
      {hint && !error && <div className="mt-1 text-[12px] text-ink-600">{hint}</div>}
      {error && <div className="mt-1 text-[12px] text-danger flex items-center gap-1">{error}</div>}
    </label>
  )
}
