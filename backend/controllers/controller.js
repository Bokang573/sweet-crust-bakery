const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mysql'
});

db.connect((err) => {
    if (err) {
        console.log('MySQL connection failed. Make sure XAMPP MySQL is running.');
        console.log('Error:', err.message);
        return;
    }
    console.log('Connected to MySQL database');
    
    createDatabase();
});

function createDatabase() {
    db.query('CREATE DATABASE IF NOT EXISTS bakery_orders', (err) => {
        if (err) {
            console.log('Error creating database:', err.message);
            return;
        }
        
        db.query('USE bakery_orders', (err) => {
            if (err) {
                console.log('Error using database:', err.message);
                return;
            }
            
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
                ('ORD001', 'Monyase Mosh', 'Cake', 2, '2024-01-15', 'Pending'),
                ('ORD002', 'Moshesha Achuzzy', 'Bread', 5, '2024-01-15', 'Completed')
            `;
            db.query(sampleSQL);
            console.log('data inserted');
        }
    });
}

module.exports = db;  