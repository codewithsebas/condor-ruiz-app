"use client";

// Marco del panel mientras se abre la sesión: la barra lateral, los dos encabezados (celular y computador) y la página
// que se va a mostrar, con las mismas clases del shell (shell.tsx) para que al llegar los datos nada cambie de sitio.
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { BellIcon, MenuIcon, SearchIcon, SettingsIcon } from "@/components/ui/icons";
import { BrandName, Logo } from "@/components/brand/logo";
import { CondorAlado } from "@/components/brand/condor-alado";
import { Marca } from "@/components/brand/marca";
import { PanelFooter } from "@/components/admin/footer";
import { PREF, usePref } from "@/components/admin/prefs";
import { MODULES, MODULE_IDS, NAV_GROUPS, moduleOf } from "@/components/admin/routes";
import { iconButtonClass } from "@/components/admin/ui";
import { Dot, Line, PULSE } from "@/components/admin/skeletons/kit";
import { ModuleSkeleton } from "@/components/admin/skeletons/pages";

export function PanelSkeleton() {
  const pathname = usePathname();
  const sideOpen = usePref(PREF.sidebar, "open") !== "closed";
  return (
    <div
      role="status"
      aria-live="polite"
      className="admin-root min-h-dvh bg-canvas text-[15px] text-ink lg:flex"
      style={{ "--admin-sidebar": sideOpen ? "252px" : "88px" } as CSSProperties}
    >
      <span className="sr-only">Cargando el panel…</span>
      <SidebarSkeleton current={moduleOf(pathname)} mini={!sideOpen} />
      <div className={`flex min-w-0 flex-1 flex-col bg-paper lg:my-3 lg:mr-3 lg:min-h-[calc(100dvh-24px)] lg:rounded-[28px] lg:ring-1 lg:ring-line`}>
        {/* Celular y tableta: menú, marca y los botones del encabezado. */}
        <header aria-hidden="true" className="admin-surface admin-header sticky top-0 z-30 flex flex-none flex-col lg:hidden">
          <div className="flex h-16 items-center justify-between gap-2 px-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className={iconButtonClass("primary")}>
                <MenuIcon size={19} />
              </span>
              <span className="flex min-w-0 items-center gap-2.5 rounded-full py-1 pr-2 text-ink">
                <Logo size={32} eager />
                <BrandName wordSize="1rem" eyebrowSize=".5rem" className="max-[400px]:hidden max-sm:[&_.brand-eyebrow]:hidden" />
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={iconButtonClass("secondary")}>
                <Dot size="size-[18px]" />
              </span>
              <span className={iconButtonClass("secondary")}>
                <SearchIcon size={18} />
              </span>
              <span className="grid size-10 flex-none place-items-center rounded-full bg-paper text-ink ring-1 ring-line-strong ring-inset pointer-coarse:size-11">
                <BellIcon size={18} />
              </span>
              <Dot size="size-10 pointer-coarse:size-11" />
            </div>
          </div>
        </header>

        {/* Computador: menú lateral, buscador y los botones de la derecha. */}
        <header aria-hidden="true" className="admin-surface admin-header sticky top-0 z-20 hidden flex-none px-6 pt-5 pb-3 lg:block lg:rounded-t-[28px]">
          <div className="flex h-16 items-center gap-3 rounded-full bg-paper px-3 ring-1 ring-line">
            <span className={iconButtonClass("secondary")}>
              <MenuIcon size={18} />
            </span>
            <div className="w-full max-w-[520px]">
              <div className="flex h-10 w-full min-w-0 items-center gap-1.5 rounded-full border border-transparent bg-panel py-1 pr-4 pl-1">
                <span className="grid size-8 flex-none place-items-center rounded-full text-ink-muted">
                  <SearchIcon size={18} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink-subtle">Buscar por huésped, código, documento o celular</span>
                <kbd className="grid h-6 flex-none place-items-center rounded-md border border-line-strong px-1.5 font-body text-[11.5px] text-ink-subtle">
                  /
                </kbd>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className={iconButtonClass("secondary")}>
                <Dot size="size-[18px]" />
              </span>
              <span className="grid size-10 flex-none place-items-center rounded-full bg-paper text-ink ring-1 ring-line-strong ring-inset">
                <BellIcon size={18} />
              </span>
              <span className={iconButtonClass("secondary")}>
                <SettingsIcon size={18} />
              </span>
              <span className="flex h-10 flex-none items-center gap-2.5 rounded-full border border-line-strong bg-paper pr-1 pl-1 xl:pr-3.5">
                <Dot size="size-[30px]" />
                <span className="hidden min-w-0 flex-col leading-tight xl:flex">
                  <Line w="9ch" className="text-[13.5px] font-semibold" />
                  <Line w="12ch" className="text-[12px]" />
                </span>
                <span className="hidden w-[15px] xl:block" />
              </span>
            </div>
          </div>
        </header>

        <main className="admin-surface flex w-full min-w-0 flex-1 flex-col gap-6 px-4 pt-3 pb-6 lg:px-6 lg:pt-3">
          <div aria-hidden="true" className="flex flex-col gap-6">
            <ModuleSkeleton />
          </div>
          <PanelFooter />
        </main>
      </div>
    </div>
  );
}

// Barra lateral: el cóndor, los grupos con su nombre y cada módulo en gris (el menú final depende del rol). El módulo
// abierto ya lleva su píldora blanca. `mini`: barra contraída, solo los iconos en columna.
function SidebarSkeleton({ current, mini }: { current: ReturnType<typeof moduleOf>; mini: boolean }) {
  const widths = ["9ch", "7ch", "11ch", "8ch", "6ch", "12ch", "10ch"];
  let k = 0;
  return (
    <aside aria-hidden="true" className="sticky top-0 z-40 hidden h-dvh w-(--admin-sidebar) flex-none p-3 lg:block">
      <div className="relative flex h-full flex-col text-ink">
        <span className={`flex min-w-0 items-center rounded-[20px] pt-3 pb-3 ${mini ? "justify-center" : "px-3.5"}`}>
          {mini ? (
            <span className="flex flex-col items-center gap-1.5">
              <CondorAlado width={64} />
              <Marca parte="nombre" width={62} />
            </span>
          ) : (
            <span className="flex flex-col items-center gap-2">
              <CondorAlado width={196} />
              <Marca parte="nombre" width={150} />
            </span>
          )}
        </span>
        <div className={`nav-fade no-scrollbar flex-1 overflow-y-auto pb-4 ${mini ? "" : "px-1"}`}>
          <div className={`flex flex-col ${mini ? "gap-2.5" : "gap-2"}`}>
            {NAV_GROUPS.map((g, gi) => (
              <div key={g} className="flex flex-col gap-0.5">
                {mini ? (
                  gi > 0 && <span className="mx-auto mb-2 block h-px w-6 bg-line-strong" />
                ) : (
                  <p className="px-3.5 pb-1.5 text-[12.5px] font-medium text-ink-subtle">{g}</p>
                )}
                {MODULE_IDS.filter((id) => MODULES[id].group === g && MODULES[id].nav !== false && !MODULES[id].off).map((id) => (
                  <span
                    key={id}
                    className={`flex items-center rounded-full text-[13.5px] leading-tight ${
                      mini ? "mx-auto size-11 justify-center" : "min-h-[42px] w-full gap-3 px-3.5 py-1.5 pointer-coarse:min-h-11"
                    } ${
                      id === current
                        ? "bg-paper shadow-[0_1px_2px_rgb(20_20_22/0.06),0_2px_8px_-2px_rgb(20_20_22/0.08)] [[data-admin-theme=dark]_&]:bg-panel"
                        : ""
                    }`}
                  >
                    <span className={`size-[22px] flex-none rounded-md bg-ink/8 ${PULSE}`} />
                    {!mini && <Line w={widths[k++ % widths.length]} className="flex-1" />}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
