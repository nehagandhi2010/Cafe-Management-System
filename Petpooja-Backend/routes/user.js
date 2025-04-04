const express = require('express');

const connection = require('../connection');
const router = express.Router();

//for jwt token (json web token)
const jwt = require('jsonwebtoken');
require('dotenv').config();

//for forgot password
const nodemailer = require('nodemailer');

//for authentication and restrictions of token
var auth = require('../services/authentication');
var checkRole = require('../services/checkRole');

// router.get('/', (req, res) => {
//     res.send("Server is running");
// });

//api for signup
router.post('/signup', (req, res) => {
    let user = req.body;
    query = "select email, password, role, status from user where email=?"
    connection.query(query, [user.email], (err, results) => {
        if (!err) {
            if (results.length <= 0) {
                query = "insert into user(name, contactNumber, email, password, status, role) values (?,?,?,?, 'false', 'user')";
                connection.query(query, [user.name, user.contactNumber, user.email, user.password], (err, results) => {
                    if (!err) {
                        return res.status(200).json({
                            message: "Successfully Registered."
                        });
                    }
                    else {
                        return res.status(500).json(err);
                    }
                });
            }
            else {
                return res.status(400).json({ message: "Email Already Exists." });
            }
        }
        else {
            return res.status(500).json(err);
        }
    })
})

//api for login
router.post('/login', (req, res) => {
    const user = req.body;
    query = "select email,password,status,role from user where email = ?";
    connection.query(query, [user.email], (err, results) => {
        if (!err) {
            if (results.length <= 0 || results[0].password != user.password) {
                return res.status(401).json({
                    message: "Incorrect Username or Password"
                });
            }
            else if (results[0].status === 'false') {
                return res.status(401).json({
                    message: "Wait for Admin Approval"
                });
            }
            else if (results[0].password == user.password) {
                const response = {
                    email: results[0].email,
                    role: results[0].role
                }
                const accessToken = jwt.sign(response, process.env.ACCESS_TOKEN, { expiresIn: '8h' })
                res.status(200).json({
                    token: accessToken
                });
            }
            else {
                return res.status(400).json({
                    message: "Something went wrong. Please try again later"
                });
            }
        }
        else {
            return res.status(500).json(err);
        }
    })
})

//api for forgot password
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})

router.post('/forgotPassword', (req, res) => {
    const user = req.body;
    query = "select email, password from user where email = ?";
    connection.query(query, [user.email], (err, results) => {
        if (!err) {
            if (results.length <= 0) {
                console.log("Email is not present in database");
                return res.status(200).json({
                    message: "Password sent SUCCESSFULLY to your email"
                });
               
            }
            else {
                var mailOptions = {
                    from: process.env.EMAIL,
                    to: results[0].email,
                    subject: 'Password by Petpooja',
                    html: '<p><b>Your Login details for Petpooja</b><br><b>Email:</b>' + results[0].email + '<br><b>Password:</b>' + results[0].password + '<br><a href="http://localhost:4200/">Click here to login</a></p>'
                };
                console.log("Your Login details for Petpooja Email: " + results[0].email + " \nPassword:" + results[0].password + "\nClick here to login\n" + "http://localhost:4200/");
                
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log("Error In Email: " + error);
                    }
                    else {
                        console.log("Email sent:" + info.response);
                    }
                });

                return res.status(200).json({
                    message: "Password sent Successfully to your email."
                });
            }
        }
        else {
            return res.status(500).json(err);
        }
    })
})

//api for get all users
router.get('/get', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    var query = "select id, name , email, contactNumber, status from user where role = 'user'";
    connection.query(query, (err, results) => {
        if (!err) {
            return res.status(200).json(results);
        }
        else {
            return res.status(500).json(err);
        }
    });
})

//api for update the status of particular user
router.patch('/update', auth.authenticateToken, checkRole.checkRole, (req, res) => {
    let user = req.body;
    var query = "update user set status=? where id = ?";
    connection.query(query, [user.status, user.id], (err, results) => {
        if (!err) {
            if (results.affectedRows == 0) {
                return res.status(404).json({
                    message: "User id does not exists."
                });
            }
            return res.status(200).json({
                message: "User updated Successfully."
            })
        }
        else {
            return res.status(500).json(err);
        }
    })
})

//api for checkToken 
router.get('/checkToken', auth.authenticateToken, (req, res) => {
    return res.status(200).json({
        message: "true"
    })
})

//api for change Password
router.post('/changePassword', auth.authenticateToken, (req, res) => {
    const user = req.body;
    const email = res.locals.email;
    //Check if the old password matches
    var query = "select * from user where email = ? and password=?";
    connection.query(query, [email, user.oldPassword], (err, results) => {
        if (!err) {
            if (results.length <= 0) {
                return res.status(400).json({
                    message: "Incorrect Old Password"
                });
            }
            else if (results[0].password == user.oldPassword) {
                // query = "update user set password = ? and email = ?";
                query = "UPDATE user SET password = ? WHERE email = ?";
                connection.query(query, [user.newPassword, email], (err, results) => {
                    if (!err) {
                        return res.status(200).json({
                            message: "Password Updated Successfully."
                        })
                    }
                    else {
                        console.log("errpor: " + err);
                        return res.status(500).json(err);
                    }
                })
            }
            else {
                return res.status(400).json({
                    message: "Something went wrong. Please try again later."
                })
            }
        }
        else {
            return res.status(500).json(err);
        }
    })
})

module.exports = router;