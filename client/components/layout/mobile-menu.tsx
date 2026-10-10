"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, type Variants } from "motion/react"
import { useRef, useState, type MouseEvent } from "react"
import { ArrowUpRight, X } from "lucide-react"

import { UserAvatar } from "@/components/auth/user-avatar"
import { Wordmark } from "@/components/brand/wordmark"
import { LatticeField } from "@/components/landing/lattice-field"
import { Button, buttonVariants } from "@/components/ui/button"
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCurrentUser, useLogout } from "@/hooks/use-auth"
import { mainNav, routes } from "@/lib/routes"
import { cn } from "@/lib/utils"

const EASE = [0.22, 1, 0.36, 1] as const

const list: Variants = {
  closed: {},
  open: { transition: { staggerChildren: 0.075, delayChildren: 0.22 } },
}

const word: Variants = {
  closed: { y: "115%", rotate: 7 },
  open: { y: "0%", rotate: 0, transition: { duration: 0.85, ease: EASE } },
}

const rule: Variants = {
  closed: { scaleX: 0 },
  open: { scaleX: 1, transition: { duration: 0.9, ease: EASE } },
}

const fadeSide: Variants = {
  closed: { opacity: 0, x: -10 },
  open: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
}

const footer: Variants = {
  closed: { opacity: 0, y: 32 },
  open: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 160, damping: 20, delay: 0.55 } },
}

function MenuIcon() {
  return (
    <span aria-hidden="true" className="flex w-5 flex-col items-end gap-[5px]">
      <span className="h-[1.5px] w-5 rounded-[1px] bg-ink transition-[width] duration-300 group-hover:w-3.5" />
      <span className="h-[1.5px] w-3.5 rounded-[1px] bg-ink transition-[width] duration-300 group-hover:w-5" />
    </span>
  )
}

export function MobileMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const pendingHref = useRef<string | null>(null)
  const { user } = useCurrentUser()
  const logout = useLogout()

  const navigateAfterClose = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    pendingHref.current = event.currentTarget.getAttribute("href")
    setOpen(false)
  }

  const handleOpenChangeComplete = (isOpen: boolean) => {
    if (isOpen || !pendingHref.current) return
    router.push(pendingHref.current)
    pendingHref.current = null
  }

  return (
    <Sheet open={open} onOpenChange={setOpen} onOpenChangeComplete={handleOpenChangeComplete}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Menu" className="group" />}>
        <MenuIcon />
      </SheetTrigger>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="isolate gap-0 overflow-hidden border-0 pb-[env(safe-area-inset-bottom)] duration-[500ms] ease-[cubic-bezier(0.76,0,0.24,1)] data-[side=right]:w-full data-[side=right]:border-l-0 data-[side=right]:data-ending-style:translate-x-full data-[side=right]:data-starting-style:translate-x-full data-[side=right]:sm:max-w-md data-ending-style:opacity-100 data-starting-style:opacity-100"
      >
        <LatticeField id="menu-lattice" animated={false} className="absolute inset-x-0 bottom-0 -z-10 h-1/2 w-full opacity-60" />

        <motion.div initial="closed" animate="open" variants={list} className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-hairline pr-2 pl-4">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Wordmark />
            <SheetClose render={<Button variant="ghost" size="icon" aria-label="Close menu" />}>
              <motion.span
                initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.25 }}
                className="flex"
              >
                <X aria-hidden="true" />
              </motion.span>
            </SheetClose>
          </div>

          <nav aria-label="Main" className="flex-1 overflow-y-auto px-4 pt-6">
            <motion.ul variants={list}>
              {mainNav.map((link, index) => (
                <motion.li key={link.href} variants={list} className="relative">
                  <Link href={link.href} onClick={navigateAfterClose} className="group block">
                    <motion.span
                      whileTap={{ scale: 0.97, x: 6 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      className="flex items-start gap-3 py-3.5"
                    >
                      <span className="overflow-hidden pt-2">
                        <motion.span variants={word} className="block type-caption font-medium text-ink-muted tabular-nums">
                          0{index + 1}
                        </motion.span>
                      </span>
                      <span className="flex-1 overflow-hidden">
                        <motion.span
                          variants={word}
                          className="block origin-bottom-left text-[40px] leading-[1.05] font-semibold tracking-[-0.045em] text-ink transition-colors duration-200 group-hover:text-teal min-[380px]:text-[44px]"
                        >
                          {link.label}
                        </motion.span>
                      </span>
                      <motion.span variants={fadeSide} className="mt-3 flex">
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-5 text-ink-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-teal"
                        />
                      </motion.span>
                    </motion.span>
                  </Link>
                  <motion.span aria-hidden="true" variants={rule} className="absolute inset-x-0 bottom-0 h-px origin-left bg-hairline" />
                </motion.li>
              ))}
            </motion.ul>
          </nav>

          <motion.div variants={footer} className="flex flex-col gap-3 border-t border-hairline bg-surface/90 p-4">
            <p className="flex items-center gap-2 type-label font-normal text-ink-muted">
              <span aria-hidden="true" className="live-dot size-2 rounded-[2px] bg-teal" />
              Every listing from an official page. Free for students.
            </p>
            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={user.name} size={40} />
                  <div className="min-w-0">
                    <p className="truncate type-label text-ink">{user.name}</p>
                    <p className="truncate type-body-sm text-ink-muted">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href={routes.tracker}
                    onClick={navigateAfterClose}
                    className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full bg-surface")}
                  >
                    Saved
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full bg-surface"
                    onClick={() => {
                      setOpen(false)
                      logout.mutate()
                    }}
                  >
                    Log out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <motion.div whileTap={{ scale: 0.96 }}>
                  <Link
                    href={routes.login}
                    onClick={navigateAfterClose}
                    className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full bg-surface")}
                  >
                    Log in
                  </Link>
                </motion.div>
                <motion.div whileTap={{ scale: 0.96 }}>
                  <Link
                    href={routes.signup}
                    onClick={navigateAfterClose}
                    className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full")}
                  >
                    Sign up
                  </Link>
                </motion.div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}
