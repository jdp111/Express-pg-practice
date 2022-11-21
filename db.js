
const { Client } = require('pg')





const DB_URI = "postgresql:///biztime"//(process.env.NODE_ENV === "test")
  //? "postgresql:///biztime_test"
  //: "postgresql:///biztime";


let db = new Client({
    connectionString: DB_URI,
});
  
db.connect();
  
module.exports = db;