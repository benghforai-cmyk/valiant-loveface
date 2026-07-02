import './style.css';
import { TodoService } from './todoService.js';

// Initialize state
const todoService = new TodoService();

// Current active todo being edited in the modal
let currentEditingTodoId = null;

// Selectors
const themeToggle = document.getElementById('theme-toggle');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFileInput = document.getElementById('import-file-input');
const searchInput = document.getElementById('search-input');

// Filter Selectors
const filterStatus = document.getElementById('filter-status');
const filterPriority = document.getElementById('filter-priority');
const filterCategory = document.getElementById('filter-category');
const sortBy = document.getElementById('sort-by');

// Add Task Form Selectors
const addTaskForm = document.getElementById('add-task-form');
const taskTitleInput = document.getElementById('task-title-input');
const taskCategorySelect = document.getElementById('task-category-select');
const taskPrioritySelect = document.getElementById('task-priority-select');
const taskDueDateInput = document.getElementById('task-duedate-input');
const taskDescriptionInput = document.getElementById('task-description-input');

// Category Manager
const categoriesList = document.getElementById('categories-list');
const newCategoryForm = document.getElementById('new-category-form');
const newCatName = document.getElementById('new-cat-name');
const newCatColor = document.getElementById('new-cat-color');

// Board Display
const todoCardsList = document.getElementById('todo-cards-list');
const emptyState = document.getElementById('empty-state');
const tasksCountBadge = document.getElementById('tasks-count-badge');

// Stats Widgets
const completionPercentage = document.getElementById('completion-percentage');
const progressRingFill = document.getElementById('progress-ring-fill');
const statActive = document.getElementById('stat-active');
const statCompleted = document.getElementById('stat-completed');
const statOverdue = document.getElementById('stat-overdue');

// Modal Dialog Selectors
const detailModal = document.getElementById('task-detail-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalSaveBtn = document.getElementById('modal-save-btn');
const modalDeleteBtn = document.getElementById('modal-delete-btn');
const modalCategoryBadge = document.getElementById('modal-category-badge');
const modalTitleInput = document.getElementById('modal-title-input');
const modalPrioritySelect = document.getElementById('modal-priority-select');
const modalCategorySelect = document.getElementById('modal-category-select');
const modalDueDateInput = document.getElementById('modal-duedate-input');
const modalDescriptionInput = document.getElementById('modal-description-input');
const modalSubtasksList = document.getElementById('modal-subtasks-list');
const modalNewSubtaskForm = document.getElementById('modal-new-subtask-form');
const modalNewSubtaskTitle = document.getElementById('modal-new-subtask-title');
const modalSubtaskProgress = document.getElementById('modal-subtask-progress');

/* ==========================================
   INITIALIZATION
   ========================================== */

function initApp() {
  setupTheme();
  setupEventListeners();
  renderApp();
}

/* ==========================================
   THEME SETUP
   ========================================== */

function setupTheme() {
  const savedTheme = localStorage.getItem('valiant_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('valiant_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const themeIcon = themeToggle.querySelector('.theme-icon');
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

/* ==========================================
   EVENT LISTENERS
   ========================================== */

function setupEventListeners() {
  // Theme & Import/Export
  themeToggle.addEventListener('click', toggleTheme);
  exportBtn.addEventListener('click', exportBoard);
  importBtn.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', importBoard);

  // Real-time Search
  searchInput.addEventListener('input', (e) => {
    todoService.setFilter('searchQuery', e.target.value);
    scheduleRender();
  });

  // Filters & Sorting changes
  filterStatus.addEventListener('change', (e) => {
    todoService.setFilter('status', e.target.value);
    scheduleRender();
  });
  filterPriority.addEventListener('change', (e) => {
    todoService.setFilter('priority', e.target.value);
    scheduleRender();
  });
  filterCategory.addEventListener('change', (e) => {
    todoService.setFilter('category', e.target.value);
    scheduleRender();
  });
  sortBy.addEventListener('change', (e) => {
    todoService.setFilter('sortBy', e.target.value);
    scheduleRender();
  });

  // Expandable Add Task Form Focus Actions
  addTaskForm.addEventListener('focusin', () => {
    addTaskForm.classList.add('expanded');
  });

  // Collapse if click is outside form and form is empty
  document.addEventListener('click', (e) => {
    if (!addTaskForm.contains(e.target)) {
      const titleEmpty = !taskTitleInput.value || taskTitleInput.value.trim() === '';
      const descEmpty = !taskDescriptionInput.value || taskDescriptionInput.value.trim() === '';
      if (titleEmpty && descEmpty) {
        addTaskForm.classList.remove('expanded');
      }
    }
  });

  // Add Task Submission
  addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskTitleInput.value;
    const category = taskCategorySelect.value;
    const priority = taskPrioritySelect.value;
    const dueDate = taskDueDateInput.value;
    const description = taskDescriptionInput.value;

    const newTodo = todoService.addTodo({
      title,
      description,
      category,
      priority,
      dueDate
    });

    if (newTodo) {
      // Reset inputs
      taskTitleInput.value = '';
      taskDescriptionInput.value = '';
      taskDueDateInput.value = '';
      addTaskForm.classList.remove('expanded');
      scheduleRender();
    }
  });

  // Add New Category Submission
  newCategoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = newCatName.value;
    const color = newCatColor.value;

    const newCat = todoService.addCategory(name, color);
    if (newCat) {
      newCatName.value = '';
      renderCategories();
      renderApp(); // Rerender to show new filtering options
    } else {
      alert('Ce nom de catégorie existe déjà.');
    }
  });

  /* Modal Close & Save Listeners */
  modalCloseBtn.addEventListener('click', () => detailModal.close());
  modalSaveBtn.addEventListener('click', saveModalData);
  modalDeleteBtn.addEventListener('click', deleteModalTodo);

  // Dialog Backdrop Close Fallback for Safari (which does not support closedby="any")
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    detailModal.addEventListener('click', (event) => {
      if (event.target !== detailModal) return;
      const rect = detailModal.getBoundingClientRect();
      const isInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isInside) {
        detailModal.close();
      }
    });
  }

  // Create Subtask from Modal
  modalNewSubtaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentEditingTodoId) return;

    const title = modalNewSubtaskTitle.value;
    const subtask = todoService.addSubtask(currentEditingTodoId, title);

    if (subtask) {
      modalNewSubtaskTitle.value = '';
      renderModalSubtasks();
      scheduleRender(); // Updates list counts & stats
    }
  });
}

/* ==========================================
   RENDERING
   ========================================== */

// Helper to batch rendering using View Transitions if available
function scheduleRender() {
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      renderApp();
    });
  } else {
    renderApp();
  }
}

function renderApp() {
  renderStats();
  renderCategories();
  renderTodos();
}

/**
 * Renders the circular progress ring and numerical stats widgets.
 */
function renderStats() {
  const stats = todoService.getStats();

  // Draw circular svg progress
  completionPercentage.textContent = `${stats.completionRate}%`;
  
  // Calculate SVG dashoffset (radius=40, circumference ~ 251.2)
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (stats.completionRate / 100) * circumference;
  progressRingFill.style.strokeDashoffset = offset;

  // Numerical elements
  statActive.textContent = stats.active;
  statCompleted.textContent = stats.completed;
  statOverdue.textContent = stats.overdue;
}

/**
 * Dynamic Categories dropdown selectors & list items update.
 */
function renderCategories() {
  const cats = todoService.categories;

  // 1. Sidebar Category customization list
  categoriesList.innerHTML = cats.map(cat => {
    // Il faut conserver au moins une catégorie
    const canDelete = cats.length > 1;
    return `
      <li class="category-item">
        <div class="category-meta">
          <span class="color-dot" style="background-color: ${cat.color}"></span>
          <span class="category-name">${escapeHtml(cat.name)}</span>
        </div>
        ${canDelete ? `
          <button class="btn-delete-cat" data-id="${cat.id}" title="Supprimer la catégorie" aria-label="Supprimer la catégorie ${cat.name}">
            ❌
          </button>
        ` : ''}
      </li>
    `;
  }).join('');

  // Setup category list delete triggers
  categoriesList.querySelectorAll('.btn-delete-cat').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (confirm('Supprimer cette catégorie ? Les tâches associées seront réassignées à une autre catégorie active.')) {
        todoService.deleteCategory(id);
        renderCategories();
        scheduleRender();
      }
    });
  });

  // 2. Populate Dropdowns (Filtering & Forms)
  const savedCatFilterVal = filterCategory.value;
  const savedFormCatVal = taskCategorySelect.value;
  const savedModalCatVal = modalCategorySelect.value;

  // Fill board category filter
  filterCategory.innerHTML = `
    <option value="all">Toutes les catégories</option>
    ${cats.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('')}
  `;
  filterCategory.value = savedCatFilterVal || 'all';
  if (!filterCategory.value) filterCategory.value = 'all';

  // Fill creation form category selector
  taskCategorySelect.innerHTML = cats.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('');
  taskCategorySelect.value = savedFormCatVal || 'cat-personal';

  // Fill modal editing category selector
  modalCategorySelect.innerHTML = cats.map(cat => `<option value="${cat.id}">${escapeHtml(cat.name)}</option>`).join('');
  modalCategorySelect.value = savedModalCatVal || 'cat-personal';
}

/**
 * Builds the HTML grid/list for active tasks.
 */
function renderTodos() {
  const filteredTodos = todoService.getFilteredTodos();
  tasksCountBadge.textContent = filteredTodos.length;

  if (filteredTodos.length === 0) {
    todoCardsList.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  const todayStr = new Date().toISOString().split('T')[0];

  todoCardsList.innerHTML = filteredTodos.map(todo => {
    const catName = todoService.getCategoryName(todo.category);
    const catColor = todoService.getCategoryColor(todo.category);
    
    // Subtask count and percentage calculations
    const subtasks = todo.subtasks || [];
    const totalSub = subtasks.length;
    const completedSub = subtasks.filter(s => s.completed).length;
    const progressPercent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

    // Due Date alert logic
    let dateHtml = '';
    if (todo.dueDate) {
      const isOverdue = !todo.completed && todo.dueDate < todayStr;
      const formattedDate = formatDateString(todo.dueDate);
      dateHtml = `
        <span class="date-badge ${isOverdue ? 'overdue' : ''}">
          📅 ${isOverdue ? 'En retard : ' : ''}${formattedDate}
        </span>
      `;
    }

    return `
      <article class="glass-card todo-card ${todo.completed ? 'completed' : ''}" 
               data-id="${todo.id}" 
               style="border-left-color: ${catColor}; view-transition-name: card-${todo.id}"
               role="listitem">
        
        <div class="card-checkbox-wrapper">
          <div class="custom-checkbox ${todo.completed ? 'checked' : ''}" 
               data-id="${todo.id}" 
               role="checkbox" 
               aria-checked="${todo.completed}" 
               tabindex="0"
               aria-label="Toggle task status">
            <span class="checkbox-check"></span>
          </div>
        </div>

        <div class="card-content">
          <div class="card-title-row">
            <h3 class="card-title">${escapeHtml(todo.title)}</h3>
            <div class="card-actions">
              <button class="btn-card-action edit" data-id="${todo.id}" aria-label="Edit details">✏️</button>
              <button class="btn-card-action delete" data-id="${todo.id}" aria-label="Delete task">🗑️</button>
            </div>
          </div>
          
          ${todo.description ? `<p class="card-description">${escapeHtml(todo.description)}</p>` : ''}
          
          <div class="card-badges">
            <span class="category-badge" style="background-color: ${catColor}">${escapeHtml(catName)}</span>
            <span class="priority-badge ${todo.priority}">${todo.priority}</span>
            ${dateHtml}
          </div>

          ${totalSub > 0 ? `
            <div class="card-subtask-summary">
              <span>📋 ${completedSub}/${totalSub} sous-tâches</span>
              <div class="mini-progress-bar" title="${progressPercent}% Completed">
                <div class="mini-progress-fill" style="width: ${progressPercent}%"></div>
              </div>
            </div>
          ` : ''}
        </div>

      </article>
    `;
  }).join('');

  setupTodoCardListeners();
}

/**
 * Attaches clicking behaviors to dynamically generated todo cards.
 */
function setupTodoCardListeners() {
  const cards = todoCardsList.querySelectorAll('.todo-card');

  cards.forEach(card => {
    const todoId = card.getAttribute('data-id');

    // 1. Open Detailed Edit Modal on card body click
    card.addEventListener('click', (e) => {
      // Do not trigger modal if clicking interactive components
      if (
        e.target.closest('.custom-checkbox') || 
        e.target.closest('.btn-card-action')
      ) {
        return;
      }
      openDetailModal(todoId);
    });

    // 2. Click Checkbox to Complete/Active toggle
    const checkbox = card.querySelector('.custom-checkbox');
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleTodoStatus(todoId);
    });
    
    // Accessibility: Toggle via keyboard space/enter
    checkbox.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleTodoStatus(todoId);
      }
    });

    // 3. Toolbar: Quick Edit Icon click
    card.querySelector('.btn-card-action.edit').addEventListener('click', (e) => {
      e.stopPropagation();
      openDetailModal(todoId);
    });

    // 4. Toolbar: Quick Delete Icon click
    card.querySelector('.btn-card-action.delete').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
        todoService.deleteTodo(todoId);
        scheduleRender();
      }
    });
  });
}

function toggleTodoStatus(todoId) {
  todoService.toggleTodo(todoId);
  scheduleRender();
}

/* ==========================================
   DETAIL MODAL CONTROLLER
   ========================================== */

function openDetailModal(todoId) {
  const todo = todoService.todos.find(t => t.id === todoId);
  if (!todo) return;

  currentEditingTodoId = todoId;

  // Set header details
  const catColor = todoService.getCategoryColor(todo.category);
  const catName = todoService.getCategoryName(todo.category);
  modalCategoryBadge.textContent = catName;
  modalCategoryBadge.style.backgroundColor = catColor;

  modalTitleInput.value = todo.title;
  modalPrioritySelect.value = todo.priority;
  modalCategorySelect.value = todo.category;
  modalDueDateInput.value = todo.dueDate || '';
  modalDescriptionInput.value = todo.description || '';

  // Setup sub-tasks list
  renderModalSubtasks();

  // Trigger modal display
  detailModal.showModal();
}

function renderModalSubtasks() {
  const todo = todoService.todos.find(t => t.id === currentEditingTodoId);
  if (!todo) return;

  const subtasks = todo.subtasks || [];
  const totalSub = subtasks.length;
  const completedSub = subtasks.filter(s => s.completed).length;
  const progressPercent = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

  // Update progress bar
  modalSubtaskProgress.style.width = `${progressPercent}%`;

  if (totalSub === 0) {
    modalSubtasksList.innerHTML = '<li class="subtask-item text-muted">Aucune sous-tâche pour le moment.</li>';
    return;
  }

  modalSubtasksList.innerHTML = subtasks.map(sub => {
    return `
      <li class="subtask-item ${sub.completed ? 'completed' : ''}">
        <input type="checkbox" id="${sub.id}" ${sub.completed ? 'checked' : ''} data-id="${sub.id}" aria-label="Toggle subtask" />
        <span class="subtask-title">${escapeHtml(sub.title)}</span>
        <button type="button" class="btn-delete-subtask" data-id="${sub.id}" title="Delete subtask" aria-label="Delete subtask">
          🗑️
        </button>
      </li>
    `;
  }).join('');

  // Listeners for checking subtasks
  modalSubtasksList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const subId = checkbox.getAttribute('data-id');
      todoService.toggleSubtask(currentEditingTodoId, subId);
      renderModalSubtasks();
      scheduleRender(); // Updates list count check status
    });
  });

  // Listeners for deleting subtasks
  modalSubtasksList.querySelectorAll('.btn-delete-subtask').forEach(btn => {
    btn.addEventListener('click', () => {
      const subId = btn.getAttribute('data-id');
      todoService.deleteSubtask(currentEditingTodoId, subId);
      renderModalSubtasks();
      scheduleRender();
    });
  });
}

function saveModalData() {
  if (!currentEditingTodoId) return;

  const title = modalTitleInput.value;
  const priority = modalPrioritySelect.value;
  const category = modalCategorySelect.value;
  const dueDate = modalDueDateInput.value;
  const description = modalDescriptionInput.value;

  if (!title || title.trim() === '') {
    alert('Veuillez entrer un titre de tâche valide.');
    return;
  }

  todoService.updateTodo(currentEditingTodoId, {
    title: title.trim(),
    priority,
    category,
    dueDate,
    description: description.trim()
  });

  detailModal.close();
  scheduleRender();
}

function deleteModalTodo() {
  if (!currentEditingTodoId) return;

  if (confirm('Supprimer cette tâche ?')) {
    todoService.deleteTodo(currentEditingTodoId);
    detailModal.close();
    scheduleRender();
  }
}

/* ==========================================
   IMPORT / EXPORT UTILITIES
   ========================================== */

function exportBoard() {
  const jsonStr = todoService.exportAsJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `valiant-tasks-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importBoard(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const content = evt.target.result;
    const result = todoService.importFromJSON(content);
    if (result.success) {
      alert(`Succès ! ${result.count} tâches importées.`);
      // Reset filtering state
      todoService.setFilter('status', 'all');
      todoService.setFilter('category', 'all');
      todoService.setFilter('priority', 'all');
      todoService.setFilter('searchQuery', '');
      
      // Update form filters UI select tags
      filterStatus.value = 'all';
      filterCategory.value = 'all';
      filterPriority.value = 'all';
      searchInput.value = '';

      scheduleRender();
    } else {
      alert(`Échec de l'importation : ${result.error}`);
    }
  };
  reader.readAsText(file);
  // Clear file input value to allow importing the same file again
  importFileInput.value = '';
}

/* ==========================================
   UTILITY HELPERS
   ========================================== */

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateString(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Start application
initApp();
