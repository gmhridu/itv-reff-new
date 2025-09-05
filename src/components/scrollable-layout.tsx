import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ScrollableLayoutProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxHeight?: string;
  showScrollbar?: boolean;
}

/**
 * A reusable layout component that creates a fixed-height container with scrollable content.
 * This prevents the entire page from scrolling and contains the scroll behavior within the content area.
 *
 * @param children - The content to be rendered inside the scrollable area
 * @param className - Additional CSS classes for the outer container
 * @param contentClassName - Additional CSS classes for the content wrapper
 * @param maxHeight - Custom max height (defaults to full viewport height)
 * @param showScrollbar - Whether to show the scrollbar (defaults to true)
 */
export default function ScrollableLayout({
  children,
  className,
  contentClassName,
  maxHeight = "100vh",
  showScrollbar = true,
}: ScrollableLayoutProps) {
  return (
    <div
      className={cn("flex flex-col w-full", className)}
      style={{ height: maxHeight }}
    >
      {/* Fixed-height container that takes full specified height */}
      <main className="flex-1 min-h-0 w-full">
        {/* ScrollArea with fixed height that contains all scrollable content */}
        <ScrollArea className={cn("h-full w-full", !showScrollbar && "scrollbar-hide")}>
          <div className={cn("w-full min-w-0", contentClassName)}>
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

/**
 * A variant for dashboard pages that includes user context
 */
interface DashboardScrollableLayoutProps extends ScrollableLayoutProps {
  user?: {
    name: string;
    email: string;
    walletBalance: number;
    referralCode: string;
  };
}

export function DashboardScrollableLayout({
  children,
  user,
  ...props
}: DashboardScrollableLayoutProps) {
  return (
    <ScrollableLayout {...props}>
      {children}
    </ScrollableLayout>
  );
}

/**
 * A variant for full-page layouts that need custom headers/footers
 */
interface FullPageScrollableLayoutProps extends ScrollableLayoutProps {
  header?: React.ReactNode;
  menubar?: React.ReactNode;
  footer?: React.ReactNode;
}

export function FullPageScrollableLayout({
  children,
  header,
  menubar,
  footer,
  className,
  ...props
}: FullPageScrollableLayoutProps) {
  return (
    <div className={cn("h-screen flex flex-col w-full overflow-hidden", className)}>
      {/* Fixed header */}
      {header && (
        <header className="flex-shrink-0 w-full">
          {header}
        </header>
      )}

      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 w-full">
        <ScrollableLayout {...props} maxHeight="100%">
          {children}
        </ScrollableLayout>
      </div>

      {/* Menubar */}
      {menubar && (
        <div className="flex-shrink-0 w-full">
          {menubar}
        </div>
      )}

      {/* Fixed footer */}
      {footer && (
        <footer className="flex-shrink-0 w-full">
          {footer}
        </footer>
      )}
    </div>
  );
}
