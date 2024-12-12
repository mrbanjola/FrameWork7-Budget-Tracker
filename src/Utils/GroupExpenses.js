export function GroupExpensesByCategory(expenses) {
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

export function SumExpensesByDate(expenses) {
  const grouped = {};
  expenses.forEach((expense) => {
    const date = expense.formattedDate;
    if (!grouped[date]) {
        grouped[date] = 0;
    }
    grouped[date] -= expense.sum;
  });

  return grouped;
}

export function FilterExpenses(expenses, includeFixed, includeSavings) {
  if (includeFixed && includeSavings) {
    return expenses;
  }

  if (!includeFixed) {
    expenses = expenses.filter(e => !e.isFixedExpense);
  };

  if (!includeSavings) {
    expenses = expenses.filter(e => !e.isSavings);
  }
  return expenses;
}



