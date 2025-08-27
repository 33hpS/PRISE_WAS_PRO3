import * as React from "react"
import { 
  Tooltip as RechartsTooltip,
  TooltipProps as RechartsTooltipProps,
  ResponsiveContainer,
  Legend,
  LegendProps
} from "recharts"
import { cn } from "@/lib/utils"

// Типы для кастомного Tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number | string;
    name: string;
    color?: string;
    dataKey?: string;
    [key: string]: any;
  }>;
  label?: string | number;
  className?: string;
}

// ChartConfig type
export type ChartConfig = {
  [key: string]: {
    label?: string;
    icon?: React.ComponentType;
    color?: string;
    theme?: {
      light?: string;
      dark?: string;
    };
  };
}

// ChartContext
type ChartContextProps = {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

export function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

// ChartContainer Component
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactElement;
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  ChartContainerProps
>(({ config, children, className, ...props }, ref) => {
  const id = React.useId()
  
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs",
          className
        )}
        {...props}
      >
        <ChartStyle id={id} config={config} />
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})

ChartContainer.displayName = "Chart"

// ChartStyle Component
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const styles = React.useMemo(() => {
    return Object.entries(config).reduce((acc, [key, value]) => {
      if (value.theme?.light) {
        acc.push(
          `#${id} .recharts-layer.${key} { fill: ${value.theme.light}; }`
        )
      }
      if (value.color) {
        acc.push(`#${id} .recharts-layer.${key} { fill: ${value.color}; }`)
      }
      return acc
    }, [] as string[])
  }, [config, id])

  if (!styles.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: styles.join("\n"),
      }}
    />
  )
}

// ChartTooltip Component  
export const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  CustomTooltipProps & React.HTMLAttributes<HTMLDivElement>
>(({ active, payload, label, className, ...props }, ref) => {
  const { config } = useChart()

  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
      {...props}
    >
      {label && (
        <div className="flex items-center gap-2">
          <div className="font-medium">{label}</div>
        </div>
      )}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const configItem = config[item.dataKey || item.name] || {}
          const value = 
            typeof item.value === "number" 
              ? item.value.toLocaleString()
              : item.value

          return (
            <div
              key={index}
              className="flex w-full items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color || configItem.color || "currentColor",
                  }}
                />
                <div className="text-muted-foreground">
                  {configItem.label || item.name}
                </div>
              </div>
              <div className="font-mono font-medium tabular-nums text-foreground">
                {value}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

ChartTooltip.displayName = "ChartTooltip"

// ChartTooltipContent - Wrapper для совместимости с Recharts
export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  RechartsTooltipProps<any, any> & {
    className?: string;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  }
>((props, ref) => {
  // Извлекаем нужные пропсы из RechartsTooltipProps
  const { active, payload, label, className } = props;
  
  return (
    <ChartTooltip
      ref={ref}
      active={active}
      payload={payload as CustomTooltipProps['payload']}
      label={label}
      className={className}
    />
  );
});

ChartTooltipContent.displayName = "ChartTooltipContent"

// ChartLegend Component
export const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
      {...props}
    />
  )
})

ChartLegend.displayName = "ChartLegend"

// ChartLegendContent - Wrapper для Legend
export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  Omit<LegendProps, "ref"> & {
    className?: string;
    nameKey?: string;
  }
>(({ className, ...props }, ref) => {
  const { config } = useChart()
  
  // Кастомный рендерер для легенды
  const renderLegend = (value: string, entry: any) => {
    const configItem = config[entry.dataKey || value] || {}
    return (
      <span className="text-xs text-muted-foreground">
        {configItem.label || value}
      </span>
    )
  }

  return (
    <Legend
      wrapperStyle={{}}
      formatter={renderLegend}
      {...props}
    />
  )
})

ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer as Chart,
}