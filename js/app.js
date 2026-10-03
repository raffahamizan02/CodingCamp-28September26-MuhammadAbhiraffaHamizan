/**
 * Expense & Budget Visualizer - Main JavaScript
 * Complies with: Vanilla JS, LocalStorage API, Folder Rules (Only 1 JS file in js/)
 * Implements: MVP features + 5 Optional Challenges (Custom Categories, Monthly Summary,
 * Sorting, Budget & Expense Limit Highlighting, Dark/Light Mode Toggle).
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Constants & State Management
  // ==========================================================================
  const STORAGE_KEYS = {
    TRANSACTIONS: 'ebv_transactions',
    CATEGORIES: 'ebv_custom_categories',
    BUDGET_SETTINGS: 'ebv_budget_settings',
    THEME: 'ebv_theme_preference',
    CHART_TYPE: 'ebv_chart_type'
  };

  // Default MVP Categories (Required: Food, Transport, Fun)
  const DEFAULT_CATEGORIES = [
    { name: 'Food', color: '#10b981', icon: '🍔' },
    { name: 'Transport', color: '#3b82f6', icon: '🚗' },
    { name: 'Fun', color: '#f97316', icon: '🎉' }
  ];

  // Default Budget Settings
  const DEFAULT_BUDGET = {
    monthlyBudget: 500.00,
    singleExpenseLimit: 50.00
  };

  // Application State
  const state = {
    transactions: [],
    categories: [],
    budgetSettings: { ...DEFAULT_BUDGET },
    currentTheme: 'light',
    chartType: 'pie', // 'pie' or 'doughnut'
    filterMonth: 'all',
    filterCategory: 'all',
    sortBy: 'date-desc',
    searchQuery: '',
    chartInstance: null
  };

  // ==========================================================================
  // 2. DOM Elements Cache
  // ==========================================================================
  const DOM = {
    // Total Balance
    totalBalanceDisplay: document.getElementById('total-balance-display'),
    balanceSubtext: document.getElementById('balance-subtext'),
    budgetStatusCard: document.getElementById('budget-status-card'),
    budgetLimitDisplay: document.getElementById('budget-limit-display'),
    budgetBadge: document.getElementById('budget-badge'),
    budgetProgressBar: document.getElementById('budget-progress-bar'),
    budgetSpentRatio: document.getElementById('budget-spent-ratio'),
    budgetRemainingText: document.getElementById('budget-remaining-text'),

    // Transaction Form
    transactionForm: document.getElementById('transaction-form'),
    itemNameInput: document.getElementById('item-name'),
    amountInput: document.getElementById('amount'),
    categorySelect: document.getElementById('category'),
    transactionDateInput: document.getElementById('transaction-date'),
    groupItemName: document.getElementById('group-item-name'),
    groupAmount: document.getElementById('group-amount'),
    groupCategory: document.getElementById('group-category'),

    // Transactions List & Toolbar
    transactionCountBadge: document.getElementById('transaction-count-badge'),
    filterMonth: document.getElementById('filter-month'),
    filterCategory: document.getElementById('filter-category'),
    sortBy: document.getElementById('sort-by'),
    searchTransactions: document.getElementById('search-transactions'),
    btnClearSearch: document.getElementById('btn-clear-search'),
    transactionList: document.getElementById('transaction-list'),
    emptyState: document.getElementById('empty-state'),
    btnLoadSample: document.getElementById('btn-load-sample'),
    btnClearAll: document.getElementById('btn-clear-all'),

    // Visual Chart & Analytics
    categoryChartCanvas: document.getElementById('category-chart'),
    chartEmptyState: document.getElementById('chart-empty-state'),
    btnChartPie: document.getElementById('btn-chart-pie'),
    btnChartDoughnut: document.getElementById('btn-chart-doughnut'),
    summaryPeriod: document.getElementById('summary-period'),
    summaryTotal: document.getElementById('summary-total'),
    summaryTopCategory: document.getElementById('summary-top-category'),
    categoryBreakdownList: document.getElementById('category-breakdown-list'),

    // Modals
    categoryModal: document.getElementById('category-modal'),
    btnManageCategories: document.getElementById('btn-manage-categories'),
    btnQuickAddCat: document.getElementById('btn-quick-add-cat'),
    btnCloseCatModal: document.getElementById('btn-close-cat-modal'),
    newCategoryForm: document.getElementById('new-category-form'),
    newCategoryName: document.getElementById('new-category-name'),
    colorPalettePicker: document.getElementById('color-palette-picker'),
    selectedCategoryColor: document.getElementById('selected-category-color'),
    categoriesManageList: document.getElementById('categories-manage-list'),

    budgetModal: document.getElementById('budget-modal'),
    btnBudgetSettings: document.getElementById('btn-budget-settings'),
    btnCloseBudgetModal: document.getElementById('btn-close-budget-modal'),
    btnCancelBudget: document.getElementById('btn-cancel-budget'),
    budgetSettingsForm: document.getElementById('budget-settings-form'),
    inputMonthlyBudget: document.getElementById('input-monthly-budget'),
    inputSingleLimit: document.getElementById('input-single-limit'),

    // Header & Theme
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    toastContainer: document.getElementById('toast-container')
  };

  // ==========================================================================
  // 3. Local Storage Helpers (TC-2)
  // ==========================================================================
  function loadFromStorage() {
    try {
      // 1. Transactions
      const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      state.transactions = savedTransactions ? JSON.parse(savedTransactions) : [];

      // 2. Custom Categories
      const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (savedCategories) {
        state.categories = JSON.parse(savedCategories);
      } else {
        state.categories = [...DEFAULT_CATEGORIES];
        saveToStorage(STORAGE_KEYS.CATEGORIES, state.categories);
      }

      // 3. Budget Settings
      const savedBudget = localStorage.getItem(STORAGE_KEYS.BUDGET_SETTINGS);
      if (savedBudget) {
        state.budgetSettings = JSON.parse(savedBudget);
      } else {
        state.budgetSettings = { ...DEFAULT_BUDGET };
        saveToStorage(STORAGE_KEYS.BUDGET_SETTINGS, state.budgetSettings);
      }

      // 4. Theme
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme) {
        state.currentTheme = savedTheme;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        state.currentTheme = 'dark';
      } else {
        state.currentTheme = 'light';
      }

      // 5. Chart Type
      const savedChartType = localStorage.getItem(STORAGE_KEYS.CHART_TYPE);
      if (savedChartType === 'doughnut' || savedChartType === 'pie') {
        state.chartType = savedChartType;
      }
    } catch (e) {
      console.error('Error loading data from LocalStorage:', e);
      state.transactions = [];
      state.categories = [...DEFAULT_CATEGORIES];
      state.budgetSettings = { ...DEFAULT_BUDGET };
    }
  }

  function saveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key} to LocalStorage:`, e);
      showToast('Storage error: unable to save data.', 'danger');
    }
  }

  // ==========================================================================
  // 4. Currency & Formatting Utilities
  // ==========================================================================
  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getCategoryColor(categoryName) {
    const cat = state.categories.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
    return cat ? cat.color : '#64748b';
  }

  function getCategoryIcon(categoryName) {
    const cat = state.categories.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
    return cat && cat.icon ? cat.icon : '🏷️';
  }

  // ==========================================================================
  // 5. Toast Notifications
  // ==========================================================================
  function showToast(message, type = 'info') {
    if (!DOM.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // ==========================================================================
  // 6. Category Selects & Modals Management (Challenge 1)
  // ==========================================================================
  function renderCategoryOptions() {
    // 1. Transaction Form Category Select
    const currentVal = DOM.categorySelect.value;
    DOM.categorySelect.innerHTML = '<option value="" disabled selected>Select Category</option>';

    state.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = `${cat.icon ? cat.icon + ' ' : ''}${cat.name}`;
      DOM.categorySelect.appendChild(opt);
    });

    if (currentVal && state.categories.some(c => c.name === currentVal)) {
      DOM.categorySelect.value = currentVal;
    }

    // 2. Filter Category Dropdown
    const filterVal = DOM.filterCategory.value;
    DOM.filterCategory.innerHTML = '<option value="all">All Categories</option>';
    state.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.name;
      opt.textContent = `${cat.icon ? cat.icon + ' ' : ''}${cat.name}`;
      DOM.filterCategory.appendChild(opt);
    });

    if (filterVal) {
      DOM.filterCategory.value = filterVal;
    }

    // 3. Category Manager Modal List
    renderCategoryManageList();
  }

  function renderCategoryManageList() {
    DOM.categoriesManageList.innerHTML = '';
    state.categories.forEach(cat => {
      const li = document.createElement('li');
      li.className = 'category-manage-item';

      const isDefault = DEFAULT_CATEGORIES.some(dc => dc.name.toLowerCase() === cat.name.toLowerCase());

      li.innerHTML = `
        <span class="category-badge-chip">
          <span class="color-dot" style="background:${cat.color};"></span>
          <span>${cat.icon ? cat.icon + ' ' : ''}${cat.name}</span>
        </span>
        ${isDefault ? '<span class="card-badge">Default</span>' : `<button type="button" class="btn-remove-cat" data-name="${cat.name}">Remove</button>`}
      `;

      DOM.categoriesManageList.appendChild(li);
    });

    // Attach listener to remove buttons
    DOM.categoriesManageList.querySelectorAll('.btn-remove-cat').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const catName = e.currentTarget.getAttribute('data-name');
        removeCategory(catName);
      });
    });
  }

  function addCategory(name, color, icon = '🏷️') {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('Category name cannot be empty', 'danger');
      return false;
    }

    if (state.categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Category "${trimmed}" already exists`, 'warning');
      return false;
    }

    const newCat = { name: trimmed, color: color || '#3b82f6', icon };
    state.categories.push(newCat);
    saveToStorage(STORAGE_KEYS.CATEGORIES, state.categories);

    renderCategoryOptions();
    showToast(`Category "${trimmed}" added!`, 'success');
    return true;
  }

  function removeCategory(catName) {
    // Check if category is used in existing transactions
    const usedCount = state.transactions.filter(t => t.category.toLowerCase() === catName.toLowerCase()).length;
    if (usedCount > 0) {
      const confirmRemove = confirm(`Category "${catName}" is currently used in ${usedCount} transaction(s). Removing it will not delete the transactions. Continue?`);
      if (!confirmRemove) return;
    }

    state.categories = state.categories.filter(c => c.name.toLowerCase() !== catName.toLowerCase());
    saveToStorage(STORAGE_KEYS.CATEGORIES, state.categories);
    renderCategoryOptions();
    renderAll();
    showToast(`Category "${catName}" removed.`, 'info');
  }

  // ==========================================================================
  // 7. Month Filter Helper (Challenge 2: Monthly Summary View)
  // ==========================================================================
  function updateMonthFilterOptions() {
    const previousSelection = DOM.filterMonth.value;

    // Collect all unique Year-Month strings (e.g., '2026-10')
    const monthsSet = new Set();
    state.transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.substring(0, 7));
      }
    });

    // Also include current month even if no transactions yet
    const currentYearMonth = getTodayString().substring(0, 7);
    monthsSet.add(currentYearMonth);

    const sortedMonths = Array.from(monthsSet).sort().reverse();

    DOM.filterMonth.innerHTML = '<option value="all">All Months</option>';
    sortedMonths.forEach(ym => {
      const parts = ym.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const opt = document.createElement('option');
      opt.value = ym;
      opt.textContent = label;
      DOM.filterMonth.appendChild(opt);
    });

    if (sortedMonths.includes(previousSelection) || previousSelection === 'all') {
      DOM.filterMonth.value = previousSelection;
    } else {
      DOM.filterMonth.value = 'all';
      state.filterMonth = 'all';
    }
  }

  // ==========================================================================
  // 8. Transactions Filtering & Sorting (Challenge 2 & 3)
  // ==========================================================================
  function getFilteredAndSortedTransactions() {
    let list = [...state.transactions];

    // 1. Month Filter
    if (state.filterMonth !== 'all') {
      list = list.filter(t => t.date && t.date.startsWith(state.filterMonth));
    }

    // 2. Category Filter
    if (state.filterCategory !== 'all') {
      list = list.filter(t => t.category.toLowerCase() === state.filterCategory.toLowerCase());
    }

    // 3. Search Filter
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }

    // 4. Sorting (Challenge 3: Sort by amount or category)
    list.sort((a, b) => {
      switch (state.sortBy) {
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'category-asc':
          return a.category.localeCompare(b.category);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'date-desc':
        default:
          return new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt;
      }
    });

    return list;
  }

  // ==========================================================================
  // 9. Total Balance & Budget Calculations (MVP Requirement + Challenge 4)
  // ==========================================================================
  function calculateTotals() {
    // Total spent across all transactions
    const totalAllTime = state.transactions.reduce((sum, t) => sum + t.amount, 0);

    // Current filtered month spent (or all-time if all selected)
    const currentMonthPrefix = state.filterMonth === 'all'
      ? getTodayString().substring(0, 7)
      : state.filterMonth;

    const monthlySpent = state.transactions
      .filter(t => t.date && t.date.startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalAllTime, monthlySpent, currentMonthPrefix };
  }

  function renderBalanceAndBudget() {
    const { totalAllTime, monthlySpent, currentMonthPrefix } = calculateTotals();

    // 1. Total Balance Display (Prominently displayed at top)
    DOM.totalBalanceDisplay.textContent = formatCurrency(totalAllTime);

    if (state.transactions.length === 0) {
      DOM.balanceSubtext.textContent = 'No transactions recorded yet';
    } else {
      DOM.balanceSubtext.textContent = `Total spent across ${state.transactions.length} recorded transaction${state.transactions.length > 1 ? 's' : ''}`;
    }

    // 2. Budget Limit Card (Challenge 4: Highlight spending over a set limit)
    const budgetLimit = state.budgetSettings.monthlyBudget || DEFAULT_BUDGET.monthlyBudget;
    DOM.budgetLimitDisplay.textContent = `$${formatCurrency(budgetLimit)}`;

    const percentage = budgetLimit > 0 ? (monthlySpent / budgetLimit) * 100 : 0;
    const clampedPercentage = Math.min(percentage, 100);

    DOM.budgetProgressBar.style.width = `${clampedPercentage}%`;
    DOM.budgetProgressBar.classList.remove('status-warning', 'status-danger');

    const remaining = budgetLimit - monthlySpent;

    if (percentage >= 100) {
      DOM.budgetProgressBar.classList.add('status-danger');
      DOM.budgetBadge.className = 'badge badge-danger';
      DOM.budgetBadge.textContent = 'Exceeded';
      DOM.budgetRemainingText.textContent = `Over limit by: $${formatCurrency(Math.abs(remaining))}`;
    } else if (percentage >= 80) {
      DOM.budgetProgressBar.classList.add('status-warning');
      DOM.budgetBadge.className = 'badge badge-warning';
      DOM.budgetBadge.textContent = 'Approaching Limit';
      DOM.budgetRemainingText.textContent = `Remaining: $${formatCurrency(remaining)}`;
    } else {
      DOM.budgetBadge.className = 'badge badge-success';
      DOM.budgetBadge.textContent = 'On Track';
      DOM.budgetRemainingText.textContent = `Remaining: $${formatCurrency(remaining)}`;
    }

    DOM.budgetSpentRatio.textContent = `${percentage.toFixed(1)}% of budget used this month`;
  }

  // ==========================================================================
  // 10. Render Transaction List (MVP Requirement)
  // ==========================================================================
  function renderTransactionsList() {
    const displayedItems = getFilteredAndSortedTransactions();

    DOM.transactionCountBadge.textContent = displayedItems.length;

    if (displayedItems.length === 0) {
      DOM.transactionList.innerHTML = '';
      DOM.emptyState.style.display = 'flex';
      return;
    }

    DOM.emptyState.style.display = 'none';
    DOM.transactionList.innerHTML = '';

    const singleLimit = state.budgetSettings.singleExpenseLimit || DEFAULT_BUDGET.singleExpenseLimit;

    displayedItems.forEach(item => {
      const li = document.createElement('li');
      li.className = 'transaction-item';
      li.id = `tx-${item.id}`;

      // Challenge 4: Highlight spending over a set limit
      const isOverLimit = item.amount >= singleLimit;
      if (isOverLimit) {
        li.classList.add('is-over-limit');
      }

      const catColor = getCategoryColor(item.category);
      const catIcon = getCategoryIcon(item.category);

      li.innerHTML = `
        <div class="transaction-left">
          <div class="category-icon-avatar" style="background: ${catColor};" aria-hidden="true">
            ${catIcon}
          </div>
          <div class="transaction-details">
            <span class="transaction-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
            <div class="transaction-meta">
              <span class="category-pill" style="background: ${catColor};">${escapeHtml(item.category)}</span>
              <span class="transaction-date">${formatDate(item.date)}</span>
            </div>
          </div>
        </div>

        <div class="transaction-right">
          <div class="transaction-amount-col">
            <span class="transaction-amount">$${formatCurrency(item.amount)}</span>
            ${isOverLimit ? `<span class="alert-badge" title="Exceeds single expense warning limit of $${singleLimit}">⚠️ &gt;$${singleLimit}</span>` : ''}
          </div>
          <button type="button" class="btn-delete" data-id="${item.id}" aria-label="Delete transaction ${escapeHtml(item.name)}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete
          </button>
        </div>
      `;

      DOM.transactionList.appendChild(li);
    });

    // Bind delete actions
    DOM.transactionList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        deleteTransaction(id);
      });
    });
  }

  // ==========================================================================
  // 11. Transaction Actions: Add & Delete (MVP Requirement)
  // ==========================================================================
  function addTransaction(name, amount, category, date) {
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      amount: parseFloat(amount),
      category: category.trim(),
      date: date || getTodayString(),
      createdAt: Date.now()
    };

    state.transactions.unshift(newTx);
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, state.transactions);

    // Refresh views
    updateMonthFilterOptions();
    renderAll();

    // Check if item was over the warning limit and alert user
    const singleLimit = state.budgetSettings.singleExpenseLimit || DEFAULT_BUDGET.singleExpenseLimit;
    if (newTx.amount >= singleLimit) {
      showToast(`Added: ${newTx.name} ($${formatCurrency(newTx.amount)}) ⚠️ Over limit!`, 'danger');
    } else {
      showToast(`Added: ${newTx.name} ($${formatCurrency(newTx.amount)})`, 'success');
    }
  }

  function deleteTransaction(id) {
    const itemIndex = state.transactions.findIndex(t => t.id === id);
    if (itemIndex === -1) return;

    const removedItem = state.transactions[itemIndex];
    const itemElement = document.getElementById(`tx-${id}`);

    // Smooth removal animation
    if (itemElement) {
      itemElement.classList.add('removing');
      setTimeout(() => {
        state.transactions.splice(itemIndex, 1);
        saveToStorage(STORAGE_KEYS.TRANSACTIONS, state.transactions);
        updateMonthFilterOptions();
        renderAll();
        showToast(`Deleted "${removedItem.name}"`, 'info');
      }, 240);
    } else {
      state.transactions.splice(itemIndex, 1);
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, state.transactions);
      updateMonthFilterOptions();
      renderAll();
      showToast(`Deleted "${removedItem.name}"`, 'info');
    }
  }

  // ==========================================================================
  // 12. Form Validation (MVP Requirement: "Validate that all fields are filled")
  // ==========================================================================
  function validateForm() {
    let isValid = true;

    // Reset error classes
    DOM.groupItemName.classList.remove('has-error');
    DOM.groupAmount.classList.remove('has-error');
    DOM.groupCategory.classList.remove('has-error');

    // 1. Item Name
    const nameVal = DOM.itemNameInput.value.trim();
    if (!nameVal) {
      DOM.groupItemName.classList.add('has-error');
      isValid = false;
    }

    // 2. Amount
    const amountVal = parseFloat(DOM.amountInput.value);
    if (isNaN(amountVal) || amountVal <= 0) {
      DOM.groupAmount.classList.add('has-error');
      isValid = false;
    }

    // 3. Category
    const catVal = DOM.categorySelect.value;
    if (!catVal) {
      DOM.groupCategory.classList.add('has-error');
      isValid = false;
    }

    return isValid;
  }

  // Clear validation error on input
  DOM.itemNameInput.addEventListener('input', () => {
    if (DOM.itemNameInput.value.trim()) {
      DOM.groupItemName.classList.remove('has-error');
    }
  });

  DOM.amountInput.addEventListener('input', () => {
    const val = parseFloat(DOM.amountInput.value);
    if (!isNaN(val) && val > 0) {
      DOM.groupAmount.classList.remove('has-error');
    }
  });

  DOM.categorySelect.addEventListener('change', () => {
    if (DOM.categorySelect.value) {
      DOM.groupCategory.classList.remove('has-error');
    }
  });

  // Handle Form Submission
  DOM.transactionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fill all required fields correctly', 'danger');
      return;
    }

    const name = DOM.itemNameInput.value.trim();
    const amount = DOM.amountInput.value;
    const category = DOM.categorySelect.value;
    const date = DOM.transactionDateInput.value || getTodayString();

    addTransaction(name, amount, category, date);

    // Reset form fields
    DOM.itemNameInput.value = '';
    DOM.amountInput.value = '';
    DOM.categorySelect.value = '';
    DOM.transactionDateInput.value = getTodayString();
    DOM.itemNameInput.focus();
  });

  // ==========================================================================
  // 13. Visual Chart with Chart.js (MVP Requirement)
  // ==========================================================================
  function getCategorySpendingData() {
    // Calculate category spending for the current filter view
    let relevantTransactions = [...state.transactions];

    if (state.filterMonth !== 'all') {
      relevantTransactions = relevantTransactions.filter(t => t.date && t.date.startsWith(state.filterMonth));
    }

    const categoryTotals = {};
    relevantTransactions.forEach(t => {
      const cat = t.category;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = labels.map(label => categoryTotals[label]);
    const backgroundColor = labels.map(label => getCategoryColor(label));
    const totalAmount = data.reduce((a, b) => a + b, 0);

    return { labels, data, backgroundColor, totalAmount, categoryTotals };
  }

  function renderChart() {
    const { labels, data, backgroundColor, totalAmount, categoryTotals } = getCategorySpendingData();

    if (!DOM.categoryChartCanvas) return;

    if (data.length === 0 || totalAmount === 0) {
      // Empty Chart State
      if (state.chartInstance) {
        state.chartInstance.destroy();
        state.chartInstance = null;
      }
      DOM.categoryChartCanvas.style.display = 'none';
      DOM.chartEmptyState.classList.add('visible');
      renderAnalyticsDetails(totalAmount, {}, 0);
      return;
    }

    DOM.categoryChartCanvas.style.display = 'block';
    DOM.chartEmptyState.classList.remove('visible');

    const isDark = state.currentTheme === 'dark';
    const textColor = isDark ? '#e2e8f0' : '#334155';
    const borderColor = isDark ? '#111827' : '#ffffff';

    const chartConfig = {
      type: state.chartType, // 'pie' or 'doughnut'
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColor,
          borderColor: borderColor,
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 400
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textColor,
              font: {
                family: 'Plus Jakarta Sans',
                size: 12,
                weight: '600'
              },
              padding: 14,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#f8fafc',
            titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
            bodyFont: { family: 'Plus Jakarta Sans' },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                const value = context.parsed || 0;
                const pct = totalAmount > 0 ? ((value / totalAmount) * 100).toFixed(1) : 0;
                return ` ${context.label}: $${formatCurrency(value)} (${pct}%)`;
              }
            }
          }
        },
        cutout: state.chartType === 'doughnut' ? '65%' : 0
      }
    };

    if (state.chartInstance) {
      state.chartInstance.destroy();
    }

    state.chartInstance = new Chart(DOM.categoryChartCanvas, chartConfig);

    renderAnalyticsDetails(totalAmount, categoryTotals, data.length);
  }

  function renderAnalyticsDetails(totalAmount, categoryTotals, count) {
    // 1. Period Label
    if (state.filterMonth === 'all') {
      DOM.summaryPeriod.textContent = 'All Time';
    } else {
      const parts = state.filterMonth.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 1);
      DOM.summaryPeriod.textContent = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    // 2. Total in Period
    DOM.summaryTotal.textContent = `$${formatCurrency(totalAmount)}`;

    // 3. Top Category
    let topCat = '-';
    let topVal = 0;
    for (const [cat, val] of Object.entries(categoryTotals)) {
      if (val > topVal) {
        topVal = val;
        topCat = cat;
      }
    }
    DOM.summaryTopCategory.textContent = topVal > 0 ? `${topCat} ($${formatCurrency(topVal)})` : '-';

    // 4. Category Breakdown List
    DOM.categoryBreakdownList.innerHTML = '';
    const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    if (sortedCats.length === 0) {
      DOM.categoryBreakdownList.innerHTML = '<p class="form-help">No spending recorded in this period.</p>';
      return;
    }

    sortedCats.forEach(([catName, amount]) => {
      const pct = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : 0;
      const color = getCategoryColor(catName);
      const icon = getCategoryIcon(catName);

      const row = document.createElement('div');
      row.className = 'breakdown-row';
      row.innerHTML = `
        <div class="breakdown-row-header">
          <span class="breakdown-category-info">
            <span class="color-dot" style="background:${color};"></span>
            <span>${icon} ${escapeHtml(catName)}</span>
          </span>
          <span class="breakdown-amount-info">
            <span class="breakdown-amount">$${formatCurrency(amount)}</span>
            <span class="breakdown-percentage">(${pct}%)</span>
          </span>
        </div>
        <div class="breakdown-bar-track">
          <div class="breakdown-bar-fill" style="width:${pct}%; background:${color};"></div>
        </div>
      `;
      DOM.categoryBreakdownList.appendChild(row);
    });
  }

  // ==========================================================================
  // 14. Theme Toggle (Challenge 5: Dark/Light Mode Toggle)
  // ==========================================================================
  function applyTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    saveToStorage(STORAGE_KEYS.THEME, theme);

    // Update meta theme color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0b0f19' : '#2563eb');
    }

    // Refresh chart to match theme palette
    if (state.chartInstance) {
      renderChart();
    }
  }

  DOM.themeToggleBtn.addEventListener('click', () => {
    const nextTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme} mode`, 'info');
  });

  // ==========================================================================
  // 15. Filter & Sort Event Listeners (Challenge 2 & 3)
  // ==========================================================================
  DOM.filterMonth.addEventListener('change', (e) => {
    state.filterMonth = e.target.value;
    renderTransactionsList();
    renderChart();
    renderBalanceAndBudget();
  });

  DOM.filterCategory.addEventListener('change', (e) => {
    state.filterCategory = e.target.value;
    renderTransactionsList();
  });

  DOM.sortBy.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderTransactionsList();
  });

  DOM.searchTransactions.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    if (state.searchQuery) {
      DOM.btnClearSearch.style.display = 'block';
    } else {
      DOM.btnClearSearch.style.display = 'none';
    }
    renderTransactionsList();
  });

  DOM.btnClearSearch.addEventListener('click', () => {
    DOM.searchTransactions.value = '';
    state.searchQuery = '';
    DOM.btnClearSearch.style.display = 'none';
    renderTransactionsList();
  });

  // Chart Type Toggle
  DOM.btnChartPie.addEventListener('click', () => {
    if (state.chartType === 'pie') return;
    state.chartType = 'pie';
    DOM.btnChartPie.classList.add('active');
    DOM.btnChartDoughnut.classList.remove('active');
    saveToStorage(STORAGE_KEYS.CHART_TYPE, 'pie');
    renderChart();
  });

  DOM.btnChartDoughnut.addEventListener('click', () => {
    if (state.chartType === 'doughnut') return;
    state.chartType = 'doughnut';
    DOM.btnChartDoughnut.classList.add('active');
    DOM.btnChartPie.classList.remove('active');
    saveToStorage(STORAGE_KEYS.CHART_TYPE, 'doughnut');
    renderChart();
  });

  // ==========================================================================
  // 16. Modals Event Handling (Custom Categories & Budget Settings)
  // ==========================================================================
  function openModal(modalEl) {
    modalEl.classList.add('active');
    modalEl.setAttribute('aria-hidden', 'false');
  }

  function closeModal(modalEl) {
    modalEl.classList.remove('active');
    modalEl.setAttribute('aria-hidden', 'true');
  }

  // Category Modal
  DOM.btnManageCategories.addEventListener('click', () => openModal(DOM.categoryModal));
  DOM.btnQuickAddCat.addEventListener('click', () => openModal(DOM.categoryModal));
  DOM.btnCloseCatModal.addEventListener('click', () => closeModal(DOM.categoryModal));

  DOM.categoryModal.addEventListener('click', (e) => {
    if (e.target === DOM.categoryModal) closeModal(DOM.categoryModal);
  });

  // Color Swatch Selection
  DOM.colorPalettePicker.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
      DOM.colorPalettePicker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      const chosen = e.currentTarget;
      chosen.classList.add('selected');
      DOM.selectedCategoryColor.value = chosen.getAttribute('data-color');
    });
  });

  // New Category Form Submit
  DOM.newCategoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = DOM.newCategoryName.value;
    const color = DOM.selectedCategoryColor.value;

    if (addCategory(name, color, '🏷️')) {
      DOM.newCategoryName.value = '';
      closeModal(DOM.categoryModal);
      DOM.categorySelect.value = name.trim();
    }
  });

  // Budget Modal
  DOM.btnBudgetSettings.addEventListener('click', () => {
    DOM.inputMonthlyBudget.value = state.budgetSettings.monthlyBudget;
    DOM.inputSingleLimit.value = state.budgetSettings.singleExpenseLimit;
    openModal(DOM.budgetModal);
  });

  DOM.btnCloseBudgetModal.addEventListener('click', () => closeModal(DOM.budgetModal));
  DOM.btnCancelBudget.addEventListener('click', () => closeModal(DOM.budgetModal));

  DOM.budgetModal.addEventListener('click', (e) => {
    if (e.target === DOM.budgetModal) closeModal(DOM.budgetModal);
  });

  DOM.budgetSettingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const monthlyBudget = parseFloat(DOM.inputMonthlyBudget.value);
    const singleLimit = parseFloat(DOM.inputSingleLimit.value);

    if (isNaN(monthlyBudget) || monthlyBudget <= 0 || isNaN(singleLimit) || singleLimit <= 0) {
      showToast('Please enter valid positive values', 'danger');
      return;
    }

    state.budgetSettings.monthlyBudget = monthlyBudget;
    state.budgetSettings.singleExpenseLimit = singleLimit;
    saveToStorage(STORAGE_KEYS.BUDGET_SETTINGS, state.budgetSettings);

    closeModal(DOM.budgetModal);
    renderAll();
    showToast('Budget settings updated successfully', 'success');
  });

  // ==========================================================================
  // 17. Sample Data & Clear All Actions
  // ==========================================================================
  DOM.btnLoadSample.addEventListener('click', () => {
    const today = getTodayString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthStr = prevMonth.toISOString().split('T')[0];

    const samples = [
      {
        id: 'tx_sample_1',
        name: 'Cilok & Snacks',
        amount: 14.94,
        category: 'Food',
        date: today,
        createdAt: Date.now() - 1000
      },
      {
        id: 'tx_sample_2',
        name: 'Shopping',
        amount: 3.56,
        category: 'Fun',
        date: today,
        createdAt: Date.now() - 2000
      },
      {
        id: 'tx_sample_3',
        name: 'Commuter Train Pass',
        amount: 45.00,
        category: 'Transport',
        date: yesterdayStr,
        createdAt: Date.now() - 3000
      },
      {
        id: 'tx_sample_4',
        name: 'Gadget / Headset Upgrade',
        amount: 85.50,
        category: 'Fun',
        date: yesterdayStr,
        createdAt: Date.now() - 4000
      },
      {
        id: 'tx_sample_5',
        name: 'Weekly Grocery Haul',
        amount: 62.40,
        category: 'Food',
        date: prevMonthStr,
        createdAt: Date.now() - 5000
      }
    ];

    state.transactions = [...samples];
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, state.transactions);
    updateMonthFilterOptions();
    renderAll();
    showToast('Sample data loaded!', 'success');
  });

  DOM.btnClearAll.addEventListener('click', () => {
    if (state.transactions.length === 0) {
      showToast('No transactions to clear', 'info');
      return;
    }

    const confirmClear = confirm('Are you sure you want to clear all transactions? This cannot be undone.');
    if (confirmClear) {
      state.transactions = [];
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, state.transactions);
      updateMonthFilterOptions();
      renderAll();
      showToast('All transactions cleared', 'info');
    }
  });

  // Keyboard accessibility: Escape to close modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (DOM.categoryModal.classList.contains('active')) closeModal(DOM.categoryModal);
      if (DOM.budgetModal.classList.contains('active')) closeModal(DOM.budgetModal);
    }
  });

  // ==========================================================================
  // 18. Helper Utilities
  // ==========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderAll() {
    renderBalanceAndBudget();
    renderTransactionsList();
    renderChart();
  }

  // ==========================================================================
  // 19. Application Initialization
  // ==========================================================================
  function initApp() {
    loadFromStorage();
    applyTheme(state.currentTheme);

    // Set default date input to today
    DOM.transactionDateInput.value = getTodayString();

    // Set chart toggle button active state
    if (state.chartType === 'doughnut') {
      DOM.btnChartDoughnut.classList.add('active');
      DOM.btnChartPie.classList.remove('active');
    } else {
      DOM.btnChartPie.classList.add('active');
      DOM.btnChartDoughnut.classList.remove('active');
    }

    renderCategoryOptions();
    updateMonthFilterOptions();
    renderAll();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
