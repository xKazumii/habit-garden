import { useId, type KeyboardEvent } from 'react'

/**
 * A text field with a label and an optional hint.
 *
 * IMPORTANT — do not go back to `text-sm`: **iOS Safari automatically zooms into
 * any field whose font size is below 16px** and does not fully zoom back out
 * afterwards. `text-base` (16px) is therefore mandatory. The alternative would be
 * `maximum-scale=1` in the viewport, but that disables pinch zoom for everyone
 * and is not an option.
 *
 * That is exactly why the field lives here instead of as a class chain in every
 * screen: the rule holds once, not five times.
 */

/** `raised` sits on the canvas, `inset` inside a card. */
type FieldTone = 'raised' | 'inset'

const TONE_CLASS: Readonly<Record<FieldTone, string>> = {
  raised: 'bg-surface shadow-card py-[15px]',
  inset: 'bg-canvas py-3',
}

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
  placeholder?: string
  type?: 'text' | 'number'
  inputMode?: 'numeric'
  min?: number
  max?: number
  maxLength?: number
  autoComplete?: string
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
  tone?: FieldTone
}

export const TextField = ({
  label,
  value,
  onChange,
  hint,
  placeholder,
  type = 'text',
  inputMode,
  min,
  max,
  maxLength,
  autoComplete,
  onKeyDown,
  tone = 'raised',
}: TextFieldProps) => {
  const fieldId = useId()

  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={fieldId} className="text-[13px] font-medium">
        {label}
      </label>

      <input
        id={fieldId}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        inputMode={inputMode}
        min={min}
        max={max}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className={`text-ink placeholder:text-muted w-full rounded-md px-4 text-base outline-none ${TONE_CLASS[tone]}`}
      />

      {hint && <span className="text-muted text-xs leading-snug">{hint}</span>}
    </div>
  )
}
