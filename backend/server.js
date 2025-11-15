const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend')));
    console.log('✅ Serving frontend static files');
}

// Database connection with environment variables for Railway
const dbConfig = {
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || '',
    database: process.env.MYSQLDATABASE || 'sweet_crust_bakery',
    port: process.env.MYSQLPORT || 3306
};

console.log('🔧 Database Configuration:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port
});

const db = mysql.createConnection(dbConfig);

// Enhanced connection handling with retry logic
function connectToDatabase(retries = 5, delay = 3000) {
    db.connect((err) => {
        if (err) {
            console.error('❌ Database connection failed:', err.message);
            
            if (retries > 0) {
                console.log(`🔄 Retrying connection... (${retries} attempts left)`);
                setTimeout(() => connectToDatabase(retries - 1, delay), delay);
            } else {
                console.error('💥 Could not connect to database after multiple attempts');
                console.log('📋 Troubleshooting tips:');
                console.log('1. Check if MySQL service is running');
                console.log('2. Verify database credentials in environment variables');
                console.log('3. Ensure database exists');
                console.log('4. Check network connectivity');
            }
            return;
        }
        console.log('✅ Connected to MySQL database');
        console.log('📊 Using your existing MySQL table structure');
        checkAndInsertSampleData();
    });
}

// Connect to database
connectToDatabase();

function checkAndInsertSampleData() {
    // Use the correct column name: customer_name (not customerName)
    const checkSQL = `SELECT COUNT(*) as count FROM orders WHERE customer_name IN ('Bokang Nts''along', 'Tebello Mosh', 'Skomota Dance', 'Sargent Kokobela', 'Monyamane Bots''o')`;
    
    db.query(checkSQL, (err, results) => {
        if (err) {
            console.error('Error checking data:', err);
            // If the check fails, just continue - the data might already be there
            console.log('Continuing without sample data check...');
            return;
        }
        
        if (results[0].count === 0) {
            console.log('📝 Inserting sample data...');
            insertSampleData();
        } else {
            console.log('✅ Sample data already exists');
        }
    });
}

function insertSampleData() {
    // Use INSERT IGNORE to avoid duplicate errors
    const insertSQL = `
        INSERT IGNORE INTO orders (order_id, customer_name, product_ordered, quantity, order_date, order_status) VALUES
        ('ORD001', 'Bokang Nts''along', 'cake', 2, '2025-11-14', 'Complete'),
        ('ORD002', 'Tebello Mosh', 'bread', 5, '2025-11-14', 'Pending'),
        ('ORD003', 'Skomota Dance', 'muffin', 12, '2025-11-13', 'Complete'),
        ('ORD004', 'Sargent Kokobela', 'pastry', 6, '2025-11-13', 'Pending'),
        ('ORD005', 'Monyamane Bots''o', 'croissant', 4, '2025-11-13', 'Pending')
    `;
    
    db.query(insertSQL, (err, result) => {
        if (err) {
            console.error('Error inserting sample data:', err);
        } else {
            if (result.affectedRows > 0) {
                console.log(`✅ ${result.affectedRows} sample records inserted`);
            } else {
                console.log('✅ Sample data already exists (no duplicates inserted)');
            }
        }
    });
}

// API Routes - Using your exact column names
app.get('/api/orders', (req, res) => {
    const sql = `
        SELECT 
            id,
            order_id as orderId,
            customer_name as customerName,
            product_ordered as product,
            quantity,
            order_date as orderDate,
            order_status as status,
            created_at as createdAt,
            updated_at as updatedAt
        FROM orders 
        ORDER BY order_date DESC, id DESC
    `;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ error: 'Failed to fetch orders' });
        }
        res.json(results);
    });
});

app.post('/api/orders', (req, res) => {
    const { orderId, customerName, product, quantity, orderDate, status } = req.body;
    
    // Validation
    if (!orderId || !customerName || !product || !quantity || !orderDate || !status) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Convert status to match your ENUM values ('Pending', 'Complete')
    const mysqlStatus = status === 'completed' ? 'Complete' : 'Pending';
    
    const sql = `
        INSERT INTO orders (order_id, customer_name, product_ordered, quantity, order_date, order_status) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    db.query(sql, [orderId, customerName, product, quantity, orderDate, mysqlStatus], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Order ID already exists' });
            }
            console.error('Error creating order:', err);
            return res.status(500).json({ error: 'Failed to create order' });
        }
        res.json({ 
            id: result.insertId, 
            message: 'Order created successfully'
        });
    });
});

app.put('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { customerName, product, quantity, orderDate, status } = req.body;
    
    // Validation
    if (!customerName || !product || !quantity || !orderDate || !status) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Convert status to match your ENUM values
    const mysqlStatus = status === 'completed' ? 'Complete' : 'Pending';
    
    const sql = `
        UPDATE orders 
        SET customer_name=?, product_ordered=?, quantity=?, order_date=?, order_status=?, updated_at=CURRENT_TIMESTAMP 
        WHERE id=?
    `;
    
    db.query(sql, [customerName, product, quantity, orderDate, mysqlStatus, id], (err, result) => {
        if (err) {
            console.error('Error updating order:', err);
            return res.status(500).json({ error: 'Failed to update order' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order updated successfully' });
    });
});

app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM orders WHERE id=?';
    
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting order:', err);
            return res.status(500).json({ error: 'Failed to delete order' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    // Check database connection
    db.query('SELECT 1', (err) => {
        if (err) {
            return res.status(500).json({ 
                status: 'ERROR', 
                message: 'Database connection failed',
                error: err.message 
            });
        }
        res.json({ 
            status: 'OK', 
            message: 'Sweet Crust Bakery API is running',
            database: 'Connected',
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString()
        });
    });
});

// Serve frontend for all other routes in production
if (process.env.NODE_ENV === 'production') {
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
} else {
    // In development, just provide a message for root route
    app.get('/', (req, res) => {
        res.json({ 
            message: 'Sweet Crust Bakery API Server',
            frontend: 'Run frontend separately on http://localhost:3000',
            environment: 'development'
        });
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('🛑 Shutting down gracefully...');
    db.end();
    process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🍪 Sweet Crust Bakery Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${dbConfig.database}@${dbConfig.host}:${dbConfig.port}`);
    
    if (process.env.NODE_ENV === 'production') {
        console.log('🚀 Production mode: Serving frontend + backend');
    } else {
        console.log('🔧 Development mode: Backend only - frontend runs separately');
    }
});