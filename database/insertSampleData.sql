INSERT INTO public.users (email, password_hash, role) VALUES 
('alice@example.com', 'hashed_pw_1', 'Customer'),
('bob@example.com', 'hashed_pw_2', 'Customer'),
('admin1@example.com', 'hashed_pw_3', 'Admin'),
('john@example.com', 'hashed_pw_4', 'Customer'),
('lucy_admin@example.com', 'hashed_pw_5', 'Admin');

INSERT INTO public.admin (name, email, user_id) VALUES 
('Alice Admin', 'admin1@example.com', 3),
('Lucy Admin', 'lucy_admin@example.com', 5);

INSERT INTO public.customer (name, email, phone, license_number, user_id) VALUES 
('Alice Johnson', 'alice@example.com', '111-111-1111', 'LIC001', 1),
('Bob Smith', 'bob@example.com', '222-222-2222', 'LIC002', 2),
('John Carter', 'john@example.com', '333-333-3333', 'LIC003', 4),
('Mia Wong', 'mia@example.com', '444-444-4444', 'LIC004', NULL),
('Tom Hardy', 'tom@example.com', '555-555-5555', 'LIC005', NULL);

INSERT INTO public.vehicle ( model, type, price_per_day, availability, brand, image_path, transmission, color, year ) VALUES 
('Toyota Camry', 'Sedan', 50.00, true, 'Toyota', '/images/camry.jpg', 'Automatic', 'White', 2021),
('Ford Ranger', 'Truck', 75.00, true, 'Ford', '/images/ranger.jpg', 'Manual', 'Blue', 2020),
('Tesla Model 3', 'Sedan', 120.00, true, 'Tesla', '/images/model3.jpg', 'Automatic', 'Black', 2023),
('KTM Duke 390', 'Bike', 40.00, true, 'KTM', '/images/duke.jpg', 'Manual', 'Orange', 2022),
('Hyundai Tucson', 'SUV', 90.00, true, 'Hyundai', '/images/tucson.jpg', 'Automatic', 'Silver', 2021);

INSERT INTO public.rental (customer_id, vehicle_id, rental_date, return_date, status) VALUES 
(1, 1, '2024-04-01', '2024-04-04', 'Completed'),
(2, 2, '2024-04-05', NULL, 'Ongoing'),
(3, 3, '2024-03-20', '2024-03-25', 'Completed'),
(4, 4, '2024-04-10', NULL, 'Ongoing'),
(5, 5, '2024-03-15', '2024-03-18', 'Cancelled');

INSERT INTO public.payment (rental_id, amount, payment_status, payment_date) VALUES 
(1, 150.00, 'Completed', '2024-04-04'),
(2, 75.00, 'Pending', DEFAULT),
(3, 360.00, 'Completed', '2024-03-25'),
(4, 120.00, 'Pending', DEFAULT),
(5, 270.00, 'Failed', '2024-03-18');

INSERT INTO public.review (customer_id, vehicle_id, rating, comments) VALUES 
(1, 1, 5, 'Smooth ride and clean car.'),
(2, 2, 4, 'Strong truck, worked great.'),
(3, 3, 5, 'Absolutely loved the Tesla!'),
(4, 4, 4, 'Fun to ride the Duke 390.'),
(5, 5, 3, 'Nice SUV but had a minor AC issue.');

INSERT INTO public.maintenance_record (vehicle_id, description, cost, maintenance_date) VALUES 
(1, 'Oil change and filter replacement', 85.00, '2024-03-01'),
(2, 'Engine checkup and minor repairs', 200.00, '2024-03-10'),
(3, 'Battery inspection and software update', 100.00, '2024-02-15'),
(4, 'Brake pad replacement', 60.00, '2024-01-25'),
(5, 'Transmission fluid change', 120.00, '2024-02-28');