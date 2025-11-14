const db = require('./controller');

const orderController = {
    // Get all orders
    getAllOrders: (req, res) => {
        const sql = 'SELECT * FROM orders ORDER BY created_at DESC';
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error fetching orders:', err.message);
                return res.status(500).json({ error: 'Failed to fetch orders' });
            }
            res.json(results);
        });
    },

    // Get order by ID
    getOrderById: (req, res) => {
        const orderId = req.params.id;
        const sql = 'SELECT * FROM orders WHERE id = ?';
        
        db.query(sql, [orderId], (err, results) => {
            if (err) {
                console.error('Error fetching order:', err.message);
                return res.status(500).json({ error: 'Failed to fetch order' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }
            res.json(results[0]);
        });
    },

    // Create new order
    createOrder: (req, res) => {
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
                res.status(201).json({ 
                    message: 'Order added successfully', 
                    id: result.insertId 
                });
            });
    },

    // Update order status
    updateOrderStatus: (req, res) => {
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
    },

    // Delete order
    deleteOrder: (req, res) => {
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
    }
};

module.exports = orderController;