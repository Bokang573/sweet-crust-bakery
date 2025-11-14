const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mysql' // Connect to default database first
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.log('MySQL connection failed. Make sure XAMPP MySQL is running.');
        console.log('Error:', err.message);
        return;
    }
    console.log('Connected to MySQL database');
    
    // Create database and table
    createDatabase();
});

function createDatabase() {
    // Create database if not exists
    db.query('CREATE DATABASE IF NOT EXISTS bakery_orders', (err) => {
        if (err) {
            console.log('Error creating database:', err.message);
            return;
        }
        
        // Use the database
        db.query('USE bakery_orders', (err) => {
            if (err) {
                console.log('Error using database:', err.message);
                return;
            }
            
            // Create table if not exists
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS orders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    order_id VARCHAR(50) NOT NULL UNIQUE,
                    customer_name VARCHAR(100) NOT NULL,
                    product_ordered VARCHAR(100) NOT NULL,
                    quantity INT NOT NULL,
                    order_date DATE NOT NULL,
                    order_status ENUM('Pending', 'Completed') DEFAULT 'Pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            
            db.query(createTableSQL, (err) => {
                if (err) {
                    console.log('Error creating table:', err.message);
                } else {
                    console.log('Database and table ready!');
                    
                    // Insert sample data
                    insertSampleData();
                }
            });
        });
    });
}

function insertSampleData() {
    const checkSQL = 'SELECT COUNT(*) as count FROM orders';
    db.query(checkSQL, (err, results) => {
        if (err) return;
        
        if (results[0].count === 0) {
            const sampleSQL = `
                INSERT INTO orders (order_id, customer_name, product_ordered, quantity, order_date, order_status) 
                VALUES 
                ('ORD001', 'John Doe', 'Cake', 2, '2024-01-15', 'Pending'),
                ('ORD002', 'Jane Smith', 'Bread', 5, '2024-01-15', 'Completed')
            `;
            db.query(sampleSQL);
            console.log('Sample data inserted');
        }
    });
}

// Routes

// Get all orders
app.get('/api/orders', (req, res) => {
    const sql = 'SELECT * FROM orders ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err.message);
            return res.status(500).json({ error: 'Failed to fetch orders' });
        }
        res.json(results);
    });
});

// Add new order
app.post('/api/orders', (req, res) => {
    const { order_id, customer_name, product_ordered, quantity, order_date, order_status } = req.body;
    
    // Validation
    if (!order_id || !customer_name || !product_ordered || !quantity || !order_date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = `INSERT INTO orders (order_id, customer_name, product_ordered, quantity, order_date, order_status) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [order_id, customer_name, product_ordered, quantity, order_date, order_status || 'Pending'], 
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Order ID already exists' });
                }
                console.error('Error adding order:', err.message);
                return res.status(500).json({ error: 'Failed to add order' });
            }
            res.json({ 
                message: 'Order added successfully', 
                id: result.insertId 
            });
        });
});

// Update order status
app.put('/api/orders/:id', (req, res) => {
    const { order_status } = req.body;
    const orderId = req.params.id;

    const sql = 'UPDATE orders SET order_status = ? WHERE id = ?';
    db.query(sql, [order_status, orderId], (err, result) => {
        if (err) {
            console.error('Error updating order:', err.message);
            return res.status(500).json({ error: 'Failed to update order' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order updated successfully' });
    });
});

// Delete order
app.delete('/api/orders/:id', (req, res) => {
    const orderId = req.params.id;

    const sql = 'DELETE FROM orders WHERE id = ?';
    db.query(sql, [orderId], (err, result) => {
        if (err) {
            console.error('Error deleting order:', err.message);
            return res.status(500).json({ error: 'Failed to delete order' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log('Make sure XAMPP MySQL is running!');
});