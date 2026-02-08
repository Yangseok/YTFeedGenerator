package models

import "time"

type Collection struct {
	ID          uint `gorm:"primaryKey"`
	Name        string
	Description string
	Videos      []Video `gorm:"many2many:collection_videos;"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type CollectionVideo struct {
	CollectionID uint `gorm:"primaryKey"`
	VideoID      uint `gorm:"primaryKey"`
}
