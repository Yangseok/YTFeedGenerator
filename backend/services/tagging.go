package services

import "context"

type TaggingService struct{}

func (s *TaggingService) SuggestTags(ctx context.Context, text string) ([]string, error) {
	// TODO: Implement tagging logic
	_ = text
	return nil, nil
}
