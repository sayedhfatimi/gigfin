'use client';

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
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { QuickAddFAB } from '@/components/actions/QuickAddFAB';
import { GlobalTimeframeFilterCompact } from '@/components/filters/GlobalTimeframeFilter';
import { DashboardSkeleton } from '@/components/skeletons/DashboardSkeletons';
import { useSession } from '@/lib/auth-client';
import { GlobalTimeframeProvider } from '@/lib/contexts/GlobalTimeframeContext';
import {
  type DashboardWidgetDefinition,
  useDashboardData,
  useWidgetConfig,
  type WidgetId,
} from '@/lib/hooks';
import { getSessionUser } from '@/lib/session';

import { DailyCadenceWidget } from './_components/DailyCadenceWidget';
import { DashboardStatsWidget } from './_components/DashboardStatsWidget';
import { DrivingStatsWidget } from './_components/DrivingStatsWidget';
import { ExpenseCategoryBreakdownWidget } from './_components/ExpenseCategoryBreakdownWidget';
import { ExpenseOverviewWidget } from './_components/ExpenseOverviewWidget';
import { FuelConsumptionWidget } from './_components/FuelConsumptionWidget';
import { GoalTrackerWidget } from './_components/GoalTrackerWidget';
import { IncomePerMileTrendWidget } from './_components/IncomePerMileTrendWidget';
import { LineChartWidget } from './_components/LineChartWidget';
import { MileageDeductionWidget } from './_components/MileageDeductionWidget';
import { PlatformBreakdownWidget } from './_components/PlatformBreakdownWidget';
import { PlatformConcentrationWidget } from './_components/PlatformConcentrationWidget';
import { ProfitabilityWidget } from './_components/ProfitabilityWidget';
import { RecentDaysWidget } from './_components/RecentDaysWidget';
import { TaxEstimatorWidget } from './_components/TaxEstimatorWidget';
// Widgets
import { TodaySnapshotWidget } from './_components/TodaySnapshotWidget';
import { TotalsTableWidget } from './_components/TotalsTableWidget';
import { YearlyRunRateWidget } from './_components/YearlyRunRateWidget';

const combineClasses = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(' ');

const GRID_SIZE = 16;
const snapModifier = createSnapModifier(GRID_SIZE);

export default function DashboardPage() {
  const { data: sessionData, isPending: isSessionPending } = useSession();
  const sessionUser = getSessionUser(sessionData);

  const dashboardData = useDashboardData({ sessionUser });

  const {
    incomes,
    expenses,
    odometerEntries,
    isLoading,
    currency,
    odometerUnit,
    dailySummaries,
    platformDistribution,
    stats,
    todayIncome,
    todayExpenses,
    todayNet,
    yesterdayNet,
    todayIncomeCount,
    todayExpenseCount,
  } = dashboardData;

  // Build widget definitions with current data
  const widgetDefinitions = useMemo<DashboardWidgetDefinition[]>(
    () => [
      {
        id: 'todaySnapshot',
        label: "Today's Snapshot",
        description: 'Real-time daily performance',
        widthClass: 'md:col-span-2',
        pinned: true,
        component: (
          <TodaySnapshotWidget
            todayIncome={todayIncome}
            todayExpenses={todayExpenses}
            todayNet={todayNet}
            yesterdayNet={yesterdayNet}
            todayIncomeCount={todayIncomeCount}
            todayExpenseCount={todayExpenseCount}
            currency={currency}
          />
        ),
      },
      {
        id: 'goalTracker',
        label: 'Goal Tracker',
        description: 'Weekly/monthly income targets',
        widthClass: 'md:col-span-1',
        component: <GoalTrackerWidget incomes={incomes} currency={currency} />,
      },
      {
        id: 'stats',
        label: 'Stats Overview',
        description: 'Key income metrics',
        widthClass: 'md:col-span-2',
        component: <DashboardStatsWidget stats={stats} />,
      },
      {
        id: 'drivingStats',
        label: 'Driving Stats',
        description: 'Distance-based KPIs',
        widthClass: 'md:col-span-2',
        component: (
          <DrivingStatsWidget
            expenses={expenses}
            incomes={incomes}
            currency={currency}
            odometerUnit={odometerUnit}
          />
        ),
      },
      {
        id: 'incomePerMileTrend',
        label: 'Income Per Mile',
        description: 'Income efficiency trend from odometer days',
        widthClass: 'md:col-span-2',
        component: (
          <IncomePerMileTrendWidget
            incomes={incomes}
            odometerEntries={odometerEntries}
            currency={currency}
            odometerUnit={odometerUnit}
          />
        ),
      },
      {
        id: 'profitability',
        label: 'Profitability',
        description: 'Net profit and margins',
        widthClass: 'md:col-span-1',
        component: (
          <ProfitabilityWidget
            incomes={incomes}
            expenses={expenses}
            currency={currency}
          />
        ),
      },
      {
        id: 'expenseOverview',
        label: 'Spend Overview',
        description: 'Current spend at a glance',
        widthClass: 'md:col-span-1',
        component: (
          <ExpenseOverviewWidget expenses={expenses} currency={currency} />
        ),
      },
      {
        id: 'expenseCategoryBreakdown',
        label: 'Expense Breakdown',
        description: 'Spend by category',
        widthClass: 'md:col-span-1',
        component: (
          <ExpenseCategoryBreakdownWidget
            expenses={expenses}
            currency={currency}
          />
        ),
      },
      {
        id: 'fuelConsumption',
        label: 'Fuel & Energy',
        description: 'Track consumption by vehicle',
        widthClass: 'md:col-span-1',
        component: <FuelConsumptionWidget expenses={expenses} />,
      },
      {
        id: 'dailyCadence',
        label: 'Daily Cadence',
        description: 'Logging streak and coverage',
        widthClass: 'md:col-span-1',
        component: <DailyCadenceWidget dailySummaries={dailySummaries} />,
      },
      {
        id: 'recentDays',
        label: 'Recent Days',
        description: 'Most recent daily totals',
        widthClass: 'md:col-span-1',
        component: (
          <RecentDaysWidget
            dailySummaries={dailySummaries}
            currency={currency}
          />
        ),
      },
      {
        id: 'platformConcentration',
        label: 'Platform Focus',
        description: 'Top-earning platforms',
        widthClass: 'md:col-span-1',
        component: (
          <PlatformConcentrationWidget
            platformDistribution={platformDistribution}
            currency={currency}
          />
        ),
      },
      {
        id: 'platformBreakdown',
        label: 'Platform Breakdown',
        description: 'Income share per platform',
        widthClass: 'md:col-span-1',
        component: (
          <PlatformBreakdownWidget incomes={incomes} currency={currency} />
        ),
      },
      {
        id: 'lineChart',
        label: 'Income Trend',
        description: 'Track time-based momentum',
        widthClass: 'md:col-span-2',
        component: (
          <LineChartWidget
            incomes={incomes}
            expenses={expenses}
            currency={currency}
          />
        ),
      },
      {
        id: 'yearlyRunRate',
        label: 'Yearly Run Rate',
        description: 'Monthly totals this year',
        widthClass: 'md:col-span-2',
        component: (
          <YearlyRunRateWidget
            incomes={incomes}
            expenses={expenses}
            currency={currency}
          />
        ),
      },
      {
        id: 'totalsTable',
        label: 'Totals Table',
        description: 'Rolling performance tables',
        widthClass: 'md:col-span-2',
        component: (
          <TotalsTableWidget
            incomes={incomes}
            expenses={expenses}
            currency={currency}
          />
        ),
      },
      {
        id: 'taxEstimator',
        label: 'Tax Estimator',
        description: 'Estimate self-employment taxes',
        widthClass: 'md:col-span-1',
        component: (
          <TaxEstimatorWidget
            incomes={incomes}
            expenses={expenses}
            currency={currency}
          />
        ),
      },
      {
        id: 'mileageDeduction',
        label: 'Mileage Deduction',
        description: 'Track IRS mileage deductions',
        widthClass: 'md:col-span-1',
        component: (
          <MileageDeductionWidget
            odometerEntries={odometerEntries}
            odometerUnit={odometerUnit}
            currency={currency}
          />
        ),
      },
    ],
    [
      stats,
      dailySummaries,
      incomes,
      currency,
      platformDistribution,
      expenses,
      odometerUnit,
      odometerEntries,
      todayIncome,
      todayExpenses,
      todayNet,
      yesterdayNet,
      todayIncomeCount,
      todayExpenseCount,
    ],
  );

  const widgetConfig = useWidgetConfig(widgetDefinitions);
  const {
    widgetOrder,
    widgetEnabled,
    isCustomizing,
    isMobileView,
    pinnedWidgetIds,
    sortableWidgetIds,
    widgetDefinitionMap,
    activeWidgetDefinition,
    handleDragStart,
    handleDragEnd,
    handleDrawerDragEnd,
    handleDragCancel,
    handleToggleWidget,
    handleStartCustomizing,
    handleFinishCustomizing,
    handleCancelCustomizing,
    handleResetToDefaults,
  } = widgetConfig;

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

  if (isSessionPending || isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <GlobalTimeframeProvider>
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
          <div className='space-y-4 sm:space-y-6'>
            {/* Header */}
            <header className='flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between'>
              <div className='flex items-center gap-3 sm:gap-4'>
                <div className='flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/20'>
                  <i className='fa-solid fa-chart-line text-lg sm:text-xl text-primary' />
                </div>
                <div>
                  <p className='text-xs uppercase text-base-content/60'>
                    Dashboard
                  </p>
                  <h1 className='text-xl sm:text-2xl font-semibold text-base-content'>
                    <span className='sm:inline'>Welcome back,</span>
                    <br className='sm:hidden' />
                    <span className='hidden sm:inline'> </span>
                    {sessionUser?.name ?? sessionUser?.email ?? 'gig worker'}
                  </h1>
                  <p className='hidden sm:block text-sm text-base-content/60'>
                    Track income, spot trends, and level up your earnings.
                  </p>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-3'>
                <GlobalTimeframeFilterCompact />
                {!isCustomizing ? (
                  <button
                    type='button'
                    className='btn btn-sm btn-ghost btn-outline gap-2'
                    onClick={handleStartCustomizing}
                  >
                    <span className='fa-solid fa-sliders' aria-hidden='true' />
                    Customize
                  </button>
                ) : (
                  !isMobileView && (
                    <>
                      <button
                        type='button'
                        className='btn btn-sm btn-primary gap-2'
                        onClick={handleFinishCustomizing}
                      >
                        <span
                          className='fa-solid fa-check'
                          aria-hidden='true'
                        />
                        Done
                      </button>
                      <button
                        type='button'
                        className='btn btn-sm btn-ghost gap-2'
                        onClick={handleResetToDefaults}
                      >
                        <span
                          className='fa-solid fa-rotate-left'
                          aria-hidden='true'
                        />
                        Reset
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
            </header>

            {/* Pinned Widgets (always at top) */}
            {pinnedWidgetIds.length > 0 && (
              <div className='grid gap-6 md:grid-cols-2'>
                {pinnedWidgetIds.map((widgetId) => {
                  const definition = widgetDefinitionMap[widgetId];
                  if (!definition) return null;
                  return (
                    <div
                      key={widgetId}
                      className={combineClasses(
                        'min-w-0 overflow-hidden',
                        definition.widthClass,
                      )}
                    >
                      {definition.component}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Sortable Widgets */}
            <DndContext
              sensors={sensors}
              modifiers={[restrictToWindowEdges, snapModifier]}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
              collisionDetection={closestCenter}
            >
              <SortableContext
                items={sortableWidgetIds}
                strategy={verticalListSortingStrategy}
              >
                <div className='grid gap-6 md:grid-cols-2'>
                  {sortableWidgetIds.map((widgetId) => {
                    const definition = widgetDefinitionMap[widgetId];
                    if (!definition) return null;
                    return (
                      <SortableWidget
                        key={widgetId}
                        id={widgetId}
                        isCustomizing={isCustomizing}
                        isDisabled={!widgetEnabled[widgetId]}
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

        {/* Customize Drawer */}
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
              <div
                className={combineClasses(
                  'space-y-4',
                  isMobileView ? 'pb-24' : undefined,
                )}
              >
                <div>
                  <p className='text-sm uppercase text-base-content/60'>
                    Customize widgets
                  </p>
                  <h2 className='text-lg font-semibold text-base-content'>
                    Available blocks
                  </h2>
                  <p className='text-xs text-base-content/60'>
                    Toggle widgets on or off and drag to reorder.
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
                            if (!definition || definition.pinned) return null;
                            return (
                              <DrawerSortableItem
                                key={definition.id}
                                widget={definition}
                                isEnabled={Boolean(
                                  widgetEnabled[definition.id],
                                )}
                                onToggle={() =>
                                  handleToggleWidget(definition.id)
                                }
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    widgetDefinitions
                      .filter((w) => !w.pinned)
                      .map((widget) => (
                        <label
                          key={widget.id}
                          className='flex items-center justify-between rounded-lg border border-base-content/10 bg-base-200/50 p-3 cursor-pointer hover:bg-base-200'
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
                      <span
                        className='fa-solid fa-check mr-1'
                        aria-hidden='true'
                      />
                      Finish
                    </button>
                    <button
                      type='button'
                      className='btn btn-sm btn-error'
                      onClick={handleResetToDefaults}
                    >
                      <span
                        className='fa-solid fa-rotate-left'
                        aria-hidden='true'
                      />
                      Reset
                    </button>
                    <button
                      type='button'
                      className='btn btn-sm btn-ghost btn-outline'
                      onClick={handleCancelCustomizing}
                    >
                      <span className='fa-solid fa-xmark' aria-hidden='true' />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Quick Add FAB */}
      <QuickAddFAB />
    </GlobalTimeframeProvider>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

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
    if (!node) return;

    const updateDimensions = () => {
      setContentHeight(node.offsetHeight);
      setContentWidth(node.offsetWidth);
    };
    updateDimensions();

    if (typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver(updateDimensions);
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

  const rootClassName = combineClasses(
    'group relative min-w-0 overflow-hidden',
    className,
  );

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
      <div ref={contentRef} className='min-w-0 w-full overflow-hidden'>
        {children}
      </div>
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
