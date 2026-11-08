/**
 * CaloTrack - Pure Vanilla JavaScript Calorie & Macro Tracker
 * Fully client-side with persistent localStorage
 */

(function () {
  'use strict';

  // --- Constants & Storage ---
  const STORAGE_KEY = 'calotrack_v1_data';
  const CIRCLE_CIRCUMFERENCE = 502.65; // 2 * Math.PI * 80

  // Standard Presets Library
  const PRESET_FOODS = [
    { name: 'Rolled Oats with Berries', serving: '1 bowl (60g dry)', calories: 290, protein: 10, carbs: 52, fat: 5 },
    { name: '2 Large Boiled Eggs & Toast', serving: '2 eggs + 1 slice', calories: 250, protein: 17, carbs: 18, fat: 11 },
    { name: 'Grilled Chicken Breast', serving: '150g cooked', calories: 245, protein: 46, carbs: 0, fat: 5 },
    { name: 'Cooked Jasmine White Rice', serving: '1 cup (160g)', calories: 210, protein: 4, carbs: 45, fat: 0.5 },
    { name: 'Baked Atlantic Salmon', serving: '150g fillet', calories: 310, protein: 34, carbs: 0, fat: 18 },
    { name: 'Greek Yogurt (Non-Fat)', serving: '1 cup (200g)', calories: 120, protein: 20, carbs: 7, fat: 0.5 },
    { name: 'Whey Protein Shake', serving: '1 scoop with water', calories: 130, protein: 25, carbs: 3, fat: 1.5 },
    { name: 'Medium Banana', serving: '1 fruit (~118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
    { name: 'Fresh Hass Avocado', serving: '1/2 medium fruit', calories: 130, protein: 1.5, carbs: 6, fat: 12 },
    { name: 'Raw Almonds', serving: 'Handful (30g)', calories: 175, protein: 6, carbs: 6, fat: 15 },
    { name: 'Garden Salad with Olive Oil', serving: '1 medium bowl', calories: 160, protein: 2, carbs: 8, fat: 14 },
    { name: 'Black Americano / Espresso', serving: '1 cup (240ml)', calories: 5, protein: 0.5, carbs: 0, fat: 0 }
  ];

  // Helper: Format Date as YYYY-MM-DD
  function getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // --- Initial App State ---
  let appState = {
    settings: {
      dailyCalorieGoal: 2000,
      proteinGoal: 140,
      carbsGoal: 220,
      fatGoal: 65
    },
    logs: {}
  };

  let selectedDate = getTodayString();

  // --- Persistence Methods ---
  function loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          appState = {
            settings: Object.assign({}, appState.settings, parsed.settings || {}),
            logs: parsed.logs || {}
          };
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load storage data, using defaults:', e);
    }

    // Seed default sample data for today if brand new user
    seedSampleData();
    saveData();
  }

  function saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      showToast('Error saving data! Check storage quota.');
    }
  }

  function seedSampleData() {
    const today = getTodayString();
    appState.logs[today] = [
      {
        id: 'seed-1',
        meal: 'breakfast',
        name: 'Oatmeal with Blueberries & Honey',
        serving: '1 bowl (300g)',
        calories: 320,
        protein: 11,
        carbs: 58,
        fat: 6,
        timestamp: Date.now() - 14400000
      },
      {
        id: 'seed-2',
        meal: 'lunch',
        name: 'Grilled Chicken Breast & Quinoa',
        serving: '1 plate (350g)',
        calories: 490,
        protein: 48,
        carbs: 45,
        fat: 12,
        timestamp: Date.now() - 7200000
      },
      {
        id: 'seed-3',
        meal: 'snacks',
        name: 'Greek Yogurt & Walnuts',
        serving: '1 serving (150g)',
        calories: 210,
        protein: 16,
        carbs: 9,
        fat: 11,
        timestamp: Date.now() - 3600000
      }
    ];
  }

  // --- DOM Elements ---
  const currentDateLabel = document.getElementById('currentDateLabel');
  const datePickerInput = document.getElementById('datePickerInput');
  const prevDateBtn = document.getElementById('prevDateBtn');
  const nextDateBtn = document.getElementById('nextDateBtn');
  const todayBtn = document.getElementById('todayBtn');

  // Calorie Overview Card Elements
  const calorieRingProgress = document.getElementById('calorieRingProgress');
  const remainingCaloriesValue = document.getElementById('remainingCaloriesValue');
  const consumedCaloriesValue = document.getElementById('consumedCaloriesValue');
  const goalCaloriesValue = document.getElementById('goalCaloriesValue');
  const calorieStatusBadge = document.getElementById('calorieStatusBadge');
  const quickEditGoalBtn = document.getElementById('quickEditGoalBtn');

  // Macro Card Elements
  const proteinConsumed = document.getElementById('proteinConsumed');
  const proteinGoal = document.getElementById('proteinGoal');
  const proteinPercent = document.getElementById('proteinPercent');
  const proteinProgressBar = document.getElementById('proteinProgressBar');

  const carbsConsumed = document.getElementById('carbsConsumed');
  const carbsGoal = document.getElementById('carbsGoal');
  const carbsPercent = document.getElementById('carbsPercent');
  const carbsProgressBar = document.getElementById('carbsProgressBar');

  const fatConsumed = document.getElementById('fatConsumed');
  const fatGoal = document.getElementById('fatGoal');
  const fatPercent = document.getElementById('fatPercent');
  const fatProgressBar = document.getElementById('fatProgressBar');

  const ratioProtein = document.getElementById('ratioProtein');
  const ratioCarbs = document.getElementById('ratioCarbs');
  const ratioFat = document.getElementById('ratioFat');

  // Weekly History Elements
  const weeklyChartContainer = document.getElementById('weeklyChartContainer');

  // Meal Totals & Lists
  const mealCategories = ['breakfast', 'lunch', 'dinner', 'snacks'];
  const mealElements = {
    breakfast: {
      totalCal: document.getElementById('breakfastTotalCal'),
      list: document.getElementById('breakfastItemsList')
    },
    lunch: {
      totalCal: document.getElementById('lunchTotalCal'),
      list: document.getElementById('lunchItemsList')
    },
    dinner: {
      totalCal: document.getElementById('dinnerTotalCal'),
      list: document.getElementById('dinnerItemsList')
    },
    snacks: {
      totalCal: document.getElementById('snacksTotalCal'),
      list: document.getElementById('snacksItemsList')
    }
  };

  // Modals & Forms
  const foodModal = document.getElementById('foodModal');
  const foodModalTitle = document.getElementById('foodModalTitle');
  const foodForm = document.getElementById('foodForm');
  const editItemId = document.getElementById('editItemId');
  const foodMealSelect = document.getElementById('foodMealSelect');
  const foodNameInput = document.getElementById('foodNameInput');
  const foodServingInput = document.getElementById('foodServingInput');
  const foodCaloriesInput = document.getElementById('foodCaloriesInput');
  const foodProteinInput = document.getElementById('foodProteinInput');
  const foodCarbsInput = document.getElementById('foodCarbsInput');
  const foodFatInput = document.getElementById('foodFatInput');
  const closeFoodModalBtn = document.getElementById('closeFoodModalBtn');
  const cancelFoodModalBtn = document.getElementById('cancelFoodModalBtn');
  const openAddModalGlobalBtn = document.getElementById('openAddModalGlobalBtn');

  // Presets Modal
  const presetsModal = document.getElementById('presetsModal');
  const quickPresetBtn = document.getElementById('quickPresetBtn');
  const closePresetsModalBtn = document.getElementById('closePresetsModalBtn');
  const closePresetsBtn = document.getElementById('closePresetsBtn');
  const presetsList = document.getElementById('presetsList');
  const presetTargetMealSelect = document.getElementById('presetTargetMealSelect');

  // Settings & TDEE Modal
  const settingsModal = document.getElementById('settingsModal');
  const settingsBtn = document.getElementById('settingsBtn');
  const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const targetsForm = document.getElementById('targetsForm');
  const settingCalorieGoal = document.getElementById('settingCalorieGoal');
  const settingProteinGoal = document.getElementById('settingProteinGoal');
  const settingCarbsGoal = document.getElementById('settingCarbsGoal');
  const settingFatGoal = document.getElementById('settingFatGoal');

  // TDEE Calculator Form
  const calculatorForm = document.getElementById('calculatorForm');
  const calcGender = document.getElementById('calcGender');
  const calcAge = document.getElementById('calcAge');
  const calcWeight = document.getElementById('calcWeight');
  const calcHeight = document.getElementById('calcHeight');
  const calcActivity = document.getElementById('calcActivity');
  const calcGoal = document.getElementById('calcGoal');
  const computeTdeeBtn = document.getElementById('computeTdeeBtn');
  const calcResultBox = document.getElementById('calcResultBox');
  const calcSuggestedCalories = document.getElementById('calcSuggestedCalories');
  const calcSuggestedP = document.getElementById('calcSuggestedP');
  const calcSuggestedC = document.getElementById('calcSuggestedC');
  const calcSuggestedF = document.getElementById('calcSuggestedF');
  const applyCalcBtn = document.getElementById('applyCalcBtn');

  // Data Mgmt
  const exportDataBtn = document.getElementById('exportDataBtn');
  const importFileInput = document.getElementById('importFileInput');
  const clearTodayBtn = document.getElementById('clearTodayBtn');
  const resetAllDataBtn = document.getElementById('resetAllDataBtn');

  // Toast
  const toastNotification = document.getElementById('toastNotification');

  // --- Date Navigation Logic ---
  function updateDateDisplay() {
    datePickerInput.value = selectedDate;

    const parts = selectedDate.split('-');
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

    const todayStr = getTodayString();
    let prefix = '';

    if (selectedDate === todayStr) {
      prefix = 'Today, ';
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      if (selectedDate === yesterdayStr) {
        prefix = 'Yesterday, ';
      }
    }

    const options = { month: 'short', day: 'numeric' };
    currentDateLabel.textContent = prefix + dateObj.toLocaleDateString(undefined, options);
  }

  function changeDateByOffset(offset) {
    const parts = selectedDate.split('-');
    const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    dateObj.setDate(dateObj.getDate() + offset);

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    selectedDate = `${year}-${month}-${day}`;

    updateDateDisplay();
    renderAll();
  }

  // --- Calculations & Dashboard Rendering ---
  function getSelectedDayItems() {
    return appState.logs[selectedDate] || [];
  }

  function renderAll() {
    renderDashboard();
    renderMeals();
    renderWeeklyChart();
  }

  function renderDashboard() {
    const items = getSelectedDayItems();
    const settings = appState.settings;

    let totalCals = 0;
    let totalP = 0;
    let totalC = 0;
    let totalF = 0;

    items.forEach(function (item) {
      totalCals += Number(item.calories) || 0;
      totalP += Number(item.protein) || 0;
      totalC += Number(item.carbs) || 0;
      totalF += Number(item.fat) || 0;
    });

    totalP = Math.round(totalP * 10) / 10;
    totalC = Math.round(totalC * 10) / 10;
    totalF = Math.round(totalF * 10) / 10;

    const goalCals = settings.dailyCalorieGoal || 2000;
    const remaining = goalCals - totalCals;

    // Calorie Progress Ring
    const pct = Math.min(Math.max(totalCals / goalCals, 0), 1.5);
    const offset = CIRCLE_CIRCUMFERENCE - (Math.min(pct, 1) * CIRCLE_CIRCUMFERENCE);
    calorieRingProgress.style.strokeDashoffset = offset;

    consumedCaloriesValue.textContent = `${totalCals.toLocaleString()} kcal`;
    goalCaloriesValue.textContent = `${goalCals.toLocaleString()} kcal`;

    if (remaining >= 0) {
      remainingCaloriesValue.textContent = remaining.toLocaleString();
      calorieRingProgress.style.stroke = '#10b981'; // emerald green

      if (totalCals > goalCals * 0.9) {
        calorieStatusBadge.textContent = 'Near Limit';
        calorieStatusBadge.className = 'status-pill status-warning';
        calorieRingProgress.style.stroke = '#f59e0b'; // amber
      } else {
        calorieStatusBadge.textContent = 'On Track';
        calorieStatusBadge.className = 'status-pill status-normal';
      }
    } else {
      const overBy = Math.abs(remaining);
      remainingCaloriesValue.textContent = `+${overBy.toLocaleString()}`;
      calorieStatusBadge.textContent = 'Over Budget';
      calorieStatusBadge.className = 'status-pill status-exceeded';
      calorieRingProgress.style.stroke = '#ef4444'; // red
    }

    // Macro Progress Bars
    proteinConsumed.textContent = totalP;
    proteinGoal.textContent = settings.proteinGoal;
    const pPct = Math.round((totalP / (settings.proteinGoal || 1)) * 100);
    proteinPercent.textContent = `(${pPct}%)`;
    proteinProgressBar.style.width = `${Math.min(pPct, 100)}%`;

    carbsConsumed.textContent = totalC;
    carbsGoal.textContent = settings.carbsGoal;
    const cPct = Math.round((totalC / (settings.carbsGoal || 1)) * 100);
    carbsPercent.textContent = `(${cPct}%)`;
    carbsProgressBar.style.width = `${Math.min(cPct, 100)}%`;

    fatConsumed.textContent = totalF;
    fatGoal.textContent = settings.fatGoal;
    const fPct = Math.round((totalF / (settings.fatGoal || 1)) * 100);
    fatPercent.textContent = `(${fPct}%)`;
    fatProgressBar.style.width = `${Math.min(fPct, 100)}%`;

    // Macro Ratio Calculation (Calories: P=4, C=4, F=9)
    const pCals = totalP * 4;
    const cCals = totalC * 4;
    const fCals = totalF * 9;
    const macroTotalCals = pCals + cCals + fCals;

    if (macroTotalCals > 0) {
      ratioProtein.style.width = `${(pCals / macroTotalCals) * 100}%`;
      ratioCarbs.style.width = `${(cCals / macroTotalCals) * 100}%`;
      ratioFat.style.width = `${(fCals / macroTotalCals) * 100}%`;
    } else {
      ratioProtein.style.width = '33.33%';
      ratioCarbs.style.width = '33.33%';
      ratioFat.style.width = '33.34%';
    }
  }

  // --- Meal Cards Rendering ---
  function renderMeals() {
    const items = getSelectedDayItems();

    // Group items by category
    const grouped = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: []
    };

    items.forEach(function (item) {
      const meal = item.meal || 'snacks';
      if (grouped[meal]) {
        grouped[meal].push(item);
      } else {
        grouped.snacks.push(item);
      }
    });

    mealCategories.forEach(function (category) {
      const catItems = grouped[category];
      const elements = mealElements[category];

      // Calculate total calories for category
      let catCals = 0;
      catItems.forEach(function (i) {
        catCals += Number(i.calories) || 0;
      });
      elements.totalCal.textContent = catCals.toLocaleString();

      // Render Items List
      elements.list.innerHTML = '';

      if (catItems.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-meal-placeholder';
        emptyDiv.textContent = 'No foods logged for this meal yet.';
        elements.list.appendChild(emptyDiv);
      } else {
        catItems.forEach(function (item) {
          const row = document.createElement('div');
          row.className = 'food-item-row';

          // Macros snippet string
          const macroParts = [];
          if (item.protein > 0) macroParts.push(`${item.protein}g P`);
          if (item.carbs > 0) macroParts.push(`${item.carbs}g C`);
          if (item.fat > 0) macroParts.push(`${item.fat}g F`);
          const macroText = macroParts.length > 0 ? ` • ${macroParts.join(', ')}` : '';

          row.innerHTML = `
            <div class="food-item-info">
              <span class="food-item-name">${escapeHTML(item.name)}</span>
              <div class="food-item-meta">
                <span class="meta-serving">${escapeHTML(item.serving || '1 portion')}</span>
                <span class="meta-macros">${macroText}</span>
              </div>
            </div>
            <div class="food-item-right">
              <span class="food-item-cals">${Number(item.calories).toLocaleString()} kcal</span>
              <div class="item-actions">
                <button class="action-icon-btn edit-item-btn" title="Edit food entry" data-id="${item.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="action-icon-btn delete-action-btn" title="Delete entry" data-id="${item.id}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          `;

          // Edit Handler
          row.querySelector('.edit-item-btn').addEventListener('click', function () {
            openEditModal(item);
          });

          // Delete Handler
          row.querySelector('.delete-action-btn').addEventListener('click', function () {
            deleteFoodItem(item.id, item.name);
          });

          elements.list.appendChild(row);
        });
      }
    });
  }

  // --- 7-Day Activity Chart ---
  function renderWeeklyChart() {
    weeklyChartContainer.innerHTML = '';

    const parts = selectedDate.split('-');
    const currentSelected = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

    // Calculate dates for past 6 days up to selected date
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentSelected);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      days.push({
        dateStr: dateStr,
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        dateLabel: `${d.getMonth() + 1}/${d.getDate()}`
      });
    }

    const goal = appState.settings.dailyCalorieGoal || 2000;
    const maxCalReference = Math.max(goal * 1.25, 2500);

    days.forEach(function (dayInfo) {
      const dayItems = appState.logs[dayInfo.dateStr] || [];
      let cals = 0;
      dayItems.forEach(function (item) {
        cals += Number(item.calories) || 0;
      });

      const heightPct = Math.min((cals / maxCalReference) * 100, 100);
      const isOver = cals > goal;
      const isCurrentSelected = dayInfo.dateStr === selectedDate;

      const col = document.createElement('div');
      col.className = `chart-day-col ${isCurrentSelected ? 'active-day' : ''}`;
      col.title = `${dayInfo.dateStr}: ${cals} kcal`;

      col.innerHTML = `
        <span class="chart-cals-label">${cals > 0 ? (cals >= 1000 ? (cals / 1000).toFixed(1) + 'k' : cals) : '0'}</span>
        <div class="chart-bar-slot">
          <div class="chart-bar-fill ${isOver ? 'bar-over' : ''}" style="height: ${heightPct}%;"></div>
        </div>
        <span class="chart-day-label">${dayInfo.dayName}</span>
      `;

      col.addEventListener('click', function () {
        selectedDate = dayInfo.dateStr;
        updateDateDisplay();
        renderAll();
      });

      weeklyChartContainer.appendChild(col);
    });
  }

  // --- Food Item CRUD ---
  function openAddModal(mealCategory) {
    editItemId.value = '';
    foodModalTitle.textContent = 'Log Food Item';
    foodForm.reset();

    if (mealCategory && mealCategories.includes(mealCategory)) {
      foodMealSelect.value = mealCategory;
    } else {
      foodMealSelect.value = 'lunch';
    }

    openModal(foodModal);
    setTimeout(function () {
      foodNameInput.focus();
    }, 50);
  }

  function openEditModal(item) {
    editItemId.value = item.id;
    foodModalTitle.textContent = 'Edit Food Item';

    foodMealSelect.value = item.meal || 'lunch';
    foodNameInput.value = item.name || '';
    foodServingInput.value = item.serving || '';
    foodCaloriesInput.value = item.calories || '';
    foodProteinInput.value = item.protein || '';
    foodCarbsInput.value = item.carbs || '';
    foodFatInput.value = item.fat || '';

    openModal(foodModal);
    foodNameInput.focus();
  }

  function handleFoodFormSubmit(e) {
    e.preventDefault();

    const name = foodNameInput.value.trim();
    const cals = parseInt(foodCaloriesInput.value, 10);

    if (!name || isNaN(cals) || cals < 0) {
      showToast('Please provide a valid food name and calorie amount.');
      return;
    }

    const itemData = {
      meal: foodMealSelect.value,
      name: name,
      serving: foodServingInput.value.trim() || '1 serving',
      calories: cals,
      protein: parseFloat(foodProteinInput.value) || 0,
      carbs: parseFloat(foodCarbsInput.value) || 0,
      fat: parseFloat(foodFatInput.value) || 0
    };

    if (!appState.logs[selectedDate]) {
      appState.logs[selectedDate] = [];
    }

    const currentId = editItemId.value;
    if (currentId) {
      // Update existing item
      const index = appState.logs[selectedDate].findIndex(function (i) {
        return i.id === currentId;
      });
      if (index !== -1) {
        appState.logs[selectedDate][index] = Object.assign({}, appState.logs[selectedDate][index], itemData);
        showToast(`Updated "${name}"`);
      }
    } else {
      // Add new item
      itemData.id = 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      itemData.timestamp = Date.now();
      appState.logs[selectedDate].push(itemData);
      showToast(`Logged "${name}" (${cals} kcal)`);
    }

    saveData();
    closeModal(foodModal);
    renderAll();
  }

  function deleteFoodItem(id, name) {
    if (!appState.logs[selectedDate]) return;

    appState.logs[selectedDate] = appState.logs[selectedDate].filter(function (item) {
      return item.id !== id;
    });

    saveData();
    renderAll();
    showToast(`Removed "${name || 'food item'}"`);
  }

  // --- Presets Modal Logic ---
  function renderPresets() {
    presetsList.innerHTML = '';

    PRESET_FOODS.forEach(function (preset) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-card-btn';
      btn.innerHTML = `
        <div class="preset-info">
          <span class="preset-title">${escapeHTML(preset.name)}</span>
          <span class="preset-serving">${escapeHTML(preset.serving)} • ${preset.protein}g P</span>
        </div>
        <span class="preset-cals-badge">${preset.calories} kcal</span>
      `;

      btn.addEventListener('click', function () {
        const targetMeal = presetTargetMealSelect.value || 'snacks';
        if (!appState.logs[selectedDate]) {
          appState.logs[selectedDate] = [];
        }

        const newItem = {
          id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          meal: targetMeal,
          name: preset.name,
          serving: preset.serving,
          calories: preset.calories,
          protein: preset.protein,
          carbs: preset.carbs,
          fat: preset.fat,
          timestamp: Date.now()
        };

        appState.logs[selectedDate].push(newItem);
        saveData();
        renderAll();
        showToast(`Added ${preset.name} to ${capitalize(targetMeal)}`);
      });

      presetsList.appendChild(btn);
    });
  }

  // --- Settings & TDEE Logic ---
  function openSettingsModal(defaultTab) {
    settingCalorieGoal.value = appState.settings.dailyCalorieGoal || 2000;
    settingProteinGoal.value = appState.settings.proteinGoal || 140;
    settingCarbsGoal.value = appState.settings.carbsGoal || 220;
    settingFatGoal.value = appState.settings.fatGoal || 65;

    if (defaultTab) {
      switchSettingsTab(defaultTab);
    }

    openModal(settingsModal);
  }

  function switchSettingsTab(tabName) {
    const tabs = settingsModal.querySelectorAll('.modal-tab');
    const panes = settingsModal.querySelectorAll('.tab-pane');

    tabs.forEach(function (tab) {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    panes.forEach(function (pane) {
      pane.classList.remove('active');
    });

    const activePane = document.getElementById(
      tabName === 'targets' ? 'tabTargets' : (tabName === 'calculator' ? 'tabCalculator' : 'tabData')
    );
    if (activePane) {
      activePane.classList.add('active');
    }
  }

  function handleSaveTargets(e) {
    e.preventDefault();

    const cals = parseInt(settingCalorieGoal.value, 10);
    const p = parseInt(settingProteinGoal.value, 10);
    const c = parseInt(settingCarbsGoal.value, 10);
    const f = parseInt(settingFatGoal.value, 10);

    if (cals < 500) {
      showToast('Calorie goal must be at least 500 kcal.');
      return;
    }

    appState.settings.dailyCalorieGoal = cals;
    appState.settings.proteinGoal = p;
    appState.settings.carbsGoal = c;
    appState.settings.fatGoal = f;

    saveData();
    renderAll();
    closeModal(settingsModal);
    showToast('Daily goals updated!');
  }

  // TDEE Calculator Formula (Mifflin-St Jeor)
  function computeTDEE() {
    const gender = calcGender.value;
    const age = parseFloat(calcAge.value) || 28;
    const weightKg = parseFloat(calcWeight.value) || 70;
    const heightCm = parseFloat(calcHeight.value) || 175;
    const activityMult = parseFloat(calcActivity.value) || 1.375;
    const goalDelta = parseFloat(calcGoal.value) || 0;

    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    if (gender === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    const tdee = Math.round((bmr * activityMult) + goalDelta);
    const targetCalories = Math.max(tdee, 1200);

    // Recommended Macro Split:
    // Protein: ~2.0g per kg of bodyweight
    const recommendedProtein = Math.round(weightKg * 2.0);
    // Fat: 25% of total calories (9 cals per g)
    const recommendedFat = Math.round((targetCalories * 0.25) / 9);
    // Carbs: Remainder of calories (4 cals per g)
    const remainingCals = targetCalories - (recommendedProtein * 4) - (recommendedFat * 9);
    const recommendedCarbs = Math.max(Math.round(remainingCals / 4), 50);

    calcSuggestedCalories.textContent = targetCalories.toLocaleString();
    calcSuggestedP.textContent = recommendedProtein;
    calcSuggestedC.textContent = recommendedCarbs;
    calcSuggestedF.textContent = recommendedFat;

    calcResultBox.style.display = 'flex';

    // Store calculated values on the button dataset
    applyCalcBtn.dataset.cals = targetCalories;
    applyCalcBtn.dataset.p = recommendedProtein;
    applyCalcBtn.dataset.c = recommendedCarbs;
    applyCalcBtn.dataset.f = recommendedFat;
  }

  function applyCalculatedTargets() {
    const cals = parseInt(applyCalcBtn.dataset.cals, 10);
    const p = parseInt(applyCalcBtn.dataset.p, 10);
    const c = parseInt(applyCalcBtn.dataset.c, 10);
    const f = parseInt(applyCalcBtn.dataset.f, 10);

    if (cals) {
      settingCalorieGoal.value = cals;
      settingProteinGoal.value = p;
      settingCarbsGoal.value = c;
      settingFatGoal.value = f;

      appState.settings.dailyCalorieGoal = cals;
      appState.settings.proteinGoal = p;
      appState.settings.carbsGoal = c;
      appState.settings.fatGoal = f;

      saveData();
      renderAll();
      closeModal(settingsModal);
      showToast(`Applied ${cals} kcal goal!`);
    }
  }

  // --- Data Backup & Restore ---
  function exportData() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `calotrack_backup_${getTodayString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup downloaded successfully!');
  }

  function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported && imported.settings && imported.logs) {
          appState = imported;
          saveData();
          renderAll();
          closeModal(settingsModal);
          showToast('Data restored successfully!');
        } else {
          showToast('Invalid backup file format.');
        }
      } catch (err) {
        showToast('Error parsing JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }

  function clearTodayLogs() {
    if (confirm(`Clear all logged food items for ${selectedDate}?`)) {
      appState.logs[selectedDate] = [];
      saveData();
      renderAll();
      showToast(`Cleared entries for ${selectedDate}`);
    }
  }

  function resetAllData() {
    if (confirm('Are you sure you want to delete ALL data and history? This action cannot be undone.')) {
      appState = {
        settings: {
          dailyCalorieGoal: 2000,
          proteinGoal: 140,
          carbsGoal: 220,
          fatGoal: 65
        },
        logs: {}
      };
      saveData();
      renderAll();
      closeModal(settingsModal);
      showToast('All data has been reset.');
    }
  }

  // --- Modal Utilities ---
  function openModal(modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function setupModalBackdrop(modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  }

  // --- Toast Notification ---
  let toastTimer = null;
  function showToast(message) {
    toastNotification.textContent = message;
    toastNotification.classList.add('active');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastNotification.classList.remove('active');
    }, 3200);
  }

  // --- Utility Functions ---
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // --- Event Listeners Initialization ---
  function initEventListeners() {
    // Date Pickers
    datePickerInput.addEventListener('change', function (e) {
      if (e.target.value) {
        selectedDate = e.target.value;
        updateDateDisplay();
        renderAll();
      }
    });

    prevDateBtn.addEventListener('click', function () {
      changeDateByOffset(-1);
    });

    nextDateBtn.addEventListener('click', function () {
      changeDateByOffset(1);
    });

    todayBtn.addEventListener('click', function () {
      selectedDate = getTodayString();
      updateDateDisplay();
      renderAll();
    });

    // Global Add Button & Card Add Buttons
    openAddModalGlobalBtn.addEventListener('click', function () {
      openAddModal('lunch');
    });

    document.querySelectorAll('.add-meal-item-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const meal = btn.getAttribute('data-meal');
        openAddModal(meal);
      });
    });

    // Food Modal Form
    foodForm.addEventListener('submit', handleFoodFormSubmit);
    closeFoodModalBtn.addEventListener('click', function () { closeModal(foodModal); });
    cancelFoodModalBtn.addEventListener('click', function () { closeModal(foodModal); });
    setupModalBackdrop(foodModal);

    // Presets Modal
    quickPresetBtn.addEventListener('click', function () {
      renderPresets();
      openModal(presetsModal);
    });
    closePresetsModalBtn.addEventListener('click', function () { closeModal(presetsModal); });
    closePresetsBtn.addEventListener('click', function () { closeModal(presetsModal); });
    setupModalBackdrop(presetsModal);

    // Settings Modal
    settingsBtn.addEventListener('click', function () {
      openSettingsModal('targets');
    });
    quickEditGoalBtn.addEventListener('click', function () {
      openSettingsModal('targets');
    });
    closeSettingsModalBtn.addEventListener('click', function () { closeModal(settingsModal); });
    cancelSettingsBtn.addEventListener('click', function () { closeModal(settingsModal); });
    targetsForm.addEventListener('submit', handleSaveTargets);
    setupModalBackdrop(settingsModal);

    // Settings Tabs
    document.querySelectorAll('.modal-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchSettingsTab(tab.getAttribute('data-tab'));
      });
    });

    // TDEE Calculator
    computeTdeeBtn.addEventListener('click', computeTDEE);
    applyCalcBtn.addEventListener('click', applyCalculatedTargets);

    // Data Management
    exportDataBtn.addEventListener('click', exportData);
    importFileInput.addEventListener('change', handleImportFile);
    clearTodayBtn.addEventListener('click', clearTodayLogs);
    resetAllDataBtn.addEventListener('click', resetAllData);

    // Keyboard ESC to close active modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal(foodModal);
        closeModal(presetsModal);
        closeModal(settingsModal);
      }
    });
  }

  // --- Application Bootstrap ---
  function init() {
    loadData();
    updateDateDisplay();
    renderAll();
    initEventListeners();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
