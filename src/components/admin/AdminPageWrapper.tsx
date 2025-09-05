import { cn } from "@/lib/utils"

interface AdminPageWrapperProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
}

/**
 * A responsive wrapper component for admin pages that ensures consistent
 * layout, spacing, and responsive behavior across all admin pages.
 * Optimized for full-screen admin dashboard layout.
 */
export default function AdminPageWrapper({
  children,
  className,
  title,
  description,
}: AdminPageWrapperProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      {/* Page Header */}
      {(title || description) && (
        <div className="mb-6 space-y-1">
          {title && (
            <h1 className="text-2xl font-bold tracking-tight">
              {title}
            </h1>
          )}
          {description && (
            <p className="text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Page Content */}
      <div className="w-full h-full">
        {children}
      </div>
    </div>
  )
}

/**
 * A grid wrapper that provides responsive grid layouts for admin pages
 */
interface AdminGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
}

export function AdminGrid({
  children,
  className,
  cols = { default: 1, md: 2, lg: 3 },
  gap = 4,
}: AdminGridProps) {
  const gridClasses = [
    `grid`,
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ')

  return (
    <div className={cn(gridClasses, className)}>
      {children}
    </div>
  )
}

/**
 * A responsive card container for admin content
 */
interface AdminCardContainerProps {
  children: React.ReactNode
  className?: string
}

export function AdminCardContainer({
  children,
  className,
}: AdminCardContainerProps) {
  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {children}
    </div>
  )
}