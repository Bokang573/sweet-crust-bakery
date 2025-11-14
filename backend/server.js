const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sweet_crust_bakery'
});

// Connect to database
db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to MySQL database');
    console.log('📊 Using your existing MySQL table structure');
    checkAndInsertSampleData();
});

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
    res.json({ 
        status: 'OK', 
        message: 'Sweet Crust Bakery API is running',
        database: 'Connected'
    });
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`🍪 Sweet Crust Bakery Server running on http://localhost:${PORT}`);
});