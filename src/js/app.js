import $ from 'dom7';
import Framework7 from 'framework7/bundle';

// Import F7 Styles
import 'framework7/css/bundle';

// Import Icons and App Custom Styles
import '../css/icons.css';
import '../css/app.css';


// Import Routes
import routes from './routes.js';
// Import Store
import store from './store.js';

// Import main app component
import App from '../app.f7';

import { getCookieValue } from "../Utils/CookieHelpers.js";


var app = new Framework7({
  name: 'BudgetTracker2', // App name
  theme: 'auto', // Automatic theme detection
  colors: {
    primary: '#4392B2',
  },
  darkMode: false,

  el: '#app', // App root element
  component: App, // App main component
  // App store
  on: {
    init: (e,page) => {
      console.log("App init");
      let userCookie = getCookieValue("userId");
      console.log(userCookie);
      if(userCookie != "") {
        console.log("Hello, there is userCookie")
        store.dispatch("fetchUserById",userCookie).then(userData => {
          console.log(userData);
          store.dispatch("setActiveUser",userData);
          
        })
      }
    }
  },
  store: store,
  // App routes
  routes: routes,
  // Register service worker (only on production build)
  serviceWorker: process.env.NODE_ENV ==='production' ? {
    path: '/service-worker.js',
  } : {},
});