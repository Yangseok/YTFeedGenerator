package models

import "time"

type Video struct {
	ID                    uint   `gorm:"primaryKey"`
	VideoID               string `gorm:"uniqueIndex"`
	Title                 string
	URL                   string
	ChannelID             uint
	Transcript            string
	TranscriptStatus      string
	TranscriptLastError   string
	TranscriptLastAttempt *time.Time
	Summary               string
	Thumbnail             string
	PublishedAt           time.Time
	Tags                  []Tag        `gorm:"many2many:video_tags;"`
	Collections           []Collection `gorm:"many2many:collection_videos;"`
	CreatedAt             time.Time
	UpdatedAt             time.Time
}
