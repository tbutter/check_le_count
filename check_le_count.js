#!/usr/bin/env node

const { Pool, Client } = require("pg");

const pool = new Pool({
  user: "guest",
  host: "crt.sh",
  database: "certwatch",
  port: 5432
});

if (process.argv.length < 3) {
  console.log("node check_le_count %.example.com [number of days]");
  process.exit();
}

var days = process.argv[3] === undefined ? 7 : parseInt(process.argv[3]);

pool.query(
  "select x509_notBefore(CERTIFICATE) as certts, id, array_agg(name_value) " +
    "from certificate c right join certificate_identity ci on ci.certificate_id = c.id where " +
    "c.issuer_ca_id = 16418 AND " +
    "id in (select certificate_id " +
    "from certificate_identity ci where " +
    "reverse(lower(ci.NAME_VALUE)) LIKE reverse(lower($1)) " +
    "group by ci.certificate_id) group by certificate, id order by certts desc",
  [process.argv[2]],
  (err, res) => {
    if (err !== undefined) {
      console.log(err);
      return;
    }
    var certs = {};
    var certDates = {};
    var now = new Date().getTime();
    res.rows.forEach(r => {
      var name = Array.from(new Set(r.array_agg)).sort().join();
      if (now - new Date(r.certts).getTime() < days * 24 * 60 * 60 * 1000)
        certs[new Date(r.certts).toISOString()] = {
          name: name,
          id: name + " [" + r.id + "]"
        };
      if (certDates[name] === undefined) certDates[name] = [];
      else
        certDates[name].push(
          new Date(r.certts).toISOString() + " [" + r.id + "]"
        );
    });
    var newcerts = 0;
    var renews = 0;
    Object.keys(certs).sort().reverse().forEach(c => {
      if (certDates[certs[c].name].length == 0) {
        console.log(c + " " + certs[c].id + " NEW");
        newcerts++;
      } else {
        console.log(
          c + " " + certs[c].id + " RENEW " + certDates[certs[c].name].join()
        );
        renews++;
      }
    });
    console.log("renews " + renews + " new certs " + newcerts);
    pool.end();
  }
);
