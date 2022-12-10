process.env.NODE_ENV = "test"
const request = require('supertest')
const app = require('../app')
const db = require('../db')
let invoiceDate

beforeEach(async function(){
    await db.query(`  
        INSERT INTO companies 
            VALUES ('Strickland', 'Strickland Propane', 'propane and propane accessories');
        `)
    await db.query(`INSERT INTO invoices (comp_Code, amt, paid, paid_date)
            VALUES ('Strickland', 2100, false, null)
        `)
})

afterEach(async function(){
     await db.query(`
        DROP TABLE invoices;
        DELETE FROM companies;

        CREATE TABLE invoices (
            id serial PRIMARY KEY,
            comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
            amt float NOT NULL,
            paid boolean DEFAULT false NOT NULL,
            add_date date DEFAULT CURRENT_DATE NOT NULL,
            paid_date date,
            CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
        );
    `)
})

describe("GET /companies",()=>{
    test("get all companies", async ()=>{
        const res =await request(app).get("/companies")
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({
            "companies": [
                {
                    "code": "Strickland",
                    "name": "Strickland Propane",
                    "description": "propane and propane accessories"
                }]})
    })

    test("get specific company", async ()=>{
        const res =await request(app).get("/companies/Strickland")
        expect(res.statusCode).toBe(200)
        expect(res.body.company).toEqual(
            [{
                "code": "Strickland",
                "name": "Strickland Propane",
                "description": "propane and propane accessories"
            }]
        )
    })
})


describe("GET /invoices",()=>{
    test("get all invoices", async ()=>{
        const res =await request(app).get("/invoices")
        expect(res.statusCode).toBe(200)
        expect(res.body.invoices[0].amt).toEqual(2100)
        expect(res.body.invoices[0].comp_code).toEqual("Strickland")
        expect(res.body.invoices[0].paid).toEqual(false)
            
    })

    test("get one invoice", async ()=>{
        const res =await request(app).get("/invoices/1")
        expect(res.statusCode).toBe(200)
        expect(res.body.invoices[0].amt).toEqual(2100)
        expect(res.body.invoices[0].comp_code).toEqual("Strickland")
        expect(res.body.invoices[0].paid).toEqual(false)
    })
})


describe("POST /companies", ()=>{
    test("make new company", async ()=>{
        const res = await request(app).post("/companies").send({"code":"newComp","name":"newName","description":"nothing to say"})
        expect(res.body[0].name).toEqual("newName")
        expect(res.body[0].code).toEqual("newComp")
        expect(res.body[0].description).toEqual("nothing to say")
    })
})

describe("POST /invoices", ()=>{
    test("make new invoice", async ()=>{
        const res = await request(app).post("/invoices").send({"comp_code":"Strickland","amt":4735})
        expect(res.body[0].amt).toEqual(4735)
        expect(res.body[0].comp_code).toEqual("Strickland")
        expect(res.body[0].paid).toEqual(false)
    })
})

describe("DELETE methods", ()=>{
    test("delete invoice", async ()=>{
        const res = await request(app).delete("/invoices/1")
        expect(res.body.message).toEqual('invoice deleted')
    })

    test("delete company", async ()=>{
        const res = await request(app).delete("/companies/Strickland")
        expect(res.body.message).toEqual('company deleted')
    })
})