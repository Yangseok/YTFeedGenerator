package services

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v3/pkg/services/notifications"
)

type NotificationService struct {
	Notifier *notifications.NotificationService
}

func (s *NotificationService) Notify(ctx context.Context, title, message string) error {
	_ = ctx
	if s == nil || s.Notifier == nil {
		return nil
	}

	authorized, err := s.Notifier.CheckNotificationAuthorization()
	if err == nil && !authorized {
		authorized, err = s.Notifier.RequestNotificationAuthorization()
	}
	if err != nil || !authorized {
		return fmt.Errorf("notifications not authorized")
	}

	s.Notifier.SendNotification(notifications.NotificationOptions{
		ID:    "ytfeedgenerator",
		Title: title,
		Body:  message,
	})
	return nil
}
