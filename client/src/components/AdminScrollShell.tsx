import { useEffect, useMemo, useRef, useState } from 'react'
import { Banana, Bell, MessageSquare, UserRound, FileQuestionMark, Search, Music } from 'lucide-react'
import { AdminPanel } from './AdminPanel'
import { PopupAdminPage } from './PopupAdminPage'
import { AdminFeedbackPage } from './AdminFeedbackPage'
import { AdminUserViewPage } from './AdminUserViewPage'
import { AdminFaqPage } from './AdminFaqPage'
import { AdminDashboardPage } from './AdminDashboardPage'
import { AdminSongsPage } from './AdminSongsPage'
import { useAdminFeedbacks } from '../hooks/useAdmin'

type AdminSection = {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  render: () => React.ReactElement
}

type Props = {
  initialSectionId?: string
}

export const AdminScrollShell = ({ initialSectionId }: Props) => {
  const { data: feedbackData } = useAdminFeedbacks({ refetchInterval: 30000 })
  const unreadFeedbackCount =
    (feedbackData?.feedbacks ?? []).filter(feedback => !feedback.isRead).length

  const sections = useMemo<AdminSection[]>(
    () => [
      {
        id: 'overview',
        label: 'Ylläpitopaneeli',
        icon: Banana,
        render: () => <AdminDashboardPage />
      },
      {
        id: 'users',
        label: 'Käyttäjähaku',
        icon: Search,
        render: () => <AdminPanel />
      },
      {
        id: 'popup',
        label: 'Pop-up',
        icon: Bell,
        render: () => <PopupAdminPage />
      },
      {
        id: 'songs',
        label: 'Kappaleet',
        icon: Music,
        render: () => <AdminSongsPage />
      },
      {
        id: 'feedback',
        label: 'Palautteet',
        icon: MessageSquare,
        render: () => <AdminFeedbackPage />
      },
      {
        id: 'faq',
        label: 'FAQ',
        icon: FileQuestionMark,
        render: () => <AdminFaqPage />
      },
      {
        id: 'user-view',
        label: 'Käyttäjänäkymä',
        icon: UserRound,
        render: () => <AdminUserViewPage />
      }
    ],
    []
  )

  const containerRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const scrollLockIdRef = useRef<string | null>(null)
  const scrollLockTimeoutRef = useRef<number | null>(null)
  const [activeId, setActiveId] = useState(
    initialSectionId && sections.some(section => section.id === initialSectionId)
      ? initialSectionId
      : sections[0].id
  )
  const [showLabel, setShowLabel] = useState(false)
  const [labelFading, setLabelFading] = useState(false)
  const [navHidden, setNavHidden] = useState(false)

  const activeSection = sections.find(section => section.id === activeId)

  useEffect(() => {
    if (!initialSectionId) return
    const container = containerRef.current
    const target = sectionRefs.current[initialSectionId]
    if (target && container) {
      container.scrollTo({ top: target.offsetTop, behavior: 'auto' })
      setActiveId(initialSectionId)
    }
  }, [initialSectionId])

  useEffect(() => {
    setShowLabel(true)
    setLabelFading(false)

    const fadeTimeout = window.setTimeout(() => {
      setLabelFading(true)
    }, 1000)

    const hideTimeout = window.setTimeout(() => {
      setShowLabel(false)
      setLabelFading(false)
    }, 1500)

    return () => {
      window.clearTimeout(fadeTimeout)
      window.clearTimeout(hideTimeout)
    }
  }, [activeId])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const getNearestSectionId = () => {
      let nearestId = sections[0].id
      let nearestDistance = Number.POSITIVE_INFINITY

      sections.forEach(section => {
        const node = sectionRefs.current[section.id]
        if (!node) return
        const distance = Math.abs(node.offsetTop - container.scrollTop)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestId = section.id
        }
      })

      return nearestId
    }

    const handleScroll = () => {
      const lockId = scrollLockIdRef.current
      if (lockId) {
        const target = sectionRefs.current[lockId]
        if (!target) return

        const distance = Math.abs(target.offsetTop - container.scrollTop)
        if (distance < 8) {
          scrollLockIdRef.current = null
          if (scrollLockTimeoutRef.current) {
            window.clearTimeout(scrollLockTimeoutRef.current)
            scrollLockTimeoutRef.current = null
          }
        }
      }

      const nextId = getNearestSectionId()
      if (!lockId || lockId === nextId) {
        setActiveId(nextId)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [sections])

  const scrollToSection = (id: string) => {
    const container = containerRef.current
    const target = sectionRefs.current[id]
    if (target && container) {
      scrollLockIdRef.current = id
      if (scrollLockTimeoutRef.current) {
        window.clearTimeout(scrollLockTimeoutRef.current)
      }
      scrollLockTimeoutRef.current = window.setTimeout(() => {
        scrollLockIdRef.current = null
        scrollLockTimeoutRef.current = null
      }, 800)
      const targetTop = target.offsetTop
      setActiveId(id)
      container.scrollTo({ top: targetTop, behavior: 'auto' })
      window.requestAnimationFrame(() => {
        container.scrollTo({ top: targetTop, behavior: 'auto' })
      })
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let hideTimeout: number | null = null

    const scheduleHide = () => {
      if (hideTimeout) window.clearTimeout(hideTimeout)
      hideTimeout = window.setTimeout(() => setNavHidden(true), 900)
    }

    const revealNav = () => {
      setNavHidden(false)
      scheduleHide()
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (event.clientX < 140) {
        revealNav()
      }
    }

    const handleScroll = () => revealNav()

    // Show briefly on mount, then hide.
    revealNav()

    window.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('scroll', handleScroll)
      if (hideTimeout) window.clearTimeout(hideTimeout)
    }
  }, [])

  return (
    <div className="relative">
      <aside
        className={`fixed left-2 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3 transition-all duration-300 ${
          navHidden ? 'opacity-0 pointer-events-none -translate-x-3' : 'opacity-100'
        }`}
      >
        {sections.map(section => {
          const Icon = section.icon
          const isActive = section.id === activeId
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur transition ${
                isActive
                  ? 'border-neutral-100 bg-neutral-100/90 text-neutral-900 shadow-lg shadow-black/30'
                  : 'border-neutral-700 bg-neutral-900/60 text-neutral-400 hover:text-neutral-100'
              }`}
              aria-current={isActive ? 'page' : undefined}
              title={section.label}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {section.id === 'feedback' && unreadFeedbackCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[11px] leading-[18px] text-white text-center font-semibold">
                    {unreadFeedbackCount > 99 ? '99+' : unreadFeedbackCount}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </aside>

      {showLabel && activeSection && (
        <div
          key={activeSection.id}
          className={`pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 z-40 animate-slide-down transition-opacity duration-500 ${
            labelFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="rounded-full border border-neutral-700 bg-neutral-900/80 px-4 py-1 text-sm text-neutral-100 backdrop-blur">
            {activeSection.label}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-hide pl-10 sm:pl-18"
      >
        {sections.map(section => {
          const isActive = section.id === activeId
          return (
            <section
              key={section.id}
              data-section-id={section.id}
              ref={node => {
                sectionRefs.current[section.id] = node as HTMLDivElement | null
              }}
              className={`min-h-screen snap-start snap-always flex items-stretch transition duration-500 ${
                isActive
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-85 translate-y-0'
              }`}
            >
              <div className="w-full">
                {section.render()}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
