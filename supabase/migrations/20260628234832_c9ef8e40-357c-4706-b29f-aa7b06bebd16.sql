
-- Wipe sanctuary social content for fresh launch.
-- Preserves: soul_profiles rows, follows, sanctuary_showcase_items, flame_public_cards, auth.users.
-- Resets: post/comment/blessing/echo/story content, and profile bio fields.

TRUNCATE TABLE
  public.community_posts,
  public.post_comments,
  public.post_blessings,
  public.post_reposts,
  public.post_hashtags,
  public.comment_blessings,
  public.profile_echoes,
  public.echo_comments,
  public.community_notifications,
  public.stories,
  public.story_views
CASCADE;

UPDATE public.soul_profiles SET
  soul_title = NULL,
  bio = NULL,
  spiritual_journey = NULL,
  gifts_and_talents = NULL,
  seeking = NULL,
  higher_self_description = NULL,
  lineage_type = NULL,
  lineage_name = NULL,
  updated_at = now();
