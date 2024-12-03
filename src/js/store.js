import { createStore } from "framework7";
import GroupExpensesByCategory from "../Utils/GroupExpenses.js";

const store = createStore({
  state: {
    allExpenses: null,
    expenses: null, // Global variable to store expenses,
    budget: null, // Global variable to store budget,
    categorizedExpenses: null, // Global variable to store categorized expenses
    activeExpense: null, // Global variable to store active expense
    includeFixed: false, // Global variable to store whether to include fixed expenses
    includeSavings: false, // Global variable to store whether to include savings
    salaryPeriod: 10,
    fullYearExpenses: null,
    activeUser: null,
    rememberMe: false,
  },
  actions: {
    async fetchExpenses({ state }) {
      if (state.expenses) {
        return; // If data is already fetched, avoid making another API request
      }
      try {
        const response = await fetch(
          `/api/expenses?period=${state.salaryPeriod}`,
        ); // Replace with your API endpoint
        const data = await response.json();
        console.log(data);
        state.expenses = data; // Save to global state
        state.allExpenses = data; // Save to global state
        state.categorizedExpenses = GroupExpensesByCategory(data);
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
      }
    },
    setExpenses({ state }, expenses) {
      state.expenses = expenses;
      state.categorizedExpenses = [...GroupExpensesByCategory(expenses)];
    },
    async fetchFullYearExpenses({ state }) {
      if (state.fullYearExpenses) {
        return; // If data is already fetched, avoid making another API request
      }
      try {
        const response = await fetch(`/api/expenses`); // Replace with your API endpoint
        const data = await response.json();
        console.log(data);
        state.fullYearExpenses = data; // Save to global state
      } catch (error) {
        console.error("Failed to fetch full year expenses:", error);
      }
    },
    async fetchBudget({ state }) {
      if (state.budget) {
        return; // If data is already fetched, avoid making another API request
      }
      try {
        const response = await fetch("/api/budget"); // Replace with your API endpoint
        const data = await response.json();
        state.budget = data; // Save to global state
      } catch (error) {
        console.error("Failed to fetch budget:", error);
      }
    },
    setBudget({ state }, { budget }) {
      console.log(`Setting budget to ${budget}`);
      state.budget = budget;
    },
    setActiveExpense({ state }, expense) {
      state.activeExpense = expense;
    },
    filterExpenses({ state }, params) {
      if (
        params.hasOwnProperty("includeFixed") &&
        params["includeFixed"] === false
      ) {
        state.expenses = [...state.expenses].filter((expense) => {
          return expense.isFixedExpense == false;
        });
      } else {
        state.expenses = [...state.allExpenses];
      }
      if (
        params.hasOwnProperty("inclueSavings") &&
        params["includeSavings"] === false
      ) {
        state.expenses = [...state.expenses].filter((expense) => {
          return expense.isSavings == false;
        });
      }
      state.categorizedExpenses = GroupExpensesByCategory([...state.expenses]);
    },
    setActiveUser({ state }, user) {
      state.activeUser = user;
    },
    async fetchUserById({ state }, userId) {
      console.log(`Hello. I am fetching user ${userId}`);
      return new Promise((resolve, reject) => {
        fetch(`/api/users?id=${userId}`).then((response) => {
          if (response.ok) {
            response.json().then((userData) => {
              console.log(`Hello. This is the user data:`);
              console.log(userData);
              resolve({
                success: true,
                userData,
              });
            });
          } else {
            reject({
              success: false,
              userData: null,
            });
          }
        });
      });
    },
    login: ({ state }, userInformation) => {
      return new Promise((resolve, reject) => {
        var userData = null;
        var success = false;
        // Send data to the server
        fetch("/api/post/login", {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(userInformation),
        })
          .then((res) => {
            if (res.ok) {
              res.json().then((responseData) => {
                userData = responseData.data;
                success = true;
                resolve({ success, userData });
              });
            } else {
              reject({ success, userData });
            }
          })
          .catch((err) => console.error(err));
      });
    },
  },

  getters: {
    getExpenses({ state }) {
      return state.expenses;
    },
    getBudget({ state }) {
      return state.budget;
    },
    getActiveExpense({ state }) {
      return state.activeExpense;
    },
    getCategorizedExpenses({ state }) {
      return state.categorizedExpenses;
    },
    getAllExpenses({ state }) {
      return state.allExpenses;
    },
    getFullYearExpenses({ state }) {
      return state.fullYearExpenses;
    },
    getActiveUser({ state }) {
      return state.activeUser;
    },
  },
});

export default store;

async function wait(ms) {
  setTimeout(function () {
    console.log("I should be printed second");
  }, ms);
  console.log("I shoud be printed third");
}

function test() {
  console.log("I should be printed first");
  wait(2000).then(function () {
    console.log("I am a wildcard");
  });
  console.log("I shoud be printed fourth");
}
