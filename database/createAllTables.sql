CREATE TYPE rental_status AS ENUM ('Ongoing', 'Completed', 'Cancelled');
ALTER TYPE rental_status ADD VALUE 'Pending';
ALTER TYPE rental_status ADD VALUE 'Awaiting Approval';

CREATE TYPE payment_status AS ENUM ('Pending', 'Completed', 'Failed');
CREATE TYPE user_type AS ENUM ('Customer', 'Admin');
-- Table: public.users
-- DROP TABLE IF EXISTS public.users;

CREATE TABLE IF NOT EXISTS public.users
(
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    password_hash character varying(255) COLLATE pg_catalog."default" NOT NULL,
    role user_type NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id serial NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;
	
-- Table: public.customer
-- DROP TABLE IF EXISTS public.customer;

CREATE TABLE IF NOT EXISTS public.customer
(
    customer_id serial NOT NULL,
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    phone character varying(15) COLLATE pg_catalog."default" NOT NULL,
    license_number character varying(20) COLLATE pg_catalog."default" NOT NULL,
    user_id integer,
    CONSTRAINT customer_pkey PRIMARY KEY (customer_id),
    CONSTRAINT customer_email_key UNIQUE (email),
    CONSTRAINT customer_license_number_key UNIQUE (license_number),
    CONSTRAINT customer_phone_key UNIQUE (phone),
    CONSTRAINT customer_user_id_key UNIQUE (user_id),
    CONSTRAINT customer_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.customer
    OWNER to postgres;

-- Table: public.vehicle
-- DROP TABLE IF EXISTS public.vehicle;

CREATE TABLE IF NOT EXISTS public.vehicle
(
    vehicle_id serial NOT NULL,
    model character varying(100) COLLATE pg_catalog."default" NOT NULL,
    type character varying(50) COLLATE pg_catalog."default" NOT NULL,
    price_per_day numeric(10,2) NOT NULL,
    availability boolean DEFAULT true,
    brand character varying(100) COLLATE pg_catalog."default" NOT NULL,
    image_path text COLLATE pg_catalog."default" NOT NULL,
    transmission character varying(100) COLLATE pg_catalog."default" NOT NULL,
    color character varying(32) COLLATE pg_catalog."default" NOT NULL,
    year integer NOT NULL,
    CONSTRAINT vehicle_pkey PRIMARY KEY (vehicle_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.vehicle
    OWNER to postgres;
	
-- Table: public.rental
-- DROP TABLE IF EXISTS public.rental;

CREATE TABLE IF NOT EXISTS public.rental
(
    rental_id serial NOT NULL,
    customer_id integer,
    vehicle_id integer,
    rental_date date NOT NULL,
    return_date date,
    status rental_status DEFAULT 'Ongoing'::rental_status,
    CONSTRAINT rental_pkey PRIMARY KEY (rental_id),
    CONSTRAINT rental_customer_id_fkey FOREIGN KEY (customer_id)
        REFERENCES public.customer (customer_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT rental_vehicle_id_fkey FOREIGN KEY (vehicle_id)
        REFERENCES public.vehicle (vehicle_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.rental
    OWNER to postgres;
ALTER TABLE public.rental
ADD COLUMN IF NOT EXISTS total_fee numeric(10,2);
-- Table: public.payment
-- DROP TABLE IF EXISTS public.payment;

CREATE TABLE IF NOT EXISTS public.payment
(
    payment_id serial NOT NULL,
    rental_id integer,
    amount numeric(10,2) NOT NULL,
    payment_status payment_status DEFAULT 'Pending'::payment_status,
    payment_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_pkey PRIMARY KEY (payment_id),
    CONSTRAINT payment_rental_id_fkey FOREIGN KEY (rental_id)
        REFERENCES public.rental (rental_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.payment
    OWNER to postgres;


-- Table: public.review
-- DROP TABLE IF EXISTS public.review;

CREATE TABLE IF NOT EXISTS public.review
(
    review_id serial NOT NULL,
    rental_id integer,
    rating integer,
    comments text COLLATE pg_catalog."default",
    review_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT review_pkey PRIMARY KEY (review_id),
    CONSTRAINT review_rental_id_fkey FOREIGN KEY (rental_id)
        REFERENCES public.rental (rental_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE,
    CONSTRAINT review_rating_check CHECK (rating >= 1 AND rating <= 5)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.review
    OWNER to postgres;

ALTER TABLE review
ALTER COLUMN review_date TYPE date USING review_date::date,
ALTER COLUMN review_date SET DEFAULT CURRENT_DATE;

-- Table: public.maintenance_record
-- DROP TABLE IF EXISTS public.maintenance_record;

CREATE TABLE IF NOT EXISTS public.maintenance_record
(
    maintenance_id serial NOT NULL,
    vehicle_id integer,
    description text COLLATE pg_catalog."default" NOT NULL,
    cost numeric(10,2) NOT NULL,
    maintenance_date date NOT NULL,
    CONSTRAINT maintenance_record_pkey PRIMARY KEY (maintenance_id),
    CONSTRAINT maintenance_record_vehicle_id_fkey FOREIGN KEY (vehicle_id)
        REFERENCES public.vehicle (vehicle_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.maintenance_record
    OWNER to postgres;

-- Table: public.admin
-- DROP TABLE IF EXISTS public.admin;

CREATE TABLE IF NOT EXISTS public.admin
(
    admin_id serial NOT NULL,
    name character varying(100) COLLATE pg_catalog."default" NOT NULL,
    email character varying(100) COLLATE pg_catalog."default" NOT NULL,
    user_id integer,
    CONSTRAINT admin_pkey PRIMARY KEY (admin_id),
    CONSTRAINT admin_email_key UNIQUE (email),
    CONSTRAINT admin_user_id_key UNIQUE (user_id),
    CONSTRAINT admin_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (user_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.admin
    OWNER to postgres;