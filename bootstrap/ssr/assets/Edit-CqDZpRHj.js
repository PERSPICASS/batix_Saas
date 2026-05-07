import { jsxs, jsx } from "react/jsx-runtime";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import { u as useForm, H as Head_default, L as Link_default } from "../ssr.js";
import { useMemo, useState } from "react";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { u as useRoute } from "./route-C2Ac8FMA.js";
import "@inertiajs/core";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
function ProductsEdit({ product, shops, categories, subcategories }) {
  const route = useRoute();
  const { data, setData, post, processing, errors } = useForm({
    shop_id: product.shop_id,
    category_id: product.category_id,
    subcategory_id: product.subcategory_id || "",
    name: product.name,
    brand: product.brand || "",
    description: product.description || "",
    sku: product.sku || "",
    barcode: product.barcode || "",
    unit: product.unit,
    purchase_price: product.purchase_price,
    selling_price: product.selling_price,
    tax_rate: product.tax_rate,
    stock_quantity: product.stock_quantity,
    min_stock_alert: product.min_stock_alert || "",
    image: null,
    is_active: product.is_active,
    track_stock: product.track_stock,
    _method: "PUT"
  });
  const filteredSubcategories = useMemo(() => {
    if (!data.category_id) return [];
    return subcategories.filter((sub) => sub.category_id === Number(data.category_id));
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
  const submit = (e) => {
    e.preventDefault();
    post(route("products.update", { product: product.id }));
  };
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-white", children: "Modifier produit" }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Modifier produit" }),
        /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-4xl", children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid gap-6 md:grid-cols-2", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "shop_id", className: "block text-sm font-medium text-slate-200", children: "Boutique *" }),
              /* @__PURE__ */ jsx(
                "select",
                {
                  id: "shop_id",
                  value: data.shop_id,
                  disabled: true,
                  className: "mt-1 block w-full rounded-lg border border-white/10 bg-slate-800/50 px-3 py-2 text-slate-400 cursor-not-allowed",
                  children: shops.map((shop) => /* @__PURE__ */ jsx("option", { value: shop.id, children: shop.name }, shop.id))
                }
              ),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-400", children: "La boutique ne peut pas être modifiée" }),
              errors.shop_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.shop_id })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "category_id", className: "block text-sm font-medium text-slate-200", children: "Catégorie *" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: "category_id",
                  value: data.category_id,
                  onChange: (e) => {
                    setData("category_id", Number(e.target.value));
                    setData("subcategory_id", "");
                  },
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Sélectionner une catégorie" }),
                    categories.map((category) => /* @__PURE__ */ jsx("option", { value: category.id, children: category.name }, category.id))
                  ]
                }
              ),
              errors.category_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.category_id })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "subcategory_id", className: "block text-sm font-medium text-slate-200", children: "Sous-catégorie" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: "subcategory_id",
                  value: data.subcategory_id,
                  onChange: (e) => setData("subcategory_id", e.target.value ? Number(e.target.value) : ""),
                  disabled: !data.category_id || filteredSubcategories.length === 0,
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300 disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "", children: "Aucune" }),
                    filteredSubcategories.map((subcategory) => /* @__PURE__ */ jsx("option", { value: subcategory.id, children: subcategory.name }, subcategory.id))
                  ]
                }
              ),
              errors.subcategory_id && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.subcategory_id })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "brand", className: "block text-sm font-medium text-slate-200", children: "Marque" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "brand",
                  value: data.brand,
                  onChange: (e) => setData("brand", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "Ex: Bosch, Stanley, Makita..."
                }
              ),
              errors.brand && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.brand })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-slate-200", children: "Nom du produit *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "name",
                  value: data.name,
                  onChange: (e) => setData("name", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "Ex: Marteau"
                }
              ),
              errors.name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.name })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "sku", className: "block text-sm font-medium text-slate-200", children: "SKU" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "sku",
                  value: data.sku,
                  onChange: (e) => setData("sku", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "Ex: MAR-001"
                }
              ),
              errors.sku && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.sku })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "barcode", className: "block text-sm font-medium text-slate-200", children: "Code-barres" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  id: "barcode",
                  value: data.barcode,
                  onChange: (e) => setData("barcode", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "Ex: 1234567890123"
                }
              ),
              errors.barcode && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.barcode })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "unit", className: "block text-sm font-medium text-slate-200", children: "Unité *" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  id: "unit",
                  value: data.unit,
                  onChange: (e) => setData("unit", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "piece", children: "Pièce" }),
                    /* @__PURE__ */ jsx("option", { value: "kg", children: "Kilogramme" }),
                    /* @__PURE__ */ jsx("option", { value: "liter", children: "Litre" }),
                    /* @__PURE__ */ jsx("option", { value: "meter", children: "Mètre" }),
                    /* @__PURE__ */ jsx("option", { value: "box", children: "Boîte" }),
                    /* @__PURE__ */ jsx("option", { value: "pack", children: "Pack" })
                  ]
                }
              ),
              errors.unit && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.unit })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "purchase_price", className: "block text-sm font-medium text-slate-200", children: "Prix d'achat *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "0.01",
                  min: "0",
                  id: "purchase_price",
                  value: data.purchase_price,
                  onChange: (e) => setData("purchase_price", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "0.00"
                }
              ),
              errors.purchase_price && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.purchase_price })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "selling_price", className: "block text-sm font-medium text-slate-200", children: "Prix de vente *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "0.01",
                  min: "0",
                  id: "selling_price",
                  value: data.selling_price,
                  onChange: (e) => setData("selling_price", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "0.00"
                }
              ),
              errors.selling_price && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.selling_price })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-200", children: "Marge bénéficiaire" }),
              /* @__PURE__ */ jsxs("div", { className: `mt-1 flex items-center gap-3 rounded-lg border px-4 py-3 ${profitMargin.percentage >= 20 ? "border-green-500/30 bg-green-500/10" : profitMargin.percentage >= 10 ? "border-amber-500/30 bg-amber-500/10" : "border-red-500/30 bg-red-500/10"}`, children: [
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
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "tax_rate", className: "block text-sm font-medium text-slate-200", children: "Taux de TVA (%)" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  step: "0.01",
                  min: "0",
                  max: "100",
                  id: "tax_rate",
                  value: data.tax_rate,
                  onChange: (e) => setData("tax_rate", e.target.value),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "20.00"
                }
              ),
              errors.tax_rate && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.tax_rate })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "stock_quantity", className: "block text-sm font-medium text-slate-200", children: "Quantité en stock *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  id: "stock_quantity",
                  value: data.stock_quantity,
                  onChange: (e) => setData("stock_quantity", Number(e.target.value)),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "0"
                }
              ),
              errors.stock_quantity && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.stock_quantity })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "min_stock_alert", className: "block text-sm font-medium text-slate-200", children: "Seuil d'alerte stock" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  id: "min_stock_alert",
                  value: data.min_stock_alert,
                  onChange: (e) => setData("min_stock_alert", e.target.value ? Number(e.target.value) : ""),
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "10"
                }
              ),
              errors.min_stock_alert && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.min_stock_alert })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  id: "track_stock",
                  checked: data.track_stock,
                  onChange: (e) => setData("track_stock", e.target.checked),
                  className: "h-4 w-4 rounded border-white/15 bg-slate-900/70 text-amber-300 focus:ring-amber-300 focus:ring-offset-0"
                }
              ),
              /* @__PURE__ */ jsx("label", { htmlFor: "track_stock", className: "ml-2 block text-sm text-slate-200", children: "Suivre le stock" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "md:col-span-2", children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "description", className: "block text-sm font-medium text-slate-200", children: "Description" }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  id: "description",
                  value: data.description,
                  onChange: (e) => setData("description", e.target.value),
                  rows: 3,
                  className: "mt-1 block w-full rounded-lg border border-white/15 bg-slate-900/70 px-3 py-2 text-slate-200 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300",
                  placeholder: "Description du produit"
                }
              ),
              errors.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.description })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { htmlFor: "image", className: "block text-sm font-medium text-slate-200", children: "Image du produit" }),
              /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-start gap-4", children: [
                (imagePreview || product.image) && /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: imagePreview || `/storage/${product.image}`,
                      alt: product.name,
                      className: "h-20 w-20 rounded-lg object-cover border border-white/15"
                    }
                  ),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-400", children: imagePreview ? "Nouvelle image" : "Image actuelle" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "file",
                      id: "image",
                      accept: "image/*",
                      onChange: handleImageChange,
                      className: "block w-full text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-amber-300 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-amber-200"
                    }
                  ),
                  /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Formats acceptés: JPG, PNG, GIF (max 2 Mo)" })
                ] })
              ] }),
              errors.image && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-400", children: errors.image })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "checkbox",
                  id: "is_active",
                  checked: data.is_active,
                  onChange: (e) => setData("is_active", e.target.checked),
                  className: "h-4 w-4 rounded border-white/15 bg-slate-900/70 text-amber-300 focus:ring-amber-300 focus:ring-offset-0"
                }
              ),
              /* @__PURE__ */ jsx("label", { htmlFor: "is_active", className: "ml-2 block text-sm text-slate-200", children: "Produit actif" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-white/10 pt-4", children: [
            /* @__PURE__ */ jsx(
              Link_default,
              {
                href: route("products.index"),
                className: "rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5",
                children: "Annuler"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: processing,
                className: "rounded-lg bg-amber-300 px-6 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-200 disabled:opacity-50",
                children: processing ? "Enregistrement..." : "Enregistrer"
              }
            )
          ] })
        ] }) })
      ]
    }
  );
}
export {
  ProductsEdit as default
};
