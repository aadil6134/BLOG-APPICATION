const express = require("express");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "blogs.db");
const PORT = process.env.PORT || 3000
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(PORT, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Enable CORS for all routes
app.use(cors({
  origin: "*"
}));

// Get all blogs
app.get("/", async (req, res) => {
  try {
    const getAllBlogsQuery = `SELECT * FROM Blogs`;
    const blogs = await db.all(getAllBlogsQuery);
    res.send(blogs);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// User registration
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM Users WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (!dbUser) {
    const createUserQuery = `
      INSERT INTO Users (username, email, password) 
      VALUES ('${username}', '${email}', '${hashedPassword}')
    `;
    const dbResponse = await db.run(createUserQuery);
    const newUserId = dbResponse.lastID;
    res.send(`Created new user with ${newUserId}`);
  } else {
    res.status(400).send("User already exists");
  }
});

// User login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const selectUserQuery = `SELECT * FROM Users WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (!dbUser) {
    res.status(400).send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      res.send({ jwtToken });
    } else {
      res.status(400).send("Invalid Password");
    }
  }
});

// Get blog by ID
app.get("/blogs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const getBlogQuery = `SELECT * FROM Blogs WHERE blog_id = ${id}`;
    const blog = await db.get(getBlogQuery);
    if (blog) {
      res.send(blog);
    } else {
      res.status(404).send("Blog not found");
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Create a new blog
app.post("/blogs", async (req, res) => {
  const { title, content, authorId } = req.body;
  try {
    const createBlogQuery = `
      INSERT INTO Blogs (title, content, author_id) 
      VALUES ('${title}', '${content}', ${authorId})
    `;
    const dbResponse = await db.run(createBlogQuery);
    const newBlogId = dbResponse.lastID;
    res.send(`Created new blog with ID ${newBlogId}`);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update a blog
app.put("/blogs/:id", async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const updateBlogQuery = `
      UPDATE Blogs 
      SET title = '${title}', content = '${content}' 
      WHERE blog_id = ${id}
    `;
    await db.run(updateBlogQuery);
    res.send(`Blog with ID ${id} updated successfully`);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Delete a blog
app.delete("/blogs/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleteBlogQuery = `DELETE FROM Blogs WHERE blog_id = ${id}`;
    await db.run(deleteBlogQuery);
    res.send(`Blog with ID ${id} deleted successfully`);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get comments for a blog
app.get("/blogs/:id/comments", async (req, res) => {
  const { id } = req.params;
  try {
    const getCommentsQuery = `SELECT * FROM Comments WHERE blog_id = ${id}`;
    const comments = await db.all(getCommentsQuery);
    res.send(comments);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Add a comment to a blog
app.post("/blogs/:id/comments", async (req, res) => {
  const { id } = req.params;
  const { content, userId, createdAt } = req.body;
  try {
    const addCommentQuery = `
      INSERT INTO Comments (blog_id, user_id, comment_text, created_at) 
      VALUES (${id}, ${userId}, '${content}', '${createdAt}');
    `;
    const dbResponse = await db.run(addCommentQuery);
    const newCommentId = dbResponse.lastID;
    res.send(`Added new comment with ID ${newCommentId}`);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Get user profile by ID
app.get("/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const getUserQuery = `SELECT * FROM Users WHERE user_id = ${id}`;
    const user = await db.get(getUserQuery);
    if (user) {
      res.send(user);
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Update user profile
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { username, email } = req.body;
  try {
    const updateUserQuery = `
      UPDATE Users 
      SET username = '${username}', email = '${email}'
      WHERE user_id = ${id}
    `;
    await db.run(updateUserQuery);
    res.send(`User with ID ${id} updated successfully`);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});
