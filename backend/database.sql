CREATE DATABASE IF NOT EXISTS sweet_crust_bakery;
USE sweet_crust_bakery;

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    orderId VARCHAR(50) UNIQUE NOT NULL,
    customerName VARCHAR(100) NOT NULL,
    product VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    orderDate DATE NOT NULL,
    status ENUM('pending', 'processing', 'completed') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample data
INSERT INTO orders (orderId, customerName, product, quantity, orderDate, status) VALUES
('ORD001', 'Bokang Nts''along', 'cake', 2, '2025-11-14', 'completed'),
('ORD002', 'Tebello Mosh', 'bread', 5, '2025-11-14', 'pending'),
('ORD003', 'Skomota Dance', 'muffin', 12, '2025-11-13', 'completed'),
('ORD004', 'Sargent Kokobela', 'pastry', 6, '2025-11-13', 'processing'),
('ORD005', 'Monyamane Bots''o', 'croissant', 4, '2025-11-13', 'pending');