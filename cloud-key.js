const fs = require('fs');

const data = {
  "type": "service_account",
  "project_id": "dollar-jockey-5d690",
  "private_key_id": "cdb8c107a14a5a2401fc871c05f3e4695958250b",
  "private_key": process.env.CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
  "client_email": "dollar-jockey-5d690@appspot.gserviceaccount.com",
  "client_id": "111802046210852573723",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/dollar-jockey-5d690%40appspot.gserviceaccount.com"
};

fs.writeFileSync('./key.json', JSON.stringify(data));