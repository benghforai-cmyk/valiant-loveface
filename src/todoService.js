/**
 * TodoService manages the state and business logic of the To-Do list application.
 * Persists data to localStorage and provides analytical data.
 */
export class TodoService {
  constructor() {
    this.todos = [];
    this.categories = [];
    
    // Filters & Sorting state (in-memory)
    this.filters = {
      status: 'all', // 'all', 'active', 'completed'
      category: 'all', // 'all' or category ID
      priority: 'all', // 'all', 'low', 'medium', 'high'
      searchQuery: '',
      sortBy: 'dueDate-asc' // 'dueDate-asc', 'dueDate-desc', 'priority-desc', 'createdAt-desc'
    };

    this.init();
  }

  /**
   * Initializes the service by loading from localStorage or creating default data.
   */
  init() {
    try {
      const savedTodos = localStorage.getItem('valiant_todos');
      const savedCategories = localStorage.getItem('valiant_categories');

      if (savedCategories) {
        this.categories = JSON.parse(savedCategories);
      } else {
        // Set default rich-palette categories
        this.categories = [
          { id: 'cat-work', name: 'Travail', color: '#6c5ce7' },       // Violet Premium
          { id: 'cat-personal', name: 'Personnel', color: '#ff7675' },   // Corail
          { id: 'cat-shopping', name: 'Courses', color: '#00b894' },   // Menthe
          { id: 'cat-ideas', name: 'Idées', color: '#fdcb6e' }          // Jaune chaleureux
        ];
        this.saveCategories();
      }

      if (savedTodos) {
        this.todos = JSON.parse(savedTodos);
      } else {
        // Create initial default tasks to showcase the premium UI
        this.todos = [
          {
            id: 'todo-1',
            title: 'Bienvenue sur votre Valiant Board ! ✨',
            description: 'Explorez l\'interface en verre dépoli, les catégories et les badges de priorité. Double-cliquez sur cette tâche ou cliquez sur modifier pour gérer ses sous-tâches.',
            category: 'cat-ideas',
            priority: 'medium',
            dueDate: this.getRelativeDateStr(1),
            completed: false,
            createdAt: new Date().toISOString(),
            subtasks: [
              { id: 'sub-1', title: 'Ajouter une nouvelle tâche via le formulaire ci-dessus', completed: false },
              { id: 'sub-2', title: 'Activer/Désactiver le thème Sombre/Clair 🌓', completed: true },
              { id: 'sub-3', title: 'Tester l\'exportation de vos tâches en JSON', completed: false }
            ]
          },
          {
            id: 'todo-2',
            title: 'Revoir les livrables du projet trimestriel',
            description: 'S\'aligner sur la charte graphique et mettre à jour la structure du code du dépôt.',
            category: 'cat-work',
            priority: 'high',
            dueDate: this.getRelativeDateStr(0), // Aujourd'hui
            completed: false,
            createdAt: new Date().toISOString(),
            subtasks: []
          },
          {
            id: 'todo-3',
            title: 'Acheter des courses',
            description: 'Prendre des avocats, du lait d\'amande bio, des épinards et des pâtes fraîches.',
            category: 'cat-shopping',
            priority: 'low',
            dueDate: this.getRelativeDateStr(2),
            completed: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            subtasks: []
          }
        ];
        this.saveTodos();
      }
    } catch (e) {
      console.error('Error loading data from localStorage, resetting...', e);
      this.todos = [];
      this.categories = [];
    }
  }

  // Helper to generate ISO date strings relative to today
  getRelativeDateStr(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  }

  /* --- Persistence --- */

  saveTodos() {
    localStorage.setItem('valiant_todos', JSON.stringify(this.todos));
  }

  saveCategories() {
    localStorage.setItem('valiant_categories', JSON.stringify(this.categories));
  }

  /* --- Todo CRUD Operations --- */

  addTodo({ title, description, category, priority, dueDate }) {
    if (!title || title.trim() === '') return null;

    const newTodo = {
      id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      description: (description || '').trim(),
      category: category || (this.categories[0] ? this.categories[0].id : 'cat-personal'),
      priority: priority || 'medium',
      dueDate: dueDate || '',
      completed: false,
      createdAt: new Date().toISOString(),
      subtasks: []
    };

    this.todos.unshift(newTodo);
    this.saveTodos();
    return newTodo;
  }

  updateTodo(id, updatedFields) {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) return null;

    const currentTodo = this.todos[index];
    this.todos[index] = {
      ...currentTodo,
      ...updatedFields,
      // Keep immutable fields
      id: currentTodo.id,
      createdAt: currentTodo.createdAt,
      subtasks: updatedFields.subtasks || currentTodo.subtasks
    };

    this.saveTodos();
    return this.todos[index];
  }

  deleteTodo(id) {
    const originalLength = this.todos.length;
    this.todos = this.todos.filter(t => t.id !== id);
    if (this.todos.length !== originalLength) {
      this.saveTodos();
      return true;
    }
    return false;
  }

  toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      // Mark all subtasks as complete if task is completed
      if (todo.completed && todo.subtasks) {
        todo.subtasks.forEach(sub => sub.completed = true);
      }
      this.saveTodos();
      return todo;
    }
    return null;
  }

  /* --- Subtasks --- */

  addSubtask(todoId, title) {
    if (!title || title.trim() === '') return null;
    const todo = this.todos.find(t => t.id === todoId);
    if (!todo) return null;

    const newSubtask = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      title: title.trim(),
      completed: false
    };

    todo.subtasks = todo.subtasks || [];
    todo.subtasks.push(newSubtask);
    
    // If the task was previously completed, uncomplete it since a new subtask is active
    if (todo.completed) {
      todo.completed = false;
    }

    this.saveTodos();
    return newSubtask;
  }

  toggleSubtask(todoId, subtaskId) {
    const todo = this.todos.find(t => t.id === todoId);
    if (!todo || !todo.subtasks) return null;

    const subtask = todo.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
      subtask.completed = !subtask.completed;

      // Auto-update parent todo completion based on all subtasks
      const allDone = todo.subtasks.length > 0 && todo.subtasks.every(s => s.completed);
      if (allDone && !todo.completed) {
        todo.completed = true;
      } else if (!allDone && todo.completed) {
        todo.completed = false;
      }

      this.saveTodos();
      return { todo, subtask };
    }
    return null;
  }

  deleteSubtask(todoId, subtaskId) {
    const todo = this.todos.find(t => t.id === todoId);
    if (!todo || !todo.subtasks) return false;

    const originalLength = todo.subtasks.length;
    todo.subtasks = todo.subtasks.filter(s => s.id !== subtaskId);
    
    if (todo.subtasks.length !== originalLength) {
      // Auto-update parent todo completion based on remaining subtasks
      if (todo.subtasks.length > 0) {
        todo.completed = todo.subtasks.every(s => s.completed);
      }
      this.saveTodos();
      return true;
    }
    return false;
  }

  /* --- Category Management --- */

  addCategory(name, color) {
    if (!name || name.trim() === '') return null;
    const sanitizedName = name.trim();
    
    // Check if category already exists (case insensitive)
    const exists = this.categories.some(c => c.name.toLowerCase() === sanitizedName.toLowerCase());
    if (exists) return null;

    const newCategory = {
      id: 'cat-' + Date.now(),
      name: sanitizedName,
      color: color || '#8e8e93'
    };

    this.categories.push(newCategory);
    this.saveCategories();
    return newCategory;
  }

  deleteCategory(categoryId) {
    if (this.categories.length <= 1) return false;
    const index = this.categories.findIndex(c => c.id === categoryId);
    if (index === -1) return false;

    // Trouve une catégorie de repli (la première disponible qui n'est pas celle en cours de suppression)
    const fallbackCategory = this.categories.find(c => c.id !== categoryId);
    const fallbackId = fallbackCategory ? fallbackCategory.id : '';

    // Réassigne les tâches associées à la catégorie de repli
    this.todos.forEach(todo => {
      if (todo.category === categoryId) {
        todo.category = fallbackId;
      }
    });

    this.categories.splice(index, 1);
    this.saveCategories();
    this.saveTodos();
    return true;
  }

  getCategoryColor(catId) {
    const category = this.categories.find(c => c.id === catId);
    return category ? category.color : '#8e8e93';
  }

  getCategoryName(catId) {
    const category = this.categories.find(c => c.id === catId);
    return category ? category.name : 'Non assigné';
  }

  /* --- Filters & Sorting --- */

  setFilter(key, value) {
    this.filters[key] = value;
  }

  getFilteredTodos() {
    let result = [...this.todos];

    // 1. Search Query Filter
    const query = this.filters.searchQuery.trim().toLowerCase();
    if (query !== '') {
      result = result.filter(todo => 
        todo.title.toLowerCase().includes(query) || 
        todo.description.toLowerCase().includes(query)
      );
    }

    // 2. Status Filter
    if (this.filters.status === 'active') {
      result = result.filter(todo => !todo.completed);
    } else if (this.filters.status === 'completed') {
      result = result.filter(todo => todo.completed);
    }

    // 3. Category Filter
    if (this.filters.category !== 'all') {
      result = result.filter(todo => todo.category === this.filters.category);
    }

    // 4. Priority Filter
    if (this.filters.priority !== 'all') {
      result = result.filter(todo => todo.priority === this.filters.priority);
    }

    // 5. Sorting
    result.sort((a, b) => {
      if (this.filters.sortBy === 'dueDate-asc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (this.filters.sortBy === 'dueDate-desc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate) - new Date(a.dueDate);
      } else if (this.filters.sortBy === 'priority-desc') {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const weightA = priorityWeight[a.priority] || 0;
        const weightB = priorityWeight[b.priority] || 0;
        return weightB - weightA;
      } else if (this.filters.sortBy === 'createdAt-desc') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    return result;
  }

  /* --- Statistics --- */

  getStats() {
    const total = this.todos.length;
    const completed = this.todos.filter(t => t.completed).length;
    const active = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Overdue tasks
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = this.todos.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length;

    // Category breakdown
    const categoryCounts = {};
    this.categories.forEach(cat => {
      categoryCounts[cat.id] = 0;
    });
    this.todos.forEach(t => {
      if (categoryCounts[t.category] !== undefined) {
        categoryCounts[t.category]++;
      }
    });

    return {
      total,
      completed,
      active,
      completionRate,
      overdue,
      categoryCounts
    };
  }

  /* --- Export / Import JSON --- */

  exportAsJSON() {
    const data = {
      todos: this.todos,
      categories: this.categories,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0'
    };
    return JSON.stringify(data, null, 2);
  }

  importFromJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate schema
      if (!parsed || !Array.isArray(parsed.todos) || !Array.isArray(parsed.categories)) {
        throw new Error('Invalid file structure. It must contain "todos" and "categories" arrays.');
      }

      // Merge or overwrite - we will overwrite for simplicity and safety,
      // but generate fresh IDs for categories/todos if needed, or keep them if they don't collide.
      // Basic schema validation for imported todos
      const validTodos = parsed.todos.filter(t => t && typeof t.title === 'string');
      const validCategories = parsed.categories.filter(c => c && typeof c.name === 'string' && typeof c.color === 'string');

      if (validTodos.length === 0 && parsed.todos.length > 0) {
        throw new Error('Todo objects are formatted incorrectly.');
      }

      this.todos = validTodos;
      this.categories = validCategories;

      this.saveTodos();
      this.saveCategories();
      return { success: true, count: validTodos.length };
    } catch (e) {
      console.error('Import failed', e);
      return { success: false, error: e.message };
    }
  }
}
