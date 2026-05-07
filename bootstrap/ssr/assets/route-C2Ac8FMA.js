import { jsx } from "react/jsx-runtime";
import { a as usePage, L as Link_default } from "../ssr.js";
const ziggyRoute = route;
function useRouteParams() {
  const { routeParams } = usePage().props;
  return routeParams;
}
function useCurrentShop() {
  const { currentShop } = usePage().props;
  return currentShop;
}
function useRoute() {
  const page = usePage();
  const { routeParams, auth } = page.props;
  let codeUser = routeParams?.code_user;
  if (!codeUser && auth?.user) {
    if (auth.user.role === "super_admin") {
      codeUser = auth.user.code_user;
    } else {
      const urlParts = window.location.pathname.split("/").filter(Boolean);
      codeUser = urlParts[0] || null;
    }
  }
  return (name, params = {}, absolute = false) => {
    if (!codeUser) {
      console.warn(`useRoute: code_user not available for route "${name}"`);
      return ziggyRoute(name, params, absolute);
    }
    const allParams = {
      code_user: codeUser,
      ...params
    };
    return ziggyRoute(name, allParams, absolute);
  };
}
function useUserRoute() {
  return useRoute();
}
function UserLink({ route: routeName, params = {}, children, ...props }) {
  const routeBuilder = useRoute();
  const href = routeBuilder(routeName, params);
  return /* @__PURE__ */ jsx(Link_default, { href, ...props, children });
}
export {
  UserLink as U,
  useUserRoute as a,
  useCurrentShop as b,
  useRouteParams as c,
  useRoute as u
};
