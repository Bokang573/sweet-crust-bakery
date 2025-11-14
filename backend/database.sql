CREATE DATABASE IF NOT EXISTS bakery_orders;
USE bakery_orders;

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(100) NOT NULL,
    product_ordered VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    order_date DATE NOT NULL,
    order_status ENUM('Pending', 'Completed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO orders (order_id, customer_name, product_ordered, quantity, order_date, order_status) 
VALUES 
('ORD001', 'Moshesha Mosh', 'Cake', 2, '2024-01-15', 'Pending'),
('ORD002', 'Jabulane Ntipe', 'Bread', 5, '2024-01-15', 'Completed');