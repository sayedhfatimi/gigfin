'use client';

import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ORDER_STORAGE_KEY = 'dashboard-widget-order';
const VISIBILITY_STORAGE_KEY = 'dashboard-widget-visibility';

export type WidgetId =
  | 'todaySnapshot'
  | 'stats'
  | 'drivingStats'
  | 'profitability'
  | 'expenseOverview'
  | 'expenseCategoryBreakdown'
  | 'fuelConsumption'
  | 'recentDays'
  | 'dailyCadence'
  | 'platformBreakdown'
  | 'platformConcentration'
  | 'lineChart'
  | 'yearlyRunRate'
  | 'totalsTable'
  | 'goalTracker'
  | 'taxEstimator'
  | 'mileageDeduction';

export type DashboardWidgetDefinition = {
  id: WidgetId;
  label: string;
  description: string;
  component: ReactNode;
  widthClass?: string;
  /** If true, widget is always at the top and cannot be reordered */
  pinned?: boolean;
};

export type PersistedWidgetConfig = {
  order: WidgetId[];
  enabled: Record<WidgetId, boolean>;
};

const parseJson = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

/** Default visibility - widgets set to false are hidden by default */
const DEFAULT_WIDGET_VISIBILITY: Partial<Record<WidgetId, boolean>> = {
  drivingStats: false,
  platformConcentration: false,
  dailyCadence: false,
  recentDays: false,
  fuelConsumption: false,
  goalTracker: false,
};

const buildDefaultOrder = (
  definitions: DashboardWidgetDefinition[],
): WidgetId[] => definitions.map((widget) => widget.id);

const buildDefaultVisibility = (
  definitions: DashboardWidgetDefinition[],
): Record<WidgetId, boolean> =>
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
  if (!Array.isArray(stored)) return defaults;

  const availableIds = new Set(defaults);
  const filtered = stored.filter((value): value is WidgetId => {
    if (typeof value !== 'string') return false;
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
    for (const [key, value] of Object.entries(stored)) {
      if (key in result) {
        result[key as WidgetId] = Boolean(value);
      }
    }
  }
  return result;
};

export type UseWidgetConfigResult = {
  // State
  widgetOrder: WidgetId[];
  widgetEnabled: Record<WidgetId, boolean>;
  isCustomizing: boolean;
  activeWidgetId: WidgetId | null;
  isMobileView: boolean;

  // Computed
  visibleWidgetIds: WidgetId[];
  pinnedWidgetIds: WidgetId[];
  sortableWidgetIds: WidgetId[];
  widgetDefinitionMap: Record<WidgetId, DashboardWidgetDefinition>;
  activeWidgetDefinition: DashboardWidgetDefinition | null;

  // Actions
  setWidgetOrder: (order: WidgetId[]) => void;
  setWidgetEnabled: (enabled: Record<WidgetId, boolean>) => void;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDrawerDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
  handleToggleWidget: (widgetId: WidgetId) => void;
  handleStartCustomizing: () => void;
  handleFinishCustomizing: () => void;
  handleCancelCustomizing: () => void;
  handleResetToDefaults: () => void;
};

/**
 * Hook for managing dashboard widget configuration, ordering, and visibility
 */
export function useWidgetConfig(
  widgetDefinitions: DashboardWidgetDefinition[],
): UseWidgetConfigResult {
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

  // Load persisted config on mount
  useEffect(() => {
    if (hasLoadedPersisted.current) return;
    hasLoadedPersisted.current = true;
    if (typeof window === 'undefined') return;

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

  // Track mobile view
  useEffect(() => {
    if (typeof window === 'undefined') return;

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

  // Separate pinned and sortable widgets
  const pinnedWidgetIds = useMemo(
    () =>
      widgetOrder.filter(
        (id) => widgetDefinitionMap[id]?.pinned && widgetEnabled[id],
      ),
    [widgetOrder, widgetDefinitionMap, widgetEnabled],
  );

  const sortableWidgetIds = useMemo(
    () =>
      widgetOrder.filter(
        (id) => !widgetDefinitionMap[id]?.pinned && widgetEnabled[id],
      ),
    [widgetOrder, widgetDefinitionMap, widgetEnabled],
  );

  const visibleWidgetIds = useMemo(
    () => widgetOrder.filter((id) => widgetEnabled[id]),
    [widgetOrder, widgetEnabled],
  );

  const activeWidgetDefinition = activeWidgetId
    ? widgetDefinitionMap[activeWidgetId]
    : null;

  const persistConfig = useCallback(
    (order: WidgetId[], enabled: Record<WidgetId, boolean>) => {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
      window.localStorage.setItem(
        VISIBILITY_STORAGE_KEY,
        JSON.stringify(enabled),
      );
      setPersistedConfig({
        order: [...order],
        enabled: { ...enabled },
      });
    },
    [],
  );

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      if (!isCustomizing) return;
      setActiveWidgetId(active.id as WidgetId);
    },
    [isCustomizing],
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!isCustomizing) return;
      if (!over || active.id === over.id) return;

      setWidgetOrder((currentOrder) => {
        const oldIndex = currentOrder.indexOf(active.id as WidgetId);
        const newIndex = currentOrder.indexOf(over.id as WidgetId);
        if (oldIndex === -1 || newIndex === -1) return currentOrder;
        return arrayMove(currentOrder, oldIndex, newIndex);
      });
      setActiveWidgetId(null);
    },
    [isCustomizing],
  );

  const handleDrawerDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!isMobileView) return;
      if (!over || active.id === over.id) return;

      setWidgetOrder((currentOrder) => {
        const oldIndex = currentOrder.indexOf(active.id as WidgetId);
        const newIndex = currentOrder.indexOf(over.id as WidgetId);
        if (oldIndex === -1 || newIndex === -1) return currentOrder;
        return arrayMove(currentOrder, oldIndex, newIndex);
      });
    },
    [isMobileView],
  );

  const handleDragCancel = useCallback(() => {
    setActiveWidgetId(null);
  }, []);

  const handleToggleWidget = useCallback((widgetId: WidgetId) => {
    setWidgetEnabled((prev) => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  }, []);

  const handleStartCustomizing = useCallback(() => {
    setWidgetOrder(persistedConfig.order);
    setWidgetEnabled(persistedConfig.enabled);
    setIsCustomizing(true);
    setActiveWidgetId(null);
  }, [persistedConfig]);

  const handleFinishCustomizing = useCallback(() => {
    persistConfig(widgetOrder, widgetEnabled);
    setIsCustomizing(false);
    setActiveWidgetId(null);
  }, [persistConfig, widgetOrder, widgetEnabled]);

  const handleCancelCustomizing = useCallback(() => {
    setWidgetOrder(persistedConfig.order);
    setWidgetEnabled(persistedConfig.enabled);
    setIsCustomizing(false);
    setActiveWidgetId(null);
  }, [persistedConfig]);

  const handleResetToDefaults = useCallback(() => {
    const defaultOrder = buildDefaultOrder(widgetDefinitions);
    const defaultVisibility = buildDefaultVisibility(widgetDefinitions);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ORDER_STORAGE_KEY);
      window.localStorage.removeItem(VISIBILITY_STORAGE_KEY);
    }

    setWidgetOrder(defaultOrder);
    setWidgetEnabled(defaultVisibility);
    setPersistedConfig({
      order: [...defaultOrder],
      enabled: { ...defaultVisibility },
    });
    setActiveWidgetId(null);
  }, [widgetDefinitions]);

  return {
    // State
    widgetOrder,
    widgetEnabled,
    isCustomizing,
    activeWidgetId,
    isMobileView,

    // Computed
    visibleWidgetIds,
    pinnedWidgetIds,
    sortableWidgetIds,
    widgetDefinitionMap,
    activeWidgetDefinition,

    // Actions
    setWidgetOrder,
    setWidgetEnabled,
    handleDragStart,
    handleDragEnd,
    handleDrawerDragEnd,
    handleDragCancel,
    handleToggleWidget,
    handleStartCustomizing,
    handleFinishCustomizing,
    handleCancelCustomizing,
    handleResetToDefaults,
  };
}
