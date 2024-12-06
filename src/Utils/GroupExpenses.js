function GroupExpensesByCategory(expenses) {
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

export default GroupExpensesByCategory;
