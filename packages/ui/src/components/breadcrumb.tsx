import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { cn } from "../lib/utils"

export type BreadcrumbItem = {
  label: string
  to?: string
}

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  collapse?: "auto" | "always" | "never"
  backLabel?: string
  className?: string
}

function Breadcrumb({
  items,
  collapse = "auto",
  backLabel,
  className,
}: BreadcrumbProps) {
  const { t } = useTranslation("common")

  if (items.length === 0) {
    return null
  }

  const hasParent = items.length > 1
  const parent = hasParent ? items[items.length - 2] : undefined
  const parentTo = parent?.to
  const showBackLink = parentTo !== undefined && collapse !== "never"
  const showFullTrail = collapse !== "always" || !showBackLink

  return (
    <nav aria-label={t("accessibility.breadcrumb")} className={cn(className)} data-slot="breadcrumb">
      {showFullTrail ? (
        <BreadcrumbTrail
          className={cn(collapse === "auto" && showBackLink && "hidden md:flex")}
          items={items}
        />
      ) : null}
      {showBackLink && parent && parentTo !== undefined ? (
        <BreadcrumbBackLink
          className={cn(collapse === "auto" && "md:hidden")}
          label={backLabel ?? parent.label}
          to={parentTo}
        />
      ) : null}
    </nav>
  )
}

function BreadcrumbTrail({
  className,
  items,
}: {
  className?: string
  items: BreadcrumbItem[]
}) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground",
        className
      )}
      data-slot="breadcrumb-list"
    >
      {items.map((item, index) => {
        const isCurrent = index === items.length - 1

        return (
          <li className="inline-flex min-w-0 items-center gap-1.5" data-slot="breadcrumb-item" key={`${item.to ?? item.label}-${index}`}>
            {isCurrent ? (
              <span aria-current="page" className="truncate font-medium text-foreground" data-slot="breadcrumb-page">
                {item.label}
              </span>
            ) : item.to ? (
              <Link
                className="rounded-sm underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                data-slot="breadcrumb-link"
                to={item.to}
              >
                {item.label}
              </Link>
            ) : (
              <span data-slot="breadcrumb-label">{item.label}</span>
            )}
            {!isCurrent ? (
              <span aria-hidden="true" data-slot="breadcrumb-separator">
                <HugeiconsIcon aria-hidden="true" className="size-3.5" icon={ArrowRight01Icon} strokeWidth={2} />
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function BreadcrumbBackLink({
  className,
  label,
  to,
}: {
  className?: string
  label: string
  to: string
}) {
  const content = (
    <>
      <HugeiconsIcon aria-hidden="true" className="size-4" icon={ArrowLeft01Icon} strokeWidth={2} />
      <span>{label}</span>
    </>
  )

  return (
    <Link
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-sm px-2 text-sm font-medium text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
      data-slot="breadcrumb-back-link"
      to={to}
    >
      {content}
    </Link>
  )
}

export { Breadcrumb }
