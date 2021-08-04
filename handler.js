const serverless = require("serverless-http");
const fs = require("fs");
const AWS = require("aws-sdk");
const csv = require("csvtojson");
const S3 = new AWS.S3({
  // accessKeyId: process.env.AWS_ACCESS_KEY,
  // secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3ForcePathStyle: true,
  accessKeyId: 'S3RVER',
  secretAccessKey: 'S3RVER',
  endpoint: new AWS.Endpoint('http://localhost:4569'),
})

module.exports.importCsvToS3 = (data) => {

  if(data.fileName) {
    fs.readFile(data.fileName, (err, data) => {
      if (err) throw err;
      const params = {
        Bucket: 'local-bucket',
        Key: 'person.csv',
        Body: data
      };
      S3.upload(params, (s3Err, data) => {
        if (s3Err) throw s3Err;
        console.log(`File uploaded successfully at ${data.Location}`);
      });
    })
  }
}

module.exports.importS3ToDb = async () => {
  const params = {
    Bucket: 'local-bucket',
    Key: 'person.csv'
  };
  
  const stream = S3.getObject(params).createReadStream();

  const json = await csv({noheader: true}).fromStream(stream);
  console.log(json);

  const mysql = require("mysql");
  const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'toor',
    database: 'sample'
  });
  conn.connect();
  const query = `INSERT INTO person (lastname, firstname, address) VALUES ` + json.map(({field1, field2, field3}) => `('${field1}','${field2}','${field3}')`);
  console.log(query);
  conn.query(query,(err) => {
    if (err) throw err;
    console.log('data inserted');
    conn.destroy();
  });
}