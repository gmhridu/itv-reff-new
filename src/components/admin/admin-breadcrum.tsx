"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Define route mappings for better display names
const routeMap: Record<string, string> = {
  admin: "Admin Dashboard",
  analytics: "Data Analytics",
  "video-upload": "Video Upload",
  settings: "Settings",
  "user-management": "User Management",
};

// Helper function to convert path segment to display name
const getDisplayName = (segment: string): string => {
  return (
    routeMap[segment] ||
    segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

export default function AdminBreadcrum() {
  const pathname = usePathname();

  // Split pathname and filter out empty strings
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  // If we're at root, don't show breadcrumbs
  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {pathSegments.map((segment, index) => {
          // Build the href for this segment
          const href = "/" + pathSegments.slice(0, index + 1).join("/");
          const isLast = index === pathSegments.length - 1;
          const displayName = getDisplayName(segment);

          return (
            <div key={segment} className="flex items-center cursor-pointer">
              <BreadcrumbItem className={index === 0 ? "hidden md:block" : ""}>
                {isLast ? (
                  <BreadcrumbPage className="cursor-pointer">
                    {displayName}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href} className="cursor-pointer">
                    {displayName}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!isLast && (
                <BreadcrumbSeparator
                  className={index === 0 ? "hidden md:block" : ""}
                />
              )}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
