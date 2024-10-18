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
const express_openid_connect_1 = require("express-openid-connect");
const router = express_1.default.Router();
router.get('/:uuid', (0, express_openid_connect_1.requiresAuth)(), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const uuid = req.params.uuid;
    try {
        const result = yield server_1.client.query('SELECT * FROM ulaznice WHERE id = $1', [uuid]);
        if (result.rows.length === 0) {
            return res.status(404).render('ticket-details', { errorMessage: "Ulaznica nije pronađena." });
        }
        const { vatin, firstname, lastname, createdat } = result.rows[0];
        const formattedDate = new Date(createdat).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        res.render('ticket-details', {
            vatin: vatin,
            firstName: firstname,
            lastName: lastname,
            createdAt: formattedDate,
            user: req.oidc.user,
            errorMessage: ""
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).render('ticket-details', { errorMessage: "Došlo je do greške." });
    }
}));
exports.default = router;
