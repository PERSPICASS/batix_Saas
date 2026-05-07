import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { a as usePage, u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useMemo, useState } from "react";
import { RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function ProductsCreate({ shops, categories, subcategories }) {
  const route = useRoute();
  const { props } = usePage();
  const activeShop = props.activeShop;
  const { data, setData, post, processing, errors } = useForm({
    shop_id: activeShop?.id.toString() || shops[0]?.id.toString() || "",
    category_id: "",
    subcategory_id: "",
    name: "",
    sku: "",
    barcode: "",
    brand: "",
    description: "",
    purchase_price: "",
    selling_price: "",
    tax_rate: "",
    stock_quantity: "0",
    min_stock_alert: "",
    unit: "piece",
    image: null,
    track_stock: true
  });
  const onSubmit = (e) => {
    e.preventDefault();
    post(route("products.store"));
  };
  const generateTempBarcode = () => {
    const prefix = "2";
    const company = Math.floor(Math.random() * 1e6).toString().padStart(6, "0");
    const product = Math.floor(Math.random() * 1e4).toString().padStart(4, "0");
    const barcode12 = prefix + company + product;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode12[i]);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checksum = (10 - sum % 10) % 10;
    setData("barcode", barcode12 + checksum);
  };
  const filteredCategories = categories;
  const filteredSubcategories = useMemo(() => {
    return data.category_id ? subcategories.filter((sub) => sub.category_id === Number(data.category_id)) : [];
  }, [data.category_id, subcategories]);
  const profitMargin = useMemo(() => {
    const purchase = parseFloat(data.purchase_price) || 0;
    const selling = parseFloat(data.selling_price) || 0;
    if (purchase === 0) return { amount: selling, percentage: 100 };
    const amount = selling - purchase;
    const percentage = amount / purchase * 100;
    return { amount, percentage };
  }, [data.purchase_price, data.selling_price]);
  const [imagePreview, setImagePreview] = useState(null);
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setData("image", file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Nouveau produit" }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Nouveau produit" }),
        /* @__PURE__ */ jsxs(
          "form",
          {
            onSubmit,
            className: "space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200 md:col-span-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Boutique *" }),
                  /* @__PURE__ */ jsx(
                    "select",
                    {
                      value: data.shop_id,
                      disabled: true,
                      className: "w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-slate-400 cursor-not-allowed",
                      children: shops.map((shop) => /* @__PURE__ */ jsx("option", { value: shop.id, children: shop.name }, shop.id))
                    }
                  ),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Boutique sélectionnée via le switcher" }),
                  errors.shop_id && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.shop_id })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "Nom *" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      value: data.name,
                      onChange: (e) => setData("name", e.target.value),
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                    }
                  ),
                  errors.name && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.name })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "SKU (généré automatiquement)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      value: data.sku,
                      onChange: (e) => setData("sku", e.target.value),
                      placeholder: "Sera généré automatiquement",
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-400"
                    }
                  ),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Laissez vide pour générer automatiquement" }),
                  errors.sku && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.sku })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "Code-barres (généré automatiquement)" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        value: data.barcode,
                        onChange: (e) => setData("barcode", e.target.value),
                        placeholder: "Sera généré automatiquement",
                        className: "flex-1 rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-400"
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: generateTempBarcode,
                        className: "flex items-center gap-2 rounded-lg border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-amber-300 hover:bg-amber-300/20",
                        title: "Générer un aperçu",
                        children: [
                          /* @__PURE__ */ jsx(RefreshCw, { className: "size-4" }),
                          "Aperçu"
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Le code-barres final sera généré automatiquement lors de la sauvegarde" }),
                  errors.barcode && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.barcode })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "Catégorie" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: data.category_id,
                      onChange: (e) => setData("category_id", e.target.value),
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Sélectionner une catégorie" }),
                        filteredCategories.map((category) => /* @__PURE__ */ jsx("option", { value: category.id, children: category.name }, category.id))
                      ]
                    }
                  ),
                  errors.category_id && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.category_id })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "Sous-catégorie" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: data.subcategory_id,
                      onChange: (e) => setData("subcategory_id", e.target.value),
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                      disabled: !data.category_id,
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", children: "Sélectionner une sous-catégorie" }),
                        filteredSubcategories.map((subcategory) => /* @__PURE__ */ jsx("option", { value: subcategory.id, children: subcategory.name }, subcategory.id))
                      ]
                    }
                  ),
                  errors.subcategory_id && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.subcategory_id })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "Marque" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      value: data.brand,
                      onChange: (e) => setData("brand", e.target.value),
                      placeholder: "Ex: Bosch, Stanley, Makita...",
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                    }
                  ),
                  errors.brand && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.brand })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "Unité" }),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: data.unit,
                      onChange: (e) => setData("unit", e.target.value),
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "piece", children: "Pièce" }),
                        /* @__PURE__ */ jsx("option", { value: "kg", children: "Kilogramme" }),
                        /* @__PURE__ */ jsx("option", { value: "g", children: "Gramme" }),
                        /* @__PURE__ */ jsx("option", { value: "l", children: "Litre" }),
                        /* @__PURE__ */ jsx("option", { value: "ml", children: "Millilitre" }),
                        /* @__PURE__ */ jsx("option", { value: "m", children: "Mètre" }),
                        /* @__PURE__ */ jsx("option", { value: "m2", children: "Mètre carré" }),
                        /* @__PURE__ */ jsx("option", { value: "pack", children: "Pack" })
                      ]
                    }
                  ),
                  errors.unit && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.unit })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "Prix d'achat *" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      step: "0.01",
                      min: "0",
                      value: data.purchase_price,
                      onChange: (e) => setData("purchase_price", e.target.value),
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                    }
                  ),
                  errors.purchase_price && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.purchase_price })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "Prix de vente *" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      step: "0.01",
                      min: "0",
                      value: data.selling_price,
                      onChange: (e) => setData("selling_price", e.target.value),
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                    }
                  ),
                  errors.selling_price && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.selling_price })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-1 text-sm text-slate-200 md:col-span-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Marge bénéficiaire" }),
                  /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-3 rounded-lg border px-4 py-3 ${profitMargin.percentage >= 20 ? "border-green-500/30 bg-green-500/10" : profitMargin.percentage >= 10 ? "border-amber-500/30 bg-amber-500/10" : "border-red-500/30 bg-red-500/10"}`, children: [
                    profitMargin.percentage >= 20 ? /* @__PURE__ */ jsx(TrendingUp, { className: "size-5 text-green-400" }) : /* @__PURE__ */ jsx(AlertTriangle, { className: `size-5 ${profitMargin.percentage >= 10 ? "text-amber-400" : "text-red-400"}` }),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsxs("p", { className: `font-medium ${profitMargin.percentage >= 20 ? "text-green-400" : profitMargin.percentage >= 10 ? "text-amber-400" : "text-red-400"}`, children: [
                        profitMargin.amount.toFixed(2),
                        " FCFA (",
                        profitMargin.percentage.toFixed(1),
                        "%)"
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: profitMargin.percentage >= 20 ? "Bonne marge" : profitMargin.percentage >= 10 ? "Marge moyenne" : "Marge faible - Vérifiez vos prix" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "Taux de TVA (%)" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      step: "0.01",
                      min: "0",
                      max: "100",
                      value: data.tax_rate,
                      onChange: (e) => setData("tax_rate", e.target.value),
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                    }
                  ),
                  errors.tax_rate && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.tax_rate })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "Stock initial" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: data.stock_quantity,
                      onChange: (e) => setData("stock_quantity", e.target.value),
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                    }
                  ),
                  errors.stock_quantity && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.stock_quantity })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200", children: [
                  /* @__PURE__ */ jsx("span", { children: "Alerte stock minimum" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: data.min_stock_alert,
                      onChange: (e) => setData("min_stock_alert", e.target.value),
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                    }
                  ),
                  errors.min_stock_alert && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.min_stock_alert })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200 md:col-span-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Description" }),
                  /* @__PURE__ */ jsx(
                    "textarea",
                    {
                      value: data.description,
                      onChange: (e) => setData("description", e.target.value),
                      rows: 3,
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                    }
                  ),
                  errors.description && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.description })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "space-y-1 text-sm text-slate-200 md:col-span-2", children: [
                  /* @__PURE__ */ jsx("span", { children: "Image" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "file",
                      accept: "image/*",
                      onChange: handleImageChange,
                      className: "w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2"
                    }
                  ),
                  imagePreview && /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: imagePreview,
                      alt: "Aperçu",
                      className: "h-32 w-32 rounded-lg object-cover border border-white/15"
                    }
                  ) }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Formats acceptés: JPG, PNG, GIF (max 2 Mo)" }),
                  errors.image && /* @__PURE__ */ jsx("span", { className: "text-xs text-red-400", children: errors.image })
                ] }),
                /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm text-slate-200 md:col-span-2", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: data.track_stock,
                      onChange: (e) => setData("track_stock", e.target.checked),
                      className: "rounded border-white/15 bg-slate-900/70"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { children: "Suivre le stock" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                /* @__PURE__ */ jsx(
                  Link_default,
                  {
                    href: route("products.index"),
                    className: "rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10",
                    children: "Annuler"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "submit",
                    disabled: processing,
                    className: "rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:opacity-50",
                    children: processing ? "Enregistrement..." : "Enregistrer"
                  }
                )
              ] })
            ]
          }
        )
      ]
    }
  );
}
export {
  ProductsCreate as default
};
