-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS update_vehicle_availability_on_rental_status ON rental;

-- Drop the function if it already exists
DROP FUNCTION IF EXISTS update_vehicle_availability();

-- Create the function that will be called by the trigger
CREATE OR REPLACE FUNCTION update_vehicle_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- If new status is 'Ongoing', mark vehicle as unavailable
    IF NEW.status = 'Ongoing' THEN
        UPDATE vehicle
        SET availability = FALSE
        WHERE vehicle_id = NEW.vehicle_id;
    
    -- If new status is 'Completed' or 'Cancelled', mark vehicle as available
    ELSIF NEW.status = 'Completed' OR NEW.status = 'Cancelled' THEN
        UPDATE vehicle
        SET availability = TRUE
        WHERE vehicle_id = NEW.vehicle_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_vehicle_availability_on_rental_status
AFTER UPDATE OF status ON rental
FOR EACH ROW
EXECUTE FUNCTION update_vehicle_availability();

-- Log that the trigger has been created
DO $$
BEGIN
    RAISE NOTICE 'Vehicle availability trigger created successfully';
END $$; 