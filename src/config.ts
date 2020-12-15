import * as fs from 'fs';

export const develop = {
  httpsOptions: {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
    passphrase: 'stst',
    requestCert: false,
    rejectUnauthorized: false,
  },
  cors: {
    origin: '*',
    optionsSuccessStatus: 200,
  },
};

export const prod = {
  cors: {
    origin: process.env.CLIENT_URL,
    optionsSuccessStatus: 200,
  },
};
