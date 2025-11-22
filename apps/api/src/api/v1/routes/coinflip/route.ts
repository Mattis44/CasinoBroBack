import express from 'express';
import crypto from 'crypto';

const coinflipRouter = express.Router();


coinflipRouter.post('/:side', async (req, res) => {
    try {
        const clientChoice = req.params.side;

        const seed = crypto.randomBytes(16).toString('hex');

        const hash = crypto.createHash('sha256').update(seed).digest('hex');

        const isHeads = parseInt(seed.substring(0, 2), 16) % 2 === 0;
        const serverSide = isHeads ? 'heads' : 'tails';

        const didWin = serverSide === clientChoice;

        return res.json({
            side: serverSide,
            hash,
            status: didWin ? 'win' : 'lose',
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default coinflipRouter;
