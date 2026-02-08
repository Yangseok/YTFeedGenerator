package models

import "time"

type Template struct {
	ID          uint   `gorm:"primaryKey"`
	Name        string `gorm:"uniqueIndex"`
	Description string
	Prompt      string
	Variables   string
	IsDefault   bool
	CreatedBy   string
	CreatedAt   time.Time
}
