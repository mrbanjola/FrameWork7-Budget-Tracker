import HomePage from "../pages/home.f7";
import AboutPage from "../pages/about.f7";
import CatalogPage from "../pages/catalog.f7";
import SettingsPage from "../pages/settings.f7";
import StatsPage from "../pages/stats.f7";

import store from "./store.js";

import NotFoundPage from "../pages/404.f7";

var routes = [
  {
    path: "/",
    component: HomePage,
  },
  {
    path: "/about/",
    component: AboutPage,
  },
  {
    path: "/catalog/",
    component: CatalogPage,
  },
  {
    path: "/settings/",
    component: SettingsPage,
  },
  {
    path: "/stats/",
    component: StatsPage,
  },
  {
    path: "(.*)",
    component: NotFoundPage,
  },
];

export default routes;
