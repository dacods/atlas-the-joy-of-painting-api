CREATE DATABASE IF NOT EXISTS 'joy-of-painting';

USE 'joy-of-painting';

CREATE TABLE IF NOT EXISTS 'episodes' (
    id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(256),
    color VARCHAR(256)
);

CREATE TABLE IF NOT EXISTS 'episode_color' (
    id INT NOT NULL,
    color_id VARCHAR(256),
);

CREATE TABLE IF NOT EXISTS 'color' (
    id INT NOT NULL AUTO_INCREMENT,
    episode_color VARCHAR(256),
);