import * as React from "react"
import { 
  Tooltip as RechartsTooltip,
  type TooltipProps,
  ResponsiveContainer,
  Legend,
  type LegendProps
} from "recharts"
import { cn } from "@/lib/utils"

// Конфигурация диаграммы с типизацией
export interface ChartConfig {
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

// Контекст диаграммы
interface ChartContextValue {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextValue | null>(null);

// Хук для использования контекста диаграммы
export const useChart = (): ChartContextValue => {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
};

// Основной контейнер диаграммы
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactElement;
}

export const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ config, children, className, ...props }, ref) => {
    const id = React.useId();
    
    const styles = React.useMemo(() => {
      return Object.entries(config).reduce((acc, [key, value]) => {
        if (value.color) {
          acc.push(`#${id} .recharts-layer.${key} { fill: ${value.color}; }`);
        }
        if (value.theme?.light) {
          acc.push(`#${id} .recharts-layer.${key} { fill: ${value.theme.light}; }`);
        }
        return acc;
      }, [] as string[]);
    }, [config, id]);

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          id={id}
          className={cn("flex aspect-video justify-center text-xs", className)}
          {...props}
        >
          {styles.length > 0 && (
            <style dangerouslySetInnerHTML={{ __html: styles.join("\n") }} />
          )}
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  }
);

ChartContainer.displayName = "Chart";

// Обертка для tooltip с правильной типизацией
interface ChartTooltipContentProps extends Partial<TooltipProps<any, any>> {
  className?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
}

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(({ 
  active, 
  payload: tooltipPayload, 
  label: tooltipLabel, 
  className,
  hideLabel,
  hideIndicator,
  ...props 
}, ref) => {
  const { config } = React.useContext(ChartContext) || { config: {} };

  if (!active || !tooltipPayload || !Array.isArray(tooltipPayload)) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!hideLabel && tooltipLabel && (
        <div className="flex items-center gap-2">
          <div className="font-medium">{tooltipLabel}</div>
        </div>
      )}
      <div className="grid gap-1.5">
        {tooltipPayload.map((item: any, index: number) => {
          const configItem = config[item.dataKey || item.name] || {};
          const value = 
            typeof item.value === "number" 
              ? item.value.toLocaleString()
              : item.value;

          return (
            <div
              key={index}
              className="flex w-full items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-1.5">
                {!hideIndicator && (
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor: item.color || configItem.color || "currentColor",
                    }}
                  />
                )}
                <div className="text-muted-foreground">
                  {configItem.label || item.name}
                </div>
              </div>
              <div className="font-mono font-medium tabular-nums text-foreground">
                {value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

ChartTooltipContent.displayName = "ChartTooltipContent";

// Компонент легенды с типизацией
interface ChartLegendContentProps extends Omit<LegendProps, "content"> {
  className?: string;
  nameKey?: string;
}

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(({ className, payload, ...props }, ref) => {
  const { config } = React.useContext(ChartContext) || { config: {} };

  if (!payload || !Array.isArray(payload)) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-center gap-4", className)}
    >
      {payload.map((entry: any, index: number) => {
        const configItem = config[entry.dataKey || entry.value] || {};
        return (
          <div key={index} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {configItem.label || entry.value}
            </span>
          </div>
        );
      })}
    </div>
  );
});

ChartLegendContent.displayName = "ChartLegendContent";

// Экспорты для обратной совместимости
export const Chart = ChartContainer;
export const ChartTooltip = ChartTooltipContent;
export const ChartLegend = ChartLegendContent;