-- Migration: District Territory Schema
-- Date: 2026-03-17

-- Update districts table with territorial control columns
ALTER TABLE districts 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS controlling_faction TEXT,
ADD COLUMN IF NOT EXISTS points_required INTEGER DEFAULT 10000,
ADD COLUMN IF NOT EXISTS current_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ap_pool INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_flip_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS coordinates JSONB; -- { "lat": ..., "lng": ... } for map pins

-- Update existing seeds with technical metadata
UPDATE districts SET 
    slug = 'kannai', 
    color = '#8b7d6b', 
    coordinates = '{"lat": 35.444, "lng": 139.638}' 
WHERE id = 'kannai';

UPDATE districts SET 
    slug = 'chinatown', 
    color = '#cc0000', 
    coordinates = '{"lat": 35.442, "lng": 139.645}' 
WHERE id = 'chinatown';

UPDATE districts SET 
    slug = 'harbor', 
    color = '#1a1a1a', 
    coordinates = '{"lat": 35.452, "lng": 139.654}' 
WHERE id = 'harbor';

UPDATE districts SET 
    slug = 'motomachi', 
    color = '#4b0082', 
    coordinates = '{"lat": 35.439, "lng": 139.649}' 
WHERE id = 'motomachi';

UPDATE districts SET 
    slug = 'honmoku', 
    color = '#556b2f', 
    coordinates = '{"lat": 35.424, "lng": 139.663}' 
WHERE id = 'honmoku';

UPDATE districts SET 
    slug = 'waterfront', 
    color = '#008b8b', 
    coordinates = '{"lat": 35.459, "lng": 139.632}' 
WHERE id = 'waterfront';

UPDATE districts SET 
    slug = 'tsurumi', 
    color = '#4682b4', 
    coordinates = '{"lat": 35.508, "lng": 139.676}' 
WHERE id = 'tsurumi';
