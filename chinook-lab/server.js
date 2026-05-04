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

app.post("/playlists", (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: "name is required" });
    }
    const stmt = db.prepare("INSERT INTO Playlist (Name) VALUES (?)");
    const result = stmt.run(name);
    res.status(201).json({
        id: Number(result.lastInsertRowid),
        name: name,
    });
});


app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});