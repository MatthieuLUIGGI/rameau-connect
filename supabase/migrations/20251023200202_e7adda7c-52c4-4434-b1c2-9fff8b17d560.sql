-- Create function to aggregate poll results server-side
-- This prevents exposing individual voting patterns to the client
CREATE OR REPLACE FUNCTION public.get_poll_results(poll_id UUID)
RETURNS TABLE(option_index INTEGER, vote_count BIGINT, percentage INTEGER) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_votes BIGINT;
BEGIN
  -- Get total votes for this poll
  SELECT COUNT(*) INTO total_votes
  FROM votes
  WHERE sondage_id = poll_id;
  
  -- Return aggregated results with counts and percentages
  RETURN QUERY
  SELECT 
    v.option_index,
    COUNT(*) as vote_count,
    CASE 
      WHEN total_votes > 0 THEN ROUND((COUNT(*) * 100.0 / total_votes)::numeric, 0)::INTEGER
      ELSE 0
    END as percentage
  FROM votes v
  WHERE v.sondage_id = poll_id
  GROUP BY v.option_index
  ORDER BY v.option_index;
END;
$$;

-- Add RLS policy for the function (anyone authenticated can call it)
COMMENT ON FUNCTION public.get_poll_results IS 'Returns aggregated poll results without exposing individual votes';