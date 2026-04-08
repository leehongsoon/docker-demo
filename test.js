// Simulate browser environment — test pure app logic

// ── Minimal localStorage stub ─────────────────────────────────────────────────
const store = {};
const localStorage = {
    getItem: k => store[k] || null,
    setItem: (k, v) => { store[k] = v; },
};

// ── App logic (mirrors app.js, with auto-increment ID instead of Date.now()) ──
let _nextId = 1;
let todos = JSON.parse(localStorage.getItem('todos') || '[]');

function saveTodos() { localStorage.setItem('todos', JSON.stringify(todos)); }

function addTodo(text) {
    text = text.trim();
    if (!text) return null;
    const todo = { id: _nextId++, text, done: false };
    todos.push(todo);
    saveTodos();
    return todo;
}

function toggleTodo(id) {
    const t = todos.find(t => t.id === id);
    if (t) { t.done = !t.done; saveTodos(); }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
}

function clearCompleted() {
    todos = todos.filter(t => !t.done);
    saveTodos();
}

function getFiltered(filter) {
    if (filter === 'active')    return todos.filter(t => !t.done);
    if (filter === 'completed') return todos.filter(t => t.done);
    return todos;
}

function itemsLeft() { return todos.filter(t => !t.done).length; }

// ── Helpers ───────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
function assert(label, condition) {
    if (condition) { console.log(`  ✓  ${label}`); pass++; }
    else           { console.log(`  ✗  ${label}`); fail++; }
}
function section(title) { console.log(`\n── ${title} ──`); }
function printList(label, list) {
    console.log(`\n  ${label}`);
    if (list.length === 0) { console.log('    (empty)'); return; }
    list.forEach(t => console.log(`    [${t.done ? 'x' : ' '}] ${t.text}`));
}

// ═════════════════════════════════════════════════════════════════════════════
section('1. Add tasks');
const t1 = addTodo('Buy groceries');
const t2 = addTodo('Read a book');
const t3 = addTodo('Go for a run');
const t4 = addTodo('Write unit tests');
const t5 = addTodo('Clean the house');
assert('5 tasks added', todos.length === 5);
assert('Empty input ignored', addTodo('   ') === null && todos.length === 5);

printList('All tasks:', getFiltered('all'));

// ─────────────────────────────────────────────────────────────────────────────
section('2. Mark tasks complete');
toggleTodo(t1.id);   // Buy groceries  → done
toggleTodo(t3.id);   // Go for a run   → done
assert('"Buy groceries" marked done', todos.find(t => t.id === t1.id).done);
assert('"Go for a run" marked done',  todos.find(t => t.id === t3.id).done);
assert('"Read a book" still active',  !todos.find(t => t.id === t2.id).done);

printList('After marking 2 complete:', getFiltered('all'));

// ─────────────────────────────────────────────────────────────────────────────
section('3. Filter: Active');
const active = getFiltered('active');
assert('3 active tasks', active.length === 3);
printList('Active tasks:', active);

// ─────────────────────────────────────────────────────────────────────────────
section('4. Filter: Completed');
const completed = getFiltered('completed');
assert('2 completed tasks', completed.length === 2);
printList('Completed tasks:', completed);

// ─────────────────────────────────────────────────────────────────────────────
section('5. Items left counter');
assert('Items left = 3', itemsLeft() === 3);
console.log(`  Items left: ${itemsLeft()}`);

// ─────────────────────────────────────────────────────────────────────────────
section('6. Toggle back (undo complete)');
toggleTodo(t1.id);   // Buy groceries → active again
assert('"Buy groceries" is active again', !todos.find(t => t.id === t1.id).done);
assert('Items left = 4', itemsLeft() === 4);

// ─────────────────────────────────────────────────────────────────────────────
section('7. Delete a task');
deleteTodo(t4.id);   // Remove "Write unit tests"
assert('"Write unit tests" deleted', !todos.find(t => t.id === t4.id));
assert('4 tasks remain', todos.length === 4);

printList('After delete:', getFiltered('all'));

// ─────────────────────────────────────────────────────────────────────────────
section('8. Clear completed');
// "Go for a run" is still done
assert('1 completed before clear', getFiltered('completed').length === 1);
clearCompleted();
assert('0 completed after clear', getFiltered('completed').length === 0);
assert('3 tasks remain', todos.length === 3);

printList('After clear completed:', getFiltered('all'));

// ─────────────────────────────────────────────────────────────────────────────
section('9. Persistence (localStorage)');
const saved = JSON.parse(localStorage.getItem('todos'));
assert('Todos saved to storage', Array.isArray(saved) && saved.length === todos.length);
console.log(`  Saved ${saved.length} todos to storage: ${saved.map(t => t.text).join(', ')}`);

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(44)}`);
console.log(`  Results: ${pass} passed, ${fail} failed`);
console.log('═'.repeat(44));
process.exit(fail > 0 ? 1 : 0);
