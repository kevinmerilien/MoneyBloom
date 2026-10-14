const STORAGE_KEYS = {
  budget: 'moneywise-budget',
  expenses: 'moneywise-expenses'
};

const defaultBudget = 3200;
const defaultExpenses = [
  { id: 1, name: 'Groceries', amount: 185.45, category: 'Food' },
  { id: 2, name: 'Metro Pass', amount: 72.0, category: 'Transportation' },
  { id: 3, name: 'Streaming Bundle', amount: 34.99, category: 'Entertainment' },
  { id: 4, name: 'Online Shopping', amount: 146.25, category: 'Shopping' },
  { id: 5, name: 'Electric Bill', amount: 118.42, category: 'Bills' }
];

let budget = loadBudget();
let expenses = loadExpenses();

const budgetForm = document.getElementById('budget-form');
const budgetInput = document.getElementById('budget-input');
const expenseForm = document.getElementById('expense-form');
const expenseNameInput = document.getElementById('expense-name');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseCategoryInput = document.getElementById('expense-category');
const expenseList = document.getElementById('expense-list');
const budgetTotalEl = document.getElementById('budget-total');
const expenseTotalEl = document.getElementById('expense-total');
const remainingTotalEl = document.getElementById('remaining-total');
const progressFill = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');

function currencyFormatter(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

function loadBudget() {
  const storedBudget = localStorage.getItem(STORAGE_KEYS.budget);
  if (storedBudget === null) {
    localStorage.setItem(STORAGE_KEYS.budget, String(defaultBudget));
    return defaultBudget;
  }
  return Number(storedBudget) || defaultBudget;
}

function loadExpenses() {
  const storedExpenses = localStorage.getItem(STORAGE_KEYS.expenses);
  if (storedExpenses === null) {
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(defaultExpenses));
    return [...defaultExpenses];
  }

  try {
    const parsed = JSON.parse(storedExpenses);
    return Array.isArray(parsed) && parsed.length ? parsed : [...defaultExpenses];
  } catch (error) {
    console.error('Error parsing stored expenses:', error);
    return [...defaultExpenses];
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEYS.budget, String(budget));
  localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
}

function calculateTotalExpenses() {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
}

function renderDashboard() {
  const totalExpenses = calculateTotalExpenses();
  const remaining = budget - totalExpenses;
  const percentSpent = budget > 0 ? (totalExpenses / budget) * 100 : 0;

  budgetTotalEl.textContent = currencyFormatter(budget);
  expenseTotalEl.textContent = currencyFormatter(totalExpenses);
  remainingTotalEl.textContent = currencyFormatter(remaining);

  remainingTotalEl.style.color = remaining >= 0 ? '#9ff0d0' : '#ff9ca9';

  const width = Math.min(percentSpent, 100);
  progressFill.style.width = `${width}%`;
  progressLabel.textContent = `${Math.round(percentSpent)}%`;
}

function renderExpenses() {
  if (!expenses.length) {
    expenseList.innerHTML = '<li class="empty-state">No expenses yet. Add your first item to get started.</li>';
    return;
  }

  expenseList.innerHTML = expenses
    .map(
      (expense) => `
        <li class="expense-item" data-id="${expense.id}">
          <div class="expense-info">
            <div class="expense-topline">
              <span class="expense-name">${escapeHtml(expense.name)}</span>
              <span class="category-badge">${escapeHtml(expense.category)}</span>
            </div>
            <span class="expense-amount">${currencyFormatter(Number(expense.amount))}</span>
          </div>
          <button class="delete-btn" type="button" data-id="${expense.id}">Delete</button>
        </li>
      `
    )
    .join('');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function render() {
  budgetInput.value = budget;
  renderDashboard();
  renderExpenses();
}

budgetForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const nextBudget = Number(budgetInput.value);
  if (!Number.isFinite(nextBudget) || nextBudget < 0) {
    budgetInput.focus();
    return;
  }

  budget = nextBudget;
  saveState();
  render();
});

expenseForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const expenseName = expenseNameInput.value.trim();
  const expenseAmount = Number(expenseAmountInput.value);
  const category = expenseCategoryInput.value;

  if (!expenseName || !Number.isFinite(expenseAmount) || expenseAmount <= 0) {
    expenseAmountInput.focus();
    return;
  }

  const newExpense = {
    id: Date.now() + Math.random(),
    name: expenseName,
    amount: Number(expenseAmount.toFixed(2)),
    category
  };

  expenses = [newExpense, ...expenses];
  saveState();
  expenseForm.reset();
  expenseCategoryInput.value = 'Food';
  render();
});

expenseList.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('.delete-btn');
  if (!deleteButton) return;

  const idToRemove = Number(deleteButton.dataset.id);
  expenses = expenses.filter((expense) => Number(expense.id) !== idToRemove);
  saveState();
  render();
});

render();
