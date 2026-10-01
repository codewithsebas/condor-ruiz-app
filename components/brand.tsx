import { LogoMark } from "./icons";

// Monograma + "Cabañas / El Cóndor del Ruiz".
export function Brand({ circle = 46, mark = 34, snow = false, wordSize = "1.4rem", eyebrowSize = ".64rem" }) {
  return (
    <>
      <span className="grid flex-none place-items-center rounded-full border-2 border-on-dark" style={{ width: circle, height: circle }}>
        <LogoMark size={mark} snow={snow} />
      </span>
      <span className="flex min-w-0 flex-col leading-none">
        <span className="font-extrabold uppercase tracking-[.16em]" style={{ fontSize: eyebrowSize }}>
          Cabañas
        </span>
        <span className="display whitespace-nowrap tracking-[.03em]" style={{ fontSize: wordSize }}>
          El Cóndor del Ruiz
        </span>
      </span>
    </>
  );
}
