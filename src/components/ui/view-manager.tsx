import type React from "react"
import type { ReactNode } from "react"
import { useViewNavigation, UseViewNavigationReturn, type ViewMode } from "@/hoooks/use-view-navigation"


interface ViewConfig<T extends { navigation: UseViewNavigationReturn } = any> {
    component: React.ComponentType<T>
    props?: Omit<T, "navigation">
    title?: string
    description?: string
}

interface ViewManagerProps<T extends { navigation: UseViewNavigationReturn } = any> {
    views?: Partial<Record<ViewMode, ViewConfig<T>>>
    defaultView?: ViewMode
    allowedViews?: ViewMode[]
    paramName?: string
    onViewChange?: (view: ViewMode, previousView: ViewMode) => void
    resetTriggers?: string[]
    resetOnTabChange?: boolean
    syncWithTabLayout?: boolean // New prop to work with TabLayout
    loadingComponent?: ReactNode
    errorComponent?: ReactNode
    className?: string
    children?: (navigation: ReturnType<typeof useViewNavigation>) => ReactNode
}

export function ViewManager<T extends { navigation: UseViewNavigationReturn } = any>({
    views,
    defaultView = "list",
    allowedViews,
    paramName = "action",
    onViewChange,
    resetTriggers = [],
    resetOnTabChange = true,
    syncWithTabLayout = true,
    errorComponent,
    className,
    children,
}: ViewManagerProps<T>) {
    const navigation = useViewNavigation({
        defaultView,
        paramName,
        allowedViews:
            allowedViews ??
            (views ? (Object.keys(views) as ViewMode[]) : []),
        onViewChange,
        resetTriggers,
        resetOnTabChange,
        syncWithTabLayout,
    })


    const { currentView } = navigation

    if (children) {
        return <div className={className}>{children(navigation)}</div>
    }

    const currentViewConfig = views?.[currentView]

    if (!currentViewConfig) {
        if (errorComponent) {
            return <div className={className}>{errorComponent}</div>
        }
        return (
            <div className={className}>
                <div className="py-8 text-center">
                    <p className="text-red-600">View {currentView} not configured</p>
                </div>
            </div>
        )
    }
    const { component: Component, props = {} } = currentViewConfig

    return (
        <div className={className}>
            <Component {...({ ...props, navigation } as T)} />
        </div>
    )
}