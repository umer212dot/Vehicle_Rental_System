-- Reset all data
TRUNCATE admin RESTART IDENTITY CASCADE;
TRUNCATE customer RESTART IDENTITY CASCADE;
TRUNCATE maintenance_record RESTART IDENTITY CASCADE;
TRUNCATE payment RESTART IDENTITY CASCADE;
TRUNCATE rental RESTART IDENTITY CASCADE;
TRUNCATE review RESTART IDENTITY CASCADE;
TRUNCATE users RESTART IDENTITY CASCADE;
TRUNCATE vehicle RESTART IDENTITY CASCADE;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert users
INSERT INTO public.users (email, password_hash, role) VALUES 
('alice@example.com', crypt('hashed_pw_1', gen_salt('bf')), 'Customer'), -- user_id = 1
('bob@example.com', crypt('hashed_pw_2', gen_salt('bf')), 'Customer'),   -- user_id = 2
('admin1@example.com', crypt('hashed_pw_3', gen_salt('bf')), 'Admin'),   -- user_id = 3
('john@example.com', crypt('hashed_pw_4', gen_salt('bf')), 'Customer'),  -- user_id = 4
('lucy_admin@example.com', crypt('hashed_pw_5', gen_salt('bf')), 'Admin'),-- user_id = 5
('mia@example.com', crypt('hashed_pw_6', gen_salt('bf')), 'Customer'),   -- user_id = 6
('tom@example.com', crypt('hashed_pw_7', gen_salt('bf')), 'Customer');   -- user_id = 7

-- Admins
INSERT INTO public.admin (name, email, user_id) VALUES 
('Alice Admin', 'admin1@example.com', 3),
('Lucy Admin', 'lucy_admin@example.com', 5);

-- Customers (all mapped to users)
INSERT INTO public.customer (name, email, phone, license_number, user_id) VALUES 
('Alice Johnson', 'alice@example.com', '111-111-1111', 'LIC001', 1),
('Bob Smith', 'bob@example.com', '222-222-2222', 'LIC002', 2),
('John Carter', 'john@example.com', '333-333-3333', 'LIC003', 4),
('Mia Wong', 'mia@example.com', '444-444-4444', 'LIC004', 6),
('Tom Hardy', 'tom@example.com', '555-555-5555', 'LIC005', 7);

-- Vehicles
INSERT INTO public.vehicle (model, type, price_per_day, availability, brand, vehicle_no_plate, image_path, transmission, color, year) VALUES 
('Camry', 'Sedan', 50.00, true, 'Toyota', 'ABC-321', '/images/vehicles/camry.jpg', 'Automatic', 'White', 2021),
('Ranger', 'Truck', 75.00, true, 'Ford', 'QWE-541', '/images/vehicles/ranger.jpg', 'Manual', 'Blue', 2020),
('Model 3', 'Sedan', 120.00, true, 'Tesla', 'TRF-567', '/images/vehicles/model3.jpg', 'Automatic', 'Black', 2023),
('Duke 390', 'Bike', 40.00, true, 'KTM', 'POL-098', '/images/vehicles/duke.jpg', 'Manual', 'Orange', 2022),
('Tucson', 'SUV', 90.00, true, 'Hyundai', 'GRT-445', '/images/vehicles/tucson.jpg', 'Automatic', 'Silver', 2021);

-- Rentals
INSERT INTO public.rental (customer_id, vehicle_id, rental_date, return_date, status, total_fee) VALUES 
(1, 1, '2024-04-01', '2024-04-04', 'Completed', 150.00),
(2, 2, '2024-04-05', '2024-04-08', 'Completed', 225.00),
(3, 3, '2024-03-20', '2024-03-25', 'Completed', 600.00),
(4, 4, '2024-04-10', '2024-04-12', 'Completed', 80.00),
(5, 5, '2024-03-15', '2024-03-18', 'Completed', 270.00);

-- Payments
INSERT INTO public.payment (rental_id, amount, payment_status, payment_date) VALUES 
(1, 150.00, 'Completed', '2024-04-04'),
(2, 225.00, 'Completed', '2024-04-08'),
(3, 600.00, 'Completed', '2024-03-25'),
(4, 80.00, 'Completed', '2024-04-12'),
(5, 270.00, 'Completed', '2024-03-18');

-- Reviews (only for completed rentals)
INSERT INTO public.review (rental_id, rating, comments) VALUES 
(1, 5, 'Smooth ride and clean car.'),
(2, 4, 'Strong truck, worked great.'),
(3, 5, 'Absolutely loved the Tesla!'),
(4, 4, 'Fun to ride the Duke 390.'),
(5, 3, 'Nice SUV but had a minor AC issue.');

-- Maintenance Records
-- INSERT INTO public.maintenance_record (vehicle_id, description, cost, maintenance_date, status) VALUES 
-- (1, 'Oil change and filter replacement', 85.00, '2025-06-01', 'Scheduled'),
-- (2, 'Engine checkup and minor repairs', 200.00, '2025-06-10', 'Scheduled'),
-- (3, 'Battery inspection and software update', 100.00, '2025-06-15', 'Scheduled'),
-- (4, 'Brake pad replacement', 60.00, '2025-06-25', 'Scheduled'),
-- (5, 'Transmission fluid change', 120.00, '2025-06-28', 'Scheduled');
