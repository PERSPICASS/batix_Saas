import { jsxs, jsx } from "react/jsx-runtime";
import { H as Head_default, L as Link_default, r as router3 } from "../ssr.js";
import { a as useUserRoute, b as useCurrentShop, c as useRouteParams, U as UserLink } from "./route-C2Ac8FMA.js";
import { A as Authenticated } from "./AuthenticatedLayout-D2pJ2Tpe.js";
import "@inertiajs/core";
import "react";
import "react-dom";
import "lodash-es";
import "laravel-precognition";
import "react-dom/server";
import "@inertiajs/server";
import "ziggy-js";
import "lucide-react";
function ProductList({ products }) {
  const buildRoute = useUserRoute();
  const shop = useCurrentShop();
  const routeParams = useRouteParams();
  console.log("Code utilisateur:", routeParams.code_user);
  console.log("Boutique:", shop?.name);
  return /* @__PURE__ */ jsxs(
    Authenticated,
    {
      header: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold leading-tight text-gray-800", children: [
          "Produits - ",
          shop?.name
        ] }),
        /* @__PURE__ */ jsx(
          UserLink,
          {
            route: "products.create",
            className: "bg-blue-500 text-white px-4 py-2 rounded",
            children: "Ajouter un produit"
          }
        )
      ] }),
      children: [
        /* @__PURE__ */ jsx(Head_default, { title: "Produits" }),
        /* @__PURE__ */ jsx("div", { className: "py-12", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl sm:px-6 lg:px-8", children: /* @__PURE__ */ jsx("div", { className: "overflow-hidden bg-white shadow-sm sm:rounded-lg", children: /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
          /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: products.map((product) => /* @__PURE__ */ jsx(
            "div",
            {
              className: "border p-4 rounded hover:bg-gray-50",
              children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: product.name }),
                  /* @__PURE__ */ jsxs("p", { className: "text-gray-600", children: [
                    product.price,
                    " €"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsx(
                    Link_default,
                    {
                      href: buildRoute("products.show", {
                        product: product.id
                      }),
                      className: "text-blue-600 hover:underline",
                      children: "Voir"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    UserLink,
                    {
                      route: "products.edit",
                      params: { product: product.id },
                      className: "text-green-600 hover:underline",
                      children: "Modifier"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        if (confirm("Supprimer ce produit?")) {
                          router3.delete(
                            buildRoute("products.destroy", {
                              product: product.id
                            })
                          );
                        }
                      },
                      className: "text-red-600 hover:underline",
                      children: "Supprimer"
                    }
                  )
                ] })
              ] })
            },
            product.id
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-4", children: [
            /* @__PURE__ */ jsx(
              UserLink,
              {
                route: "dashboard",
                className: "text-gray-600 hover:text-gray-900",
                children: "← Retour au tableau de bord"
              }
            ),
            /* @__PURE__ */ jsx(
              UserLink,
              {
                route: "categories.index",
                className: "text-gray-600 hover:text-gray-900",
                children: "Gérer les catégories"
              }
            )
          ] })
        ] }) }) }) })
      ]
    }
  );
}
export {
  ProductList as default
};
