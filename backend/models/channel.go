package models

import "time"

type Channel struct {
	ID          uint   `gorm:"primaryKey"`
	ChannelID   string `gorm:"uniqueIndex"`
	Name        string
	URL         string
	Thumbnail   string
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}
