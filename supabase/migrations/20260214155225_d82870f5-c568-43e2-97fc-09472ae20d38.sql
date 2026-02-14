
-- Add subscription_product_id column to profiles for storing tier overrides (e.g., Source grants)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_product_id TEXT DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.subscription_product_id IS 'Stores product/tier identifier for manually granted subscriptions (e.g., source_grant)';
