import express, {Request, Response, Router} from 'express';
import {client} from '../server';
import { requiresAuth } from 'express-openid-connect';

const router: Router = express.Router();

router.get('/:uuid', requiresAuth(), async(req: Request, res: Response) => {
    const uuid = req.params.uuid;

    try {
        const result = await client.query('SELECT * FROM ulaznice WHERE id = $1', [uuid]);
        
        if (result.rows.length === 0) {
            return res.status(404).render('ticket-details', { errorMessage: "Ulaznica nije pronađena." });
        }

        const {vatin, firstname, lastname, createdat} = result.rows[0];

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
        })

    } catch (error){
        console.error(error);
        res.status(500).render('ticket-details', { errorMessage: "Došlo je do greške." });
    }
});

export default router;