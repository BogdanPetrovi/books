import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const db = new pg.Client({
  user:"postgres",
  host:"localhost",
  database:"Knjiga",
  password:"gibo",
  port:5432,
});

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


async function getISBN(newBook) {
    const bookName = newBook;
    const result = await axios.get(`https://openlibrary.org/search.json?title=${bookName}`);
    const isbn = result.data.docs[0].isbn[0];
    return isbn;
}

db.connect();

app.get("/", async (req,res) => {
    try {
        const result = await db.query("SELECT * FROM readed_books JOIN reviews ON reviews.id = readed_books.id ORDER BY date DESC;");
        const data = result.rows;
        res.render("index.ejs", {data: data} );
    } catch (error) {
        console.log(error);
        res.render("index.ejs", {error: "Counldn't find any books... Try again later."});
    }
});

app.get("/title", async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM readed_books JOIN reviews ON reviews.id = readed_books.id ORDER BY name ASC;");
        const data = result.rows;
        res.render("index.ejs", {data: data} );
    } catch (error) {
        console.log(error);
        res.render("index.ejs", {error: "Counldn't find any books... Try again later."});
    }
});

app.get("/new", (req,res) => {
    res.render("add.ejs");
});

app.post("/add", async (req,res) => {
    const bookName = req.body["add"];
    const review = req.body["review"];
    try {
        const isbn = await getISBN(req.body["add"]);
        const d = new Date().toString();
        const date = d.substring(4,15);
        try {
            const result = await db.query("INSERT INTO readed_books (name,isbn,date) VALUES ($1, $2, $3) RETURNING *;", [bookName, isbn, date]);
            const id = result.rows[0].id;
            await db.query("INSERT INTO reviews (id, review) VALUES ($1, $2)", [id, review]);
            res.redirect("/");
        } catch (error) {
            console.log(error);
            res.send(error);
        }
    } catch (error) {
        console.log(error);
        res.render("add.ejs", {notFound: "Book not found! Check spelling carefully and try again please!", name:bookName, review:review});

    }
    

});

app.post("/all", async (req,res) => {
    try {
        const bookId = req.body.id;
        const result = await db.query(`SELECT * FROM readed_books JOIN reviews ON reviews.id = readed_books.id WHERE readed_books.id = ${bookId};`);
        res.render("all.ejs", {data: result.rows});
    } catch (error) {
        console.log(error);
        res.redirect("/");
    }    
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
