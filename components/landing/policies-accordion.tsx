"use client";

import { useState } from "react";
import type { Policy } from "@/lib/config";
import { ChevronDownIcon } from "../icons";

export function PoliciesAccordion({ policies }: { policies: Policy[] }) {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-2.5">
      {policies.map((f, i) => {
        const open = openIdx === i;
        return (
          <div key={i} className="rounded-md bg-surface">
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={`pol-${i}`}
                onClick={() => setOpenIdx(open ? -1 : i)}
                className="flex min-h-16 w-full items-center justify-between gap-4 rounded-md py-3 pr-3.5 pl-6 text-left text-[1.02rem] font-bold text-on-dark"
              >
                {f.q}
                <span aria-hidden="true" className={`grid size-10 flex-none place-items-center rounded-full transition-transform duration-250 ${open ? "rotate-180 bg-card text-on-light" : "text-on-dark"}`}>
                  <ChevronDownIcon />
                </span>
              </button>
            </h3>
            {open && (
              <div id={`pol-${i}`} className="max-w-[64ch] px-6 pb-[22px] leading-[1.6] text-on-dark-muted">
                {f.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
