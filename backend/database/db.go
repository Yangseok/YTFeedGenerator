package database

import (
	"context"

	"ytfeedgenerator/backend/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type DB struct {
	Gorm *gorm.DB
}

func Open(ctx context.Context, path string) (*DB, error) {
	_ = ctx

	gormDB, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	return &DB{Gorm: gormDB}, nil
}

func (db *DB) AutoMigrate() error {
	return db.Gorm.AutoMigrate(
		&models.AppSetting{},
		&models.Channel{},
		&models.Video{},
		&models.Tag{},
		&models.Template{},
		&models.Collection{},
		&models.CollectionVideo{},
	)
}
