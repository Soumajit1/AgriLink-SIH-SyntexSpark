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
// SUBMIT A REVIEW & RATING (1 to 5 Stars)
// POST /api/reviews/submit
// Body: { transaction_id, reviewer_id, rating, comment }
// =====================================================
router.post('/submit', async (req, res) => {
    try {
        const { transaction_id, reviewer_id, rating, comment } = req.body;

        const txnId = Number(transaction_id);
        const reviewerId = Number(reviewer_id);
        const ratingVal = Number(rating);

        if (!Number.isInteger(txnId) || txnId <= 0) {
            return res.status(400).json({ error: 'Valid transaction ID is required' });
        }
        if (!Number.isInteger(reviewerId) || reviewerId <= 0) {
            return res.status(400).json({ error: 'Valid reviewer ID is required' });
        }
        if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
            return res.status(400).json({ error: 'Rating must be a number between 1 and 5 stars' });
        }

        // Verify transaction exists and is completed
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
        if (txn.status !== 'completed') {
            return res.status(400).json({ error: 'Reviews can only be submitted for completed transactions' });
        }

        if (txn.farmer_id !== reviewerId && txn.buyer_id !== reviewerId) {
            return res.status(403).json({ error: 'You are not a participant in this transaction' });
        }

        // Determine who is being reviewed
        const revieweeId = txn.farmer_id === reviewerId ? txn.buyer_id : txn.farmer_id;

        // Check if user already reviewed this transaction
        const existing = await query(`
            SELECT id FROM reviews 
            WHERE transaction_id = ? AND reviewer_id = ?
            LIMIT 1
        `, [txnId, reviewerId]);

        if (existing.length > 0) {
            return res.status(409).json({ error: 'You have already reviewed this transaction' });
        }

        await query(`
            INSERT INTO reviews 
            (transaction_id, reviewer_id, reviewee_id, rating, comment, status)
            VALUES (?, ?, ?, ?, ?, 'published')
        `, [txnId, reviewerId, revieweeId, ratingVal, comment ? String(comment).trim() : null]);

        // Send notification to reviewee
        try {
            await query(`
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, 'New Trust Score Rating Received', ?, 'info')
            `, [
                revieweeId,
                `You received a ${ratingVal}-star review on Transaction #${txnId}!`
            ]);
        } catch (nErr) {
            console.error('Notification error (review):', nErr.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Thank you! Your rating and review have been submitted.',
            rating: ratingVal
        });

    } catch (err) {
        console.error('Submit review error:', err);
        return res.status(500).json({ error: 'Failed to submit review', details: err.message });
    }
});

// =====================================================
// GET USER TRUST SCORE & REVIEWS
// GET /api/reviews/user/:userId
// =====================================================
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({ error: 'Valid user ID is required' });
        }

        // Calculate average trust score and count
        const statsRow = await query(`
            SELECT 
                COALESCE(ROUND(AVG(rating), 1), 5.0) AS averageRating,
                COUNT(*) AS totalReviews,
                SUM(CASE WHEN rating >= 4.5 THEN 1 ELSE 0 END) AS fiveStars,
                SUM(CASE WHEN rating >= 3.5 AND rating < 4.5 THEN 1 ELSE 0 END) AS fourStars,
                SUM(CASE WHEN rating >= 2.5 AND rating < 3.5 THEN 1 ELSE 0 END) AS threeStars,
                SUM(CASE WHEN rating >= 1.5 AND rating < 2.5 THEN 1 ELSE 0 END) AS twoStars,
                SUM(CASE WHEN rating < 1.5 THEN 1 ELSE 0 END) AS oneStars
            FROM reviews
            WHERE reviewee_id = ? AND status = 'published'
        `, [userId]);

        const stats = statsRow[0] || {};
        const total = Number(stats.totalReviews || 0);

        // Fetch list of reviews
        const reviewList = await query(`
            SELECT 
                r.id,
                r.transaction_id,
                r.rating,
                r.comment,
                r.created_at,
                u.name AS reviewer_name,
                u.role AS reviewer_role
            FROM reviews r
            LEFT JOIN users u ON r.reviewer_id = u.id
            WHERE r.reviewee_id = ? AND r.status = 'published'
            ORDER BY r.created_at DESC
            LIMIT 20
        `, [userId]);

        return res.json({
            trustScore: Number(stats.averageRating || 5.0),
            totalReviews: total,
            starDistribution: {
                5: Number(stats.fiveStars || 0),
                4: Number(stats.fourStars || 0),
                3: Number(stats.threeStars || 0),
                2: Number(stats.twoStars || 0),
                1: Number(stats.oneStars || 0)
            },
            reviews: reviewList
        });

    } catch (err) {
        console.error('Get trust score error:', err);
        return res.status(500).json({ error: 'Failed to load trust score', details: err.message });
    }
});

// =====================================================
// CHECK IF USER REVIEWED TRANSACTION
// GET /api/reviews/check/:transactionId?userId=X
// =====================================================
router.get('/check/:transactionId', async (req, res) => {
    try {
        const txnId = Number(req.params.transactionId);
        const userId = Number(req.query.userId);

        if (!txnId || !userId) {
            return res.status(400).json({ error: 'Transaction ID and User ID required' });
        }

        const existing = await query(`
            SELECT id, rating, comment, created_at 
            FROM reviews 
            WHERE transaction_id = ? AND reviewer_id = ?
            LIMIT 1
        `, [txnId, userId]);

        return res.json({
            hasReviewed: existing.length > 0,
            review: existing[0] || null
        });

    } catch (err) {
        console.error('Check review error:', err);
        return res.status(500).json({ error: 'Check failed', details: err.message });
    }
});

module.exports = router;
