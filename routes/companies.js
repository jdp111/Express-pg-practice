const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require('../expressError')
const slugify = require('slugify')


router.get("/",async function(req,res,next){
try{    
    const table = await db.query("SELECT * FROM companies")
    return res.json({companies : table.rows})
}catch(err){
    return next(err)
}

})

router.get("/:code", async function(req,res,next){
    try{
        const company = await db.query(
            "SELECT * FROM companies WHERE code = $1",
            [req.params.code]
        );
        const invoices = await db.query(
            `SELECT * FROM invoices
                WHERE comp_code = $1`,
            [req.params.code]
        )

        if (company.rows.length === 0) {
            throw new Error(`company with code: ${req.params.code} not found`,404)
        }

        return res.json({company: company.rows, invoices: invoices.rows})//, invoices.rows}})
    }catch(err){
        return next(err)
    }
})

router.post("/",async function(req,res,next){
    try{
        if (!req.body.name){
            throw new Error("input is not in the correct format, must be in form: {'code':<company code> ,'name': <company name>,'description': <company description>}")
        }
        if (!req.body.code){
            req.body.code = slugify(req.body.name)
        }
        const inserted = await db.query(
            `INSERT INTO companies (code, name, description)
                VALUES ($1,$2,$3)
                ON CONFLICT DO NOTHING
                RETURNING *`, 
            [req.body.code, req.body.name, req.body.description]
        )
        console.log(inserted.rows[0])
        
        if (inserted.rows.length === 0 ) {
            throw new Error(`company with code: ${req.body.code} and name: ${req.body.name} already exists in table`,404)
        }

        return res.json(inserted.rows)

    }catch(err){next(err)}
})

router.put("/:code",async function(req,res,next){
    try{
        if (!req.body.description||!req.body.name){
            throw new Error(`input must be in format: {'name':<company name>, 'description':<company description>}`)
        }
        const companyQuery = await db.query(
            `UPDATE companies 
                SET description = $2 , name = $3
                WHERE code = $1
                RETURNING *`,
            [req.params.code,req.body.description,req.body.name]
        );

        if (companyQuery.rows.length === 0 ) {
            throw new Error(`company with code: ${req.params.code} does not exist`,404)
        }
        return res.json(companyQuery.rows)
    }catch(err){
        next(err)
    }
})

router.delete("/:code",async function(req,res,next){
    try{
        const deleted = await db.query(
            `DELETE FROM companies
                WHERE code = $1
                RETURNING code`,
            [req.params.code]
        )
        
        if (deleted.rows.length === 0){
            throw Error(`company with code '${req.params.code}' does not exist`)
        }

        return res.json({message:"company deleted"})
    }catch(err){
        next(err)
    }
});

router.update("/",async function(req,res,next){
    try{
        if (!req.body.industry_code || !req.body.company_code){
            throw Error(`request must be in format: {company_code: "AAPL", industry_code: "TECH"}`)
        }
        
        const verifyIndustry = await db.query(`
            select * from industries where code = $1
        `, [req.body.industry_code])

        if (!verifyIndustry.rows){
            throw Error(`the selected industry code does not exist`)
        }

        const addindustry = await db.query(`
            insert into company_industries (c_code, i_code)
            VALUES ($1,$2)`,
            [req.body.company_code, req.body.industry_code]
        )

        return res.json({message: `industry: ${req.body.industry_code} added to company: ${req.body.company_code}`})

    }catch(err){ next(err) }
})


module.exports = router