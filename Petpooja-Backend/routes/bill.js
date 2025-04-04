const express = require('express');
const connection = require('../connection');
const router = express.Router();

//for authentication and restrictions of token
var auth = require('../services/authentication');

let ejs = require('ejs');
let pdf = require('html-pdf');
let path = require('path');

var fs = require('fs');
var uuid = require('uuid');

// api for generate Report
router.post('/generateReport', auth.authenticateToken, (req, res) => {
    const generatedUuid = uuid.v1();
    const orderDetails = req.body;

    console.log("✅ Received Order Details:", orderDetails);

    var productDetailsReport = JSON.parse(orderDetails.productDetails);

    query = "insert into bill(name, uuid, email, contactNumber, paymentMethod, total, productDetails, createdBy) values (?,?,?,?,?,?,?,?)";

    // console.log("🔍 Executing SQL Query:", query);
    // console.log("📩 Query Parameters:", [
    //     orderDetails.name, generatedUuid, orderDetails.email,
    //     orderDetails.contactNumber, orderDetails.paymentMethod,
    //     orderDetails.total, orderDetails.productDetails, res.locals.email
    // ]);

    connection.query(query, [
        orderDetails.name, generatedUuid,
        orderDetails.email, orderDetails.contactNumber,
        orderDetails.paymentMethod, orderDetails.total,
        orderDetails.productDetails, res.locals.email], (err, results) => {
            if (err) {
                console.error("❌ SQL Error:", err);
                return res.status(500).json(err);
            } 
            // console.log("✅ SQL Query Executed Successfully!");

            // console.log("📄 Rendering EJS Template...");
            if (!err) {
                ejs.renderFile(path.join(__dirname,'', "report.ejs"), {
                    productDetails: productDetailsReport,
                    name: orderDetails.name,
                    email: orderDetails.email,
                    contactNumber: orderDetails.contactNumber,
                    paymentMethod: orderDetails.paymentMethod,
                    totalAmount: orderDetails.total
                }, (err, results) => {
                    // console.log("✅ EJS Rendering Successful! HTML Content Generated.");
                    // const pdfPath = './generated_pdf_' + generatedUuid + '.pdf';
                    // console.log("📄 Creating PDF at:", pdfPath);

                    if (!err) {
                        pdf.create(results).toFile('./generated_pdf/' + generatedUuid + '.pdf', function (err, data) {
                            if (err) {
                                console.error("❌ PDF Generation Error:", err);
                                return res.status(500).json(err);
                            }
                            else {
                                // console.log("✅ PDF Generated Successfully! File Path:", pdfPath);
                                return res.status(200).json({
                                    uuid: generatedUuid
                                });
                            }
                        })
                    }
                    else {
                        console.error("❌ EJS Rendering Error:", err);
                        return res.status(500).json(err);
                    }
                })
            }
            else {
                console.error("❌ SQL Error:", err);
                return res.status(500).json(err);
            }
        })
})

//api for returning pdf to backend
router.post('/getPdf', auth.authenticateToken, function(req, res){
    const orderDetails = req.body;
    const pdfPath = './generated_pdf/' + orderDetails.uuid + '.pdf';
    if(fs.existsSync(pdfPath)){
        res.contentType("application/pdf");
        fs.createReadStream(pdfPath).pipe(res);
    }
    else{
        var productDetailsReport = JSON.parse(orderDetails.productDetails);
        ejs.renderFile(path.join(__dirname,'', "report.ejs"), {
            productDetails: productDetailsReport,
            name: orderDetails.name,
            email: orderDetails.email,
            contactNumber: orderDetails.contactNumber,
            paymentMethod: orderDetails.paymentMethod,
            totalAmount: orderDetails.total
        }, (err, results) => {
            // console.log("✅ EJS Rendering Successful! HTML Content Generated.");
            // const pdfPath = './generated_pdf_' + generatedUuid + '.pdf';
            // console.log("📄 Creating PDF at:", pdfPath);
            if (!err) {
                pdf.create(results).toFile('./generated_pdf/' + orderDetails.uuid + '.pdf', function (err, data) {
                    if (err) {
                        return res.status(500).json(err);
                    }
                    else {
                        res.contentType("application/pdf");
                        fs.createReadStream(pdfPath).pipe(res);
                    }
                })
            }
            else {
                return res.status(500).json(err);
            }
        })
    }
})

//api for get all the bills
router.get('/getBills', auth.authenticateToken, (req, res, next)=>{
    var query = "select * from bill order by id DESC";
    connection.query(query, (err,results)=>{
        if(!err){
            return res.status(200).json(results);
        }
        else{
            return res.status(500).json(err);
        }
    })
})

//api for delete the bill
router.delete('/delete/:id', auth.authenticateToken, (req, res, next)=>{
    const id = req.params.id;
    var query = "delete from bill where id = ?";

    connection.query(query, [id], (err, results)=>{
        if(!err){
            if(results.affectedRows == 0){
                return res.status(404).json({
                    message: "Bill id does not found" 
                })
            }
            return res.status(200).json({
                message: "Bill Deleted Successfully"
            })
        }
        else{
            return res.status(500).json(err);
        }
    })
})

module.exports = router;