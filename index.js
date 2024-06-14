import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Abcd123@",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


let result = await db.query("SELECT * FROM users");
let users= result.rows;
let currentUserId = 1;
let currentUser=users[0];
let mesg="Enter Country name";

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON users.id=visited_countries.user_id where user_id= $1", [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getCurrentUser(){
  const result= await db.query("SELECT * FROM users");
  result.rows.forEach((USER)=>{
    if (USER.id==currentUserId){
      currentUser=USER;
    }
  })
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  await getCurrentUser ();
  console.log(currentUserId);
  console.log(countries);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
    error: mesg
  });
  mesg="Enter Country Name";
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name)=$1",
      [input.toLowerCase()]
    );
    if (result.rows.length!==0){

    const data = result.rows[0];
    const countryCode = data.country_code;
    const countries=await checkVisisted();
    if (countries.includes(countryCode)){
      mesg="This Country already exists";
      res.redirect("/");
    }
    else{
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }}
  } else {
    mesg="Invalid Country Name";
    res.redirect("/");
  }
});
app.post("/user", async (req, res) => {
  if (req.body.add=="new"){
    res.render("new.ejs");
  }
  else{
  currentUserId= req.body.user;
  res.redirect('/');
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const userName= req.body.name;
  const userColor= req.body.color;
  console.log(userName, userColor);
  const result= await db.query("INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;", [userName, userColor]);
  console.log(result.rows[0]);
  currentUserId= result.rows[0].id;
  users.push(result.rows[0]);
  console.log(users);
  
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
