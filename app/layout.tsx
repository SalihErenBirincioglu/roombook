import type { ReactNode } from "react";

export const metadata = {
  title: "roombook",
  description: "Book a meeting room",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
