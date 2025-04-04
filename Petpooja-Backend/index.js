const express = require('express');
var cors = require('cors');
const connection = require('./connection');

// after making post api for testing write this
const userRoute = require('./routes/user');
const categoryRoute = require('./routes/category');
const productRoute = require('./routes/product');
const billRoute = require('./routes/bill');
const dashboardRoute = require('./routes/dashboard');

const app = express();
app.use(cors());
app.use(express.urlencoded({extended:true}));
app.use(express.json());

//after making api of post
app.use('/user',userRoute);
app.use('/category', categoryRoute);
app.use('/product', productRoute);
app.use('/bill', billRoute);
app.use('/dashboard', dashboardRoute);

// app.get('/', (req, res) => {
//     res.send("Server is running");
//     console.log("checking only");
// });

module.exports = app;