'use client';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { createSnapModifier, restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useSession } from '@/lib/auth-client';
import { resolveCurrency } from '@/lib/currency';
import {
  aggregateDailyIncomes,
  formatCurrency,
  getCurrentMonthEntries,
  getMonthlyTotals,
  getPlatformDistribution,
} from '@/lib/income';
import { useIncomeLogs } from '@/lib/queries/income';
import { getSessionUser } from '@/lib/session';
import { DailyCadencePanel } from './_components/DailyCadencePanel';
import { DashboardStats } from './_components/DashboardStats';
import { LineChart } from './_components/LineChart';
import { PlatformBreakdownBarChart } from './_components/PlatformBreakdownBarChart';
import { PlatformBreakdownPieChart } from './_components/PlatformBreakdownPieChart';
import { PlatformConcentrationPanel } from './_components/PlatformConcentrationPanel';
import { RecentDaysPanel } from './_components/RecentDaysPanel';
import { TotalsTable } from './_components/TotalsTable';
import { YearlyRunRateChart } from './_components/YearlyRunRateChart';

const ORDER_STORAGE_KEY = 'dashboard-widget-order';
const VISIBILITY_STORAGE_KEY = 'dashboard-widget-visibility';

type WidgetId =
  | 'stats'
  | 'recentDays'
  | 'dailyCadence'
  | 'platformBreakdownPieChart'
  | 'platformBreakdownBarChart'
  | 'platformConcentration'
  | 'lineChart'
  | 'yearlyRunRate'
  | 'totalsTable';

type DashboardWidgetDefinition = {
  id: WidgetId;
  label: string;
  description: string;
  component: ReactNode;
  widthClass?: string;
};

type PersistedWidgetConfig = {
  order: WidgetId[];
  enabled: Record<WidgetId, boolean>;
};

const parseJson = <T,>(value: string | null): T | null => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const combineClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(' ');

const GRID_SIZE = 16;
const snapModifier = createSnapModifier(GRID_SIZE);

const buildDefaultOrder = (definitions: DashboardWidgetDefinition[]) =>
  definitions.map((widget) => widget.id);

const DEFAULT_WIDGET_VISIBILITY: Partial<Record<WidgetId, boolean>> = {
  platformBreakdownBarChart: false,
  platformConcentration: false,
  dailyCadence: false,
  yearlyRunRate: false,
};

const buildDefaultVisibility = (definitions: DashboardWidgetDefinition[]) =>
  definitions.reduce<Record<WidgetId, boolean>>(
    (state, widget) => {
      state[widget.id] = DEFAULT_WIDGET_VISIBILITY[widget.id] ?? true;
      return state;
    },
    {} as Record<WidgetId, boolean>,
  );

const normalizeStoredOrder = (
  stored: unknown,
  definitions: DashboardWidgetDefinition[],
): WidgetId[] => {
  const defaults = buildDefaultOrder(definitions);
  if (!Array.isArray(stored)) {
    return defaults;
  }
  const availableIds = new Set(defaults);
  const filtered = stored.filter((value): value is WidgetId => {
    if (typeof value !== 'string') {
      return false;
    }
    return availableIds.has(value as WidgetId);
  });
  const missing = defaults.filter((id) => !filtered.includes(id));
  return [...filtered, ...missing];
};

const hydrateVisibility = (
  stored: unknown,
  fallback: Record<WidgetId, boolean>,
): Record<WidgetId, boolean> => {
  const result = { ...fallback };
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
    Object.entries(stored).forEach(([key, value]) => {
      if (key in result) {
        result[key as WidgetId] = Boolean(value);
      }
    });
  }
  return result;
};

export default function DashboardPage() {
  const { data: sessionData, isPending } = useSession();
  const sessionUser = getSessionUser(sessionData);
  const currency = resolveCurrency(sessionUser?.currency);
  const { data: incomes = [] } = useIncomeLogs();

  const dailySummaries = useMemo(
    () => aggregateDailyIncomes(incomes),
    [incomes],
  );
  const totalIncome = useMemo(
    () => incomes.reduce((acc, row) => acc + row.amount, 0),
    [incomes],
  );
  const currentMonthEntries = useMemo(
    () => getCurrentMonthEntries(incomes),
    [incomes],
  );
  const platformDistribution = useMemo(
    () => getPlatformDistribution(currentMonthEntries),
    [currentMonthEntries],
  );
  const currentMonthTotal = useMemo(
    () => currentMonthEntries.reduce((acc, row) => acc + row.amount, 0),
    [currentMonthEntries],
  );
  const monthlyTotals = useMemo(() => getMonthlyTotals(incomes, 6), [incomes]);
  const trackedDaysCount = dailySummaries.length;
  const averagePerDay = trackedDaysCount ? totalIncome / trackedDaysCount : 0;
  const currentMonthLabel = monthlyTotals[0]?.label ?? 'Current month';
  const currentMonthEntriesCount = currentMonthEntries.length;
  const stats = useMemo(() => {
    const trackedDaysLabel = `Across ${trackedDaysCount} ${
      trackedDaysCount === 1 ? 'day' : 'days'
    } tracked`;

    return [
      {
        title: 'Total income',
        value: formatCurrency(totalIncome, currency),
        desc: trackedDaysLabel,
        valueClass: 'text-primary',
      },
      {
        title: 'Average / day',
        value: formatCurrency(averagePerDay, currency),
        desc: 'Consistent hustle',
        valueClass: 'text-secondary',
      },
      {
        title: 'Platforms this month',
        value: String(platformDistribution.length),
        desc: currentMonthLabel,
      },
      {
        title: 'Current month',
        value: formatCurrency(currentMonthTotal, currency),
        desc: `${currentMonthEntriesCount} entries logged`,
        valueClass: 'text-accent',
      },
    ];
  }, [
    totalIncome,
    averagePerDay,
    platformDistribution.length,
    currentMonthLabel,
    currentMonthTotal,
    currentMonthEntriesCount,
    trackedDaysCount,
    currency,
  ]);

  const widgetDefinitions = useMemo<DashboardWidgetDefinition[]>(
    () => [
      {
        id: 'stats',
        label: 'Stats',
        description: 'Income overview',
        widthClass: 'md:col-span-2',
        component: <DashboardStats stats={stats} />,
      },
      {
        id: 'dailyCadence',
        label: 'Daily cadence',
        description: 'Logging streak and weekly coverage',
        widthClass: 'md:col-span-1',
        component: <DailyCadencePanel dailySummaries={dailySummaries} />,
      },
      {
        id: 'recentDays',
        label: 'Recent days',
        description: 'Most recent daily totals',
        widthClass: 'md:col-span-1',
        component: (
          <RecentDaysPanel
            dailySummaries={dailySummaries}
            currency={currency}
          />
        ),
      },
      {
        id: 'platformConcentration',
        label: 'Platform concentration',
        description: 'Top-earning platforms this month',
        widthClass: 'md:col-span-1',
        component: (
          <PlatformConcentrationPanel
            platformDistribution={platformDistribution}
            currency={currency}
          />
        ),
      },
      {
        id: 'platformBreakdownPieChart',
        label: 'Platform breakdown (Pie Chart)',
        description: 'Income share per platform',
        widthClass: 'md:col-span-1',
        component: (
          <PlatformBreakdownPieChart incomes={incomes} currency={currency} />
        ),
      },
      {
        id: 'platformBreakdownBarChart',
        label: 'Platform breakdown (Bar Chart)',
        description: 'Alternative view of platform share',
        widthClass: 'md:col-span-1',
        component: (
          <PlatformBreakdownBarChart incomes={incomes} currency={currency} />
        ),
      },
      {
        id: 'lineChart',
        label: 'Income trend',
        description: 'Track time-based momentum',
        widthClass: 'md:col-span-2',
        component: <LineChart incomes={incomes} currency={currency} />,
      },
      {
        id: 'yearlyRunRate',
        label: 'Yearly run rate',
        description: 'Monthly totals for the current year',
        widthClass: 'md:col-span-2',
        component: <YearlyRunRateChart incomes={incomes} currency={currency} />,
      },
      {
        id: 'totalsTable',
        label: 'Totals',
        description: 'Rolling performance tables',
        widthClass: 'md:col-span-2',
        component: <TotalsTable incomes={incomes} currency={currency} />,
      },
    ],
    [stats, dailySummaries, incomes, currency, platformDistribution],
  );

  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>(() =>
    buildDefaultOrder(widgetDefinitions),
  );
  const [widgetEnabled, setWidgetEnabled] = useState<Record<WidgetId, boolean>>(
    () => buildDefaultVisibility(widgetDefinitions),
  );
  const [persistedConfig, setPersistedConfig] = useState<PersistedWidgetConfig>(
    () => ({
      order: buildDefaultOrder(widgetDefinitions),
      enabled: buildDefaultVisibility(widgetDefinitions),
    }),
  );
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeWidgetId, setActiveWidgetId] = useState<WidgetId | null>(null);
  const hasLoadedPersisted = useRef(false);

  useEffect(() => {
    if (hasLoadedPersisted.current) {
      return;
    }
    hasLoadedPersisted.current = true;
    if (typeof window === 'undefined') {
      return;
    }
    const storedOrder = parseJson<WidgetId[]>(
      window.localStorage.getItem(ORDER_STORAGE_KEY),
    );
    const storedVisibility = parseJson<Record<string, boolean>>(
      window.localStorage.getItem(VISIBILITY_STORAGE_KEY),
    );

    const normalizedOrder = normalizeStoredOrder(
      storedOrder,
      widgetDefinitions,
    );
    const normalizedVisibility = hydrateVisibility(
      storedVisibility,
      buildDefaultVisibility(widgetDefinitions),
    );

    setWidgetOrder(normalizedOrder);
    setWidgetEnabled(normalizedVisibility);
    setPersistedConfig({
      order: [...normalizedOrder],
      enabled: { ...normalizedVisibility },
    });
  }, [widgetDefinitions]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mql = window.matchMedia('(max-width: 767px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileView(event.matches);
    };
    setIsMobileView(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => {
      mql.removeEventListener('change', handleChange);
    };
  }, []);

  const widgetDefinitionMap = useMemo(
    () =>
      widgetDefinitions.reduce<Record<WidgetId, DashboardWidgetDefinition>>(
        (state, widget) => {
          state[widget.id] = widget;
          return state;
        },
        {} as Record<WidgetId, DashboardWidgetDefinition>,
      ),
    [widgetDefinitions],
  );

  const sensorConfig = {
    activationConstraint: {
      distance: 6,
    },
  };

  const sensors = useSensors(
    useSensor(isMobileView ? TouchSensor : PointerSensor, sensorConfig),
  );

  const drawerSensors = useSensors(
    useSensor(isMobileView ? TouchSensor : PointerSensor, sensorConfig),
  );

  const visibleWidgetIds = useMemo(
    () => widgetOrder.filter((id) => widgetEnabled[id]),
    [widgetOrder, widgetEnabled],
  );

  const activeWidgetDefinition = activeWidgetId
    ? widgetDefinitionMap[activeWidgetId]
    : null;

  const persistConfig = (
    order: WidgetId[],
    enabled: Record<WidgetId, boolean>,
  ) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
    window.localStorage.setItem(
      VISIBILITY_STORAGE_KEY,
      JSON.stringify(enabled),
    );
    setPersistedConfig({
      order: [...order],
      enabled: { ...enabled },
    });
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    if (!isCustomizing) {
      return;
    }
    setActiveWidgetId(active.id as WidgetId);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!isCustomizing) {
      return;
    }
    if (!over || active.id === over.id) {
      return;
    }
    setWidgetOrder((currentOrder) => {
      const oldIndex = currentOrder.indexOf(active.id as WidgetId);
      const newIndex = currentOrder.indexOf(over.id as WidgetId);
      if (oldIndex === -1 || newIndex === -1) {
        return currentOrder;
      }
      return arrayMove(currentOrder, oldIndex, newIndex);
    });
    setActiveWidgetId(null);
  };

  const handleDrawerDragEnd = ({ active, over }: DragEndEvent) => {
    if (!isMobileView) {
      return;
    }
    if (!over || active.id === over.id) {
      return;
    }
    setWidgetOrder((currentOrder) => {
      const oldIndex = currentOrder.indexOf(active.id as WidgetId);
      const newIndex = currentOrder.indexOf(over.id as WidgetId);
      if (oldIndex === -1 || newIndex === -1) {
        return currentOrder;
      }
      return arrayMove(currentOrder, oldIndex, newIndex);
    });
  };

  const handleDragCancel = () => {
    setActiveWidgetId(null);
  };

  const handleToggleWidget = (widgetId: WidgetId) => {
    setWidgetEnabled((prev) => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  };

  const handleStartCustomizing = () => {
    setWidgetOrder(persistedConfig.order);
    setWidgetEnabled(persistedConfig.enabled);
    setIsCustomizing(true);
    setActiveWidgetId(null);
  };

  const handleFinishCustomizing = () => {
    persistConfig(widgetOrder, widgetEnabled);
    setIsCustomizing(false);
    setActiveWidgetId(null);
  };

  const handleCancelCustomizing = () => {
    setWidgetOrder(persistedConfig.order);
    setWidgetEnabled(persistedConfig.enabled);
    setIsCustomizing(false);
    setActiveWidgetId(null);
  };

  if (isPending) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <div className='loading loading-dots loading-lg'>Loading stats…</div>
      </div>
    );
  }

  return (
    <div
      className={`drawer drawer-bottom ${isCustomizing ? 'drawer-open' : ''}`}
    >
      <input
        id='dashboard-customize-drawer'
        type='checkbox'
        className='drawer-toggle'
        checked={isCustomizing}
        onChange={() => {}}
      />
      <div className='drawer-content relative'>
        <div className='space-y-6'>
          <header className='space-y-1'>
            <p className='text-xs uppercase text-base-content/60'>Dashboard</p>
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-2'>
              <div className='text-3xl font-semibold text-base-content flex flex-col gap-1'>
                <h1 className='flex flex-col'>
                  <span>Welcome back,</span>
                  <span>
                    {sessionUser?.name ?? sessionUser?.email ?? 'gig worker'}
                  </span>
                </h1>
                <p className='text-sm text-base-content/60'>
                  Track income, spot trends, and level up your earnings.
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-2'>
                {!isCustomizing ? (
                  <button
                    type='button'
                    className='btn btn-sm btn-primary'
                    onClick={handleStartCustomizing}
                  >
                    Customize dashboard
                  </button>
                ) : (
                  !isMobileView && (
                    <>
                      <button
                        type='button'
                        className='btn btn-sm btn-primary'
                        onClick={handleFinishCustomizing}
                      >
                        Finish customizing
                      </button>
                      <button
                        type='button'
                        className='btn btn-sm btn-ghost'
                        onClick={handleCancelCustomizing}
                      >
                        Cancel
                      </button>
                    </>
                  )
                )}
              </div>
            </div>
          </header>

          <DndContext
            sensors={sensors}
            modifiers={[restrictToWindowEdges, snapModifier]}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            collisionDetection={closestCenter}
          >
            <SortableContext
              items={visibleWidgetIds}
              strategy={verticalListSortingStrategy}
            >
              <div className='grid gap-6 md:grid-cols-2'>
                {visibleWidgetIds.map((widgetId) => {
                  const definition = widgetDefinitionMap[widgetId];
                  if (!definition) {
                    return null;
                  }
                  const disabled = !widgetEnabled[widgetId];
                  return (
                    <SortableWidget
                      key={widgetId}
                      id={widgetId}
                      isCustomizing={isCustomizing}
                      isDisabled={disabled}
                      className={definition.widthClass}
                      disableHandle={isMobileView}
                    >
                      {definition.component}
                    </SortableWidget>
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay
              dropAnimation={null}
              adjustScale={false}
              modifiers={[restrictToWindowEdges, snapModifier]}
            >
              {activeWidgetDefinition ? (
                <div className='pointer-events-none rounded-[inherit] border border-base-content/10 bg-base-100 shadow-2xl'>
                  {activeWidgetDefinition.component}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
      {isCustomizing && (
        <div className='drawer-side pointer-events-none'>
          <aside
            className={`fixed ${
              isMobileView
                ? 'inset-0 mx-auto w-full max-w-full border-none'
                : 'bottom-0 left-0 right-0 mx-auto w-full max-w-3xl'
            } z-50 bg-base-100/95 p-6 shadow-2xl backdrop-blur-lg pointer-events-auto ${
              isMobileView
                ? 'h-screen overflow-y-auto'
                : 'max-h-[45vh] overflow-y-auto'
            }`}
          >
            <div className='space-y-4'>
              <div>
                <p className='text-sm uppercase text-base-content/60'>
                  Customize widgets
                </p>
                <h2 className='text-lg font-semibold text-base-content'>
                  Available blocks
                </h2>
                <p className='text-xs text-base-content/60'>
                  Toggle widgets on or off before saving your custom layout.
                </p>
              </div>
              <div className='space-y-3'>
                {isMobileView ? (
                  <DndContext
                    sensors={drawerSensors}
                    onDragEnd={handleDrawerDragEnd}
                  >
                    <SortableContext
                      items={widgetOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className='space-y-3'>
                        {widgetOrder.map((widgetId) => {
                          const definition = widgetDefinitionMap[widgetId];
                          if (!definition) {
                            return null;
                          }
                          return (
                            <DrawerSortableItem
                              key={definition.id}
                              widget={definition}
                              isEnabled={Boolean(widgetEnabled[definition.id])}
                              onToggle={() => handleToggleWidget(definition.id)}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  widgetDefinitions.map((widget) => (
                    <label
                      key={widget.id}
                      className='flex items-center justify-between rounded-lg border border-base-content/10 bg-base-200/50 p-3'
                    >
                      <div>
                        <p className='font-semibold text-base-content'>
                          {widget.label}
                        </p>
                        <p className='text-xs text-base-content/60'>
                          {widget.description}
                        </p>
                      </div>
                      <input
                        type='checkbox'
                        className='toggle toggle-primary toggle-sm'
                        checked={Boolean(widgetEnabled[widget.id])}
                        onChange={() => handleToggleWidget(widget.id)}
                      />
                    </label>
                  ))
                )}
              </div>
              {isMobileView && (
                <div className='flex flex-wrap justify-end gap-2'>
                  <button
                    type='button'
                    className='btn btn-sm btn-primary'
                    onClick={handleFinishCustomizing}
                  >
                    Finish customizing
                  </button>
                  <button
                    type='button'
                    className='btn btn-sm btn-ghost'
                    onClick={handleCancelCustomizing}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

type SortableWidgetProps = {
  id: WidgetId;
  children: ReactNode;
  isCustomizing: boolean;
  isDisabled: boolean;
  className?: string;
  disableHandle?: boolean;
};

function SortableWidget({
  children,
  id,
  isCustomizing,
  className,
  disableHandle,
}: SortableWidgetProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) {
      return;
    }
    const updateHeight = () => {
      setContentHeight(node.offsetHeight);
    };
    const updateWidth = () => {
      setContentWidth(node.offsetWidth);
    };
    updateHeight();
    updateWidth();
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
      updateWidth();
    });
    resizeObserver.observe(node);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const style = {
    transform: CSS.Transform.toString(transform) || undefined,
    transition,
    zIndex: isDragging ? 40 : undefined,
    minHeight: isDragging && contentHeight ? `${contentHeight}px` : undefined,
    minWidth: isDragging && contentWidth ? `${contentWidth}px` : undefined,
    height: isDragging && contentHeight ? `${contentHeight}px` : undefined,
    width: isDragging && contentWidth ? `${contentWidth}px` : undefined,
  };

  const rootClassName = combineClasses('group relative', className);

  return (
    <div ref={setNodeRef} style={style} className={rootClassName}>
      {isCustomizing && (
        <div
          className='pointer-events-none absolute inset-0 z-10 bg-base-content/10 transition-colors duration-200'
          aria-hidden='true'
        />
      )}
      {isCustomizing && !disableHandle && (
        <button
          type='button'
          {...attributes}
          {...listeners}
          className='btn btn-ghost btn-xs absolute right-3 top-3 z-10 h-8 w-8 rounded-full p-0 text-base-content/60 transition hover:text-base-content'
          aria-label={`Drag ${id} widget`}
        >
          <span aria-hidden className='flex flex-col gap-1'>
            <span className='h-0.5 w-4 rounded-full bg-current' />
            <span className='h-0.5 w-4 rounded-full bg-current' />
          </span>
        </button>
      )}
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

type DrawerSortableItemProps = {
  widget: DashboardWidgetDefinition;
  isEnabled: boolean;
  onToggle: () => void;
};

function DrawerSortableItem({
  widget,
  isEnabled,
  onToggle,
}: DrawerSortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform) || undefined,
    transition,
    zIndex: isDragging ? 30 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex items-center justify-between gap-4 rounded-lg border border-base-content/10 bg-base-200/50 p-3'
    >
      <div className='flex-1'>
        <p className='font-semibold text-base-content'>{widget.label}</p>
        <p className='text-xs text-base-content/60'>{widget.description}</p>
      </div>
      <div className='flex items-center gap-3'>
        <input
          type='checkbox'
          className='toggle toggle-primary toggle-sm'
          checked={isEnabled}
          onChange={onToggle}
        />
        <button
          type='button'
          {...attributes}
          {...listeners}
          className='btn btn-ghost btn-xs h-8 w-8 p-0 text-base-content/70'
          aria-label={`Drag ${widget.label}`}
        >
          <span aria-hidden className='flex flex-col gap-1'>
            <span className='h-0.5 w-3 rounded-full bg-current' />
            <span className='h-0.5 w-3 rounded-full bg-current' />
          </span>
        </button>
      </div>
    </div>
  );
}
