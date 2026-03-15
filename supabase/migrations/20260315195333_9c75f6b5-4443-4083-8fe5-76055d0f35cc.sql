UPDATE public.profiles 
SET 
  is_restricted = true,
  restriction_reason = 'Your account has been temporarily suspended for 7 days due to repeated Fair Usage Policy violations (Section 6). Excessive data consumption linked to your account has caused platform-wide service disruptions on multiple occasions. This action was taken after a prior warning was issued and acknowledged. Your subscription remains active — access will be restored on March 22, 2026. Contact support if you have questions.',
  restricted_at = now(),
  daily_message_override = 50,
  monthly_message_override = 1000
WHERE id = '5242bc3a-9a44-4ad9-ba01-0e83ad86e250';