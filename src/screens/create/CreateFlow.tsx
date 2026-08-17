import { useState } from 'react'

import { ChevronLeftIcon, CloseIcon } from '../../components/icons'
import { PrimaryButton } from '../../components/PrimaryButton'
import { defaultSpeciesFor } from '../../config/species'
import { plantSeedling } from '../../db/plants'
import { t } from '../../i18n'
import { categoryName } from '../../i18n/labels'
import type { Plant, PlantCategory } from '../../types'
import { CategoryStep } from './CategoryStep'
import { emptyDraft, type PlantDraft } from './draft'
import { HabitStep } from './HabitStep'
import { SpeciesStep } from './SpeciesStep'

/**
 * Planting in three steps: category → species → habit.
 *
 * The flow creates the plant itself and hands it upwards — the shell only has to
 * show the confirmation.
 */

const CATEGORY_STEP = 1
const SPECIES_STEP = 2
const HABIT_STEP = 3
const STEPS: readonly number[] = [CATEGORY_STEP, SPECIES_STEP, HABIT_STEP]
const ICON_SIZE = 18

interface CreateFlowProps {
  /** Only unlocked species can be chosen. */
  unlocked: ReadonlySet<string>
  onClose: () => void
  onPlanted: (plant: Plant) => void
}

export const CreateFlow = ({ unlocked, onClose, onPlanted }: CreateFlowProps) => {
  const [step, setStep] = useState<number>(CATEGORY_STEP)
  const [draft, setDraft] = useState<PlantDraft>(emptyDraft)
  const [isSaving, setIsSaving] = useState(false)

  const patch = (changes: Partial<PlantDraft>) =>
    setDraft((current) => ({ ...current, ...changes }))

  /* The category advances immediately — it is the decision, not a field. */
  const selectCategory = (category: PlantCategory) => {
    patch({ category, species: defaultSpeciesFor(category)?.id ?? null })
    setStep(SPECIES_STEP)
  }

  const goBack = () => {
    if (step === CATEGORY_STEP) {
      onClose()
      return
    }
    setStep(step - 1)
  }

  const canAdvance =
    step === CATEGORY_STEP
      ? draft.category !== null
      : step === SPECIES_STEP
        ? draft.species !== null
        : draft.habitName.trim().length > 0

  const save = async () => {
    if (draft.category === null || draft.species === null) return

    setIsSaving(true)
    try {
      onPlanted(
        await plantSeedling({
          category: draft.category,
          species: draft.species,
          habitName: draft.habitName,
          intervalDays: draft.intervalDays,
        }),
      )
    } catch (error: unknown) {
      console.error('[db] Planting failed', error)
      setIsSaving(false)
    }
  }

  const advance = () => {
    if (!canAdvance || isSaving) return
    if (step < HABIT_STEP) {
      setStep(step + 1)
      return
    }
    void save()
  }

  const title =
    step === CATEGORY_STEP
      ? t('create.categoryTitle')
      : step === SPECIES_STEP
        ? t('create.speciesTitle', { category: categoryName(draft.category ?? 'herb') })
        : t('create.habitTitle')

  const body =
    step === CATEGORY_STEP
      ? t('create.categoryBody')
      : step === SPECIES_STEP
        ? t('create.speciesBody')
        : t('create.habitBody')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="bg-canvas animate-rise pt-safe absolute inset-0 z-30 flex flex-col"
    >
      <div className="flex flex-none items-center justify-between px-5.5 pt-6 pb-2">
        <button
          type="button"
          onClick={goBack}
          aria-label={t('create.back')}
          className="bg-bed text-ink flex h-[38px] w-[38px] items-center justify-center rounded-sm"
        >
          <ChevronLeftIcon size={ICON_SIZE} />
        </button>

        <div
          role="img"
          aria-label={t('create.stepStatus', { current: step, total: STEPS.length })}
          className="flex gap-1.5"
        >
          {STEPS.map((value) => (
            <span
              key={value}
              className={`h-[7px] rounded-full transition-all duration-250 ${
                value === step ? 'w-[22px]' : 'w-[7px]'
              } ${value <= step ? 'bg-primary' : 'bg-inert'}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={t('create.cancel')}
          className="text-muted flex h-[38px] w-[38px] items-center justify-center rounded-sm"
        >
          <CloseIcon size={ICON_SIZE} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5.5 pt-3 pb-6.5">
        <h1 className="pb-1.5 text-2xl leading-tight font-semibold">{title}</h1>
        <p className="text-muted pb-5 text-sm leading-snug">{body}</p>

        {step === CATEGORY_STEP && (
          <CategoryStep selected={draft.category} onSelect={selectCategory} />
        )}

        {step === SPECIES_STEP && draft.category !== null && (
          <SpeciesStep
            category={draft.category}
            selected={draft.species}
            unlocked={unlocked}
            onSelect={(species) => patch({ species })}
          />
        )}

        {step === HABIT_STEP && draft.category !== null && draft.species !== null && (
          <HabitStep
            category={draft.category}
            species={draft.species}
            draft={draft}
            onChange={patch}
          />
        )}
      </div>

      <div className="pb-safe-sheet flex-none px-5.5 pt-2.5">
        <PrimaryButton onClick={advance} disabled={!canAdvance || isSaving}>
          {step === HABIT_STEP ? t('create.submit') : t('create.next')}
        </PrimaryButton>
      </div>
    </div>
  )
}
