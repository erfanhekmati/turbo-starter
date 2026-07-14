import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "../../lib/utils"

type StepItem = {
  label: string
  description?: string
}

type StepsProps = {
  steps: (string | StepItem)[]
  currentStep: number
  className?: string
}

function Steps({ steps, currentStep, className }: StepsProps) {
  return (
    <ol data-slot="steps" className={cn("flex w-full items-start", className)}>
      {steps.map((step, index) => {
        const label = typeof step === "string" ? step : step.label
        const description = typeof step === "string" ? undefined : step.description
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <li
            key={label}
            data-slot="steps-item"
            data-state={isCompleted ? "completed" : isCurrent ? "current" : "upcoming"}
            aria-current={isCurrent ? "step" : undefined}
            className="flex flex-1 items-start"
          >
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isCompleted && !isCurrent && "border-border text-muted-foreground"
                )}
              >
                {isCompleted ? <CheckIcon className="size-4" /> : index + 1}
              </span>
              <div className="space-y-0.5 px-1">
                <p
                  className={cn(
                    "text-sm font-medium whitespace-nowrap",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {label}
                </p>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mt-4 h-px flex-1",
                  isCompleted ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export { Steps }
export type { StepsProps, StepItem }
