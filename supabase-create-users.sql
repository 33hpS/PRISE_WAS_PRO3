-- Create test users for the system
-- Execute this AFTER the main auth fix script

-- Insert test users into auth.users (this might need to be done through Supabase Dashboard)
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Create these users manually:

/*
Admin User:
- Email: admin@wasser.com
- Password: admin123
- Auto Confirm User: YES

Manager User:  
- Email: manager@wasser.com
- Password: manager123
- Auto Confirm User: YES
*/

-- After creating users manually, run this to assign roles:
DO $$
DECLARE
    admin_id UUID;
    manager_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@wasser.com';
    
    -- Get manager user ID  
    SELECT id INTO manager_id FROM auth.users WHERE email = 'manager@wasser.com';
    
    -- Insert admin role
    IF admin_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role) 
        VALUES (admin_id, 'admin')
        ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
        RAISE NOTICE 'Admin role assigned to admin@wasser.com';
    ELSE
        RAISE NOTICE 'Admin user not found - create it in Authentication > Users first';
    END IF;
    
    -- Insert manager role
    IF manager_id IS NOT NULL THEN
        INSERT INTO user_roles (user_id, role) 
        VALUES (manager_id, 'manager')
        ON CONFLICT (user_id) DO UPDATE SET role = 'manager';
        RAISE NOTICE 'Manager role assigned to manager@wasser.com';
    ELSE
        RAISE NOTICE 'Manager user not found - create it in Authentication > Users first';
    END IF;
END $$;
