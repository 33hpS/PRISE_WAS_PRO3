import * as React from "react"
import { cn } from "../../lib/utils"

export interface ChartConfig {
  [key: string]: {
    label?: string
    color?: string
    icon?: React.ComponentType
  }
}

interface ChartContainerProps {
  config: ChartConfig
  children: React.ReactNode
  className?: string
}

export function ChartContainer({
  config,
  children,
  className,
}: ChartContainerProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
    </div>
  )
}

export interface ChartTooltipContentProps {
  active?: boolean
  payload?: any[]
  label?: string
  className?: string
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
}

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(({ active, payload, label, className, hideLabel, hideIndicator }, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-background p-2 shadow-sm",
        className
      )}
    >
      {!hideLabel && label && (
        <div className="mb-1 px-2 text-sm font-medium">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((item: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between gap-8 px-2"
          >
            <div className="flex items-center gap-2">
              {!hideIndicator && (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-sm text-muted-foreground">
                {item.name || item.dataKey}
              </span>
            </div>
            <span className="text-sm font-mono font-medium">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})

ChartTooltipContent.displayName = "ChartTooltipContent"

export interface ChartLegendContentProps {
  payload?: any[]
  className?: string
  nameKey?: string
}

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(({ payload, className }, ref) => {
  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
    >
      {payload.map((item: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm">{item.value}</span>
        </div>
      ))}
    </div>
  )
})

ChartLegendContent.displayName = "ChartLegendContent"

export const ChartStyle = (config: ChartConfig) => {
  const colorConfig = Object.entries(config).reduce(
    (acc, [key, value]) => {
      if (value.color) {
        acc[`--color-${key}`] = value.color
      }
      return acc
    },
    {} as Record<string, string>
  )

  return colorConfig
}
