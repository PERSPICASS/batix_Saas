import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { ZoomIn, X } from "lucide-react";
function ProductImage({
  src,
  name,
  thumbnailClass = "size-10",
  className = ""
}) {
  const [open, setOpen] = useState(false);
  const onKey = useCallback((e) => {
    if (e.key === "Escape") setOpen(false);
  }, []);
  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onKey]);
  const initial = name.charAt(0).toUpperCase();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    src ? /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => setOpen(true),
        className: `group relative shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400 ${thumbnailClass} ${className}`,
        title: "Agrandir l'image",
        children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: `/storage/${src}`,
              alt: name,
              className: "h-full w-full object-cover transition-transform duration-200 group-hover:scale-110"
            }
          ),
          /* @__PURE__ */ jsx("span", { className: "absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30", children: /* @__PURE__ */ jsx(ZoomIn, { className: "size-3.5 text-white opacity-0 drop-shadow transition-opacity duration-200 group-hover:opacity-100" }) })
        ]
      }
    ) : /* @__PURE__ */ jsx(
      "div",
      {
        className: `shrink-0 rounded-lg bg-slate-800 ring-1 ring-white/10 flex items-center justify-center ${thumbnailClass} ${className}`,
        children: /* @__PURE__ */ jsx(
          "span",
          {
            className: "font-bold text-slate-600 uppercase leading-none",
            style: { fontSize: "clamp(10px, 40%, 18px)" },
            children: initial
          }
        )
      }
    ),
    open && src && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4",
        onClick: () => setOpen(false),
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: "relative max-h-[90vh] max-w-[90vw]",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsx(
                "img",
                {
                  src: `/storage/${src}`,
                  alt: name,
                  className: "max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl ring-1 ring-white/10"
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "mt-3 text-center text-sm font-medium text-slate-300", children: name }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setOpen(false),
                  className: "absolute -right-3 -top-3 flex size-8 items-center justify-center rounded-full bg-slate-700 text-white ring-1 ring-white/20 hover:bg-slate-600 transition-colors",
                  title: "Fermer (Échap)",
                  children: /* @__PURE__ */ jsx(X, { className: "size-4" })
                }
              )
            ]
          }
        )
      }
    )
  ] });
}
export {
  ProductImage as P
};
