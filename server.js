const mysql = require("mysql2");
const express = require("express");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
require('dotenv').config();

const app = express();
app.use("/assets", express.static("assets"));

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_ROOT,
  password: process.env.DB_PASSWORD,
  database: "forms",
  authPlugins: {
    mysql_clear_password: () => () => Buffer.from(password + "\0"),
  },
});

// Connect to the database
connection.connect((error) => {
  if (error) throw error;
  else console.log("Connected to the database successfully!");
});


let cust;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/", encoder, (req, res) => {
  let username = req.body.username;
  let password = req.body.password;

  connection.query(
    "SELECT * FROM login WHERE username = ? AND password = ?",
    [username, password],
    function (error, results, fields) {
      if (results.length > 0) {
        if (results[0].username === "admin") {
          res.redirect("/admin_view");
          console.log("logged in successfully!");
        } else {
          cust = results[0].username;
          res.redirect(`/customer_form/${results[0].username}`);
        }
      } else {
        res.redirect("/");
        console.log("log in failed:(\nWrong username or password");
      }
      res.end();
    }
  );
});

// When login is successful
app.get("/admin_view", (req, res) => {
  res.sendFile(__dirname + "/admin_view.html");
});

function generateTableHTML(data) {
  console.log(data);
  let q = data[0].quantity + data[1].quantity;
  let w = data[0].weight + data[1].weight;
  let b = data[0].box_count + data[1].box_count;

  let tableHTML = `
    <table>
      <tr>
        <th>Item/Customer</th>
        <th>Quantity</th>
        <th>Weight</th>
        <th>Box Count</th>
      </tr>`;
  let total = `
    <tr>
      <td>Total</td>
      <td>${q}</td>
      <td>${w}</td>
      <td>${b}</td>
    </tr>`;

  data.forEach((row) => {
    tableHTML = tableHTML + `
      <tr>
        <td>${row.id}</td>
        <td>${row.quantity}</td>
        <td>${row.weight}</td>
        <td>${row.box_count}</td>
      </tr>`;
  });
  tableHTML = tableHTML +total + `</table>`  ;
  return tableHTML;
}

app.get("/admin_view/table", (req, res) => {
  connection.query(
    "SELECT id, quantity, weight, box_count FROM data",
    function (error, results, fields) {
      if (error) throw error;
      res.send(generateTableHTML(results)); // Generate and send the HTML table
    }
  );
});

// customer form
app.get("/customer_form/:cust", (req, res) => {
  res.sendFile(__dirname + "/customer_form.html");
});

app.post("/customer_form/:cust", encoder, (req, res) => {
  let orderDate = req.body.orderDate;
  let company = req.body.company;
  let owner = req.body.owner;
  let item = req.body.item;
  let quantity = req.body.quantity;
  let weight = req.body.weight;
  let request = req.body.request;
  let trackingId = req.body.trackingId;
  let shipmentSize = req.body.shipmentSize;
  let boxCount = req.body.boxCount;
  let specification = req.body.specification;
  let checklistQuantity = req.body.checklistQuantity;

  connection.query(
    "UPDATE data SET order_date = ?, company = ?, owner = ?, item = ?, quantity = ?, weight = ?, request = ?, tracking_id = ?, shipment_size = ?, box_count = ?, specification = ?, checklist_quantity = ? WHERE id = ?",
    [
      orderDate,
      company,
      owner,
      item,
      quantity,
      weight,
      request,
      trackingId,
      shipmentSize,
      boxCount,
      specification,
      checklistQuantity,
      cust
    ],
    function (error, results, fields) {
      if (error) throw error;
      if (results.affectedRows === 0) {
        connection.query(
          "INSERT INTO data (id, order_date, company, owner, item, quantity, weight, request, tracking_id, shipment_size, box_count, specification, checklist_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            cust,
            orderDate,
            company,
            owner,
            item,
            quantity,
            weight,
            request,
            trackingId,
            shipmentSize,
            boxCount,
            specification,
            checklistQuantity
          ],
          function (error, results, fields) {
            if (error) {
              console.log(error);
            }
            console.log("Form data saved successfully!");
            res.redirect("/");
          }
        );
      } else {
        console.log("Form data updated successfully!");
        res.redirect("/");
      }
    }
  );
});

// Set app port
const port = process.env.WEB_PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Server running at http://localhost:${port}/`);
});
