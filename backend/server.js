const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const authRoutes = require('./routes/auth');

const farmerRoutes = require('./routes/farmer');
const farmerProduceRoutes = require('./routes/farmer-produce');
const farmerOfferRoutes = require('./routes/farmer-offers');
const farmerTransactionRoutes = require('./routes/farmer-transactions');
const farmerLogisticsRoutes = require('./routes/farmer-logistics');

const buyerRoutes = require('./routes/buyer');
const buyerOfferRoutes = require('./routes/buyer-offers');
const buyerTransactionRoutes = require('./routes/buyer-transactions');
const buyerLogisticsRoutes = require('./routes/buyer-logistics');

const fpoRoutes = require('./routes/fpo');

const notificationRoutes = require('./routes/notifications');

const adminRoutes = require('./routes/admin');
const disputeRoutes = require('./routes/disputes');
const reviewRoutes = require('./routes/reviews');

const app = express();


// =====================================================
// MIDDLEWARE & STATIC ASSETS
// =====================================================

app.use(cors());

app.use(express.json());

// Serve static frontend files for Render and local cloud serving
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use(express.static(path.join(__dirname, '..')));


// =====================================================
// AUTH
// =====================================================

app.use(
    '/api/auth',
    authRoutes
);


// =====================================================
// FARMER
// =====================================================

app.use(
    '/api/farmer',
    farmerRoutes
);

app.use(
    '/api/farmer/produce',
    farmerProduceRoutes
);

app.use(
    '/api/farmer/offers',
    farmerOfferRoutes
);

app.use(
    '/api/farmer/transactions',
    farmerTransactionRoutes
);

app.use(
    '/api/farmer/logistics',
    farmerLogisticsRoutes
);


// =====================================================
// BUYER
// =====================================================

app.use(
    '/api/buyer/offers',
    buyerOfferRoutes
);

app.use(
    '/api/buyer/transactions',
    buyerTransactionRoutes
);

app.use(
    '/api/buyer/logistics',
    buyerLogisticsRoutes
);

app.use(
    '/api/buyer',
    buyerRoutes
);


// =====================================================
// FPO
// =====================================================

app.use(
    '/api/fpo',
    fpoRoutes
);


// =====================================================
// NOTIFICATIONS
// =====================================================

app.use(
    '/api/notifications',
    notificationRoutes
);

// =====================================================
// ADMIN, DISPUTES & REVIEWS
// =====================================================

app.use('/api/admin', adminRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/reviews', reviewRoutes);


// =====================================================
// ROOT
// =====================================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'AgriLink API',
        timestamp: new Date().toISOString()
    });
});


// =====================================================
// DATABASE TEST
// =====================================================

app.get('/api/test-db', (req, res) => {

    db.query(
        'SELECT 1 AS test',
        (err, results) => {

            if (err) {

                console.error(
                    'Database test error:',
                    err
                );

                return res.status(500).json({
                    error:
                        'Database connection failed',
                    details:
                        err.message
                });

            }

            return res.json({
                success: true,
                database: 'connected',
                result: results
            });

        }
    );

});


// =====================================================
// 404
// =====================================================

app.use((req, res) => {

    res.status(404).json({

        error:
            'API route not found',

        path:
            req.originalUrl

    });

});


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
    (err, req, res, next) => {

        console.error(
            'Server error:',
            err
        );

        res.status(500).json({

            error:
                'Internal server error',

            details:
                err.message

        });

    }
);


// =====================================================
// START SERVER
// =====================================================

const PORT =
    process.env.PORT || 5000;

app.listen(
    PORT,
    () => {

        console.log(
            `AgriLink AI Backend running on http://localhost:${PORT}`
        );

        // Keep-alive pinger to prevent Render free instance from sleeping
        const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL;
        if (renderUrl) {
            const https = renderUrl.startsWith('https') ? require('https') : require('http');
            const intervalMs = 12 * 60 * 1000; // 12 minutes (Render sleeps at 15 min)
            console.log(`[Keep-Alive] Active for ${renderUrl} every 12 minutes`);
            setInterval(() => {
                https.get(`${renderUrl}/api/health`, (res) => {
                    console.log(`[Keep-Alive] Self-ping status: ${res.statusCode}`);
                }).on('error', (err) => {
                    console.warn(`[Keep-Alive] Self-ping notice:`, err.message);
                });
            }, intervalMs);
        }

    }
);