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
exports.client = void 0;
exports.getAccessToken = getAccessToken;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = require("pg");
const index_1 = __importDefault(require("./routes/index"));
const generate_ticket_1 = __importDefault(require("./routes/generate-ticket"));
const ticket_details_1 = __importDefault(require("./routes/ticket-details"));
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
dotenv_1.default.config();
app.set("views", path_1.default.join(__dirname, '../views'));
app.set("view engine", "ejs");
app.use('/scripts', express_1.default.static(path_1.default.join(__dirname, '/scripts')));
app.use('/styles', express_1.default.static(path_1.default.join(__dirname, '../styles')));
app.use(express_1.default.json());
const client = new pg_1.Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: 5432,
    ssl: true
});
exports.client = client;
client.connect()
    .then(() => console.log("Spojena baza."))
    .catch(err => console.error("Greška: ", err));
const { auth } = require('express-openid-connect');
const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 4080;
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: externalUrl || `https://localhost:${port}`,
    clientID: process.env.AUTH0_CLIENT_ID1,
    issuerBaseURL: process.env.AUTH0_ISSUER,
    routes: {
        login: false,
    },
};
app.use(auth(config));
if (externalUrl) {
    const hostname = '0.0.0.0'; //ne 127.0.0.1
    app.listen(port, hostname, () => {
        console.log(`Server locally running at http://${hostname}:${port}/ and from
  outside on ${externalUrl}`);
    });
}
function getAccessToken() {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            method: 'POST',
            url: process.env.AUTH0_TOKEN_URL,
            headers: { 'content-type': 'application/json' },
            data: {
                client_id: process.env.AUTH0_CLIENT_ID,
                client_secret: process.env.AUTH0_CLIENT_SECRET,
                audience: process.env.AUTH0_AUDIENCE,
                grant_type: 'client_credentials'
            }
        };
        try {
            const response = yield (0, axios_1.default)(options);
            return response.data.access_token;
        }
        catch (error) {
            console.error('Greška s tokenom: ', error);
            throw error;
        }
    });
}
app.use('/home', index_1.default);
app.use('/generate-ticket', generate_ticket_1.default);
app.use('/ticket-details', ticket_details_1.default);
app.get('/login', (req, res) => {
    res.oidc.login({ returnTo: '/home' });
});
app.get('/', (req, res) => {
    if (!req.oidc.isAuthenticated()) {
        res.redirect('/home');
    }
});
app.get('/get-token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = yield getAccessToken();
        res.json({ access_token: accessToken });
    }
    catch (error) {
        res.status(500).send('Greška s tokenom.');
    }
}));
app.listen(3000, () => {
});
