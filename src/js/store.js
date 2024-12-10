import { createStore } from "framework7";
import GroupExpensesByCategory from "../Utils/GroupExpenses.js";

const store = createStore({
  state: {
    allExpenses: [],
    expenses: [], // Global variable to store expenses,
    budget: {}, // Global variable to store budget,
    categorizedExpenses: {}, // Global variable to store categorized expenses
    activeExpense: null, // Global variable to store active expense
    includeFixed: false, // Global variable to store whether to include fixed expenses
    includeSavings: false, // Global variable to store whether to include savings
    salaryPeriod: 10,
    fullYearExpenses: [],
    activeUser: null,
  },
  actions: {
    async fetchExpenses({ state }) {
      return new Promise((resolve, reject) => {
        if (state.expenses && state.expenses.length > 0) {
          resolve("Data already fetched"); // If data is already fetched, be happy
        }
        if (!state.activeUser || !state.activeUser.APIurl) {
          state.expenses = [];
          state.allExpenses = [];
          state.categorizedExpenses = {};
          reject("No active user");
          return;
        }
        try {
          console.log(`I will be fetching expenses for user`);
          console.log(state.activeUser);
          fetch(
            `/api/expenses?period=${state.salaryPeriod}&id=${state.activeUser.userId}`,
          ).then((response) => {
            if (!response.ok) {
              state.expenses = [];
              state.categorizedExpenses = {};
              reject({
                message: `This is a message from inside fetchExpenses. Response was bad, in fact it was not ok. Status is supposedly ${response.status}`,
              });
            } else if (response.ok) {
              response.json().then((data) => {
                console.log(data);
                state.expenses = data; // Save to global state
                state.allExpenses = data; // Save to global state
                state.categorizedExpenses = GroupExpensesByCategory(data);
                resolve("Allgood");
              });
            }
          });
        } catch (error) {
          console.error("Failed to fetch expenses:", error);
          reject("Problem with fetchExpenses");
        }
      });
    },
    setExpenses({ state }, expenses) {
      state.expenses = expenses;
      state.categorizedExpenses = [...GroupExpensesByCategory(expenses)];
    },
    fetchFullYearExpenses({ state }) {
      return new Promise(async (resolve, reject) => {
        if (state.fullYearExpenses && state.fullYearExpenses.length > 0) {
          resolve({
            success: true,
            message: "Full year expenses already fetched",
          }); // If data is already fetched, be happy
        }
        if (!state.activeUser || !state.activeUser.APIurl) {
          state.fullYearExpenses = [];
          reject("No active user");
          return;
        }
        try {
          const response = await fetch(
            `/api/expenses?id=${state.activeUser.userId}`,
          ); // Replace with your API endpoint
          if (!response.ok) {
            reject("Failed to fetch full year expenses:");
          } else {
            const data = await response.json();
            console.log(data);
            state.fullYearExpenses = data; // Save to global state
            resolve();
          }
        } catch (error) {
          console.error("Failed to fetch full year expenses:", error);
          reject("Problem with fetchFullYearExpenses");
        }
      });
    },
    fetchBudget({ state }) {
      return new Promise(async (resolve, reject) => {
        if (state.budget) {
          resolve(); // If data is already fetched, avoid making another API request
        }
        if (!state.activeUser) {
          state.budget = {};
          reject("No active user");
          return;
        }
        try {
          const response = await fetch(
            `/api/budget?id=${state.activeUser.userId}`,
          ); // Replace with your API endpoint
          if (!response.ok) {
            reject("Failed to fetch budget:");
          } else {
            console.log(response);
            const data = await response.json();
            state.budget = data; // Save to global state
            resolve();
          }
        } catch (error) {
          console.error("Failed to fetch budget:", error);
          reject("Problem with fetchBudget");
        }
      });
    },
    setBudget({ state }, { budget }) {
      console.log(`Setting budget to ${budget}`);
      state.budget = budget;
    },
    setActiveExpense({ state }, expense) {
      console.log(expense);
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
    setActiveUser: async ({ state }, user) => {
      return new Promise((resolve, reject) => {
        console.log(`Setting active user to ${user.userId}`);
        if (user.hasOwnProperty("userId") || user == null) {
          state.activeUser = user;
          resolve({
            success: true,
            message: "User set successfully",
          });
          return;
        } else {
          reject({
            success: false,
            message: "No user id provided",
          });
          return;
        }
      });
    },
    async fetchUserById({ state }, userId) {
      console.log(`Hello. I am fetching user ${userId}`);
      return new Promise((resolve, reject) => {
        fetch(`/api/users?id=${userId}`).then((response) => {
          if (response.ok) {
            response.json().then((responseData) => {
              console.log(`Hello. This is the user data:`);
              console.log(responseData);
              resolve({
                success: true,
                userData: responseData.data,
              });
            });
          } else {
            console.log("fetchUserById failed");
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
          credentials: "include",
          body: JSON.stringify(userInformation),
        })
          .then((res) => {
            if (res.ok) {
              console.log("We got good stuff from /api/post/login");
              res.json().then((responseData) => {
                console.log("Here comes the json");
                console.log(responseData);
                userData = responseData.data;
                success = true;
                state.activeUser = userData;
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
