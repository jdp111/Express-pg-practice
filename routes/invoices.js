const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require('../expressError')

router.get("/",async function(req,res,next){
    try{
        const table = await db.query("SELECT * FROM invoices")
        return res.json({invoices : table.rows})
    }catch(err){
        return next(err)
    }
})

router.get("/:id", async function(req,res,next){
    try{
        const invoiceQuery = await db.query(
            "SELECT * FROM invoices WHERE id = $1",[req.params.id]
        );
        if (invoiceQuery.rows.length === 0) {
            throw new Error(`invoice with ID: ${req.params.id} not found`,404)
        }
        return res.json({invoices: invoiceQuery.rows})
    }catch(err){
        return next(err)
    }
})

router.post("/",async function(req,res,next){
    try{
        if (!req.body.comp_code|| !req.body.amt){
            throw new Error("input is not in the correct format, must be in form: {'comp_code':<company code>, 'amt':<dollar amount>}")
        }
        const inserted = await db.query(
            `INSERT INTO invoices (comp_code, amt)
                VALUES ($1,$2)
                ON CONFLICT DO NOTHING
                RETURNING *`, [req.body.comp_code, req.body.amt]
        )
            console.log(inserted)
        if (inserted.rows.length === 0 ) {
            throw new Error(`Invoice had some conflict and was not added to the table`,404)
        }

        return res.json(inserted.rows)

    }catch(err){next(err)}
})


router.put("/:id",async function(req,res,next){
    try{
        if (!req.body.amt){
            throw new Error(`invoice not updated, input must have format {'amt':<number>}`)
        }
        const invoiceQuery = await db.query(
            `UPDATE invoices
                SET amt = $2
                WHERE id = $1
                RETURNING *`,
            [req.params.id,req.body.amt]
        );

        if (invoiceQuery.rows.length === 0 ) {
            throw new Error(`invoice not updated. Invoice with id ${req.params.id} does not exist`,404)
        }
        return res.json(invoiceQuery.rows)
    }catch(err){
        next(err)
    }
})

router.delete("/:id",async function(req,res,next){
    try{
        const deleted = await db.query(
            `DELETE FROM invoices
                WHERE id = $1
                RETURNING id`,
            [req.params.id]
        )
        
        if (deleted.rows.length === 0){
            throw Error(`invoice with code '${req.params.id}' does not exist`)
        }

        return res.json({message:"invoice deleted"})
    }catch(err){
        next(err)
    }
});

module.exports = router;