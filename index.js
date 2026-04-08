const express = require('express');
const path = require('path');
const app = express();
const PORT = 80;

app.use(express.json());
app.use(express.static(__dirname));

// ───── In-memory data store ─────
let nextBookId = 13;
let nextBorrowId = 4;

const users = [
  { id: 1, name: 'Admin User',     email: 'admin@library.com', password: 'admin123', role: 'admin' },
  { id: 2, name: 'Alice Johnson',  email: 'alice@example.com', password: 'user123',  role: 'user'  },
  { id: 3, name: 'Bob Smith',      email: 'bob@example.com',   password: 'user123',  role: 'user'  },
];

const books = [
  { id:  1, title: 'The Great Gatsby',                      author: 'F. Scott Fitzgerald',    genre: 'Classic',      year: 1925, totalCopies: 3, availableCopies: 2, description: 'A story of the fabulously wealthy Jay Gatsby and his love for Daisy Buchanan.' },
  { id:  2, title: 'To Kill a Mockingbird',                 author: 'Harper Lee',              genre: 'Classic',      year: 1960, totalCopies: 4, availableCopies: 3, description: 'The story of racial injustice and loss of innocence in the American South.' },
  { id:  3, title: '1984',                                  author: 'George Orwell',           genre: 'Dystopian',    year: 1949, totalCopies: 5, availableCopies: 4, description: 'A dystopian novel set in a totalitarian society ruled by Big Brother.' },
  { id:  4, title: 'Pride and Prejudice',                   author: 'Jane Austen',             genre: 'Romance',      year: 1813, totalCopies: 3, availableCopies: 2, description: 'A romantic novel charting the emotional development of Elizabeth Bennet.' },
  { id:  5, title: 'The Hobbit',                            author: 'J.R.R. Tolkien',          genre: 'Fantasy',      year: 1937, totalCopies: 4, availableCopies: 4, description: 'Bilbo Baggins is swept into an epic quest to reclaim the lost Dwarf Kingdom.' },
  { id:  6, title: "Harry Potter and the Philosopher's Stone", author: 'J.K. Rowling',        genre: 'Fantasy',      year: 1997, totalCopies: 6, availableCopies: 5, description: 'A young boy discovers he is a wizard and attends Hogwarts School of Witchcraft.' },
  { id:  7, title: 'The Catcher in the Rye',                author: 'J.D. Salinger',           genre: 'Classic',      year: 1951, totalCopies: 2, availableCopies: 1, description: 'Holden Caulfield narrates his experiences after expulsion from prep school.' },
  { id:  8, title: 'Brave New World',                       author: 'Aldous Huxley',           genre: 'Dystopian',    year: 1932, totalCopies: 3, availableCopies: 3, description: 'A dystopian future where citizens are environmentally engineered into castes.' },
  { id:  9, title: 'The Lord of the Rings',                 author: 'J.R.R. Tolkien',          genre: 'Fantasy',      year: 1954, totalCopies: 3, availableCopies: 2, description: 'An epic high-fantasy novel following the quest to destroy the One Ring.' },
  { id: 10, title: 'Moby Dick',                             author: 'Herman Melville',         genre: 'Adventure',    year: 1851, totalCopies: 2, availableCopies: 2, description: 'The voyage of the whaling ship Pequod commanded by Captain Ahab.' },
  { id: 11, title: 'The Alchemist',                         author: 'Paulo Coelho',            genre: 'Fiction',      year: 1988, totalCopies: 4, availableCopies: 3, description: 'A philosophical novel about a shepherd and his journey to Egypt.' },
  { id: 12, title: 'One Hundred Years of Solitude',         author: 'Gabriel García Márquez',  genre: 'Magic Realism',year: 1967, totalCopies: 2, availableCopies: 1, description: 'The multi-generational story of the Buendía family in the town of Macondo.' },
];

const borrowings = [
  { id: 1, userId: 2, bookId:  1, borrowDate: '2026-03-15', dueDate: '2026-04-15', returnDate: null,         status: 'borrowed'  },
  { id: 2, userId: 3, bookId:  4, borrowDate: '2026-03-20', dueDate: '2026-04-20', returnDate: null,         status: 'borrowed'  },
  { id: 3, userId: 2, bookId:  9, borrowDate: '2026-02-01', dueDate: '2026-03-01', returnDate: '2026-02-25', status: 'returned'  },
];

// ───── Auth ─────
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  const { password: _pw, ...safeUser } = user;
  res.json({ user: safeUser });
});

// ───── Books ─────
app.get('/api/books', (_req, res) => {
  res.json(books);
});

app.post('/api/books', (req, res) => {
  const { title, author, genre, year, totalCopies, description } = req.body;
  if (!title || !author) return res.status(400).json({ error: 'Title and author are required' });
  const book = {
    id: nextBookId++,
    title: title.trim(),
    author: author.trim(),
    genre: (genre || 'General').trim(),
    year: parseInt(year) || new Date().getFullYear(),
    totalCopies: Math.max(1, parseInt(totalCopies) || 1),
    availableCopies: Math.max(1, parseInt(totalCopies) || 1),
    description: (description || '').trim(),
  };
  books.push(book);
  res.status(201).json(book);
});

app.put('/api/books/:id', (req, res) => {
  const book = books.find(b => b.id === parseInt(req.params.id));
  if (!book) return res.status(404).json({ error: 'Book not found' });
  const { title, author, genre, year, totalCopies, description } = req.body;
  if (title !== undefined)        book.title  = title.trim();
  if (author !== undefined)       book.author = author.trim();
  if (genre !== undefined)        book.genre  = genre.trim();
  if (year !== undefined)         book.year   = parseInt(year);
  if (totalCopies !== undefined) {
    const newTotal = Math.max(1, parseInt(totalCopies));
    const diff = newTotal - book.totalCopies;
    book.totalCopies      = newTotal;
    book.availableCopies  = Math.max(0, book.availableCopies + diff);
  }
  if (description !== undefined)  book.description = description.trim();
  res.json(book);
});

app.delete('/api/books/:id', (req, res) => {
  const idx = books.findIndex(b => b.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Book not found' });
  books.splice(idx, 1);
  res.json({ message: 'Book deleted' });
});

// ───── Borrowings ─────
app.get('/api/borrowings', (_req, res) => {
  const detailed = borrowings.map(b => {
    const user = users.find(u => u.id === b.userId);
    const book = books.find(bk => bk.id === b.bookId);
    return { ...b, userName: user?.name || 'Unknown', userEmail: user?.email || '', bookTitle: book?.title || 'Unknown', bookAuthor: book?.author || '' };
  });
  res.json(detailed);
});

app.get('/api/borrowings/user/:userId', (req, res) => {
  const uid = parseInt(req.params.userId);
  const result = borrowings
    .filter(b => b.userId === uid)
    .map(b => {
      const book = books.find(bk => bk.id === b.bookId);
      return { ...b, bookTitle: book?.title || 'Unknown', bookAuthor: book?.author || '', genre: book?.genre || '' };
    });
  res.json(result);
});

app.post('/api/borrow', (req, res) => {
  const userId  = parseInt(req.body.userId);
  const bookId  = parseInt(req.body.bookId);
  const book = books.find(b => b.id === bookId);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  if (book.availableCopies <= 0) return res.status(400).json({ error: 'No copies currently available' });
  const alreadyBorrowed = borrowings.find(b => b.userId === userId && b.bookId === bookId && b.status === 'borrowed');
  if (alreadyBorrowed) return res.status(400).json({ error: 'You already have this book borrowed' });

  book.availableCopies--;
  const today = new Date();
  const due   = new Date(today);
  due.setDate(due.getDate() + 30);

  const borrowing = {
    id: nextBorrowId++,
    userId,
    bookId,
    borrowDate: today.toISOString().split('T')[0],
    dueDate:    due.toISOString().split('T')[0],
    returnDate: null,
    status: 'borrowed',
  };
  borrowings.push(borrowing);
  res.status(201).json(borrowing);
});

app.post('/api/return', (req, res) => {
  const borrowing = borrowings.find(b => b.id === parseInt(req.body.borrowingId));
  if (!borrowing) return res.status(404).json({ error: 'Borrowing record not found' });
  if (borrowing.status === 'returned') return res.status(400).json({ error: 'Book already returned' });
  borrowing.status     = 'returned';
  borrowing.returnDate = new Date().toISOString().split('T')[0];
  const book = books.find(b => b.id === borrowing.bookId);
  if (book) book.availableCopies++;
  res.json(borrowing);
});

// ───── Users ─────
app.get('/api/users', (_req, res) => {
  res.json(users.map(({ password: _pw, ...u }) => u));
});

// ───── Serve SPA for all other routes ─────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Library Management System running at http://0.0.0.0:${PORT}`);
});
