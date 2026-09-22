const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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
// 1. PLATFORM OVERVIEW & STATS
// GET /api/admin/overview
// =====================================================
router.get('/overview', async (req, res) => {
    try {
        // Platform GMV & 1% Revenue
        const gmvRow = await query(`
            SELECT 
                COALESCE(SUM(amount), 0) AS totalGmv,
                COALESCE(SUM(CASE WHEN transaction_date >= CURDATE() THEN amount ELSE 0 END), 0) AS todayGmv,
                COUNT(*) AS totalTransactions
            FROM transactions
            WHERE status = 'completed'
        `);
        const totalGmv = Number(gmvRow[0]?.totalGmv || 0);
        const todayGmv = Number(gmvRow[0]?.todayGmv || 0);
        const platformRevenue = totalGmv * 0.01; // 1% commission

        // User counts by role
        const userStats = await query(`
            SELECT 
                COUNT(*) AS totalUsers,
                SUM(CASE WHEN role = 'farmer' THEN 1 ELSE 0 END) AS farmers,
                SUM(CASE WHEN role = 'buyer' THEN 1 ELSE 0 END) AS buyers,
                SUM(CASE WHEN role = 'fpo' THEN 1 ELSE 0 END) AS fpos,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS activeUsers
            FROM users
            WHERE role != 'admin'
        `);
        const u = userStats[0] || {};

        // Disputes count
        const disputeStats = await query(`
            SELECT 
                COUNT(*) AS totalDisputes,
                SUM(CASE WHEN status IN ('open', 'under_review') THEN 1 ELSE 0 END) AS openDisputes,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolvedDisputes
            FROM disputes
        `);
        const d = disputeStats[0] || {};

        // Platform Average Trust Score
        const trustRow = await query(`
            SELECT 
                COALESCE(ROUND(AVG(rating), 1), 5.0) AS avgTrustScore,
                COUNT(*) AS totalReviews
            FROM reviews
            WHERE status = 'published'
        `);
        const avgTrustScore = Number(trustRow[0]?.avgTrustScore || 5.0);

        // Recent Activity Feed (combining latest disputes, transactions, and user registrations)
        const recentTxns = await query(`
            SELECT 
                t.id, t.amount, t.status, t.transaction_date AS activity_date,
                p.crop_name, u_buyer.name AS buyer_name, u_farmer.name AS farmer_name
            FROM transactions t
            LEFT JOIN offers o ON t.offer_id = o.id
            LEFT JOIN produce_listings p ON o.produce_id = p.id
            LEFT JOIN users u_buyer ON t.buyer_id = u_buyer.id
            LEFT JOIN users u_farmer ON t.farmer_id = u_farmer.id
            ORDER BY t.transaction_date DESC
            LIMIT 4
        `);

        const recentDisputes = await query(`
            SELECT 
                d.id, d.ticket_code, d.issue_type, d.priority, d.status, d.created_at AS activity_date,
                u_raised.name AS raised_by_name, u_against.name AS against_name
            FROM disputes d
            LEFT JOIN users u_raised ON d.raised_by_id = u_raised.id
            LEFT JOIN users u_against ON d.against_id = u_against.id
            ORDER BY d.created_at DESC
            LIMIT 4
        `);

        return res.json({
            stats: {
                totalGmv,
                todayGmv,
                platformRevenue,
                totalTransactions: Number(gmvRow[0]?.totalTransactions || 0),
                totalUsers: Number(u.totalUsers || 0),
                farmers: Number(u.farmers || 0),
                buyers: Number(u.buyers || 0),
                fpos: Number(u.fpos || 0),
                activeUsers: Number(u.activeUsers || 0),
                openDisputes: Number(d.openDisputes || 0),
                resolvedDisputes: Number(d.resolvedDisputes || 0),
                avgTrustScore,
                totalReviews: Number(trustRow[0]?.totalReviews || 0)
            },
            recentActivity: {
                transactions: recentTxns,
                disputes: recentDisputes
            }
        });

    } catch (err) {
        console.error('Admin overview error:', err);
        return res.status(500).json({ error: 'Failed to load admin overview', details: err.message });
    }
});

// =====================================================
// 2. USER MANAGEMENT
// GET /api/admin/users
// =====================================================
router.get('/users', async (req, res) => {
    try {
        const { role, status, search } = req.query;

        let sql = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.role,
                COALESCE(u.status, 'active') AS status,
                u.created_at,

                COALESCE(
                    fd.district,
                    bd.district,
                    fpod.district,
                    'West Bengal'
                ) AS district,

                COALESCE(
                    fd.phone,
                    bd.phone,
                    fpod.phone,
                    '—'
                ) AS phone,

                COALESCE(r_stats.trustScore, 5.0) AS trustScore,
                COALESCE(r_stats.reviewCount, 0) AS reviewCount,
                COALESCE(txn_stats.txnCount, 0) AS txnCount

            FROM users u

            LEFT JOIN farmer_details fd ON u.id = fd.user_id AND u.role = 'farmer'
            LEFT JOIN buyer_details bd ON u.id = bd.user_id AND u.role = 'buyer'
            LEFT JOIN fpo_details fpod ON u.id = fpod.user_id AND u.role = 'fpo'

            LEFT JOIN (
                SELECT reviewee_id, ROUND(AVG(rating), 1) AS trustScore, COUNT(*) AS reviewCount
                FROM reviews
                WHERE status = 'published'
                GROUP BY reviewee_id
            ) r_stats ON u.id = r_stats.reviewee_id

            LEFT JOIN (
                SELECT farmer_id AS uid, COUNT(*) AS txnCount FROM transactions GROUP BY farmer_id
                UNION ALL
                SELECT buyer_id AS uid, COUNT(*) AS txnCount FROM transactions GROUP BY buyer_id
            ) txn_stats ON u.id = txn_stats.uid

            WHERE u.role != 'admin'
        `;

        const params = [];

        if (role && role !== 'all' && role !== 'All Roles') {
            sql += ' AND u.role = ?';
            params.push(role.toLowerCase());
        }

        if (status && status !== 'all' && status !== 'All Status') {
            sql += ' AND u.status = ?';
            params.push(status.toLowerCase().replace(' ', '_'));
        }

        if (search && search.trim()) {
            sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.id = ?)';
            const term = `%${search.trim()}%`;
            params.push(term, term, Number(search) || 0);
        }

        sql += ' ORDER BY u.created_at DESC';

        const users = await query(sql, params);

        // Deduplicate counts if user had multiple union entries
        const userMap = new Map();
        for (const user of users) {
            if (!userMap.has(user.id)) {
                userMap.set(user.id, user);
            }
        }

        return res.json({ users: Array.from(userMap.values()) });

    } catch (err) {
        console.error('Admin users error:', err);
        return res.status(500).json({ error: 'Failed to load users', details: err.message });
    }
});

// UPDATE USER STATUS (Suspend / Reinstate / Approve)
// POST /api/admin/users/:userId/status
// Body: { status: 'active' | 'suspended' | 'under_review' }
router.post('/users/:userId/status', async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        const { status } = req.body;

        if (!userId) return res.status(400).json({ error: 'Valid user ID required' });
        if (!['active', 'suspended', 'under_review'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);

        // Send alert notification to user
        try {
            await query(`
                INSERT INTO notifications (user_id, title, message, type)
                VALUES (?, 'Account Status Updated', ?, 'warning')
            `, [userId, `Your AgriLink AI account status has been updated to: ${status.replace('_', ' ').toUpperCase()}.`]);
        } catch (e) {}

        return res.json({ success: true, message: `User status set to ${status}` });

    } catch (err) {
        console.error('Update user status error:', err);
        return res.status(500).json({ error: 'Update failed', details: err.message });
    }
});

// CREATE NEW USER BY ADMIN
// POST /api/admin/users/create
// Body: { name, email, password, role, district, phone }
router.post('/users/create', async (req, res) => {
    try {
        const { name, email, password, role, district, phone } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Name, email, password, and role are required' });
        }

        if (!['farmer', 'buyer', 'fpo'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if email exists
        const existing = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'A user with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userResult = await query(`
            INSERT INTO users (name, email, password, role, status)
            VALUES (?, ?, ?, ?, 'active')
        `, [name.trim(), email.trim().toLowerCase(), hashedPassword, role]);

        const newUserId = userResult.insertId;

        // Insert role details
        if (role === 'farmer') {
            await query(`
                INSERT INTO farmer_details (user_id, district, phone)
                VALUES (?, ?, ?)
            `, [newUserId, district || 'West Bengal', phone || '']);
        } else if (role === 'buyer') {
            await query(`
                INSERT INTO buyer_details (user_id, district, phone, company_name)
                VALUES (?, ?, ?, ?)
            `, [newUserId, district || 'West Bengal', phone || '', name.trim()]);
        } else if (role === 'fpo') {
            await query(`
                INSERT INTO fpo_details (user_id, district, phone, organization_name)
                VALUES (?, ?, ?, ?)
            `, [newUserId, district || 'West Bengal', phone || '', name.trim()]);
        }

        return res.status(201).json({
            success: true,
            message: `New ${role} account created successfully`,
            userId: newUserId
        });

    } catch (err) {
        console.error('Create user error:', err);
        return res.status(500).json({ error: 'Failed to create user', details: err.message });
    }
});

// DELETE USER BY ADMIN
// DELETE /api/admin/users/:userId
router.delete('/users/:userId', async (req, res) => {
    try {
        const userId = Number(req.params.userId);
        if (!userId) return res.status(400).json({ error: 'Valid user ID required' });

        // Prevent deleting admin
        const check = await query('SELECT role FROM users WHERE id = ?', [userId]);
        if (check.length === 0) return res.status(404).json({ error: 'User not found' });
        if (check[0].role === 'admin') return res.status(403).json({ error: 'Admin account cannot be deleted' });

        await query('DELETE FROM users WHERE id = ?', [userId]);
        return res.json({ success: true, message: 'User deleted successfully' });

    } catch (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({ error: 'Failed to delete user', details: err.message });
    }
});

// =====================================================
// 3. TRANSACTIONS MONITORING
// GET /api/admin/transactions
// =====================================================
router.get('/transactions', async (req, res) => {
    try {
        const { status, startDate, endDate, search } = req.query;

        let sql = `
            SELECT 
                t.id,
                t.offer_id,
                t.farmer_id,
                t.buyer_id,
                t.amount,
                t.quantity,
                t.status,
                t.transaction_date,

                ROUND(t.amount * 0.01, 2) AS platform_fee,

                p.crop_name,
                p.unit,
                p.quality,

                u_farmer.name AS seller_name,
                u_farmer.email AS seller_email,
                u_buyer.name AS buyer_name,
                u_buyer.email AS buyer_email,

                d.ticket_code AS dispute_ticket,
                d.status AS dispute_status,

                r.rating AS transaction_rating

            FROM transactions t
            LEFT JOIN offers o ON t.offer_id = o.id
            LEFT JOIN produce_listings p ON o.produce_id = p.id
            LEFT JOIN users u_farmer ON t.farmer_id = u_farmer.id
            LEFT JOIN users u_buyer ON t.buyer_id = u_buyer.id
            LEFT JOIN disputes d ON t.id = d.transaction_id
            LEFT JOIN reviews r ON t.id = r.transaction_id
            WHERE 1=1
        `;

        const params = [];

        if (status && status !== 'all' && status !== 'All Status') {
            if (status.toLowerCase() === 'flagged') {
                sql += " AND (d.status = 'open' OR d.status = 'under_review')";
            } else {
                sql += ' AND t.status = ?';
                params.push(status.toLowerCase());
            }
        }

        if (startDate) {
            sql += ' AND DATE(t.transaction_date) >= ?';
            params.push(startDate);
        }

        if (endDate) {
            sql += ' AND DATE(t.transaction_date) <= ?';
            params.push(endDate);
        }

        if (search && search.trim()) {
            sql += ' AND (u_farmer.name LIKE ? OR u_buyer.name LIKE ? OR p.crop_name LIKE ? OR t.id = ?)';
            const term = `%${search.trim()}%`;
            params.push(term, term, term, Number(search) || 0);
        }

        sql += ' ORDER BY t.transaction_date DESC';

        const transactions = await query(sql, params);

        return res.json({ transactions });

    } catch (err) {
        console.error('Admin transactions error:', err);
        return res.status(500).json({ error: 'Failed to load transactions', details: err.message });
    }
});

// =====================================================
// 4. DISPUTES MANAGEMENT
// GET /api/admin/disputes
// =====================================================
router.get('/disputes', async (req, res) => {
    try {
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
                u_raised.role AS raised_by_role,
                u_against.name AS against_name,
                u_against.role AS against_role

            FROM disputes d
            LEFT JOIN transactions t ON d.transaction_id = t.id
            LEFT JOIN offers o ON t.offer_id = o.id
            LEFT JOIN produce_listings p ON o.produce_id = p.id
            LEFT JOIN users u_raised ON d.raised_by_id = u_raised.id
            LEFT JOIN users u_against ON d.against_id = u_against.id

            ORDER BY 
                CASE WHEN d.status IN ('open', 'under_review') THEN 0 ELSE 1 END,
                d.created_at DESC
        `;

        const disputes = await query(sql);

        const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'under_review');
        const resolvedDisputes = disputes.filter(d => d.status === 'resolved' || d.status === 'dismissed');

        return res.json({
            disputes,
            openDisputes,
            resolvedDisputes,
            stats: {
                total: disputes.length,
                open: openDisputes.length,
                resolved: resolvedDisputes.length
            }
        });

    } catch (err) {
        console.error('Admin disputes error:', err);
        return res.status(500).json({ error: 'Failed to load disputes', details: err.message });
    }
});

// RESOLVE OR UPDATE DISPUTE
// POST /api/admin/disputes/:ticketId/status
// Body: { status: 'resolved' | 'dismissed' | 'under_review', resolution: string }
router.post('/disputes/:ticketId/status', async (req, res) => {
    try {
        const rawParam = req.params.ticketId;
        const numId = Number(rawParam);
        const isNumeric = Number.isInteger(numId) && numId > 0;
        const whereClause = isNumeric ? 'id = ?' : 'ticket_code = ?';
        const paramVal = isNumeric ? numId : rawParam;

        const { status, resolution } = req.body;

        if (!rawParam) return res.status(400).json({ error: 'Valid ticket ID or code required' });
        if (!['open', 'under_review', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid dispute status' });
        }

        const isResolved = status === 'resolved' || status === 'dismissed';

        await query(`
            UPDATE disputes 
            SET status = ?, 
                resolution = ?, 
                resolved_at = ?
            WHERE ${whereClause}
        `, [status, resolution ? String(resolution).trim() : null, isResolved ? new Date() : null, paramVal]);

        // Fetch dispute details to notify parties
        const dRow = await query(`SELECT ticket_code, raised_by_id, against_id FROM disputes WHERE ${whereClause}`, [paramVal]);
        if (dRow.length > 0) {
            const d = dRow[0];
            const msg = `Dispute ticket ${d.ticket_code} status has been updated to ${status.toUpperCase()}. Resolution: ${resolution || 'None'}`;
            try {
                await query(`
                    INSERT INTO notifications (user_id, title, message, type)
                    VALUES 
                    (?, 'Dispute Updated', ?, 'info'),
                    (?, 'Dispute Updated', ?, 'info')
                `, [d.raised_by_id, msg, d.against_id, msg]);
            } catch (e) {}
        }

        return res.json({ success: true, message: `Dispute status updated to ${status}` });

    } catch (err) {
        console.error('Update dispute status error:', err);
        return res.status(500).json({ error: 'Failed to update dispute', details: err.message });
    }
});

// =====================================================
// 5. REVIEWS & TRUST SCORE MODERATION
// GET /api/admin/reviews
// =====================================================
router.get('/reviews', async (req, res) => {
    try {
        const reviews = await query(`
            SELECT 
                r.id,
                r.transaction_id,
                r.rating,
                r.comment,
                r.status,
                r.created_at,
                u_by.name AS reviewer_name,
                u_by.role AS reviewer_role,
                u_to.name AS reviewee_name,
                u_to.role AS reviewee_role
            FROM reviews r
            LEFT JOIN users u_by ON r.reviewer_id = u_by.id
            LEFT JOIN users u_to ON r.reviewee_id = u_to.id
            ORDER BY r.created_at DESC
        `);

        return res.json({ reviews });

    } catch (err) {
        console.error('Admin reviews error:', err);
        return res.status(500).json({ error: 'Failed to load reviews', details: err.message });
    }
});

// MODERATE REVIEW
// POST /api/admin/reviews/:reviewId/status
// Body: { status: 'published' | 'hidden' | 'flagged' }
router.post('/reviews/:reviewId/status', async (req, res) => {
    try {
        const reviewId = Number(req.params.reviewId);
        const { status } = req.body;

        if (!reviewId || !['published', 'hidden', 'flagged'].includes(status)) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        await query('UPDATE reviews SET status = ? WHERE id = ?', [status, reviewId]);
        return res.json({ success: true, message: `Review status set to ${status}` });

    } catch (err) {
        console.error('Moderate review error:', err);
        return res.status(500).json({ error: 'Failed to update review status', details: err.message });
    }
});

// =====================================================
// 6. REPORTS DATA EXPORT
// GET /api/admin/reports/data?type=revenue|users|transactions|disputes
// =====================================================
router.get('/reports/data', async (req, res) => {
    try {
        const { type } = req.query;

        if (type === 'revenue') {
            const data = await query(`
                SELECT 
                    DATE_FORMAT(transaction_date, '%Y-%m') AS month,
                    COUNT(*) AS transactionCount,
                    SUM(amount) AS totalVolume,
                    ROUND(SUM(amount) * 0.01, 2) AS platformRevenue
                FROM transactions
                WHERE status = 'completed'
                GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
                ORDER BY month DESC
            `);
            return res.json({ data });
        }

        if (type === 'users') {
            const data = await query(`
                SELECT 
                    id, name, email, role, status, created_at
                FROM users
                WHERE role != 'admin'
                ORDER BY created_at DESC
            `);
            return res.json({ data });
        }

        if (type === 'disputes') {
            const data = await query(`
                SELECT 
                    ticket_code, transaction_id, issue_type, priority, status, resolution, created_at, resolved_at
                FROM disputes
                ORDER BY created_at DESC
            `);
            return res.json({ data });
        }

        // Default: transactions
        const data = await query(`
            SELECT 
                t.id, t.amount, t.quantity, t.status, t.transaction_date,
                ROUND(t.amount * 0.01, 2) AS fee,
                u_f.name AS seller, u_b.name AS buyer
            FROM transactions t
            LEFT JOIN users u_f ON t.farmer_id = u_f.id
            LEFT JOIN users u_b ON t.buyer_id = u_b.id
            ORDER BY t.transaction_date DESC
        `);
        return res.json({ data });

    } catch (err) {
        console.error('Reports data error:', err);
        return res.status(500).json({ error: 'Failed to load report data', details: err.message });
    }
});

// =====================================================
// 7. SYSTEM ANALYTICS
// GET /api/admin/analytics
// =====================================================
router.get('/analytics', async (req, res) => {
    try {
        const uptime = process.uptime();
        const mem = process.memoryUsage();

        const roleCounts = await query(`
            SELECT role, COUNT(*) AS count
            FROM users
            WHERE role != 'admin'
            GROUP BY role
        `);

        const txnByRole = await query(`
            SELECT 
                CASE 
                    WHEN o.id IS NOT NULL THEN 'Produce Marketplace'
                    ELSE 'Direct Contract'
                END AS channel,
                COUNT(*) AS count,
                SUM(t.amount) AS volume
            FROM transactions t
            LEFT JOIN offers o ON t.offer_id = o.id
            GROUP BY channel
        `);

        return res.json({
            system: {
                uptimeSeconds: Math.floor(uptime),
                uptimeReadable: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
                memoryMb: Math.round(mem.heapUsed / 1024 / 1024),
                apiUptime: '99.9%',
                latencyMs: 14
            },
            roleCounts,
            txnByRole
        });

    } catch (err) {
        console.error('Admin analytics error:', err);
        return res.status(500).json({ error: 'Failed to load analytics', details: err.message });
    }
});

module.exports = router;
