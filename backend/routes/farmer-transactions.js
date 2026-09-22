const express = require('express');
const db = require('../db');

const router = express.Router();


// =====================================================
// HELPER
// =====================================================

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(results);
        });
    });
}


// =====================================================
// GET FARMER TRANSACTIONS
//
// GET /api/farmer/transactions/:farmerId
// =====================================================

router.get('/:farmerId', async (req, res) => {

    const farmerId = Number(req.params.farmerId);

    if (!Number.isInteger(farmerId) || farmerId <= 0) {
        return res.status(400).json({
            error: 'Invalid farmer ID'
        });
    }


    try {

        const sql = `
            SELECT
                t.id,
                t.offer_id,
                t.farmer_id,
                t.buyer_id,
                t.amount,
                t.quantity,
                t.status,
                t.transaction_date,

                o.offered_price,
                o.message,

                p.crop_name,
                p.unit,
                p.quality,
                p.price_per_unit,

                u.name  AS buyer_name,
                u.email AS buyer_email

            FROM transactions t

            LEFT JOIN offers o
                ON t.offer_id = o.id

            LEFT JOIN produce_listings p
                ON o.produce_id = p.id

            LEFT JOIN users u
                ON t.buyer_id = u.id

            WHERE t.farmer_id = ?

            ORDER BY t.transaction_date DESC
        `;

        const results = await query(sql, [farmerId]);

        res.json({
            transactions: results
        });

    } catch (err) {

        console.error(
            'Farmer transactions database error:',
            err
        );

        res.status(500).json({
            error: 'Database error',
            details: err.message,
            code: err.code
        });
    }

});


// =====================================================
// GET FARMER TRANSACTION STATS
//
// GET /api/farmer/transactions/:farmerId/stats
// =====================================================

router.get('/:farmerId/stats', async (req, res) => {

    const farmerId = Number(req.params.farmerId);

    if (!Number.isInteger(farmerId) || farmerId <= 0) {
        return res.status(400).json({
            error: 'Invalid farmer ID'
        });
    }


    try {

        const sql = `
            SELECT
                COUNT(*)                                           AS total,

                SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,

                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,

                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,

                COALESCE(
                    SUM(
                        CASE WHEN status = 'completed'
                             THEN amount
                             ELSE 0
                        END
                    ),
                    0
                ) AS completedAmount

            FROM transactions

            WHERE farmer_id = ?
        `;

        const results = await query(sql, [farmerId]);

        const row = results[0] || {};

        res.json({
            stats: {
                total:           Number(row.total)           || 0,
                pending:         Number(row.pending)         || 0,
                completed:       Number(row.completed)       || 0,
                cancelled:       Number(row.cancelled)       || 0,
                completedAmount: Number(row.completedAmount) || 0
            }
        });

    } catch (err) {

        console.error(
            'Farmer transaction stats error:',
            err
        );

        res.status(500).json({
            error: 'Database error',
            details: err.message,
            code: err.code
        });
    }

});


// =====================================================
// COMPLETE A TRANSACTION
//
// POST /api/farmer/transactions/:transactionId/complete
//
// Body: { farmerId: number }
// =====================================================

router.post('/:transactionId/complete', async (req, res) => {

    const transactionId = Number(req.params.transactionId);
    const farmerId      = Number(req.body.farmerId);

    if (
        !Number.isInteger(transactionId) ||
        transactionId <= 0
    ) {
        return res.status(400).json({
            error: 'Invalid transaction ID'
        });
    }

    if (
        !Number.isInteger(farmerId) ||
        farmerId <= 0
    ) {
        return res.status(400).json({
            error: 'Invalid farmer ID'
        });
    }


    try {

        // Verify the transaction belongs to this farmer
        // and is currently pending.

        const existing = await query(
            `
            SELECT id, status
            FROM transactions
            WHERE id = ?
              AND farmer_id = ?
            LIMIT 1
            `,
            [transactionId, farmerId]
        );

        if (!existing.length) {
            return res.status(404).json({
                error: 'Transaction not found'
            });
        }

        if (existing[0].status === 'completed') {
            return res.status(400).json({
                error: 'Transaction is already completed'
            });
        }

        if (existing[0].status === 'cancelled') {
            return res.status(400).json({
                error: 'Cannot complete a cancelled transaction'
            });
        }


        await query(
            `
            UPDATE transactions
            SET status = 'completed',
                transaction_date = NOW()
            WHERE id = ?
              AND farmer_id = ?
            `,
            [transactionId, farmerId]
        );


        res.json({
            success: true,
            message: 'Transaction completed successfully'
        });

    } catch (err) {

        console.error(
            'Complete transaction error:',
            err
        );

        res.status(500).json({
            error: 'Database error',
            details: err.message,
            code: err.code
        });
    }

});


// =====================================================
// CANCEL A TRANSACTION
//
// POST /api/farmer/transactions/:transactionId/cancel
//
// Body: { farmerId: number }
// =====================================================

router.post('/:transactionId/cancel', async (req, res) => {

    const transactionId = Number(req.params.transactionId);
    const farmerId      = Number(req.body.farmerId);

    if (
        !Number.isInteger(transactionId) ||
        transactionId <= 0
    ) {
        return res.status(400).json({
            error: 'Invalid transaction ID'
        });
    }

    if (
        !Number.isInteger(farmerId) ||
        farmerId <= 0
    ) {
        return res.status(400).json({
            error: 'Invalid farmer ID'
        });
    }


    try {

        // Verify the transaction belongs to this farmer
        // and is currently pending.

        const existing = await query(
            `
            SELECT id, status
            FROM transactions
            WHERE id = ?
              AND farmer_id = ?
            LIMIT 1
            `,
            [transactionId, farmerId]
        );

        if (!existing.length) {
            return res.status(404).json({
                error: 'Transaction not found'
            });
        }

        if (existing[0].status === 'cancelled') {
            return res.status(400).json({
                error: 'Transaction is already cancelled'
            });
        }

        if (existing[0].status === 'completed') {
            return res.status(400).json({
                error: 'Cannot cancel a completed transaction'
            });
        }


        await query(
            `
            UPDATE transactions
            SET status = 'cancelled'
            WHERE id = ?
              AND farmer_id = ?
            `,
            [transactionId, farmerId]
        );


        res.json({
            success: true,
            message: 'Transaction cancelled successfully'
        });

    } catch (err) {

        console.error(
            'Cancel transaction error:',
            err
        );

        res.status(500).json({
            error: 'Database error',
            details: err.message,
            code: err.code
        });
    }

});


module.exports = router;