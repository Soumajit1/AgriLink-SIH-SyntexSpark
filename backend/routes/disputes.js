const express = require('express');
const router = express.Router();
const db = require('../db');

function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
            if (err) reject(err);
            else resolve(results);
        });
    });
}

// =====================================================
// RAISE A DISPUTE (Farmer or Buyer)
// POST /api/disputes/raise
// Body: { transaction_id, raised_by_id, issue_type, description, priority }
// =====================================================
router.post('/raise', async (req, res) => {
    try {
        const { transaction_id, raised_by_id, issue_type, description, priority } = req.body;

        const txnId = Number(transaction_id);
        const raisedById = Number(raised_by_id);

        if (!Number.isInteger(txnId) || txnId <= 0) {
            return res.status(400).json({ error: 'Valid transaction ID is required' });
        }
        if (!Number.isInteger(raisedById) || raisedById <= 0) {
            return res.status(400).json({ error: 'Valid user ID is required' });
        }
        if (!issue_type || !String(issue_type).trim()) {
            return res.status(400).json({ error: 'Issue type is required' });
        }

        // Verify transaction exists and user is a party (farmer or buyer)
        const txns = await query(`
            SELECT id, farmer_id, buyer_id, status 
            FROM transactions 
            WHERE id = ?
            LIMIT 1
        `, [txnId]);

        if (txns.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const txn = txns[0];
        if (txn.farmer_id !== raisedById && txn.buyer_id !== raisedById) {
            return res.status(403).json({ error: 'You are not a participant in this transaction' });
        }

        // Determine who the dispute is against
        const againstId = txn.farmer_id === raisedById ? txn.buyer_id : txn.farmer_id;

        // Check if an open dispute already exists for this transaction by this user
        const existing = await query(`
            SELECT id, ticket_code FROM disputes 
            WHERE transaction_id = ? AND raised_by_id = ? AND status IN ('open', 'under_review')
            LIMIT 1
        `, [txnId, raisedById]);

        if (existing.length > 0) {
            return res.status(409).json({ 
                error: 'An active dispute ticket already exists for this transaction',
                ticketCode: existing[0].ticket_code 
            });
        }

        // Generate unique ticket code
        const ticketCode = 'TKT-' + Math.floor(1000 + Math.random() * 9000);

        const validPriority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';

        await query(`
            INSERT INTO disputes 
            (ticket_code, transaction_id, raised_by_id, against_id, issue_type, description, priority, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
        `, [ticketCode, txnId, raisedById, againstId, String(issue_type).trim(), description ? String(description).trim() : '', validPriority]);

        // Insert in-app notifications for both parties
        try {
            await query(`
                INSERT INTO notifications (user_id, title, message, type)
                VALUES 
                (?, 'Dispute Raised', ?, 'warning'),
                (?, 'Dispute Filed Against Transaction', ?, 'warning')
            `, [
                raisedById, `Your dispute (${ticketCode}) has been submitted and is under admin review.`,
                againstId, `A dispute (${ticketCode}) has been raised regarding Transaction #${txnId}. Admin will review shortly.`
            ]);
        } catch (notifErr) {
            console.error('Notification error (dispute):', notifErr.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Dispute ticket raised successfully',
            ticketCode
        });

    } catch (err) {
        console.error('Raise dispute error:', err);
        return res.status(500).json({ error: 'Failed to submit dispute', details: err.message });
    }
});

// =====================================================
// GET USER DISPUTES (Raised by or against user)
// GET /api/disputes/my-disputes?userId=X
// =====================================================
router.get('/my-disputes', async (req, res) => {
    try {
        const userId = Number(req.query.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ error: 'Valid user ID is required' });
        }

        const sql = `
            SELECT 
                d.id,
                d.ticket_code,
                d.transaction_id,
                d.issue_type,
                d.description,
                d.priority,
                d.status,
                d.resolution,
                d.created_at,
                d.resolved_at,

                t.amount AS transaction_amount,
                t.status AS transaction_status,

                p.crop_name,

                u_raised.name AS raised_by_name,
                u_against.name AS against_name,

                CASE WHEN d.raised_by_id = ? THEN 'raised_by_me' ELSE 'against_me' END AS relationship

            FROM disputes d
            LEFT JOIN transactions t ON d.transaction_id = t.id
            LEFT JOIN offers o ON t.offer_id = o.id
            LEFT JOIN produce_listings p ON o.produce_id = p.id
            LEFT JOIN users u_raised ON d.raised_by_id = u_raised.id
            LEFT JOIN users u_against ON d.against_id = u_against.id

            WHERE d.raised_by_id = ? OR d.against_id = ?

            ORDER BY d.created_at DESC
        `;

        const disputes = await query(sql, [userId, userId, userId]);
        return res.json({ disputes });

    } catch (err) {
        console.error('Get my disputes error:', err);
        return res.status(500).json({ error: 'Failed to load disputes', details: err.message });
    }
});

module.exports = router;
