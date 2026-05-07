import { jsxs } from "react/jsx-runtime";
import { a as usePage } from "../ssr.js";
function Currency({ amount, className = "" }) {
  const { shopSettings } = usePage().props;
  const formatAmount = (value) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  const currency = shopSettings?.currency || "USD";
  const symbol = shopSettings?.currency_symbol || "$";
  const formattedAmount = formatAmount(amount);
  if (currency === "XOF") {
    return /* @__PURE__ */ jsxs("span", { className, children: [
      formattedAmount,
      " ",
      symbol
    ] });
  }
  return /* @__PURE__ */ jsxs("span", { className, children: [
    symbol,
    " ",
    formattedAmount
  ] });
}
function useShopSettings() {
  const { shopSettings } = usePage().props;
  return {
    currency: shopSettings?.currency || "USD",
    currencySymbol: shopSettings?.currency_symbol || "$",
    defaultTaxRate: shopSettings?.default_tax_rate || 0,
    invoicePrefix: shopSettings?.invoice_prefix || "INV",
    formatCurrency: (amount) => {
      const formattedAmount = new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
      const currency = shopSettings?.currency || "USD";
      const symbol = shopSettings?.currency_symbol || "$";
      if (currency === "XOF") {
        return `${formattedAmount} ${symbol}`;
      }
      return `${symbol} ${formattedAmount}`;
    },
    calculateTax: (price, customRate) => {
      const rate = customRate ?? shopSettings?.default_tax_rate ?? 0;
      return price * (rate / 100);
    },
    priceWithTax: (price, customRate) => {
      const rate = customRate ?? shopSettings?.default_tax_rate ?? 0;
      return price + price * (rate / 100);
    }
  };
}
export {
  Currency as C,
  useShopSettings as u
};
