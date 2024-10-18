"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("../server");
const uuid_1 = require("uuid");
const qrcode_1 = __importDefault(require("qrcode"));
const server_2 = require("../server");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = express_1.default.Router();
const jwksClient = (0, jwks_rsa_1.default)({
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});
function getKey(header, callback) {
    jwksClient.getSigningKey(header.kid, function (err, key) {
        const signingKey = key === null || key === void 0 ? void 0 : key.getPublicKey();
        callback(null, signingKey);
    });
}
function authenticateAccessToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send('Potreban je token.');
        return;
    }
    const token = authHeader.split(' ')[1];
    jsonwebtoken_1.default.verify(token, getKey, {
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
router.get("/", (req, res) => {
    res.render("generate-ticket");
});
router.post("/", authenticateAccessToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = yield (0, server_2.getAccessToken)();
        if (!accessToken) {
            res.status(401).send("Autorizacija nije prošla.");
            return;
        }
        const { vatin, firstName, lastName } = req.body;
        const result = yield server_1.client.query('SELECT COUNT(*) FROM ulaznice WHERE vatin = $1', [vatin]);
        const count = parseInt(result.rows[0].count);
        if (count >= 3) {
            res.status(400).send("Ne možete generirati više od 3 ulaznice za isti OIB.");
            return;
        }
        const ticketUUID = (0, uuid_1.v4)();
        const createdAt = new Date();
        yield server_1.client.query('INSERT INTO ulaznice (id, vatin, firstName, lastName, createdAt) VALUES ($1, $2, $3, $4, $5)', [ticketUUID, vatin, firstName, lastName, createdAt]);
        const qrCodeUrl = `http://localhost:3000/ticket-details/${ticketUUID}`;
        const qrCodeImage = yield qrcode_1.default.toDataURL(qrCodeUrl);
        res.status(201).json({
            ticketId: ticketUUID,
            qrCodeImage: qrCodeImage,
            qrCodeUrl: qrCodeUrl
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Došlo je do greške.");
    }
}));
exports.default = router;
