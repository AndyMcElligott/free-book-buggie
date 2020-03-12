const express = require('express');
const pool = require('../modules/pool');
const { rejectUnauthenticated } = require('../modules/authentication-middleware');

const router = express.Router();

router.get('/', (req, res) => {
    const queryText = 'SELECT * FROM "organizations" ORDER BY "id";'
    console.log('in organizations router.get', req.body)
    pool.query(queryText)
        .then(result => {
            console.log(result.rows)
            res.send(result.rows)
        }).catch(error => {
            console.log('error in organizations GET', error)
            res.sendStatus(500);
        })
})

router.post('/', rejectUnauthenticated, (req, res) => {
    console.log('in organizations post router', req.body)
    const newEntry = req.body;
    console.log(newEntry)
    const queryText = `INSERT INTO "organizations" ("org_name", "logo", "type", 
                            "address_number", "address_street", "address_unit", "city",
                            "state", "county", "zip", "notes") 
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
                        INSERT INTO "contacts" ("contact_name", "title", )`;
    const queryValues = [
        newEntry.name,
        newEntry.logo,
        newEntry.type,
        newEntry.address_number,
        newEntry.address_street,
        newEntry.address_unit,
        newEntry.city,
        newEntry.state,
        newEntry.county,
        newEntry.zip,
        newEntry.notes,
        newEntry.contact_name,
        newEntry.phone_number,
        newEntry.email,
        
    ];
    pool.query(queryText, queryValues)
        .then(() => {
            res.sendStatus(201);
            console.log(queryValues)
        }).catch((err) => {
            console.log('Error in router.post on entry router', err);
            res.sendStatus(500);
        })
});

//Route setup for post to multiple tables from 'add new organization form'

router.post('/', rejectUnauthenticated, async (req, res) => {
    const newEntry = req.body;
    
    console.log(newEntry);

    const connection = await pool.connect()
    try {
        await connection.query('BEGIN');
        const sqlAddOrganization = `INSERT INTO "organizations" 
                                    ("org_name", "logo", "type", "address_number", "address_street", 
                                    "address_unit", "city", "state", "county", "zip", "notes") 
                                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11); 
                                    RETURNING id`;
        // Save the result so we can get the returned value
        const result = await connection.query(sqlAddOrganization, [id]);
        // Get the id from the result - will have 1 row with the id 
        const organizationId = result.rows[0].id;
        const sqlAddContact = `INSERT INTO "contacts" 
                                ("contact_name", "title", )
                                VALUES ($1, $2)
                                RETURNING id`;
        await connection.query(sqlAddContact, [organizationId, id]);
        const contactId = result.rows[0].id;
        const sqlAddDemographics


        await connection.query('COMMIT');
        res.sendStatus(200);
    } catch (error) {
        await connection.query('ROLLBACK');
        console.log(`Transaction Error - Rolling back new account`, error);
        res.sendStatus(500);
    } finally {
        connection.release()
    }
});


router.put('/', rejectUnauthenticated, (req, res) => {
    console.log('ready to edit organization with', req.body)
    let id = req.body.id
    let address_number = req.body.address_number
    let address_street = req.body.address_street
    let address_unit = req.body.address_unit
    let city = req.body.city
    let state = req.body.state
    let zip = req.body.zip
    let county = req.body.county
    let notes = req.body.notes

    let sqlText1 = `UPDATE "organizations" 
                SET "address_number" = $1, 
                    "address_street" = $2, 
                    "address_unit" = $3, 
                    "city" = $4, 
                    "state" = $5, 
                    "zip" = $6, 
                    "county" = $7, 
                    "notes" = $8 
                    WHERE "id" = $9
                    RETURNING "organizations";`;
    let sqlText2 = 'SELECT * FROM "organizations" ORDER BY "id";'
    pool.query(sqlText1, [address_number, address_street, address_unit, city, state, zip, county, notes, id])
        .then(
            pool.query(sqlText2)
                .then(result => {
                    console.log(result.rows)
                    res.send(result.rows)
                })
                .catch((err) => {
                    console.log('Error updating organization', err);
                    res.sendStatus(500);
                })
                .catch((err) => {
                    console.log('Error updating organization', err);
                    res.sendStatus(500);
                })
        )
})
module.exports = router;