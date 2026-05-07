import { jsx, jsxs } from "react/jsx-runtime";
function Table({
  columns,
  data,
  emptyMessage = "Aucune donnée disponible",
  onRowClick,
  className = "",
  keyExtractor = (item) => item.id
}) {
  const getAlignment = (align) => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };
  return /* @__PURE__ */ jsx("div", { className: `overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${className}`, children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
    /* @__PURE__ */ jsx("thead", { className: "bg-slate-900/80 text-slate-300", children: /* @__PURE__ */ jsx("tr", { children: columns.map((column) => /* @__PURE__ */ jsx(
      "th",
      {
        className: `px-4 py-3 font-medium ${getAlignment(column.align)} ${column.className || ""}`,
        children: column.label
      },
      column.key
    )) }) }),
    /* @__PURE__ */ jsx("tbody", { children: data.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
      "td",
      {
        colSpan: columns.length,
        className: "px-4 py-8 text-center text-slate-400",
        children: emptyMessage
      }
    ) }) : data.map((item) => /* @__PURE__ */ jsx(
      "tr",
      {
        className: `border-t border-white/10 text-slate-200 transition-colors ${onRowClick ? "cursor-pointer hover:bg-white/5" : ""}`,
        onClick: () => onRowClick?.(item),
        children: columns.map((column) => /* @__PURE__ */ jsx(
          "td",
          {
            className: `px-4 py-3 ${getAlignment(column.align)} ${column.className || ""}`,
            children: column.render ? column.render(item) : item[column.key]
          },
          `${keyExtractor(item)}-${column.key}`
        ))
      },
      keyExtractor(item)
    )) })
  ] }) }) });
}
function TableActions({ children }) {
  return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end gap-2", onClick: (e) => e.stopPropagation(), children });
}
function TableActionButton({
  onClick,
  variant = "default",
  children,
  className = ""
}) {
  const variantClasses = {
    default: "border-white/15 text-slate-200 hover:bg-white/10",
    danger: "border-rose-300/30 text-rose-200 hover:bg-rose-300/10",
    success: "border-emerald-300/30 text-emerald-200 hover:bg-emerald-300/10"
  };
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      onClick: (e) => {
        e.stopPropagation();
        onClick?.();
      },
      className: `inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${variantClasses[variant]} ${className}`,
      children
    }
  );
}
function TableBadge({ variant = "default", children }) {
  const variantClasses = {
    success: "bg-green-500/20 text-green-300",
    danger: "bg-red-500/20 text-red-300",
    warning: "bg-amber-500/20 text-amber-300",
    info: "bg-blue-500/20 text-blue-300",
    default: "bg-slate-500/20 text-slate-300"
  };
  return /* @__PURE__ */ jsx("span", { className: `inline-flex items-center rounded-full px-2 py-1 text-xs ${variantClasses[variant]}`, children });
}
function TableColorIndicator({ color, label }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "h-3 w-3 rounded-full",
        style: { backgroundColor: color }
      }
    ),
    label && /* @__PURE__ */ jsx("span", { children: label })
  ] });
}
export {
  Table as T,
  TableColorIndicator as a,
  TableBadge as b,
  TableActions as c,
  TableActionButton as d
};
