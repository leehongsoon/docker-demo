let todos = JSON.parse(localStorage.getItem('todos') || '[]');
let _nextId = todos.length ? Math.max(...todos.map(t => t.id)) + 1 : 1;
let filter = 'all';

const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');
const itemsLeft = document.getElementById('items-left');
const clearBtn = document.getElementById('clear-completed');
const filterBtns = document.querySelectorAll('.filter-btn');

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function render() {
    const filtered = todos.filter(t => {
        if (filter === 'active') return !t.done;
        if (filter === 'completed') return t.done;
        return true;
    });

    if (filtered.length === 0) {
        list.innerHTML = '<li class="empty-msg">No tasks here!</li>';
    } else {
        list.innerHTML = filtered.map(t => `
            <li class="${t.done ? 'completed' : ''}" data-id="${t.id}">
                <input type="checkbox" ${t.done ? 'checked' : ''} />
                <span class="todo-text">${escapeHtml(t.text)}</span>
                <button class="delete-btn" title="Delete">&#x2715;</button>
            </li>
        `).join('');
    }

    const activeCount = todos.filter(t => !t.done).length;
    itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function addTodo() {
    const text = input.value.trim();
    if (!text) return;
    todos.push({ id: _nextId++, text, done: false });
    input.value = '';
    saveTodos();
    render();
}

addBtn.addEventListener('click', addTodo);
input.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

list.addEventListener('click', e => {
    const li = e.target.closest('li[data-id]');
    if (!li) return;
    const id = Number(li.dataset.id);

    if (e.target.matches('input[type="checkbox"]')) {
        const todo = todos.find(t => t.id === id);
        if (todo) todo.done = !todo.done;
        saveTodos();
        render();
    }

    if (e.target.matches('.delete-btn')) {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        render();
    }
});

clearBtn.addEventListener('click', () => {
    todos = todos.filter(t => !t.done);
    saveTodos();
    render();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render();
    });
});

render();
