const express = require('express');
const bodyParser = require('body-parser');
const pdfkit = require('pdfkit');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(bodyParser.json());
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/productsDB', { useNewUrlParser: true, useUnifiedTopology: true });
const productSchema = new mongoose.Schema({
    listingName: String,
    mrp: Number,
    hsnCode: Number,
    gstSlab: Number,
    unit: String
});
const Product = mongoose.model('Product', productSchema);
app.post('/orders', async (req, res) => {
    try {
        const products = await Product.find({ _id: { $in: req.body.products } });
        let subtotal = 0;
        let tax = 0;
        let total = 0;
        for (let i = 0; i < products.length; i++) {
            subtotal += products[i].mrp;
            tax += products[i].mrp * (products[i].gstSlab / 100);
        }
        total = subtotal + tax + req.body.additionalCharges;
        const doc = new pdfkit();
        doc.pipe(fs.createWriteStream(path.join(__dirname, 'order-invoice.pdf')));
        doc.fontSize(20).text('Order Invoice');
        doc.moveDown();
        doc.fontSize(14).text(`Order Number: ${req.body.orderNumber}`);
        doc.moveDown();
        doc.fontSize(12).text('Product List:');
        doc.moveDown();
        for (let i = 0; i < products.length; i++) {
            doc.fontSize(10).text(`${i + 1}. ${products[i].listingName} - ${products[i].mrp} x ${products[i].unit}`);
            doc.moveDown();
        }
        doc.fontSize(12).text(`Subtotal: ${subtotal}`);
        doc.moveDown();
        doc.fontSize(12).text(`Tax: ${tax}`);
        doc.moveDown();
        doc.fontSize(12).text(`Additional Charges: ${req.body.additionalCharges}`);
        doc.moveDown();
        doc.fontSize(14).text(`Total: ${total}`);
        doc.moveDown();
        doc.end();
        res.sendFile(path.join(__dirname, 'order-invoice.pdf'));
    } catch (error) {
        res.status(500).send(error);
    }
});

app.listen(3000, () => console.log('Server started on port 3000.'));