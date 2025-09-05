import { Fragment } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Fragment>{children}</Fragment>;
}
