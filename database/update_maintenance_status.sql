-- DROP PROCEDURE IF EXISTS public.update_maintenance_status();

CREATE OR REPLACE PROCEDURE public.update_maintenance_status(
	)
LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    current_date_value date := CURRENT_DATE;
BEGIN
    -- Update Completed
    UPDATE public.maintenance_record
    SET status = 'Completed'
    WHERE maintenance_date < current_date_value;

    -- Update Ongoing
    UPDATE public.maintenance_record
    SET status = 'Due Today'
    WHERE maintenance_date = current_date_value;

    -- Update Scheduled
    UPDATE public.maintenance_record
    SET status = 'Scheduled'
    WHERE maintenance_date > current_date_value;
END;
$BODY$;
ALTER PROCEDURE public.update_maintenance_status()
    OWNER TO postgres;