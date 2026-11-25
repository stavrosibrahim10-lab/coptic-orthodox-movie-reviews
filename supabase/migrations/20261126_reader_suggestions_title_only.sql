-- Install after 20261125_reader_suggestions.sql.
alter table public.studio_suggestions
  drop constraint if exists studio_suggestions_details_check,
  add constraint studio_suggestions_details_check
    check (char_length(details) between 0 and 1800 and
      (kind = 'film_request' or char_length(details) >= 25));

notify pgrst, 'reload schema';
