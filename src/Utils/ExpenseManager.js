class ExpenseManager {
  constructor(expenses) {
    this.expenses = expenses;
    this.expensesByCategory = this.GroupExpensesByCategory(expenses);
  }

  GroupExpensesByCategory(expenses) {
    const categorizedExpenses = {};

    expenses.forEach((expense) => {
      const category = expense.category;
      if (!categorizedExpenses[category]) {
        categorizedExpenses[category] = [];
      }
      categorizedExpenses[category].push(expense);
    });

    return categorizedExpenses;
  }
}

export default ExpenseManager;
