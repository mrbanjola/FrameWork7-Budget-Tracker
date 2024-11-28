import { createStore } from 'framework7';

const store = createStore({
  state: {
    expenses: null, // Global variable to store expenses
    budget: null, // Global variable to store budget,
    categorizedExpenses: null, // Global variable to store categorized expenses
  },
  actions: {
    async fetchExpenses({ state }) {
      if (state.expenses) {
        return; // If data is already fetched, avoid making another API request
      }
      try {
        const response = await fetch('/api/expenses'); // Replace with your API endpoint
        const data = await response.json();
        state.expenses = data; // Save to global state
        state.categorizedExpenses = categorizeExpenses(data);
      } catch (error) {
        console.error('Failed to fetch expenses:', error);
      }
    },
    async fetchBudget({ state }) {
      if (state.budget) {
        return; // If data is already fetched, avoid making another API request
      }
      try {
        const response = await fetch('/api/budget'); // Replace with your API endpoint
        const data = await response.json();
        state.budget = data; // Save to global state
      } catch (error) {
        console.error('Failed to fetch budget:', error);
      }
    }
  },
});

function categorizeExpenses(expenses) {
  const categorizedExpenses = {};

  expenses.forEach(expense => {
    const category = expense.category;
    if (!categorizedExpenses[category]) {
      categorizedExpenses[category] = [];
    }
    categorizedExpenses[category].push(expense);
  });

  return categorizedExpenses;
};

export default store;