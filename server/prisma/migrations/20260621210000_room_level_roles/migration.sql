-- Replace RoomParticipantRole enum: OWNER/MODERATOR/MEMBER -> OWNER/ROOM_ADMIN/ROOM_MODERATOR/MEMBER
-- Existing MODERATOR participants are migrated to ROOM_MODERATOR.

ALTER TYPE "RoomParticipantRole" RENAME TO "RoomParticipantRole_old";

CREATE TYPE "RoomParticipantRole" AS ENUM ('OWNER', 'ROOM_ADMIN', 'ROOM_MODERATOR', 'MEMBER');

ALTER TABLE "RoomParticipant" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "RoomParticipant"
  ALTER COLUMN "role" TYPE "RoomParticipantRole"
  USING (
    CASE "role"::text
      WHEN 'MODERATOR' THEN 'ROOM_MODERATOR'
      ELSE "role"::text
    END::"RoomParticipantRole"
  );

ALTER TABLE "RoomParticipant" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

DROP TYPE "RoomParticipantRole_old";
