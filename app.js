// ═══════════════════════════════════════════════
//  LibraSync – Library Management System
// ═══════════════════════════════════════════════

// ───── State ─────
const state = {
  user: null,
  books: [],
  borrowings: [],
  users: [],
  view: 'catalog',
  search: '',
  genreFilter: '',
  editingBook: null,
};

// ───── Genre helpers ─────
const GENRE_COLORS = {
  'Classic':       'genre-classic',
  'Fantasy':       'genre-fantasy',
  'Dystopian':     'genre-dystopian',
  'Romance':       'genre-romance',
  'Adventure':     'genre-adventure',
  'Fiction':       'genre-fiction',
  'Magic Realism': 'genre-magic-realism',
};

const GENRE_ICONS = {
  'Classic':       '📚',
  'Fantasy':       '🧙',
  'Dystopian':     '🔒',
  'Romance':       '💖',
  'Adventure':     '⚓',
  'Fiction':       '✨',
  'Magic Realism': '🌀',
};

function genreClass(genre) {
  return GENRE_COLORS[genre] || 'genre-general';
}

function genreIcon(genre) {
  return GENRE_ICONS[genre] || '📖';
}

// ───── API helpers ─────
async function api(method, url, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ───── Data loaders ─────
async function loadBooks() {
  state.books = await api('GET', '/api/books');
}

async function loadBorrowings() {
  if (state.user.role === 'admin') {
    state.borrowings = await api('GET', '/api/borrowings');
  } else {
    state.borrowings = await api('GET', `/api/borrowings/user/${state.user.id}`);
  }
}

async function loadUsers() {
  if (state.user.role === 'admin') {
    state.users = await api('GET', '/api/users');
  }
}

// ───── Toast ─────
let toastTimer = null;

function showToast(message, type = 'default') {
  const el = document.getElementById('toast');
  const icons = { success: '✓', error: '✕', default: 'ℹ' };
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || icons.default}</span><span>${message}</span>`;
  el.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

// ───── Modal ─────
function showModal(html) {
  document.getElementById('modal-overlay').classList.remove('hidden');
  const c = document.getElementById('modal-container');
  c.innerHTML = html;
  c.classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-container').classList.add('hidden');
}

// ───── Navigation ─────
function navigate(view) {
  state.view = view;
  state.search = '';
  state.genreFilter = '';
  renderApp();
}

// ───── Login ─────
function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">📚</div>
          <h1>LibraSync</h1>
          <p>Library Management System</p>
        </div>
        <div class="login-body">
          <h2>Sign in to your account</h2>
          <div id="login-error" class="login-error hidden"></div>
          <form id="login-form">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="login-email" placeholder="you@example.com" required autocomplete="username" />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="login-password" placeholder="••••••••" required autocomplete="current-password" />
            </div>
            <button type="submit" class="btn-login">Sign In</button>
          </form>
          <div class="login-hint">
            <p>
              <strong>Admin:</strong> admin@library.com / admin123<br/>
              <strong>User:</strong> alice@example.com / user123<br/>
              <strong>User:</strong> bob@example.com / user123
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('login-form').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl    = document.getElementById('login-error');
  errEl.classList.add('hidden');
  try {
    const data = await api('POST', '/api/login', { email, password });
    state.user = data.user;
    await Promise.all([loadBooks(), loadBorrowings(), loadUsers()]);
    renderApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

function handleLogout() {
  state.user = null;
  state.books = [];
  state.borrowings = [];
  state.users = [];
  state.view = 'catalog';
  renderLogin();
}

// ───── App Shell ─────
function renderApp() {
  const isAdmin = state.user.role === 'admin';
  const initials = state.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const navItems = [
    { id: 'catalog',             icon: '🏠', label: 'Browse Catalog',   section: 'library' },
    { id: 'my-books',            icon: '📖', label: 'My Borrowed Books', section: 'library', hideAdmin: false },
    ...(isAdmin ? [
      { id: 'admin-books',       icon: '📋', label: 'Manage Books',      section: 'admin' },
      { id: 'admin-users',       icon: '👥', label: 'Manage Users',       section: 'admin' },
      { id: 'admin-borrowings',  icon: '📊', label: 'Borrowing History',  section: 'admin' },
    ] : []),
  ];

  let lastSection = '';
  const navHTML = navItems.map(item => {
    let sectionHeader = '';
    if (item.section !== lastSection) {
      lastSection = item.section;
      sectionHeader = `<div class="nav-section-label">${item.section === 'admin' ? 'Administration' : 'Library'}</div>`;
    }
    return `${sectionHeader}
      <button class="nav-item ${state.view === item.id ? 'active' : ''}" onclick="navigate('${item.id}')">
        <span class="nav-item-icon">${item.icon}</span>
        <span>${item.label}</span>
      </button>`;
  }).join('');

  document.getElementById('app').innerHTML = `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <span class="sidebar-brand-icon">📚</span>
            <div class="sidebar-brand-text">
              <h2>LibraSync</h2>
              <p>Library Management</p>
            </div>
          </div>
        </div>
        <nav class="sidebar-nav">${navHTML}</nav>
        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar ${isAdmin ? 'admin' : 'user'}">${initials}</div>
            <div class="user-details">
              <div class="user-name">${state.user.name}</div>
              <div class="user-role">${isAdmin ? '<span class="badge-admin">Admin</span>' : 'Member'}</div>
            </div>
          </div>
          <button class="btn-logout" onclick="handleLogout()">Sign Out</button>
        </div>
      </aside>
      <main class="main-content">
        <div id="main-header" class="main-header"></div>
        <div id="main-body" class="main-body"></div>
      </main>
    </div>
  `;

  renderView();
}

function renderView() {
  const views = {
    'catalog':           renderCatalog,
    'my-books':          renderMyBooks,
    'admin-books':       renderAdminBooks,
    'admin-users':       renderAdminUsers,
    'admin-borrowings':  renderAdminBorrowings,
  };
  (views[state.view] || renderCatalog)();
}

function setHeader(title, subtitle, actionsHTML = '') {
  document.getElementById('main-header').innerHTML = `
    <div class="main-header-text">
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
    <div class="header-actions">${actionsHTML}</div>
  `;
}

// ───── Catalog View ─────
function renderCatalog() {
  setHeader('Browse Catalog', `${state.books.length} books available`);

  const activeBorrows = state.borrowings
    .filter(b => b.status === 'borrowed')
    .map(b => b.bookId);

  const genres = [...new Set(state.books.map(b => b.genre))].sort();

  let filtered = state.books.filter(b => {
    const q = state.search.toLowerCase();
    const matchSearch = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    const matchGenre  = !state.genreFilter || b.genre === state.genreFilter;
    return matchSearch && matchGenre;
  });

  const available = state.books.filter(b => b.availableCopies > 0).length;
  const borrowed  = state.borrowings.filter(b => b.status === 'borrowed').length;

  const statsHTML = `
    <div class="stats-bar">
      <div class="stat-card">
        <div class="stat-icon blue">📚</div>
        <div><div class="stat-value">${state.books.length}</div><div class="stat-label">Total Books</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✅</div>
        <div><div class="stat-value">${available}</div><div class="stat-label">Available</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon amber">📤</div>
        <div><div class="stat-value">${borrowed}</div><div class="stat-label">Borrowed</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">🏷️</div>
        <div><div class="stat-value">${genres.length}</div><div class="stat-label">Genres</div></div>
      </div>
    </div>`;

  const toolbarHTML = `
    <div class="toolbar">
      <div class="search-box">
        <span>🔍</span>
        <input type="text" placeholder="Search by title or author…" value="${state.search}"
          oninput="state.search=this.value; renderView()" />
      </div>
      <select class="filter-select" onchange="state.genreFilter=this.value; renderView()">
        <option value="">All Genres</option>
        ${genres.map(g => `<option value="${g}" ${state.genreFilter === g ? 'selected' : ''}>${g}</option>`).join('')}
      </select>
    </div>`;

  const cardsHTML = filtered.length === 0
    ? `<div class="empty-state"><div class="empty-icon">🔍</div><h3>No books found</h3><p>Try adjusting your search or filter.</p></div>`
    : `<div class="books-grid">${filtered.map(b => bookCardHTML(b, activeBorrows)).join('')}</div>`;

  document.getElementById('main-body').innerHTML = statsHTML + toolbarHTML + cardsHTML;
}

function bookCardHTML(book, activeBorrows) {
  const isBorrowed   = activeBorrows.includes(book.id);
  const isAvailable  = book.availableCopies > 0;
  const isLimited    = book.availableCopies === 1;

  let btnClass, btnText, btnDisabled;
  if (isBorrowed) {
    btnClass = 'already'; btnText = '✓ Already Borrowed'; btnDisabled = true;
  } else if (!isAvailable) {
    btnClass = 'no-copies'; btnText = 'No Copies Available'; btnDisabled = true;
  } else {
    btnClass = 'can-borrow'; btnText = 'Borrow Book'; btnDisabled = false;
  }

  let availClass = 'available';
  if (!isAvailable) availClass = 'unavailable';
  else if (isLimited) availClass = 'limited';

  const gClass = genreClass(book.genre);
  const gIcon  = genreIcon(book.genre);

  return `
    <div class="book-card">
      <div class="book-cover ${gClass}">
        ${gIcon}
        <span class="genre-badge-top">${book.genre}</span>
      </div>
      <div class="book-body">
        <div class="book-title">${escHtml(book.title)}</div>
        <div class="book-author">by ${escHtml(book.author)}</div>
        <div class="book-meta">
          <span class="book-year">${book.year}</span>
          <span class="availability ${availClass}">${book.availableCopies}/${book.totalCopies} available</span>
        </div>
        <div class="book-desc">${escHtml(book.description || '')}</div>
        <div class="book-actions">
          <button class="btn-borrow ${btnClass}" ${btnDisabled ? 'disabled' : ''}
            onclick="borrowBook(${book.id})">${btnText}</button>
        </div>
      </div>
    </div>`;
}

async function borrowBook(bookId) {
  try {
    await api('POST', '/api/borrow', { userId: state.user.id, bookId });
    await Promise.all([loadBooks(), loadBorrowings()]);
    showToast('Book borrowed successfully! Due in 30 days.', 'success');
    renderView();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ───── My Books View ─────
function renderMyBooks() {
  setHeader('My Borrowed Books', 'Books currently checked out to you');

  const active   = state.borrowings.filter(b => b.status === 'borrowed');
  const history  = state.borrowings.filter(b => b.status === 'returned');
  const today    = new Date().toISOString().split('T')[0];

  const renderCard = (b) => {
    const isActive  = b.status === 'borrowed';
    const isOverdue = isActive && b.dueDate < today;
    const gClass    = genreClass(b.genre || '');
    const gIcon     = genreIcon(b.genre || '');

    let statusHTML;
    if (isOverdue) {
      statusHTML = `<span class="status-pill status-overdue">⚠ Overdue</span>`;
    } else if (isActive) {
      statusHTML = `<span class="status-pill status-borrowed">📤 Borrowed</span>`;
    } else {
      statusHTML = `<span class="status-pill status-returned">✓ Returned</span>`;
    }

    return `
      <div class="borrow-card">
        <div class="borrow-card-header">
          <div class="borrow-card-icon ${gClass}">${gIcon}</div>
          <div style="flex:1;overflow:hidden">
            <div style="font-weight:700;font-size:0.9375rem;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(b.bookTitle)}</div>
            <div style="font-size:0.8rem;color:#64748b">by ${escHtml(b.bookAuthor)}</div>
          </div>
          ${statusHTML}
        </div>
        <div class="borrow-card-body">
          <div class="borrow-info-row"><span>Borrowed</span><span>${b.borrowDate}</span></div>
          <div class="borrow-info-row"><span>Due Date</span><span style="${isOverdue ? 'color:#dc2626;font-weight:700' : ''}">${b.dueDate}</span></div>
          ${b.returnDate ? `<div class="borrow-info-row"><span>Returned</span><span>${b.returnDate}</span></div>` : ''}
        </div>
        ${isActive ? `
          <div class="borrow-card-footer">
            <button class="btn btn-success" style="width:100%" onclick="returnBook(${b.id})">↩ Return Book</button>
          </div>` : ''}
      </div>`;
  };

  let html = '';

  if (active.length === 0 && history.length === 0) {
    html = `<div class="empty-state"><div class="empty-icon">📭</div><h3>No borrowed books</h3><p>Browse the catalog and borrow a book to get started.</p></div>`;
  } else {
    if (active.length > 0) {
      html += `<h3 style="font-size:1rem;font-weight:700;color:#374151;margin-bottom:1rem">Currently Borrowed (${active.length})</h3>
               <div class="my-books-grid">${active.map(renderCard).join('')}</div>`;
    }
    if (history.length > 0) {
      html += `<h3 style="font-size:1rem;font-weight:700;color:#374151;margin:1.5rem 0 1rem">Reading History (${history.length})</h3>
               <div class="my-books-grid">${history.map(renderCard).join('')}</div>`;
    }
  }

  document.getElementById('main-body').innerHTML = html;
}

async function returnBook(borrowingId) {
  try {
    await api('POST', '/api/return', { borrowingId });
    await Promise.all([loadBooks(), loadBorrowings()]);
    showToast('Book returned successfully!', 'success');
    renderView();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ───── Admin: Manage Books ─────
function renderAdminBooks() {
  setHeader('Manage Books', `${state.books.length} total books`,
    `<button class="btn btn-primary" onclick="showBookModal()">+ Add Book</button>`);

  let filtered = state.books.filter(b => {
    const q = state.search.toLowerCase();
    return !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.genre.toLowerCase().includes(q);
  });

  if (state.genreFilter) filtered = filtered.filter(b => b.genre === state.genreFilter);
  const genres = [...new Set(state.books.map(b => b.genre))].sort();

  const toolbarHTML = `
    <div class="toolbar">
      <div class="search-box">
        <span>🔍</span>
        <input type="text" placeholder="Search books…" value="${state.search}"
          oninput="state.search=this.value; renderView()" />
      </div>
      <select class="filter-select" onchange="state.genreFilter=this.value; renderView()">
        <option value="">All Genres</option>
        ${genres.map(g => `<option value="${g}" ${state.genreFilter === g ? 'selected' : ''}>${g}</option>`).join('')}
      </select>
    </div>`;

  const rowsHTML = filtered.length === 0
    ? `<tr><td colspan="7" style="text-align:center;padding:2rem;color:#64748b">No books found</td></tr>`
    : filtered.map(book => {
        const gClass = genreClass(book.genre);
        const avail  = book.availableCopies === 0
          ? `<span style="color:#dc2626;font-weight:600">0/${book.totalCopies}</span>`
          : `<span style="color:#16a34a;font-weight:600">${book.availableCopies}/${book.totalCopies}</span>`;
        return `
          <tr>
            <td>
              <div style="font-weight:600;color:#0f172a">${escHtml(book.title)}</div>
              <div style="font-size:0.8rem;color:#64748b">${book.year}</div>
            </td>
            <td>${escHtml(book.author)}</td>
            <td>
              <span class="genre-pill ${gClass}" style="color:#fff">${book.genre}</span>
            </td>
            <td>${avail}</td>
            <td style="max-width:220px;color:#64748b;font-size:0.8125rem">${escHtml((book.description || '').slice(0, 80))}${(book.description || '').length > 80 ? '…' : ''}</td>
            <td>
              <div class="table-actions">
                <button class="btn btn-outline btn-sm" onclick="showBookModal(${book.id})">✏ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDeleteBook(${book.id})">🗑 Delete</button>
              </div>
            </td>
          </tr>`;
      }).join('');

  document.getElementById('main-body').innerHTML = `
    ${toolbarHTML}
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Copies</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    </div>`;
}

function showBookModal(bookId = null) {
  const book = bookId ? state.books.find(b => b.id === bookId) : null;
  const title = book ? 'Edit Book' : 'Add New Book';

  showModal(`
    <div class="modal-header">
      <h3>${title}</h3>
      <button class="modal-close" onclick="hideModal()">✕</button>
    </div>
    <div class="modal-body">
      <form class="modal-form" id="book-form">
        <div class="form-group">
          <label>Title *</label>
          <input type="text" name="title" value="${escAttr(book?.title || '')}" required placeholder="Book title" />
        </div>
        <div class="form-group">
          <label>Author *</label>
          <input type="text" name="author" value="${escAttr(book?.author || '')}" required placeholder="Author name" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Genre</label>
            <select name="genre">
              ${['Classic','Fantasy','Dystopian','Romance','Adventure','Fiction','Magic Realism','General']
                .map(g => `<option value="${g}" ${(book?.genre || 'General') === g ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Year</label>
            <input type="number" name="year" value="${book?.year || new Date().getFullYear()}" min="1000" max="2099" />
          </div>
        </div>
        <div class="form-group">
          <label>Total Copies</label>
          <input type="number" name="totalCopies" value="${book?.totalCopies || 1}" min="1" max="99" />
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea name="description" placeholder="Brief description of the book…">${escHtml(book?.description || '')}</textarea>
        </div>
      </form>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveBook(${bookId || 'null'})">${book ? 'Save Changes' : 'Add Book'}</button>
    </div>
  `);
}

async function saveBook(bookId) {
  const form = document.getElementById('book-form');
  const data = Object.fromEntries(new FormData(form));
  if (!data.title.trim() || !data.author.trim()) {
    showToast('Title and author are required', 'error');
    return;
  }
  try {
    if (bookId) {
      await api('PUT', `/api/books/${bookId}`, data);
      showToast('Book updated successfully', 'success');
    } else {
      await api('POST', '/api/books', data);
      showToast('Book added successfully', 'success');
    }
    hideModal();
    await loadBooks();
    renderView();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function confirmDeleteBook(bookId) {
  const book = state.books.find(b => b.id === bookId);
  showModal(`
    <div class="confirm-modal-body">
      <div class="confirm-icon">🗑️</div>
      <h3>Delete Book</h3>
      <p>Are you sure you want to delete <strong>${escHtml(book?.title || '')}</strong>?<br/>This action cannot be undone.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="hideModal()">Cancel</button>
      <button class="btn btn-danger" onclick="deleteBook(${bookId})">Delete Book</button>
    </div>
  `);
}

async function deleteBook(bookId) {
  try {
    await api('DELETE', `/api/books/${bookId}`);
    hideModal();
    await loadBooks();
    showToast('Book deleted', 'success');
    renderView();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ───── Admin: Manage Users ─────
function renderAdminUsers() {
  setHeader('Manage Users', `${state.users.length} registered users`);

  const rowsHTML = state.users.map(u => {
    const initials = u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const userBorrows = state.borrowings.filter(b => b.userId === u.id && b.status === 'borrowed').length;
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem">
            <div class="user-avatar ${u.role}" style="width:36px;height:36px;font-size:0.875rem">${initials}</div>
            <div>
              <div style="font-weight:600;color:#0f172a">${escHtml(u.name)}</div>
              <div style="font-size:0.8rem;color:#64748b">${escHtml(u.email)}</div>
            </div>
          </div>
        </td>
        <td><span class="role-pill role-${u.role}">${u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span></td>
        <td style="font-weight:600;color:${userBorrows > 0 ? '#2563eb' : '#94a3b8'}">${userBorrows} book${userBorrows !== 1 ? 's' : ''}</td>
        <td style="color:#64748b;font-size:0.8rem">#${u.id}</td>
      </tr>`;
  }).join('');

  document.getElementById('main-body').innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Active Borrows</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    </div>`;
}

// ───── Admin: Borrowing History ─────
function renderAdminBorrowings() {
  setHeader('Borrowing History', `${state.borrowings.length} total records`);

  const today = new Date().toISOString().split('T')[0];
  const total    = state.borrowings.length;
  const active   = state.borrowings.filter(b => b.status === 'borrowed').length;
  const returned = state.borrowings.filter(b => b.status === 'returned').length;
  const overdue  = state.borrowings.filter(b => b.status === 'borrowed' && b.dueDate < today).length;

  const statsHTML = `
    <div class="stats-bar" style="margin-bottom:1.5rem">
      <div class="stat-card"><div class="stat-icon blue">📊</div><div><div class="stat-value">${total}</div><div class="stat-label">Total Records</div></div></div>
      <div class="stat-card"><div class="stat-icon amber">📤</div><div><div class="stat-value">${active}</div><div class="stat-label">Active</div></div></div>
      <div class="stat-card"><div class="stat-icon green">✅</div><div><div class="stat-value">${returned}</div><div class="stat-label">Returned</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:#fef2f2">⚠️</div><div><div class="stat-value" style="color:${overdue > 0 ? '#dc2626' : '#0f172a'}">${overdue}</div><div class="stat-label">Overdue</div></div></div>
    </div>`;

  const sorted = [...state.borrowings].sort((a, b) => b.borrowDate.localeCompare(a.borrowDate));

  const rowsHTML = sorted.length === 0
    ? `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748b">No borrowing records found</td></tr>`
    : sorted.map(b => {
        const isOverdue = b.status === 'borrowed' && b.dueDate < today;
        let statusHTML;
        if (isOverdue) {
          statusHTML = `<span class="status-pill status-overdue">⚠ Overdue</span>`;
        } else if (b.status === 'borrowed') {
          statusHTML = `<span class="status-pill status-borrowed">📤 Borrowed</span>`;
        } else {
          statusHTML = `<span class="status-pill status-returned">✓ Returned</span>`;
        }
        return `
          <tr>
            <td>
              <div style="font-weight:600;color:#0f172a">${escHtml(b.bookTitle)}</div>
              <div style="font-size:0.8rem;color:#64748b">${escHtml(b.bookAuthor || '')}</div>
            </td>
            <td>
              <div style="font-weight:500">${escHtml(b.userName)}</div>
              <div style="font-size:0.8rem;color:#64748b">${escHtml(b.userEmail || '')}</div>
            </td>
            <td>${b.borrowDate}</td>
            <td style="${isOverdue ? 'color:#dc2626;font-weight:700' : ''}">${b.dueDate}</td>
            <td>${b.returnDate || '—'}</td>
            <td>${statusHTML}</td>
          </tr>`;
      }).join('');

  document.getElementById('main-body').innerHTML = `
    ${statsHTML}
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Book</th>
            <th>Borrower</th>
            <th>Borrowed</th>
            <th>Due Date</th>
            <th>Returned</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    </div>`;
}

// ───── Utilities ─────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ───── Boot ─────
renderLogin();
