// server.js
const express = require('express');
const app = express();
const db = require('./database');
const bodyParser = require('body-parser');

app.use(bodyParser.json());

// Routes
app.post('/register', (req, res) => {
    const { username, email, password_hash } = req.body;
    db.run(`INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)`,
        [username, email, password_hash],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ user_id: this.lastID });
        }
    );
});

app.post('/blogs', (req, res) => {
    const { user_id, title, content } = req.body;
    db.run(`INSERT INTO Blogs (user_id, title, content) VALUES (?, ?, ?)`,
        [user_id, title, content],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ blog_id: this.lastID });
        }
    );
});

app.post('/comments', (req, res) => {
    const { blog_id, user_id, comment_text } = req.body;
    db.run(`INSERT INTO Comments (blog_id, user_id, comment_text) VALUES (?, ?, ?)`,
        [blog_id, user_id, comment_text],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ comment_id: this.lastID });
        }
    );
});

app.get('/blogs/:id', (req, res) => {
    const { id } = req.params;
    db.get(`SELECT * FROM Blogs WHERE blog_id = ?`, [id], (err, blog) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        db.all(`SELECT * FROM Comments WHERE blog_id = ?`, [id], (err, comments) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ blog, comments });
        });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
