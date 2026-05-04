const express = require("express");
const { DatabaseSync } = require("node:sqlite");
const db = new DatabaseSync("./chinook.db");
const app = express();
app.use(express.json());
// Test route: list all tables in the database
app.get('/tables', (req, res) => {
    const stmt = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    res.json(stmt.all());
});

//Part C Answers
app.get('/artists', (req, res) => {
    const stmt = db.prepare(
        "SELECT * FROM Artist"
    );
    res.json(stmt.all());
});

app.get('/artists/:id/albums', (req, res) => {
    const stmt = db.prepare(
        "SELECT Album.AlbumId, Album.Title FROM Album WHERE Album.ArtistId = ?"
    );
    const albums = stmt.all(Number(req.params.id));
    res.json(albums);
});

app.get('/tracks/long', (req, res) => {
    const stmt = db.prepare(
        "SELECT Track.Name, Track.AlbumId, Track.Milliseconds FROM Track JOIN Album ON Track.AlbumId = Album.AlbumId WHERE Track.Milliseconds > 300000"
    );
    res.json(stmt.all());
});

app.get('/genres/:id/stats', (req, res) => {
    const stmt = db.prepare(`
    SELECT Genre.Name, COUNT(*) AS TrackCount, AVG(Track.Milliseconds) / 1000 AS AvgDurationSeconds
    FROM Track
    JOIN Genre ON Track.GenreId = Genre.GenreId
    WHERE Track.GenreId = ?
    GROUP BY Genre.GenreId
  `);
    res.json(stmt.get(Number(req.params.id)));
});

app.get('/tracks/long', (req, res) => {
    const stmt = db.prepare(
        "SELECT Track.Name, Track.AlbumId, Track.Milliseconds FROM Track JOIN Album ON Track.AlbumId = Album.AlbumId WHERE Track.Milliseconds > 300000"
    );
    res.json(stmt.all());
});

app.post('/playlists', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const stmt = db.prepare('INSERT INTO playlists (name) VALUES (?)');
  const result = stmt.run(name);

  res.status(201).json({ id: result.lastInsertRowid });
});

app.delete('/playlists/:id', (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare('DELETE FROM playlists WHERE id = ?');
  const result = stmt.run(id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Playlist not found' });
  }

  res.json({ message: `Playlist ${id} deleted successfully` });
});

// Part D challenges questions 

app.get('/invoices/top-customers', (req, res) => {
  const stmt = db.prepare(`
    SELECT Customer.FirstName, Customer.LastName, SUM(Invoice.Total) AS total
    FROM Invoice
    JOIN Customer ON Invoice.CustomerId = Customer.CustomerId
    GROUP BY Invoice.CustomerId
    ORDER BY total DESC
    LIMIT 5
  `);
  const customers = stmt.all();
  res.json(customers);
});

app.get('/search', (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  const stmt = db.prepare(`
    SELECT Track.Name AS track, Artist.Name AS artist, Genre.Name AS genre
    FROM Track
    JOIN Album ON Track.AlbumId = Album.AlbumId
    JOIN Artist ON Album.ArtistId = Artist.ArtistId
    JOIN Genre ON Track.GenreId = Genre.GenreId
    WHERE Track.Name LIKE ?
       OR Artist.Name LIKE ?
       OR Genre.Name LIKE ?
  `);

  const results = stmt.all(`%${q}%`, `%${q}%`, `%${q}%`);
  res.json(results);
});

app.put('/tracks/:id/price', (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  if (price === undefined || typeof price !== 'number' || price <= 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }

  const stmt = db.prepare('UPDATE tracks SET UnitPrice = ? WHERE TrackId = ?');
  const result = stmt.run(price, id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Track not found' });
  }

  res.json({ message: `Track ${id} price updated to $${price}` });
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
