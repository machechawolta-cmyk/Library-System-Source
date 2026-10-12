import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import './App.css'

const STORAGE_KEYS = {
  books: 'library-books',
  users: 'library-users',
  transactions: 'library-transactions',
  activeUser: 'library-active-user',
}

const seededBooks = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Classic', isbn: '978-0743273565', quantity: 3 },
  { id: 2, title: 'Atomic Habits', author: 'James Clear', genre: 'Self-help', isbn: '978-0735211292', quantity: 1 },
  { id: 3, title: 'Clean Code', author: 'Robert C. Martin', genre: 'Technology', isbn: '978-0132350884', quantity: 5 },
  { id: 4, title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Romance', isbn: '978-1503290563', quantity: 2 },
]

const seededUsers = [
  { id: 1, name: 'Mpho T', membershipId: 'LIB-101', role: 'Librarian' },
  { id: 2, name: 'Alice N', membershipId: 'LIB-102', role: 'Staff' },
  { id: 3, name: 'Bongani M', membershipId: 'LIB-103', role: 'Member' },
]

const seededTransactions = [
  { id: 1, bookId: 1, description: 'New shipment received', type: 'Add', quantity: 2, date: '2026-08-10' },
  { id: 2, bookId: 2, description: 'Borrowed by Member', type: 'Deduct', quantity: 1, date: '2026-08-11' },
]

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

const emptyBookForm = { title: '', author: '', genre: '', isbn: '', quantity: '1' }
const emptyUserForm = { name: '', membershipId: '', role: 'Member' }

function App() {
  const [books, setBooks] = useState(() => readStorage(STORAGE_KEYS.books, seededBooks))
  const [users, setUsers] = useState(() => readStorage(STORAGE_KEYS.users, seededUsers))
  const [transactions, setTransactions] = useState(() => readStorage(STORAGE_KEYS.transactions, seededTransactions))
  const [currentUser, setCurrentUser] = useState(() => readStorage(STORAGE_KEYS.activeUser, null))
  const [loginForm, setLoginForm] = useState({ membershipId: '', name: '' })
  const [bookForm, setBookForm] = useState(emptyBookForm)
  const [userForm, setUserForm] = useState(emptyUserForm)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.books, JSON.stringify(books))
  }, [books])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.activeUser, JSON.stringify(currentUser))
    } else {
      localStorage.removeItem(STORAGE_KEYS.activeUser)
    }
  }, [currentUser])

  const lowStockBooks = useMemo(
    () => books.filter((book) => Number(book.quantity) < 2),
    [books],
  )

  const totalCopies = useMemo(
    () => books.reduce((total, book) => total + Number(book.quantity), 0),
    [books],
  )

  const handleBookSubmit = (event) => {
    event.preventDefault()

    const quantity = Number(bookForm.quantity)
    const cleanTitle = bookForm.title.trim()
    const cleanAuthor = bookForm.author.trim()
    const cleanGenre = bookForm.genre.trim()
    const isbn = bookForm.isbn.trim()
    if (!cleanTitle || !cleanAuthor || !cleanGenre || !isbn) {
      setNotice({ type: 'error', text: 'Complete every book field before saving.' })
      return
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      setNotice({ type: 'error', text: 'Initial quantity must be a whole number of at least one.' })
      return
    }
    if (books.some((book) => book.isbn.toLowerCase() === isbn.toLowerCase())) {
      setNotice({ type: 'error', text: 'A book with that ISBN already exists.' })
      return
    }

    const newBook = {
      id: Date.now(),
      title: cleanTitle,
      author: cleanAuthor,
      genre: cleanGenre,
      isbn,
      quantity,
    }

    setBooks((current) => [newBook, ...current])
    setBookForm(emptyBookForm)
    setNotice({ type: 'success', text: `${newBook.title} was added to the catalogue.` })
  }

  const updateBook = (bookId, fields) => {
    const cleanFields = {
      title: fields.title.trim(),
      author: fields.author.trim(),
      genre: fields.genre.trim(),
      isbn: fields.isbn.trim(),
    }
    if (!cleanFields.title || !cleanFields.author || !cleanFields.genre || !cleanFields.isbn) {
      setNotice({ type: 'error', text: 'Book details cannot be blank.' })
      return false
    }
    const duplicateIsbn = books.some(
      (book) =>
        book.id !== bookId &&
        book.isbn.toLowerCase() === cleanFields.isbn.toLowerCase(),
    )
    if (duplicateIsbn) {
      setNotice({ type: 'error', text: 'Another book already uses that ISBN.' })
      return false
    }

    setBooks((current) =>
      current.map((book) =>
        book.id === bookId
          ? { ...book, ...cleanFields }
          : book,
      ),
    )
    setNotice({ type: 'success', text: 'Book details were updated.' })
    return true
  }

  const deleteBook = (bookId) => {
    const book = books.find((item) => item.id === bookId)
    if (!book || !window.confirm(`Delete "${book.title}" from the catalogue?`)) return

    setBooks((current) => current.filter((book) => book.id !== bookId))
    setNotice({ type: 'success', text: `${book.title} was deleted.` })
  }

  const addTransaction = (bookId, type, quantity, description) => {
    const parsedQty = Number(quantity)
    const book = books.find((item) => item.id === bookId)
    if (!book) {
      setNotice({ type: 'error', text: 'That book is no longer in the catalogue.' })
      return false
    }
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      setNotice({ type: 'error', text: 'Enter a whole-number quantity greater than zero.' })
      return false
    }
    if (type === 'Deduct' && parsedQty > book.quantity) {
      setNotice({ type: 'error', text: `Only ${book.quantity} ${book.quantity === 1 ? 'copy is' : 'copies are'} available.` })
      return false
    }

    setBooks((current) =>
      current.map((book) => {
        if (book.id !== bookId) return book

        const nextQuantity = type === 'Add' ? book.quantity + parsedQty : book.quantity - parsedQty
        return { ...book, quantity: nextQuantity }
      }),
    )

    setTransactions((current) => [
      {
        id: Date.now(),
        bookId,
        description,
        type,
        quantity: parsedQty,
        date: new Date().toISOString().slice(0, 10),
      },
      ...current,
    ])
    setNotice({ type: 'success', text: `${parsedQty} ${parsedQty === 1 ? 'copy' : 'copies'} ${type === 'Add' ? 'added to' : 'deducted from'} ${book.title}.` })
    return true
  }

  const handleUserSubmit = (event) => {
    event.preventDefault()

    const cleanName = userForm.name.trim()
    const cleanMembershipId = userForm.membershipId.trim()
    if (!cleanName || !cleanMembershipId) {
      setNotice({ type: 'error', text: 'Enter a name and membership ID.' })
      return
    }
    if (users.some((user) => user.membershipId.toLowerCase() === cleanMembershipId.toLowerCase())) {
      setNotice({ type: 'error', text: 'That membership ID is already in use.' })
      return
    }

    setUsers((current) => [
      {
        id: Date.now(),
        name: cleanName,
        membershipId: cleanMembershipId,
        role: userForm.role,
      },
      ...current,
    ])
    setUserForm(emptyUserForm)
    setNotice({ type: 'success', text: `${cleanName} was added as a ${userForm.role.toLowerCase()}.` })
  }

  const updateUser = (userId, fields) => {
    const cleanFields = {
      name: fields.name.trim(),
      membershipId: fields.membershipId.trim(),
      role: fields.role,
    }
    if (!cleanFields.name || !cleanFields.membershipId) {
      setNotice({ type: 'error', text: 'User name and membership ID cannot be blank.' })
      return false
    }
    const existingUser = users.find((user) => user.id === userId)
    if (
      existingUser?.role === 'Librarian' &&
      cleanFields.role !== 'Librarian' &&
      users.filter((user) => user.role === 'Librarian').length === 1
    ) {
      setNotice({ type: 'error', text: 'Keep at least one librarian account so user management remains available.' })
      return false
    }
    const duplicateId = users.some(
      (user) =>
        user.id !== userId &&
        user.membershipId.toLowerCase() === cleanFields.membershipId.toLowerCase(),
    )
    if (duplicateId) {
      setNotice({ type: 'error', text: 'Another user already has that membership ID.' })
      return false
    }

    setUsers((current) =>
      current.map((user) =>
        user.id === userId ? { ...user, ...cleanFields } : user,
      ),
    )
    if (currentUser?.id === userId) {
      setCurrentUser((user) => ({ ...user, ...cleanFields }))
    }
    setNotice({ type: 'success', text: 'User details were updated.' })
    return true
  }

  const deleteUser = (userId) => {
    const user = users.find((item) => item.id === userId)
    if (!user) return
    if (user.role === 'Librarian' && users.filter((item) => item.role === 'Librarian').length === 1) {
      setNotice({ type: 'error', text: 'Keep at least one librarian account so user management remains available.' })
      return
    }
    if (!window.confirm(`Delete ${user.name}'s account?`)) return

    setUsers((current) => current.filter((user) => user.id !== userId))
    if (currentUser && currentUser.id === userId) setCurrentUser(null)
    setNotice({ type: 'success', text: `${user.name}'s account was deleted.` })
  }

  const handleLogin = (event) => {
    event.preventDefault()
    const matchingUser = users.find(
      (user) =>
        user.membershipId.toLowerCase() === loginForm.membershipId.trim().toLowerCase() &&
        user.name.toLowerCase() === loginForm.name.trim().toLowerCase(),
    )

    if (matchingUser) {
      setCurrentUser(matchingUser)
      setLoginForm({ membershipId: '', name: '' })
      setNotice({ type: 'success', text: `Welcome, ${matchingUser.name}.` })
    } else {
      setNotice({ type: 'error', text: 'Those login details do not match a library account.' })
    }
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand-block">
            <p className="eyebrow">Community Library</p>
            <h1>LibraryFlow</h1>
          </div>

          <nav className="nav-menu">
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/books">Books</NavLink>
            <NavLink to="/transactions">Transactions</NavLink>
            <NavLink to="/users">Users</NavLink>
          </nav>

          <div className="status-panel">
            <span>Logged in</span>
            <strong>{currentUser ? currentUser.name : 'Guest'}</strong>
            <small>{currentUser ? currentUser.role : 'Sign in to manage library data'}</small>
          </div>
        </aside>

        <main className="main-panel">
          <header className="topbar">
            <div>
              <p className="eyebrow">Overview</p>
              <h2>Library Management System</h2>
            </div>
            {currentUser ? (
              <button className="logout-btn" onClick={() => {
                setCurrentUser(null)
                setNotice({ type: 'success', text: 'You have been logged out.' })
              }}>
                Log out
              </button>
            ) : null}
          </header>

          {notice ? (
            <div className={`notice ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>
              <span>{notice.text}</span>
              <button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}>×</button>
            </div>
          ) : null}

          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  books={books}
                  totalCopies={totalCopies}
                  lowStockBooks={lowStockBooks}
                  transactions={transactions}
                  currentUser={currentUser}
                />
              }
            />
            <Route
              path="/books"
              element={
                <BooksPage
                  books={books}
                  bookForm={bookForm}
                  setBookForm={setBookForm}
                  handleBookSubmit={handleBookSubmit}
                  updateBook={updateBook}
                  deleteBook={deleteBook}
                  currentUser={currentUser}
                />
              }
            />
            <Route
              path="/transactions"
              element={
                <TransactionsPage
                  books={books}
                  transactions={transactions}
                  addTransaction={addTransaction}
                  currentUser={currentUser}
                />
              }
            />
            <Route
              path="/users"
              element={
                <UsersPage
                  users={users}
                  loginForm={loginForm}
                  setLoginForm={setLoginForm}
                  handleLogin={handleLogin}
                  userForm={userForm}
                  setUserForm={setUserForm}
                  handleUserSubmit={handleUserSubmit}
                  updateUser={updateUser}
                  deleteUser={deleteUser}
                  currentUser={currentUser}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function Dashboard({ books, totalCopies, lowStockBooks, transactions, currentUser }) {
  return (
    <div className="page-grid">
      <section className="stats-grid">
        <div className="stat-card">
          <span>Total Books</span>
          <strong>{books.length}</strong>
        </div>
        <div className="stat-card">
          <span>Copies in Stock</span>
          <strong>{totalCopies}</strong>
        </div>
        <div className="stat-card warning">
          <span>Low Stock</span>
          <strong>{lowStockBooks.length}</strong>
        </div>
        <div className="stat-card">
          <span>Transactions</span>
          <strong>{transactions.length}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <h3>Current availability</h3>
          <span>{currentUser ? `Welcome ${currentUser.name}` : 'Login to manage records'}</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Genre</th>
                <th>Quantity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id} className={Number(book.quantity) < 2 ? 'low-stock' : ''}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.genre}</td>
                  <td>{book.quantity}</td>
                  <td>
                    <span className={`badge ${Number(book.quantity) < 2 ? 'warning' : 'safe'}`}>
                      {Number(book.quantity) < 2 ? 'Low stock' : 'Available'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function BooksPage({ books, bookForm, setBookForm, handleBookSubmit, updateBook, deleteBook, currentUser }) {
  const [bookEdits, setBookEdits] = useState({})
  const canManageInventory = currentUser?.role === 'Staff' || currentUser?.role === 'Librarian'

  return (
    <div className="page-grid two-columns">
      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Add a book</h3>
            <p className="panel-hint">Add a title to the community catalogue.</p>
          </div>
        </div>

        {canManageInventory ? <form className="form-grid" onSubmit={handleBookSubmit}>
          <label>
            Title
            <input value={bookForm.title} onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })} maxLength="120" required />
          </label>
          <label>
            Author
            <input value={bookForm.author} onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })} maxLength="100" required />
          </label>
          <label>
            Genre
            <input value={bookForm.genre} onChange={(event) => setBookForm({ ...bookForm, genre: event.target.value })} maxLength="60" required />
          </label>
          <label>
            ISBN
            <input value={bookForm.isbn} onChange={(event) => setBookForm({ ...bookForm, isbn: event.target.value })} maxLength="20" required />
          </label>
          <label>
            Initial Quantity
            <input type="number" min="1" step="1" value={bookForm.quantity} onChange={(event) => setBookForm({ ...bookForm, quantity: event.target.value })} required />
          </label>
          <button type="submit" className="primary-btn">Add Book</button>
        </form> : (
          <div className="empty-state">Sign in with a staff or librarian account to add and edit books.</div>
        )}
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Book catalogue</h3>
            <p className="panel-hint">{books.length} {books.length === 1 ? 'title' : 'titles'} in the library</p>
          </div>
        </div>

        {books.length === 0 ? (
          <div className="empty-state">No books yet. Use the form to add the first title.</div>
        ) : (
          <div className="book-list">
            {books.map((book) => {
              const draft = bookEdits[book.id] ?? book

              return canManageInventory ? (
                <form
                  key={book.id}
                  className="book-card"
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (updateBook(book.id, draft)) {
                      setBookEdits((current) => {
                        const next = { ...current }
                        delete next[book.id]
                        return next
                      })
                    }
                  }}
                >
                  <div className="book-card-header">
                    <h4>{book.title}</h4>
                    <span className={`badge ${Number(book.quantity) < 2 ? 'warning' : 'safe'}`}>
                      {Number(book.quantity) < 2 ? 'Low stock' : 'In stock'}
                    </span>
                  </div>

                  <div className="book-details">
                    <label>
                      Title
                      <input value={draft.title} maxLength="120" required onChange={(event) =>
                        setBookEdits((current) => ({ ...current, [book.id]: { ...draft, title: event.target.value } }))
                      } />
                    </label>
                    <label>
                      Author
                      <input value={draft.author} maxLength="100" required onChange={(event) =>
                        setBookEdits((current) => ({ ...current, [book.id]: { ...draft, author: event.target.value } }))
                      } />
                    </label>
                    <label>
                      Genre
                      <input value={draft.genre} maxLength="60" required onChange={(event) =>
                        setBookEdits((current) => ({ ...current, [book.id]: { ...draft, genre: event.target.value } }))
                      } />
                    </label>
                    <label>
                      ISBN
                      <input value={draft.isbn} maxLength="20" required onChange={(event) =>
                        setBookEdits((current) => ({ ...current, [book.id]: { ...draft, isbn: event.target.value } }))
                      } />
                    </label>
                  </div>

                  <p className="stock-summary">Current stock: <strong>{book.quantity}</strong></p>
                  <div className="mini-form">
                    <button type="submit" className="secondary-btn">Save changes</button>
                    {bookEdits[book.id] ? (
                      <button type="button" className="secondary-btn" onClick={() =>
                        setBookEdits((current) => {
                          const next = { ...current }
                          delete next[book.id]
                          return next
                        })
                      }>Cancel</button>
                    ) : null}
                    <button type="button" className="secondary-btn danger" onClick={() => deleteBook(book.id)}>
                      Delete
                    </button>
                  </div>
                </form>
              ) : (
                  <article key={book.id} className="book-card">
                    <div className="book-card-header">
                      <h4>{book.title}</h4>
                      <span className={`badge ${Number(book.quantity) < 2 ? 'warning' : 'safe'}`}>
                        {Number(book.quantity) < 2 ? 'Low stock' : 'In stock'}
                      </span>
                    </div>
                    <div className="book-details">
                      <p><strong>Author:</strong> {book.author}</p>
                      <p><strong>Genre:</strong> {book.genre}</p>
                      <p><strong>ISBN:</strong> {book.isbn}</p>
                    </div>
                    <p className="stock-summary">Current stock: <strong>{book.quantity}</strong></p>
                  </article>
                )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function TransactionsPage({ books, transactions, addTransaction, currentUser }) {
  const canManageInventory = currentUser?.role === 'Staff' || currentUser?.role === 'Librarian'

  return (
    <div className="page-grid two-columns">
      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Stock management</h3>
            <p className="panel-hint">Record incoming copies and books borrowed.</p>
          </div>
        </div>

        {books.length === 0 ? (
          <div className="empty-state">Add a book before recording stock transactions.</div>
        ) : !canManageInventory ? (
          <div className="empty-state">Sign in with a staff or librarian account to record stock changes.</div>
        ) : (
          <div className="transaction-list">
            {books.map((book) => (
              <StockControls key={book.id} book={book} addTransaction={addTransaction} />
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <h3>Transaction history</h3>
            <p className="panel-hint">{transactions.length} recorded {transactions.length === 1 ? 'transaction' : 'transactions'}</p>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">No transactions recorded yet.</div>
        ) : (
          <div className="history-list">
            {transactions.map((entry) => {
              const book = books.find((item) => item.id === entry.bookId)
              return (
                <div key={entry.id} className="history-item">
                  <div>
                    <strong className={`transaction-type ${entry.type === 'Add' ? 'added' : 'deducted'}`}>{entry.type}</strong>
                    <span>{book ? book.title : 'Deleted book'}</span>
                  </div>
                  <small>{entry.description}</small>
                  <small>{entry.date} · {entry.quantity} {entry.quantity === 1 ? 'copy' : 'copies'}</small>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function StockControls({ book, addTransaction }) {
  const [quantity, setQuantity] = useState('1')
  const [description, setDescription] = useState('')

  const submit = (type) => {
    if (addTransaction(book.id, type, quantity, description.trim() || (type === 'Add' ? 'Stock arrival' : 'Book borrowed'))) {
      setQuantity('1')
      setDescription('')
    }
  }

  return (
    <div className="transaction-card">
      <div className="transaction-title">
        <h4>{book.title}</h4>
        <small>{book.quantity} {book.quantity === 1 ? 'copy' : 'copies'} available</small>
      </div>
      <div className="transaction-actions">
        <label className="compact-field">
          Quantity
          <input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </label>
        <label className="compact-field">
          Note
          <input value={description} maxLength="100" placeholder="Optional note" onChange={(event) => setDescription(event.target.value)} />
        </label>
        <button type="button" className="secondary-btn" onClick={() => submit('Add')}>Add stock</button>
        <button type="button" className="secondary-btn danger" disabled={book.quantity < 1} onClick={() => submit('Deduct')}>Record borrowing</button>
      </div>
    </div>
  )
}

function UsersPage({ users, loginForm, setLoginForm, handleLogin, userForm, setUserForm, handleUserSubmit, updateUser, deleteUser, currentUser }) {
  const [userEdits, setUserEdits] = useState({})
  const isLibrarian = currentUser?.role === 'Librarian'

  return (
    <div className="page-grid two-columns">
      <section className="panel">
        <div className="section-header">
          <h3>Login</h3>
        </div>

        {currentUser ? (
          <div className="signed-in-state">
            <span className="signed-in-icon">✓</span>
            <div>
              <strong>Signed in as {currentUser.name}</strong>
              <p>{currentUser.role} · {currentUser.membershipId}</p>
            </div>
          </div>
        ) : (
          <>
            <form className="form-grid" onSubmit={handleLogin}>
              <label>
                Name
                <input autoComplete="name" value={loginForm.name} onChange={(event) => setLoginForm({ ...loginForm, name: event.target.value })} required />
              </label>
              <label>
                Membership ID
                <input autoComplete="username" value={loginForm.membershipId} onChange={(event) => setLoginForm({ ...loginForm, membershipId: event.target.value })} required />
              </label>
              <button type="submit" className="primary-btn">Sign in</button>
            </form>
            <p className="panel-hint demo-hint">Demo librarian: Mpho T · LIB-101</p>
          </>
        )}
      </section>

      <section className="panel full-width">
        <div className="section-header">
          <div>
            <h3>User management</h3>
            <p className="panel-hint">Librarian access required to add or edit accounts.</p>
          </div>
          {isLibrarian ? <span>{users.length} registered {users.length === 1 ? 'user' : 'users'}</span> : null}
        </div>

        {!isLibrarian ? (
          <div className="empty-state">Sign in with a librarian account to manage the user directory.</div>
        ) : (
          <>
            <form className="user-create-form" onSubmit={handleUserSubmit}>
              <label>
                Name
                <input value={userForm.name} maxLength="80" onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} required />
              </label>
              <label>
                Membership ID
                <input value={userForm.membershipId} maxLength="30" onChange={(event) => setUserForm({ ...userForm, membershipId: event.target.value })} required />
              </label>
              <label>
                Role
                <select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>
                  <option value="Member">Member</option>
                  <option value="Staff">Staff</option>
                  <option value="Librarian">Librarian</option>
                </select>
              </label>
              <button type="submit" className="primary-btn">Add user</button>
            </form>

            {users.length === 0 ? (
              <div className="empty-state">No user accounts. Add an account above.</div>
            ) : (
              <div className="user-list">
                {users.map((user) => {
                  const draft = userEdits[user.id] ?? user
                  return (
                    <form
                      key={user.id}
                      className="user-card"
                      onSubmit={(event) => {
                        event.preventDefault()
                        if (updateUser(user.id, draft)) {
                          setUserEdits((current) => {
                            const next = { ...current }
                            delete next[user.id]
                            return next
                          })
                        }
                      }}
                    >
                      <div className="user-edit-fields">
                        <label>
                          Name
                          <input value={draft.name} maxLength="80" required onChange={(event) =>
                            setUserEdits((current) => ({ ...current, [user.id]: { ...draft, name: event.target.value } }))
                          } />
                        </label>
                        <label>
                          Membership ID
                          <input value={draft.membershipId} maxLength="30" required onChange={(event) =>
                            setUserEdits((current) => ({ ...current, [user.id]: { ...draft, membershipId: event.target.value } }))
                          } />
                        </label>
                        <label>
                          Role
                          <select value={draft.role} onChange={(event) =>
                            setUserEdits((current) => ({ ...current, [user.id]: { ...draft, role: event.target.value } }))
                          }>
                            <option value="Member">Member</option>
                            <option value="Staff">Staff</option>
                            <option value="Librarian">Librarian</option>
                          </select>
                        </label>
                      </div>
                      <div className="mini-form">
                        <button type="submit" className="secondary-btn">Save user</button>
                        {userEdits[user.id] ? (
                          <button type="button" className="secondary-btn" onClick={() =>
                            setUserEdits((current) => {
                              const next = { ...current }
                              delete next[user.id]
                              return next
                            })
                          }>Cancel</button>
                        ) : null}
                        <button type="button" className="secondary-btn danger" onClick={() => deleteUser(user.id)}>Delete</button>
                      </div>
                    </form>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default App
