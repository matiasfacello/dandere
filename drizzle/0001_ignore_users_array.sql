ALTER TABLE "guild" ALTER COLUMN "ignoreUsers" TYPE text[] USING
  CASE WHEN "ignoreUsers" IS NULL OR "ignoreUsers" = ''
    THEN NULL
    ELSE string_to_array("ignoreUsers", ',')
  END;
