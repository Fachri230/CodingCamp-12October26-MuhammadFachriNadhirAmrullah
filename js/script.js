// js/script.js — To-Do Life Dashboard
// Module entry point — logic will be implemented in subsequent tasks.

// ─── showToast ──────────────────────────────────────────────────────────────
// Non-blocking toast notification for transient user feedback.
// Requirements: 1.4, 7.2

/**
 * Display a transient toast notification at the bottom of the page.
 * The toast slides in, stays visible for ~3 seconds, then fades out and
 * removes itself from the DOM. Uses ARIA role="alert" so screen readers
 * announce the message immediately.
 *
 * @param {string} message  The text to display inside the toast.
 * @param {'warning'|'error'|'info'|'success'} [type='warning']
 *   Controls the CSS modifier class appended to the element
 *   (e.g. `toast-error`, `toast-warning`).
 */
export function showToast(message, type = 'warning') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger CSS transition: add the visible class on the next paint.
  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  // After 3 s, remove the visible class (triggers fade-out transition),
  // then remove the element once the transition has finished.
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3000);
}

// ─── StorageModule ──────────────────────────────────────────────────────────
// Abstraction layer for all localStorage read/write operations.
// No other module may access localStorage directly.

export const StorageModule = {
  /** Consistent localStorage keys for all persisted data. */
  KEYS: {
    TODOS:    'tld_todos',
    LINKS:    'tld_links',
    USERNAME: 'tld_username',
    THEME:    'tld_theme',
  },

  /**
   * Check whether localStorage is available and writable.
   * Writes a sentinel value then removes it; catches all exceptions.
   * @returns {boolean}
   */
  isAvailable() {
    const sentinel = '__tld_storage_test__';
    try {
      localStorage.setItem(sentinel, '1');
      localStorage.removeItem(sentinel);
      return true;
    } catch (_e) {
      return false;
    }
  },

  /**
   * Read and JSON-parse a value from localStorage.
   * Returns defaultValue if the key is absent or parsing fails.
   * @param {string} key
   * @param {*} defaultValue
   * @returns {*}
   */
  get(key, defaultValue) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (_e) {
      return defaultValue;
    }
  },

  /**
   * JSON-serialize a value and write it to localStorage.
   * Catches QuotaExceededError and other storage errors.
   * On failure, fires a toast notification so the user knows their data was
   * not persisted (Requirement 7.2).
   * @param {string} key
   * @param {*} value
   * @returns {boolean} true on success, false on failure
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_e) {
      showToast('Gagal menyimpan data. Penyimpanan penuh atau diblokir.', 'error');
      return false;
    }
  },

  /**
   * Reveal the #storage-warning banner when localStorage is unavailable.
   */
  showUnavailableWarning() {
    const el = document.getElementById('storage-warning');
    if (el) {
      el.hidden = false;
    }
  },
};

// ============================================================
// ValidatorModule — Pure input-validation utilities (no side effects)
// Requirements: 2.10, 2.11, 4.4, 4.5, 4.8, 5.5, 5.6, 5.9, 5.10
// ============================================================

export const ValidatorModule = {
  /**
   * Returns true if str is empty or contains only whitespace.
   * @param {string} str
   * @returns {boolean}
   */
  isBlank(str) {
    return str.trim().length === 0;
  },

  /**
   * Returns true if str (trimmed) exceeds max characters.
   * @param {string} str
   * @param {number} max
   * @returns {boolean}
   */
  exceedsMaxLength(str, max) {
    return str.trim().length > max;
  },

  /**
   * Returns true if text (case-insensitive, trimmed) matches any incomplete
   * todo in todos, ignoring the item whose id === excludeId.
   * @param {string} text
   * @param {Array<{id: string, text: string, completed: boolean}>} todos
   * @param {string} [excludeId]
   * @returns {boolean}
   */
  isDuplicateTodo(text, todos, excludeId) {
    const normalised = text.trim().toLowerCase();
    return todos.some(
      (todo) =>
        todo.completed === false &&
        todo.id !== excludeId &&
        todo.text.trim().toLowerCase() === normalised
    );
  },

  /**
   * Validates a URL string.
   * - Already has http:// or https:// → valid as-is.
   * - No scheme but contains a dot → prefix with https://.
   * - No scheme and no dot → invalid.
   * @param {string} url
   * @returns {{ valid: boolean, normalizedUrl: string }}
   */
  isValidUrl(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return { valid: true, normalizedUrl: url };
    }
    if (url.includes('.')) {
      return { valid: true, normalizedUrl: 'https://' + url };
    }
    return { valid: false, normalizedUrl: url };
  },

  /**
   * Returns true if url (case-insensitive) already exists in the links array.
   * @param {string} url
   * @param {Array<{url: string}>} links
   * @returns {boolean}
   */
  isDuplicateLink(url, links) {
    const normalised = url.toLowerCase();
    return links.some((link) => link.url.toLowerCase() === normalised);
  },

  /**
   * Returns true if url exceeds the 2 048-character browser limit.
   * @param {string} url
   * @returns {boolean}
   */
  exceedsUrlMaxLength(url) {
    return url.length > 2048;
  },
};

// ============================================================
// ThemeController — Light/Dark mode management
// Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
// ============================================================

export const ThemeController = {
  /** Tracks the currently active theme ('light' | 'dark'). */
  _currentTheme: 'light',

  /**
   * Initialise the theme controller.
   * Reads the saved preference from StorageModule (defaulting to 'light'),
   * applies the theme to the document, updates the toggle icon, and
   * attaches the click listener on #theme-toggle.
   */
  init() {
    const saved = StorageModule.get(StorageModule.KEYS.THEME, 'light');
    this._currentTheme = saved === 'dark' ? 'dark' : 'light';
    this._apply(this._currentTheme);
    this._updateIcon(this._currentTheme);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => this.toggle());
    }
  },

  /**
   * Toggle between 'light' and 'dark'.
   * Saves the new preference to LocalStorage then re-applies the theme and icon.
   */
  toggle() {
    const newTheme = this._currentTheme === 'light' ? 'dark' : 'light';
    this._currentTheme = newTheme;
    StorageModule.set(StorageModule.KEYS.THEME, newTheme);
    this._apply(newTheme);
    this._updateIcon(newTheme);
  },

  /**
   * Apply the given theme by adding/removing the 'dark-mode' class on <html>.
   * @param {'light'|'dark'} theme
   */
  _apply(theme) {
    const root = document.documentElement; // <html>
    if (theme === 'dark') {
      root.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
    }
  },

  /**
   * Update the #theme-toggle button icon to reflect the active theme.
   * Shows ☀️ when the current theme is light, 🌙 when dark.
   * @param {'light'|'dark'} theme
   */
  _updateIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.textContent = theme === 'light' ? '☀️' : '🌙';
  },
};

// ============================================================
// ClockWidget — Real-time clock, date, greeting, username edit
// Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11
// ============================================================

export const ClockWidget = {
  /** Currently displayed username. */
  _username: 'Pengguna',

  /**
   * Initialise the widget: load stored username, render immediately,
   * start the 1-second interval, and attach UI event listeners.
   */
  init() {
    this._username = StorageModule.get(StorageModule.KEYS.USERNAME, 'Pengguna');

    this._tick();
    setInterval(() => this._tick(), 1000);

    const displayBtn = document.getElementById('username-display');
    if (displayBtn) {
      displayBtn.addEventListener('click', () => this.enableEditMode());
    }

    const saveBtn = document.getElementById('username-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const input = document.getElementById('username-input');
        this.saveUsername(input ? input.value : '');
      });
    }

    const cancelBtn = document.getElementById('username-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.disableEditMode());
    }
  },

  /**
   * Called every second (and once immediately on init).
   * Updates #clock-time, #clock-date, #greeting-text, and #username-display.
   */
  _tick() {
    const now = new Date();

    const timeStr = this._formatTime(now);
    const dateStr = this._formatDate(now);
    const greeting = this._getGreeting(now.getHours());

    const timeEl = document.getElementById('clock-time');
    if (timeEl) {
      timeEl.textContent = timeStr;
      // Keep the machine-readable datetime attribute in sync (semantic HTML for <time>)
      timeEl.setAttribute('datetime', now.toTimeString().slice(0, 8));
    }

    const dateEl = document.getElementById('clock-date');
    if (dateEl) dateEl.textContent = dateStr;

    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) greetingEl.textContent = greeting;

    const displayBtn = document.getElementById('username-display');
    if (displayBtn) displayBtn.textContent = `${greeting}, ${this._username}!`;
  },

  /**
   * Returns the appropriate Indonesian greeting for a given hour (0–23).
   * @param {number} hour
   * @returns {string}
   */
  _getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return 'Selamat Pagi';
    if (hour >= 12 && hour <= 14) return 'Selamat Siang';
    if (hour >= 15 && hour <= 17) return 'Selamat Sore';
    return 'Selamat Malam'; // 18–23 and 0–4
  },

  /**
   * Formats a Date as "HH:MM:SS" (zero-padded) and sets #clock-time text.
   * @param {Date} date
   * @returns {string}
   */
  _formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  },

  /**
   * Formats a Date as "Nama-Hari, DD Nama-Bulan YYYY" in Bahasa Indonesia.
   * @param {Date} date
   * @returns {string}
   */
  _formatDate(date) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const dayName   = days[date.getDay()];
    const dd        = date.getDate();
    const monthName = months[date.getMonth()];
    const yyyy      = date.getFullYear();
    return `${dayName}, ${dd} ${monthName} ${yyyy}`;
  },

  /**
   * Show the username edit form and hide the greeting / display button.
   */
  enableEditMode() {
    const editDiv = document.getElementById('username-edit');
    if (editDiv) editDiv.hidden = false;

    const input = document.getElementById('username-input');
    if (input) input.value = this._username;

    const displayBtn = document.getElementById('username-display');
    if (displayBtn) displayBtn.hidden = true;

    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) greetingEl.hidden = true;
  },

  /**
   * Hide the username edit form and restore the greeting / display button.
   */
  disableEditMode() {
    const editDiv = document.getElementById('username-edit');
    if (editDiv) editDiv.hidden = true;

    const displayBtn = document.getElementById('username-display');
    if (displayBtn) displayBtn.hidden = false;

    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) greetingEl.hidden = false;
  },

  /**
   * Validate and persist a new username.
   * Rejects blank strings and names exceeding 50 characters (trimmed).
   * On success: saves to storage, updates _username, closes edit mode, re-ticks.
   * On failure: keeps edit mode open, leaves storage unchanged.
   * @param {string} name
   */
  saveUsername(name) {
    if (ValidatorModule.isBlank(name)) return;
    if (ValidatorModule.exceedsMaxLength(name, 50)) return;

    const trimmed = name.trim();
    StorageModule.set(StorageModule.KEYS.USERNAME, trimmed);
    this._username = trimmed;
    this.disableEditMode();
    this._tick();
  },
};

// ============================================================
// FocusTimerModule — 25-minute countdown focus timer
// Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
// ============================================================

export const FocusTimerModule = {
  /** Total session duration in seconds (25 minutes). */
  DURATION_SECONDS: 1500,

  /** ID returned by setInterval, or null when timer is stopped. */
  _intervalId: null,

  /** Absolute timestamp (ms) when the current run will reach zero. */
  _endTimestamp: null,

  /** Seconds remaining at the moment the timer was last stopped/reset. */
  _remainingSeconds: 1500,

  /** Whether the timer is currently counting down. */
  _isRunning: false,

  // ── Formatting ──────────────────────────────────────────────

  /**
   * Convert a raw second count into a zero-padded "MM:SS" string.
   * @param {number} seconds  Integer in [0, 1500].
   * @returns {string}  e.g. "25:00", "04:59"
   */
  _formatDisplay(seconds) {
    const MM = String(Math.floor(seconds / 60)).padStart(2, '0');
    const SS = String(seconds % 60).padStart(2, '0');
    return `${MM}:${SS}`;
  },

  // ── Lifecycle ───────────────────────────────────────────────

  /**
   * Initialise the timer widget.
   * Resets state to 25 : 00, wires up button click listeners,
   * and sets the correct enabled/disabled state for each button.
   */
  init() {
    this._remainingSeconds = this.DURATION_SECONDS;

    const display = document.getElementById('timer-display');
    if (display) display.textContent = this._formatDisplay(this._remainingSeconds);

    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');

    if (startBtn) {
      startBtn.disabled = false;
      startBtn.addEventListener('click', () => this.start());
    }
    if (stopBtn) {
      stopBtn.disabled = true;
      stopBtn.addEventListener('click', () => this.stop());
    }

    const resetBtn = document.getElementById('timer-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }
  },

  // ── Controls ────────────────────────────────────────────────

  /**
   * Start (or resume) the countdown.
   * No-op if the timer is already running.
   */
  start() {
    if (this._isRunning) return;

    this._endTimestamp = Date.now() + this._remainingSeconds * 1000;
    this._intervalId   = setInterval(() => this._tick(), 200);
    this._isRunning    = true;

    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    if (startBtn) startBtn.disabled = true;
    if (stopBtn)  stopBtn.disabled  = false;
  },

  /**
   * Pause the countdown, preserving the remaining time.
   * No-op if the timer is not running.
   */
  stop() {
    if (!this._isRunning) return;

    clearInterval(this._intervalId);
    this._intervalId = null;

    // Read the current display so the stored value matches what the user sees.
    const display = document.getElementById('timer-display');
    if (display) {
      const [mm, ss]         = display.textContent.split(':').map(Number);
      this._remainingSeconds = mm * 60 + ss;
    }

    this._isRunning = false;

    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    if (startBtn) startBtn.disabled = false;
    if (stopBtn)  stopBtn.disabled  = true;
  },

  /**
   * Reset the timer to 25:00 and clear all running state.
   */
  reset() {
    clearInterval(this._intervalId);
    this._intervalId       = null;
    this._remainingSeconds = this.DURATION_SECONDS;
    this._endTimestamp     = null;
    this._isRunning        = false;

    const display = document.getElementById('timer-display');
    if (display) display.textContent = this._formatDisplay(this._remainingSeconds);

    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    if (startBtn) startBtn.disabled = false;
    if (stopBtn)  stopBtn.disabled  = true;

    const notification = document.getElementById('timer-notification');
    if (notification) notification.hidden = true;
  },

  // ── Internal tick ────────────────────────────────────────────

  /**
   * Called every 200 ms by setInterval.
   * Calculates remaining time from the absolute end-timestamp (drift-free),
   * updates the display, and triggers completion when the countdown hits zero.
   */
  _tick() {
    let remaining = Math.ceil((this._endTimestamp - Date.now()) / 1000);
    if (remaining < 0) remaining = 0;

    const display = document.getElementById('timer-display');
    if (display) display.textContent = this._formatDisplay(remaining);

    if (remaining <= 0) {
      this._onComplete();
    }
  },

  // ── Completion ───────────────────────────────────────────────

  /**
   * Called when the countdown reaches zero.
   * Stops the interval, shows a notification banner with a close button,
   * and dispatches a 'timer:complete' CustomEvent on document.
   */
  _onComplete() {
    clearInterval(this._intervalId);
    this._intervalId       = null;
    this._isRunning        = false;
    this._remainingSeconds = 0;

    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    if (startBtn) startBtn.disabled = true;
    if (stopBtn)  stopBtn.disabled  = true;

    const notification = document.getElementById('timer-notification');
    if (notification) {
      // Clear previous content to avoid duplicate close buttons on repeat runs.
      notification.textContent = '';

      const message = document.createTextNode('Sesi fokus selesai! Waktunya istirahat. 🎉');
      notification.appendChild(message);

      const closeBtn = document.createElement('button');
      closeBtn.textContent          = '✕';
      closeBtn.setAttribute('aria-label', 'Tutup notifikasi');
      closeBtn.addEventListener('click', () => {
        notification.hidden = true;
      });
      notification.appendChild(closeBtn);

      notification.hidden = false;
    }

    document.dispatchEvent(new CustomEvent('timer:complete'));
  },
};

// ============================================================
// TodoManager — CRUD management for the to-do list
// Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8,
//               4.9, 4.10, 4.11, 4.12
// ============================================================

/**
 * @typedef {{ id: string, text: string, completed: boolean, createdAt: number }} TodoItem
 */

export const TodoManager = {
  /** @type {TodoItem[]} */
  _todos: [],

  // ── Factory ─────────────────────────────────────────────────

  /**
   * Create a new TodoItem with a unique id.
   * Uses crypto.randomUUID() when available; falls back to a base-36 timestamp
   * combined with random digits for environments that lack the Web Crypto API.
   * @param {string} text
   * @returns {TodoItem}
   */
  _createTodoItem(text) {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);

    return {
      id,
      text: text.trim(),
      completed: false,
      createdAt: Date.now(),
    };
  },

  // ── Persistence ──────────────────────────────────────────────

  /**
   * Persist the current in-memory todo array to localStorage.
   */
  _saveToStorage() {
    StorageModule.set(StorageModule.KEYS.TODOS, this._todos);
  },

  /**
   * Hydrate the in-memory array from localStorage.
   * Falls back to an empty array when the key is absent or data is corrupt.
   */
  _loadFromStorage() {
    this._todos = StorageModule.get(StorageModule.KEYS.TODOS, []);
  },

  // ── Warning helper ───────────────────────────────────────────

  /**
   * Show or hide the #todo-warning element.
   * @param {string|null} message  When truthy, displays the message; null hides the banner.
   */
  _setWarning(message) {
    const el = document.getElementById('todo-warning');
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  },

  // ── CRUD ─────────────────────────────────────────────────────

  /**
   * Add a new todo item after validating the input text.
   * Displays an inline warning and aborts on any validation failure.
   * On success: creates the item, persists, re-renders, and clears the input.
   * @param {string} text
   */
  addTodo(text) {
    if (ValidatorModule.isBlank(text)) {
      this._setWarning('Tugas tidak boleh kosong.');
      return;
    }
    if (ValidatorModule.exceedsMaxLength(text, 200)) {
      this._setWarning('Tugas melebihi 200 karakter.');
      return;
    }
    if (ValidatorModule.isDuplicateTodo(text, this._todos)) {
      this._setWarning('Tugas ini sudah ada di daftar.');
      return;
    }

    this._setWarning(null);
    const item = this._createTodoItem(text);
    this._todos.push(item);
    this._saveToStorage();
    this._render();

    const input = document.getElementById('todo-input');
    if (input) input.value = '';
  },

  /**
   * Flip the completed state of the todo identified by id.
   * @param {string} id
   */
  toggleTodo(id) {
    const todo = this._todos.find((t) => t.id === id);
    if (!todo) return;
    todo.completed = !todo.completed;
    this._saveToStorage();
    this._render();
  },

  /**
   * Update the text of an existing todo after validation.
   * Accepts an optional excludeId (equal to id) so the item is not flagged as
   * a duplicate of itself.
   * @param {string} id
   * @param {string} newText
   */
  editTodo(id, newText) {
    if (ValidatorModule.isBlank(newText)) {
      this._setWarning('Tugas tidak boleh kosong.');
      return;
    }
    if (ValidatorModule.exceedsMaxLength(newText, 200)) {
      this._setWarning('Tugas melebihi 200 karakter.');
      return;
    }
    if (ValidatorModule.isDuplicateTodo(newText, this._todos, id)) {
      this._setWarning('Tugas ini sudah ada di daftar.');
      return;
    }

    const todo = this._todos.find((t) => t.id === id);
    if (!todo) return;

    this._setWarning(null);
    todo.text = newText.trim();
    this._saveToStorage();
    this._render();
  },

  /**
   * Permanently remove the todo identified by id.
   * @param {string} id
   */
  deleteTodo(id) {
    this._todos = this._todos.filter((t) => t.id !== id);
    this._saveToStorage();
    this._render();
  },

  // ── Rendering ────────────────────────────────────────────────

  /**
   * Rebuild the entire #todo-list DOM from the current in-memory array.
   * Each <li> contains a checkbox, a text span, an edit button, and a delete button.
   * Event listeners are attached directly rather than using delegation so that
   * each item's inline-edit mode can independently replace the span with an input.
   */
  _render() {
    const list = document.getElementById('todo-list');
    if (!list) return;

    list.innerHTML = '';

    this._todos.forEach((todo) => {
      const li = document.createElement('li');
      li.dataset.id = todo.id;
      if (todo.completed) li.classList.add('completed');

      // ── Checkbox ─────────────────────────────────────────────
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = todo.completed;
      checkbox.setAttribute('aria-label', `Tandai selesai: ${todo.text}`);
      checkbox.addEventListener('change', () => this.toggleTodo(todo.id));

      // ── Text span ─────────────────────────────────────────────
      const span = document.createElement('span');
      span.textContent = todo.text;
      if (todo.completed) span.style.textDecoration = 'line-through';

      // ── Edit button ───────────────────────────────────────────
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.textContent = '✏️';
      editBtn.setAttribute('aria-label', `Edit tugas: ${todo.text}`);
      editBtn.addEventListener('click', () => {
        // Replace the static span with an editable input + Save/Cancel buttons.
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = todo.text;
        editInput.setAttribute('aria-label', `Edit teks tugas: ${todo.text}`);

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Simpan';
        saveBtn.className = 'btn-save';
        saveBtn.setAttribute('aria-label', 'Simpan perubahan');
        saveBtn.addEventListener('click', () => this.editTodo(todo.id, editInput.value));

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Batal';
        cancelBtn.className = 'btn-cancel';
        cancelBtn.setAttribute('aria-label', 'Batal edit');
        cancelBtn.addEventListener('click', () => this._render());

        // Swap span → editInput and hide the edit button itself.
        li.replaceChild(editInput, span);
        editBtn.hidden = true;
        li.insertBefore(saveBtn, editBtn);
        li.insertBefore(cancelBtn, editBtn);
        editInput.focus();
      });

      // ── Delete button ─────────────────────────────────────────
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.textContent = '🗑️';
      deleteBtn.setAttribute('aria-label', `Hapus tugas: ${todo.text}`);
      deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);

      list.appendChild(li);
    });
  },

  // ── Lifecycle ────────────────────────────────────────────────

  /**
   * Initialise the TodoManager.
   * Loads persisted todos from storage, renders the list, and attaches the
   * submit listener on #todo-form so the user can add items via the form.
   */
  init() {
    this._loadFromStorage();
    this._render();

    const form = document.getElementById('todo-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('todo-input');
        this.addTodo(input ? input.value : '');
      });
    }
  },
};

// ============================================================
// QuickLinksManager — CRUD management for the quick-links list
// Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10
// ============================================================

/**
 * @typedef {{ id: string, label: string, url: string, createdAt: number }} QuickLink
 */

export const QuickLinksManager = {
  /** Maximum number of quick links allowed. */
  MAX_LINKS: 20,

  /** @type {QuickLink[]} */
  _links: [],

  // ── Factory ─────────────────────────────────────────────────

  /**
   * Create a new QuickLink with a unique id.
   * Uses crypto.randomUUID() when available; falls back to a base-36 timestamp
   * combined with random digits for environments that lack the Web Crypto API.
   * @param {string} label
   * @param {string} url  Already-normalized URL.
   * @returns {QuickLink}
   */
  _createQuickLink(label, url) {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);

    return {
      id,
      label: label.trim(),
      url,
      createdAt: Date.now(),
    };
  },

  // ── Persistence ──────────────────────────────────────────────

  /**
   * Persist the current in-memory links array to localStorage.
   */
  _saveToStorage() {
    StorageModule.set(StorageModule.KEYS.LINKS, this._links);
  },

  /**
   * Hydrate the in-memory array from localStorage.
   * Falls back to an empty array when the key is absent or data is corrupt.
   */
  _loadFromStorage() {
    this._links = StorageModule.get(StorageModule.KEYS.LINKS, []);
  },

  // ── Warning helper ───────────────────────────────────────────

  /**
   * Show or hide the #link-warning element.
   * @param {string|null} message  When truthy, displays the message; null hides the banner.
   */
  _setWarning(message) {
    const el = document.getElementById('link-warning');
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  },

  // ── CRUD ─────────────────────────────────────────────────────

  /**
   * Add a new quick link after validating the label and URL.
   * Validation order:
   *   1. Label blank check
   *   2. Label max-length check (50 chars)
   *   3. Max-links cap check (20)
   *   4. URL validity check
   *   5. URL max-length check (2 048 chars)
   *   6. Duplicate URL check
   * On any failure: shows inline warning and returns early.
   * On success: normalises the URL, creates the link, persists,
   *             re-renders, clears the form inputs, and hides the warning.
   * @param {string} label
   * @param {string} url
   */
  addLink(label, url) {
    if (ValidatorModule.isBlank(label)) {
      this._setWarning('Label tidak boleh kosong.');
      return;
    }
    if (ValidatorModule.exceedsMaxLength(label, 50)) {
      this._setWarning('Label melebihi 50 karakter.');
      return;
    }
    if (this._links.length >= this.MAX_LINKS) {
      this._setWarning('Batas maksimum 20 tautan tercapai.');
      return;
    }

    const urlResult = ValidatorModule.isValidUrl(url);
    if (urlResult.valid === false) {
      this._setWarning('URL tidak valid. Masukkan URL dengan format yang benar.');
      return;
    }
    if (ValidatorModule.exceedsUrlMaxLength(url)) {
      this._setWarning('URL melebihi 2048 karakter.');
      return;
    }
    if (ValidatorModule.isDuplicateLink(urlResult.normalizedUrl, this._links)) {
      this._setWarning('Tautan ini sudah ada.');
      return;
    }

    const link = this._createQuickLink(label, urlResult.normalizedUrl);
    this._links.push(link);
    this._saveToStorage();
    this._render();

    const labelInput = document.getElementById('link-label-input');
    if (labelInput) labelInput.value = '';
    const urlInput = document.getElementById('link-url-input');
    if (urlInput) urlInput.value = '';

    this._setWarning(null);
  },

  /**
   * Permanently remove the link identified by id.
   * @param {string} id
   */
  deleteLink(id) {
    this._links = this._links.filter((l) => l.id !== id);
    this._saveToStorage();
    this._render();
  },

  // ── Rendering ────────────────────────────────────────────────

  /**
   * Rebuild the entire #link-list DOM from the current in-memory array.
   * Each <li> contains an anchor and a delete button.
   */
  _render() {
    const list = document.getElementById('link-list');
    if (!list) return;

    list.innerHTML = '';

    this._links.forEach((link) => {
      const li = document.createElement('li');
      li.dataset.id = link.id;

      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = link.label;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.textContent = '🗑️';
      deleteBtn.setAttribute('aria-label', `Hapus tautan: ${link.label}`);
      deleteBtn.addEventListener('click', () => this.deleteLink(link.id));

      li.appendChild(a);
      li.appendChild(deleteBtn);

      list.appendChild(li);
    });
  },

  // ── Lifecycle ────────────────────────────────────────────────

  /**
   * Initialise the QuickLinksManager.
   * Loads persisted links from storage, renders the list, and attaches the
   * submit listener on #link-form so the user can add links via the form.
   */
  init() {
    this._loadFromStorage();
    this._render();

    const form = document.getElementById('link-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const labelInput = document.getElementById('link-label-input');
        const urlInput   = document.getElementById('link-url-input');
        this.addLink(
          labelInput ? labelInput.value : '',
          urlInput   ? urlInput.value   : ''
        );
      });
    }
  },
};

// ============================================================
// App — Top-level orchestrator
// Requirements: 1.1, 1.3, 1.4
// ============================================================

/**
 * Top-level application object.
 * Initialises all modules in the order required to prevent FOUC and ensure
 * each module can safely depend on the ones initialised before it.
 */
export const App = {
  init() {
    try {
      // 1. Apply saved theme immediately to prevent flash of unstyled content.
      ThemeController.init();

      // 2. Warn the user if localStorage is unavailable (data will not persist).
      if (!StorageModule.isAvailable()) {
        StorageModule.showUnavailableWarning();
      }

      // 3. Start the real-time clock and greeting.
      ClockWidget.init();

      // 4. Initialise the focus timer widget.
      FocusTimerModule.init();

      // 5. Load and render the to-do list.
      TodoManager.init();

      // 6. Load and render the quick-links list.
      QuickLinksManager.init();
    } catch (err) {
      console.error('[App] Initialization error:', err);
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
