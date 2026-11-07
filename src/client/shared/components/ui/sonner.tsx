"use client"

import { CircleAlertIcon, CircleCheckIcon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

// Brand: light paper surface, icon + sentence, Lucide at 1.75 stroke, no spinners.
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-5 text-success" strokeWidth={1.75} />,
      error: <CircleAlertIcon className="size-5 text-destructive" strokeWidth={1.75} />,
    }}
    style={
      {
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius)",
      } as React.CSSProperties
    }
    toastOptions={{ classNames: { toast: "cn-toast shadow-lg text-base" } }}
    {...props}
  />
)

export { Toaster }
