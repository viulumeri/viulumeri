import { useEffect, useMemo, useRef, useState } from 'react'
import { Banana, Bell, MessageSquare, UserRound } from 'lucide-react'
import { AdminPanel } from './AdminPanel'
import { PopupAdminPage } from './PopupAdminPage'
import { AdminFeedbackPage } from './AdminFeedbackPage'
import { AdminUserViewPage } from './AdminUserViewPage'

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
  const sections = useMemo<AdminSection[]>(
    () => [
      {
        id: 'overview',
        label: 'Hallinta',
        icon: Banana,
        render: () => <AdminPanel />
      },
      {
        id: 'popup',
        label: 'Pop-up',
        icon: Bell,
        render: () => <PopupAdminPage />
      },
      {
        id: 'feedback',
        label: 'Palautteet',
        icon: MessageSquare,
        render: () => <AdminFeedbackPage />
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
  const [navDimmed, setNavDimmed] = useState(false)

  const activeIndex = sections.findIndex(section => section.id === activeId)
  const activeSection = sections.find(section => section.id === activeId)

  useEffect(() => {
    if (!initialSectionId) return
    const target = sectionRefs.current[initialSectionId]
    if (target) {
      target.scrollIntoView({ behavior: 'auto', block: 'start' })
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

    const handleScroll = () => {
      const lockId = scrollLockIdRef.current
      if (!lockId) return
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

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 640px)')
    if (!isDesktop.matches) {
      setNavDimmed(false)
      return
    }

    let idleTimeout: number | null = null

    const scheduleDim = () => {
      if (idleTimeout) window.clearTimeout(idleTimeout)
      idleTimeout = window.setTimeout(() => setNavDimmed(true), 1500)
    }

    const handleMove = (event: MouseEvent) => {
      if (event.clientX < 120) {
        setNavDimmed(false)
        scheduleDim()
      }
    }

    scheduleDim()
    window.addEventListener('mousemove', handleMove)
    const mqListener = (event: MediaQueryListEvent) => {
      if (!event.matches) {
        setNavDimmed(false)
        if (idleTimeout) window.clearTimeout(idleTimeout)
        idleTimeout = null
      } else {
        scheduleDim()
      }
    }
    isDesktop.addEventListener('change', mqListener)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      isDesktop.removeEventListener('change', mqListener)
      if (idleTimeout) window.clearTimeout(idleTimeout)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]?.target) {
          const nextId = visible[0].target.getAttribute('data-section-id')
          const lockId = scrollLockIdRef.current
          if (nextId && (!lockId || lockId === nextId)) setActiveId(nextId)
        }
      },
      { root: container, threshold: [0.4, 0.7] }
    )

    Object.values(sectionRefs.current).forEach(section => {
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [sections])

  const scrollToSection = (id: string) => {
    const target = sectionRefs.current[id]
    if (target) {
      scrollLockIdRef.current = id
      if (scrollLockTimeoutRef.current) {
        window.clearTimeout(scrollLockTimeoutRef.current)
      }
      scrollLockTimeoutRef.current = window.setTimeout(() => {
        scrollLockIdRef.current = null
        scrollLockTimeoutRef.current = null
      }, 2200)
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }

  return (
    <div className="relative">
      <aside
        className={`fixed left-2 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-3 transition-opacity duration-300 ${
          navDimmed ? 'opacity-20' : 'opacity-100'
        }`}
        onMouseEnter={() => setNavDimmed(false)}
        onMouseLeave={() => setNavDimmed(true)}
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
              <Icon className="h-5 w-5" />
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
        className="h-screen overflow-y-auto snap-y snap-mandatory scrollbar-hide pl-0 sm:pl-16"
      >
        {sections.map((section, index) => {
          const shouldRender = Math.abs(index - activeIndex) <= 1
          const isActive = section.id === activeId
          return (
            <section
              key={section.id}
              data-section-id={section.id}
              ref={node => {
                sectionRefs.current[section.id] = node as HTMLDivElement | null
              }}
              className={`min-h-screen snap-start flex items-stretch transition duration-500 ${
                isActive
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-70 translate-y-3'
              }`}
            >
              <div className="w-full">
                {shouldRender ? section.render() : <div className="min-h-screen" />}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
