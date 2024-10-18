import express, {Request, Response, Router} from 'express';
import {client} from '../server';

const router: Router = express.Router();

router.get("/", async(req: Request, res: Response) => {
    let brojUlaznica: number | null = null;
    try {
        const result = await client.query('SELECT COUNT(*) FROM ulaznice');
        brojUlaznica = parseInt(result.rows[0].count);

        res.render("index", {brojUlaznica: brojUlaznica,
            user: req.oidc.user
        });
    } catch(error) {
        console.error("Greška: ",error);
        res.status(500).send("Greška kod baze.");
    }
});

export default router;