import express, { Request, Response, Router, NextFunction } from 'express';
import { client } from '../server';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { getAccessToken } from '../server';
import jwt from 'jsonwebtoken';
import JwksRsa from 'jwks-rsa';
import dotenv from 'dotenv';

dotenv.config();
const router: Router = express.Router();

const jwksClient = JwksRsa({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header: any, callback: any) {
  jwksClient.getSigningKey(header.kid, function (err, key) {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

function authenticateAccessToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if(!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send('Potreban je token.');
    return;
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, getKey, {
    audience: process.env.AUTH0_AUDIENCE, 
    issuer: `https://${process.env.AUTH0_DOMAIN}/`, 
    algorithms: ['RS256'] 
  }, (err, decoded) => {
    if (err) {
      res.status(403).send('Token nije validan');
      return;
    }

    next();
  });
}

router.get("/", (req: Request, res: Response) => {
    res.render("generate-ticket");
  });

router.post("/", authenticateAccessToken, async (req: Request, res: Response): Promise<void> => {
    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        res.status(401).send("Autorizacija nije prošla.");
        return;
      }

      const { vatin, firstName, lastName } = req.body;

      if(!vatin || vatin.length !== 11 || isNaN(vatin) || !firstName || typeof firstName !== 'string' || firstName.trim() === '' ||
      !lastName || typeof lastName !== 'string' || lastName.trim() === '') { 
        res.status(400).send("Podaci nisu ispravno uneseni.");
        return;
      }
 
      const result = await client.query('SELECT COUNT(*) FROM ulaznice WHERE vatin = $1', [vatin]);
      const count = parseInt(result.rows[0].count);
 
      if (count >= 3) {
        res.status(400).send("Ne možete generirati više od 3 ulaznice za isti OIB.");
        return;
      }
  
      const ticketUUID = uuidv4();
      const createdAt = new Date();
  
      await client.query('INSERT INTO ulaznice (id, vatin, firstName, lastName, createdAt) VALUES ($1, $2, $3, $4, $5)', [ticketUUID, vatin, firstName, lastName, createdAt]);
  
      const qrCodeUrl = `https://web2lab1-n1hd.onrender.com/ticket-details/${ticketUUID}`;
      const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);
  
      res.status(201).json({
        ticketId: ticketUUID,
        qrCodeImage: qrCodeImage,
        qrCodeUrl: qrCodeUrl
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).send("Došlo je do greške.");
    }
  });

export default router;