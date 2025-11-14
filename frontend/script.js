const API_BASE = 'http://localhost:3000/api';

// Database functions
async function getOrders() {
    try {
        const response = await fetch(`${API_BASE}/orders`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        const orders = await response.json();
        return orders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        // Fallback to empty array if server is down
        return [];
    }
}

async function addOrder(order) {
    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create order');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
}

async function updateOrder(id, order) {
    try {
        const response = await fetch(`${API_BASE}/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update order');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error updating order:', error);
        throw error;
    }
}

async function deleteOrder(id) {
    try {
        const response = await fetch(`${API_BASE}/orders/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete order');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error deleting order:', error);
        throw error;
    }
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

// Render orders table
async function renderOrders() {
    try {
        const orders = await getOrders();
        const tbody = document.getElementById('orders-tbody');
        tbody.innerHTML = '';
        
        orders.forEach(order => {
            // Convert database status to frontend display
            let statusClass = 'status-pending';
            let displayStatus = order.status;
            
            if (order.status === 'Complete' || order.status === 'completed') {
                statusClass = 'status-completed';
                displayStatus = 'completed';
            } else if (order.status === 'Pending' || order.status === 'pending') {
                statusClass = 'status-pending';
                displayStatus = 'pending';
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderId}</td>
                <td>${order.customerName}</td>
                <td>${order.product}</td>
                <td>${order.quantity}</td>
                <td>${formatDate(order.orderDate)}</td>
                <td><span class="status ${statusClass}">${displayStatus}</span></td>
                <td class="actions">
                    <button class="action-btn" title="View" onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i></button>
                    <button class="action-btn" title="Edit" onclick="editOrder(${order.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn" title="Delete" onclick="deleteOrderConfirm(${order.id})"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        updateStats(orders);
    } catch (error) {
        console.error('Error rendering orders:', error);
    }
}

// Update dashboard statistics
function updateStats(orders) {
    if (!orders) return;
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => 
        order.status === 'Pending' || order.status === 'pending'
    ).length;
    const completedOrders = orders.filter(order => 
        order.status === 'Complete' || order.status === 'completed'
    ).length;
    
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('pending-orders').textContent = pendingOrders;
    document.getElementById('completed-orders').textContent = completedOrders;
    document.getElementById('order-count').textContent = totalOrders;
}

// View order details
async function viewOrder(id) {
    try {
        const orders = await getOrders();
        const order = orders.find(o => o.id === id);
        if (order) {
            alert(`Order Details:\n\nOrder ID: ${order.orderId}\nCustomer: ${order.customerName}\nProduct: ${order.product}\nQuantity: ${order.quantity}\nDate: ${formatDate(order.orderDate)}\nStatus: ${order.status}`);
        }
    } catch (error) {
        console.error('Error viewing order:', error);
        alert('Error loading order details');
    }
}

// Edit order
async function editOrder(id) {
    try {
        const orders = await getOrders();
        const order = orders.find(o => o.id === id);
        if (order) {
            document.getElementById('edit-order-id').value = order.id;
            document.getElementById('edit-customer-name').value = order.customerName;
            document.getElementById('edit-product').value = order.product;
            document.getElementById('edit-quantity').value = order.quantity;
            document.getElementById('edit-order-date').value = order.orderDate;
            
            // Convert status for frontend
            const frontendStatus = order.status === 'Complete' ? 'completed' : 'pending';
            document.getElementById('edit-status').value = frontendStatus;
            
            document.getElementById('edit-modal').style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading order for edit:', error);
        alert('Error loading order for editing');
    }
}

// Delete order with confirmation
async function deleteOrderConfirm(id) {
    try {
        const orders = await getOrders();
        const order = orders.find(o => o.id === id);
        if (order && confirm(`Are you sure you want to delete order ${order.orderId}?`)) {
            await deleteOrder(id);
            await renderOrders();
            alert(`Order ${order.orderId} has been deleted.`);
        }
    } catch (error) {
        console.error('Error deleting order:', error);
        alert('Error deleting order: ' + error.message);
    }
}

// Initialize the application
function init() {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('order-date').value = today;
    
    // Load orders
    renderOrders();
    
    // Add order button event
    document.getElementById('add-order-btn').addEventListener('click', async function() {
        const orderId = document.getElementById('order-id').value.trim();
        const customerName = document.getElementById('customer-name').value.trim();
        const product = document.getElementById('product').value;
        const quantity = document.getElementById('quantity').value;
        const orderDate = document.getElementById('order-date').value;
        const status = document.getElementById('status').value;
        
        // Validation
        if (!orderId || !customerName || !product || !quantity || !orderDate || !status) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (isNaN(quantity) || quantity < 1) {
            alert('Please enter a valid quantity (minimum 1)');
            return;
        }
        
        try {
            const newOrder = {
                orderId,
                customerName,
                product,
                quantity: parseInt(quantity),
                orderDate,
                status
            };
            
            await addOrder(newOrder);
            await renderOrders();
            alert('Order added successfully!');
            
            // Reset form but keep today's date
            document.getElementById('order-form').reset();
            document.getElementById('order-date').value = today;
        } catch (error) {
            alert('Error adding order: ' + error.message);
        }
    });
    
    // Update order button event
    document.getElementById('update-order-btn').addEventListener('click', async function() {
        const id = parseInt(document.getElementById('edit-order-id').value);
        const customerName = document.getElementById('edit-customer-name').value.trim();
        const product = document.getElementById('edit-product').value;
        const quantity = document.getElementById('edit-quantity').value;
        const orderDate = document.getElementById('edit-order-date').value;
        const status = document.getElementById('edit-status').value;
        
        // Validation
        if (!customerName || !product || !quantity || !orderDate || !status) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (isNaN(quantity) || quantity < 1) {
            alert('Please enter a valid quantity (minimum 1)');
            return;
        }
        
        try {
            const updatedOrder = {
                customerName,
                product,
                quantity: parseInt(quantity),
                orderDate,
                status
            };
            
            await updateOrder(id, updatedOrder);
            await renderOrders();
            document.getElementById('edit-modal').style.display = 'none';
            alert('Order updated successfully!');
        } catch (error) {
            alert('Error updating order: ' + error.message);
        }
    });
    
    // Close modal events
    document.getElementById('close-edit-modal').addEventListener('click', function() {
        document.getElementById('edit-modal').style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('edit-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);