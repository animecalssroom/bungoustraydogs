-- Migration: Yokohama Tactical War System Solidification (Phase 1)
-- Date: 2026-03-23

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'character_class_tag') THEN
        CREATE TYPE character_class_tag AS ENUM ('BRUTE', 'INTEL', 'SUPPORT', 'ANOMALY');
    END IF;
END $$;

-- 1. Characters Table Update
-- Using the 20-column schema from seed.sql to ensure compatibility
CREATE TABLE IF NOT EXISTS public.characters (
    id text PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    name_jp text,
    name_reading text,
    faction_id text NOT NULL,
    ability_name text,
    ability_name_jp text,
    ability_desc text,
    quote text,
    description text,
    author_note text,
    real_author text,
    real_author_years text,
    stat_power integer,
    stat_speed integer,
    stat_control integer,
    kanji_symbol text,
    role_id text,
    is_lore_locked boolean DEFAULT false,
    class_tag character_class_tag NOT NULL DEFAULT 'BRUTE',
    created_at timestamptz DEFAULT now()
);

-- Ensure all columns exist for existing tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'characters') THEN
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS class_tag character_class_tag DEFAULT 'BRUTE';
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS name_jp text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS name_reading text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS ability_name text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS ability_name_jp text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS ability_desc text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS quote text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS description text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS author_note text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS real_author text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS real_author_years text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS stat_power integer;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS stat_speed integer;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS stat_control integer;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS kanji_symbol text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS role_id text;
        ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS is_lore_locked boolean DEFAULT false;
    END IF;
END $$;

-- 2. User Characters Table (Operational State)
-- Tracks which users own which characters and their recovery status
CREATE TABLE IF NOT EXISTS public.user_characters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    character_id text NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
    recovery_until timestamptz DEFAULT NULL,
    is_equipped boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, character_id)
);

-- 3. Faction Wars Table (Solidification)
-- Updating the EXISTING faction_wars table to include new tactical fields
ALTER TABLE public.faction_wars ADD COLUMN IF NOT EXISTS integrity integer DEFAULT 50;

-- 4. Official Roster Mapping Seed
INSERT INTO public.characters (
  id, slug, name, name_jp, name_reading, faction_id, 
  ability_name, ability_name_jp, ability_desc, 
  quote, description, author_note, real_author, real_author_years, 
  stat_power, stat_speed, stat_control, kanji_symbol, role_id, 
  is_lore_locked, class_tag
) VALUES
('dazai-osamu', 'dazai-osamu', 'Osamu Dazai', '太宰治', 'だざいおさむ', 'agency', 'No Longer Human', '人間失格', 'Nullifies any ability with a single touch.', '"I want to die with a beautiful woman."', 'A former Port Mafia executive.', 'Based on Osamu Dazai.', 'Osamu Dazai', '1909-1948', 98, 72, 97, '無', 'strategist', false, 'ANOMALY'),
('nakajima-atsushi', 'nakajima-atsushi', 'Nakajima Atsushi', '中島敦', 'なかじまあつし', 'agency', 'Beast Beneath the Moonlight', '月下獣', 'Transforms into a white tiger.', '"I do not want to die."', 'The stray who stumbled into the Agency.', 'Based on Nakajima Atsushi.', 'Nakajima Atsushi', '1909-1942', 75, 82, 55, '虎', 'wildcard', false, 'BRUTE'),
('kunikida-doppo', 'kunikida-doppo', 'Doppo Kunikida', '国木田独歩', 'くにきだどっぽ', 'agency', 'Lone Poet', '独歩吟客', 'Manifests objects written in his notebook.', '"An ideal is not a dream."', 'The Agency moralist.', 'Based on Kunikida Doppo.', 'Kunikida Doppo', '1871-1908', 70, 75, 90, '詩', 'guardian', false, 'SUPPORT'),
('ranpo-edogawa', 'ranpo-edogawa', 'Ranpo Edogawa', '江戸川乱歩', 'えどがわらんぽ', 'agency', 'Ultra-Deduction', '超推理', 'Solves impossible cases through deduction.', '"There is no case I cannot close."', 'The sharpest mind in the Agency.', 'Based on Edogawa Ranpo.', 'Edogawa Ranpo', '1894-1965', 52, 64, 99, '推', 'strategist', false, 'INTEL'),
('akiko-yosano', 'akiko-yosano', 'Akiko Yosano', '与謝野晶子', 'よさのあきこ', 'agency', 'Thou Shalt Not Die', '君死給勿', 'Heals fatal wounds.', '"You will not die on my watch."', 'The Agency medic.', 'Based on Akiko Yosano.', 'Akiko Yosano', '1878-1942', 65, 58, 88, '蝶', 'guardian', false, 'SUPPORT'),
('nakahara-chuuya', 'nakahara-chuuya', 'Nakahara Chuuya', '中原中也', 'なかはらちゅうや', 'mafia', 'For the Tainted Sorrow', '汚れつちまつた悲しみに', 'Controls gravity itself.', '"Gravity is the one truth."', 'The Port Mafia powerhouse.', 'Based on Nakahara Chuuya.', 'Nakahara Chuuya', '1907-1937', 97, 96, 82, '重', 'berserker', false, 'BRUTE'),
('akutagawa-ryunosuke', 'akutagawa-ryunosuke', 'Akutagawa Ryunosuke', '芥川龍之介', 'あくたがわりゅうのすけ', 'mafia', 'Rashomon', '羅生門', 'A void-beast born from his coat.', '"Weak people have no right to live."', 'A file built from hunger and violence.', 'Based on Akutagawa Ryunosuke.', 'Akutagawa Ryunosuke', '1892-1927', 90, 88, 76, '羅', 'berserker', false, 'BRUTE'),
('mori-ogai', 'mori-ogai', 'Ougai Mori', '森鴎外', 'もりおうがい', 'mafia', 'Vita Sexualis', 'ヰタ・セクスアリス', 'Commands Elise.', '"The organization survives because sentiment loses."', 'The Port Mafia leader.', 'Based on Mori Ogai.', 'Mori Ogai', '1862-1922', 68, 58, 95, '森', 'strategist', false, 'SUPPORT'),
('ozaki-kouyou', 'ozaki-kouyou', 'Kouyou Ozaki', '尾崎紅葉', 'おざきこうよう', 'mafia', 'Golden Demon', '金色夜叉', 'A deadly blade-like phantom.', '"Mercy is expensive."', 'The Port Mafia elegance weaponized.', 'Based on Ozaki Koyo.', 'Ozaki Koyo', '1868-1903', 83, 71, 79, '金', 'guardian', false, 'BRUTE'),
('fitzgerald', 'fitzgerald', 'F. Scott Fitzgerald', 'フィッツジェラルド', 'ふぃっつじぇらるど', 'guild', 'The Great Fitzgerald', '華麗なるフィッツジェラルド', 'Wealth into physical power.', '"Everything I do, I do for my wife."', 'The Guild leader.', 'Based on F. Scott Fitzgerald.', 'F. Scott Fitzgerald', '1896-1940', 95, 78, 70, '富', 'sovereign', false, 'BRUTE'),
('edgar-allan-poe', 'edgar-allan-poe', 'Edgar Allan Poe', 'エドガー・アラン・ポオ', 'ぽお', 'guild', 'Black Cat in the Rue Morgue', '黒猫', 'Traps opponents inside mystery-novel space.', '"Every locked room can be opened."', 'The Guild puzzlemaster.', 'Based on Edgar Allan Poe.', 'Edgar Allan Poe', '1809-1849', 58, 62, 93, '謎', 'strategist', false, 'INTEL'),
('teruko-okura', 'teruko-okura', 'Teruko Okura', '大倉燁子', 'てるこ', 'hunting_dogs', 'Classified Ability', '機密指定', 'Classified.', '"Orders are not requests."', 'Tactical command file.', 'Based on Okura Teruko.', 'Okura Teruko', '1896-1966', 91, 74, 73, '令', 'berserker', false, 'BRUTE'),
('tetchou-suehiro', 'tetchou-suehiro', 'Tetchou Suehiro', '末広鐵腸', 'てっちょう', 'hunting_dogs', 'Plum Blossoms in Snow', '雪中梅', 'Adaptive bladed weapon.', '"Duty first."', 'Battlefield absurdity made lethal.', 'Based on Suehiro Tetchou.', 'Suehiro Tetchou', '1873-1896', 88, 80, 78, '刃', 'berserker', false, 'BRUTE'),
('jouno-saigiku', 'jouno-saigiku', 'Saigiku Jouno', '条野採菊', 'じょうの', 'hunting_dogs', 'Priceless Tears', '千金の涙', 'Perception distortion.', '"Mercy is a story."', 'Surgical instincts.', 'Based on Jono Saigiku.', 'Jono Saigiku', '1882-1944', 79, 86, 84, '涙', 'strategist', false, 'INTEL'),
('fukuchi-ouchi', 'fukuchi-ouchi', 'Ouchi Fukuchi', '福地桜痴', 'ふくち', 'hunting_dogs', 'Mirror Lion', '鏡獅子', 'War veteran with abnormal reach.', '"War rewrites possibility."', 'Command-level file.', 'Based on Fukuchi Ouchi.', 'Fukuchi Ouchi', '1841-1906', 93, 70, 88, '戦', 'sovereign', false, 'BRUTE'),
('ango-sakaguchi', 'ango-sakaguchi', 'Ango Sakaguchi', '坂口安吾', 'あんご', 'special_div', 'Discourse on Decadence', '堕落論', 'Memory extraction.', '"Records are cleaner than loyalty."', 'Intelligence agent.', 'Based on Ango Sakaguchi.', 'Ango Sakaguchi', '1906-1955', 42, 51, 96, '記', 'strategist', true, 'INTEL'),
('fyodor-dostoevsky', 'fyodor-dostoevsky', 'Fyodor Dostoevsky', 'フョードル・ドストエフスキー', 'ふょーどる', 'rats', 'Crime and Punishment', '罪と罰', 'Kill by touch.', '"God and I have an understanding."', 'Theological annihilation.', 'Based on Fyodor Dostoevsky.', 'Fyodor Dostoevsky', '1821-1881', 99, 60, 99, '罰', 'strategist', true, 'ANOMALY'),
('sigma', 'sigma', 'Sigma', 'シグマ', 'しぐま', 'decay', 'Information Exchange', '情報交換', 'Trade info by touch.', '"I only want a home."', 'Casino manager.', 'Based on Sigma.', 'Sigma', 'N/A', 50, 60, 80, '家', 'strategist', true, 'ANOMALY')
ON CONFLICT (id) DO UPDATE SET 
    class_tag = EXCLUDED.class_tag,
    faction_id = EXCLUDED.faction_id,
    name_jp = EXCLUDED.name_jp,
    name_reading = EXCLUDED.name_reading,
    ability_name_jp = EXCLUDED.ability_name_jp,
    ability_desc = EXCLUDED.ability_desc,
    quote = EXCLUDED.quote,
    description = EXCLUDED.description,
    author_note = EXCLUDED.author_note,
    real_author = EXCLUDED.real_author,
    real_author_years = EXCLUDED.real_author_years,
    stat_power = EXCLUDED.stat_power,
    stat_speed = EXCLUDED.stat_speed,
    stat_control = EXCLUDED.stat_control,
    kanji_symbol = EXCLUDED.kanji_symbol,
    role_id = EXCLUDED.role_id;

-- Index for combat lookups
CREATE INDEX IF NOT EXISTS idx_user_characters_recovery ON public.user_characters(recovery_until) WHERE recovery_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_faction_wars_active ON public.faction_wars(status) WHERE status != 'complete';
